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
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      const name = session.user.email?.split('@')[0] || 'مستخدم'
      setDisplayName(name)
      setTempName(name)

      const { data: profile } = await supabase.from('profiles').select('points').eq('id', session.user.id).single()
      if (profile) setPoints(profile.points)

      const { data: completions } = await supabase.from('lesson_completions').select('course_id, lesson_id').eq('user_id', session.user.id)
      if (completions) {
        setLessonsCompleted(completions.length)
        const progress: Record<number, number> = {}
        completions.forEach((c: any) => { progress[parseInt(c.course_id)] = (progress[parseInt(c.course_id)] || 0) + 1 })
        setCourseProgress(progress)
      }
      setLoading(false)
    })
  }, [])

  const saveName = () => {
    if (tempName.trim()) setDisplayName(tempName.trim())
    setEditingName(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid #00ff88', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const level = getLevel(points)
  const totalLessons = courses.reduce((a, c) => a + c.lessons, 0)
  const completedCourses = courses.filter(c => (courseProgress[c.id] || 0) >= c.lessons).length
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  const badges = [
    { icon: '🌱', label: 'المبتدئ', unlocked: lessonsCompleted >= 1 },
    { icon: '🔥', label: 'متحمس', unlocked: lessonsCompleted >= 5 },
    { icon: '⚡', label: 'سريع', unlocked: completedCourses >= 1 },
    { icon: '🏆', label: 'بطل', unlocked: points >= 200 },
    { icon: '🎯', label: 'دقيق', unlocked: points >= 40 },
    { icon: '👑', label: 'الخبير', unlocked: completedCourses >= 3 },
  ]
  const unlockedBadges = badges.filter(b => b.unlocked)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; list-style:none; }
        body { font-family:'Cairo',sans-serif; background:#050a0f; color:#e0f0ff; }
        body::before { content:''; position:fixed; inset:0; background-image:linear-gradient(#1a3a5022 1px,transparent 1px),linear-gradient(90deg,#1a3a5022 1px,transparent 1px); background-size:60px 60px; z-index:0; pointer-events:none; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:#0a1520; } ::-webkit-scrollbar-thumb { background:#1a3a50; border-radius:3px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px #00ff8833} 50%{box-shadow:0 0 40px #00ff8866} }
        .fade-up { animation:fadeUp 0.4s ease both; }
        .avatar-opt { transition:all 0.2s; cursor:pointer; border:2px solid #1a3a50; border-radius:12px; padding:10px; font-size:28px; text-align:center; }
        .avatar-opt:hover { border-color:#00ff8888; transform:scale(1.1); }
        .avatar-opt.selected { border-color:#00ff88; background:rgba(0,255,136,0.1); box-shadow:0 0 16px #00ff8833; }
        .stat-box { transition:all 0.3s; }
        .stat-box:hover { transform:translateY(-3px); border-color:#00ff8844 !important; }
        .course-row { transition:all 0.2s; border-radius:8px; padding:12px; cursor:pointer; }
        .course-row:hover { background:rgba(255,255,255,0.03); }
        .back-btn { transition:all 0.2s; }
        .back-btn:hover { border-color:#00ff88 !important; color:#00ff88 !important; }
        .save-btn { transition:all 0.2s; }
        .save-btn:hover { opacity:0.85; transform:translateY(-1px); }
      `}</style>

      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }} dir="rtl">

        {/* Navbar */}
        <nav style={{ background: 'rgba(5,10,15,0.95)', borderBottom: '1px solid #1a3a50', padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '700', color: '#00ff88', letterSpacing: '2px' }}>🔐 CYBER<span style={{ color: '#7090a8' }}>عربي</span></span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="back-btn" onClick={() => router.push('/dashboard')}
              style={{ background: '#0a1520', border: '1px solid #1a3a50', color: '#7090a8', padding: '8px 20px', borderRadius: '100px', fontFamily: 'Cairo,sans-serif', fontSize: '13px', cursor: 'pointer' }}>
              ← الداشبورد
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#ff3366', padding: '8px 20px', borderRadius: '100px', fontFamily: 'Cairo,sans-serif', fontSize: '13px', cursor: 'pointer' }}>
              خروج
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px' }}>

          {/* Profile Header */}
          <div className="fade-up" style={{ background: 'linear-gradient(135deg,#0a1520,#080f18)', border: '1px solid #1a3a50', borderRadius: '20px', padding: '40px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '200px', height: '200px', background: '#00ff8808', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-60px', right: '-20px', width: '160px', height: '160px', background: '#00d4ff06', borderRadius: '50%' }}></div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg,#0f2a1a,#0a1520)', border: `3px solid ${level.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', boxShadow: `0 0 30px ${level.color}33`, animation: 'glow 3s ease-in-out infinite' }}>
                  {avatars[selectedAvatar]}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, background: level.color, borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '2px solid #050a0f' }}>
                  {level.icon}
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {editingName ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input value={tempName} onChange={e => setTempName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveName()}
                        style={{ background: '#0f1f30', border: '1px solid #00ff8866', borderRadius: '8px', padding: '6px 14px', color: 'white', fontFamily: 'Cairo,sans-serif', fontSize: '20px', fontWeight: '700', outline: 'none', width: '200px' }}
                        autoFocus />
                      <button className="save-btn" onClick={saveName}
                        style={{ background: '#00ff88', color: '#050a0f', border: 'none', borderRadius: '8px', padding: '6px 16px', fontFamily: 'Cairo,sans-serif', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                        حفظ
                      </button>
                      <button onClick={() => setEditingName(false)}
                        style={{ background: 'transparent', color: '#7090a8', border: '1px solid #1a3a50', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 style={{ fontSize: '26px', fontWeight: '900', color: 'white' }}>{displayName}</h1>
                      <button onClick={() => setEditingName(true)}
                        style={{ background: 'transparent', border: '1px solid #1a3a50', color: '#7090a8', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff8866'; e.currentTarget.style.color = '#00ff88' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3a50'; e.currentTarget.style.color = '#7090a8' }}>
                        ✏️ تعديل
                      </button>
                      {saved && <span style={{ color: '#00ff88', fontSize: '13px', fontFamily: 'monospace' }}>✓ تم الحفظ</span>}
                    </>
                  )}
                </div>
                <p style={{ color: '#7090a8', fontSize: '14px', marginBottom: '12px', fontFamily: 'monospace' }}>{user?.email}</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ background: level.color + '22', border: `1px solid ${level.color}44`, color: level.color, padding: '4px 14px', borderRadius: '100px', fontSize: '13px', fontFamily: 'monospace', fontWeight: '700' }}>
                    {level.icon} {level.label}
                  </span>
                  <span style={{ background: '#0f1f30', border: '1px solid #1a3a50', color: '#7090a8', padding: '4px 14px', borderRadius: '100px', fontSize: '12px', fontFamily: 'monospace' }}>
                    📅 انضم {joinDate}
                  </span>
                  {unlockedBadges.length > 0 && (
                    <span style={{ background: '#0f1f30', border: '1px solid #1a3a50', color: '#7090a8', padding: '4px 14px', borderRadius: '100px', fontSize: '12px', fontFamily: 'monospace' }}>
                      🏅 {unlockedBadges.length} إنجاز
                    </span>
                  )}
                </div>
              </div>

              {/* Points Badge */}
              <div style={{ background: '#0f1f30', border: '1px solid #ffd70044', borderRadius: '16px', padding: '20px 28px', textAlign: 'center' }}>
                <p style={{ color: '#ffd700', fontFamily: 'monospace', fontSize: '36px', fontWeight: '900', lineHeight: '1' }}>{points}</p>
                <p style={{ color: '#7090a8', fontSize: '13px', marginTop: '6px' }}>نقطة مكتسبة</p>
              </div>
            </div>
          </div>

          {/* Avatar Picker */}
          <div className="fade-up" style={{ animationDelay: '0.1s', background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: '14px', marginBottom: '16px' }}>// اختر أفاتار</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: '10px' }}>
              {avatars.map((av, i) => (
                <div key={i} className={`avatar-opt ${selectedAvatar === i ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(i)}>
                  {av}
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="fade-up" style={{ animationDelay: '0.15s', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'النقاط', value: points, color: '#ffd700', icon: '⭐' },
              { label: 'دروس مكتملة', value: lessonsCompleted, color: '#00ff88', icon: '📚' },
              { label: 'مسارات مكتملة', value: completedCourses, color: '#00d4ff', icon: '🎯' },
              { label: 'نسبة الإنجاز', value: `${Math.round((lessonsCompleted / totalLessons) * 100)}%`, color: '#a855f7', icon: '📈' },
            ].map((stat, i) => (
              <div key={i} className="stat-box"
                style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '12px', padding: '20px', textAlign: 'center', transition: 'all 0.3s' }}>
                <p style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</p>
                <p style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: '700', color: stat.color, lineHeight: '1', marginBottom: '6px' }}>{stat.value}</p>
                <p style={{ color: '#7090a8', fontSize: '12px' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Course Progress */}
            <div className="fade-up" style={{ animationDelay: '0.2s', background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: '14px', marginBottom: '20px' }}>// تقدم المسارات</h3>
              {courses.map(course => {
                const done = courseProgress[course.id] || 0
                const percent = Math.round((done / course.lessons) * 100)
                return (
                  <div key={course.id} className="course-row"
                    onClick={() => window.location.href = `/dashboard/course/${course.id}`}
                    style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{course.icon}</span>
                        <span style={{ color: percent === 100 ? 'white' : '#7090a8', fontSize: '13px', fontWeight: '600' }}>{course.title}</span>
                      </div>
                      <span style={{ color: course.color, fontSize: '12px', fontFamily: 'monospace', fontWeight: '700' }}>{percent}%</span>
                    </div>
                    <div style={{ background: '#0f1f30', borderRadius: '2px', height: '4px' }}>
                      <div style={{ background: course.color, height: '4px', borderRadius: '2px', width: `${percent}%`, boxShadow: percent > 0 ? `0 0 6px ${course.color}88` : 'none', transition: 'width 1s' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Badges */}
            <div className="fade-up" style={{ animationDelay: '0.25s', background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: '14px', marginBottom: '20px' }}>// الإنجازات المفتوحة</h3>
              {unlockedBadges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</p>
                  <p style={{ color: '#7090a8', fontSize: '14px' }}>أكمل دروساً لفتح الإنجازات</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                  {badges.map((badge, i) => (
                    <div key={i} style={{ background: badge.unlocked ? '#0f1f30' : '#080f18', border: `1px solid ${badge.unlocked ? '#00ff8844' : '#1a3a50'}`, borderRadius: '10px', padding: '14px', textAlign: 'center', opacity: badge.unlocked ? 1 : 0.3, transition: 'all 0.3s' }}
                      onMouseEnter={e => { if (badge.unlocked) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = '#00ff8888' } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = badge.unlocked ? '#00ff8844' : '#1a3a50' }}>
                      <div style={{ fontSize: '24px', marginBottom: '6px', filter: badge.unlocked ? 'none' : 'grayscale(1)' }}>{badge.icon}</div>
                      <p style={{ color: badge.unlocked ? 'white' : '#7090a8', fontSize: '12px', fontWeight: '700' }}>{badge.label}</p>
                      {badge.unlocked && <p style={{ color: '#00ff88', fontSize: '10px', fontFamily: 'monospace', marginTop: '4px' }}>✓</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Level Progress */}
              <div style={{ marginTop: '24px', padding: '16px', background: '#0f1f30', border: `1px solid ${level.color}33`, borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#7090a8', fontSize: '13px', fontFamily: 'monospace' }}>المستوى</span>
                  <span style={{ color: level.color, fontSize: '13px', fontFamily: 'monospace', fontWeight: '700' }}>{level.icon} {level.label}</span>
                </div>
                {level.next ? (
                  <>
                    <div style={{ background: '#1a3a50', borderRadius: '2px', height: '6px', marginBottom: '8px' }}>
                      <div style={{ background: level.color, height: '6px', borderRadius: '2px', width: `${level.nextPts ? Math.min(100, Math.round((points / level.nextPts) * 100)) : 100}%`, transition: 'width 1.2s', boxShadow: `0 0 8px ${level.color}66` }}></div>
                    </div>
                    <p style={{ color: '#7090a8', fontSize: '11px', fontFamily: 'monospace' }}>
                      {points} / {level.nextPts} للوصول لـ {level.next}
                    </p>
                  </>
                ) : (
                  <p style={{ color: level.color, fontSize: '12px', fontFamily: 'monospace' }}>🏆 وصلت للمستوى الأعلى!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}