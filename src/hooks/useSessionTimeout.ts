'use client'
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const TIMEOUT_MS = 30 * 60 * 1000
const WARNING_MS = 25 * 60 * 1000

export function useSessionTimeout(
  onWarn?: () => void,
  onReset?: () => void
) {
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
    onWarn?.()
  }, [onWarn])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warnRef.current) clearTimeout(warnRef.current)
    warnShownRef.current = false
    onReset?.()
    warnRef.current = setTimeout(showWarning, WARNING_MS)
    timerRef.current = setTimeout(logout, TIMEOUT_MS)
  }, [logout, showWarning, onReset])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
      events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
      resetTimer()
      return () => {
        events.forEach(e => window.removeEventListener(e, resetTimer))
        if (timerRef.current) clearTimeout(timerRef.current)
        if (warnRef.current) clearTimeout(warnRef.current)
      }
    })
  }, [resetTimer])
}