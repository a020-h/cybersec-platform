'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Scroll Animation Hook ───────────────────────────────────────────────────
function useReveal(options: { threshold?: number; rootMargin?: string } = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold: options.threshold ?? 0.12, rootMargin: options.rootMargin ?? '0px 0px -60px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

type AnimType = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' | 'flip'

function Reveal({
  children, animation = 'up', delay = 0, duration = 650,
  style = {}, className = ''
}: {
  children: React.ReactNode
  animation?: AnimType
  delay?: number
  duration?: number
  style?: React.CSSProperties
  className?: string
}) {
  const { ref, visible } = useReveal()
  const hidden: Record<AnimType, React.CSSProperties> = {
    up:    { opacity: 0, transform: 'translateY(48px)' },
    down:  { opacity: 0, transform: 'translateY(-48px)' },
    left:  { opacity: 0, transform: 'translateX(60px)' },
    right: { opacity: 0, transform: 'translateX(-60px)' },
    scale: { opacity: 0, transform: 'scale(0.82)' },
    fade:  { opacity: 0 },
    flip:  { opacity: 0, transform: 'perspective(700px) rotateX(22deg) translateY(32px)' },
  }
  const shown: Record<AnimType, React.CSSProperties> = {
    up:    { opacity: 1, transform: 'translateY(0)' },
    down:  { opacity: 1, transform: 'translateY(0)' },
    left:  { opacity: 1, transform: 'translateX(0)' },
    right: { opacity: 1, transform: 'translateX(0)' },
    scale: { opacity: 1, transform: 'scale(1)' },
    fade:  { opacity: 1 },
    flip:  { opacity: 1, transform: 'perspective(700px) rotateX(0deg) translateY(0)' },
  }
  return (
    <div ref={ref} className={className} style={{
      ...(visible ? shown[animation] : hidden[animation]),
      transition: `all ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      willChange: 'transform, opacity',
      ...style,
    }}>
      {children}
    </div>
  )
}

// Stagger wrapper — each child appears with increasing delay
function Stagger({
  children, animation = 'up', stagger = 90, delay = 0, duration = 550,
  style = {}, itemStyle = {}, className = ''
}: {
  children: React.ReactNode[]
  animation?: AnimType
  stagger?: number
  delay?: number
  duration?: number
  style?: React.CSSProperties
  itemStyle?: React.CSSProperties
  className?: string
}) {
  const { ref, visible } = useReveal()
  const hidden: Record<AnimType, React.CSSProperties> = {
    up:    { opacity: 0, transform: 'translateY(40px)' },
    down:  { opacity: 0, transform: 'translateY(-40px)' },
    left:  { opacity: 0, transform: 'translateX(50px)' },
    right: { opacity: 0, transform: 'translateX(-50px)' },
    scale: { opacity: 0, transform: 'scale(0.85)' },
    fade:  { opacity: 0 },
    flip:  { opacity: 0, transform: 'perspective(600px) rotateX(18deg)' },
  }
  const shown: Record<AnimType, React.CSSProperties> = {
    up:    { opacity: 1, transform: 'translateY(0)' },
    down:  { opacity: 1, transform: 'translateY(0)' },
    left:  { opacity: 1, transform: 'translateX(0)' },
    right: { opacity: 1, transform: 'translateX(0)' },
    scale: { opacity: 1, transform: 'scale(1)' },
    fade:  { opacity: 1 },
    flip:  { opacity: 1, transform: 'perspective(600px) rotateX(0deg)' },
  }
  // ✅ الـ grid style يُطبَّق على الـ wrapper مباشرة
  // كل child يأخذ animation بدون div وسيط يكسر الـ grid
  return (
    <div ref={ref} style={style} className={className}>
      {children.map((child, i) => (
        <div key={i} style={{
          ...(visible ? shown[animation] : hidden[animation]),
          transition: `all ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay + i * stagger}ms`,
          willChange: 'transform, opacity',
          ...itemStyle,
        }}>
          {child}
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [visible, setVisible] = useState(false)
  const [matrixText, setMatrixText] = useState('')
  const [scrollY, setScrollY] = useState(0)
  const [liveUsers, setLiveUsers] = useState(0)
  const [liveLessons, setLiveLessons] = useState(0)
  const [livePoints, setLivePoints] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
      else { setChecking(false); setTimeout(() => setVisible(true), 100) }
    })
  }, [])

  useEffect(() => {
    if (checking) return
    const fetchStats = async () => {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: lessonCount } = await supabase.from('lesson_completions').select('*', { count: 'exact', head: true })
      const { data: pointsData } = await supabase.from('profiles').select('points')
      const totalPoints = pointsData?.reduce((sum, p) => sum + (p.points || 0), 0) || 0
      setLiveUsers(userCount || 0)
      setLiveLessons(lessonCount || 0)
      setLivePoints(totalPoints)
    }
    fetchStats()
  }, [checking])

  useEffect(() => {
    if (checking) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const cols = Math.floor(canvas.width / 22)
    const drops: number[] = Array(cols).fill(1)
    const chars = 'アイウエオ01アイウエ01ABCDEF0123456789!@#$%'
    const draw = () => {
      ctx.fillStyle = 'rgba(5,10,15,0.06)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillStyle = `rgba(0,255,136,${Math.random() * 0.5 + 0.1})`
        ctx.font = '13px monospace'
        ctx.fillText(char, i * 22, y * 22)
        if (y * 22 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }
    const interval = setInterval(draw, 55)
    return () => { clearInterval(interval); window.removeEventListener('resize', resize) }
  }, [checking])

  useEffect(() => {
    if (checking) return
    const canvas = particlesRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4,
      color: Math.random() > 0.6 ? '#00ff88' : Math.random() > 0.5 ? '#00d4ff' : '#a855f7'
    }))
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color; ctx.shadowBlur = 8; ctx.shadowColor = p.color; ctx.fill()
      })
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dist = Math.hypot(p.x - q.x, p.y - q.y)
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(0,255,136,${0.15 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5; ctx.stroke()
          }
        })
      })
      requestAnimationFrame(animate)
    }
    animate()
  }, [checking])

  useEffect(() => {
    if (checking) return
    const texts = ['اختبار الاختراق...', 'تحليل الشبكات...', 'كسر التشفير...', 'CTF Challenges...', 'Ethical Hacking...']
    let ti = 0, ci = 0, deleting = false
    const type = () => {
      const full = texts[ti]
      if (!deleting) {
        setMatrixText(full.slice(0, ci + 1)); ci++
        if (ci === full.length) { deleting = true; setTimeout(type, 1800); return }
      } else {
        setMatrixText(full.slice(0, ci - 1)); ci--
        if (ci === 0) { deleting = false; ti = (ti + 1) % texts.length }
      }
      setTimeout(type, deleting ? 35 : 75)
    }
    setTimeout(type, 600)
  }, [checking])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #00ff88', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const testimonials = [
    { name: 'أحمد خالد', level: 'خبير', avatar: '👨‍💻', text: 'أفضل منصة عربية للأمن السيبراني! تعلمت في أسبوع ما كنت أبحث عنه لأشهر.', stars: 5, badge: '🏆' },
    { name: 'سارة محمد', level: 'متقدم', avatar: '👩‍💻', text: 'تحديات CTF رائعة ومحتوى عربي أصيل. النظام التنافسي يجعلك تتعلم أسرع!', stars: 5, badge: '🎯' },
    { name: 'محمد العلي', level: 'متوسط', avatar: '🧑‍💻', text: 'شرح واضح ومبسط للمفاهيم المعقدة. الشهادات احترافية جداً!', stars: 5, badge: '⭐' },
    { name: 'ليلى أحمد', level: 'خبير', avatar: '👩‍🎓', text: 'من مبتدئة لخبيرة في 3 أشهر. المنصة غيرت مساري المهني!', stars: 5, badge: '🔐' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Cairo',sans-serif;background:#050a0f;color:#e0f0ff;overflow-x:hidden;}
        ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-track{background:#0a1520;} ::-webkit-scrollbar-thumb{background:#1a3a50;border-radius:3px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(36px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{text-shadow:0 0 20px #00ff8855}50%{text-shadow:0 0 50px #00ff88bb,0 0 100px #00ff8833}}
        @keyframes float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-16px) rotate(1deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        @keyframes borderPulse{0%,100%{border-color:#00ff8822;box-shadow:0 0 0 rgba(0,255,136,0)}50%{border-color:#00ff8866;box-shadow:0 0 30px rgba(0,255,136,0.1)}}
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes starTwinkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.9)}}
        .fade-up{animation:fadeUp 0.8s cubic-bezier(0.4,0,0.2,1) both;}
        .glow-text{animation:glow 3s ease-in-out infinite;}
        .float-card{animation:float 5s ease-in-out infinite;}
        .cta-primary{background:#00ff88;color:#050a0f;border:none;padding:15px 36px;border-radius:12px;font-family:'Cairo',sans-serif;font-size:16px;font-weight:900;cursor:pointer;transition:all 0.3s;box-shadow:0 0 30px #00ff8855;}
        .cta-primary:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,255,136,0.4);}
        .cta-secondary{background:transparent;color:#7090a8;border:1px solid #1a3a50;padding:15px 36px;border-radius:12px;font-family:'Cairo',sans-serif;font-size:16px;cursor:pointer;transition:all 0.3s;}
        .cta-secondary:hover{border-color:#00ff8866;color:#00ff88;transform:translateY(-4px);}
        .feature-card{background:#0a1520;border:1px solid #1a3a50;border-radius:16px;padding:28px;transition:all 0.35s;cursor:default;}
        .feature-card:hover{transform:translateY(-8px);border-color:#00ff8844;box-shadow:0 24px 60px rgba(0,255,136,0.08);}
        .mock-screen{background:#0a1520;border:1px solid #1a3a50;border-radius:12px;overflow:hidden;animation:borderPulse 3s ease-in-out infinite;}
        .nav-cta{background:#00ff88;color:#050a0f;border:none;padding:8px 20px;border-radius:100px;font-family:'Cairo',sans-serif;font-size:13px;font-weight:900;cursor:pointer;transition:all 0.25s;}
        .nav-cta:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,255,136,0.3);}
        .badge-pill{display:inline-flex;align-items:center;gap:6px;background:#0a1520;border:1px solid #00ff8822;border-radius:100px;padding:5px 14px;}
        .testimonial-card{background:#0a1520;border:1px solid #1a3a50;border-radius:16px;padding:24px;transition:all 0.35s;}
        .testimonial-card:hover{transform:translateY(-6px);border-color:#00ff8844;box-shadow:0 20px 50px rgba(0,255,136,0.08);}
        .live-stat{background:#0a1520;border:1px solid #00ff8822;border-radius:12px;padding:20px 24px;text-align:center;}
        /* ── موبايل: أقل من 640px ─────────────────────── */
        @media(max-width:640px){
          .hero-grid{flex-direction:column!important;}
          .mock-card{display:none!important;}
          .hero-title{font-size:32px!important;line-height:1.25!important;}
          .hero-btns{flex-direction:column!important;}
          .hero-btns button{width:100%!important;}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
          .section-pad{padding:48px 16px!important;}
          .hero-pad{padding:90px 16px 48px!important;}
          .nav-pad{padding:0 16px!important;}
          .nav-links{display:none!important;}
          .cta-banner{padding:32px 16px!important;}
          .stagger-grid{grid-template-columns:1fr!important;}
          /* عكس ترتيب الخطوات على الجوال عشان يبدأ بـ 01 */
          .steps-grid > div:nth-child(1){order:3;}
          .steps-grid > div:nth-child(2){order:2;}
          .steps-grid > div:nth-child(3){order:1;}
        }
        /* ── تابلت: 641px – 1024px ───────────────────── */
        @media(min-width:641px) and (max-width:1024px){
          .hero-grid{flex-direction:column!important;}
          .mock-card{display:none!important;}
          .hero-title{font-size:44px!important;}
          .hero-pad{padding:100px 32px 60px!important;}
          .section-pad{padding:60px 32px!important;}
          .nav-links{display:none!important;}
          .stagger-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, opacity:0.35, pointerEvents:'none' }} />
      <canvas ref={particlesRef} style={{ position:'fixed', inset:0, zIndex:1, opacity:0.6, pointerEvents:'none' }} />
      <div style={{ position:'fixed', inset:0, zIndex:0, background:'radial-gradient(ellipse 80% 60% at 50% -10%,rgba(0,255,136,0.07),transparent)', pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:2, opacity: visible ? 1 : 0, transition:'opacity 0.6s' }} dir="rtl">

        {/* NAVBAR */}
        <nav className="nav-pad" style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:`rgba(5,10,15,${Math.min(0.97, 0.7 + scrollY / 400)})`, borderBottom:'1px solid #1a3a50', backdropFilter:'blur(24px)', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', transition:'background 0.3s' }}>
          <span style={{ fontFamily:'monospace', fontSize:'20px', fontWeight:'700', color:'#00ff88', letterSpacing:'2px' }}>🔐 CYBER<span style={{ color:'#7090a8' }}>عربي</span></span>
          <div className="nav-links" style={{ display:'flex', gap:'28px' }}>
            {['المميزات','كيف تبدأ','التحديات'].map(l => (
              <button key={l} style={{ background:'none', border:'none', color:'#7090a8', fontSize:'14px', cursor:'pointer', fontFamily:'Cairo,sans-serif', transition:'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color='#00ff88'}
                onMouseLeave={e => e.currentTarget.style.color='#7090a8'}>{l}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => router.push('/login')} style={{ background:'transparent', border:'1px solid #1a3a50', color:'#7090a8', padding:'7px 18px', borderRadius:'100px', fontFamily:'Cairo,sans-serif', fontSize:'13px', cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#00ff8866'; e.currentTarget.style.color='#00ff88' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#1a3a50'; e.currentTarget.style.color='#7090a8' }}>
              تسجيل الدخول
            </button>
            <button className="nav-cta" onClick={() => router.push('/login')}>ابدأ مجاناً ←</button>
          </div>
        </nav>

        {/* ═══ HERO — يظهر مباشرة بـ CSS animation (فوق الـ fold) ═══ */}
        <section className="hero-pad" style={{ display:'flex', alignItems:'center', padding:'110px 48px 80px', maxWidth:'1280px', margin:'0 auto' }}>
          <div className="hero-grid" style={{ display:'flex', alignItems:'center', gap:'60px', width:'100%' }}>
            <div style={{ flex:1 }}>
              <div className="fade-up badge-pill" style={{ marginBottom:'24px', animationDelay:'0s' }}>
                <span style={{ animation:'pulse 2s infinite', color:'#00ff88', fontSize:'9px' }}>●</span>
                <span style={{ color:'#7090a8', fontSize:'12px', fontFamily:'monospace' }}>منصة الأمن السيبراني العربية #1</span>
              </div>
              <h1 className="fade-up glow-text hero-title" style={{ animationDelay:'0.1s', fontSize:'54px', fontWeight:'900', lineHeight:'1.2', marginBottom:'18px', color:'white' }}>
                تعلّم<br /><span style={{ color:'#00ff88' }}>الأمن السيبراني</span><br />بالعربي
              </h1>
              <div className="fade-up" style={{ animationDelay:'0.2s', fontSize:'17px', color:'#5a7a90', marginBottom:'10px', fontFamily:'monospace', minHeight:'26px' }}>
                <span style={{ color:'#00d4ff' }}>&gt; </span>
                <span style={{ color:'#a0c0d8' }}>{matrixText}</span>
                <span style={{ animation:'pulse 1s infinite', color:'#00ff88' }}>█</span>
              </div>
              <p className="fade-up" style={{ animationDelay:'0.25s', fontSize:'16px', color:'#5a7a90', marginBottom:'36px', maxWidth:'480px', lineHeight:'1.85' }}>
                منصة تعليمية متكاملة — من المبتدئ للخبير، مع تحديات CTF يومية ونظام نقاط تنافسي. كل المحتوى بالعربي ومجاني 100%.
              </p>
              <div className="fade-up hero-btns" style={{ animationDelay:'0.3s', display:'flex', gap:'14px', flexWrap:'wrap', marginBottom:'48px' }}>
                <button className="cta-primary" onClick={() => router.push('/login')}>🚀 ابدأ مجاناً الآن</button>
                <button className="cta-secondary" onClick={() => router.push('/login')}>👀 استعرض المنصة</button>
              </div>
              <div className="fade-up stats-grid" style={{ animationDelay:'0.4s', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px', maxWidth:'460px' }}>
                {[
                  { n:'6', label:'مسارات تعليمية', color:'#00ff88' },
                  { n:'11+', label:'درس متاح', color:'#00d4ff' },
                  { n:'8', label:'تحدي CTF', color:'#ff6b35' },
                  { n:'100%', label:'مجاني', color:'#ffd700' },
                ].map((s,i) => (
                  <div key={i} className="fade-up" style={{ animationDelay:`${0.5+i*0.1}s`, textAlign:'center', background:'#0a152088', border:'1px solid #1a3a50', borderRadius:'10px', padding:'12px 8px' }}>
                    <p style={{ fontFamily:'monospace', fontSize:'22px', fontWeight:'900', color:s.color, marginBottom:'3px' }}>{s.n}</p>
                    <p style={{ color:'#5a7a90', fontSize:'11px' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock screen — hero لا يحتاج scroll trigger */}
            <div className="mock-card float-card" style={{ width:'500px', flexShrink:0, position:'relative' }}>
              <div className="mock-screen" style={{ boxShadow:'0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(0,255,136,0.05)' }}>
                <div style={{ background:'#080f18', padding:'10px 16px', display:'flex', alignItems:'center', gap:'8px', borderBottom:'1px solid #1a3a50' }}>
                  {['#ff5f57','#febc2e','#28c840'].map(c => <span key={c} style={{ width:'10px', height:'10px', borderRadius:'50%', background:c }}></span>)}
                  <div style={{ flex:1, background:'#0f1f30', borderRadius:'4px', padding:'4px 12px', marginRight:'8px' }}>
                    <span style={{ color:'#3a5a70', fontFamily:'monospace', fontSize:'11px' }}>cybersec-platform.vercel.app/dashboard</span>
                  </div>
                </div>
                <div style={{ padding:'16px', background:'#050a0f' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', padding:'8px 12px', background:'#080f18', borderRadius:'8px', border:'1px solid #1a3a5066' }}>
                    <span style={{ color:'#00ff88', fontFamily:'monospace', fontSize:'11px', fontWeight:'700' }}>🔐 CYBERعربي</span>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <span style={{ background:'#0a1520', border:'1px solid #ff6b3544', color:'#ff6b35', padding:'2px 8px', borderRadius:'100px', fontSize:'9px' }}>🎯 CTF</span>
                      <span style={{ background:'#0a1520', border:'1px solid #1a3a50', color:'#7090a8', padding:'2px 8px', borderRadius:'100px', fontSize:'9px' }}>⭐ 150</span>
                    </div>
                  </div>
                  <div style={{ background:'linear-gradient(135deg,#0a1520,#080f18)', border:'1px solid #1a3a50', borderRadius:'8px', padding:'12px', marginBottom:'10px' }}>
                    <p style={{ color:'white', fontWeight:'900', fontSize:'13px', marginBottom:'4px' }}>أهلاً، <span style={{ color:'#00ff88' }}>hacker</span> 👋</p>
                    <p style={{ color:'#5a7a90', fontSize:'10px', marginBottom:'10px' }}>أنت في المستوى 🔥 متوسط</p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px' }}>
                      {[['150','⭐','#ffd700'],['6','📚','#00ff88'],['2','🎯','#00d4ff'],['67%','📈','#a855f7']].map(([v,ic,c],idx) => (
                        <div key={idx} style={{ background:'#0f1f30', borderRadius:'6px', padding:'6px', textAlign:'center' }}>
                          <span style={{ fontSize:'12px' }}>{ic}</span>
                          <p style={{ color:c, fontFamily:'monospace', fontSize:'11px', fontWeight:'700' }}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'6px' }}>
                    {[
                      { title:'أساسيات الأمن', icon:'🛡️', color:'#00ff88', p:100 },
                      { title:'الشبكات TCP/IP', icon:'🌐', color:'#00d4ff', p:50 },
                      { title:'اختبار الاختراق', icon:'💻', color:'#a855f7', p:0 },
                      { title:'التشفير', icon:'🔐', color:'#ff6ec7', p:0 },
                    ].map((c,i) => (
                      <div key={i} style={{ background:'#0a1520', border:`1px solid ${c.p===100?c.color+'44':'#1a3a50'}`, borderRadius:'8px', padding:'10px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                          <span style={{ fontSize:'16px' }}>{c.icon}</span>
                          {c.p===100 && <span style={{ color:'#00ff88', fontSize:'9px', fontFamily:'monospace' }}>✓ مكتمل</span>}
                        </div>
                        <p style={{ color:'white', fontSize:'10px', fontWeight:'700', marginBottom:'6px' }}>{c.title}</p>
                        <div style={{ background:'#0f1f30', borderRadius:'2px', height:'3px' }}>
                          <div style={{ background:c.color, height:'3px', borderRadius:'2px', width:`${c.p}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ position:'absolute', top:'-20px', left:'-20px', background:'linear-gradient(135deg,#ff6b35,#ff3366)', borderRadius:'12px', padding:'10px 16px', boxShadow:'0 10px 30px rgba(255,107,53,0.4)', animation:'float 4s ease-in-out infinite', animationDelay:'1s' }}>
                <p style={{ color:'white', fontFamily:'monospace', fontSize:'11px', fontWeight:'700' }}>🎯 تحدي اليوم</p>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'10px' }}>+50 نقطة</p>
              </div>
              <div style={{ position:'absolute', bottom:'-15px', right:'-15px', background:'linear-gradient(135deg,#0f2a1a,#0a1520)', border:'1px solid #00ff8844', borderRadius:'12px', padding:'10px 16px', boxShadow:'0 10px 30px rgba(0,255,136,0.2)', animation:'float 4s ease-in-out infinite', animationDelay:'2s' }}>
                <p style={{ color:'#00ff88', fontFamily:'monospace', fontSize:'12px', fontWeight:'900' }}>🎉 +25 نقطة</p>
                <p style={{ color:'#5a7a90', fontSize:'10px' }}>اختبار مكتمل!</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ LIVE STATS — scroll reveal ═══ */}
        <section style={{ padding:'0 48px 60px', maxWidth:'1200px', margin:'0 auto' }}>
          <Reveal animation="fade" style={{ textAlign:'center', marginBottom:'32px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)', borderRadius:'100px', padding:'6px 16px', marginBottom:'16px' }}>
              <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#00ff88', animation:'livePulse 1.5s infinite', display:'inline-block' }}></span>
              <span style={{ color:'#00ff88', fontSize:'12px', fontFamily:'monospace' }}>إحصائيات مباشرة</span>
            </div>
          </Reveal>
          <Stagger animation="scale" stagger={120} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }} className="stagger-grid" itemStyle={{}}>
            {[
              { value: liveUsers || '∞', label: 'مستخدم مسجّل', icon: '👥', color: '#00ff88', suffix: '+' },
              { value: liveLessons || '∞', label: 'درس مكتمل', icon: '✅', color: '#00d4ff', suffix: '+' },
              { value: livePoints > 1000 ? `${Math.floor(livePoints/1000)}k` : livePoints || '∞', label: 'نقطة مكتسبة', icon: '⭐', color: '#ffd700', suffix: '+' },
            ].map((stat, i) => (
              <div key={i} className="live-stat" style={{}}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>{stat.icon}</div>
                <p style={{ fontFamily:'monospace', fontSize:'36px', fontWeight:'900', color:stat.color, lineHeight:1, marginBottom:'6px' }}>
                  {stat.value}{stat.value !== '∞' ? stat.suffix : ''}
                </p>
                <p style={{ color:'#5a7a90', fontSize:'13px' }}>{stat.label}</p>
              </div>
            ))}
          </Stagger>
        </section>

        {/* ═══ SCREENS — scroll reveal ═══ */}
        <section className="section-pad" style={{ padding:'80px 48px', background:'linear-gradient(180deg,transparent,#08111888,transparent)' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
            <Reveal animation="up" style={{ textAlign:'center', marginBottom:'48px' }}>
              <span style={{ color:'#00ff88', fontFamily:'monospace', fontSize:'13px' }}>// لقطات من المنصة</span>
              <h2 style={{ fontSize:'34px', fontWeight:'900', color:'white', marginTop:'8px' }}>شاهد المنصة بنفسك</h2>
            </Reveal>
            <Stagger
              animation="flip"
              stagger={150}
              style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}
              className="stagger-grid"
            >
              {[
                { title:'تحديات CTF', desc:'8 تحديات يومية مع عداد تنازلي', icon:'🎯', color:'#ff6b35',
                  preview: (
                    <div style={{ background:'#0a0e1a', padding:'12px', borderRadius:'8px', fontFamily:'monospace', fontSize:'11px' }}>
                      <div style={{ color:'#ff6b35', marginBottom:'8px', fontSize:'12px', fontWeight:'700' }}>🎯 تحديات CTF</div>
                      {['الرسالة المشفرة ✅','تحليل الشبكة 🔒','SQL Injection 🔒'].map((t,i) => (
                        <div key={i} style={{ background:'#0d1b2e', border:'1px solid #1e3a5f', borderRadius:'6px', padding:'7px 10px', marginBottom:'6px', color: i===0?'#00ff88':'#7090a8', fontSize:'10px' }}>{t}</div>
                      ))}
                      <div style={{ textAlign:'center', marginTop:'8px', color:'#ff6b35', fontSize:'10px' }}>⏰ التحدي القادم: 14:32:11</div>
                    </div>
                  )
                },
                { title:'الدروس التفاعلية', desc:'محتوى عربي أصيل مع اختبارات', icon:'📚', color:'#00ff88',
                  preview: (
                    <div style={{ background:'#050a0f', padding:'12px', borderRadius:'8px' }}>
                      <div style={{ color:'#00ff88', fontFamily:'monospace', fontSize:'11px', marginBottom:'8px' }}>01 / 03 &nbsp;✓ مكتمل</div>
                      <div style={{ color:'white', fontSize:'12px', fontWeight:'700', marginBottom:'6px' }}>أساسيات الأمن السيبراني</div>
                      <div style={{ color:'#5a7a90', fontSize:'10px', lineHeight:'1.6', marginBottom:'10px' }}>الأمن السيبراني هو مجموعة من التقنيات...</div>
                      <div style={{ background:'#00ff88', color:'#050a0f', borderRadius:'6px', padding:'6px', textAlign:'center', fontSize:'10px', fontWeight:'900' }}>⚡ ابدأ الاختبار (+15 نقطة)</div>
                    </div>
                  )
                },
                { title:'الملف الشخصي', desc:'تتبع تقدمك وإنجازاتك', icon:'👤', color:'#a855f7',
                  preview: (
                    <div style={{ background:'#0a1520', padding:'12px', borderRadius:'8px' }}>
                      <div style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'10px' }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#0f2a1a', border:'2px solid #a855f7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🧑‍💻</div>
                        <div><p style={{ color:'white', fontSize:'11px', fontWeight:'700' }}>hacker</p><p style={{ color:'#a855f7', fontSize:'10px', fontFamily:'monospace' }}>⚡ متقدم</p></div>
                        <div style={{ marginRight:'auto', textAlign:'center' }}>
                          <p style={{ color:'#ffd700', fontFamily:'monospace', fontSize:'16px', fontWeight:'900' }}>150</p>
                          <p style={{ color:'#5a7a90', fontSize:'9px' }}>نقطة</p>
                        </div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'4px' }}>
                        {['🌱✓','🔥✓','⚡✓','🏆','🎯✓','👑'].map((b,i) => (
                          <div key={i} style={{ background: i<3||i===4?'#0f1f30':'#080f18', border:`1px solid ${i<3||i===4?'#00ff8833':'#1a3a50'}`, borderRadius:'6px', padding:'6px', textAlign:'center', fontSize:'14px', opacity:i===3||i===5?0.3:1 }}>{b}</div>
                        ))}
                      </div>
                    </div>
                  )
                },
              ].map((screen, i) => (
                <div key={i}>
                  <div className="mock-screen" style={{ marginBottom:'12px' }}>
                    <div style={{ background:'#080f18', padding:'8px 12px', display:'flex', gap:'6px', alignItems:'center', borderBottom:'1px solid #1a3a50' }}>
                      {['#ff5f57','#febc2e','#28c840'].map(c => <span key={c} style={{ width:'8px', height:'8px', borderRadius:'50%', background:c }}></span>)}
                    </div>
                    <div style={{ padding:'12px' }}>{screen.preview}</div>
                  </div>
                  <h3 style={{ color:'white', fontWeight:'700', fontSize:'15px', marginBottom:'4px' }}>
                    <span style={{ color:screen.color }}>{screen.icon}</span> {screen.title}
                  </h3>
                  <p style={{ color:'#5a7a90', fontSize:'13px' }}>{screen.desc}</p>
                </div>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ═══ FEATURES — scroll reveal ═══ */}
        <section className="section-pad" style={{ padding:'80px 48px' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
            <Reveal animation="up" style={{ textAlign:'center', marginBottom:'48px' }}>
              <span style={{ color:'#00ff88', fontFamily:'monospace', fontSize:'13px' }}>// المميزات</span>
              <h2 style={{ fontSize:'34px', fontWeight:'900', color:'white', marginTop:'8px' }}>كل ما تحتاجه في مكان واحد</h2>
            </Reveal>
            <Stagger
              animation="up"
              stagger={80}
              style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}
              className="stagger-grid"
            >
              {[
                { icon:'🛡️', color:'#00ff88', title:'6 مسارات تعليمية', desc:'من أساسيات الأمن لاختبار الاختراق والتشفير والهندسة الاجتماعية.' },
                { icon:'🎯', color:'#ff6b35', title:'تحديات CTF يومية', desc:'8+ تحديات Capture The Flag مع عداد تنازلي ونقاط تنافسية.' },
                { icon:'⭐', color:'#ffd700', title:'نظام النقاط والمستويات', desc:'4 مستويات — مبتدئ، متوسط، متقدم، خبير — مع إنجازات وشارات.' },
                { icon:'📱', color:'#00d4ff', title:'يعمل على الجوال', desc:'تعلّم في أي وقت — المنصة متجاوبة بالكامل مع الهواتف.' },
                { icon:'🔐', color:'#a855f7', title:'محتوى عربي 100%', desc:'كل الشروحات والدروس بالعربي — لا حاجة لترجمة تقنية.' },
                { icon:'🆓', color:'#00ff88', title:'مجاني بالكامل', desc:'لا اشتراكات ولا رسوم — كل المحتوى مفتوح للجميع.' },
              ].map((f,i) => (
                <div key={i} className="feature-card">
                  <div style={{ width:'50px', height:'50px', borderRadius:'12px', background:f.color+'15', border:`1px solid ${f.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', marginBottom:'16px' }}>{f.icon}</div>
                  <h3 style={{ color:'white', fontWeight:'700', fontSize:'15px', marginBottom:'10px' }}>{f.title}</h3>
                  <p style={{ color:'#5a7a90', fontSize:'13px', lineHeight:'1.7' }}>{f.desc}</p>
                </div>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ═══ TESTIMONIALS — scroll reveal ═══ */}
        <section className="section-pad" style={{ padding:'80px 48px', background:'linear-gradient(180deg,transparent,#08111888,transparent)' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
            <Reveal animation="up" style={{ textAlign:'center', marginBottom:'48px' }}>
              <span style={{ color:'#00ff88', fontFamily:'monospace', fontSize:'13px' }}>// آراء المتعلمين</span>
              <h2 style={{ fontSize:'34px', fontWeight:'900', color:'white', marginTop:'8px' }}>ماذا يقول مجتمعنا</h2>
              <p style={{ color:'#5a7a90', fontSize:'15px', marginTop:'12px' }}>انضم لآلاف المتعلمين الذين غيّروا مساراتهم المهنية</p>
            </Reveal>
            <Stagger
              animation="left"
              stagger={100}
              style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px' }}
              className="stagger-grid"
            >
              {testimonials.map((t, i) => (
                <div key={i} className="testimonial-card">
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#0f1f30', border:'2px solid #00ff8844', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>{t.avatar}</div>
                    <div>
                      <p style={{ color:'white', fontWeight:'700', fontSize:'14px' }}>{t.name}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.2)', color:'#00ff88', padding:'1px 8px', borderRadius:'100px', fontSize:'10px', fontFamily:'monospace' }}>{t.level}</span>
                        <span style={{ fontSize:'12px' }}>{t.badge}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'2px', marginBottom:'12px' }}>
                    {Array(t.stars).fill(0).map((_, si) => (
                      <span key={si} style={{ color:'#ffd700', fontSize:'14px', animation:`starTwinkle ${1+si*0.2}s ease-in-out infinite` }}>★</span>
                    ))}
                  </div>
                  <p style={{ color:'#7090a8', fontSize:'13px', lineHeight:'1.7', fontStyle:'italic' }}>"{t.text}"</p>
                </div>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ═══ HOW IT WORKS — scroll reveal ═══ */}
        <section className="section-pad" style={{ padding:'80px 48px' }}>
          <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
            <Reveal animation="up" style={{ textAlign:'center', marginBottom:'48px' }}>
              <span style={{ color:'#00ff88', fontFamily:'monospace', fontSize:'13px' }}>// كيف تبدأ</span>
              <h2 style={{ fontSize:'34px', fontWeight:'900', color:'white', marginTop:'8px' }}>3 خطوات فقط</h2>
            </Reveal>
            <Stagger
              animation="scale"
              stagger={160}
              style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px', direction:'ltr' }}
              className="stagger-grid steps-grid"
            >
              {[
                { n:'01', color:'#00ff88', title:'سجّل مجاناً', desc:'أنشئ حسابك في ثوانٍ بإيميلك — لا بطاقة بنكية.' },
                { n:'02', color:'#00d4ff', title:'اختر مسارك', desc:'ابدأ بالمستوى المناسب — من المبتدئ للخبير.' },
                { n:'03', color:'#ffd700', title:'تحدّ وتقدّم', desc:'أكمل الدروس، حل CTF، واكسب نقاطاً.' },
              ].map((s,i) => (
                <div key={i} style={{ textAlign:'center', padding:'32px 24px', background:'#0a1520', border:`1px solid ${s.color}22`, borderRadius:'16px' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'52px', fontWeight:'900', color:s.color, opacity:0.25, marginBottom:'16px', lineHeight:1 }}>{s.n}</div>
                  <h3 style={{ color:'white', fontWeight:'700', fontSize:'17px', marginBottom:'12px' }}>{s.title}</h3>
                  <p style={{ color:'#5a7a90', fontSize:'14px', lineHeight:'1.7' }}>{s.desc}</p>
                </div>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ═══ CTA BANNER — scroll reveal ═══ */}
        <section className="section-pad" style={{ padding:'80px 48px' }}>
          <div style={{ maxWidth:'800px', margin:'0 auto' }}>
            <Reveal animation="scale" duration={800}>
              <div className="cta-banner" style={{ background:'linear-gradient(135deg,#0f2a1a,#0a1a2e,#150a20)', border:'1px solid #00ff8822', borderRadius:'24px', padding:'64px 48px', textAlign:'center', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:'-80px', left:'50%', transform:'translateX(-50%)', width:'400px', height:'400px', background:'#00ff8806', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' }}></div>
                <p style={{ color:'#00ff88', fontFamily:'monospace', fontSize:'13px', marginBottom:'16px', position:'relative' }}>// ابدأ رحلتك</p>
                <h2 style={{ fontSize:'38px', fontWeight:'900', color:'white', marginBottom:'16px', position:'relative' }}>جاهز تصبح خبيراً؟ 🚀</h2>
                <p style={{ color:'#7090a8', fontSize:'16px', marginBottom:'36px', position:'relative' }}>انضم الآن وابدأ تعلّم الأمن السيبراني مجاناً</p>
                <button className="cta-primary" onClick={() => router.push('/login')} style={{ fontSize:'18px', padding:'16px 48px', position:'relative' }}>🔐 ابدأ التعلّم مجاناً</button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FOOTER */}
        <Reveal animation="fade">
          <footer style={{ borderTop:'1px solid #1a3a50', padding:'32px 48px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px' }}>
            <span style={{ fontFamily:'monospace', fontSize:'18px', fontWeight:'700', color:'#00ff88', letterSpacing:'2px' }}>🔐 CYBERعربي</span>
            <p style={{ color:'#3a5a70', fontSize:'13px' }}>منصة الأمن السيبراني العربية — تعلّم، تحدّ، تقدّم</p>
            <div style={{ display:'flex', gap:'16px' }}>
              {['المميزات','الدروس','CTF'].map(l => (
                <button key={l} onClick={() => router.push('/login')} style={{ background:'none', border:'none', color:'#3a5a70', fontSize:'13px', cursor:'pointer', fontFamily:'Cairo,sans-serif', transition:'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color='#00ff88'}
                  onMouseLeave={e => e.currentTarget.style.color='#3a5a70'}>{l}</button>
              ))}
            </div>
          </footer>
        </Reveal>

      </div>
    </>
  )
}