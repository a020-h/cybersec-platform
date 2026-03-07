'use client'
import { useEffect } from 'react'

/**
 * Prevents copying, text selection, and right-click
 * on paid/protected content.
 * Usage: call useCopyProtection() inside any protected page component.
 */
export function useCopyProtection(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const prevent = (e: Event) => e.preventDefault()

    // Block right-click context menu
    document.addEventListener('contextmenu', prevent)

    // Block keyboard shortcuts: Ctrl+C, Ctrl+A, Ctrl+U, Ctrl+S, F12
    const onKey = (e: KeyboardEvent) => {
      const blocked = (
        (e.ctrlKey && ['c','a','u','s','p'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase()))
      )
      if (blocked) e.preventDefault()
    }
    document.addEventListener('keydown', onKey)

    // Block text selection via CSS
    const style = document.createElement('style')
    style.id = '__copy-protect__'
    style.textContent = `
      .protected-content {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
    `
    document.head.appendChild(style)

    // Block drag
    document.addEventListener('dragstart', prevent)

    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('dragstart', prevent)
      document.getElementById('__copy-protect__')?.remove()
    }
  }, [enabled])
}