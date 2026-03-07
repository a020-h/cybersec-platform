'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { username: string; avatar: string }
}

type Props = {
  lessonId: string
  userId: string
  accentColor?: string
}

export default function LessonComments({ lessonId, userId, accentColor = '#00ff88' }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (lessonId && lessonId !== 'demo') fetchComments()
  }, [lessonId])

  const fetchComments = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('lesson_comments')
      .select('*, profiles(username, avatar)')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setComments(data as any)
    setLoading(false)
  }

  const postComment = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    const { data, error } = await supabase
      .from('lesson_comments')
      .insert({ lesson_id: lessonId, user_id: userId, content: text.trim() })
      .select('*, profiles(username, avatar)')
      .single()
    if (!error && data) {
      setComments(prev => [data as any, ...prev])
      setText('')
    }
    setPosting(false)
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
    <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #1a3a50' }} dir="rtl">
      <h3 style={{ color: accentColor, fontFamily: 'Space Mono, monospace', fontSize: '14px', letterSpacing: '1px', marginBottom: '20px' }}>
        // التعليقات {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Input */}
      <div style={{ marginBottom: '24px' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="اكتب تعليقك أو سؤالك..."
          rows={3}
          style={{
            width: '100%',
            background: '#0a1520',
            border: `1px solid ${text ? accentColor + '55' : '#1a3a50'}`,
            borderRadius: '12px',
            padding: '14px 16px',
            color: 'white',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '14px',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color 0.2s',
            direction: 'rtl',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={postComment}
            disabled={!text.trim() || posting}
            style={{
              background: text.trim() ? accentColor : '#1a3a50',
              color: text.trim() ? '#050a0f' : '#7090a8',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {posting ? (
              <><span style={{ width: '12px', height: '12px', border: '2px solid rgba(5,10,15,0.3)', borderTopColor: '#050a0f', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}></span> جاري...</>
            ) : '💬 إرسال'}
          </button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#7090a8', fontFamily: 'monospace', fontSize: '12px' }}>جاري التحميل...</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#7090a8' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
          <p style={{ fontFamily: 'Cairo, sans-serif', fontSize: '13px' }}>كن أول من يعلق!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comments.map(comment => (
            <div key={comment.id} style={{
              background: comment.user_id === userId ? `${accentColor}08` : 'rgba(10,21,32,0.6)',
              border: `1px solid ${comment.user_id === userId ? accentColor + '25' : '#1a3a50'}`,
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              gap: '12px',
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#0f1f30',
                border: `2px solid ${comment.user_id === userId ? accentColor + '55' : '#1a3a50'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}>
                {comment.profiles?.avatar || '🧑‍💻'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: comment.user_id === userId ? accentColor : '#a0c0d8', fontWeight: '700', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }}>
                    {comment.profiles?.username || 'مستخدم'}
                    {comment.user_id === userId && <span style={{ color: `${accentColor}80`, fontSize: '10px', fontFamily: 'Space Mono, monospace', marginRight: '6px' }}>(أنت)</span>}
                  </span>
                  <span style={{ color: '#2a4a60', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{timeAgo(comment.created_at)}</span>
                </div>
                <p style={{ color: '#a0c0d8', fontSize: '14px', lineHeight: '1.6', fontFamily: 'Cairo, sans-serif' }}>{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}