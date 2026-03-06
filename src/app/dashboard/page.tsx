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
    if (profile) {
      setPoints(profile.points)
      setIsAdmin(profile.is_admin || false)
    }
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
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid #00ff88', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <p style={{ color: '#7090a8', fontFamily: 'monospace' }}>جاري التحميل...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const level = getLevel(points)
  const totalLessons = courses.reduce((a, c) => a + c.lessons, 0)
  const completedCourses = courses.filter(c => (courseProgress[c.id] || 0) >= c.lessons).length
  const levelPercent = level.nextPts ? Math.min(100, Math.round((points / level.nextPts) * 100)) : 100
  const username = user?.email?.split('@')[0] || 'المستخدم'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; list-style:none; }
        body { font-family:'Cairo',sans-serif; background:#050a0f; color:#e0f0ff; }
        body::before { content:''; position:fixed; inset:0; background-image:linear-gradient(#1a3a5022 1px,transparent 1px),linear-gradient(90deg,#1a3a5022 1px,transparent 1px); background-size:60px 60px; z-index:0; pointer-events:none; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#0a1520; }
        ::-webkit-scrollbar-thumb { background:#1a3a50; border-radius:3px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .fade-up { animation:fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
        .stat-card { transition:all 0.3s; }
        .course-card { transition:all 0.35s cubic-bezier(0.4,0,0.2,1); cursor:pointer; }
        .course-card:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(0,0,0,0.5); }
        .course-btn { transition:all 0.25s; cursor:pointer; }
        .tab-btn { transition:all 0.25s; }
        .badge-card { transition:all 0.3s; }
        .mobile-menu { display:none; }
        .nav-btn { transition: all 0.2s; }
        .nav-btn:hover { opacity: 0.85; transform: translateY(-1px); }

        @media (max-width: 768px) {
          .desktop-nav-items { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-menu { display: block; }
          .hero-flex { flex-direction: column !important; }
          .level-card-wrap { min-width: unset !important; width: 100% !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .courses-grid { grid-template-columns: 1fr !important; }
          .badges-grid { grid-template-columns: repeat(2,1fr) !important; }
          .hero-padding { padding: 20px 16px 16px !important; }
          .main-padding { padding: 20px 16px !important; }
          .nav-padding { padding: 0 16px !important; }
          .hero-title { font-size: 24px !important; }
          .tab-container { width: 100% !important; }
          .tab-btn { flex: 1 !important; text-align: center !important; }
          .mobile-menu-dropdown { position:absolute; top:64px; right:0; left:0; background:rgba(5,10,15,0.98); border-bottom:1px solid #1a3a50; padding:12px 16px; display:flex; flex-direction:column; gap:8px; z-index:99; backdrop-filter:blur(20px); }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-menu-dropdown { display: none !important; }
        }
        @media (min-width: 640px) and (max-width: 1024px) {
          .courses-grid { grid-template-columns: repeat(2,1fr) !important; }
          .nav-padding { padding: 0 24px !important; }
          .hero-padding { padding: 28px 24px 20px !important; }
          .main-padding { padding: 24px 24px !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }} dir="rtl">

        {/* Navbar */}
        <nav style={{ background: 'rgba(5,10,15,0.95)', borderBottom: '1px solid #1a3a50', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }} className="nav-padding">
          <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '700', color: '#00ff88', letterSpacing: '2px' }}>
            🔐 CYBER<span style={{ color: '#7090a8' }}>عربي</span>
          </span>

          {/* ===== Desktop nav ===== */}
          <div className="desktop-nav-items" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '100px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#ffd700' }}>⭐</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'white', fontSize: '14px' }}>{points}</span>
            </div>

            {/* 🏆 المتصدرون */}
            <button className="nav-btn" onClick={() => router.push('/dashboard/leaderboard')}
              style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.35)', color: '#ffd700', padding: '6px 14px', borderRadius: '100px', fontFamily: 'Cairo,sans-serif', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>
              🏆 المتصدرون
            </button>

            {/* 🛡️ Admin — يظهر فقط للـ Admin */}
            {isAdmin && (
              <button className="nav-btn" onClick={() => router.push('/dashboard/admin')}
                style={{ background: 'rgba(255,51,102,0.12)', border: '1px solid rgba(255,51,102,0.4)', color: '#ff3366', padding: '6px 14px', borderRadius: '100px', fontFamily: 'Cairo,sans-serif', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>
                🛡️ Admin
              </button>
            )}

            <button className="nav-btn" onClick={() => router.push('/dashboard/ctf')}
              style={{ background: '#0a1520', border: '1px solid #ff6b3544', color: '#ff6b35', padding: '6px 14px', borderRadius: '100px', fontFamily: 'Cairo,sans-serif', fontSize: '13px', cursor: 'pointer' }}>
              🎯 CTF
            </button>
            <button className="nav-btn" onClick={() => router.push('/dashboard/profile')}
              style={{ background: '#0a1520', border: '1px solid #1a3a50', color: '#7090a8', padding: '6px 14px', borderRadius: '100px', fontFamily: 'Cairo,sans-serif', fontSize: '13px', cursor: 'pointer' }}>
              👤 {username}
            </button>
            <button className="nav-btn" onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#ff3366', padding: '6px 14px', borderRadius: '100px', fontFamily: 'Cairo,sans-serif', fontSize: '13px', cursor: 'pointer' }}>
              خروج
            </button>
          </div>

          {/* ===== Mobile menu button ===== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="mobile-menu-btn">
            <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '100px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#ffd700', fontSize: '13px' }}>⭐</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'white', fontSize: '13px' }}>{points}</span>
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: '#0a1520', border: '1px solid #1a3a50', color: '#e0e0e0', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* ===== Mobile dropdown ===== */}
          {menuOpen && (
            <div className="mobile-menu-dropdown">
              <button onClick={() => { router.push('/dashboard/leaderboard'); setMenuOpen(false) }}
                style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.35)', color: '#ffd700', padding: '12px', borderRadius: '8px', fontFamily: 'Cairo,sans-serif', fontSize: '14px', cursor: 'pointer', textAlign: 'right', fontWeight: '700' }}>
                🏆 المتصدرون
              </button>

              {/* 🛡️ Admin في الموبايل — يظهر فقط للـ Admin */}
              {isAdmin && (
                <button onClick={() => { router.push('/dashboard/admin'); setMenuOpen(false) }}
                  style={{ background: 'rgba(255,51,102,0.12)', border: '1px solid rgba(255,51,102,0.4)', color: '#ff3366', padding: '12px', borderRadius: '8px', fontFamily: 'Cairo,sans-serif', fontSize: '14px', cursor: 'pointer', textAlign: 'right', fontWeight: '700' }}>
                  🛡️ لوحة Admin
                </button>
              )}

              <button onClick={() => { router.push('/dashboard/ctf'); setMenuOpen(false) }}
                style={{ background: '#0d1b2e', border: '1px solid #ff6b3544', color: '#ff6b35', padding: '12px', borderRadius: '8px', fontFamily: 'Cairo,sans-serif', fontSize: '14px', cursor: 'pointer', textAlign: 'right' }}>
                🎯 تحديات CTF
              </button>
              <button onClick={() => { router.push('/dashboard/profile'); setMenuOpen(false) }}
                style={{ background: '#0d1b2e', border: '1px solid #1a3a50', color: '#e0e0e0', padding: '12px', borderRadius: '8px', fontFamily: 'Cairo,sans-serif', fontSize: '14px', cursor: 'pointer', textAlign: 'right' }}>
                👤 الملف الشخصي
              </button>
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#ff3366', padding: '12px', borderRadius: '8px', fontFamily: 'Cairo,sans-serif', fontSize: '14px', cursor: 'pointer', textAlign: 'right' }}>
                🚪 خروج
              </button>
            </div>
          )}
        </nav>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,#080f18,#050a0f)', borderBottom: '1px solid #1a3a50' }} className="hero-padding">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }} className="hero-flex">
              <div className="fade-up">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '100px', padding: '4px 14px', marginBottom: '12px' }}>
                  <span style={{ animation: 'pulse 2s infinite', color: '#00ff88', fontSize: '10px' }}>●</span>
                  <span style={{ color: '#7090a8', fontSize: '12px', fontFamily: 'monospace' }}>نشط الآن</span>
                  {isAdmin && <span style={{ background: 'rgba(255,51,102,0.15)', border: '1px solid #ff336633', color: '#ff3366', padding: '1px 8px', borderRadius: '100px', fontSize: '10px', fontFamily: 'monospace' }}>ADMIN</span>}
                </div>
                <h1 className="hero-title" style={{ fontSize: '28px', fontWeight: '900', color: 'white', marginBottom: '6px' }}>
                  أهلاً، <span style={{ color: '#00ff88' }}>{username}</span> 👋
                </h1>
                <p style={{ color: '#7090a8', fontSize: '14px' }}>
                  واصل رحلتك — أنت في المستوى <span style={{ color: level.color, fontWeight: '700' }}>{level.icon} {level.label}</span>
                </p>
              </div>

              <div className="fade-up level-card-wrap" style={{ background: '#0a1520', border: `1px solid ${level.color}33`, borderRadius: '16px', padding: '18px 22px', minWidth: '240px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#7090a8', fontSize: '12px', fontFamily: 'monospace' }}>المستوى الحالي</span>
                  <span style={{ fontSize: '20px' }}>{level.icon}</span>
                </div>
                <p style={{ color: level.color, fontWeight: '900', fontSize: '20px', fontFamily: 'monospace', marginBottom: '10px' }}>{level.label}</p>
                {level.next ? (
                  <>
                    <div style={{ background: '#0f1f30', borderRadius: '2px', height: '6px', marginBottom: '8px' }}>
                      <div style={{ background: level.color, height: '6px', borderRadius: '2px', width: `${levelPercent}%`, transition: 'width 1.2s', boxShadow: `0 0 8px ${level.color}66` }}></div>
                    </div>
                    <p style={{ color: '#7090a8', fontSize: '11px', fontFamily: 'monospace' }}>{points} / {level.nextPts} نقطة للوصول لـ {level.next}</p>
                  </>
                ) : (
                  <p style={{ color: level.color, fontSize: '12px', fontFamily: 'monospace' }}>🏆 وصلت للمستوى الأعلى!</p>
                )}
              </div>
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginTop: '24px' }}>
              {[
                { label: 'النقاط', value: points, color: '#ffd700', icon: '⭐' },
                { label: 'دروس مكتملة', value: lessonsCompleted, color: '#00ff88', icon: '✓' },
                { label: 'مسارات مكتملة', value: completedCourses, color: '#00d4ff', icon: '🎯' },
                { label: 'نسبة الإنجاز', value: `${Math.round((lessonsCompleted / totalLessons) * 100)}%`, color: '#a855f7', icon: '📈' },
              ].map((stat, i) => (
                <div key={i} className="fade-up stat-card"
                  style={{ animationDelay: `${i * 0.1}s`, background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>{stat.icon}</span>
                  <div>
                    <p style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '700', color: stat.color, lineHeight: '1' }}>{stat.value}</p>
                    <p style={{ color: '#7090a8', fontSize: '11px', marginTop: '3px' }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="main-padding">
          <div className="tab-container" style={{ display: 'flex', gap: '4px', background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '10px', padding: '4px', width: 'fit-content', marginBottom: '24px' }}>
            {(['courses', 'progress'] as const).map(tab => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer', background: activeTab === tab ? '#00ff88' : 'transparent', color: activeTab === tab ? '#050a0f' : '#7090a8' }}>
                {tab === 'courses' ? '📚 المسارات' : '📊 تقدمي'}
              </button>
            ))}
          </div>

          {activeTab === 'courses' && (
            <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
              {courses.map((course, i) => {
                const done = courseProgress[course.id] || 0
                const percent = Math.round((done / course.lessons) * 100)
                const isComplete = percent === 100
                const inProgress = percent > 0 && !isComplete
                return (
                  <div key={course.id} className="course-card fade-up"
                    style={{ animationDelay: `${i * 0.08}s`, background: '#0a1520', border: `1px solid ${isComplete ? course.color + '55' : '#1a3a50'}`, borderRadius: '16px', overflow: 'hidden' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = course.color + 'aa'; e.currentTarget.style.boxShadow = `0 20px 40px ${course.color}18` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = isComplete ? course.color + '55' : '#1a3a50'; e.currentTarget.style.boxShadow = 'none' }}
                    onClick={() => window.location.href = `/dashboard/course/${course.id}`}>
                    <div style={{ background: course.bg, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: course.color + '11', borderRadius: '50%' }}></div>
                      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '40px' }}>{course.icon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                          <span style={{ background: course.color + '22', border: `1px solid ${course.color}44`, color: course.color, padding: '2px 8px', borderRadius: '100px', fontSize: '10px', fontFamily: 'monospace', fontWeight: '700' }}>{course.level}</span>
                          {isComplete && <span style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid #00ff8844', color: '#00ff88', padding: '2px 8px', borderRadius: '100px', fontSize: '10px', fontFamily: 'monospace' }}>✓ مكتمل</span>}
                          {inProgress && <span style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700', padding: '2px 8px', borderRadius: '100px', fontSize: '10px' }}>● جاري</span>}
                        </div>
                      </div>
                      <h3 style={{ position: 'relative', color: 'white', fontWeight: '900', fontSize: '15px', marginTop: '14px', lineHeight: '1.4' }}>{course.title}</h3>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#7090a8', fontSize: '12px', fontFamily: 'monospace' }}>{done}/{course.lessons} درس</span>
                        <span style={{ color: isComplete ? '#00ff88' : course.color, fontSize: '12px', fontFamily: 'monospace', fontWeight: '700' }}>{percent}%</span>
                      </div>
                      <div style={{ background: '#0f1f30', borderRadius: '2px', height: '4px', marginBottom: '14px' }}>
                        <div style={{ background: `linear-gradient(90deg,${course.color},${course.color}99)`, height: '4px', borderRadius: '2px', width: `${percent}%`, transition: 'width 1s', boxShadow: percent > 0 ? `0 0 8px ${course.color}88` : 'none' }}></div>
                      </div>
                      <button className="course-btn"
                        style={{ width: '100%', padding: '10px', border: `1px solid ${course.color}66`, borderRadius: '8px', background: isComplete ? course.color + '15' : course.color + '10', color: course.color, fontFamily: 'Cairo,sans-serif', fontSize: '13px', fontWeight: '700' }}>
                        {isComplete ? '✓ مراجعة المسار' : percent > 0 ? 'متابعة ←' : 'ابدأ المسار ←'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'progress' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ color: '#00ff88', fontFamily: 'monospace', marginBottom: '20px', fontSize: '15px' }}>// تقدمك في كل مسار</h3>
                {courses.map((course, i) => {
                  const done = courseProgress[course.id] || 0
                  const percent = Math.round((done / course.lessons) * 100)
                  return (
                    <div key={course.id} className="fade-up"
                      style={{ animationDelay: `${i * 0.07}s`, marginBottom: '18px', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                      onClick={() => window.location.href = `/dashboard/course/${course.id}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{course.icon}</span>
                          <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{course.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#7090a8', fontSize: '12px', fontFamily: 'monospace' }}>{done}/{course.lessons}</span>
                          <span style={{ color: course.color, fontSize: '12px', fontFamily: 'monospace', fontWeight: '700', minWidth: '32px' }}>{percent}%</span>
                        </div>
                      </div>
                      <div style={{ background: '#0f1f30', borderRadius: '2px', height: '5px' }}>
                        <div style={{ background: `linear-gradient(90deg,${course.color},${course.color}88)`, height: '5px', borderRadius: '2px', width: `${percent}%`, transition: 'width 1.2s', boxShadow: percent > 0 ? `0 0 8px ${course.color}66` : 'none' }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ color: '#00ff88', fontFamily: 'monospace', marginBottom: '20px', fontSize: '15px' }}>// الإنجازات</h3>
                <div className="badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
                  {[
                    { icon: '🌱', label: 'المبتدئ', desc: 'أكمل أول درس', unlocked: lessonsCompleted >= 1 },
                    { icon: '🔥', label: 'متحمس', desc: 'أكمل 5 دروس', unlocked: lessonsCompleted >= 5 },
                    { icon: '⚡', label: 'سريع', desc: 'أكمل مسار كامل', unlocked: completedCourses >= 1 },
                    { icon: '🏆', label: 'بطل', desc: '200+ نقطة', unlocked: points >= 200 },
                    { icon: '🎯', label: 'دقيق', desc: 'اجتاز اختباراً', unlocked: points >= 40 },
                    { icon: '👑', label: 'الخبير', desc: 'أكمل 3 مسارات', unlocked: completedCourses >= 3 },
                    { icon: '🔐', label: 'المشفِّر', desc: 'مسار التشفير', unlocked: (courseProgress[6] || 0) >= 1 },
                    { icon: '💻', label: 'المخترق', desc: 'مسار الاختراق', unlocked: (courseProgress[3] || 0) >= 1 },
                  ].map((badge, i) => (
                    <div key={i} className={`badge-card ${badge.unlocked ? 'unlocked' : ''} fade-up`}
                      style={{ animationDelay: `${i * 0.06}s`, background: badge.unlocked ? '#0f1f30' : '#080f18', border: `1px solid ${badge.unlocked ? '#00ff8844' : '#1a3a50'}`, borderRadius: '12px', padding: '14px 10px', textAlign: 'center', opacity: badge.unlocked ? 1 : 0.35 }}>
                      <div style={{ fontSize: '26px', marginBottom: '6px', filter: badge.unlocked ? 'drop-shadow(0 0 8px rgba(0,255,136,0.3))' : 'grayscale(1)' }}>{badge.icon}</div>
                      <p style={{ color: badge.unlocked ? 'white' : '#7090a8', fontWeight: '700', fontSize: '12px', marginBottom: '3px' }}>{badge.label}</p>
                      <p style={{ color: '#7090a8', fontSize: '10px' }}>{badge.desc}</p>
                      {badge.unlocked && <p style={{ color: '#00ff88', fontSize: '10px', fontFamily: 'monospace', marginTop: '4px' }}>✓ مفتوح</p>}
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