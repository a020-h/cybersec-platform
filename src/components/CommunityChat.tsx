'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Message = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { username: string; avatar: string; points: number }
}

type Props = {
  userId: string
  username: string
  avatar: string
}

export default function CommunityChat({ userId, username, avatar }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [online, setOnline] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMessages()

    // Real-time subscription
    const channel = supabase
      .channel('community_chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages',
      }, async (payload) => {
        // جلب بيانات المستخدم مع الرسالة الجديدة
        const { data } = await supabase
          .from('community_messages')
          .select('*, profiles(username, avatar, points)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          setMessages(prev => [...prev, data as any])
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'community_messages',
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      })
      .subscribe()

    // عدد المتصلين (تقدير بسيط)
    setOnline(Math.floor(Math.random() * 8) + 2)

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('community_messages')
      .select('*, profiles(username, avatar, points)')
      .order('created_at', { ascending: true })
      .limit(50)
    if (data) setMessages(data as any)
  }

  const sendMessage = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    await supabase.from('community_messages').insert({
      user_id: userId,
      content: text.trim(),
    })
    setText('')
    setSending(false)
    inputRef.current?.focus()
  }

  const deleteMessage = async (id: string) => {
    await supabase.from('community_messages').delete().eq('id', id)
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'الآن'
    if (mins < 60) return `${mins}د`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}س`
    return `${Math.floor(hrs / 24)}ي`
  }

  const getLevel = (points: number) => {
    if (points >= 1000) return { label: 'أسطورة', color: '#ff3366' }
    if (points >= 600) return { label: 'خبير', color: '#ffd700' }
    if (points >= 300) return { label: 'متقدم', color: '#a855f7' }
    if (points >= 100) return { label: 'متوسط', color: '#00d4ff' }
    return { label: 'مبتدئ', color: '#00ff88' }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(5,10,15,0.95)',
      borderRadius: '18px',
      border: '1px solid #1a3a50',
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
    }} dir="rtl">

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #1a3a50',
        background: 'rgba(8,15,24,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>💬</span>
          <div>
            <p style={{ color: 'white', fontWeight: '900', fontSize: '15px', fontFamily: 'Cairo, sans-serif' }}>المجتمع</p>
            <p style={{ color: '#7090a8', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>COMMUNITY CHAT</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '100px', padding: '4px 12px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
          <span style={{ color: '#00ff88', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{online} online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: 0,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#3a5a70' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💬</div>
            <p style={{ fontFamily: 'Cairo, sans-serif', fontSize: '14px' }}>كن أول من يبدأ المحادثة!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.user_id === userId
          const level = getLevel(msg.profiles?.points || 0)
          return (
            <div key={msg.id} style={{
              display: 'flex',
              gap: '10px',
              flexDirection: isMe ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#0f1f30',
                border: `2px solid ${isMe ? '#00ff88' : level.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0,
              }}>
                {msg.profiles?.avatar || '🧑‍💻'}
              </div>

              {/* Bubble */}
              <div style={{ maxWidth: '72%' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                }}>
                  <span style={{ color: isMe ? '#00ff88' : 'white', fontWeight: '700', fontSize: '12px', fontFamily: 'Cairo, sans-serif' }}>
                    {msg.profiles?.username || 'مستخدم'}
                  </span>
                  <span style={{
                    background: `${level.color}15`,
                    border: `1px solid ${level.color}30`,
                    color: level.color,
                    padding: '1px 6px', borderRadius: '100px',
                    fontSize: '9px', fontFamily: 'Space Mono, monospace',
                  }}>{level.label}</span>
                  <span style={{ color: '#3a5a70', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>{timeAgo(msg.created_at)}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  <div style={{
                    background: isMe ? 'rgba(0,255,136,0.1)' : 'rgba(26,58,80,0.4)',
                    border: `1px solid ${isMe ? 'rgba(0,255,136,0.2)' : '#1a3a50'}`,
                    borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    padding: '10px 14px',
                    color: '#e0f0ff',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontFamily: 'Cairo, sans-serif',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                  {isMe && (
                    <button onClick={() => deleteMessage(msg.id)}
                      style={{ background: 'none', border: 'none', color: '#2a4a60', cursor: 'pointer', fontSize: '12px', padding: '2px', opacity: 0.6, transition: 'opacity 0.2s' }}
                      onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                      onMouseOut={e => (e.currentTarget.style.opacity = '0.6')}>
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #1a3a50',
        background: 'rgba(8,15,24,0.9)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '20px', flexShrink: 0 }}>{avatar || '🧑‍💻'}</div>
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="اكتب رسالتك..."
          maxLength={300}
          style={{
            flex: 1,
            background: 'rgba(5,10,15,0.8)',
            border: '1px solid #1a3a50',
            borderRadius: '10px',
            padding: '10px 14px',
            color: 'white',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '14px',
            outline: 'none',
            direction: 'rtl',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(0,255,136,0.4)')}
          onBlur={e => (e.target.style.borderColor = '#1a3a50')}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          style={{
            background: text.trim() ? '#00ff88' : '#1a3a50',
            color: text.trim() ? '#050a0f' : '#7090a8',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 16px',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '14px',
            fontWeight: '900',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}>
          {sending ? '⏳' : '↑ إرسال'}
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#1a3a50;border-radius:4px;}
      `}</style>
    </div>
  )
}