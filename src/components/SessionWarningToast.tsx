'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function SessionWarningToast() {
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(300) // 5 دقائق
  const router = useRouter()

  useEffect(() => {
    const handler = () => {
      setVisible(true)
      setCountdown(300)
    }
    window.addEventListener('session-warning', handler)
    return () => window.removeEventListener('session-warning', handler)
  }, [])

  useEffect(() => {
    if (!visible) return
    if (countdown <= 0) {
      supabase.auth.signOut().then(() => router.push('/login?reason=timeout'))
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [visible, countdown, router])

  const stayActive = () => {
    setVisible(false)
    // إعادة تشغيل المؤقت عبر حدث
    window.dispatchEvent(new MouseEvent('mousedown'))
  }

  if (!visible) return null

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60

  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, width: '100%', maxWidth: '380px', padding: '0 16px',
      animation: 'slideUp 0.3s ease'
    }}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>
      <div style={{
        background: 'rgba(8,16,28,0.98)', border: '1px solid rgba(255,193,7,0.35)',
        borderRadius: '16px', padding: '18px 20px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,193,7,0.1)'
      }} dir="rtl">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <p style={{ color: '#ffc107', fontSize: '14px', fontWeight: '700', fontFamily: 'Cairo, sans-serif' }}>
              انتهاء الجلسة قريباً
            </p>
            <p style={{ color: '#7090a8', fontSize: '12px', fontFamily: 'Cairo, sans-serif' }}>
              ستُسجَّل خروجك بعد:
              <strong style={{ color: 'white', fontFamily: 'Space Mono, monospace', marginRight: '6px' }}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </strong>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={stayActive} style={{
            flex: 1, background: '#00ff88', border: 'none', borderRadius: '10px',
            padding: '10px', color: '#050a0f', fontFamily: 'Cairo, sans-serif',
            fontSize: '13px', fontWeight: '900', cursor: 'pointer'
          }}>
            ✅ أنا هنا، استمر
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} style={{
            flex: 1, background: 'transparent', border: '1px solid rgba(255,51,102,0.3)',
            borderRadius: '10px', padding: '10px', color: '#ff6b6b',
            fontFamily: 'Cairo, sans-serif', fontSize: '13px', cursor: 'pointer'
          }}>
            🚪 تسجيل خروج
          </button>
        </div>
      </div>
    </div>
  )
}