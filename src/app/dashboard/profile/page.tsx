'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const courses = [
  { id: 1, title: 'أساسيات الأمن السيبراني', icon: '🛡️', lessons: 3, color: '#00ff88' },
  { id: 2, title: 'الشبكات وبروتوكولات TCP/IP', icon: '🌐', lessons: 2, color: '#00d4ff' },
  { id: 3, title: 'اختبار الاختراق', icon: '💻', lessons: 1, color: '#a855f7' },
  { id: 4, title: 'تحليل البرمجيات الخبيثة', icon: '🦠', lessons: 1, color: '#ff3366' },
  { id: 5, title: 'الهندسة الاجتماعية', icon: '🎭', lessons: 1, color: '#ffd700' },
  { id: 6, title: 'التشفير وعلم الكريبتو', icon: '🔐', lessons: 1, color: '#ff6ec7' },
]

const getLevel = (points: number) => {
  if (points >= 300) return { label: 'خبير', color: '#ffd700', icon: '👑', rank: 4, next: undefined, nextPts: undefined }
  if (points >= 150) return { label: 'متقدم', color: '#a855f7', icon: '⚡', rank: 3, next: 'خبير', nextPts: 300 }
  if (points >= 50)  return { label: 'متوسط', color: '#00d4ff', icon: '🔥', rank: 2, next: 'متقدم', nextPts: 150 }
  return { label: 'مبتدئ', color: '#00ff88', icon: '🌱', rank: 1, next: 'متوسط', nextPts: 50 }
}

const avatars = ['🧑‍💻', '👨‍💻', '👩‍💻', '🕵️', '🦾', '🤖', '👾', '🎯']

const badgeList = [
  { icon: '🌱', label: 'المبتدئ', desc: 'أكمل أول درس', color: '#00ff88', check: (l: number) => l >= 1 },
  { icon: '🔥', label: 'متحمس', desc: '5 دروس مكتملة', color: '#ff6b35', check: (l: number) => l >= 5 },
  { icon: '⚡', label: 'سريع', desc: 'أكمل مسار كامل', color: '#a855f7', check: (_l: number, c: number) => c >= 1 },
  { icon: '🏆', label: 'بطل', desc: '200+ نقطة', color: '#ffd700', check: (_l: number, _c: number, p: number) => p >= 200 },
  { icon: '🎯', label: 'دقيق', desc: 'اجتاز اختباراً', color: '#00d4ff', check: (_l: number, _c: number, p: number) => p >= 40 },
  { icon: '👑', label: 'الخبير', desc: 'أكمل 3 مسارات', color: '#ffd700', check: (_l: number, c: number) => c >= 3 },
]

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [lessonsCompleted, setLessonsCompleted] = useState(0)
  const [courseProgress, setCourseProgress] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedAvatar, setSelectedAvatar] = useState(0)
  const [editingName, setEditingName] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [tempName, setTempName] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)

      // ── جلب البروفايل من Supabase ──
      const { data: profile } = await supabase
        .from('profiles')
        .select('points, username, avatar')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setPoints(profile.points || 0)
        // استخدم username من profiles أولاً، ثم email prefix
        const name = profile.username || session.user.email?.split('@')[0] || 'مستخدم'
        setDisplayName(name)
        setTempName(name)
        // تعيين الـ avatar المحفوظ لو موجود
        const savedAvatarIdx = avatars.indexOf(profile.avatar)
        if (savedAvatarIdx !== -1) setSelectedAvatar(savedAvatarIdx)
      } else {
        const name = session.user.email?.split('@')[0] || 'مستخدم'
        setDisplayName(name)
        setTempName(name)
      }

      const { data: completions } = await supabase
        .from('lesson_completions')
        .select('course_id, lesson_id')
        .eq('user_id', session.user.id)

      if (completions) {
        setLessonsCompleted(completions.length)
        const progress: Record<number, number> = {}
        completions.forEach((c: any) => {
          progress[parseInt(c.course_id)] = (progress[parseInt(c.course_id)] || 0) + 1
        })
        setCourseProgress(progress)
      }
      setLoading(false)
    })
  }, [])

  // ✅ الحفظ الحقيقي في Supabase
  const saveName = async () => {
    if (!tempName.trim()) return
    setSaving(true)
    setSaveError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase
      .from('profiles')
      .update({ username: tempName.trim() })
      .eq('id', session.user.id)

    if (error) {
      setSaveError('فشل الحفظ: ' + error.message)
      setSaving(false)
      return
    }

    setDisplayName(tempName.trim())
    setEditingName(false)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ✅ حفظ الـ avatar في Supabase
  const saveAvatar = async (idx: number) => {
    setSelectedAvatar(idx)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase
      .from('profiles')
      .update({ avatar: avatars[idx] })
      .eq('id', session.user.id)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <div style={{ position: 'relative', width: '56px', height: '56px' }}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid #00ff8815', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ position: 'absolute', inset: '10px', border: '2px solid transparent', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }}></div>
      </div>
      <p style={{ color: '#7090a8', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '2px' }}>LOADING...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const level = getLevel(points)
  const totalLessons = courses.reduce((a, c) => a + c.lessons, 0)
  const completedCourses = courses.filter(c => (courseProgress[c.id] || 0) >= c.lessons).length
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
  const levelPercent = level.nextPts ? Math.min(100, Math.round((points / level.nextPts) * 100)) : 100
  const overallPercent = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0
  const badges = badgeList.map(b => ({ ...b, unlocked: b.check(lessonsCompleted, completedCourses, points) }))
  const unlockedCount = badges.filter(b => b.unlocked).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; list-style:none; }
        body { font-family:'Cairo',sans-serif; background:#050a0f; color:#e0f0ff; overflow-x:hidden; }
        .bg-grid { position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image: linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px);
          background-size:50px 50px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 30%, black, transparent); }
        .bg-glow { position:fixed; top:-150px; right:-150px; width:500px; height:500px; background:radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%); pointer-events:none; z-index:0; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:#050a0f; } ::-webkit-scrollbar-thumb { background:#1a3a50; border-radius:10px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes avatarGlow { 0%,100%{box-shadow:0 0 20px rgba(0,255,136,0.2)} 50%{box-shadow:0 0 40px rgba(0,255,136,0.45)} }
        .fade-up { animation:fadeUp 0.45s cubic-bezier(0.4,0,0.2,1) both; }
        .avatar-opt { transition:all 0.25s; cursor:pointer; border:2px solid #1a3a50; border-radius:14px; padding:10px; font-size:26px; text-align:center; background:#080f18; }
        .avatar-opt:hover { border-color:#00ff8866; transform:scale(1.12) translateY(-2px); }
        .avatar-opt.sel { border-color:#00ff88; background:rgba(0,255,136,0.1); box-shadow:0 0 20px rgba(0,255,136,0.25); }
        .course-row { transition:all 0.25s; border-radius:10px; padding:12px 14px; cursor:pointer; border:1px solid transparent; }
        .course-row:hover { background:rgba(255,255,255,0.03); border-color:#1a3a5066; }
        .stat-box { transition:all 0.3s; position:relative; overflow:hidden; }
        .stat-box:hover { transform:translateY(-4px); }
        .badge-item { transition:all 0.3s; border-radius:14px; padding:16px 10px; text-align:center; position:relative; overflow:hidden; }
        .badge-item.unlocked:hover { transform:translateY(-4px) scale(1.03); }
        .nav-btn { transition:all 0.2s; border-radius:100px; padding:8px 18px; font-family:'Cairo',sans-serif; font-size:13px; cursor:pointer; font-weight:700; border:1px solid; }
        .nav-btn:hover { transform:translateY(-1px); filter:brightness(1.15); }
        @media (max-width:768px) {
          .navbar { padding:0 16px !important; }
          .main-wrap { padding:20px 16px !important; }
          .hero-inner { flex-direction:column !important; gap:20px !important; }
          .pts-badge { width:100% !important; text-align:center !important; }
          .stats-4 { grid-template-columns:repeat(2,1fr) !important; gap:10px !important; }
          .two-col { grid-template-columns:1fr !important; }
          .avatar-grid { grid-template-columns:repeat(4,1fr) !important; }
        }
      `}</style>

      <div className="bg-grid"></div>
      <div className="bg-glow"></div>

      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }} dir="rtl">

        {/* Navbar */}
        <nav className="navbar" style={{ background: 'rgba(5,10,15,0.88)', borderBottom: '1px solid rgba(26,58,80,0.7)', padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(24px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: '700', letterSpacing: '2px' }}>
            <span style={{ fontSize: '20px' }}>🔐</span>
            <span style={{ color: '#00ff88', textShadow: '0 0 20px rgba(0,255,136,0.4)' }}>CYBER</span>
            <span style={{ color: '#7090a8' }}>عربي</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="nav-btn" onClick={() => router.push('/dashboard')}
              style={{ background: 'rgba(26,58,80,0.4)', borderColor: '#1a3a5088', color: '#a0c0d8' }}>
              ← الداشبورد
            </button>
            <button className="nav-btn" onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              style={{ background: 'rgba(255,51,102,0.08)', borderColor: 'rgba(255,51,102,0.25)', color: '#ff3366' }}>
              خروج
            </button>
          </div>
        </nav>

        <div className="main-wrap" style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 40px' }}>

          {/* HERO */}
          <div className="fade-up" style={{ background: 'linear-gradient(135deg, rgba(10,21,32,0.95), rgba(8,15,24,0.95))', border: `1px solid ${level.color}25`, borderRadius: '22px', padding: '36px 40px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '240px', height: '240px', background: `radial-gradient(circle, ${level.color}10 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${level.color}60, transparent)` }}></div>

            <div className="hero-inner" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: `linear-gradient(135deg, #0f2a1a, #0a1520)`, border: `3px solid ${level.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px', animation: 'avatarGlow 3s ease-in-out infinite' }}>
                  {avatars[selectedAvatar]}
                </div>
                <div style={{ position: 'absolute', bottom: 2, left: 2, background: level.color, borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '3px solid #050a0f', animation: 'float 3s ease-in-out infinite' }}>
                  {level.icon}
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {editingName ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input value={tempName} onChange={e => setTempName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveName()}
                        style={{ background: '#0f1f30', border: '1px solid #00ff8855', borderRadius: '10px', padding: '8px 16px', color: 'white', fontFamily: 'Cairo, sans-serif', fontSize: '20px', fontWeight: '700', outline: 'none', width: '200px' }}
                        autoFocus />
                      <button onClick={saveName} disabled={saving}
                        style={{ background: saving ? 'rgba(0,255,136,0.4)' : '#00ff88', color: '#050a0f', border: 'none', borderRadius: '10px', padding: '8px 18px', fontFamily: 'Cairo, sans-serif', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {saving ? (
                          <><span style={{ width: '12px', height: '12px', border: '2px solid rgba(5,10,15,0.3)', borderTopColor: '#050a0f', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}></span> جاري...</>
                        ) : '💾 حفظ'}
                      </button>
                      <button onClick={() => { setEditingName(false); setTempName(displayName); setSaveError('') }}
                        style={{ background: 'transparent', color: '#7090a8', border: '1px solid #1a3a50', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '14px' }}>
                        إلغاء
                      </button>
                      {saveError && <span style={{ color: '#ff6b6b', fontSize: '12px', fontFamily: 'monospace' }}>⚠ {saveError}</span>}
                    </div>
                  ) : (
                    <>
                      <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>{displayName}</h1>
                      <button onClick={() => setEditingName(true)}
                        style={{ background: 'transparent', border: '1px solid #1a3a50', color: '#7090a8', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff8866'; e.currentTarget.style.color = '#00ff88' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3a50'; e.currentTarget.style.color = '#7090a8' }}>
                        ✏️ تعديل
                      </button>
                      {saved && (
                        <span style={{ color: '#00ff88', fontSize: '13px', fontFamily: 'monospace', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', padding: '3px 10px', borderRadius: '8px' }}>
                          ✓ تم الحفظ في قاعدة البيانات
                        </span>
                      )}
                    </>
                  )}
                </div>
                <p style={{ color: '#7090a8', fontSize: '13px', marginBottom: '14px', fontFamily: 'Space Mono, monospace' }}>{user?.email}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: `${level.color}18`, border: `1px solid ${level.color}35`, color: level.color, padding: '4px 14px', borderRadius: '100px', fontSize: '13px', fontFamily: 'Space Mono, monospace', fontWeight: '700' }}>
                    {level.icon} {level.label}
                  </span>
                  <span style={{ background: 'rgba(26,58,80,0.5)', border: '1px solid #1a3a5088', color: '#7090a8', padding: '4px 14px', borderRadius: '100px', fontSize: '12px', fontFamily: 'Space Mono, monospace' }}>
                    📅 {joinDate}
                  </span>
                  <span style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', color: '#ffd700', padding: '4px 14px', borderRadius: '100px', fontSize: '12px', fontFamily: 'Space Mono, monospace' }}>
                    🏅 {unlockedCount}/6 إنجاز
                  </span>
                </div>
              </div>

              {/* Points */}
              <div className="pts-badge" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05))', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '18px', padding: '22px 32px', textAlign: 'center', flexShrink: 0 }}>
                <p style={{ color: '#ffd700', fontFamily: 'Space Mono, monospace', fontSize: '40px', fontWeight: '700', lineHeight: '1', textShadow: '0 0 30px rgba(255,215,0,0.4)' }}>{points}</p>
                <p style={{ color: 'rgba(255,215,0,0.5)', fontSize: '11px', marginTop: '6px', letterSpacing: '1px', fontFamily: 'Space Mono, monospace' }}>POINTS</p>
              </div>
            </div>
          </div>

          {/* AVATAR PICKER */}
          <div className="fade-up" style={{ animationDelay: '0.08s', background: 'rgba(10,21,32,0.8)', border: '1px solid #1a3a50', borderRadius: '18px', padding: '24px', marginBottom: '20px', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#00ff88', fontFamily: 'Space Mono, monospace', fontSize: '13px', letterSpacing: '1px' }}>// AVATAR</h3>
              <span style={{ color: '#3a5a70', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>يُحفظ تلقائياً ✓</span>
            </div>
            <div className="avatar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: '10px' }}>
              {avatars.map((av, i) => (
                <div key={i} className={`avatar-opt ${selectedAvatar === i ? 'sel' : ''}`} onClick={() => saveAvatar(i)}>{av}</div>
              ))}
            </div>
          </div>

          {/* STATS */}
          <div className="fade-up stats-4" style={{ animationDelay: '0.12s', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'النقاط', value: points, color: '#ffd700', icon: '⭐', suffix: 'pts' },
              { label: 'دروس مكتملة', value: lessonsCompleted, color: '#00ff88', icon: '📚', suffix: `/${totalLessons}` },
              { label: 'مسارات مكتملة', value: completedCourses, color: '#00d4ff', icon: '🎯', suffix: '/6' },
              { label: 'الإنجاز الكلي', value: overallPercent, color: '#a855f7', icon: '📈', suffix: '%' },
            ].map((stat, i) => (
              <div key={i} className="stat-box" style={{ background: 'rgba(10,21,32,0.8)', border: '1px solid #1a3a50', borderRadius: '14px', padding: '20px 16px', backdropFilter: 'blur(10px)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${stat.color}40`; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${stat.color}15` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1a3a50'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '26px', fontWeight: '700', color: stat.color, textShadow: `0 0 20px ${stat.color}40` }}>{stat.value}</span>
                  <span style={{ color: `${stat.color}50`, fontSize: '12px', fontFamily: 'Space Mono, monospace' }}>{stat.suffix}</span>
                </div>
                <p style={{ color: '#7090a8', fontSize: '11px', marginTop: '4px' }}>{stat.label}</p>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${stat.color}40, transparent)`, borderRadius: '0 0 14px 14px' }}></div>
              </div>
            ))}
          </div>

          {/* TWO COLUMNS */}
          <div className="fade-up two-col" style={{ animationDelay: '0.18s', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

            {/* Course Progress */}
            <div style={{ background: 'rgba(10,21,32,0.8)', border: '1px solid #1a3a50', borderRadius: '18px', padding: '24px', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#00ff88', fontFamily: 'Space Mono, monospace', fontSize: '13px', letterSpacing: '1px' }}>// TRACKS</h3>
                <span style={{ color: '#1a3a50', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>{completedCourses}/6</span>
              </div>
              {courses.map(course => {
                const done = courseProgress[course.id] || 0
                const percent = Math.round((done / course.lessons) * 100)
                return (
                  <div key={course.id} className="course-row" onClick={() => router.push(`/dashboard/course/${course.id}`)} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{course.icon}</span>
                        <span style={{ color: percent === 100 ? 'white' : '#7090a8', fontSize: '13px', fontWeight: '600' }}>{course.title}</span>
                      </div>
                      <span style={{ color: course.color, fontSize: '12px', fontFamily: 'Space Mono, monospace', fontWeight: '700' }}>{percent}%</span>
                    </div>
                    <div style={{ background: '#0a1520', borderRadius: '3px', height: '4px' }}>
                      <div style={{ background: `linear-gradient(90deg, ${course.color}, ${course.color}77)`, height: '4px', borderRadius: '3px', width: `${percent}%`, boxShadow: percent > 0 ? `0 0 6px ${course.color}77` : 'none', transition: 'width 1s' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Badges + Level */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(10,21,32,0.8)', border: '1px solid #1a3a50', borderRadius: '18px', padding: '24px', backdropFilter: 'blur(10px)', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: '#00ff88', fontFamily: 'Space Mono, monospace', fontSize: '13px', letterSpacing: '1px' }}>// BADGES</h3>
                  <span style={{ color: '#1a3a50', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>{unlockedCount}/6</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                  {badges.map((badge, i) => (
                    <div key={i} className={`badge-item ${badge.unlocked ? 'unlocked' : ''}`}
                      style={{ background: badge.unlocked ? `linear-gradient(135deg, ${badge.color}15, ${badge.color}08)` : 'rgba(8,15,24,0.8)', border: `1px solid ${badge.unlocked ? badge.color + '35' : '#1a3a50'}`, opacity: badge.unlocked ? 1 : 0.28 }}>
                      {badge.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${badge.color}70, transparent)` }}></div>}
                      <div style={{ fontSize: '26px', marginBottom: '6px', filter: badge.unlocked ? `drop-shadow(0 0 8px ${badge.color}66)` : 'grayscale(1)' }}>{badge.icon}</div>
                      <p style={{ color: badge.unlocked ? 'white' : '#7090a8', fontWeight: '700', fontSize: '12px', marginBottom: '3px' }}>{badge.label}</p>
                      <p style={{ color: '#7090a8', fontSize: '10px', lineHeight: '1.3' }}>{badge.desc}</p>
                      {badge.unlocked && <p style={{ color: badge.color, fontSize: '10px', fontFamily: 'Space Mono, monospace', marginTop: '5px' }}>✓ مفتوح</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Progress */}
              <div style={{ background: `linear-gradient(135deg, ${level.color}10, ${level.color}05)`, border: `1px solid ${level.color}25`, borderRadius: '18px', padding: '22px', backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${level.color}60, transparent)` }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ color: level.color, fontFamily: 'Space Mono, monospace', fontSize: '13px', letterSpacing: '1px' }}>// LEVEL</h3>
                  <span style={{ color: level.color, fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: '700' }}>{level.icon} {level.label}</span>
                </div>
                {level.next ? (
                  <>
                    <div style={{ background: 'rgba(10,21,32,0.6)', borderRadius: '4px', height: '8px', marginBottom: '10px', overflow: 'hidden' }}>
                      <div style={{ background: `linear-gradient(90deg, ${level.color}, ${level.color}88)`, height: '8px', borderRadius: '4px', width: `${levelPercent}%`, transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 12px ${level.color}88` }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7090a8', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{points} pts</span>
                      <span style={{ color: `${level.color}80`, fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{level.nextPts} → {level.next}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: `${level.color}10`, border: `1px solid ${level.color}25`, borderRadius: '10px', padding: '10px 14px' }}>
                    <span style={{ fontSize: '20px' }}>🏆</span>
                    <span style={{ color: level.color, fontSize: '13px', fontWeight: '700' }}>وصلت للمستوى الأعلى!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}