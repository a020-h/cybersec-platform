'use client'
import { useEffect, useRef } from 'react'

export default function MatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // ✅ على الجوال — لا canvas لتوفير TBT كامل
    if (window.innerWidth < 768) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false }) // ✅ alpha:false أسرع
    if (!ctx) return

    let raf: number
    let drops: number[]

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const cols = Math.floor(canvas.width / 28)
      drops = Array(cols).fill(1)
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })

    const chars = '01アイウABCDEF'
    let frame = 0

    const draw = () => {
      frame++
      // ✅ frame % 4 بدل % 3 — أبطأ قليلاً = أقل ضغط
      if (frame % 4 === 0) {
        ctx.fillStyle = 'rgba(5,10,15,0.08)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.font = '13px monospace'
        drops.forEach((y, i) => {
          ctx.fillStyle = `rgba(0,255,136,${Math.random() * 0.3 + 0.05})`
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 28, y * 22)
          if (y * 22 > canvas.height && Math.random() > 0.975) drops[i] = 0
          drops[i]++
        })
      }
      raf = requestAnimationFrame(draw)
    }

    // ✅ ابدأ الـ canvas بعد ما الصفحة تتحمل (idle)
    let idleId: number
    if ('requestIdleCallback' in window) {
      idleId = requestIdleCallback(() => {
        raf = requestAnimationFrame(draw)
      }, { timeout: 2000 })
    } else {
      // fallback للـ Safari
      const t = setTimeout(() => { raf = requestAnimationFrame(draw) }, 1000)
      return () => {
        clearTimeout(t)
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', resize)
      }
    }

    return () => {
      cancelIdleCallback(idleId)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // ✅ على الجوال canvas مخفي تماماً من الـ DOM
  if (typeof window !== 'undefined' && window.innerWidth < 768) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.22, pointerEvents: 'none' }}
    />
  )
}