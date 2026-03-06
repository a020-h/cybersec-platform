'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type User = { id: string; username: string; points: number; avatar: string; is_admin: boolean; created_at: string }
type Lesson = { id: string; course_id: string; title: string; order_num: number }
type CTFChallenge = { title: string; description: string; category: string; points: number; flag: string; difficulty: string; hints: string }

const COURSE_NAMES: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': '🛡️ أساسيات الأمن',
  '00000000-0000-0000-0000-000000000002': '🌐 الشبكات',
  '00000000-0000-0000-0000-000000000003': '💻 اختبار الاختراق',
  '00000000-0000-0000-0000-000000000004': '🦠 البرمجيات الخبيثة',
  '00000000-0000-0000-0000-000000000005': '🎭 الهندسة الاجتماعية',
  '00000000-0000-0000-0000-000000000006': '🔐 التشفير',
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'lessons' | 'ctf'>('stats')
  const [users, setUsers] = useState<User[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, totalPoints: 0, totalLessons: 0, totalCompletions: 0 })
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

      // تحقق من صلاحية Admin
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }

      await loadAll()
      setLoading(false)
    }
    init()
  }, [])

  const loadAll = async () => {
    // المستخدمون
    const { data: usersData } = await supabase.from('profiles').select('*').order('points', { ascending: false })
    if (usersData) setUsers(usersData)

    // الدروس
    const { data: lessonsData } = await supabase.from('lessons').select('id, course_id, title, order_num').order('course_id').order('order_num')
    if (lessonsData) setLessons(lessonsData)

    // الإحصائيات
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { data: pointsData } = await supabase.from('profiles').select('points')
    const { count: lessonsCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true })
    const { count: completionsCount } = await supabase.from('lesson_completions').select('*', { count: 'exact', head: true })

    const totalPoints = pointsData?.reduce((sum, p) => sum + (p.points || 0), 0) || 0
    setStats({
      totalUsers: usersCount || 0,
      totalPoints,
      totalLessons: lessonsCount || 0,
      totalCompletions: completionsCount || 0,
    })
  }

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type)
    setTimeout(() => setMsg(''), 3000)
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
    else { showMsg(!currentVal ? 'تم تعيينه Admin ✓' : 'تم إزالة صلاحية Admin ✓'); await loadAll() }
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
      title: ctf.title,
      description: ctf.description,
      category: ctf.category,
      points: ctf.points,
      flag: ctf.flag,
      difficulty: ctf.difficulty,
      hints: ctf.hints ? [ctf.hints] : [],
      is_active: true,
    })
    if (error) showMsg('فشل الإضافة: ' + error.message, 'error')
    else {
      showMsg('تم إضافة التحدي بنجاح ✓')
      setCTF({ title: '', description: '', category: 'web', points: 50, flag: '', difficulty: 'سهل', hints: '' })
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid #ff3366', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <p style={{ color: '#7090a8', fontFamily: 'monospace' }}>التحقق من الصلاحيات...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '8px',
    padding: '10px 14px', color: '#e0f0ff', fontFamily: 'Cairo,sans-serif', fontSize: '14px',
    outline: 'none', direction: 'rtl',
  }
  const labelStyle: React.CSSProperties = { color: '#7090a8', fontSize: '13px', marginBottom: '6px', display: 'block', fontFamily: 'monospace' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cairo',sans-serif; background:#050a0f; color:#e0f0ff; }
        body::before { content:''; position:fixed; inset:0; background-image:linear-gradient(#1a3a5022 1px,transparent 1px),linear-gradient(90deg,#1a3a5022 1px,transparent 1px); background-size:60px 60px; z-index:0; pointer-events:none; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:#0a1520; } ::-webkit-scrollbar-thumb { background:#1a3a50; border-radius:3px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .fade-up { animation:fadeUp 0.4s ease both; }
        .tab-btn { transition:all 0.2s; cursor:pointer; }
        .action-btn { transition:all 0.2s; cursor:pointer; }
        .action-btn:hover { opacity:0.8; transform:translateY(-1px); }
        input:focus, select:focus, textarea:focus { border-color:#ff336666 !important; box-shadow:0 0 0 2px rgba(255,51,102,0.08); }
        .user-row:hover { background:#0a152044 !important; }
        .lesson-row:hover { background:#0a152044 !important; }
      `}</style>

      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }} dir="rtl">

        {/* Navbar */}
        <nav style={{ background: 'rgba(5,10,15,0.97)', borderBottom: '1px solid #ff336633', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '700', color: '#ff3366', letterSpacing: '2px' }}>
              🛡️ ADMIN<span style={{ color: '#7090a8' }}>PANEL</span>
            </span>
            <span style={{ background: 'rgba(255,51,102,0.15)', border: '1px solid #ff336644', color: '#ff3366', padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontFamily: 'monospace' }}>RESTRICTED</span>
          </div>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: '#0a1520', border: '1px solid #1a3a50', color: '#7090a8', padding: '8px 16px', borderRadius: '8px', fontFamily: 'Cairo,sans-serif', fontSize: '13px', cursor: 'pointer' }}>
            ← لوحة التحكم
          </button>
        </nav>

        {/* Toast */}
        {msg && (
          <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: msgType === 'success' ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)', border: `1px solid ${msgType === 'success' ? '#00ff8844' : '#ff336644'}`, color: msgType === 'success' ? '#00ff88' : '#ff3366', padding: '12px 24px', borderRadius: '10px', fontFamily: 'monospace', fontSize: '14px', zIndex: 999, backdropFilter: 'blur(20px)', animation: 'slideIn 0.3s ease' }}>
            {msgType === 'success' ? '✓' : '✗'} {msg}
          </div>
        )}

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '12px', padding: '6px', marginBottom: '28px', width: 'fit-content' }}>
            {([
              { key: 'stats', label: '📊 الإحصائيات' },
              { key: 'users', label: '👥 المستخدمون' },
              { key: 'lessons', label: '📝 الدروس' },
              { key: 'ctf', label: '🎯 إضافة CTF' },
            ] as const).map(tab => (
              <button key={tab.key} className="tab-btn"
                onClick={() => setActiveTab(tab.key)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '14px', fontWeight: '700', background: activeTab === tab.key ? '#ff3366' : 'transparent', color: activeTab === tab.key ? 'white' : '#7090a8' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ===== STATS ===== */}
          {activeTab === 'stats' && (
            <div className="fade-up">
              <h2 style={{ color: '#ff3366', fontFamily: 'monospace', marginBottom: '24px', fontSize: '18px' }}>// إحصائيات المنصة</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: '👥', color: '#00ff88' },
                  { label: 'إجمالي النقاط', value: stats.totalPoints.toLocaleString(), icon: '⭐', color: '#ffd700' },
                  { label: 'إجمالي الدروس', value: stats.totalLessons, icon: '📚', color: '#00d4ff' },
                  { label: 'الدروس المكتملة', value: stats.totalCompletions, icon: '✓', color: '#a855f7' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#0a1520', border: `1px solid ${s.color}33`, borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>{s.icon}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '32px', fontWeight: '900', color: s.color, marginBottom: '6px' }}>{s.value}</div>
                    <div style={{ color: '#7090a8', fontSize: '13px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Top Users */}
              <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ color: '#ffd700', fontFamily: 'monospace', marginBottom: '20px', fontSize: '15px' }}>// أفضل المستخدمين</h3>
                {users.slice(0, 5).map((u, i) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '8px', marginBottom: '8px', background: i === 0 ? 'rgba(255,215,0,0.05)' : 'transparent' }}>
                    <span style={{ fontFamily: 'monospace', color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#7090a8', fontWeight: '700', minWidth: '28px', fontSize: '16px' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <span style={{ color: 'white', fontWeight: '700', flex: 1 }}>{u.username || 'مجهول'}</span>
                    {u.is_admin && <span style={{ background: 'rgba(255,51,102,0.15)', border: '1px solid #ff336644', color: '#ff3366', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontFamily: 'monospace' }}>ADMIN</span>}
                    <span style={{ fontFamily: 'monospace', color: '#ffd700', fontWeight: '700' }}>{u.points} ⭐</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== USERS ===== */}
          {activeTab === 'users' && (
            <div className="fade-up">
              <h2 style={{ color: '#ff3366', fontFamily: 'monospace', marginBottom: '24px', fontSize: '18px' }}>// إدارة المستخدمين ({users.length})</h2>
              <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', background: '#080f18', borderBottom: '1px solid #1a3a50' }}>
                  {['المستخدم', 'النقاط', 'الصلاحية', 'الإجراءات'].map(h => (
                    <span key={h} style={{ color: '#7090a8', fontSize: '12px', fontFamily: 'monospace', fontWeight: '700' }}>{h}</span>
                  ))}
                </div>
                {users.map((u, i) => (
                  <div key={u.id} className="user-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #1a3a5033', alignItems: 'center', transition: 'background 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{u.avatar || '🧑‍💻'}</span>
                      <div>
                        <p style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{u.username || 'بدون اسم'}</p>
                        <p style={{ color: '#3a5a70', fontSize: '11px', fontFamily: 'monospace' }}>#{i + 1}</p>
                      </div>
                    </div>
                    <span style={{ fontFamily: 'monospace', color: '#ffd700', fontWeight: '700' }}>{u.points} ⭐</span>
                    <div>
                      {u.is_admin
                        ? <span style={{ background: 'rgba(255,51,102,0.15)', border: '1px solid #ff336644', color: '#ff3366', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontFamily: 'monospace' }}>ADMIN</span>
                        : <span style={{ background: '#0f1f30', border: '1px solid #1a3a50', color: '#7090a8', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontFamily: 'monospace' }}>USER</span>
                      }
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => toggleAdmin(u.id, u.is_admin)}
                        style={{ background: u.is_admin ? 'rgba(255,51,102,0.1)' : 'rgba(0,255,136,0.1)', border: `1px solid ${u.is_admin ? '#ff336644' : '#00ff8844'}`, color: u.is_admin ? '#ff3366' : '#00ff88', padding: '6px 12px', borderRadius: '6px', fontFamily: 'Cairo,sans-serif', fontSize: '12px' }}>
                        {u.is_admin ? 'إزالة Admin' : 'تعيين Admin'}
                      </button>
                      <button className="action-btn" onClick={() => deleteUser(u.id)} disabled={deletingUser === u.id}
                        style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid #ff336644', color: '#ff3366', padding: '6px 12px', borderRadius: '6px', fontFamily: 'Cairo,sans-serif', fontSize: '12px', opacity: deletingUser === u.id ? 0.5 : 1 }}>
                        {deletingUser === u.id ? '...' : '🗑️ حذف'}
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
              <h2 style={{ color: '#ff3366', fontFamily: 'monospace', marginBottom: '24px', fontSize: '18px' }}>// إدارة الدروس ({lessons.length})</h2>

              {/* Edit Modal */}
              {editingLesson && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
                  <div style={{ background: '#0a1520', border: '1px solid #ff336644', borderRadius: '16px', padding: '32px', width: '480px' }} dir="rtl">
                    <h3 style={{ color: '#ff3366', fontFamily: 'monospace', marginBottom: '20px' }}>تعديل الدرس</h3>
                    <label style={labelStyle}>عنوان الدرس</label>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={saveLesson} style={{ flex: 1, background: '#ff3366', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontFamily: 'Cairo,sans-serif', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>حفظ التعديل</button>
                      <button onClick={() => setEditingLesson(null)} style={{ flex: 1, background: '#0f1f30', color: '#7090a8', border: '1px solid #1a3a50', borderRadius: '8px', padding: '12px', fontFamily: 'Cairo,sans-serif', fontSize: '15px', cursor: 'pointer' }}>إلغاء</button>
                    </div>
                  </div>
                </div>
              )}

              {Object.entries(COURSE_NAMES).map(([courseId, courseName]) => {
                const courseLessons = lessons.filter(l => l.course_id === courseId)
                if (!courseLessons.length) return null
                return (
                  <div key={courseId} style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', marginBottom: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', background: '#080f18', borderBottom: '1px solid #1a3a50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#00d4ff', fontFamily: 'monospace', fontWeight: '700', fontSize: '14px' }}>{courseName}</span>
                      <span style={{ color: '#7090a8', fontSize: '12px', fontFamily: 'monospace' }}>{courseLessons.length} درس</span>
                    </div>
                    {courseLessons.map(lesson => (
                      <div key={lesson.id} className="lesson-row" style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #1a3a5022', gap: '16px', transition: 'background 0.2s' }}>
                        <span style={{ fontFamily: 'monospace', color: '#1a3a50', fontSize: '12px', minWidth: '28px' }}>{String(lesson.order_num).padStart(2, '0')}</span>
                        <span style={{ flex: 1, color: '#a0c0d8', fontSize: '14px' }}>{lesson.title}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="action-btn" onClick={() => { setEditingLesson(lesson); setEditTitle(lesson.title) }}
                            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid #00d4ff44', color: '#00d4ff', padding: '6px 12px', borderRadius: '6px', fontFamily: 'Cairo,sans-serif', fontSize: '12px' }}>
                            ✏️ تعديل
                          </button>
                          <button className="action-btn" onClick={() => deleteLesson(lesson.id)} disabled={deletingLesson === lesson.id}
                            style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid #ff336644', color: '#ff3366', padding: '6px 12px', borderRadius: '6px', fontFamily: 'Cairo,sans-serif', fontSize: '12px', opacity: deletingLesson === lesson.id ? 0.5 : 1 }}>
                            {deletingLesson === lesson.id ? '...' : '🗑️'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* ===== CTF ===== */}
          {activeTab === 'ctf' && (
            <div className="fade-up">
              <h2 style={{ color: '#ff3366', fontFamily: 'monospace', marginBottom: '24px', fontSize: '18px' }}>// إضافة تحدي CTF جديد</h2>
              <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '16px', padding: '28px', maxWidth: '680px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>عنوان التحدي *</label>
                    <input style={inputStyle} placeholder="مثال: SQL Injection 101" value={ctf.title} onChange={e => setCTF({ ...ctf, title: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>الفئة</label>
                    <select style={inputStyle} value={ctf.category} onChange={e => setCTF({ ...ctf, category: e.target.value })}>
                      {['web', 'crypto', 'forensics', 'pwn', 'reverse', 'osint', 'misc'].map(c => (
                        <option key={c} value={c}>{c.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>وصف التحدي *</label>
                  <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="اشرح التحدي وأعط تلميحات..." value={ctf.description} onChange={e => setCTF({ ...ctf, description: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>العلم (Flag) * — مثال: FLAG&#123;test_flag&#125;</label>
                    <input style={{ ...inputStyle, fontFamily: 'monospace', color: '#00ff88' }} placeholder="FLAG{your_flag_here}" value={ctf.flag} onChange={e => setCTF({ ...ctf, flag: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>النقاط</label>
                    <select style={inputStyle} value={ctf.points} onChange={e => setCTF({ ...ctf, points: Number(e.target.value) })}>
                      {[25, 50, 75, 100, 150, 200, 300, 500].map(p => (
                        <option key={p} value={p}>{p} نقطة</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>الصعوبة</label>
                    <select style={inputStyle} value={ctf.difficulty} onChange={e => setCTF({ ...ctf, difficulty: e.target.value })}>
                      {['سهل', 'متوسط', 'صعب', 'خبير'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>تلميح (اختياري)</label>
                    <input style={inputStyle} placeholder="تلميح للمتسابقين..." value={ctf.hints} onChange={e => setCTF({ ...ctf, hints: e.target.value })} />
                  </div>
                </div>

                {/* Preview */}
                {ctf.title && (
                  <div style={{ background: '#080f18', border: '1px solid #ff336633', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                    <p style={{ color: '#7090a8', fontSize: '11px', fontFamily: 'monospace', marginBottom: '10px' }}>// معاينة</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{ctf.title}</p>
                        <p style={{ color: '#7090a8', fontSize: '13px' }}>{ctf.description.slice(0, 80)}{ctf.description.length > 80 ? '...' : ''}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <span style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid #ffd70033', color: '#ffd700', padding: '2px 10px', borderRadius: '100px', fontSize: '12px' }}>{ctf.points} نقطة</span>
                        <span style={{ background: '#0f1f30', border: '1px solid #1a3a50', color: '#7090a8', padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontFamily: 'monospace' }}>{ctf.category.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={addCTF}
                  style={{ width: '100%', background: '#ff3366', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontFamily: 'Cairo,sans-serif', fontSize: '16px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 24px rgba(255,51,102,0.3)' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  🎯 إضافة التحدي
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}