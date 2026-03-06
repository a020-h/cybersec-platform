'use client'
import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const DB_COURSE_IDS: Record<string, string> = {
  '1': '00000000-0000-0000-0000-000000000001',
  '2': '00000000-0000-0000-0000-000000000002',
  '3': '00000000-0000-0000-0000-000000000003',
  '4': '00000000-0000-0000-0000-000000000004',
  '5': '00000000-0000-0000-0000-000000000005',
  '6': '00000000-0000-0000-0000-000000000006',
}

const staticCourses: Record<string, { title: string; icon: string; color: string }> = {
  '1': { title: 'أساسيات الأمن السيبراني', icon: '🛡️', color: '#00ff88' },
  '2': { title: 'الشبكات وبروتوكولات TCP/IP', icon: '🌐', color: '#00d4ff' },
  '3': { title: 'اختبار الاختراق', icon: '💻', color: '#a855f7' },
  '4': { title: 'تحليل البرمجيات الخبيثة', icon: '🦠', color: '#ff3366' },
  '5': { title: 'الهندسة الاجتماعية', icon: '🎭', color: '#ffd700' },
  '6': { title: 'التشفير وعلم الكريبتو', icon: '🔐', color: '#ff6ec7' },
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [lessons, setLessons] = useState<any[]>([])
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [sessionToken, setSessionToken] = useState('')
  const [certLoading, setCertLoading] = useState(false)
  const router = useRouter()
  const course = staticCourses[courseId] || { title: 'المسار', icon: '📚', color: '#00ff88' }

  useEffect(() => {
    const init = async () => {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        await new Promise(r => setTimeout(r, 1000))
        const { data } = await supabase.auth.getSession()
        session = data.session
      }
      if (!session) { router.push('/'); return }
      setUser(session.user)
      setSessionToken(session.access_token)
      // Store email for certificate
      setUserEmail(session.user.email || '')

      const dbId = DB_COURSE_IDS[courseId]
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lessons?course_id=eq.${dbId}&order=order_num.asc`,
        { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${session.access_token}` } }
      )
      const lessonsData = await res.json()

      if (lessonsData?.length > 0) {
        setLessons(lessonsData)
        setCurrentLesson(lessonsData[0])
      } else {
        const demo = { id: 'demo', title: 'قريباً...', content: '## المحتوى قيد الإعداد\n\nسيتوفر هذا المسار قريباً! 🚀' }
        setLessons([demo]); setCurrentLesson(demo)
      }

      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=points,username`,
        { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${session.access_token}` } }
      )
      const profileData = await profileRes.json()
      if (profileData?.[0]) {
        setPoints(profileData[0].points)
        setUsername(profileData[0].username || 'Learner')
      }

      const compRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lesson_completions?user_id=eq.${session.user.id}&select=lesson_id`,
        { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${session.access_token}` } }
      )
      const compData = await compRes.json()
      if (compData) setCompleted(new Set(compData.map((c: any) => c.lesson_id)))
      setLoading(false)
    }
    init()
  }, [])

  const generateCertificate = async () => {
    setCertLoading(true)
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF || (jsPDFModule as any).default
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const W = 297, H = 210

      const courseNamesEn: Record<string, string> = {
        '1': 'Cybersecurity Fundamentals',
        '2': 'Networks & TCP/IP Protocols',
        '3': 'Penetration Testing',
        '4': 'Malware Analysis',
        '5': 'Social Engineering',
        '6': 'Cryptography & Crypto',
      }
      const courseNameEn = courseNamesEn[courseId] || 'Cybersecurity'

      // Use email prefix as the display name (always Latin/English)
      const displayName = userEmail
        ? userEmail.split('@')[0].replace(/[^a-zA-Z0-9._\-]/g, '').slice(0, 30)
        : 'Learner'

      const hex = course.color.replace('#', '')
      const cr = parseInt(hex.slice(0, 2), 16)
      const cg = parseInt(hex.slice(2, 4), 16)
      const cb = parseInt(hex.slice(4, 6), 16)

      // Background
      doc.setFillColor(5, 10, 15)
      doc.rect(0, 0, W, H, 'F')

      // Subtle grid pattern (horizontal lines)
      doc.setDrawColor(15, 30, 45)
      doc.setLineWidth(0.2)
      for (let y = 20; y < H; y += 10) {
        doc.line(0, y, W, y)
      }
      for (let x = 20; x < W; x += 10) {
        doc.line(x, 0, x, H)
      }

      // Outer border
      doc.setDrawColor(26, 58, 80)
      doc.setLineWidth(0.8)
      doc.rect(10, 10, W - 20, H - 20)

      // Inner accent border
      doc.setDrawColor(cr, cg, cb)
      doc.setLineWidth(0.4)
      doc.rect(14, 14, W - 28, H - 28)

      // Corner circles
      doc.setFillColor(cr, cg, cb)
      doc.circle(16, 16, 2.5, 'F')
      doc.circle(W - 16, 16, 2.5, 'F')
      doc.circle(16, H - 16, 2.5, 'F')
      doc.circle(W - 16, H - 16, 2.5, 'F')

      // Top accent bar
      doc.setFillColor(cr, cg, cb)
      doc.rect(14, 14, W - 28, 1.5, 'F')

      // Platform name
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(cr, cg, cb)
      doc.text('CYBER', W / 2 - 6, 28, { align: 'right' })
      doc.setTextColor(112, 144, 168)
      doc.text('Arabi', W / 2 - 4, 28, { align: 'left' })

      // Divider
      doc.setDrawColor(cr, cg, cb)
      doc.setLineWidth(0.6)
      doc.line(50, 33, W - 50, 33)

      // Main title
      doc.setFontSize(30)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('CERTIFICATE OF COMPLETION', W / 2, 52, { align: 'center' })

      // Subtitle
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(112, 144, 168)
      doc.text('This document certifies the successful completion of the following course', W / 2, 62, { align: 'center' })

      // Divider
      doc.setDrawColor(26, 58, 80)
      doc.setLineWidth(0.3)
      doc.line(70, 68, W - 70, 68)

      // "Presented to"
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(112, 144, 168)
      doc.text('PRESENTED TO', W / 2, 80, { align: 'center' })

      // Name (email prefix — always Latin)
      doc.setFontSize(36)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(cr, cg, cb)
      doc.text(displayName, W / 2, 98, { align: 'center' })

      // Underline name
      const nw = doc.getTextWidth(displayName)
      doc.setDrawColor(cr, cg, cb)
      doc.setLineWidth(0.8)
      doc.line(W / 2 - nw / 2, 101, W / 2 + nw / 2, 101)

      // "for successfully completing"
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(112, 144, 168)
      doc.text('for successfully completing', W / 2, 113, { align: 'center' })

      // Course name box
      doc.setFillColor(15, 31, 48)
      doc.setDrawColor(cr, cg, cb)
      doc.setLineWidth(0.5)
      doc.roundedRect(W / 2 - 80, 118, 160, 20, 5, 5, 'FD')
      doc.setFontSize(15)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(courseNameEn, W / 2, 131, { align: 'center' })

      // Bottom divider
      doc.setDrawColor(26, 58, 80)
      doc.setLineWidth(0.3)
      doc.line(50, 148, W - 50, 148)

      // Date & Certificate ID
      const today = new Date()
      const dateStr = today.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
      const certId = 'CA-' + Math.random().toString(36).slice(2, 8).toUpperCase()

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(112, 144, 168)
      doc.text('DATE OF ISSUE', 60, 158)
      doc.text('CERTIFICATE ID', W - 60, 158, { align: 'right' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(200, 220, 240)
      doc.text(dateStr, 60, 165)
      doc.text(certId, W - 60, 165, { align: 'right' })

      // Seal
      doc.setDrawColor(cr, cg, cb)
      doc.setLineWidth(0.8)
      doc.circle(W / 2, 163, 14)
      doc.setFillColor(cr, cg, cb)
      doc.circle(W / 2, 163, 11, 'F')
      // Checkmark lines instead of Unicode symbol
      doc.setDrawColor(5, 10, 15)
      doc.setLineWidth(2)
      doc.line(W / 2 - 5, 163, W / 2 - 1, 167)
      doc.line(W / 2 - 1, 167, W / 2 + 6, 158)

      // Bottom bar
      doc.setFillColor(cr, cg, cb)
      doc.rect(14, H - 15.5, W - 28, 1.5, 'F')

      // Footer
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50, 80, 100)
      doc.text('CYBERArabi Learning Platform  -  Verified Certificate', W / 2, H - 8, { align: 'center' })

      doc.save(`CYBERArabi-${courseNameEn.replace(/\s+/g, '-')}-${displayName}.pdf`)
    } catch (err) {
      console.error('Certificate error:', err)
      alert('حدث خطأ: ' + (err as any).message)
    }
    setCertLoading(false)
  }

  const startQuiz = async () => {
    if (!currentLesson || currentLesson.id === 'demo') return
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/questions?lesson_id=eq.${currentLesson.id}`,
      { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${sessionToken}` } }
    )
    const data = await res.json()
    if (data?.length > 0) {
      setQuestions(data); setCurrentQ(0); setSelected(null)
      setAnswered(false); setQuizScore(0); setQuizDone(false); setShowQuiz(true)
    }
  }

  const handleAnswer = (opt: string) => {
    if (answered) return
    setSelected(opt); setAnswered(true)
    if (opt === questions[currentQ].correct_answer) setQuizScore(s => s + 1)
  }

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1); setSelected(null); setAnswered(false)
    } else { setQuizDone(true) }
  }

  const finishQuiz = async () => {
    setShowQuiz(false)
    if (completed.has(currentLesson.id)) return

    const checkRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lesson_completions?user_id=eq.${user.id}&lesson_id=eq.${currentLesson.id}&select=id`,
      { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${sessionToken}` } }
    )
    const existing = await checkRes.json()
    if (existing?.length > 0) {
      setCompleted(new Set([...completed, currentLesson.id]))
      return
    }

    const bonus = quizScore === questions.length ? 25 : quizScore > 0 ? 10 : 0

    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lesson_completions`, {
      method: 'POST',
      headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, course_id: courseId, lesson_id: currentLesson.id })
    })

    const freshProfile = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=points`,
      { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${sessionToken}` } }
    )
    const freshData = await freshProfile.json()
    const freshPoints = freshData?.[0]?.points || 0
    const newPoints = freshPoints + 15 + bonus

    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: newPoints })
    })

    setCompleted(new Set([...completed, currentLesson.id]))
    setPoints(newPoints)
    const idx = lessons.findIndex(l => l.id === currentLesson.id)
    if (idx < lessons.length - 1) setCurrentLesson(lessons[idx + 1])
  }

  const renderContent = (content: string): string => {
    const lines = content.split('\n')
    let html = ''
    let tableRows: string[][] = []
    let inTable = false

    const flushTable = () => {
      if (!tableRows.length) return
      const header = tableRows[0]
      const bodyRows = tableRows.slice(2)
      html += `<div style="overflow-x:auto;margin:24px 0;border-radius:8px;border:1px solid #1a3a50">`
      html += `<table style="width:100%;border-collapse:collapse;font-size:14px;direction:rtl">`
      html += `<thead><tr>${header.map(h => `<th style="padding:12px 16px;background:#0f1f30;color:${course.color};font-family:monospace;font-weight:700;text-align:right;border-bottom:2px solid #1a3a50;white-space:nowrap">${h.trim()}</th>`).join('')}</tr></thead>`
      html += `<tbody>${bodyRows.map((row, i) => `<tr style="background:${i % 2 === 0 ? 'transparent' : '#0a152088'}">${row.map(cell => `<td style="padding:10px 16px;color:#a0c0d8;border-bottom:1px solid #1a3a5044;text-align:right">${cell.trim()}</td>`).join('')}</tr>`).join('')}</tbody>`
      html += `</table></div>`
      tableRows = []; inTable = false
    }

    const applyInline = (text: string): string => text
      .replace(/\*\*(.+?)\*\*/g, `<strong style="color:white;font-weight:800">$1</strong>`)
      .replace(/`(.+?)`/g, `<code style="background:#0f1f30;border:1px solid #1a3a50;padding:2px 8px;border-radius:3px;color:${course.color};font-family:monospace;font-size:13px">$1</code>`)

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true
        tableRows.push(trimmed.slice(1, -1).split('|'))
        continue
      }
      if (inTable) flushTable()
      if (trimmed.startsWith('## ')) {
        html += `<h2 style="font-size:22px;font-weight:900;color:${course.color};margin:32px 0 14px;font-family:monospace;letter-spacing:1px">${applyInline(trimmed.slice(3))}</h2>`
      } else if (trimmed.startsWith('### ')) {
        html += `<h3 style="font-size:17px;font-weight:700;color:#00d4ff;margin:22px 0 10px">${applyInline(trimmed.slice(4))}</h3>`
      } else if (trimmed.startsWith('- ')) {
        html += `<div style="display:flex;align-items:flex-start;gap:10px;margin:8px 0;padding-right:4px"><span style="color:${course.color};font-size:11px;margin-top:6px;flex-shrink:0">◆</span><span style="color:#a0c0d8;line-height:1.75">${applyInline(trimmed.slice(2))}</span></div>`
      } else if (/^\d+\.\s/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)\./)?.[1]
        const text = trimmed.replace(/^\d+\.\s/, '')
        html += `<div style="display:flex;align-items:flex-start;gap:12px;margin:8px 0;padding-right:4px"><span style="color:${course.color};font-family:monospace;font-weight:700;flex-shrink:0;min-width:20px">${num}.</span><span style="color:#a0c0d8;line-height:1.75">${applyInline(text)}</span></div>`
      } else if (trimmed.startsWith('> ')) {
        html += `<blockquote style="border-right:3px solid ${course.color};padding:12px 18px;margin:18px 0;background:#0a152088;border-radius:0 8px 8px 0;color:#a0c0d8;font-style:italic;line-height:1.7">${applyInline(trimmed.slice(2))}</blockquote>`
      } else if (trimmed === '') {
        html += `<div style="height:10px"></div>`
      } else {
        html += `<p style="color:#a0c0d8;line-height:1.85;margin:6px 0">${applyInline(trimmed)}</p>`
      }
    }
    if (inTable) flushTable()
    return html
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: `3px solid ${course.color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <p style={{ color: '#7090a8', fontFamily: 'monospace' }}>جاري التحميل...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const totalLessons = lessons.length
  const doneCount = lessons.filter(l => completed.has(l.id)).length
  const percent = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0
  const courseCompleted = doneCount === totalLessons && totalLessons > 0 && lessons[0]?.id !== 'demo'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; list-style:none; }
        ul, ol { padding:0; margin:0; }
        body { font-family:'Cairo',sans-serif; background:#050a0f; color:#e0f0ff; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#0a1520; }
        ::-webkit-scrollbar-thumb { background:#1a3a50; border-radius:3px; }
        .quiz-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.92); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; backdrop-filter:blur(8px); }
        .quiz-box { background:#0a1520; border:1px solid #1a3a50; border-radius:16px; padding:40px; max-width:640px; width:100%; max-height:90vh; overflow-y:auto; }
        .opt-btn { width:100%; text-align:right; padding:14px 20px; border-radius:8px; border:1px solid #1a3a50; background:#0f1f30; color:#a0c0d8; font-family:'Cairo',sans-serif; font-size:15px; cursor:pointer; transition:all 0.2s; margin-bottom:10px; display:block; }
        .opt-btn:hover:not(:disabled) { border-color:${course.color}; color:white; }
        .opt-correct { border-color:#00ff88 !important; background:rgba(0,255,136,0.1) !important; color:#00ff88 !important; }
        .opt-wrong { border-color:#ff3366 !important; background:rgba(255,51,102,0.1) !important; color:#ff3366 !important; }
        .opt-dim { opacity:0.4; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes certPulse { 0%,100%{box-shadow:0 0 20px ${course.color}44} 50%{box-shadow:0 0 40px ${course.color}88} }
        .lesson-content { animation:fadeIn 0.3s ease; }
        .cert-btn { animation:certPulse 2s ease-in-out infinite; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .lesson-main { padding: 24px 16px !important; }
          .lesson-title { font-size: 22px !important; }
          .nav-course-title { display: none !important; }
          .quiz-box { padding: 24px 16px !important; }
          .opt-btn { padding: 12px 14px !important; font-size: 14px !important; }
        }
      `}</style>

      {showQuiz && (
        <div className="quiz-overlay">
          <div className="quiz-box" dir="rtl">
            {!quizDone ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ color: course.color, fontFamily: 'monospace', fontSize: '18px' }}>⚡ اختبر معلوماتك</h2>
                  <span style={{ color: '#7090a8', fontSize: '13px', fontFamily: 'monospace' }}>{currentQ + 1} / {questions.length}</span>
                </div>
                <div style={{ background: '#0f1f30', borderRadius: '4px', height: '4px', marginBottom: '28px' }}>
                  <div style={{ background: course.color, height: '4px', borderRadius: '4px', width: `${((currentQ + 1) / questions.length) * 100}%`, transition: 'width 0.3s' }}></div>
                </div>
                <p style={{ fontSize: '17px', fontWeight: '700', marginBottom: '24px', lineHeight: '1.6', color: 'white' }}>{questions[currentQ].question}</p>
                <div>
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const text = questions[currentQ][`option_${opt.toLowerCase()}`]
                    const isCorrect = opt === questions[currentQ].correct_answer
                    const isSelected = opt === selected
                    let cls = 'opt-btn'
                    if (answered) {
                      if (isCorrect) cls += ' opt-correct'
                      else if (isSelected) cls += ' opt-wrong'
                      else cls += ' opt-dim'
                    }
                    return (
                      <button key={opt} className={cls} onClick={() => handleAnswer(opt)} disabled={answered}>
                        <span style={{ fontFamily: 'monospace', marginLeft: '10px', opacity: 0.6 }}>{opt}.</span> {text}
                      </button>
                    )
                  })}
                </div>
                {answered && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', background: selected === questions[currentQ].correct_answer ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,102,0.08)', border: `1px solid ${selected === questions[currentQ].correct_answer ? '#00ff88' : '#ff3366'}` }}>
                      <p style={{ color: selected === questions[currentQ].correct_answer ? '#00ff88' : '#ff3366', fontWeight: '700', marginBottom: '6px' }}>
                        {selected === questions[currentQ].correct_answer ? '✔ إجابة صحيحة!' : '✘ إجابة خاطئة'}
                      </p>
                      {questions[currentQ].explanation && (
                        <p style={{ color: '#7090a8', fontSize: '14px', lineHeight: '1.6' }}>{questions[currentQ].explanation}</p>
                      )}
                    </div>
                    <button onClick={nextQuestion} style={{ width: '100%', padding: '14px', background: course.color, color: '#050a0f', border: 'none', borderRadius: '8px', fontFamily: 'Cairo,sans-serif', fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>
                      {currentQ < questions.length - 1 ? 'السؤال التالي ←' : 'إنهاء الاختبار'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center' }} dir="rtl">
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                  {quizScore === questions.length ? '🏆' : quizScore >= questions.length / 2 ? '🎯' : '📚'}
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px' }}>
                  نتيجتك: <span style={{ color: course.color }}>{quizScore}/{questions.length}</span>
                </h2>
                <p style={{ color: '#7090a8', marginBottom: '28px' }}>
                  {quizScore === questions.length ? 'ممتاز! إجابات كاملة 🎉' : quizScore >= questions.length / 2 ? 'جيد! راجع الإجابات الخاطئة' : 'راجع الدرس وحاول مرة ثانية'}
                </p>
                <div style={{ background: '#0f1f30', border: '1px solid #1a3a50', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                  <p style={{ color: course.color, fontWeight: '900', fontSize: '24px', fontFamily: 'monospace' }}>
                    +{15 + (quizScore === questions.length ? 25 : quizScore > 0 ? 10 : 0)} نقطة
                  </p>
                  <p style={{ color: '#7090a8', fontSize: '13px', marginTop: '4px' }}>
                    15 للدرس {quizScore === questions.length ? '+ 25 مكافأة الاختبار الكامل! 🏆' : quizScore > 0 ? '+ 10 لإجابات صحيحة' : ''}
                  </p>
                </div>
                <button onClick={finishQuiz} style={{ width: '100%', padding: '16px', background: course.color, color: '#050a0f', border: 'none', borderRadius: '8px', fontFamily: 'Cairo,sans-serif', fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>
                  احفظ النتيجة وتابع ←
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ background: 'rgba(5,10,15,0.95)', borderBottom: '1px solid #1a3a50', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ background: '#0a1520', border: '1px solid #1a3a50', color: '#7090a8', padding: '8px 16px', borderRadius: '6px', fontFamily: 'Cairo,sans-serif', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = course.color)}
              onMouseOut={e => (e.currentTarget.style.borderColor = '#1a3a50')}>
              ← العودة
            </button>
            <span className="nav-course-title" style={{ color: course.color, fontFamily: 'monospace', fontWeight: '700', fontSize: '15px' }}>{course.icon} {course.title}</span>
          </div>
          <div style={{ background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '100px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ffd700' }}>⭐</span>
            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'white' }}>{points}</span>
            <span style={{ color: '#7090a8', fontSize: '13px' }}>نقطة</span>
          </div>
        </nav>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div className="sidebar-desktop" style={{ width: '280px', background: '#080f18', borderLeft: '1px solid #1a3a50', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #1a3a50' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#7090a8', fontSize: '13px', fontFamily: 'monospace' }}>التقدم</span>
                <span style={{ color: course.color, fontSize: '13px', fontFamily: 'monospace', fontWeight: '700' }}>{doneCount}/{totalLessons}</span>
              </div>
              <div style={{ background: '#0f1f30', borderRadius: '2px', height: '6px' }}>
                <div style={{ background: course.color, height: '6px', borderRadius: '2px', width: `${percent}%`, transition: 'width 0.5s', boxShadow: `0 0 8px ${course.color}66` }}></div>
              </div>
              <p style={{ color: '#7090a8', fontSize: '12px', marginTop: '8px', fontFamily: 'monospace' }}>{percent}% مكتمل</p>
            </div>
            <div style={{ padding: '12px', flex: 1 }}>
              {lessons.map((lesson, i) => {
                const isDone = completed.has(lesson.id)
                const isCurrent = currentLesson?.id === lesson.id
                return (
                  <button key={lesson.id} onClick={() => { setCurrentLesson(lesson); setShowQuiz(false) }}
                    style={{ width: '100%', textAlign: 'right', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${isCurrent ? course.color + '66' : '#1a3a50'}`, background: isCurrent ? course.color + '11' : 'transparent', color: isCurrent ? 'white' : '#7090a8', fontFamily: 'Cairo,sans-serif', fontSize: '14px', cursor: 'pointer', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}
                    onMouseOver={e => { if (!isCurrent) e.currentTarget.style.borderColor = course.color + '44' }}
                    onMouseOut={e => { if (!isCurrent) e.currentTarget.style.borderColor = '#1a3a50' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: isDone ? '#00ff88' : isCurrent ? course.color : '#1a3a50', minWidth: '20px' }}>
                      {isDone ? '✔' : String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ flex: 1, textAlign: 'right' }}>{lesson.title}</span>
                  </button>
                )
              })}
            </div>

            {courseCompleted && (
              <div style={{ padding: '16px', borderTop: '1px solid #1a3a50' }}>
                <button className="cert-btn" onClick={generateCertificate} disabled={certLoading}
                  style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${course.color}22, ${course.color}11)`, border: `1px solid ${course.color}`, borderRadius: '10px', color: course.color, fontFamily: 'Cairo,sans-serif', fontSize: '14px', fontWeight: '900', cursor: certLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {certLoading ? '⏳ جاري التوليد...' : '🏅 تحميل الشهادة'}
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', background: '#050a0f' }}>
            {courseCompleted && (
              <div style={{ background: `linear-gradient(135deg, ${course.color}15, ${course.color}05)`, borderBottom: `1px solid ${course.color}44`, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '36px' }}>🏆</span>
                  <div>
                    <p style={{ color: course.color, fontWeight: '900', fontSize: '18px' }}>أتممت المسار بنجاح!</p>
                    <p style={{ color: '#7090a8', fontSize: '13px', marginTop: '4px' }}>يمكنك الآن تحميل شهادة الإتمام الخاصة بك</p>
                  </div>
                </div>
                <button className="cert-btn" onClick={generateCertificate} disabled={certLoading}
                  style={{ padding: '14px 28px', background: course.color, color: '#050a0f', border: 'none', borderRadius: '10px', fontFamily: 'Cairo,sans-serif', fontSize: '15px', fontWeight: '900', cursor: certLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
                  {certLoading ? '⏳ جاري التوليد...' : '📜 تحميل الشهادة PDF'}
                </button>
              </div>
            )}

            {currentLesson && (
              <div className="lesson-content lesson-main" style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 40px' }}>
                <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #1a3a50' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontFamily: 'monospace', color: '#1a3a50', fontSize: '13px' }}>
                      {String(lessons.findIndex(l => l.id === currentLesson.id) + 1).padStart(2, '0')} / {String(totalLessons).padStart(2, '0')}
                    </span>
                    {completed.has(currentLesson.id) && (
                      <span style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff8866', color: '#00ff88', padding: '2px 10px', borderRadius: '100px', fontSize: '12px', fontFamily: 'monospace' }}>✔ مكتمل</span>
                    )}
                  </div>
                  <h1 className="lesson-title" style={{ fontSize: '32px', fontWeight: '900', color: 'white', lineHeight: '1.3' }}>{currentLesson.title}</h1>
                </div>

                <div style={{ lineHeight: '2', color: '#a0c0d8', fontSize: '16px' }}
                  dangerouslySetInnerHTML={{ __html: renderContent(currentLesson.content) }} />

                <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #1a3a50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {completed.has(currentLesson.id) ? (
                    <span style={{ color: '#00ff88', fontWeight: '700', fontFamily: 'monospace' }}>✔ تم إتمام هذا الدرس</span>
                  ) : (
                    <button onClick={startQuiz}
                      style={{ background: course.color, color: '#050a0f', padding: '14px 32px', border: 'none', borderRadius: '8px', fontFamily: 'Cairo,sans-serif', fontSize: '16px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: `0 0 24px ${course.color}44` }}>
                      ⚡ ابدأ الاختبار <span style={{ opacity: 0.7 }}>(+15 نقطة)</span>
                    </button>
                  )}
                  {completed.has(currentLesson.id) && lessons.findIndex(l => l.id === currentLesson.id) < lessons.length - 1 && (
                    <button onClick={() => setCurrentLesson(lessons[lessons.findIndex(l => l.id === currentLesson.id) + 1])}
                      style={{ background: '#0a1520', color: course.color, padding: '14px 28px', border: `1px solid ${course.color}66`, borderRadius: '8px', fontFamily: 'Cairo,sans-serif', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                      الدرس التالي ←
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}