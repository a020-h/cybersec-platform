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
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      // نُنشئ client جديد في كل مرة لضمان الـ session
      
      let { data: { session } } = await supabase.auth.getSession()

// انتظر الـ session إذا لم تكن جاهزة
if (!session) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const { data } = await supabase.auth.getSession()
  session = data.session
}

if (!session) { router.push('/'); return }
      setUser(session.user)

      // جلب الدروس مع إرسال الـ token يدوياً
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lessons?course_id=eq.${DB_COURSE_ID}&order=order_num.asc`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      )
      const lessonsData = await res.json()
      console.log('lessons fetched:', lessonsData)

      if (lessonsData && lessonsData.length > 0) {
        setLessons(lessonsData)
        setCurrentLesson(lessonsData[0])
      } else {
        const demo = { id: 'demo', title: 'قريباً...', content: '## المحتوى قيد الإعداد\n\nسيتوفر هذا المسار قريباً! 🚀' }
        setLessons([demo])
        setCurrentLesson(demo)
      }

      // جلب النقاط
      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=points`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      )
      const profileData = await profileRes.json()
      if (profileData?.[0]) setPoints(profileData[0].points)

      // جلب الدروس المكتملة
      const compRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lesson_completions?user_id=eq.${session.user.id}&select=lesson_id`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      )
      const compData = await compRes.json()
      if (compData) setCompleted(new Set(compData.map((c: any) => c.lesson_id)))

      setLoading(false)
    }
    init()
  }, [])

  const completeLesson = async () => {
    if (!user || !currentLesson || completed.has(currentLesson.id) || currentLesson.id === 'demo') return
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/lesson_completions`, {
      method: 'POST',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ user_id: user.id, course_id: parseInt(courseId), lesson_id: currentLesson.id })
    })

    const newPoints = points + 15
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
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

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl">
      جاري التحميل... ⏳
    </div>
  )

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

      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto p-4">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>التقدم</span>
              <span>{completed.size}/{lessons.length}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${lessons.length ? (completed.size / lessons.length) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            {lessons.map((lesson, i) => (
              <button key={lesson.id} onClick={() => setCurrentLesson(lesson)}
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
                  <button onClick={completeLesson}
                    className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl font-bold text-lg transition">
                    إتمام الدرس (+15 نقطة) →
                  </button>
                )}
                {completed.has(currentLesson.id) &&
                  lessons.findIndex(l => l.id === currentLesson.id) < lessons.length - 1 && (
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