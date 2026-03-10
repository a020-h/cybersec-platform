'use client'
import { useEffect, useRef } from 'react'

export default function MatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    const cols = Math.floor(canvas.width / 28)
    const drops: number[] = Array(cols).fill(1)
    const chars = '01アイウABCDEF'
    let frame = 0

    const draw = () => {
      frame++
      if (frame % 3 === 0) {
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
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.22, pointerEvents: 'none' }}
    />
  )
}