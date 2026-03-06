'use client'
import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const DB_COURSE_ID = '00000000-0000-0000-0000-000000000001'

const staticCourses: Record<string, { title: string; icon: string }> = {
  '1': { title: 'أساسيات الأمن السيبراني', icon: '🛡️' },
  '2': { title: 'الشبكات وبروتوكولات TCP/IP', icon: '🌐' },
  '3': { title: 'اختبار الاختراق', icon: '💻' },
  '4': { title: 'تحليل البرمجيات الخبيثة', icon: '🦠' },
  '5': { title: 'الهندسة الاجتماعية', icon: '🎭' },
  '6': { title: 'التشفير وعلم الكريبتو', icon: '🔐' },
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [lessons, setLessons] = useState<any[]>([])
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [sessionToken, setSessionToken] = useState<string>('')
  const router = useRouter()

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

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lessons?course_id=eq.${DB_COURSE_ID}&order=order_num.asc`,
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
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=points`,
        { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${session.access_token}` } }
      )
      const profileData = await profileRes.json()
      if (profileData?.[0]) setPoints(profileData[0].points)

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

  const startQuiz = async () => {
    if (!currentLesson || currentLesson.id === 'demo') return
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/questions?lesson_id=eq.${currentLesson.id}`,
      { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${sessionToken}` } }
    )
    const data = await res.json()
    if (data?.length > 0) {
      setQuestions(data)
      setCurrentQ(0)
      setSelected(null)
      setAnswered(false)
      setQuizScore(0)
      setQuizDone(false)
      setShowQuiz(true)
    }
  }

  const handleAnswer = (opt: string) => {
    if (answered) return
    setSelected(opt)
    setAnswered(true)
    if (opt === questions[currentQ].correct_answer) setQuizScore(s => s + 1)
  }

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setQuizDone(true)
    }
  }

  const finishQuiz = async () => {
    setShowQuiz(false)
    if (completed.has(currentLesson.id)) return
    const bonus = quizScore === questions.length ? 25 : quizScore > 0 ? 10 : 0

    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lesson_completions`, {
      method: 'POST',
      headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${sessionToken}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: user.id, course_id: parseInt(courseId), lesson_id: currentLesson.id })
    })

    const newPoints = points + 15 + bonus
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Authorization': `Bearer ${sessionToken}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: user.id, points: newPoints })
    })

    setCompleted(new Set([...completed, currentLesson.id]))
    setPoints(newPoints)
    const idx = lessons.findIndex(l => l.id === currentLesson.id)
    if (idx < lessons.length - 1) setCurrentLesson(lessons[idx + 1])
  }

  const renderContent = (content: string) => content
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-green-400 mt-6 mb-3">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-blue-400 mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 text-gray-300">• $1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-1 text-gray-300">$1. $2</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-r-4 border-green-500 pr-4 my-3 text-gray-300 italic">$1</blockquote>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-700 px-2 py-0.5 rounded text-green-300 text-sm">$1</code>')
    .replace(/\n\n/g, '<br/><br/>')

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl">جاري التحميل... ⏳</div>

  const course = staticCourses[courseId] || { title: 'المسار', icon: '📚' }

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white transition">← العودة</button>
          <span className="text-green-400 font-bold">{course.icon} {course.title}</span>
        </div>
        <span className="text-yellow-400 font-bold">⭐ {points} نقطة</span>
      </nav>

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full" dir="rtl">
            {!quizDone ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-green-400">🧠 اختبر معلوماتك</h2>
                  <span className="text-gray-400 text-sm">سؤال {currentQ + 1} / {questions.length}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
                </div>
                <p className="text-lg font-bold mb-6 text-white">{questions[currentQ].question}</p>
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const text = questions[currentQ][`option_${opt.toLowerCase()}`]
                    const isCorrect = opt === questions[currentQ].correct_answer
                    const isSelected = opt === selected
                    let cls = 'w-full text-right p-4 rounded-xl border-2 transition font-medium '
                    if (!answered) cls += 'border-gray-600 hover:border-green-500 hover:bg-gray-700 cursor-pointer'
                    else if (isCorrect) cls += 'border-green-500 bg-green-900 text-green-300'
                    else if (isSelected) cls += 'border-red-500 bg-red-900 text-red-300'
                    else cls += 'border-gray-600 opacity-50'
                    return (
                      <button key={opt} className={cls} onClick={() => handleAnswer(opt)}>
                        <span className="font-bold ml-2">{opt}.</span> {text}
                      </button>
                    )
                  })}
                </div>
                {answered && (
                  <div className="mt-4">
                    <div className={`p-3 rounded-lg mb-4 ${selected === questions[currentQ].correct_answer ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {selected === questions[currentQ].correct_answer ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة'}
                      {questions[currentQ].explanation && <p className="text-sm mt-1 text-gray-300">{questions[currentQ].explanation}</p>}
                    </div>
                    <button onClick={nextQuestion} className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold transition">
                      {currentQ < questions.length - 1 ? 'السؤال التالي ←' : 'إنهاء الاختبار'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">{quizScore === questions.length ? '🏆' : quizScore >= questions.length / 2 ? '👍' : '📚'}</div>
                <h2 className="text-2xl font-bold mb-2">نتيجتك: {quizScore}/{questions.length}</h2>
                <p className="text-gray-400 mb-6">
                  {quizScore === questions.length ? 'ممتاز! أجبت على كل الأسئلة صح 🌟' : quizScore >= questions.length / 2 ? 'جيد! راجع الإجابات الخاطئة' : 'راجع الدرس وحاول مرة ثانية'}
                </p>
                <div className="bg-gray-700 rounded-xl p-4 mb-6">
                  <p className="text-green-400 font-bold text-lg">
                    +{15 + (quizScore === questions.length ? 25 : quizScore > 0 ? 10 : 0)} نقطة
                  </p>
                  <p className="text-gray-400 text-sm">15 لإتمام الدرس {quizScore === questions.length ? '+ 25 مكافأة الاختبار الكامل!' : quizScore > 0 ? '+ 10 لإجابات صحيحة' : ''}</p>
                </div>
                <button onClick={finishQuiz} className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold transition">
                  احفظ النتيجة وتابع →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto p-4">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>التقدم</span>
              <span>{completed.size}/{lessons.length}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${lessons.length ? (completed.size / lessons.length) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            {lessons.map((lesson, i) => (
              <button key={lesson.id} onClick={() => { setCurrentLesson(lesson); setShowQuiz(false) }}
                className={`w-full text-right p-3 rounded-lg text-sm transition flex items-center gap-2
                  ${currentLesson?.id === lesson.id ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
                <span>{completed.has(lesson.id) ? '✅' : `${i + 1}`}</span>
                <span>{lesson.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {currentLesson && (
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">{currentLesson.title}</h1>
              <div className="bg-gray-800 rounded-2xl p-8 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderContent(currentLesson.content) }} />
              <div className="mt-8 flex justify-between items-center">
                {completed.has(currentLesson.id) ? (
                  <span className="text-green-400 font-bold text-lg">✅ تم إتمام هذا الدرس</span>
                ) : (
                  <button onClick={startQuiz}
                    className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl font-bold text-lg transition">
                    🧠 ابدأ الاختبار (+15 نقطة) →
                  </button>
                )}
                {completed.has(currentLesson.id) && lessons.findIndex(l => l.id === currentLesson.id) < lessons.length - 1 && (
                  <button onClick={() => setCurrentLesson(lessons[lessons.findIndex(l => l.id === currentLesson.id) + 1])}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition">
                    الدرس التالي →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}