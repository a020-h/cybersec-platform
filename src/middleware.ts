import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── In-memory stores (reset on cold start — sufficient for edge protection) ──
const loginAttempts = new Map<string, { count: number; firstAttempt: number; blocked: boolean }>()
const suspiciousIPs = new Set<string>()
const requestCounts = new Map<string, { count: number; window: number }>()

// ── Config ────────────────────────────────────────────────────────────────────
const LOGIN_MAX_ATTEMPTS = 5          // max login tries
const LOGIN_WINDOW_MS    = 15 * 60 * 1000  // 15 minutes
const LOGIN_BLOCK_MS     = 30 * 60 * 1000  // 30 min block after exceeding
const GLOBAL_RATE_LIMIT  = 100        // requests per minute per IP
const GLOBAL_WINDOW_MS   = 60 * 1000  // 1 minute

// ── Helpers ───────────────────────────────────────────────────────────────────
function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  )
}

function isSuspiciousPath(pathname: string): boolean {
  const badPaths = [
    '/wp-admin', '/wp-login', '/phpmyadmin', '/.env',
    '/admin.php', '/config.php', '/../', '/etc/passwd',
    '/.git', '/xmlrpc.php', '/shell', '/cmd', '/eval',
    '/api/v1/admin', '/__proto__', '/constructor',
  ]
  return badPaths.some(p => pathname.toLowerCase().includes(p))
}

function isSuspiciousUA(ua: string | null): boolean {
  if (!ua) return true
  const badUAs = [
    'sqlmap', 'nikto', 'nessus', 'masscan', 'zgrab',
    'python-requests/2', 'curl/', 'wget/', 'scrapy',
    'libwww-perl', 'dirbuster', 'gobuster', 'burpsuite',
    'nmap', 'hydra', 'medusa', 'metasploit',
  ]
  return badUAs.some(b => ua.toLowerCase().includes(b))
}

function sanitizeInput(value: string): boolean {
  // Detect SQL injection patterns
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /union.*select/i, /select.*from/i, /drop.*table/i,
    /insert.*into/i, /delete.*from/i, /update.*set/i,
  ]
  // Detect XSS patterns
  const xssPatterns = [
    /<script/i, /javascript:/i, /on\w+\s*=/i,
    /<iframe/i, /<object/i, /<embed/i,
    /eval\s*\(/i, /expression\s*\(/i,
  ]
  return [...sqlPatterns, ...xssPatterns].some(p => p.test(value))
}

function securityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  // Remove fingerprinting headers
  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')
  return response
}

function blockResponse(reason: string, status = 403): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: reason }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Frame-Options': 'DENY',
      },
    }
  )
}

// ── Main Middleware ───────────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getIP(request)
  const ua = request.headers.get('user-agent')
  const now = Date.now()

  // ── 1. BLOCK SUSPICIOUS IPs ──────────────────────────────────────────────
  if (suspiciousIPs.has(ip)) {
    return blockResponse('Access denied', 403)
  }

  // ── 2. BLOCK MALICIOUS USER AGENTS ───────────────────────────────────────
  if (isSuspiciousUA(ua)) {
    suspiciousIPs.add(ip)
    return blockResponse('Forbidden', 403)
  }

  // ── 3. BLOCK SUSPICIOUS PATHS (scanners, exploits) ───────────────────────
  if (isSuspiciousPath(pathname)) {
    suspiciousIPs.add(ip)
    console.warn(`[SECURITY] Suspicious path blocked: ${ip} → ${pathname}`)
    return blockResponse('Not found', 404)
  }

  // ── 4. DETECT SQL INJECTION / XSS IN URL ─────────────────────────────────
  const fullUrl = request.url
  if (sanitizeInput(fullUrl)) {
    suspiciousIPs.add(ip)
    console.warn(`[SECURITY] Injection attempt blocked: ${ip} → ${fullUrl}`)
    return blockResponse('Bad request', 400)
  }

  // ── 5. GLOBAL RATE LIMITING (per IP) ─────────────────────────────────────
  const reqRecord = requestCounts.get(ip)
  if (reqRecord) {
    if (now - reqRecord.window > GLOBAL_WINDOW_MS) {
      requestCounts.set(ip, { count: 1, window: now })
    } else {
      reqRecord.count++
      if (reqRecord.count > GLOBAL_RATE_LIMIT) {
        console.warn(`[SECURITY] Rate limit exceeded: ${ip}`)
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests. Slow down.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
              'X-RateLimit-Limit': String(GLOBAL_RATE_LIMIT),
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      }
    }
  } else {
    requestCounts.set(ip, { count: 1, window: now })
  }

  // ── 6. LOGIN RATE LIMITING (brute force protection) ──────────────────────
  if (
    (pathname === '/login' || pathname === '/api/auth/login') &&
    request.method === 'POST'
  ) {
    const record = loginAttempts.get(ip)

    if (record?.blocked) {
      const elapsed = now - record.firstAttempt
      if (elapsed < LOGIN_BLOCK_MS) {
        const retryAfter = Math.ceil((LOGIN_BLOCK_MS - elapsed) / 1000)
        return new NextResponse(
          JSON.stringify({ error: `حساب محظور مؤقتاً. حاول بعد ${Math.ceil(retryAfter / 60)} دقيقة.` }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter),
            },
          }
        )
      } else {
        // Unblock after window
        loginAttempts.delete(ip)
      }
    }

    if (record) {
      if (now - record.firstAttempt > LOGIN_WINDOW_MS) {
        loginAttempts.set(ip, { count: 1, firstAttempt: now, blocked: false })
      } else {
        record.count++
        if (record.count >= LOGIN_MAX_ATTEMPTS) {
          record.blocked = true
          console.warn(`[SECURITY] Brute force blocked: ${ip} after ${record.count} attempts`)
          return new NextResponse(
            JSON.stringify({ error: 'محاولات كثيرة — تم الحظر مؤقتاً لمدة 30 دقيقة.' }),
            { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '1800' } }
          )
        }
      }
    } else {
      loginAttempts.set(ip, { count: 1, firstAttempt: now, blocked: false })
    }
  }

  // ── 7. PROTECT /dashboard (must be logged in) ────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const allCookies = request.cookies.getAll()
    const hasAuth = allCookies.some(c =>
      c.name.includes('supabase') || c.name.startsWith('sb-')
    )
    if (!hasAuth) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── 8. PROTECT /dashboard/admin ──────────────────────────────────────────
  // Note: Full admin check (is_admin) is done server-side in the page itself
  // Middleware only checks for auth cookie presence
  if (pathname.startsWith('/dashboard/admin')) {
    const allCookies = request.cookies.getAll()
    const hasAuth = allCookies.some(c =>
      c.name.includes('supabase') || c.name.startsWith('sb-')
    )
    if (!hasAuth) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ── 9. BLOCK DIRECT API ACCESS WITHOUT ORIGIN ────────────────────────────
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    // Allow same-origin and Vercel preview URLs
    if (origin && host && !origin.includes(host) && !origin.includes('vercel.app')) {
      return blockResponse('Cross-origin requests not allowed', 403)
    }
  }

  // ── 10. PREVENT LARGE PAYLOADS ───────────────────────────────────────────
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 1_000_000) { // 1MB limit
    return blockResponse('Payload too large', 413)
  }

  // ── Apply security headers to all responses ───────────────────────────────
  const response = NextResponse.next()
  return securityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}