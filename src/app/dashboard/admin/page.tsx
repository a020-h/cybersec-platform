'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type User = { id: string; username: string; points: number; avatar: string; is_admin: boolean; created_at: string }
type Lesson = { id: string; course_id: string; title: string; order_num: number }
type CTFChallenge = { title: string; description: string; category: string; points: number; flag: string; difficulty: string; hints: string }
type CourseStats = { course_id: string; completions: number; name: string; color: string }

const COURSE_NAMES: Record<string, { name: string; color: string }> = {
  '00000000-0000-0000-0000-000000000001': { name: '🛡️ أساسيات الأمن', color: '#00ff88' },
  '00000000-0000-0000-0000-000000000002': { name: '🌐 الشبكات', color: '#00d4ff' },
  '00000000-0000-0000-0000-000000000003': { name: '💻 اختبار الاختراق', color: '#a855f7' },
  '00000000-0000-0000-0000-000000000004': { name: '🦠 البرمجيات الخبيثة', color: '#ff3366' },
  '00000000-0000-0000-0000-000000000005': { name: '🎭 الهندسة الاجتماعية', color: '#ffd700' },
  '00000000-0000-0000-0000-000000000006': { name: '🔐 التشفير', color: '#ff6ec7' },
}

const POINT_RANGES = [
  { label: 'مبتدئ', min: 0, max: 99, color: '#7090a8' },
  { label: 'متوسط', min: 100, max: 299, color: '#00d4ff' },
  { label: 'متقدم', min: 300, max: 599, color: '#a855f7' },
  { label: 'خبير', min: 600, max: 999, color: '#ffd700' },
  { label: 'أسطورة', min: 1000, max: Infinity, color: '#ff3366' },
]

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'lessons' | 'ctf'>('stats')
  const [users, setUsers] = useState<User[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, totalPoints: 0, totalLessons: 0, totalCompletions: 0 })
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [levelDist, setLevelDist] = useState<{ label: string; count: number; color: string }[]>([])
  const [topCompletors, setTopCompletors] = useState<{ username: string; avatar: string; count: number }[]>([])
  const [ctf, setCTF] = useState<CTFChallenge>({ title: '', description: '', category: 'web', points: 50, flag: '', difficulty: 'سهل', hints: '' })
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [deletingUser, setDeletingUser] = useState<string | null>(null)
  const [deletingLesson, setDeletingLesson] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }
      await loadAll()
      setLoading(false)
    }
    init()
  }, [])

  const loadAll = async () => {
    const { data: usersData } = await supabase.from('profiles').select('*').order('points', { ascending: false })
    if (usersData) {
      setUsers(usersData)
      // Level distribution
      const dist = POINT_RANGES.map(r => ({
        label: r.label,
        color: r.color,
        count: usersData.filter(u => u.points >= r.min && u.points <= r.max).length
      }))
      setLevelDist(dist)
    }

    const { data: lessonsData } = await supabase.from('lessons').select('id, course_id, title, order_num').order('course_id').order('order_num')
    if (lessonsData) setLessons(lessonsData)

    // Course completions stats
    const { data: completionsData } = await supabase.from('lesson_completions').select('course_id')
    if (completionsData) {
      const counts: Record<string, number> = {}
      completionsData.forEach(c => {
        counts[c.course_id] = (counts[c.course_id] || 0) + 1
      })
      const cs = Object.entries(COURSE_NAMES).map(([id, info]) => ({
        course_id: id,
        name: info.name,
        color: info.color,
        completions: counts[id] || 0,
      })).sort((a, b) => b.completions - a.completions)
      setCourseStats(cs)
    }

    // Top completors
    const { data: compByUser } = await supabase.from('lesson_completions').select('user_id')
    if (compByUser && usersData) {
      const userCounts: Record<string, number> = {}
      compByUser.forEach(c => { userCounts[c.user_id] = (userCounts[c.user_id] || 0) + 1 })
      const top = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([uid, count]) => {
          const u = usersData.find(x => x.id === uid)
          return { username: u?.username || 'مجهول', avatar: u?.avatar || '🧑‍💻', count }
        })
      setTopCompletors(top)
    }

    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { data: pointsData } = await supabase.from('profiles').select('points')
    const { count: lessonsCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true })
    const { count: completionsCount } = await supabase.from('lesson_completions').select('*', { count: 'exact', head: true })
    setStats({
      totalUsers: usersCount || 0,
      totalPoints: pointsData?.reduce((sum, p) => sum + (p.points || 0), 0) || 0,
      totalLessons: lessonsCount || 0,
      totalCompletions: completionsCount || 0,
    })
  }

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type)
    setTimeout(() => setMsg(''), 3500)
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
    setDeletingUser(userId)
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) showMsg('فشل الحذف: ' + error.message, 'error')
    else { showMsg('تم حذف المستخدم ✓'); await loadAll() }
    setDeletingUser(null)
  }

  const toggleAdmin = async (userId: string, currentVal: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_admin: !currentVal }).eq('id', userId)
    if (error) showMsg('فشل التحديث', 'error')
    else { showMsg(!currentVal ? 'تم تعيينه Admin ✓' : 'تم إزالة Admin ✓'); await loadAll() }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return
    setDeletingLesson(lessonId)
    await supabase.from('questions').delete().eq('lesson_id', lessonId)
    await supabase.from('lesson_completions').delete().eq('lesson_id', lessonId)
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
    if (error) showMsg('فشل الحذف: ' + error.message, 'error')
    else { showMsg('تم حذف الدرس ✓'); await loadAll() }
    setDeletingLesson(null)
  }

  const saveLesson = async () => {
    if (!editingLesson || !editTitle.trim()) return
    const { error } = await supabase.from('lessons').update({ title: editTitle }).eq('id', editingLesson.id)
    if (error) showMsg('فشل التحديث', 'error')
    else { showMsg('تم تحديث الدرس ✓'); setEditingLesson(null); await loadAll() }
  }

  const addCTF = async () => {
    if (!ctf.title || !ctf.flag || !ctf.description) { showMsg('يرجى ملء جميع الحقول المطلوبة', 'error'); return }
    const { error } = await supabase.from('ctf_challenges').insert({
      title: ctf.title, description: ctf.description, category: ctf.category,
      points: ctf.points, flag: ctf.flag, difficulty: ctf.difficulty,
      hints: ctf.hints ? [ctf.hints] : [], is_active: true,
    })
    if (error) showMsg('فشل الإضافة: ' + error.message, 'error')
    else { showMsg('تم إضافة التحدي بنجاح ✓'); setCTF({ title: '', description: '', category: 'web', points: 50, flag: '', difficulty: 'سهل', hints: '' }) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <div style={{ position: 'relative', width: '56px', height: '56px' }}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(255,51,102,0.15)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTopColor: '#ff3366', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ position: 'absolute', inset: '10px', border: '2px solid transparent', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }}></div>
      </div>
      <p style={{ color: '#7090a8', fontFamily: 'Space Mono, monospace', fontSize: '12px', letterSpacing: '2px' }}>CHECKING ACCESS...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(5,10,15,0.8)', border: '1px solid #1a3a50', borderRadius: '10px', padding: '11px 15px', color: '#e0f0ff', fontFamily: 'Cairo, sans-serif', fontSize: '14px', outline: 'none', direction: 'rtl', transition: 'border-color 0.2s' }
  const lbl: React.CSSProperties = { color: '#7090a8', fontSize: '12px', marginBottom: '7px', display: 'block', fontFamily: 'Space Mono, monospace', letterSpacing: '0.5px' }

  const maxCompletions = Math.max(...courseStats.map(c => c.completions), 1)
  const maxLevelCount = Math.max(...levelDist.map(l => l.count), 1)

  const tabs = [
    { key: 'stats',   label: '📊', text: 'الإحصائيات' },
    { key: 'users',   label: '👥', text: 'المستخدمون' },
    { key: 'lessons', label: '📝', text: 'الدروس' },
    { key: 'ctf',     label: '🎯', text: 'إضافة CTF' },
  ] as const

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; list-style:none; }
        body { font-family:'Cairo',sans-serif; background:#050a0f; color:#e0f0ff; overflow-x:hidden; }
        .bg-grid { position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:linear-gradient(rgba(255,51,102,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,51,102,0.025) 1px,transparent 1px);
          background-size:60px 60px;
          mask-image:radial-gradient(ellipse 80% 50% at 50% 0%,black,transparent); }
        .bg-glow { position:fixed; top:-200px; left:50%; transform:translateX(-50%); width:700px; height:400px; background:radial-gradient(ellipse,rgba(255,51,102,0.06) 0%,transparent 70%); pointer-events:none; z-index:0; }
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:#050a0f;} ::-webkit-scrollbar-thumb{background:#1a3a50;border-radius:10px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes barGrow{from{width:0}to{width:var(--w)}}
        .fade-up{animation:fadeUp 0.45s cubic-bezier(0.4,0,0.2,1) both;}
        .tab-btn{transition:all 0.25s cubic-bezier(0.4,0,0.2,1);cursor:pointer;border:none;font-family:'Cairo',sans-serif;}
        .row-hover{transition:background 0.2s;}
        .row-hover:hover{background:rgba(255,51,102,0.03)!important;}
        .act-btn{transition:all 0.2s;cursor:pointer;font-family:'Cairo',sans-serif;}
        .act-btn:hover{filter:brightness(1.15);transform:translateY(-1px);}
        input:focus,select:focus,textarea:focus{border-color:rgba(255,51,102,0.4)!important;box-shadow:0 0 0 3px rgba(255,51,102,0.06);}
        .bar-fill{animation:barGrow 1s cubic-bezier(0.4,0,0.2,1) both;}
        @media(max-width:768px){
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
          .ctf-grid{grid-template-columns:1fr!important;}
          .charts-grid{grid-template-columns:1fr!important;}
          .page-wrap{padding:80px 16px 40px!important;}
          .navbar{padding:0 16px!important;}
          .tab-text{display:none;}
        }
      `}</style>

      <div className="bg-grid"></div>
      <div className="bg-glow"></div>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(5,10,15,0.9)', borderBottom: '1px solid rgba(255,51,102,0.2)', backdropFilter: 'blur(24px)', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }} className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '17px', fontWeight: '700', color: '#ff3366', letterSpacing: '2px', textShadow: '0 0 20px rgba(255,51,102,0.4)' }}>🛡️ ADMIN</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '17px', fontWeight: '700', color: '#7090a8', letterSpacing: '2px' }}>PANEL</span>
          <span style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '2px 10px', borderRadius: '100px', fontSize: '10px', fontFamily: 'Space Mono, monospace', letterSpacing: '1px', animation: 'pulse 3s infinite' }}>RESTRICTED</span>
        </div>
        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'rgba(26,58,80,0.4)', border: '1px solid #1a3a5088', color: '#a0c0d8', padding: '8px 18px', borderRadius: '100px', fontFamily: 'Cairo, sans-serif', fontSize: '13px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }}>
          ← الداشبورد
        </button>
      </nav>

      {/* Toast */}
      {msg && (
        <div style={{ position: 'fixed', top: '76px', left: '50%', transform: 'translateX(-50%)', background: msgType === 'success' ? 'rgba(0,255,136,0.12)' : 'rgba(255,51,102,0.12)', border: `1px solid ${msgType === 'success' ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`, color: msgType === 'success' ? '#00ff88' : '#ff6b6b', padding: '12px 28px', borderRadius: '100px', fontFamily: 'Space Mono, monospace', fontSize: '13px', zIndex: 999, backdropFilter: 'blur(20px)', animation: 'slideDown 0.3s ease', whiteSpace: 'nowrap' }}>
          {msgType === 'success' ? '✓' : '✗'} {msg}
        </div>
      )}

      <div dir="rtl" className="page-wrap" style={{ maxWidth: '1200px', margin: '0 auto', padding: '90px 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(8,15,24,0.8)', border: '1px solid #1a3a50', borderRadius: '14px', padding: '6px', marginBottom: '30px', width: 'fit-content', backdropFilter: 'blur(10px)' }}>
          {tabs.map(tab => (
            <button key={tab.key} className="tab-btn"
              onClick={() => setActiveTab(tab.key)}
              style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', background: activeTab === tab.key ? '#ff3366' : 'transparent', color: activeTab === tab.key ? 'white' : '#7090a8', boxShadow: activeTab === tab.key ? '0 4px 20px rgba(255,51,102,0.3)' : 'none' }}>
              <span>{tab.label}</span> <span className="tab-text">{tab.text}</span>
            </button>
          ))}
        </div>

        {/* ===== STATS ===== */}
        {activeTab === 'stats' && (
          <div className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '3px', height: '20px', background: '#ff3366', borderRadius: '2px' }}></div>
              <h2 style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>إحصائيات المنصة</h2>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'المستخدمون', value: stats.totalUsers, icon: '👥', color: '#00ff88', sub: 'مسجل' },
                { label: 'إجمالي النقاط', value: stats.totalPoints.toLocaleString(), icon: '⭐', color: '#ffd700', sub: 'نقطة' },
                { label: 'الدروس', value: stats.totalLessons, icon: '📚', color: '#00d4ff', sub: 'درس' },
                { label: 'الإتمامات', value: stats.totalCompletions, icon: '✓', color: '#a855f7', sub: 'مكتمل' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(10,21,32,0.8)', border: `1px solid ${s.color}25`, borderRadius: '18px', padding: '26px 20px', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${s.color}60, transparent)` }}></div>
                  <div style={{ fontSize: '32px', marginBottom: '14px' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '30px', fontWeight: '700', color: s.color, marginBottom: '4px', textShadow: `0 0 20px ${s.color}40` }}>{s.value}</div>
                  <div style={{ color: '#7090a8', fontSize: '12px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

              {/* Course Completions Bar Chart */}
              <div style={{ background: 'rgba(10,21,32,0.8)', border: '1px solid #1a3a50', borderRadius: '18px', padding: '26px', backdropFilter: 'blur(10px)' }}>
                <p style={{ color: '#7090a8', fontFamily: 'Space Mono, monospace', fontSize: '11px', letterSpacing: '1px', marginBottom: '20px' }}>// إتمامات الدروس حسب المسار</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {courseStats.map((c, i) => (
                    <div key={c.course_id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#a0c0d8', fontSize: '12px', fontFamily: 'Cairo, sans-serif' }}>{c.name}</span>
                        <span style={{ color: c.color, fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: '700' }}>{c.completions}</span>
                      </div>
                      <div style={{ background: 'rgba(26,58,80,0.4)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div
                          className="bar-fill"
                          style={{
                            height: '100%',
                            borderRadius: '4px',
                            background: `linear-gradient(90deg, ${c.color}99, ${c.color})`,
                            width: `${(c.completions / maxCompletions) * 100}%`,
                            boxShadow: `0 0 8px ${c.color}55`,
                            ['--w' as any]: `${(c.completions / maxCompletions) * 100}%`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Distribution */}
              <div style={{ background: 'rgba(10,21,32,0.8)', border: '1px solid #1a3a50', borderRadius: '18px', padding: '26px', backdropFilter: 'blur(10px)' }}>
                <p style={{ color: '#7090a8', fontFamily: 'Space Mono, monospace', fontSize: '11px', letterSpacing: '1px', marginBottom: '20px' }}>// توزيع مستويات المستخدمين</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {levelDist.map((l, i) => (
                    <div key={l.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: l.color, fontSize: '12px', fontFamily: 'Cairo, sans-serif', fontWeight: '700' }}>{l.label}</span>
                        <span style={{ color: '#a0c0d8', fontFamily: 'Space Mono, monospace', fontSize: '12px' }}>{l.count} مستخدم</span>
                      </div>
                      <div style={{ background: 'rgba(26,58,80,0.4)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div
                          className="bar-fill"
                          style={{
                            height: '100%',
                            borderRadius: '4px',
                            background: `linear-gradient(90deg, ${l.color}77, ${l.color})`,
                            width: `${(l.count / maxLevelCount) * 100}%`,
                            boxShadow: `0 0 8px ${l.color}44`,
                            ['--w' as any]: `${(l.count / maxLevelCount) * 100}%`,
                            animationDelay: `${i * 0.08}s`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Avg points */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #1a3a50', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#7090a8', fontSize: '12px', fontFamily: 'Space Mono, monospace' }}>متوسط النقاط</span>
                  <span style={{ color: '#ffd700', fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: '700' }}>
                    {stats.totalUsers > 0 ? Math.round(stats.totalPoints / stats.totalUsers) : 0} ⭐
                  </span>
                </div>
              </div>
            </div>

            {/* Top completors + Top users row */}
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Top completors */}
              <div style={{ background: 'rgba(10,21,32,0.8)', border: '1px solid #1a3a50', borderRadius: '18px', padding: '26px', backdropFilter: 'blur(10px)' }}>
                <p style={{ color: '#7090a8', fontFamily: 'Space Mono, monospace', fontSize: '11px', letterSpacing: '1px', marginBottom: '18px' }}>// الأكثر إتماماً للدروس</p>
                {topCompletors.length === 0 ? (
                  <p style={{ color: '#3a5a70', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>لا توجد بيانات بعد</p>
                ) : topCompletors.map((u, i) => (
                  <div key={i} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', color: i === 0 ? '#ffd700' : '#3a5a70', fontSize: '16px', minWidth: '24px' }}>
                      {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </span>
                    <span style={{ fontSize: '18px' }}>{u.avatar}</span>
                    <span style={{ flex: 1, color: 'white', fontWeight: '700', fontSize: '14px' }}>{u.username}</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', color: '#00ff88', fontSize: '12px', fontWeight: '700' }}>{u.count} درس</span>
                  </div>
                ))}
              </div>

              {/* Top points */}
              <div style={{ background: 'rgba(10,21,32,0.8)', border: '1px solid #1a3a50', borderRadius: '18px', padding: '26px', backdropFilter: 'blur(10px)' }}>
                <p style={{ color: '#7090a8', fontFamily: 'Space Mono, monospace', fontSize: '11px', letterSpacing: '1px', marginBottom: '18px' }}>// أعلى النقاط</p>
                {users.slice(0, 5).map((u, i) => (
                  <div key={u.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 12px', borderRadius: '10px', marginBottom: '4px', background: i === 0 ? 'rgba(255,215,0,0.04)' : 'transparent' }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#3a5a70', fontWeight: '700', minWidth: '28px', fontSize: '18px' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </span>
                    <span style={{ fontSize: '20px' }}>{u.avatar || '🧑‍💻'}</span>
                    <span style={{ color: 'white', fontWeight: '700', flex: 1, fontSize: '14px' }}>{u.username || 'بدون اسم'}</span>
                    {u.is_admin && <span style={{ background: 'rgba(255,51,102,0.12)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '2px 8px', borderRadius: '100px', fontSize: '9px', fontFamily: 'Space Mono, monospace' }}>ADMIN</span>}
                    <span style={{ fontFamily: 'Space Mono, monospace', color: '#ffd700', fontWeight: '700', fontSize: '13px' }}>{u.points} ⭐</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== USERS ===== */}
        {activeTab === 'users' && (
          <div className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '3px', height: '20px', background: '#ff3366', borderRadius: '2px' }}></div>
                <h2 style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>إدارة المستخدمين</h2>
              </div>
              <span style={{ color: '#7090a8', fontFamily: 'Space Mono, monospace', fontSize: '12px' }}>{users.length} USERS</span>
            </div>

            <div style={{ background: 'rgba(10,21,32,0.8)', border: '1px solid #1a3a50', borderRadius: '18px', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', padding: '14px 22px', background: 'rgba(8,15,24,0.8)', borderBottom: '1px solid #1a3a50' }}>
                {['المستخدم', 'النقاط', 'الصلاحية', 'الإجراءات'].map(h => (
                  <span key={h} style={{ color: '#7090a8', fontSize: '11px', fontFamily: 'Space Mono, monospace', fontWeight: '700', letterSpacing: '0.5px' }}>{h}</span>
                ))}
              </div>
              {users.map((u, i) => (
                <div key={u.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', padding: '14px 22px', borderBottom: '1px solid rgba(26,58,80,0.4)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(26,58,80,0.5)', border: '1px solid #1a3a50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{u.avatar || '🧑‍💻'}</div>
                    <div>
                      <p style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{u.username || 'بدون اسم'}</p>
                      <p style={{ color: '#3a5a70', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>#{i + 1}</p>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Space Mono, monospace', color: '#ffd700', fontWeight: '700' }}>{u.points}</span>
                  <div>
                    {u.is_admin
                      ? <span style={{ background: 'rgba(255,51,102,0.12)', border: '1px solid rgba(255,51,102,0.25)', color: '#ff3366', padding: '3px 10px', borderRadius: '100px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>ADMIN</span>
                      : <span style={{ background: 'rgba(26,58,80,0.4)', border: '1px solid #1a3a5066', color: '#7090a8', padding: '3px 10px', borderRadius: '100px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>USER</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="act-btn" onClick={() => toggleAdmin(u.id, u.is_admin)}
                      style={{ background: u.is_admin ? 'rgba(255,51,102,0.1)' : 'rgba(0,255,136,0.1)', border: `1px solid ${u.is_admin ? 'rgba(255,51,102,0.25)' : 'rgba(0,255,136,0.25)'}`, color: u.is_admin ? '#ff3366' : '#00ff88', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                      {u.is_admin ? '− Admin' : '+ Admin'}
                    </button>
                    <button className="act-btn" onClick={() => deleteUser(u.id)} disabled={deletingUser === u.id}
                      style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff6b6b', padding: '6px 10px', borderRadius: '8px', fontSize: '13px', opacity: deletingUser === u.id ? 0.4 : 1 }}>
                      {deletingUser === u.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== LESSONS ===== */}
        {activeTab === 'lessons' && (
          <div className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '3px', height: '20px', background: '#ff3366', borderRadius: '2px' }}></div>
                <h2 style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>إدارة الدروس</h2>
              </div>
              <span style={{ color: '#7090a8', fontFamily: 'Space Mono, monospace', fontSize: '12px' }}>{lessons.length} LESSONS</span>
            </div>

            {editingLesson && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)' }}>
                <div style={{ background: '#0a1520', border: '1px solid rgba(255,51,102,0.3)', borderRadius: '20px', padding: '36px', width: '480px', position: 'relative', overflow: 'hidden' }} dir="rtl">
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,51,102,0.6), transparent)' }}></div>
                  <h3 style={{ color: 'white', fontWeight: '900', fontSize: '18px', marginBottom: '22px' }}>✏️ تعديل الدرس</h3>
                  <label style={lbl}>عنوان الدرس</label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...inp, marginBottom: '24px' }} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={saveLesson} style={{ flex: 1, background: '#ff3366', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: 'Cairo, sans-serif', fontSize: '15px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,51,102,0.3)' }}>حفظ التعديل</button>
                    <button onClick={() => setEditingLesson(null)} style={{ flex: 1, background: 'rgba(26,58,80,0.4)', color: '#7090a8', border: '1px solid #1a3a50', borderRadius: '10px', padding: '13px', fontFamily: 'Cairo, sans-serif', fontSize: '15px', cursor: 'pointer' }}>إلغاء</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(COURSE_NAMES).map(([cId, { name, color }]) => {
                const cl = lessons.filter(l => l.course_id === cId)
                if (!cl.length) return null
                return (
                  <div key={cId} style={{ background: 'rgba(10,21,32,0.8)', border: '1px solid #1a3a50', borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
                    <div style={{ padding: '14px 22px', background: 'rgba(8,15,24,0.7)', borderBottom: '1px solid #1a3a50', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '3px', background: color }}></div>
                      <span style={{ color, fontFamily: 'Space Mono, monospace', fontWeight: '700', fontSize: '13px' }}>{name}</span>
                      <span style={{ color: '#3a5a70', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{cl.length} LESSONS</span>
                    </div>
                    {cl.map((lesson, i) => (
                      <div key={lesson.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', padding: '12px 22px', borderBottom: i < cl.length - 1 ? '1px solid rgba(26,58,80,0.3)' : 'none', gap: '16px' }}>
                        <span style={{ fontFamily: 'Space Mono, monospace', color: '#1a3a50', fontSize: '12px', minWidth: '28px' }}>{String(lesson.order_num).padStart(2, '0')}</span>
                        <span style={{ flex: 1, color: '#a0c0d8', fontSize: '14px' }}>{lesson.title}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="act-btn" onClick={() => { setEditingLesson(lesson); setEditTitle(lesson.title) }}
                            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                            ✏️ تعديل
                          </button>
                          <button className="act-btn" onClick={() => deleteLesson(lesson.id)} disabled={deletingLesson === lesson.id}
                            style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff6b6b', padding: '6px 10px', borderRadius: '8px', fontSize: '13px', opacity: deletingLesson === lesson.id ? 0.4 : 1 }}>
                            {deletingLesson === lesson.id ? '⏳' : '🗑️'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ===== CTF ===== */}
        {activeTab === 'ctf' && (
          <div className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '3px', height: '20px', background: '#ff3366', borderRadius: '2px' }}></div>
              <h2 style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>إضافة تحدي CTF</h2>
            </div>

            <div style={{ background: 'rgba(10,21,32,0.85)', border: '1px solid #1a3a50', borderRadius: '20px', padding: '32px', maxWidth: '700px', backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,51,102,0.5), transparent)' }}></div>

              <div className="ctf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>عنوان التحدي *</label>
                  <input style={inp} placeholder="مثال: SQL Injection 101" value={ctf.title} onChange={e => setCTF({ ...ctf, title: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>الفئة</label>
                  <select style={inp} value={ctf.category} onChange={e => setCTF({ ...ctf, category: e.target.value })}>
                    {['web', 'crypto', 'forensics', 'pwn', 'reverse', 'osint', 'misc'].map(c => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>وصف التحدي *</label>
                <textarea style={{ ...inp, minHeight: '100px', resize: 'vertical' }} placeholder="اشرح التحدي وأعط سياقاً..." value={ctf.description} onChange={e => setCTF({ ...ctf, description: e.target.value })} />
              </div>

              <div className="ctf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>العلم (Flag) * — مثال: FLAG&#123;test&#125;</label>
                  <input style={{ ...inp, fontFamily: 'Space Mono, monospace', color: '#00ff88' }} placeholder="FLAG{your_flag_here}" value={ctf.flag} onChange={e => setCTF({ ...ctf, flag: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>النقاط</label>
                  <select style={inp} value={ctf.points} onChange={e => setCTF({ ...ctf, points: Number(e.target.value) })}>
                    {[25, 50, 75, 100, 150, 200, 300, 500].map(p => (
                      <option key={p} value={p}>{p} نقطة</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ctf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={lbl}>الصعوبة</label>
                  <select style={inp} value={ctf.difficulty} onChange={e => setCTF({ ...ctf, difficulty: e.target.value })}>
                    {['سهل', 'متوسط', 'صعب', 'خبير'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>تلميح (اختياري)</label>
                  <input style={inp} placeholder="تلميح للمتسابقين..." value={ctf.hints} onChange={e => setCTF({ ...ctf, hints: e.target.value })} />
                </div>
              </div>

              {ctf.title && (
                <div style={{ background: 'rgba(5,10,15,0.7)', border: '1px solid rgba(255,51,102,0.2)', borderRadius: '12px', padding: '18px', marginBottom: '22px' }}>
                  <p style={{ color: '#7090a8', fontSize: '11px', fontFamily: 'Space Mono, monospace', letterSpacing: '1px', marginBottom: '12px' }}>// PREVIEW</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <p style={{ color: 'white', fontWeight: '900', fontSize: '16px', marginBottom: '6px' }}>{ctf.title}</p>
                      <p style={{ color: '#7090a8', fontSize: '13px', lineHeight: '1.6' }}>{ctf.description.slice(0, 100)}{ctf.description.length > 100 ? '...' : ''}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                      <span style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: '#ffd700', padding: '3px 12px', borderRadius: '100px', fontSize: '12px', fontFamily: 'Space Mono, monospace', fontWeight: '700' }}>{ctf.points} pts</span>
                      <span style={{ background: 'rgba(26,58,80,0.5)', border: '1px solid #1a3a50', color: '#7090a8', padding: '3px 12px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{ctf.category.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={addCTF}
                style={{ width: '100%', background: '#ff3366', color: 'white', border: 'none', borderRadius: '12px', padding: '15px', fontFamily: 'Cairo, sans-serif', fontSize: '17px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 6px 30px rgba(255,51,102,0.35)' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(255,51,102,0.45)' }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 30px rgba(255,51,102,0.35)' }}>
                🎯 إضافة التحدي
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}