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
  const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null)
  const [selected, setSelected] = useState<Challenge | null>(null)
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      const diff = tomorrow.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
      setCountdown(`${h}:${m}:${s}`)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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
      
      const todayC = withSolved.find(c => c.active_date === today) || withSolved[0] || null
      setTodayChallenge(todayC)
      setChallenges(withSolved)
      setLoading(false)
    }
    init()
  }, [])

  const submitFlag = async (challenge: Challenge) => {
    if (!userId || !flag.trim()) return
    setSubmitting(true)

    const { data: chal } = await supabase
      .from('ctf_challenges')
      .select('flag')
      .eq('id', challenge.id)
      .single()

    if (chal?.flag?.toLowerCase().trim() === flag.toLowerCase().trim()) {
      await supabase.from('ctf_solves').insert({ user_id: userId, challenge_id: challenge.id })

      const { data: prog } = await supabase
        .from('user_progress')
        .select('points')
        .eq('user_id', userId)
        .single()

      if (prog) {
        await supabase.from('user_progress')
          .update({ points: (prog.points || 0) + challenge.points })
          .eq('user_id', userId)
      }

      setMessage({ text: `🎉 صحيح! ربحت ${challenge.points} نقطة`, type: 'success' })
      const update = (c: Challenge) => c.id === challenge.id ? {...c, solved: true} : c
      setChallenges(prev => prev.map(update))
      setTodayChallenge(prev => prev?.id === challenge.id ? {...prev, solved: true} : prev)
      setSelected(prev => prev?.id === challenge.id ? {...prev, solved: true} : prev)
    } else {
      setMessage({ text: '❌ إجابة خاطئة، حاول مجدداً!', type: 'error' })
    }
    setFlag('')
    setSubmitting(false)
  }

  const diffColor: Record<string, string> = { 'سهل': '#00ff88', 'متوسط': '#00d4ff', 'صعب': '#ff6b35' }
  const catIcon: Record<string, string> = {
    'تشفير': '🔐', 'شبكات': '🌐', 'هندسة اجتماعية': '🎭',
    'اختبار اختراق': '💻', 'تحليل البرمجيات الخبيثة': '🦠'
  }

  const ChallengePanel = ({ c }: { c: Challenge }) => (
    <div style={{ background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ color: '#00ff88', margin: 0, fontSize: '18px' }}>{c.title}</h2>
        {selected && <button onClick={() => { setSelected(null); setMessage(null); setShowHint(false) }}
          style={{ background: 'transparent', border: 'none', color: '#8892b0', cursor: 'pointer', fontSize: '20px' }}>✕</button>}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ background: '#1a3a50', padding: '3px 10px', borderRadius: '4px', color: diffColor[c.difficulty], fontSize: '12px' }}>{c.difficulty}</span>
        <span style={{ background: '#1a3a50', padding: '3px 10px', borderRadius: '4px', color: '#8892b0', fontSize: '12px' }}>{c.category}</span>
        <span style={{ background: '#1a3a50', padding: '3px 10px', borderRadius: '4px', color: '#ffd700', fontSize: '12px' }}>+{c.points} نقطة</span>
      </div>
      <div style={{ background: '#070d1a', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '16px', marginBottom: '16px', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontSize: '14px', color: '#ccd6f6' }}>
        {c.description}
      </div>
      {c.solved ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#00ff88', fontSize: '18px', background: '#0a2a1a', borderRadius: '8px' }}>
          ✅ أحسنت! لقد حللت هذا التحدي
        </div>
      ) : (
        <>
          <input value={flag} onChange={e => setFlag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitFlag(c)}
            placeholder="أدخل الإجابة هنا..."
            style={{ width: '100%', background: '#070d1a', border: '1px solid #1e3a5f', borderRadius: '6px', padding: '10px 14px', color: '#e0e0e0', fontFamily: 'monospace', fontSize: '14px', boxSizing: 'border-box', marginBottom: '10px' }} />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button onClick={() => submitFlag(c)} disabled={submitting}
              style={{ flex: 1, background: '#00ff88', color: '#000', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
              {submitting ? 'جاري التحقق...' : '🚩 تحقق من الإجابة'}
            </button>
            <button onClick={() => setShowHint(!showHint)}
              style={{ background: 'transparent', border: '1px solid #ffd700', color: '#ffd700', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer' }}>
              💡
            </button>
          </div>
          {showHint && (
            <div style={{ background: '#1a2a10', border: '1px solid #ffd70040', borderRadius: '6px', padding: '12px', color: '#ffd700', fontSize: '13px', marginBottom: '10px' }}>
              💡 {c.hint}
            </div>
          )}
          {message && (
            <div style={{ background: message.type === 'success' ? '#0a2a1a' : '#2a0a0a', border: `1px solid ${message.type === 'success' ? '#00ff8840' : '#ff000040'}`, borderRadius: '6px', padding: '12px', color: message.type === 'success' ? '#00ff88' : '#ff6b6b', textAlign: 'center' }}>
              {message.text}
            </div>
          )}
        </>
      )}
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0e1a', color: '#00ff88', fontFamily: 'monospace', fontSize: '20px' }}>
      جاري تحميل التحديات...
    </div>
  )

  const totalPoints = challenges.filter(c => c.solved).reduce((s, c) => s + c.points, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e0e0e0', fontFamily: 'monospace', padding: '20px' }} dir="rtl">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: '1px solid #1e3a5f', color: '#00d4ff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px' }}>
          ← العودة للداشبورد
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', color: '#00ff88', margin: '0 0 8px' }}>🎯 تحديات CTF</h1>
          <p style={{ color: '#8892b0', margin: '0 0 16px' }}>Capture The Flag — حل التحديات واكسب النقاط</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{ color: '#00ff88' }}>✅ محلول: {challenges.filter(c => c.solved).length}/{challenges.length}</span>
            <span style={{ color: '#ffd700' }}>⭐ النقاط: {totalPoints}</span>
          </div>
          {/* Countdown */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '8px 20px' }}>
            <span style={{ color: '#8892b0', fontSize: '13px' }}>⏰ التحدي القادم بعد:</span>
            <span style={{ color: '#ff6b35', fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px' }}>{countdown}</span>
          </div>
        </div>

        {/* تحدي اليوم */}
        {todayChallenge && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ background: '#ff6b35', color: '#000', padding: '3px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>🔥 تحدي اليوم</span>
              <span style={{ color: '#8892b0', fontSize: '13px' }}>حله الآن واكسب نقاطاً مضاعفة!</span>
            </div>
            <div style={{ border: '1px solid #ff6b3555', borderRadius: '12px', padding: '2px', background: 'linear-gradient(135deg,#ff6b3511,#0d1b2e)' }}>
              <ChallengePanel c={todayChallenge} />
            </div>
          </div>
        )}

        {/* باقي التحديات */}
        <div>
          <h3 style={{ color: '#00d4ff', marginBottom: '16px', fontSize: '16px' }}>// أرشيف التحديات</h3>
          <div style={{ display: selected ? 'grid' : 'flex', gridTemplateColumns: '1fr 1fr', gap: '16px', flexDirection: selected ? undefined : 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {challenges.filter(c => c.id !== todayChallenge?.id).map(c => (
                <div key={c.id} onClick={() => { setSelected(c); setFlag(''); setMessage(null); setShowHint(false) }}
                  style={{ background: selected?.id === c.id ? '#0d2137' : '#0d1b2e', border: `1px solid ${selected?.id === c.id ? '#00d4ff' : '#1e3a5f'}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', opacity: c.solved ? 0.7 : 1, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: c.solved ? '#00ff88' : '#e0e0e0', fontWeight: 'bold' }}>
                      {catIcon[c.category] || '🔒'} {c.title} {c.solved && '✅'}
                    </span>
                    <span style={{ color: '#ffd700', fontSize: '13px' }}>+{c.points}pts</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span style={{ background: '#1a3a50', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: diffColor[c.difficulty] }}>{c.difficulty}</span>
                    <span style={{ background: '#1a3a50', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#8892b0' }}>{c.category}</span>
                  </div>
                </div>
              ))}
            </div>
            {selected && <ChallengePanel c={selected} />}
          </div>
        </div>
      </div>
    </div>
  )
}