'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [matrixText, setMatrixText] = useState('')
  const [visible, setVisible] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
      else { setChecking(false); setTimeout(() => setVisible(true), 100) }
    })
  }, [])

  // Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const cols = Math.floor(canvas.width / 20)
    const drops: number[] = Array(cols).fill(1)
    const chars = 'アイウエオカキクケコ01アイウエオカキクケコ01ABCDEF0123456789'
    const draw = () => {
      ctx.fillStyle = 'rgba(5,10,15,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#00ff8818'
      ctx.font = '14px monospace'
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(char, i * 20, y * 20)
        if (y * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }
    const interval = setInterval(draw, 50)
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { clearInterval(interval); window.removeEventListener('resize', resize) }
  }, [checking])

  // Typing effect
  useEffect(() => {
    if (checking) return
    const texts = ['اختبار الاختراق...', 'تحليل الشبكات...', 'كسر التشفير...', 'CTF Challenges...']
    let ti = 0, ci = 0, deleting = false
    const type = () => {
      const full = texts[ti]
      if (!deleting) {
        setMatrixText(full.slice(0, ci + 1))
        ci++
        if (ci === full.length) { deleting = true; setTimeout(type, 1500); return }
      } else {
        setMatrixText(full.slice(0, ci - 1))
        ci--
        if (ci === 0) { deleting = false; ti = (ti + 1) % texts.length }
      }
      setTimeout(type, deleting ? 40 : 80)
    }
    setTimeout(type, 800)
  }, [checking])

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #00ff88', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Cairo',sans-serif;background:#050a0f;color:#e0f0ff;overflow-x:hidden;}
        ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-track{background:#0a1520;} ::-webkit-scrollbar-thumb{background:#1a3a50;border-radius:3px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{text-shadow:0 0 20px #00ff8866}50%{text-shadow:0 0 40px #00ff88cc,0 0 80px #00ff8844}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.95)}}
        @keyframes scanline{0%{top:-10%}100%{top:110%}}
        @keyframes borderGlow{0%,100%{border-color:#00ff8833}50%{border-color:#00ff8899}}
        .fade-up{animation:fadeUp 0.7s cubic-bezier(0.4,0,0.2,1) both;}
        .glow-text{animation:glow 3s ease-in-out infinite;}
        .float{animation:float 4s ease-in-out infinite;}
        .cta-btn{transition:all 0.3s;cursor:pointer;position:relative;overflow:hidden;}
        .cta-btn:hover{transform:translateY(-3px);box-shadow:0 20px 40px rgba(0,255,136,0.3)!important;}
        .cta-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.1),transparent);opacity:0;transition:opacity 0.3s;}
        .cta-btn:hover::after{opacity:1;}
        .feature-card{transition:all 0.35s;cursor:default;}
        .feature-card:hover{transform:translateY(-8px);border-color:#00ff8844!important;box-shadow:0 24px 48px rgba(0,0,0,0.4);}
        .stat-item{transition:all 0.3s;}
        .stat-item:hover{transform:scale(1.05);}
        .nav-link{transition:all 0.2s;cursor:pointer;background:none;border:none;font-family:'Cairo',sans-serif;}
        .nav-link:hover{color:#00ff88!important;}

        @media(max-width:768px){
          .hero-title{font-size:32px!important;}
          .hero-sub{font-size:14px!important;}
          .hero-btns{flex-direction:column!important;align-items:stretch!important;}
          .stats-row{grid-template-columns:repeat(2,1fr)!important;gap:12px!important;}
          .features-grid{grid-template-columns:1fr!important;}
          .steps-grid{grid-template-columns:1fr!important;}
          .nav-links{display:none!important;}
          .hero-padding{padding:80px 20px 60px!important;}
          .section-padding{padding:60px 20px!important;}
          .terminal-box{display:none!important;}
        }
        @media(min-width:769px) and (max-width:1024px){
          .features-grid{grid-template-columns:repeat(2,1fr)!important;}
          .hero-title{font-size:44px!important;}
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.4 }} />

      <div style={{ position: 'relative', zIndex: 1, opacity: visible ? 1 : 0, transition: 'opacity 0.5s' }} dir="rtl">

        {/* Navbar */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(5,10,15,0.85)', borderBottom: '1px solid #1a3a50', backdropFilter: 'blur(20px)', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '700', color: '#00ff88', letterSpacing: '2px' }}>
            🔐 CYBER<span style={{ color: '#7090a8' }}>عربي</span>
          </span>
          <div className="nav-links" style={{ display: 'flex', gap: '28px' }}>
            {['المميزات', 'كيف تبدأ', 'التحديات'].map(l => (
              <button key={l} className="nav-link" style={{ color: '#7090a8', fontSize: '14px', padding: 0 }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="cta-btn" onClick={() => router.push('/auth')}
              style={{ background: 'transparent', border: '1px solid #00ff8866', color: '#00ff88', padding: '8px 20px', borderRadius: '100px', fontFamily: 'Cairo,sans-serif', fontSize: '13px', fontWeight: '700' }}>
              تسجيل الدخول
            </button>
            <button className="cta-btn" onClick={() => router.push('/auth')}
              style={{ background: '#00ff88', border: 'none', color: '#050a0f', padding: '8px 20px', borderRadius: '100px', fontFamily: 'Cairo,sans-serif', fontSize: '13px', fontWeight: '900', boxShadow: '0 0 20px #00ff8844' }}>
              ابدأ مجاناً ←
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero-padding" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 40px 80px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ flex: 1 }}>
            <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0a1520', border: '1px solid #00ff8833', borderRadius: '100px', padding: '6px 16px', marginBottom: '24px' }}>
              <span style={{ animation: 'pulse 2s infinite', color: '#00ff88', fontSize: '10px' }}>●</span>
              <span style={{ color: '#7090a8', fontSize: '13px', fontFamily: 'monospace' }}>منصة الأمن السيبراني العربية الأولى</span>
            </div>

            <h1 className="fade-up glow-text hero-title" style={{ animationDelay: '0.1s', fontSize: '56px', fontWeight: '900', lineHeight: '1.2', marginBottom: '20px', color: 'white' }}>
              تعلّم الأمن<br />
              <span style={{ color: '#00ff88' }}>السيبراني</span> بالعربي
            </h1>

            <div className="fade-up hero-sub" style={{ animationDelay: '0.2s', fontSize: '18px', color: '#7090a8', marginBottom: '12px', fontFamily: 'monospace', minHeight: '28px' }}>
              <span style={{ color: '#00d4ff' }}>&gt; </span>
              <span>{matrixText}</span>
              <span style={{ animation: 'pulse 1s infinite', color: '#00ff88' }}>|</span>
            </div>

            <p className="fade-up" style={{ animationDelay: '0.25s', fontSize: '16px', color: '#5a7a90', marginBottom: '36px', maxWidth: '500px', lineHeight: '1.8' }}>
              منصة تعليمية متكاملة لتعلم الأمن السيبراني — من المبتدئ للخبير، مع تحديات CTF يومية ونظام نقاط تنافسي.
            </p>

            <div className="fade-up hero-btns" style={{ animationDelay: '0.3s', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button className="cta-btn" onClick={() => router.push('/auth')}
                style={{ background: '#00ff88', border: 'none', color: '#050a0f', padding: '14px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: '900', fontFamily: 'Cairo,sans-serif', boxShadow: '0 0 30px #00ff8855' }}>
                🚀 ابدأ مجاناً الآن
              </button>
              <button className="cta-btn" onClick={() => router.push('/auth')}
                style={{ background: 'transparent', border: '1px solid #1a3a50', color: '#7090a8', padding: '14px 32px', borderRadius: '12px', fontSize: '16px', fontFamily: 'Cairo,sans-serif' }}>
                👀 استعرض المنصة
              </button>
            </div>

            {/* Stats */}
            <div className="fade-up stats-row" style={{ animationDelay: '0.4s', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginTop: '48px', maxWidth: '500px' }}>
              {[
                { n: '6', label: 'مسارات' },
                { n: '11+', label: 'درس' },
                { n: '8', label: 'تحدي CTF' },
                { n: '100%', label: 'مجاني' },
              ].map((s, i) => (
                <div key={i} className="stat-item" style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: '900', color: '#00ff88' }}>{s.n}</p>
                  <p style={{ color: '#5a7a90', fontSize: '12px' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal mockup */}
          <div className="terminal-box float" style={{ marginRight: '40px', width: '420px', flexShrink: 0 }}>
            <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', animation: 'borderGlow 3s ease-in-out infinite' }}>
              <div style={{ background: '#080f18', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1a3a50' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }}></span>
                <span style={{ color: '#5a7a90', fontFamily: 'monospace', fontSize: '12px', marginRight: 'auto' }}>cyber-terminal ~ </span>
              </div>
              <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '2', minHeight: '280px' }}>
                {[
                  { c: '#5a7a90', t: '# مرحباً بك في CYBERعربي' },
                  { c: '#00ff88', t: '> بدء الدرس: أساسيات الأمن السيبراني' },
                  { c: '#7090a8', t: '  ✓ تعريف الأمن السيبراني' },
                  { c: '#7090a8', t: '  ✓ أنواع التهديدات والهجمات' },
                  { c: '#00d4ff', t: '  ⟳ تحليل الشبكة المحلية...' },
                  { c: '#5a7a90', t: '' },
                  { c: '#ff6b35', t: '🎯 تحدي اليوم: اكتشف الثغرة!' },
                  { c: '#ffd700', t: '  FLAG{cyber_arabic_2025}' },
                  { c: '#00ff88', t: '  🎉 +50 نقطة مكتسبة!' },
                  { c: '#5a7a90', t: '' },
                  { c: '#a855f7', t: '★ المستوى: متوسط → متقدم' },
                ].map((line, i) => (
                  <div key={i} className="fade-up" style={{ animationDelay: `${0.5 + i * 0.08}s`, color: line.c }}>{line.t || '\u00A0'}</div>
                ))}
                <span style={{ animation: 'pulse 1s infinite', color: '#00ff88' }}>█</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section-padding" style={{ padding: '80px 40px', background: 'linear-gradient(180deg,transparent,#080f1888,transparent)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: '13px' }}>// المميزات</span>
              <h2 style={{ fontSize: '36px', fontWeight: '900', color: 'white', marginTop: '8px' }}>كل ما تحتاجه في مكان واحد</h2>
            </div>
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
              {[
                { icon: '🛡️', color: '#00ff88', title: 'مسارات تعليمية', desc: '6 مسارات من المبتدئ للخبير — أساسيات الأمن، الشبكات، اختبار الاختراق، التشفير والمزيد.' },
                { icon: '🎯', color: '#ff6b35', title: 'تحديات CTF يومية', desc: '8+ تحديات Capture The Flag متجددة يومياً — اختبر مهاراتك واكسب نقاطاً.' },
                { icon: '⭐', color: '#ffd700', title: 'نظام النقاط والمستويات', desc: 'تقدّم من مبتدئ لخبير عبر نظام نقاط تنافسي مع إنجازات وشارات حصرية.' },
                { icon: '📱', color: '#00d4ff', title: 'يعمل على الجوال', desc: 'تعلّم في أي وقت ومن أي مكان — المنصة متجاوبة بالكامل مع الهواتف والأجهزة اللوحية.' },
                { icon: '🔐', color: '#a855f7', title: 'محتوى عربي أصيل', desc: 'كل الدروس والشروحات بالعربي الفصيح — لا حاجة لترجمة مصطلحات تقنية.' },
                { icon: '🆓', color: '#00ff88', title: 'مجاني بالكامل', desc: 'لا اشتراكات ولا رسوم خفية — كل المحتوى مفتوح ومجاني للجميع.' },
              ].map((f, i) => (
                <div key={i} className="feature-card fade-up"
                  style={{ animationDelay: `${i * 0.1}s`, background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', padding: '28px', transition: 'all 0.35s' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: f.color + '15', border: `1px solid ${f.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '16px' }}>
                    {f.icon}
                  </div>
                  <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '10px' }}>{f.title}</h3>
                  <p style={{ color: '#5a7a90', fontSize: '14px', lineHeight: '1.7' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="section-padding" style={{ padding: '80px 40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: '13px' }}>// كيف تبدأ</span>
              <h2 style={{ fontSize: '36px', fontWeight: '900', color: 'white', marginTop: '8px' }}>3 خطوات للبدء</h2>
            </div>
            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
              {[
                { n: '01', color: '#00ff88', title: 'سجّل مجاناً', desc: 'أنشئ حسابك في ثوانٍ بإيميلك فقط — لا بطاقة بنكية مطلوبة.' },
                { n: '02', color: '#00d4ff', title: 'اختر مسارك', desc: 'ابدأ بالمسار المناسب لمستواك — من أساسيات الأمن لاختبار الاختراق.' },
                { n: '03', color: '#ffd700', title: 'تحدّ وتقدّم', desc: 'أكمل الدروس، حل تحديات CTF، واكسب نقاطاً لترتقي في المستويات.' },
              ].map((s, i) => (
                <div key={i} className="fade-up" style={{ animationDelay: `${i * 0.15}s`, textAlign: 'center', padding: '32px 24px', background: '#0a1520', border: `1px solid ${s.color}22`, borderRadius: '16px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '48px', fontWeight: '900', color: s.color, opacity: 0.3, marginBottom: '16px' }}>{s.n}</div>
                  <h3 style={{ color: 'white', fontWeight: '700', fontSize: '18px', marginBottom: '12px' }}>{s.title}</h3>
                  <p style={{ color: '#5a7a90', fontSize: '14px', lineHeight: '1.7' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="section-padding" style={{ padding: '80px 40px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="fade-up" style={{ background: 'linear-gradient(135deg,#0f2a1a,#0a1a2e)', border: '1px solid #00ff8833', borderRadius: '24px', padding: '60px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: '#00ff8808', borderRadius: '50%', filter: 'blur(60px)' }}></div>
              <h2 style={{ fontSize: '36px', fontWeight: '900', color: 'white', marginBottom: '16px', position: 'relative' }}>
                جاهز لتبدأ رحلتك؟ 🚀
              </h2>
              <p style={{ color: '#7090a8', fontSize: '16px', marginBottom: '32px', position: 'relative' }}>
                انضم الآن وابدأ تعلّم الأمن السيبراني مجاناً
              </p>
              <button className="cta-btn" onClick={() => router.push('/auth')}
                style={{ background: '#00ff88', border: 'none', color: '#050a0f', padding: '16px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: '900', fontFamily: 'Cairo,sans-serif', boxShadow: '0 0 40px #00ff8866', position: 'relative' }}>
                🔐 ابدأ التعلّم مجاناً
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #1a3a50', padding: '32px 40px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '700', color: '#00ff88', marginBottom: '8px', letterSpacing: '2px' }}>
            🔐 CYBERعربي
          </p>
          <p style={{ color: '#3a5a70', fontSize: '13px' }}>منصة الأمن السيبراني العربية — تعلّم، تحدّ، تقدّم</p>
        </footer>

      </div>
    </>
  )
}