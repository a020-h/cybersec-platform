'use client'
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const TIMEOUT_MS = 30 * 60 * 1000  // 30 دقيقة خمول
const WARNING_MS = 25 * 60 * 1000  // تحذير بعد 25 دقيقة

export function useSessionTimeout() {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const warnRef = useRef<NodeJS.Timeout | null>(null)
  const warnShownRef = useRef(false)

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login?reason=timeout')
  }, [router])

  const showWarning = useCallback(() => {
    if (warnShownRef.current) return
    warnShownRef.current = true
    // Toast تحذير — سيُعرض في الصفحة إذا أضفت listener
    const event = new CustomEvent('session-warning', {
      detail: { message: '⚠️ سيتم تسجيل خروجك بعد 5 دقائق من عدم النشاط' }
    })
    window.dispatchEvent(event)
  }, [])

  const resetTimer = useCallback(() => {
    // إلغاء المؤقتات القديمة
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warnRef.current) clearTimeout(warnRef.current)
    warnShownRef.current = false

    // مؤقت التحذير
    warnRef.current = setTimeout(showWarning, WARNING_MS)
    // مؤقت تسجيل الخروج
    timerRef.current = setTimeout(logout, TIMEOUT_MS)
  }, [logout, showWarning])

  useEffect(() => {
    // تحقق من وجود session أولاً
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return

      // الأحداث التي تعتبر نشاطاً
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
      events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
      resetTimer() // ابدأ العداد

      return () => {
        events.forEach(e => window.removeEventListener(e, resetTimer))
        if (timerRef.current) clearTimeout(timerRef.current)
        if (warnRef.current) clearTimeout(warnRef.current)
      }
    })
  }, [resetTimer])
}