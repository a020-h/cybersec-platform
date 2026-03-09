'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',            icon: '🏠', label: 'الرئيسية'  },
  { href: '/dashboard/leaderboard',icon: '🏆', label: 'المتصدرين' },
  { href: '/dashboard/labs',       icon: '🧪', label: 'Labs'       },
  { href: '/dashboard/ctf',        icon: '🚩', label: 'CTF'        },
  { href: '/dashboard/profile',    icon: '👤', label: 'ملفي'       },
]

export default function BottomNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const touchStartX = useRef<number | null>(null)
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setVisible(y <= 10 || y < lastScrollY.current)
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Swipe left/right to navigate between pages
  useEffect(() => {
    const touchStartY = { current: 0 }

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return
      const diffX = touchStartX.current - e.changedTouches[0].clientX
      const diffY = Math.abs(touchStartY.current - e.changedTouches[0].clientY)

      // تجاهل السحب العمودي — فقط أفقي أكثر من عمودي
      if (diffY > Math.abs(diffX) || diffY > 30) {
        touchStartX.current = null
        return
      }

      const currentIdx = NAV_ITEMS.findIndex(n =>
        n.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.href)
      )

      if (Math.abs(diffX) > 80) {
        if (diffX > 0 && currentIdx < NAV_ITEMS.length - 1) {
          router.push(NAV_ITEMS[currentIdx + 1].href)
        } else if (diffX < 0 && currentIdx > 0) {
          router.push(NAV_ITEMS[currentIdx - 1].href)
        }
      }
      touchStartX.current = null
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [pathname, router])

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <>
      <style>{`
        .bottom-nav {
          display: none;
        }
        @media (max-width: 768px) {
          .bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 999;
            background: rgba(8, 16, 28, 0.97);
            border-top: 1px solid #1a3a50;
            backdrop-filter: blur(20px);
            padding: 8px 0 max(8px, env(safe-area-inset-bottom));
            transition: transform 0.3s ease;
          }
          .bottom-nav.hidden {
            transform: translateY(100%);
          }
          .nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            padding: 6px 4px;
            background: none;
            border: none;
            cursor: pointer;
            position: relative;
            transition: transform 0.15s ease;
          }
          .nav-item:active {
            transform: scale(0.92);
          }
          .nav-icon {
            font-size: 20px;
            transition: filter 0.2s;
            line-height: 1;
          }
          .nav-label {
            font-family: 'Cairo', sans-serif;
            font-size: 10px;
            font-weight: 700;
            transition: color 0.2s;
          }
          .nav-active-dot {
            position: absolute;
            top: 2px;
            width: 4px; height: 4px;
            background: #00ff88;
            border-radius: 50%;
            box-shadow: 0 0 6px rgba(0,255,136,0.8);
          }
          /* push page content above nav */
          .dashboard-content {
            padding-bottom: 72px !important;
          }
        }
      `}</style>

      <nav className={`bottom-nav ${visible ? '' : 'hidden'}`} dir="rtl">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <button
              key={item.href}
              className="nav-item"
              onClick={() => router.push(item.href)}
            >
              {active && <span className="nav-active-dot" />}
              <span className="nav-icon" style={{
                filter: active ? 'drop-shadow(0 0 6px rgba(0,255,136,0.7))' : 'none'
              }}>
                {item.icon}
              </span>
              <span className="nav-label" style={{
                color: active ? '#00ff88' : '#3a5a70'
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}