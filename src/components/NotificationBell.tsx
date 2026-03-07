'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Notification = {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    fetchNotifications()
    // Close on outside click
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userId])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifications(data)
  }

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const typeIcon = (type: string) => {
    if (type === 'badge') return '🏅'
    if (type === 'level') return '⬆️'
    if (type === 'course') return '🎓'
    return '🔔'
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'الآن'
    if (mins < 60) return `${mins} دقيقة`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} ساعة`
    return `${Math.floor(hrs / 24)} يوم`
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead() }}
        style={{
          position: 'relative',
          background: unread > 0 ? 'rgba(0,212,255,0.1)' : 'rgba(26,58,80,0.4)',
          border: `1px solid ${unread > 0 ? 'rgba(0,212,255,0.35)' : '#1a3a5088'}`,
          borderRadius: '100px',
          padding: '7px 14px',
          cursor: 'pointer',
          color: unread > 0 ? '#00d4ff' : '#a0c0d8',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.2)')}
        onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        🔔
        {unread > 0 && (
          <span style={{
            background: '#ff3366',
            color: 'white',
            borderRadius: '100px',
            fontSize: '10px',
            fontFamily: 'Space Mono, monospace',
            fontWeight: '700',
            padding: '1px 6px',
            minWidth: '18px',
            textAlign: 'center',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '44px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '320px',
          background: 'rgba(8,15,24,0.98)',
          border: '1px solid #1a3a50',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          zIndex: 999,
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          animation: 'fadeDown 0.2s ease',
        }} dir="rtl">
          <style>{`@keyframes fadeDown{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a3a50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#00d4ff', fontFamily: 'Space Mono, monospace', fontSize: '12px', letterSpacing: '1px' }}>// الإشعارات</span>
            {unread > 0 && (
              <button onClick={markAllRead}
                style={{ background: 'none', border: 'none', color: '#7090a8', fontSize: '11px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔕</div>
                <p style={{ color: '#7090a8', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }}>لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #0f1f3044',
                  background: notif.read ? 'transparent' : 'rgba(0,212,255,0.04)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{typeIcon(notif.type)}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: notif.read ? '#7090a8' : 'white', fontSize: '13px', fontWeight: notif.read ? '400' : '700', marginBottom: '3px', fontFamily: 'Cairo, sans-serif' }}>
                      {notif.title}
                    </p>
                    {notif.message && (
                      <p style={{ color: '#4a6a80', fontSize: '12px', lineHeight: '1.4', fontFamily: 'Cairo, sans-serif' }}>{notif.message}</p>
                    )}
                    <p style={{ color: '#2a4a60', fontSize: '10px', marginTop: '4px', fontFamily: 'Space Mono, monospace' }}>{timeAgo(notif.created_at)}</p>
                  </div>
                  {!notif.read && (
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00d4ff', flexShrink: 0, marginTop: '4px', boxShadow: '0 0 6px #00d4ff' }}></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}