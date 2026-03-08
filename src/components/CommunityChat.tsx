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

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🎯', '💯']

export default function CommunityChat({ userId, username, avatar }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [online, setOnline] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({})
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMessages()
    const channel = supabase
      .channel('community_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, async (payload) => {
        const { data } = await supabase
          .from('community_messages')
          .select('*, profiles(username, avatar, points)')
          .eq('id', payload.new.id)
          .single()
        if (data) setMessages(prev => [...prev, data as any])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_messages' }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      })
      .subscribe()
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
    await supabase.from('community_messages').insert({ user_id: userId, content: text.trim() })
    setText('')
    setSending(false)
    inputRef.current?.focus()
  }

  const deleteMessage = async (id: string) => {
    await supabase.from('community_messages').delete().eq('id', id)
  }

  const addReaction = (msgId: string, emoji: string) => {
    setReactions(prev => {
      const msgReactions = prev[msgId] || {}
      const emojiUsers = msgReactions[emoji] || []
      const alreadyReacted = emojiUsers.includes(userId)
      return {
        ...prev,
        [msgId]: {
          ...msgReactions,
          [emoji]: alreadyReacted ? emojiUsers.filter(u => u !== userId) : [...emojiUsers, userId]
        }
      }
    })
    setShowEmojiPicker(null)
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
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'rgba(5,10,15,0.97)', borderRadius:'18px', border:'1px solid #1a3a50', overflow:'hidden', backdropFilter:'blur(20px)' }} dir="rtl">

      {/* Header */}
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #1a3a50', background:'rgba(8,15,24,0.95)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>💬</div>
          <div>
            <p style={{ color:'white', fontWeight:'900', fontSize:'14px', fontFamily:'Cairo,sans-serif' }}>مجتمع المتعلمين</p>
            <p style={{ color:'#3a5a70', fontSize:'10px', fontFamily:'monospace' }}>COMMUNITY • {messages.length} رسالة</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(0,255,136,0.06)', border:'1px solid rgba(0,255,136,0.15)', borderRadius:'100px', padding:'4px 12px' }}>
          <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00ff88', boxShadow:'0 0 6px #00ff88', display:'inline-block', animation:'chatPulse 2s infinite' }}></span>
          <span style={{ color:'#00ff88', fontSize:'11px', fontFamily:'monospace' }}>{online} متصل</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px', minHeight:0 }}>
        {messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#3a5a70' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px', opacity:0.5 }}>💬</div>
            <p style={{ fontFamily:'Cairo,sans-serif', fontSize:'14px' }}>كن أول من يبدأ النقاش!</p>
            <p style={{ color:'#2a4a60', fontSize:'12px', marginTop:'6px' }}>شارك تجربتك مع المجتمع</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.user_id === userId
          const level = getLevel(msg.profiles?.points || 0)
          const msgReactions = reactions[msg.id] || {}
          const hasReactions = Object.values(msgReactions).some(users => users.length > 0)
          const isHovered = hoveredMsg === msg.id

          return (
            <div key={msg.id}
              onMouseEnter={() => setHoveredMsg(msg.id)}
              onMouseLeave={() => { setHoveredMsg(null); setShowEmojiPicker(null) }}
              style={{ display:'flex', gap:'10px', flexDirection:isMe?'row-reverse':'row', alignItems:'flex-start', position:'relative' }}>

              {/* Avatar */}
              <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'linear-gradient(135deg,#0f1f30,#0a1520)', border:`2px solid ${isMe?'#00ff88':'#1a3a50'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', flexShrink:0, boxShadow:isMe?'0 0 10px rgba(0,255,136,0.2)':'none' }}>
                {msg.profiles?.avatar || '🧑‍💻'}
              </div>

              <div style={{ maxWidth:'74%', position:'relative' }}>
                {/* Name + level */}
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px', flexDirection:isMe?'row-reverse':'row' }}>
                  <span style={{ color:isMe?'#00ff88':'#a0c0d8', fontWeight:'700', fontSize:'12px', fontFamily:'Cairo,sans-serif' }}>{msg.profiles?.username || 'مستخدم'}</span>
                  <span style={{ background:`${level.color}12`, border:`1px solid ${level.color}25`, color:level.color, padding:'1px 6px', borderRadius:'100px', fontSize:'9px', fontFamily:'monospace' }}>{level.label}</span>
                  <span style={{ color:'#2a4a60', fontSize:'10px', fontFamily:'monospace' }}>{timeAgo(msg.created_at)}</span>
                </div>

                {/* Bubble + actions */}
                <div style={{ display:'flex', alignItems:'center', gap:'6px', flexDirection:isMe?'row-reverse':'row' }}>
                  <div style={{ background:isMe?'rgba(0,255,136,0.08)':'rgba(15,31,48,0.8)', border:`1px solid ${isMe?'rgba(0,255,136,0.15)':'#1a3a50'}`, borderRadius:isMe?'14px 4px 14px 14px':'4px 14px 14px 14px', padding:'10px 14px', color:'#d0e8f8', fontSize:'14px', lineHeight:'1.65', fontFamily:'Cairo,sans-serif', wordBreak:'break-word', boxShadow:isMe?'0 4px 15px rgba(0,255,136,0.05)':'0 4px 15px rgba(0,0,0,0.2)' }}>
                    {msg.content}
                  </div>

                  {/* Action buttons on hover */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'4px', opacity:isHovered?1:0, transition:'opacity 0.2s' }}>
                    {/* Emoji picker trigger */}
                    <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                      style={{ background:'#0a1520', border:'1px solid #1a3a50', borderRadius:'8px', padding:'4px 8px', cursor:'pointer', fontSize:'12px', color:'#7090a8', transition:'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.borderColor='#00ff8844'}
                      onMouseOut={e => e.currentTarget.style.borderColor='#1a3a50'}>
                      😊
                    </button>
                    {isMe && (
                      <button onClick={() => deleteMessage(msg.id)}
                        style={{ background:'#0a1520', border:'1px solid #1a3a50', borderRadius:'8px', padding:'4px 8px', cursor:'pointer', fontSize:'11px', color:'#7090a8', transition:'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.borderColor='#ff336644'; e.currentTarget.style.color='#ff3366' }}
                        onMouseOut={e => { e.currentTarget.style.borderColor='#1a3a50'; e.currentTarget.style.color='#7090a8' }}>
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Emoji picker */}
                {showEmojiPicker === msg.id && (
                  <div style={{ position:'absolute', [isMe?'right':'left']:'100%', top:'0', background:'#0a1520', border:'1px solid #1a3a50', borderRadius:'12px', padding:'8px', display:'flex', gap:'6px', zIndex:50, boxShadow:'0 10px 30px rgba(0,0,0,0.5)', marginRight:isMe?'8px':'0', marginLeft:isMe?'0':'8px' }}>
                    {EMOJIS.map(emoji => {
                      const count = (msgReactions[emoji] || []).length
                      const reacted = (msgReactions[emoji] || []).includes(userId)
                      return (
                        <button key={emoji} onClick={() => addReaction(msg.id, emoji)}
                          style={{ background:reacted?'rgba(0,255,136,0.1)':'transparent', border:`1px solid ${reacted?'rgba(0,255,136,0.3)':'transparent'}`, borderRadius:'8px', padding:'4px 8px', cursor:'pointer', fontSize:'16px', transition:'all 0.15s', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                          {emoji}
                          {count > 0 && <span style={{ color:'#7090a8', fontSize:'9px', fontFamily:'monospace' }}>{count}</span>}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Reaction bubbles */}
                {hasReactions && (
                  <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginTop:'6px', flexDirection:isMe?'row-reverse':'row' }}>
                    {Object.entries(msgReactions).filter(([, users]) => users.length > 0).map(([emoji, users]) => (
                      <button key={emoji} onClick={() => addReaction(msg.id, emoji)}
                        style={{ background:users.includes(userId)?'rgba(0,255,136,0.1)':'rgba(26,58,80,0.4)', border:`1px solid ${users.includes(userId)?'rgba(0,255,136,0.25)':'#1a3a50'}`, borderRadius:'100px', padding:'2px 8px', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px', transition:'all 0.2s' }}>
                        {emoji}<span style={{ color:'#7090a8', fontSize:'11px', fontFamily:'monospace' }}>{users.length}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'12px 14px', borderTop:'1px solid #1a3a50', background:'rgba(8,15,24,0.95)', display:'flex', gap:'10px', alignItems:'center', flexShrink:0 }}>
        <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#0f1f30', border:'1px solid #00ff8844', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>{avatar || '🧑‍💻'}</div>
        <div style={{ flex:1, position:'relative' }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="شارك أفكارك مع المجتمع..."
            maxLength={300}
            style={{ width:'100%', background:'rgba(10,21,32,0.8)', border:'1px solid #1a3a50', borderRadius:'12px', padding:'10px 14px', color:'white', fontFamily:'Cairo,sans-serif', fontSize:'14px', outline:'none', direction:'rtl', transition:'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.35)'}
            onBlur={e => e.target.style.borderColor='#1a3a50'}
          />
          {text.length > 250 && (
            <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color: text.length > 290 ? '#ff3366' : '#5a7a90', fontSize:'10px', fontFamily:'monospace' }}>{text.length}/300</span>
          )}
        </div>
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          style={{ background:text.trim()?'#00ff88':'#1a3a50', color:text.trim()?'#050a0f':'#3a5a70', border:'none', borderRadius:'12px', padding:'10px 18px', fontFamily:'Cairo,sans-serif', fontSize:'14px', fontWeight:'900', cursor:text.trim()?'pointer':'not-allowed', transition:'all 0.2s', flexShrink:0, boxShadow:text.trim()?'0 0 15px rgba(0,255,136,0.3)':'none' }}>
          {sending ? '⏳' : '↑'}
        </button>
      </div>

      <style>{`
        @keyframes chatPulse { 0%,100%{opacity:1;box-shadow:0 0 6px #00ff88} 50%{opacity:0.4;box-shadow:0 0 2px #00ff88} }
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#1a3a50;border-radius:4px;}
      `}</style>
    </div>
  )
}