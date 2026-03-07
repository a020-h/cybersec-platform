'use client'
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const TIMEOUT_MS  = 30 * 60 * 1000  // 30 min idle → logout
const WARNING_MS  =  5 * 60 * 1000  // warn 5 min before
const EVENTS      = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

export function useSessionTimeout(
  onWarning?: () => void,
  onLogout?: () => void
) {
  const router     = useRouter()
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef  = useRef(true)

  const clearTimers = () => {
    if (timerRef.current)  clearTimeout(timerRef.current)
    if (warnRef.current)   clearTimeout(warnRef.current)
  }

  const logout = useCallback(async () => {
    if (!activeRef.current) return
    activeRef.current = false
    clearTimers()
    await supabase.auth.signOut()
    onLogout?.()
    router.push('/login?reason=timeout')
  }, [router, onLogout])

  const resetTimer = useCallback(() => {
    if (!activeRef.current) return
    clearTimers()

    // Warning timer
    warnRef.current = setTimeout(() => {
      onWarning?.()
    }, TIMEOUT_MS - WARNING_MS)

    // Logout timer
    timerRef.current = setTimeout(logout, TIMEOUT_MS)
  }, [logout, onWarning])

  useEffect(() => {
    activeRef.current = true
    resetTimer()

    EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))

    // Also watch Supabase auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearTimers()
      }
    })

    return () => {
      clearTimers()
      activeRef.current = false
      EVENTS.forEach(e => window.removeEventListener(e, resetTimer))
      subscription.unsubscribe()
    }
  }, [resetTimer])
}