'use client'
import { useState, useEffect } from 'react'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'

export default function SessionWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(300) // 5 min

  useSessionTimeout(
    () => { setShowWarning(true); setCountdown(300) },
    () => setShowWarning(false)
  )

  useEffect(() => {
    if (!showWarning) return
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showWarning])

  if (!showWarning) return null

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60

  return (
    <>
      <style>{`
        @keyframes slideInTop {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .session-warn {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 9999;
          background: linear-gradient(135deg, rgba(255,107,53,0.95), rgba(255,51,102,0.95));
          backdrop-filter: blur(12px);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          animation: slideInTop 0.4s ease;
          border-bottom: 1px solid rgba(255,107,53,0.4);
          font-family: 'Cairo', sans-serif;
          direction: rtl;
        }
        .session-warn-btn {
          background: white;
          color: #ff3366;
          border: none;
          border-radius: 8px;
          padding: 7px 16px;
          font-family: 'Cairo', sans-serif;
          font-weight: 900;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s;
        }
        .session-warn-btn:hover { opacity: 0.85; }
      `}</style>

      <div className="session-warn">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <p style={{ color: 'white', fontWeight: '900', fontSize: '14px', margin: 0 }}>
              ستنتهي جلستك قريباً
            </p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', margin: 0 }}>
              سيتم تسجيل خروجك تلقائياً خلال{' '}
              <strong>{mins}:{String(secs).padStart(2,'0')}</strong>
            </p>
          </div>
        </div>
        <button
          className="session-warn-btn"
          onClick={() => {
            // Any user action resets the timer via the hook's event listeners
            setShowWarning(false)
          }}
        >
          ابق متصلاً
        </button>
      </div>
    </>
  )
}