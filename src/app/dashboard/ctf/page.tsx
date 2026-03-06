'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  points: number
  hint: string
  active_date: string
  solved?: boolean
}

export default function CTFPage() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [selected, setSelected] = useState<Challenge | null>(null)
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'|'info'} | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)

      const today = new Date().toISOString().split('T')[0]
      const { data: chals } = await supabase
        .from('ctf_challenges')
        .select('*')
        .lte('active_date', today)
        .order('active_date', { ascending: false })

      const { data: solves } = await supabase
        .from('ctf_solves')
        .select('challenge_id')
        .eq('user_id', user.id)

      const solvedIds = new Set(solves?.map(s => s.challenge_id))
      const withSolved = (chals || []).map(c => ({ ...c, solved: solvedIds.has(c.id) }))
      setChallenges(withSolved)
      setLoading(false)
    }
    init()
  }, [])

  const submitFlag = async () => {
    if (!selected || !userId || !flag.trim()) return
    setSubmitting(true)

    const { data: chal } = await supabase
      .from('ctf_challenges')
      .select('flag')
      .eq('id', selected.id)
      .single()

    if (chal?.flag?.toLowerCase().trim() === flag.toLowerCase().trim()) {
      await supabase.from('ctf_solves').insert({ user_id: userId, challenge_id: selected.id })
      
      // أضف نقاط للمستخدم
      const { data: prog } = await supabase
        .from('user_progress')
        .select('points')
        .eq('user_id', userId)
        .single()
      
      if (prog) {
        await supabase.from('user_progress')
          .update({ points: (prog.points || 0) + selected.points })
          .eq('user_id', userId)
      }

      setMessage({ text: `🎉 صحيح! +${selected.points} نقطة`, type: 'success' })
      setChallenges(prev => prev.map(c => c.id === selected.id ? {...c, solved: true} : c))
      setSelected(prev => prev ? {...prev, solved: true} : null)
    } else {
      setMessage({ text: '❌ إجابة خاطئة، حاول مجدداً!', type: 'error' })
    }
    setFlag('')
    setSubmitting(false)
  }

  const diffColor: Record<string, string> = {
    'سهل': '#00ff88',
    'متوسط': '#00d4ff',
    'صعب': '#ff6b35'
  }

  const catIcon: Record<string, string> = {
    'تشفير': '🔐',
    'شبكات': '🌐',
    'هندسة اجتماعية': '🎭',
    'اختبار اختراق': '💻',
    'تحليل البرمجيات الخبيثة': '🦠'
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#0a0e1a', color:'#00ff88', fontFamily:'monospace', fontSize:'20px' }}>
      جاري تحميل التحديات...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', color:'#e0e0e0', fontFamily:'monospace', padding:'20px' }}>
      {/* Header */}
      <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ background:'transparent', border:'1px solid #1e3a5f', color:'#00d4ff', padding:'8px 16px', borderRadius:'6px', cursor:'pointer', marginBottom:'20px' }}>
          ← العودة للداشبورد
        </button>

        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <h1 style={{ fontSize:'32px', color:'#00ff88', margin:'0 0 8px' }}>🎯 تحديات CTF</h1>
          <p style={{ color:'#8892b0', margin:0 }}>Capture The Flag — حل التحديات واكسب النقاط</p>
          <div style={{ marginTop:'12px', display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
            <span style={{ color:'#00ff88' }}>✅ محلول: {challenges.filter(c=>c.solved).length}</span>
            <span style={{ color:'#00d4ff' }}>📋 المتاح: {challenges.length}</span>
            <span style={{ color:'#ffd700' }}>⭐ النقاط: {challenges.filter(c=>c.solved).reduce((s,c)=>s+c.points,0)}</span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap:'16px' }}>
          {/* قائمة التحديات */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {challenges.map(c => (
              <div key={c.id} onClick={() => { setSelected(c); setFlag(''); setMessage(null); setShowHint(false) }}
                style={{
                  background: selected?.id === c.id ? '#0d2137' : '#0d1b2e',
                  border: `1px solid ${selected?.id === c.id ? '#00d4ff' : c.solved ? '#00ff8840' : '#1e3a5f'}`,
                  borderRadius:'10px', padding:'16px', cursor:'pointer',
                  transition:'all 0.2s',
                  opacity: c.solved ? 0.75 : 1
                }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'15px', fontWeight:'bold', color: c.solved ? '#00ff88' : '#e0e0e0' }}>
                    {catIcon[c.category] || '🔒'} {c.title}
                    {c.solved && ' ✅'}
                  </span>
                  <span style={{ color:'#ffd700', fontSize:'13px' }}>+{c.points}pts</span>
                </div>
                <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
                  <span style={{ background:'#1a3a50', padding:'2px 8px', borderRadius:'4px', fontSize:'12px', color: diffColor[c.difficulty] || '#fff' }}>
                    {c.difficulty}
                  </span>
                  <span style={{ background:'#1a3a50', padding:'2px 8px', borderRadius:'4px', fontSize:'12px', color:'#8892b0' }}>
                    {c.category}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* تفاصيل التحدي */}
          {selected && (
            <div style={{ background:'#0d1b2e', border:'1px solid #1e3a5f', borderRadius:'12px', padding:'24px', height:'fit-content', position:'sticky', top:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
                <h2 style={{ color:'#00ff88', margin:0, fontSize:'20px' }}>{selected.title}</h2>
                <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', color:'#8892b0', cursor:'pointer', fontSize:'20px' }}>✕</button>
              </div>

              <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
                <span style={{ background:'#1a3a50', padding:'3px 10px', borderRadius:'4px', color: diffColor[selected.difficulty], fontSize:'13px' }}>{selected.difficulty}</span>
                <span style={{ background:'#1a3a50', padding:'3px 10px', borderRadius:'4px', color:'#8892b0', fontSize:'13px' }}>{selected.category}</span>
                <span style={{ background:'#1a3a50', padding:'3px 10px', borderRadius:'4px', color:'#ffd700', fontSize:'13px' }}>+{selected.points} نقطة</span>
              </div>

              <div style={{ background:'#070d1a', border:'1px solid #1e3a5f', borderRadius:'8px', padding:'16px', marginBottom:'16px', lineHeight:'1.8', whiteSpace:'pre-wrap', fontSize:'14px' }}>
                {selected.description}
              </div>

              {selected.solved ? (
                <div style={{ textAlign:'center', padding:'20px', color:'#00ff88', fontSize:'18px' }}>
                  ✅ لقد حللت هذا التحدي!
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:'12px' }}>
                    <input
                      value={flag}
                      onChange={e => setFlag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitFlag()}
                      placeholder="أدخل الإجابة هنا..."
                      style={{ width:'100%', background:'#070d1a', border:'1px solid #1e3a5f', borderRadius:'6px', padding:'10px 14px', color:'#e0e0e0', fontFamily:'monospace', fontSize:'14px', boxSizing:'border-box' }}
                    />
                  </div>

                  <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                    <button onClick={submitFlag} disabled={submitting}
                      style={{ flex:1, background:'#00ff88', color:'#000', border:'none', padding:'10px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'14px' }}>
                      {submitting ? 'جاري التحقق...' : '🚩 تحقق من الإجابة'}
                    </button>
                    <button onClick={() => setShowHint(!showHint)}
                      style={{ background:'transparent', border:'1px solid #ffd700', color:'#ffd700', padding:'10px 14px', borderRadius:'6px', cursor:'pointer' }}>
                      💡
                    </button>
                  </div>

                  {showHint && (
                    <div style={{ background:'#1a2a10', border:'1px solid #ffd70040', borderRadius:'6px', padding:'12px', color:'#ffd700', fontSize:'13px', marginBottom:'12px' }}>
                      💡 {selected.hint}
                    </div>
                  )}

                  {message && (
                    <div style={{ background: message.type === 'success' ? '#0a2a1a' : '#2a0a0a', border:`1px solid ${message.type === 'success' ? '#00ff8840' : '#ff000040'}`, borderRadius:'6px', padding:'12px', color: message.type === 'success' ? '#00ff88' : '#ff6b6b', textAlign:'center', fontSize:'15px' }}>
                      {message.text}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}