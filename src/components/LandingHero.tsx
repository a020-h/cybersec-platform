'use client'
import { useEffect, useState, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MatrixCanvas = lazy(() => import('./MatrixCanvas'))

export default function LandingHero() {
  const router = useRouter()
  const [matrixText, setMatrixText] = useState('اختبار الاختراق...')
  const [scrollY, setScrollY] = useState(0)
  const [liveUsers, setLiveUsers] = useState<number>(0)
  const [liveLessons, setLiveLessons] = useState<number>(0)
  const [livePoints, setLivePoints] = useState<number>(0)

  // Auth check — silent redirect, doesn't block render
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [])

  // Fetch live stats
  useEffect(() => {
    supabase.from('profiles').select('*', { count: 'exact', head: true }).then(({ count }) => setLiveUsers(count || 0))
    supabase.from('lesson_completions').select('*', { count: 'exact', head: true }).then(({ count }) => setLiveLessons(count || 0))
    supabase.from('profiles').select('points').then(({ data }) =>
      setLivePoints(data?.reduce((s, p) => s + (p.points || 0), 0) || 0)
    )
  }, [])

  // Typing effect
  useEffect(() => {
    const texts = ['اختبار الاختراق...', 'تحليل الشبكات...', 'كسر التشفير...', 'CTF Challenges...', 'Ethical Hacking...']
    let ti = 0, ci = texts[0].length, deleting = true
    let tid: ReturnType<typeof setTimeout>
    const type = () => {
      const full = texts[ti]
      if (!deleting) {
        setMatrixText(full.slice(0, ci + 1)); ci++
        if (ci === full.length) { deleting = true; tid = setTimeout(type, 1800); return }
      } else {
        setMatrixText(full.slice(0, ci - 1)); ci--
        if (ci === 0) { deleting = false; ti = (ti + 1) % texts.length }
      }
      tid = setTimeout(type, deleting ? 35 : 75)
    }
    tid = setTimeout(type, 1200)
    return () => clearTimeout(tid)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navBg = `rgba(5,10,15,${Math.min(0.97, 0.7 + scrollY / 400)})`
  const ptsFmt = livePoints > 1000 ? `${Math.floor(livePoints / 1000)}k` : String(livePoints || '0')

  return (
    <>
      {/* Matrix canvas — lazy, loads after LCP paints */}
      <Suspense fallback={null}>
        <MatrixCanvas />
      </Suspense>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: navBg, borderBottom: '1px solid #1a3a50',
        backdropFilter: 'blur(20px)', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', transition: 'background 0.3s',
      }}>
        <span style={{ fontFamily: "var(--font-space-mono),monospace", fontSize: '20px', fontWeight: 700, color: '#00ff88', letterSpacing: '2px' }}>
          🔐 CYBER<span style={{ color: '#7090a8' }}>عربي</span>
        </span>
        <div className="nav-links" style={{ display: 'flex', gap: '28px' }}>
          {['المميزات', 'كيف تبدأ', 'التحديات'].map(l => (
            <button key={l} className="nav-link-btn" style={{ background: 'none', border: 'none', color: '#7090a8', fontSize: '14px', cursor: 'pointer', fontFamily: "var(--font-cairo),sans-serif" }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => router.push('/login')} className="nav-outline-btn" style={{ background: 'transparent', border: '1px solid #1a3a50', color: '#7090a8', padding: '7px 18px', borderRadius: '100px', fontFamily: "var(--font-cairo),sans-serif", fontSize: '13px', cursor: 'pointer' }}>
            تسجيل الدخول
          </button>
          <button onClick={() => router.push('/login')} className="nav-cta">ابدأ مجاناً ←</button>
        </div>
      </nav>

      {/* HERO — renders immediately, no loading state */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '110px 48px 80px', maxWidth: '1280px', margin: '0 auto' }}>
        <div className="hero-grid" style={{ display: 'flex', alignItems: 'center', gap: '60px', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0a1520', border: '1px solid #00ff8822', borderRadius: '100px', padding: '5px 14px', marginBottom: '24px' }}>
              <span style={{ animation: 'pulse 2s infinite', color: '#00ff88', fontSize: '9px' }}>●</span>
              <span style={{ color: '#7090a8', fontSize: '12px', fontFamily: "var(--font-space-mono),monospace" }}>منصة الأمن السيبراني العربية #1</span>
            </div>

            {/* LCP element — painted immediately in SSR HTML */}
            <h1 className="hero-title" style={{ fontSize: '54px', fontWeight: 900, lineHeight: 1.2, marginBottom: '18px', color: 'white', animation: 'glow 3s ease-in-out infinite' }}>
              تعلّم<br /><span style={{ color: '#00ff88' }}>الأمن السيبراني</span><br />بالعربي
            </h1>

            <div style={{ fontSize: '17px', color: '#5a7a90', marginBottom: '10px', fontFamily: "var(--font-space-mono),monospace", height: '26px', overflow: 'hidden' }}>
              <span style={{ color: '#00d4ff' }}>&gt; </span>
              <span style={{ color: '#a0c0d8' }}>{matrixText}</span>
              <span style={{ animation: 'pulse 1s infinite', color: '#00ff88' }}>█</span>
            </div>

            <p style={{ fontSize: '16px', color: '#5a7a90', marginBottom: '36px', maxWidth: '480px', lineHeight: 1.85 }}>
              منصة تعليمية متكاملة — من المبتدئ للخبير، مع تحديات CTF يومية ونظام نقاط تنافسي. كل المحتوى بالعربي ومجاني 100%.
            </p>

            <div className="hero-btns" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '48px' }}>
              <button className="cta-primary" onClick={() => router.push('/login')}>🚀 ابدأ مجاناً الآن</button>
              <button className="cta-secondary" onClick={() => router.push('/login')}>👀 استعرض المنصة</button>
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px', maxWidth: '460px' }}>
              {[
                { n: '6', label: 'مسارات', color: '#00ff88' },
                { n: '11+', label: 'درس', color: '#00d4ff' },
                { n: '8', label: 'تحدي CTF', color: '#ff6b35' },
                { n: '100%', label: 'مجاني', color: '#ffd700' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', background: '#0a152088', border: '1px solid #1a3a50', borderRadius: '10px', padding: '12px 8px', minHeight: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontFamily: "var(--font-space-mono),monospace", fontSize: '22px', fontWeight: 900, color: s.color, marginBottom: '3px' }}>{s.n}</p>
                  <p style={{ color: '#5a7a90', fontSize: '11px' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mock screen */}
          <div className="mock-card float-card" style={{ width: '500px', minHeight: '380px', flexShrink: 0, position: 'relative' }}>
            <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '12px', overflow: 'hidden', animation: 'borderPulse 3s ease-in-out infinite', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>
              <div style={{ background: '#080f18', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1a3a50' }}>
                {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, display: 'inline-block' }} />)}
                <div style={{ flex: 1, background: '#0f1f30', borderRadius: '4px', padding: '4px 12px', marginRight: '8px' }}>
                  <span style={{ color: '#3a5a70', fontFamily: "var(--font-space-mono),monospace", fontSize: '11px' }}>cybersec-platform.vercel.app/dashboard</span>
                </div>
              </div>
              <div style={{ padding: '16px', background: '#050a0f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '8px 12px', background: '#080f18', borderRadius: '8px', border: '1px solid #1a3a5066' }}>
                  <span style={{ color: '#00ff88', fontFamily: "var(--font-space-mono),monospace", fontSize: '11px', fontWeight: 700 }}>🔐 CYBERعربي</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ background: '#0a1520', border: '1px solid #ff6b3544', color: '#ff6b35', padding: '2px 8px', borderRadius: '100px', fontSize: '9px' }}>🎯 CTF</span>
                    <span style={{ background: '#0a1520', border: '1px solid #1a3a50', color: '#7090a8', padding: '2px 8px', borderRadius: '100px', fontSize: '9px' }}>⭐ 150</span>
                  </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg,#0a1520,#080f18)', border: '1px solid #1a3a50', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                  <p style={{ color: 'white', fontWeight: 900, fontSize: '13px', marginBottom: '4px' }}>أهلاً، <span style={{ color: '#00ff88' }}>hacker</span> 👋</p>
                  <p style={{ color: '#5a7a90', fontSize: '10px', marginBottom: '10px' }}>أنت في المستوى 🔥 متوسط</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
                    {[['150', '⭐', '#ffd700'], ['6', '📚', '#00ff88'], ['2', '🎯', '#00d4ff'], ['67%', '📈', '#a855f7']].map(([v, ic, c], idx) => (
                      <div key={idx} style={{ background: '#0f1f30', borderRadius: '6px', padding: '6px', textAlign: 'center', minHeight: '38px' }}>
                        <span style={{ fontSize: '12px' }}>{ic}</span>
                        <p style={{ color: c, fontFamily: "var(--font-space-mono),monospace", fontSize: '11px', fontWeight: 700 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '6px' }}>
                  {[
                    { title: 'أساسيات الأمن', icon: '🛡️', color: '#00ff88', p: 100 },
                    { title: 'الشبكات TCP/IP', icon: '🌐', color: '#00d4ff', p: 50 },
                    { title: 'اختبار الاختراق', icon: '💻', color: '#a855f7', p: 0 },
                    { title: 'التشفير', icon: '🔐', color: '#ff6ec7', p: 0 },
                  ].map((c, i) => (
                    <div key={i} style={{ background: '#0a1520', border: `1px solid ${c.p === 100 ? c.color + '44' : '#1a3a50'}`, borderRadius: '8px', padding: '10px', minHeight: '72px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '16px' }}>{c.icon}</span>
                        {c.p === 100 && <span style={{ color: '#00ff88', fontSize: '9px' }}>✓ مكتمل</span>}
                      </div>
                      <p style={{ color: 'white', fontSize: '10px', fontWeight: 700, marginBottom: '6px' }}>{c.title}</p>
                      <div style={{ background: '#0f1f30', borderRadius: '2px', height: '3px' }}>
                        <div style={{ background: c.color, height: '3px', borderRadius: '2px', width: `${c.p}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', background: 'linear-gradient(135deg,#ff6b35,#ff3366)', borderRadius: '12px', padding: '10px 16px', animation: 'float 4s ease-in-out infinite', animationDelay: '1s', width: '120px' }}>
              <p style={{ color: 'white', fontFamily: "var(--font-space-mono),monospace", fontSize: '11px', fontWeight: 700 }}>🎯 تحدي اليوم</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px' }}>+50 نقطة</p>
            </div>
            <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', background: 'linear-gradient(135deg,#0f2a1a,#0a1520)', border: '1px solid #00ff8844', borderRadius: '12px', padding: '10px 16px', animation: 'float 4s ease-in-out infinite', animationDelay: '2s', width: '130px' }}>
              <p style={{ color: '#00ff88', fontFamily: "var(--font-space-mono),monospace", fontSize: '12px', fontWeight: 900 }}>🎉 +25 نقطة</p>
              <p style={{ color: '#5a7a90', fontSize: '10px' }}>اختبار مكتمل!</p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE STATS */}
      <section style={{ padding: '0 48px 80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '100px', padding: '6px 16px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', animation: 'livePulse 1.5s infinite', display: 'inline-block' }} />
            <span style={{ color: '#00ff88', fontSize: '12px', fontFamily: "var(--font-space-mono),monospace" }}>إحصائيات مباشرة</span>
          </div>
        </div>
        <div className="live-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
          {[
            { value: liveUsers, label: 'مستخدم مسجّل', icon: '👥', color: '#00ff88' },
            { value: liveLessons, label: 'درس مكتمل', icon: '✅', color: '#00d4ff' },
            { value: ptsFmt, label: 'نقطة مكتسبة', icon: '⭐', color: '#ffd700' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#0a1520', border: '1px solid #00ff8822', borderRadius: '12px', padding: '20px 24px', textAlign: 'center', minHeight: '120px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
              <p style={{ fontFamily: "var(--font-space-mono),monospace", fontSize: '36px', fontWeight: 900, color: stat.color, lineHeight: 1, marginBottom: '6px' }}>
                {stat.value}+
              </p>
              <p style={{ color: '#5a7a90', fontSize: '13px' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}