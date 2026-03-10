// SERVER COMPONENT — no 'use client'
import LandingHeroWrapper from '@/components/LandingHeroWrapper'

const features = [
  { icon: '🛡️', color: '#00ff88', title: '6 مسارات تعليمية', desc: 'من أساسيات الأمن لاختبار الاختراق والتشفير والهندسة الاجتماعية.' },
  { icon: '🎯', color: '#ff6b35', title: 'تحديات CTF يومية', desc: '8+ تحديات Capture The Flag مع عداد تنازلي ونقاط تنافسية.' },
  { icon: '⭐', color: '#ffd700', title: 'نظام النقاط والمستويات', desc: '4 مستويات — مبتدئ، متوسط، متقدم، خبير — مع إنجازات وشارات.' },
  { icon: '📱', color: '#00d4ff', title: 'يعمل على الجوال', desc: 'تعلّم في أي وقت — المنصة متجاوبة بالكامل مع الهواتف.' },
  { icon: '🔐', color: '#a855f7', title: 'محتوى عربي 100%', desc: 'كل الشروحات والدروس بالعربي — لا حاجة لترجمة تقنية.' },
  { icon: '🆓', color: '#00ff88', title: 'مجاني بالكامل', desc: 'لا اشتراكات ولا رسوم — كل المحتوى مفتوح للجميع.' },
]

const testimonials = [
  { name: 'أحمد خالد', level: 'خبير', avatar: '👨‍💻', text: 'أفضل منصة عربية للأمن السيبراني! تعلمت في أسبوع ما كنت أبحث عنه لأشهر.', badge: '🏆' },
  { name: 'سارة محمد', level: 'متقدم', avatar: '👩‍💻', text: 'تحديات CTF رائعة ومحتوى عربي أصيل. النظام التنافسي يجعلك تتعلم أسرع!', badge: '🎯' },
  { name: 'محمد العلي', level: 'متوسط', avatar: '🧑‍💻', text: 'شرح واضح ومبسط للمفاهيم المعقدة. الشهادات احترافية جداً!', badge: '⭐' },
  { name: 'ليلى أحمد', level: 'خبير', avatar: '👩‍🎓', text: 'من مبتدئة لخبيرة في 3 أشهر. المنصة غيرت مساري المهني!', badge: '🔐' },
]

export default function LandingPage() {
  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        body{font-family:var(--font-cairo),'Cairo',sans-serif;background:#050a0f;color:#e0f0ff;overflow-x:hidden;}
        ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-track{background:#0a1520;} ::-webkit-scrollbar-thumb{background:#1a3a50;border-radius:3px;}
        @keyframes glow{0%,100%{text-shadow:0 0 20px #00ff8855}50%{text-shadow:0 0 50px #00ff88bb,0 0 100px #00ff8833}}
        @keyframes float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-16px) rotate(1deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        @keyframes borderPulse{0%,100%{border-color:#00ff8822}50%{border-color:#00ff8866}}
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .float-card{animation:float 5s ease-in-out infinite;}
        /* Fix contrast: darker background for green buttons */
        .cta-primary{background:#00cc70;color:#000000;border:none;padding:15px 36px;border-radius:12px;font-family:var(--font-cairo),'Cairo',sans-serif;font-size:16px;font-weight:900;cursor:pointer;transition:transform .3s,box-shadow .3s;box-shadow:0 0 30px #00cc7055;will-change:transform;}
        .cta-primary:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,204,112,0.4);}
        .cta-secondary{background:transparent;color:#a0c0d8;border:1px solid #2a5a70;padding:15px 36px;border-radius:12px;font-family:var(--font-cairo),'Cairo',sans-serif;font-size:16px;cursor:pointer;transition:border-color .3s,color .3s,transform .3s;will-change:transform;}
        .cta-secondary:hover{border-color:#00cc7066;color:#00cc70;transform:translateY(-4px);}
        /* Fix nav-cta contrast */
        .nav-cta{background:#00cc70;color:#000000;border:none;padding:8px 20px;border-radius:100px;font-family:var(--font-cairo),'Cairo',sans-serif;font-size:13px;font-weight:900;cursor:pointer;transition:transform .25s,box-shadow .25s;}
        .nav-cta:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,204,112,0.3);}
        .nav-link-btn:hover{color:#00cc70 !important;}
        .nav-outline-btn:hover{border-color:#00cc7066 !important;color:#00cc70 !important;}
        .feature-card{background:#0a1520;border:1px solid #1a3a50;border-radius:16px;padding:28px;transition:transform .35s,border-color .35s,box-shadow .35s;will-change:transform;}
        .feature-card:hover{transform:translateY(-8px);border-color:#00cc7044;box-shadow:0 24px 60px rgba(0,204,112,0.08);}
        .testimonial-card{background:#0a1520;border:1px solid #1a3a50;border-radius:16px;padding:24px;transition:transform .35s,border-color .35s;will-change:transform;}
        .testimonial-card:hover{transform:translateY(-6px);border-color:#00cc7044;}
        .footer-link:hover{color:#00cc70 !important;}
        @media(max-width:768px){
          .hero-grid{flex-direction:column!important;}
          .mock-card{display:none!important;}
          .hero-title{font-size:34px!important;line-height:1.3!important;}
          .hero-btns{flex-direction:column!important;}
          .hero-btns button{width:100%!important;}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
          .features-grid{grid-template-columns:1fr!important;}
          .steps-grid{grid-template-columns:1fr!important;}
          .section-pad{padding:60px 20px!important;}
          .nav-links{display:none!important;}
          .screens-grid{grid-template-columns:1fr!important;}
          .testimonials-grid{grid-template-columns:1fr!important;}
          .live-stats-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
        @media(min-width:769px) and (max-width:1100px){
          .features-grid{grid-template-columns:repeat(2,1fr)!important;}
          .testimonials-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%,rgba(0,255,136,0.06),transparent)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2 }} dir="rtl">

        {/* Hero (client) */}
        <LandingHeroWrapper />

        {/* main landmark — required for accessibility */}
        <main>

          {/* SCREENS */}
          <section className="section-pad" style={{ padding: '80px 48px', background: 'linear-gradient(180deg,transparent,#08111888,transparent)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <span style={{ color: '#00cc70', fontFamily: "var(--font-space-mono),monospace", fontSize: '13px' }}>// لقطات من المنصة</span>
                <h2 style={{ fontSize: '34px', fontWeight: 900, color: 'white', marginTop: '8px' }}>شاهد المنصة بنفسك</h2>
              </div>
              <div className="screens-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
                {[
                  { title: 'تحديات CTF', desc: '8 تحديات يومية مع عداد تنازلي', icon: '🎯', color: '#ff6b35' },
                  { title: 'الدروس التفاعلية', desc: 'محتوى عربي أصيل مع اختبارات', icon: '📚', color: '#00cc70' },
                  { title: 'الملف الشخصي', desc: 'تتبع تقدمك وإنجازاتك', icon: '👤', color: '#a855f7' },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ padding: '24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }} role="img" aria-label={s.title}>{s.icon}</div>
                        <p style={{ color: s.color, fontFamily: "var(--font-space-mono),monospace", fontSize: '13px', fontWeight: 700 }}>{s.title}</p>
                      </div>
                    </div>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{s.title}</h3>
                    <p style={{ color: '#8aacbe', fontSize: '13px' }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section className="section-pad" style={{ padding: '80px 48px' }} aria-label="المميزات">
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <span style={{ color: '#00cc70', fontFamily: "var(--font-space-mono),monospace", fontSize: '13px' }}>// المميزات</span>
                <h2 style={{ fontSize: '34px', fontWeight: 900, color: 'white', marginTop: '8px' }}>كل ما تحتاجه في مكان واحد</h2>
              </div>
              <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
                {features.map((f, i) => (
                  <div key={i} className="feature-card">
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: f.color + '15', border: `1px solid ${f.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }} role="img" aria-label={f.title}>{f.icon}</div>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>{f.title}</h3>
                    <p style={{ color: '#8aacbe', fontSize: '13px', lineHeight: 1.7 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section className="section-pad" style={{ padding: '80px 48px', background: 'linear-gradient(180deg,transparent,#08111888,transparent)' }} aria-label="آراء المتعلمين">
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <span style={{ color: '#00cc70', fontFamily: "var(--font-space-mono),monospace", fontSize: '13px' }}>// آراء المتعلمين</span>
                <h2 style={{ fontSize: '34px', fontWeight: 900, color: 'white', marginTop: '8px' }}>ماذا يقول مجتمعنا</h2>
                <p style={{ color: '#8aacbe', fontSize: '15px', marginTop: '12px' }}>انضم لآلاف المتعلمين الذين غيّروا مساراتهم المهنية</p>
              </div>
              <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' }}>
                {testimonials.map((t, i) => (
                  <article key={i} className="testimonial-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#0f1f30', border: '2px solid #00cc7044', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }} role="img" aria-label={t.name}>{t.avatar}</div>
                      <div>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{t.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ background: 'rgba(0,204,112,0.15)', border: '1px solid rgba(0,204,112,0.3)', color: '#00cc70', padding: '1px 8px', borderRadius: '100px', fontSize: '10px' }}>{t.level}</span>
                          <span style={{ fontSize: '12px' }} role="img" aria-label="badge">{t.badge}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#ffd700', fontSize: '14px', marginBottom: '12px', height: '20px' }} aria-label="5 نجوم">★★★★★</div>
                    <p style={{ color: '#8aacbe', fontSize: '13px', lineHeight: 1.7, fontStyle: 'italic' }}>"{t.text}"</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="section-pad" style={{ padding: '80px 48px' }} aria-label="كيف تبدأ">
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <span style={{ color: '#00cc70', fontFamily: "var(--font-space-mono),monospace", fontSize: '13px' }}>// كيف تبدأ</span>
                <h2 style={{ fontSize: '34px', fontWeight: 900, color: 'white', marginTop: '8px' }}>3 خطوات فقط</h2>
              </div>
              <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
                {[
                  { n: '01', color: '#00cc70', title: 'سجّل مجاناً', desc: 'أنشئ حسابك في ثوانٍ بإيميلك — لا بطاقة بنكية.' },
                  { n: '02', color: '#00d4ff', title: 'اختر مسارك', desc: 'ابدأ بالمستوى المناسب — من المبتدئ للخبير.' },
                  { n: '03', color: '#ffd700', title: 'تحدّ وتقدّم', desc: 'أكمل الدروس، حل CTF، واكسب نقاطاً.' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '32px 24px', background: '#0a1520', border: `1px solid ${s.color}22`, borderRadius: '16px', minHeight: '180px' }}>
                    <div style={{ fontFamily: "var(--font-space-mono),monospace", fontSize: '52px', fontWeight: 900, color: s.color, opacity: 0.25, marginBottom: '16px', lineHeight: 1 }} aria-hidden="true">{s.n}</div>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: '17px', marginBottom: '12px' }}>{s.title}</h3>
                    <p style={{ color: '#8aacbe', fontSize: '14px', lineHeight: 1.7 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="section-pad" style={{ padding: '80px 48px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ background: 'linear-gradient(135deg,#0f2a1a,#0a1a2e,#150a20)', border: '1px solid #00cc7022', borderRadius: '24px', padding: '64px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: '260px' }}>
                <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: '#00cc7006', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
                <p style={{ color: '#00cc70', fontFamily: "var(--font-space-mono),monospace", fontSize: '13px', marginBottom: '16px', position: 'relative' }}>// ابدأ رحلتك</p>
                <h2 style={{ fontSize: '38px', fontWeight: 900, color: 'white', marginBottom: '16px', position: 'relative' }}>جاهز تصبح خبيراً؟ 🚀</h2>
                <p style={{ color: '#8aacbe', fontSize: '16px', marginBottom: '36px', position: 'relative' }}>انضم الآن وابدأ تعلّم الأمن السيبراني مجاناً</p>
                <a href="/login" style={{ display: 'inline-block', background: '#00cc70', color: '#000000', textDecoration: 'none', padding: '16px 48px', borderRadius: '12px', fontSize: '18px', fontWeight: 900, fontFamily: "var(--font-cairo),sans-serif", position: 'relative', boxShadow: '0 0 30px #00cc7055' }}>
                  🔐 ابدأ التعلّم مجاناً
                </a>
              </div>
            </div>
          </section>

        </main>{/* end main landmark */}

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid #1a3a50', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontFamily: "var(--font-space-mono),monospace", fontSize: '18px', fontWeight: 700, color: '#00cc70', letterSpacing: '2px' }}>🔐 CYBERعربي</span>
          <p style={{ color: '#5a7a90', fontSize: '13px' }}>منصة الأمن السيبراني العربية — تعلّم، تحدّ، تقدّم</p>
          <nav aria-label="روابط التذييل" style={{ display: 'flex', gap: '16px' }}>
            {['المميزات', 'الدروس', 'CTF'].map(l => (
              <a key={l} href="/login" className="footer-link" style={{ color: '#5a7a90', fontSize: '13px', textDecoration: 'none', fontFamily: "var(--font-cairo),sans-serif" }}>{l}</a>
            ))}
          </nav>
        </footer>
      </div>
    </>
  )
}