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

const diffColor: Record<string, string> = { 'سهل': '#00ff88', 'متوسط': '#00d4ff', 'صعب': '#ff6b35' }
const catIcon: Record<string, string> = {
  'تشفير': '🔐', 'شبكات': '🌐', 'هندسة اجتماعية': '🎭',
  'اختبار اختراق': '💻', 'تحليل البرمجيات الخبيثة': '🦠'
}

export default function CTFPage() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null)
  const [selected, setSelected] = useState<Challenge | null>(null)
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
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
      const { data: chals } = await supabase.from('ctf_challenges').select('*').lte('active_date', today).order('active_date', { ascending: false })
      const { data: solves } = await supabase.from('ctf_solves').select('challenge_id').eq('user_id', user.id)
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
    const { data: chal } = await supabase.from('ctf_challenges').select('flag').eq('id', challenge.id).single()
    if (chal?.flag?.toLowerCase().trim() === flag.toLowerCase().trim()) {
      await supabase.from('ctf_solves').insert({ user_id: userId, challenge_id: challenge.id })
      const { data: prog } = await supabase.from('profiles').select('points').eq('id', userId).single()
      if (prog) await supabase.from('profiles').update({ points: (prog.points || 0) + challenge.points }).eq('id', userId)
      setMessage({ text: `🎉 صحيح! ربحت ${challenge.points} نقطة`, type: 'success' })
      const update = (c: Challenge) => c.id === challenge.id ? { ...c, solved: true } : c
      setChallenges(prev => prev.map(update))
      setTodayChallenge(prev => prev?.id === challenge.id ? { ...prev, solved: true } : prev)
      setSelected(prev => prev?.id === challenge.id ? { ...prev, solved: true } : prev)
    } else {
      setMessage({ text: '❌ إجابة خاطئة، حاول مجدداً!', type: 'error' })
    }
    setFlag('')
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <div style={{ position: 'relative', width: '56px', height: '56px' }}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(255,107,53,0.15)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTopColor: '#ff6b35', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ position: 'absolute', inset: '10px', border: '2px solid transparent', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }}></div>
      </div>
      <p style={{ color: '#7090a8', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '2px' }}>LOADING CTF...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const totalPoints = challenges.filter(c => c.solved).reduce((s, c) => s + c.points, 0)
  const solvedCount = challenges.filter(c => c.solved).length
  const archiveChallenges = challenges.filter(c => c.id !== todayChallenge?.id)

  const ChallengePanel = ({ c, isToday }: { c: Challenge; isToday?: boolean }) => (
    <div style={{ background: 'rgba(10,21,32,0.9)', border: `1px solid ${isToday ? 'rgba(255,107,53,0.35)' : '#1a3a50'}`, borderRadius: '16px', padding: '28px', backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden' }}>
      {isToday && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #ff6b3580, transparent)' }}></div>}
      {!isToday && selected && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)' }}></div>}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '6px' }}>{c.title}</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: `${diffColor[c.difficulty]}18`, border: `1px solid ${diffColor[c.difficulty]}35`, color: diffColor[c.difficulty], padding: '3px 12px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Space Mono, monospace', fontWeight: '700' }}>{c.difficulty}</span>
            <span style={{ background: 'rgba(26,58,80,0.6)', border: '1px solid #1a3a50', color: '#7090a8', padding: '3px 12px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{catIcon[c.category] || '🔒'} {c.category}</span>
            <span style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: '#ffd700', padding: '3px 12px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Space Mono, monospace', fontWeight: '700' }}>+{c.points} pts</span>
          </div>
        </div>
        {selected && !isToday && (
          <button onClick={() => { setSelected(null); setMessage(null); setShowHint(false) }}
            style={{ background: 'rgba(26,58,80,0.5)', border: '1px solid #1a3a50', color: '#7090a8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        )}
      </div>

      {/* Description */}
      <div style={{ background: 'rgba(5,10,15,0.7)', border: '1px solid #1a3a50', borderRadius: '12px', padding: '18px', marginBottom: '20px', lineHeight: '1.85', whiteSpace: 'pre-wrap', fontSize: '14px', color: '#a0c0d8', fontFamily: 'Space Mono, monospace' }}>
        {c.description}
      </div>

      {c.solved ? (
        <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.5), transparent)' }}></div>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</p>
          <p style={{ color: '#00ff88', fontSize: '16px', fontWeight: '900' }}>أحسنت! لقد حللت هذا التحدي</p>
          <p style={{ color: '#7090a8', fontSize: '13px', marginTop: '4px', fontFamily: 'Space Mono, monospace' }}>+{c.points} pts مضافة لرصيدك</p>
        </div>
      ) : (
        <div>
          {/* Input */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input value={flag} onChange={e => setFlag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitFlag(c)}
              placeholder="أدخل الإجابة هنا..."
              style={{ width: '100%', background: 'rgba(5,10,15,0.8)', border: `1px solid ${message?.type === 'error' ? 'rgba(255,51,102,0.4)' : message?.type === 'success' ? 'rgba(0,255,136,0.4)' : '#1a3a50'}`, borderRadius: '10px', padding: '12px 16px', color: 'white', fontFamily: 'Space Mono, monospace', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <button onClick={() => submitFlag(c)} disabled={submitting || !flag.trim()}
              style={{ flex: 1, background: submitting ? 'rgba(0,255,136,0.3)' : '#00ff88', color: '#050a0f', border: 'none', padding: '12px', borderRadius: '10px', cursor: submitting ? 'wait' : 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: '900', fontSize: '15px', transition: 'all 0.2s', boxShadow: submitting ? 'none' : '0 4px 20px rgba(0,255,136,0.25)' }}>
              {submitting ? '⏳ جاري التحقق...' : '🚩 تحقق من الإجابة'}
            </button>
            <button onClick={() => setShowHint(!showHint)}
              style={{ background: showHint ? 'rgba(255,215,0,0.15)' : 'rgba(255,215,0,0.06)', border: `1px solid ${showHint ? 'rgba(255,215,0,0.4)' : 'rgba(255,215,0,0.2)'}`, color: '#ffd700', padding: '12px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', transition: 'all 0.2s' }}>
              💡
            </button>
          </div>

          {/* Hint */}
          {showHint && (
            <div style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px', padding: '14px 16px', color: '#ffd700', fontSize: '13px', marginBottom: '12px', lineHeight: '1.7', fontFamily: 'Space Mono, monospace' }}>
              💡 {c.hint}
            </div>
          )}

          {/* Message */}
          {message && (
            <div style={{ background: message.type === 'success' ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,102,0.08)', border: `1px solid ${message.type === 'success' ? 'rgba(0,255,136,0.25)' : 'rgba(255,51,102,0.25)'}`, borderRadius: '10px', padding: '14px 16px', color: message.type === 'success' ? '#00ff88' : '#ff6b6b', textAlign: 'center', fontWeight: '700', fontSize: '15px' }}>
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; list-style:none; }
        body { font-family:'Cairo',sans-serif; background:#050a0f; color:#e0f0ff; overflow-x:hidden; }

        .bg-grid { position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image: linear-gradient(rgba(255,107,53,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,53,0.025) 1px, transparent 1px);
          background-size:50px 50px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent); }
        .bg-glow { position:fixed; top:-150px; left:50%; transform:translateX(-50%); width:600px; height:400px; background:radial-gradient(ellipse, rgba(255,107,53,0.06) 0%, transparent 70%); pointer-events:none; z-index:0; }

        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:#050a0f; } ::-webkit-scrollbar-thumb { background:#1a3a50; border-radius:10px; }

        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

        .fade-up { animation:fadeUp 0.45s cubic-bezier(0.4,0,0.2,1) both; }
        .chal-card { transition:all 0.25s cubic-bezier(0.4,0,0.2,1); cursor:pointer; }
        .chal-card:hover { transform:translateX(-4px); }
        .nav-btn { transition:all 0.2s; border-radius:100px; padding:7px 16px; font-family:'Cairo',sans-serif; font-size:13px; cursor:pointer; font-weight:700; border:1px solid; }
        .nav-btn:hover { transform:translateY(-1px); filter:brightness(1.15); }

        @media (max-width:768px) {
          .page-wrap { padding:80px 16px 40px !important; }
          .archive-grid { grid-template-columns:1fr !important; }
          .stats-row { flex-direction:column !important; gap:10px !important; }
          .navbar { padding:0 16px !important; }
        }
      `}</style>

      <div className="bg-grid"></div>
      <div className="bg-glow"></div>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(5,10,15,0.88)', borderBottom: '1px solid rgba(26,58,80,0.7)', backdropFilter: 'blur(24px)', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }} className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🔐</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '17px', fontWeight: '700', color: '#00ff88', letterSpacing: '2px', textShadow: '0 0 20px rgba(0,255,136,0.4)' }}>CYBER</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '17px', fontWeight: '700', color: '#7090a8', letterSpacing: '2px' }}>عربي</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="nav-btn" onClick={() => router.push('/dashboard')}
            style={{ background: 'rgba(26,58,80,0.4)', borderColor: '#1a3a5088', color: '#a0c0d8' }}>
            ← الداشبورد
          </button>
          <button className="nav-btn" onClick={() => router.push('/dashboard/leaderboard')}
            style={{ background: 'rgba(255,215,0,0.06)', borderColor: 'rgba(255,215,0,0.2)', color: '#ffd700' }}>
            🏆 المتصدرون
          </button>
        </div>
      </nav>

      <div dir="rtl" className="page-wrap" style={{ maxWidth: '1100px', margin: '0 auto', padding: '90px 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '100px', padding: '5px 16px', marginBottom: '16px' }}>
            <span style={{ animation: 'pulse 2s infinite', color: '#ff6b35', fontSize: '9px' }}>●</span>
            <span style={{ color: 'rgba(255,107,53,0.7)', fontSize: '12px', fontFamily: 'Space Mono, monospace', letterSpacing: '1px' }}>CAPTURE THE FLAG</span>
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>
            🎯 تحديات{' '}
            <span style={{ color: '#ff6b35', textShadow: '0 0 40px rgba(255,107,53,0.4)' }}>CTF</span>
          </h1>
          <p style={{ color: '#7090a8', fontSize: '15px', marginBottom: '24px' }}>حل التحديات الأمنية واكسب النقاط</p>

          {/* Stats row */}
          <div className="stats-row" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '12px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>✅</span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#00ff88', fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: '700', lineHeight: '1' }}>{solvedCount}/{challenges.length}</p>
                <p style={{ color: '#7090a8', fontSize: '11px' }}>محلول</p>
              </div>
            </div>
            <div style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⭐</span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#ffd700', fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: '700', lineHeight: '1' }}>{totalPoints}</p>
                <p style={{ color: '#7090a8', fontSize: '11px' }}>نقطة مكتسبة</p>
              </div>
            </div>
            {/* Countdown */}
            <div style={{ background: 'rgba(255,107,53,0.07)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '12px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px', animation: 'float 2s ease-in-out infinite' }}>⏰</span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#ff6b35', fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: '700', lineHeight: '1', letterSpacing: '2px', animation: 'blink 2s ease-in-out infinite' }}>{countdown}</p>
                <p style={{ color: '#7090a8', fontSize: '11px' }}>التحدي القادم</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's challenge */}
        {todayChallenge && (
          <div className="fade-up" style={{ animationDelay: '0.08s', marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ background: '#ff6b35', color: '#050a0f', padding: '4px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '900', fontFamily: 'Space Mono, monospace', letterSpacing: '0.5px' }}>🔥 تحدي اليوم</span>
              <span style={{ color: '#7090a8', fontSize: '13px' }}>حله الآن واكسب نقاطاً!</span>
            </div>
            <ChallengePanel c={todayChallenge} isToday />
          </div>
        )}

        {/* Archive */}
        {archiveChallenges.length > 0 && (
          <div className="fade-up" style={{ animationDelay: '0.15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#00d4ff', fontFamily: 'Space Mono, monospace', fontSize: '14px', letterSpacing: '1px' }}>// ARCHIVE</h3>
              <span style={{ color: '#1a3a50', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>{archiveChallenges.length} CHALLENGES</span>
            </div>

            <div className="archive-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.2fr' : '1fr', gap: '16px', alignItems: 'start' }}>

              {/* Challenge list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {archiveChallenges.map((c, i) => (
                  <div key={c.id} className="chal-card"
                    onClick={() => { setSelected(c); setFlag(''); setMessage(null); setShowHint(false) }}
                    style={{
                      background: selected?.id === c.id ? 'rgba(0,212,255,0.07)' : 'rgba(10,21,32,0.7)',
                      border: `1px solid ${selected?.id === c.id ? 'rgba(0,212,255,0.3)' : c.solved ? 'rgba(0,255,136,0.15)' : '#1a3a50'}`,
                      borderRadius: '14px',
                      padding: '16px 20px',
                      opacity: c.solved ? 0.75 : 1,
                      backdropFilter: 'blur(8px)',
                      position: 'relative',
                      overflow: 'hidden',
                      animation: `fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) ${i * 0.05}s both`,
                    }}>
                    {selected?.id === c.id && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(180deg, transparent, rgba(0,212,255,0.6), transparent)', borderRadius: '0 14px 14px 0' }}></div>}
                    {c.solved && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(180deg, transparent, rgba(0,255,136,0.4), transparent)', borderRadius: '0 14px 14px 0' }}></div>}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ color: c.solved ? '#00ff88' : selected?.id === c.id ? '#00d4ff' : 'white', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {catIcon[c.category] || '🔒'} {c.title}
                        {c.solved && <span style={{ color: '#00ff88', fontSize: '14px' }}>✓</span>}
                      </span>
                      <span style={{ color: '#ffd700', fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: '700' }}>+{c.points}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: `${diffColor[c.difficulty]}15`, border: `1px solid ${diffColor[c.difficulty]}30`, color: diffColor[c.difficulty], padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Space Mono, monospace', fontWeight: '700' }}>{c.difficulty}</span>
                      <span style={{ background: 'rgba(26,58,80,0.5)', border: '1px solid #1a3a5066', color: '#7090a8', padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{c.category}</span>
                      {c.solved && <span style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88', padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>✓ محلول</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected panel */}
              {selected && (
                <div style={{ position: 'sticky', top: '80px' }}>
                  <ChallengePanel c={selected} />
                </div>
              )}
            </div>
          </div>
        )}

        {challenges.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', color: '#3a5a70' }}>
            <p style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</p>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', letterSpacing: '1px' }}>لا توجد تحديات متاحة بعد</p>
          </div>
        )}
      </div>
    </>
  )
}