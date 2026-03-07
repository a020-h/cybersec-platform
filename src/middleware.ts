import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in-memory, resets on cold start)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const RATE_LIMIT = 5       // max attempts
const WINDOW_MS = 15 * 60 * 1000  // 15 minutes

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. ADMIN PROTECTION ─────────────────────────────────────────
  if (pathname.startsWith('/dashboard/admin')) {
    const token = request.cookies.get('sb-access-token')?.value
      || request.cookies.get('supabase-auth-token')?.value

    // Check for auth cookie — if missing, redirect to login
    const allCookies = request.cookies.getAll()
    const hasAuth = allCookies.some(c =>
      c.name.includes('supabase') || c.name.includes('sb-')
    )
    if (!hasAuth) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ── 2. RATE LIMITING on login API ───────────────────────────────
  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')
      || request.headers.get('x-real-ip')
      || 'unknown'

    const now = Date.now()
    const record = loginAttempts.get(ip)

    if (record) {
      // Reset window if expired
      if (now - record.lastAttempt > WINDOW_MS) {
        loginAttempts.set(ip, { count: 1, lastAttempt: now })
      } else if (record.count >= RATE_LIMIT) {
        const retryAfter = Math.ceil((WINDOW_MS - (now - record.lastAttempt)) / 1000)
        return new NextResponse(
          JSON.stringify({ error: 'Too many attempts. Try again later.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter),
            },
          }
        )
      } else {
        loginAttempts.set(ip, { count: record.count + 1, lastAttempt: now })
      }
    } else {
      loginAttempts.set(ip, { count: 1, lastAttempt: now })
    }
  }

  // ── 3. PROTECT DASHBOARD (must be logged in) ────────────────────
  if (pathname.startsWith('/dashboard')) {
    const allCookies = request.cookies.getAll()
    const hasAuth = allCookies.some(c =>
      c.name.includes('supabase') || c.name.includes('sb-')
    )
    if (!hasAuth) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  const response = NextResponse.next()

  // ── 4. SECURITY HEADERS ─────────────────────────────────────────
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/auth/:path*',
  ],
}