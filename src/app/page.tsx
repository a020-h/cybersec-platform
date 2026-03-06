'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.push('/dashboard')
    })
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        :root {
          --bg: #050a0f; --surface: #0a1520; --surface2: #0f1f30;
          --green: #00ff88; --green-dim: #00ff8833; --green-mid: #00ff8866;
          --cyan: #00d4ff; --red: #ff3366; --yellow: #ffd700;
          --text: #e0f0ff; --text-dim: #7090a8; --border: #1a3a50;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cairo',sans-serif; background:var(--bg); color:var(--text); overflow-x:hidden; }
        body::before { content:''; position:fixed; inset:0; background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px); background-size:60px 60px; opacity:0.3; z-index:0; pointer-events:none; }
        .blob { position:fixed; border-radius:50%; filter:blur(120px); opacity:0.08; pointer-events:none; z-index:0; }
        .blob-1 { width:600px; height:600px; background:var(--green); top:-200px; right:-100px; animation:drift1 12s ease-in-out infinite; }
        .blob-2 { width:400px; height:400px; background:var(--cyan); bottom:20%; left:-100px; animation:drift2 15s ease-in-out infinite; }
        @keyframes drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-60px,80px)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,-60px)} }
        nav { position:fixed; top:0; left:0; right:0; z-index:100; display:flex; align-items:center; justify-content:space-between; padding:18px 60px; background:rgba(5,10,15,0.85); backdrop-filter:blur(20px); border-bottom:1px solid var(--border); }
        .logo { font-family:'Space Mono',monospace; font-size:22px; color:var(--green); letter-spacing:2px; text-decoration:none; }
        .logo span { color:var(--text-dim); }
        .nav-links { display:flex; gap:36px; list-style:none; }
        .nav-links a { color:var(--text-dim); text-decoration:none; font-size:15px; font-weight:600; transition:color 0.2s; }
        .nav-links a:hover { color:var(--green); }
        .nav-cta { background:transparent; border:1px solid var(--green); color:var(--green); padding:10px 28px; border-radius:4px; font-family:'Cairo',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; }
        .nav-cta:hover { background:var(--green); color:var(--bg); }
        .hero { position:relative; min-height:100vh; display:flex; align-items:center; padding:120px 60px 60px; z-index:1; }
        .hero-content { max-width:700px; }
        .hero-badge { display:inline-flex; align-items:center; gap:10px; background:var(--green-dim); border:1px solid var(--green-mid); color:var(--green); padding:8px 18px; border-radius:100px; font-size:13px; font-weight:700; margin-bottom:28px; animation:fadeUp 0.6s ease both; }
        .dot { width:8px; height:8px; background:var(--green); border-radius:50%; animation:pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        .hero h1 { font-size:clamp(42px,6vw,80px); font-weight:900; line-height:1.1; margin-bottom:24px; animation:fadeUp 0.7s 0.1s ease both; }
        .highlight { color:var(--green); position:relative; display:inline-block; }
        .highlight::after { content:''; position:absolute; bottom:4px; right:0; left:0; height:3px; background:linear-gradient(90deg,var(--green),transparent); }
        .hero p { font-size:18px; color:var(--text-dim); line-height:1.8; margin-bottom:40px; max-width:560px; animation:fadeUp 0.7s 0.2s ease both; }
        .hero-btns { display:flex; gap:16px; animation:fadeUp 0.7s 0.3s ease both; }
        .btn-primary { background:var(--green); color:var(--bg); padding:16px 36px; border:none; border-radius:4px; font-family:'Cairo',sans-serif; font-size:16px; font-weight:900; cursor:pointer; transition:all 0.2s; box-shadow:0 0 30px var(--green-mid); }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 0 50px var(--green-mid); }
        .btn-secondary { background:transparent; color:var(--text); padding:16px 36px; border:1px solid var(--border); border-radius:4px; font-family:'Cairo',sans-serif; font-size:16px; font-weight:700; cursor:pointer; transition:all 0.2s; }
        .btn-secondary:hover { border-color:var(--cyan); color:var(--cyan); }
        .hero-terminal { position:absolute; right:60px; top:50%; transform:translateY(-30%); width:420px; background:var(--surface); border:1px solid var(--border); border-radius:8px; overflow:hidden; animation:fadeUp 0.8s 0.5s ease both; box-shadow:0 20px 60px rgba(0,0,0,0.5); }
        .terminal-bar { background:var(--surface2); padding:10px 16px; display:flex; align-items:center; gap:8px; border-bottom:1px solid var(--border); }
        .t-dot { width:12px; height:12px; border-radius:50%; }
        .t-red{background:var(--red)} .t-yellow{background:var(--yellow)} .t-green{background:var(--green)}
        .terminal-title { font-family:'Space Mono',monospace; font-size:11px; color:var(--text-dim); margin-right:auto; }
        .terminal-body { padding:20px; font-family:'Space Mono',monospace; font-size:13px; line-height:2; }
        .t-line { display:flex; gap:10px; }
        .t-prompt{color:var(--green)} .t-cmd{color:var(--text)} .t-out{color:var(--text-dim);padding-right:20px} .t-success{color:var(--green)} .t-warn{color:var(--yellow)}
        .cursor { display:inline-block; width:8px; height:16px; background:var(--green); animation:blink 1s step-end infinite; vertical-align:middle; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .stats { position:relative; z-index:1; display:flex; justify-content:center; border-top:1px solid var(--border); border-bottom:1px solid var(--border); background:var(--surface); }
        .stat-item { flex:1; text-align:center; padding:40px 20px; border-left:1px solid var(--border); }
        .stat-item:last-child { border-right:1px solid var(--border); }
        .stat-num { font-family:'Space Mono',monospace; font-size:42px; font-weight:700; color:var(--green); display:block; line-height:1; margin-bottom:8px; }
        .stat-label { font-size:14px; color:var(--text-dim); font-weight:600; }
        .section { position:relative; z-index:1; padding:100px 60px; }
        .section-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:60px; }
        .section-tag { font-family:'Space Mono',monospace; font-size:12px; color:var(--green); letter-spacing:3px; text-transform:uppercase; margin-bottom:12px; }
        .section-title { font-size:38px; font-weight:900; line-height:1.2; }
        .courses-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        .course-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:all 0.3s; cursor:pointer; position:relative; }
        .course-card::before { content:''; position:absolute; top:0; right:0; left:0; height:3px; background:linear-gradient(90deg,var(--green),var(--cyan)); opacity:0; transition:opacity 0.3s; }
        .course-card:hover { transform:translateY(-6px); border-color:var(--green-mid); box-shadow:0 20px 60px rgba(0,255,136,0.08); }
        .course-card:hover::before { opacity:1; }
        .course-banner { height:140px; display:flex; align-items:center; justify-content:center; font-size:52px; position:relative; overflow:hidden; }
        .cb-1{background:linear-gradient(135deg,#0a2010,#051508)} .cb-2{background:linear-gradient(135deg,#0a1020,#050a18)} .cb-3{background:linear-gradient(135deg,#200a0a,#180505)} .cb-4{background:linear-gradient(135deg,#1a1000,#120a00)} .cb-5{background:linear-gradient(135deg,#0a1520,#050f18)} .cb-6{background:linear-gradient(135deg,#150a20,#0d0518)}
        .course-level { position:absolute; top:12px; left:12px; padding:4px 12px; border-radius:100px; font-size:11px; font-weight:700; font-family:'Space Mono',monospace; }
        .level-beginner{background:rgba(0,255,136,0.15);color:var(--green);border:1px solid var(--green-mid)}
        .level-mid{background:rgba(0,212,255,0.15);color:var(--cyan);border:1px solid rgba(0,212,255,0.3)}
        .level-advanced{background:rgba(255,51,102,0.15);color:var(--red);border:1px solid rgba(255,51,102,0.3)}
        .course-body { padding:24px; }
        .course-title { font-size:18px; font-weight:700; margin-bottom:10px; line-height:1.4; }
        .course-desc { font-size:14px; color:var(--text-dim); line-height:1.7; margin-bottom:20px; }
        .course-meta { display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid var(--border); }
        .meta-item { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--text-dim); }
        .path-section { background:var(--surface); }
        .path-steps { display:flex; gap:0; position:relative; margin-top:20px; }
        .path-steps::before { content:''; position:absolute; top:40px; right:40px; left:40px; height:2px; background:linear-gradient(90deg,var(--green),var(--cyan),var(--red)); z-index:0; }
        .path-step { flex:1; text-align:center; padding:0 20px; position:relative; z-index:1; }
        .step-num { width:80px; height:80px; border-radius:50%; background:var(--bg); border:2px solid var(--green); display:flex; align-items:center; justify-content:center; font-family:'Space Mono',monospace; font-size:22px; font-weight:700; color:var(--green); margin:0 auto 24px; transition:all 0.3s; }
        .step-num:hover { transform:scale(1.1); box-shadow:0 0 30px currentColor; }
        .path-step:nth-child(2) .step-num{border-color:var(--cyan);color:var(--cyan)}
        .path-step:nth-child(3) .step-num{border-color:var(--yellow);color:var(--yellow)}
        .path-step:nth-child(4) .step-num{border-color:var(--red);color:var(--red)}
        .step-title { font-size:18px; font-weight:700; margin-bottom:10px; }
        .step-desc { font-size:14px; color:var(--text-dim); line-height:1.7; }
        .step-tools { display:flex; gap:8px; justify-content:center; margin-top:14px; flex-wrap:wrap; }
        .tool-tag { background:var(--surface2); border:1px solid var(--border); color:var(--text-dim); padding:4px 12px; border-radius:4px; font-size:11px; font-family:'Space Mono',monospace; }
        .cta-banner { position:relative; z-index:1; margin:0 60px 80px; background:linear-gradient(135deg,var(--surface2),var(--surface)); border:1px solid var(--green-mid); border-radius:20px; padding:70px 80px; display:flex; align-items:center; justify-content:space-between; overflow:hidden; }
        .cta-text h2 { font-size:38px; font-weight:900; margin-bottom:16px; }
        .cta-text p { font-size:17px; color:var(--text-dim); max-width:500px; line-height:1.7; }
        .cta-note { font-size:13px; color:var(--text-dim); margin-top:12px; text-align:center; }
        footer { position:relative; z-index:1; background:var(--surface); border-top:1px solid var(--border); padding:60px 60px 30px; }
        .footer-grid { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:60px; margin-bottom:50px; }
        .footer-brand p { font-size:14px; color:var(--text-dim); line-height:1.8; margin-top:16px; }
        .footer-col h4 { font-size:14px; font-weight:700; margin-bottom:20px; }
        .footer-col ul { list-style:none; }
        .footer-col li { margin-bottom:12px; }
        .footer-col a { font-size:14px; color:var(--text-dim); text-decoration:none; transition:color 0.2s; }
        .footer-col a:hover { color:var(--green); }
        .footer-bottom { border-top:1px solid var(--border); padding-top:24px; display:flex; justify-content:space-between; align-items:center; }
        .footer-bottom p { font-size:13px; color:var(--text-dim); }
        .footer-bottom span { color:var(--green); }
        @media(max-width:768px){nav{padding:14px 20px}.hero{padding:100px 20px 40px}.hero-terminal{display:none}.courses-grid{grid-template-columns:1fr}.path-steps{flex-direction:column;gap:40px}.path-steps::before{display:none}.cta-banner{flex-direction:column;gap:40px;margin:0 20px 60px;padding:40px}.footer-grid{grid-template-columns:1fr;gap:40px}.section{padding:60px 20px}.stats{flex-wrap:wrap}.stat-item{min-width:50%}}
      `}</style>

      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <nav>
        <a href="#" className="logo">CYBER<span>عربي</span></a>
        <ul className="nav-links">
          <li><a href="#courses">المسارات</a></li>
          <li><a href="#path">خارطة الطريق</a></li>
        </ul>
        <button className="nav-cta" onClick={() => router.push('/login')}>ابدأ مجاناً</button>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge"><span className="dot"></span>أول منصة عربية متخصصة في الأمن السيبراني</div>
          <h1>تعلّم <span className="highlight">الاختراق الأخلاقي</span><br/>بالعربي من الصفر</h1>
          <p>مسارات تعليمية احترافية، مختبرات تفاعلية، وتحديات CTF حقيقية — كل ما تحتاجه لتصبح محترف أمن سيبراني بلغتك.</p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => router.push('/login')}>ابدأ رحلتك الآن ←</button>
            <button className="btn-secondary">🎬 شاهد كيف يعمل</button>
          </div>
        </div>
        <div className="hero-terminal">
          <div className="terminal-bar">
            <div className="t-dot t-red"></div><div className="t-dot t-yellow"></div><div className="t-dot t-green"></div>
            <span className="terminal-title">kali@cyberarabi:~$</span>
          </div>
          <div className="terminal-body">
            <div className="t-line"><span className="t-prompt">$</span><span className="t-cmd">nmap -sV 192.168.1.1</span></div>
            <div className="t-line"><span className="t-out">Starting Nmap scan...</span></div>
            <div className="t-line"><span className="t-success">PORT     STATE SERVICE VERSION</span></div>
            <div className="t-line"><span className="t-out">22/tcp   open  ssh     OpenSSH 8.2</span></div>
            <div className="t-line"><span className="t-out">80/tcp   open  http    Apache 2.4</span></div>
            <div className="t-line"><span className="t-warn">443/tcp  open  https   nginx 1.18</span></div>
            <div className="t-line"><span className="t-success">✓ Scan complete — 3 ports open</span></div>
            <div className="t-line"><span className="t-prompt">$</span><span className="cursor"></span></div>
          </div>
        </div>
      </section>

      <div className="stats">
        <div className="stat-item"><span className="stat-num">12K+</span><span className="stat-label">طالب نشط</span></div>
        <div className="stat-item"><span className="stat-num">80+</span><span className="stat-label">مسار تعليمي</span></div>
        <div className="stat-item"><span className="stat-num">300+</span><span className="stat-label">تحدي CTF</span></div>
        <div className="stat-item"><span className="stat-num">95%</span><span className="stat-label">معدل الرضا</span></div>
      </div>

      <section className="section" id="courses">
        <div className="section-header">
          <div><p className="section-tag">// المسارات التعليمية</p><h2 className="section-title">ابدأ من أي مستوى</h2></div>
        </div>
        <div className="courses-grid">
          {[
            { icon:'🛡️', level:'مبتدئ', lvlClass:'level-beginner', bg:'cb-1', title:'أساسيات الأمن السيبراني', desc:'ابدأ من الصفر — الشبكات، البروتوكولات، وأساسيات Linux التي يحتاجها كل محترف.' },
            { icon:'🔍', level:'متوسط', lvlClass:'level-mid', bg:'cb-2', title:'اختبار الاختراق — Nmap & Recon', desc:'استكشاف الأهداف، جمع المعلومات، وتحليل الشبكات باحتراف.' },
            { icon:'💀', level:'متقدم', lvlClass:'level-advanced', bg:'cb-3', title:'Metasploit Framework كامل', desc:'من المفاهيم الأساسية إلى الاستغلال المتقدم — دليل شامل.' },
            { icon:'🌐', level:'متوسط', lvlClass:'level-mid', bg:'cb-4', title:'أمن تطبيقات الويب — OWASP Top 10', desc:'SQL Injection, XSS, CSRF وكل ثغرات الويب بالتطبيق الفعلي.' },
            { icon:'🔐', level:'مبتدئ', lvlClass:'level-beginner', bg:'cb-5', title:'التشفير وعلم الكريبتو', desc:'فهم التشفير من الأساس — symmetric, asymmetric, hashing.' },
            { icon:'🧠', level:'متقدم', lvlClass:'level-advanced', bg:'cb-6', title:'الهندسة الاجتماعية والـ OSINT', desc:'جمع المعلومات من المصادر المفتوحة وفهم أساليب التلاعب البشري.' },
          ].map((c, i) => (
            <div key={i} className="course-card" onClick={() => router.push('/login')}>
              <div className={`course-banner ${c.bg}`}>
                {c.icon}<span className={`course-level ${c.lvlClass}`}>{c.level}</span>
              </div>
              <div className="course-body">
                <h3 className="course-title">{c.title}</h3>
                <p className="course-desc">{c.desc}</p>
                <div className="course-meta">
                  <span className="meta-item">⏱️ 20+ ساعة</span>
                  <span className="meta-item">📚 30+ درس</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section path-section" id="path">
        <div className="section-header"><div><p className="section-tag">// خارطة الطريق</p><h2 className="section-title">من مبتدئ إلى محترف</h2></div></div>
        <div className="path-steps">
          {[
            { n:'01', title:'الأساسيات', desc:'Linux، شبكات، بروتوكولات — البناء الصحيح يبدأ من هنا', tools:['Linux','TCP/IP','Bash'] },
            { n:'02', title:'الاستطلاع', desc:'كيف تجمع المعلومات عن هدفك بشكل احترافي', tools:['Nmap','Shodan','OSINT'] },
            { n:'03', title:'الاستغلال', desc:'تحليل الثغرات والوصول إلى الأنظمة بشكل أخلاقي', tools:['Metasploit','Burp Suite','SQLmap'] },
            { n:'04', title:'الاحتراف', desc:'شهادات، تقارير، وسوق العمل — حوّل مهاراتك لمهنة', tools:['CEH','OSCP','Bug Bounty'] },
          ].map((s, i) => (
            <div key={i} className="path-step">
              <div className="step-num">{s.n}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
              <div className="step-tools">{s.tools.map(t => <span key={t} className="tool-tag">{t}</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="cta-banner">
        <div className="cta-text">
          <h2>جاهز تبدأ رحلتك؟ 🚀</h2>
          <p>انضم لأكثر من 12,000 طالب عربي يتعلمون الأمن السيبراني احترافياً. البداية مجانية، المستقبل لك.</p>
        </div>
        <div>
          <button className="btn-primary" onClick={() => router.push('/login')}>سجّل مجاناً الآن</button>
          <p className="cta-note">✓ لا يحتاج بطاقة ائتمانية</p>
        </div>
      </div>

      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#" className="logo">CYBER<span>عربي</span></a>
            <p>أول منصة عربية متخصصة في تعليم الأمن السيبراني واختبار الاختراق الأخلاقي.</p>
          </div>
          <div className="footer-col"><h4>المنصة</h4><ul><li><a href="#">المسارات</a></li><li><a href="#">تحديات CTF</a></li><li><a href="#">المختبرات</a></li><li><a href="#">الشهادات</a></li></ul></div>
          <div className="footer-col"><h4>المجتمع</h4><ul><li><a href="#">منتدى النقاش</a></li><li><a href="#">Discord</a></li><li><a href="#">المدوّنة</a></li><li><a href="#">المتصدرون</a></li></ul></div>
          <div className="footer-col"><h4>الشركة</h4><ul><li><a href="#">من نحن</a></li><li><a href="#">تواصل معنا</a></li><li><a href="#">سياسة الخصوصية</a></li><li><a href="#">شروط الاستخدام</a></li></ul></div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 <span>CYBERعربي</span> — صُنع بـ ❤️ للعالم العربي</p>
        </div>
      </footer>
    </>
  )
}