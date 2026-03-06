'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const courses = [
  { id: 1, title: 'أساسيات الأمن السيبراني', level: 'مبتدئ', icon: '🛡️', lessons: 5, color: '#00ff88', bg: 'linear-gradient(135deg,#0a2010,#051508)' },
  { id: 2, title: 'الشبكات وبروتوكولات TCP/IP', level: 'مبتدئ', icon: '🌐', lessons: 5, color: '#00d4ff', bg: 'linear-gradient(135deg,#0a1020,#050a18)' },
  { id: 3, title: 'اختبار الاختراق', level: 'متوسط', icon: '💻', lessons: 5, color: '#a855f7', bg: 'linear-gradient(135deg,#150a20,#0d0518)' },
  { id: 4, title: 'تحليل البرمجيات الخبيثة', level: 'متقدم', icon: '🦠', lessons: 4, color: '#ff3366', bg: 'linear-gradient(135deg,#200a0a,#180505)' },
  { id: 5, title: 'الهندسة الاجتماعية', level: 'متوسط', icon: '🎭', lessons: 3, color: '#ffd700', bg: 'linear-gradient(135deg,#1a1000,#120a00)' },
  { id: 6, title: 'التشفير وعلم الكريبتو', level: 'متقدم', icon: '🔐', lessons: 3, color: '#ff6ec7', bg: 'linear-gradient(135deg,#200a18,#180510)' },
]

const getLevel = (points: number) => {
  if (points >= 300) return { label: 'خبير', color: '#ffd700', icon: '👑', next: null, nextPts: 0 }
  if (points >= 150) return { label: 'متقدم', color: '#a855f7', icon: '⚡', next: 'خبير', nextPts: 300 }
  if (points >= 50)  return { label: 'متوسط', color: '#00d4ff', icon: '🔥', next: 'متقدم', nextPts: 150 }
  return { label: 'مبتدئ', color: '#00ff88', icon: '🌱', next: 'متوسط', nextPts: 50 }
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [points, setPoints] = useState(0)
  const [lessonsCompleted, setLessonsCompleted] = useState(0)
  const [courseProgress, setCourseProgress] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'courses' | 'progress'>('courses')
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      loadStats(session.user.id)
    })
  }, [])

  const loadStats = async (userId: string) => {
    const { data: profile } = await supabase.from('profiles').select('points, is_admin').eq('id', userId).single()
    if (profile) { setPoints(profile.points); setIsAdmin(profile.is_admin || false) }
    const { data: completions } = await supabase.from('lesson_completions').select('course_id, lesson_id').eq('user_id', userId)
    if (completions) {
      setLessonsCompleted(completions.length)
      const progress: Record<number, number> = {}
      completions.forEach((c: any) => { progress[parseInt(c.course_id)] = (progress[parseInt(c.course_id)] || 0) + 1 })
      setCourseProgress(progress)
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <div style={{ position: 'relative', width: '64px', height: '64px' }}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid #00ff8820', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ position: 'absolute', inset: '8px', border: '2px solid transparent', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }}></div>
      </div>
      <p style={{ color: '#7090a8', fontFamily: 'monospace', fontSize: '13px', letterSpacing: '2px' }}>LOADING...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const level = getLevel(points)
  const totalLessons = courses.reduce((a, c) => a + c.lessons, 0)
  const completedCourses = courses.filter(c => (courseProgress[c.id] || 0) >= c.lessons).length
  const levelPercent = level.nextPts ? Math.min(100, Math.round((points / level.nextPts) * 100)) : 100
  const username = user?.email?.split('@')[0] || 'المستخدم'
  const overallPercent = Math.round((lessonsCompleted / totalLessons) * 100)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; list-style:none; }
        body { font-family:'Cairo',sans-serif; background:#050a0f; color:#e0f0ff; overflow-x:hidden; }

        /* Animated background */
        .bg-grid {
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:
            linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px);
          background-size:50px 50px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
        }
        .bg-glow-1 { position:fixed; top:-200px; right:-200px; width:600px; height:600px; background:radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%); pointer-events:none; z-index:0; }
        .bg-glow-2 { position:fixed; bottom:-200px; left:-200px; width:600px; height:600px; background:radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%); pointer-events:none; z-index:0; }

        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:#050a0f; }
        ::-webkit-scrollbar-thumb { background:#1a3a50; border-radius:10px; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(0,255,136,0.15)} 50%{box-shadow:0 0 40px rgba(0,255,136,0.35)} }

        .fade-up { animation:fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }

        /* Navbar */
        .navbar { background:rgba(5,10,15,0.85); border-bottom:1px solid rgba(26,58,80,0.8); height:64px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; backdrop-filter:blur(24px) saturate(180%); padding:0 32px; }
        .nav-logo { font-family:'Space Mono',monospace; font-size:18px; font-weight:700; letter-spacing:2px; display:flex; align-items:center; gap:8px; }
        .nav-logo-cyber { color:#00ff88; text-shadow:0 0 20px rgba(0,255,136,0.5); }
        .nav-logo-arabi { color:#7090a8; }

        /* Stat cards */
        .stat-card {
          background:rgba(10,21,32,0.8);
          border:1px solid #1a3a50;
          border-radius:14px;
          padding:16px 20px;
          transition:all 0.3s;
          position:relative;
          overflow:hidden;
          cursor:default;
        }
        .stat-card::before {
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.02) 100%);
          border-radius:14px;
        }
        .stat-card:hover { border-color:rgba(0,255,136,0.25); transform:translateY(-2px); }

        /* Course cards */
        .course-card {
          background:rgba(10,21,32,0.9);
          border-radius:18px;
          overflow:hidden;
          cursor:pointer;
          transition:all 0.4s cubic-bezier(0.4,0,0.2,1);
          border:1px solid #1a3a50;
          position:relative;
        }
        .course-card:hover { transform:translateY(-8px); }

        /* Nav buttons */
        .nav-btn {
          padding:7px 16px;
          border-radius:100px;
          font-family:'Cairo',sans-serif;
          font-size:13px;
          cursor:pointer;
          font-weight:700;
          transition:all 0.25s;
          border:1px solid;
          display:flex;
          align-items:center;
          gap:6px;
          white-space:nowrap;
        }
        .nav-btn:hover { transform:translateY(-1px); filter:brightness(1.15); }

        /* Progress bar */
        .prog-bar { background:#0a1520; border-radius:4px; overflow:hidden; }
        .prog-fill { height:100%; border-radius:4px; transition:width 1.2s cubic-bezier(0.4,0,0.2,1); }

        /* Tab */
        .tab-root { display:flex; gap:4px; background:#0a1520; border:1px solid #1a3a50; border-radius:12px; padding:4px; }
        .tab-btn {
          padding:9px 22px;
          border-radius:9px;
          border:none;
          font-family:'Cairo',sans-serif;
          font-size:14px;
          font-weight:700;
          cursor:pointer;
          transition:all 0.3s;
        }

        /* Badge */
        .badge-card {
          border-radius:14px;
          padding:16px 10px;
          text-align:center;
          transition:all 0.3s;
          cursor:default;
          position:relative;
          overflow:hidden;
        }
        .badge-card.unlocked:hover { transform:translateY(-3px); }

        /* Level card */
        .level-card {
          border-radius:18px;
          padding:20px 24px;
          min-width:260px;
          position:relative;
          overflow:hidden;
        }

        /* Scanline effect */
        .scanline { position:fixed; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg, transparent, rgba(0,255,136,0.05), transparent); animation:scanline 8s linear infinite; pointer-events:none; z-index:0; }

        @media (max-width: 768px) {
          .desktop-nav-items { display:none !important; }
          .mobile-menu-btn { display:flex !important; }
          .navbar { padding:0 16px; }
          .hero-section { padding:20px 16px !important; }
          .main-section { padding:20px 16px !important; }
          .hero-top { flex-direction:column !important; gap:16px !important; }
          .level-card { min-width:unset !important; width:100% !important; }
          .stats-grid { grid-template-columns:repeat(2,1fr) !important; gap:10px !important; }
          .courses-grid { grid-template-columns:1fr !important; }
          .badges-grid { grid-template-columns:repeat(2,1fr) !important; }
          .mobile-menu-dropdown { position:absolute; top:64px; right:0; left:0; background:rgba(5,10,15,0.98); border-bottom:1px solid #1a3a5066; padding:12px 16px; display:flex; flex-direction:column; gap:8px; z-index:99; backdrop-filter:blur(20px); }
        }
        @media (min-width:769px) {
          .mobile-menu-btn { display:none !important; }
          .mobile-menu-dropdown { display:none !important; }
        }
        @media (min-width:640px) and (max-width:1024px) {
          .courses-grid { grid-template-columns:repeat(2,1fr) !important; }
          .navbar { padding:0 24px; }
        }
      `}</style>

      <div className="bg-grid"></div>
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      <div className="scanline"></div>

      <div style={{ minHeight:'100vh', position:'relative', zIndex:1 }} dir="rtl">

        {/* ── NAVBAR ── */}
        <nav className="navbar">
          <div className="nav-logo">
            <span style={{ color:'#00ff88', fontSize:'22px' }}>🔐</span>
            <span className="nav-logo-cyber">CYBER</span>
            <span className="nav-logo-arabi">عربي</span>
          </div>

          {/* Desktop */}
          <div className="desktop-nav-items" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:'100px', padding:'6px 16px', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ color:'#ffd700', fontSize:'15px' }}>⭐</span>
              <span style={{ fontFamily:'Space Mono,monospace', fontWeight:'700', color:'white', fontSize:'14px' }}>{points}</span>
              <span style={{ color:'rgba(255,215,0,0.5)', fontSize:'12px' }}>pts</span>
            </div>
            <button className="nav-btn" onClick={() => router.push('/dashboard/leaderboard')}
              style={{ background:'rgba(255,215,0,0.08)', borderColor:'rgba(255,215,0,0.25)', color:'#ffd700' }}>
              🏆 المتصدرون
            </button>
            {isAdmin && (
              <button className="nav-btn" onClick={() => router.push('/dashboard/admin')}
                style={{ background:'rgba(255,51,102,0.1)', borderColor:'rgba(255,51,102,0.35)', color:'#ff3366' }}>
                🛡️ Admin
              </button>
            )}
            <button className="nav-btn" onClick={() => router.push('/dashboard/ctf')}
              style={{ background:'rgba(255,107,53,0.08)', borderColor:'rgba(255,107,53,0.3)', color:'#ff6b35' }}>
              🎯 CTF
            </button>
            <button className="nav-btn" onClick={() => router.push('/dashboard/profile')}
              style={{ background:'rgba(26,58,80,0.5)', borderColor:'#1a3a5088', color:'#a0c0d8' }}>
              👤 {username}
            </button>
            <button className="nav-btn" onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              style={{ background:'rgba(255,51,102,0.08)', borderColor:'rgba(255,51,102,0.25)', color:'#ff3366' }}>
              خروج
            </button>
          </div>

          {/* Mobile */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }} className="mobile-menu-btn">
            <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:'100px', padding:'5px 12px', display:'flex', alignItems:'center', gap:'5px' }}>
              <span style={{ color:'#ffd700', fontSize:'13px' }}>⭐</span>
              <span style={{ fontFamily:'Space Mono,monospace', fontWeight:'700', color:'white', fontSize:'13px' }}>{points}</span>
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ background:'#0a1520', border:'1px solid #1a3a50', color:'#e0e0e0', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontSize:'18px' }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
          {menuOpen && (
            <div className="mobile-menu-dropdown">
              {[
                { label:'🏆 المتصدرون', path:'/dashboard/leaderboard', color:'#ffd700', bg:'rgba(255,215,0,0.1)' },
                { label:'🎯 تحديات CTF', path:'/dashboard/ctf', color:'#ff6b35', bg:'rgba(255,107,53,0.1)' },
                { label:'👤 الملف الشخصي', path:'/dashboard/profile', color:'#a0c0d8', bg:'#0d1b2e' },
              ].map(item => (
                <button key={item.path} onClick={() => { router.push(item.path); setMenuOpen(false) }}
                  style={{ background:item.bg, border:'1px solid #1a3a50', color:item.color, padding:'12px 16px', borderRadius:'10px', fontFamily:'Cairo,sans-serif', fontSize:'14px', cursor:'pointer', textAlign:'right', fontWeight:'700' }}>
                  {item.label}
                </button>
              ))}
              {isAdmin && (
                <button onClick={() => { router.push('/dashboard/admin'); setMenuOpen(false) }}
                  style={{ background:'rgba(255,51,102,0.1)', border:'1px solid rgba(255,51,102,0.3)', color:'#ff3366', padding:'12px 16px', borderRadius:'10px', fontFamily:'Cairo,sans-serif', fontSize:'14px', cursor:'pointer', textAlign:'right', fontWeight:'700' }}>
                  🛡️ لوحة Admin
                </button>
              )}
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                style={{ background:'rgba(255,51,102,0.08)', border:'1px solid rgba(255,51,102,0.25)', color:'#ff3366', padding:'12px 16px', borderRadius:'10px', fontFamily:'Cairo,sans-serif', fontSize:'14px', cursor:'pointer', textAlign:'right' }}>
                🚪 خروج
              </button>
            </div>
          )}
        </nav>

        {/* ── HERO ── */}
        <div style={{ background:'linear-gradient(180deg, rgba(10,21,32,0.95) 0%, rgba(5,10,15,0.95) 100%)', borderBottom:'1px solid rgba(26,58,80,0.6)', padding:'36px 32px 28px' }} className="hero-section">
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'20px', marginBottom:'28px' }} className="hero-top">
              <div className="fade-up">
                {/* Status badge */}
                <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(0,255,136,0.06)', border:'1px solid rgba(0,255,136,0.15)', borderRadius:'100px', padding:'5px 14px', marginBottom:'16px' }}>
                  <span style={{ animation:'pulse 2s infinite', color:'#00ff88', fontSize:'9px' }}>●</span>
                  <span style={{ color:'rgba(0,255,136,0.7)', fontSize:'12px', fontFamily:'Space Mono,monospace' }}>ONLINE</span>
                  {isAdmin && <span style={{ background:'rgba(255,51,102,0.15)', border:'1px solid rgba(255,51,102,0.3)', color:'#ff3366', padding:'1px 8px', borderRadius:'100px', fontSize:'10px', fontFamily:'Space Mono,monospace', fontWeight:'700' }}>ADMIN</span>}
                </div>

                <h1 style={{ fontSize:'32px', fontWeight:'900', color:'white', marginBottom:'8px', lineHeight:'1.2' }}>
                  مرحباً،{' '}
                  <span style={{ color:'#00ff88', textShadow:'0 0 30px rgba(0,255,136,0.4)' }}>{username}</span>
                  <span style={{ marginRight:'8px' }}> 👋</span>
                </h1>
                <p style={{ color:'#7090a8', fontSize:'15px', display:'flex', alignItems:'center', gap:'8px' }}>
                  أنت في المستوى
                  <span style={{ color:level.color, fontWeight:'700', background:`${level.color}15`, border:`1px solid ${level.color}30`, padding:'2px 12px', borderRadius:'100px', fontSize:'13px', fontFamily:'Space Mono,monospace' }}>
                    {level.icon} {level.label}
                  </span>
                </p>
              </div>

              {/* Level card */}
              <div className="fade-up level-card" style={{ background:`linear-gradient(135deg, rgba(10,21,32,0.9), rgba(15,31,48,0.9))`, border:`1px solid ${level.color}30`, boxShadow:`0 0 40px ${level.color}10`, animationDelay:'0.1s' }}>
                <div style={{ position:'absolute', top:'-30px', left:'-30px', width:'120px', height:'120px', background:`radial-gradient(circle, ${level.color}15 0%, transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }}></div>
                <div style={{ position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <span style={{ color:'#7090a8', fontSize:'11px', fontFamily:'Space Mono,monospace', letterSpacing:'1px' }}>CURRENT LEVEL</span>
                    <span style={{ fontSize:'24px', animation:'float 3s ease-in-out infinite' }}>{level.icon}</span>
                  </div>
                  <p style={{ color:level.color, fontWeight:'900', fontSize:'22px', fontFamily:'Space Mono,monospace', marginBottom:'14px', textShadow:`0 0 20px ${level.color}66` }}>{level.label}</p>
                  {level.next ? (
                    <>
                      <div className="prog-bar" style={{ height:'8px', marginBottom:'10px' }}>
                        <div className="prog-fill" style={{ background:`linear-gradient(90deg, ${level.color}, ${level.color}88)`, width:`${levelPercent}%`, boxShadow:`0 0 10px ${level.color}88` }}></div>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ color:'#7090a8', fontSize:'11px', fontFamily:'Space Mono,monospace' }}>{points} pts</span>
                        <span style={{ color:level.color, fontSize:'11px', fontFamily:'Space Mono,monospace' }}>{level.nextPts} → {level.next}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', background:`${level.color}10`, border:`1px solid ${level.color}25`, borderRadius:'8px', padding:'8px 12px' }}>
                      <span style={{ fontSize:'16px' }}>🏆</span>
                      <span style={{ color:level.color, fontSize:'13px', fontWeight:'700' }}>وصلت للمستوى الأعلى!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
              {[
                { label:'النقاط الكلية', value:points, color:'#ffd700', icon:'⭐', suffix:'pts' },
                { label:'دروس مكتملة', value:lessonsCompleted, color:'#00ff88', icon:'✓', suffix:`/${totalLessons}` },
                { label:'مسارات مكتملة', value:completedCourses, color:'#00d4ff', icon:'🎯', suffix:'/6' },
                { label:'الإنجاز الكلي', value:overallPercent, color:'#a855f7', icon:'📈', suffix:'%' },
              ].map((stat, i) => (
                <div key={i} className="stat-card fade-up" style={{ animationDelay:`${i * 0.08}s` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                    <span style={{ fontSize:'20px' }}>{stat.icon}</span>
                    <span style={{ color:`${stat.color}60`, fontSize:'10px', fontFamily:'Space Mono,monospace', letterSpacing:'1px' }}>
                      {['PTS','DONE','DONE','PROG'][i]}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'3px' }}>
                    <span style={{ fontFamily:'Space Mono,monospace', fontSize:'26px', fontWeight:'700', color:stat.color, textShadow:`0 0 20px ${stat.color}44` }}>{stat.value}</span>
                    <span style={{ color:`${stat.color}60`, fontSize:'13px', fontFamily:'Space Mono,monospace' }}>{stat.suffix}</span>
                  </div>
                  <p style={{ color:'#7090a8', fontSize:'11px', marginTop:'4px' }}>{stat.label}</p>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg, transparent, ${stat.color}40, transparent)`, borderRadius:'0 0 14px 14px' }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'28px 32px' }} className="main-section">

          {/* Tabs */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
            <div className="tab-root">
              {(['courses', 'progress'] as const).map(tab => (
                <button key={tab} className="tab-btn"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: activeTab === tab ? 'linear-gradient(135deg, #00ff88, #00d4aa)' : 'transparent',
                    color: activeTab === tab ? '#050a0f' : '#7090a8',
                    boxShadow: activeTab === tab ? '0 4px 16px rgba(0,255,136,0.3)' : 'none',
                  }}>
                  {tab === 'courses' ? '📚 المسارات' : '📊 تقدمي'}
                </button>
              ))}
            </div>
            <p style={{ color:'#1a3a50', fontFamily:'Space Mono,monospace', fontSize:'12px', letterSpacing:'1px' }}>
              {activeTab === 'courses' ? `${courses.length} TRACKS AVAILABLE` : `${lessonsCompleted} LESSONS DONE`}
            </p>
          </div>

          {/* ── COURSES TAB ── */}
          {activeTab === 'courses' && (
            <div className="courses-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'18px' }}>
              {courses.map((course, i) => {
                const done = courseProgress[course.id] || 0
                const percent = Math.round((done / course.lessons) * 100)
                const isComplete = percent === 100
                const inProgress = percent > 0 && !isComplete
                const isHovered = hoveredCard === course.id
                return (
                  <div key={course.id} className="course-card fade-up"
                    style={{
                      animationDelay:`${i * 0.08}s`,
                      border:`1px solid ${isHovered ? course.color + '66' : isComplete ? course.color + '33' : '#1a3a50'}`,
                      boxShadow: isHovered ? `0 20px 50px ${course.color}20, 0 0 0 1px ${course.color}20` : 'none',
                    }}
                    onMouseEnter={() => setHoveredCard(course.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => window.location.href = `/dashboard/course/${course.id}`}>

                    {/* Card header */}
                    <div style={{ background:course.bg, padding:'24px 20px', position:'relative', overflow:'hidden', minHeight:'130px' }}>
                      {/* BG orb */}
                      <div style={{ position:'absolute', top:'-30px', left:'-30px', width:'120px', height:'120px', background:`radial-gradient(circle, ${course.color}18 0%, transparent 70%)`, borderRadius:'50%', transition:'all 0.4s', transform: isHovered ? 'scale(1.5)' : 'scale(1)' }}></div>
                      <div style={{ position:'absolute', bottom:'-20px', right:'-10px', width:'80px', height:'80px', background:`radial-gradient(circle, ${course.color}10 0%, transparent 70%)`, borderRadius:'50%' }}></div>

                      {/* Top row */}
                      <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                        <span style={{ fontSize:'42px', filter: isHovered ? `drop-shadow(0 0 12px ${course.color}88)` : 'none', transition:'filter 0.3s', display:'block', lineHeight:'1' }}>{course.icon}</span>
                        <div style={{ display:'flex', flexDirection:'column', gap:'5px', alignItems:'flex-end' }}>
                          <span style={{ background:`${course.color}18`, border:`1px solid ${course.color}35`, color:course.color, padding:'3px 10px', borderRadius:'100px', fontSize:'10px', fontFamily:'Space Mono,monospace', fontWeight:'700', letterSpacing:'0.5px' }}>
                            {course.level}
                          </span>
                          {isComplete && (
                            <span style={{ background:'rgba(0,255,136,0.12)', border:'1px solid rgba(0,255,136,0.3)', color:'#00ff88', padding:'3px 10px', borderRadius:'100px', fontSize:'10px', fontFamily:'Space Mono,monospace' }}>
                              ✓ مكتمل
                            </span>
                          )}
                          {inProgress && (
                            <span style={{ background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.25)', color:'#ffd700', padding:'3px 10px', borderRadius:'100px', fontSize:'10px', fontFamily:'Space Mono,monospace' }}>
                              ⟳ جاري
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 style={{ position:'relative', color:'white', fontWeight:'900', fontSize:'15px', lineHeight:'1.45' }}>{course.title}</h3>
                    </div>

                    {/* Card body */}
                    <div style={{ padding:'16px 20px', background:'rgba(5,10,15,0.5)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                        <span style={{ color:'#7090a8', fontSize:'12px', fontFamily:'Space Mono,monospace' }}>{done}/{course.lessons} درس</span>
                        <span style={{ color: isComplete ? '#00ff88' : course.color, fontSize:'12px', fontFamily:'Space Mono,monospace', fontWeight:'700' }}>{percent}%</span>
                      </div>
                      <div className="prog-bar" style={{ height:'5px', marginBottom:'16px' }}>
                        <div className="prog-fill" style={{
                          background: isComplete
                            ? 'linear-gradient(90deg, #00ff88, #00d4aa)'
                            : `linear-gradient(90deg, ${course.color}, ${course.color}88)`,
                          width:`${percent}%`,
                          boxShadow: percent > 0 ? `0 0 8px ${course.color}88` : 'none'
                        }}></div>
                      </div>
                      <button style={{
                        width:'100%', padding:'11px', border:'none', borderRadius:'10px',
                        background: isComplete
                          ? `linear-gradient(135deg, ${course.color}25, ${course.color}15)`
                          : isHovered
                            ? `linear-gradient(135deg, ${course.color}30, ${course.color}15)`
                            : `${course.color}12`,
                        color: course.color,
                        fontFamily:'Cairo,sans-serif', fontSize:'14px', fontWeight:'700', cursor:'pointer',
                        transition:'all 0.3s',
                        boxShadow: isHovered ? `0 4px 16px ${course.color}25` : 'none',
                        outline: `1px solid ${course.color}30`,
                      }}>
                        {isComplete ? '✓ مراجعة المسار' : inProgress ? 'متابعة ←' : 'ابدأ المسار ←'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── PROGRESS TAB ── */}
          {activeTab === 'progress' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

              {/* Track progress */}
              <div style={{ background:'rgba(10,21,32,0.8)', border:'1px solid #1a3a50', borderRadius:'18px', padding:'24px', backdropFilter:'blur(10px)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
                  <h3 style={{ color:'#00ff88', fontFamily:'Space Mono,monospace', fontSize:'14px', letterSpacing:'1px' }}>// TRACK PROGRESS</h3>
                  <span style={{ color:'#1a3a50', fontFamily:'Space Mono,monospace', fontSize:'11px' }}>{lessonsCompleted}/{totalLessons} LESSONS</span>
                </div>
                {courses.map((course, i) => {
                  const done = courseProgress[course.id] || 0
                  const percent = Math.round((done / course.lessons) * 100)
                  return (
                    <div key={course.id} className="fade-up"
                      style={{ animationDelay:`${i * 0.07}s`, marginBottom:'18px', cursor:'pointer', padding:'12px 14px', borderRadius:'12px', border:'1px solid transparent', transition:'all 0.3s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${course.color}08`; e.currentTarget.style.borderColor = `${course.color}25` }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                      onClick={() => window.location.href = `/dashboard/course/${course.id}`}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <span style={{ fontSize:'18px' }}>{course.icon}</span>
                          <span style={{ color:'white', fontSize:'14px', fontWeight:'700' }}>{course.title}</span>
                          {percent === 100 && <span style={{ color:'#00ff88', fontSize:'12px', fontFamily:'Space Mono,monospace' }}>✓</span>}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <span style={{ color:'#7090a8', fontSize:'12px', fontFamily:'Space Mono,monospace' }}>{done}/{course.lessons}</span>
                          <span style={{ color:course.color, fontSize:'13px', fontFamily:'Space Mono,monospace', fontWeight:'700', minWidth:'38px', textAlign:'left' }}>{percent}%</span>
                        </div>
                      </div>
                      <div className="prog-bar" style={{ height:'6px' }}>
                        <div className="prog-fill" style={{ background:`linear-gradient(90deg, ${course.color}, ${course.color}66)`, width:`${percent}%`, boxShadow: percent > 0 ? `0 0 8px ${course.color}66` : 'none' }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Badges */}
              <div style={{ background:'rgba(10,21,32,0.8)', border:'1px solid #1a3a50', borderRadius:'18px', padding:'24px', backdropFilter:'blur(10px)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
                  <h3 style={{ color:'#00ff88', fontFamily:'Space Mono,monospace', fontSize:'14px', letterSpacing:'1px' }}>// ACHIEVEMENTS</h3>
                  <span style={{ color:'#1a3a50', fontFamily:'Space Mono,monospace', fontSize:'11px' }}>
                    {[lessonsCompleted >= 1, lessonsCompleted >= 5, completedCourses >= 1, points >= 200, points >= 40, completedCourses >= 3, (courseProgress[6] || 0) >= 1, (courseProgress[3] || 0) >= 1].filter(Boolean).length}/8 UNLOCKED
                  </span>
                </div>
                <div className="badges-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
                  {[
                    { icon:'🌱', label:'المبتدئ', desc:'أكمل أول درس', unlocked:lessonsCompleted >= 1, color:'#00ff88' },
                    { icon:'🔥', label:'متحمس', desc:'أكمل 5 دروس', unlocked:lessonsCompleted >= 5, color:'#ff6b35' },
                    { icon:'⚡', label:'سريع', desc:'أكمل مسار كامل', unlocked:completedCourses >= 1, color:'#a855f7' },
                    { icon:'🏆', label:'بطل', desc:'200+ نقطة', unlocked:points >= 200, color:'#ffd700' },
                    { icon:'🎯', label:'دقيق', desc:'اجتاز اختباراً', unlocked:points >= 40, color:'#00d4ff' },
                    { icon:'👑', label:'الخبير', desc:'أكمل 3 مسارات', unlocked:completedCourses >= 3, color:'#ffd700' },
                    { icon:'🔐', label:'المشفِّر', desc:'مسار التشفير', unlocked:(courseProgress[6] || 0) >= 1, color:'#ff6ec7' },
                    { icon:'💻', label:'المخترق', desc:'مسار الاختراق', unlocked:(courseProgress[3] || 0) >= 1, color:'#a855f7' },
                  ].map((badge, i) => (
                    <div key={i} className={`badge-card fade-up ${badge.unlocked ? 'unlocked' : ''}`}
                      style={{
                        animationDelay:`${i * 0.06}s`,
                        background: badge.unlocked ? `linear-gradient(135deg, ${badge.color}15, ${badge.color}08)` : 'rgba(8,15,24,0.8)',
                        border: `1px solid ${badge.unlocked ? badge.color + '35' : '#1a3a50'}`,
                        opacity: badge.unlocked ? 1 : 0.3,
                      }}>
                      {badge.unlocked && (
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg, transparent, ${badge.color}80, transparent)`, borderRadius:'14px 14px 0 0' }}></div>
                      )}
                      <div style={{ fontSize:'28px', marginBottom:'8px', filter: badge.unlocked ? `drop-shadow(0 0 10px ${badge.color}66)` : 'grayscale(1)', transition:'filter 0.3s' }}>{badge.icon}</div>
                      <p style={{ color: badge.unlocked ? 'white' : '#7090a8', fontWeight:'700', fontSize:'12px', marginBottom:'4px' }}>{badge.label}</p>
                      <p style={{ color:'#7090a8', fontSize:'10px', lineHeight:'1.4' }}>{badge.desc}</p>
                      {badge.unlocked && (
                        <p style={{ color:badge.color, fontSize:'10px', fontFamily:'Space Mono,monospace', marginTop:'6px', opacity:0.8 }}>✓ مفتوح</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}