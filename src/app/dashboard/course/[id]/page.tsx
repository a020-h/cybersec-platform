'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function CoursePage() {
  const [lessons, setLessons] = useState<any[]>([])
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const staticCourses: Record<string, { title: string; color: string; icon: string }> = {
    '1': { title: 'أساسيات الأمن السيبراني', color: 'from-green-600 to-green-800', icon: '🛡️' },
    '2': { title: 'الشبكات وبروتوكولات TCP/IP', color: 'from-blue-600 to-blue-800', icon: '🌐' },
    '3': { title: 'اختبار الاختراق', color: 'from-purple-600 to-purple-800', icon: '💻' },
    '4': { title: 'تحليل البرمجيات الخبيثة', color: 'from-red-600 to-red-800', icon: '🦠' },
    '5': { title: 'الهندسة الاجتماعية', color: 'from-yellow-600 to-yellow-800', icon: '🎭' },
    '6': { title: 'التشفير وعلم الكريبتو', color: 'from-pink-600 to-pink-800', icon: '🔐' },
  }

  const dbCourseIds: Record<string, string> = {
    '1': '00000000-0000-0000-0000-000000000001',
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)

      const dbCourseId = dbCourseIds[courseId]
      if (dbCourseId) {
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', dbCourseId)
          .order('order_num')
        if (lessonsData && lessonsData.length > 0) {
          setLessons(lessonsData)
          setCurrentLesson(lessonsData[0])
          const { data: comp } = await supabase
            .from('lesson_completions')
            .select('lesson_id')
            .eq('user_id', session.user.id)
          if (comp) setCompleted(new Set(comp.map((c: any) => c.lesson_id)))
        }
      } else {
        setLessons([{ id: 'demo', title: 'قريباً...', content: '## المحتوى قيد الإعداد\n\nسيتوفر هذا المسار قريباً! 🚀' }])
        setCurrentLesson({ id: 'demo', title: 'قريباً...', content: '## المحتوى قيد الإعداد\n\nسيتوفر هذا المسار قريباً! 🚀' })
      }

      const { data: profile } = await supabase.from('profiles').select('points').eq('id', session.user.id).single()
      if (profile) setPoints(profile.points)
      setLoading(false)
    })
  }, [courseId])

  const completeLesson = async () => {
    if (!user || !currentLesson || completed.has(currentLesson.id)) return
    await supabase.from('lesson_completions').upsert({ user_id: user.id, course_id: parseInt(courseId), lesson_id: currentLesson.id })
    const newPoints = points + 15
    await supabase.from('profiles').upsert({ id: user.id, points: newPoints })
    setCompleted(new Set([...completed, currentLesson.id]))
    setPoints(newPoints)
    const idx = lessons.findIndex(l => l.id === currentLesson.id)
    if (idx < lessons.length - 1) setCurrentLesson(lessons[idx + 1])
  }

  const renderContent = (content: string) => {
    return content
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-green-400 mt-6 mb-3">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-blue-400 mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 text-gray-300">• $1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-1 text-gray-300">$1. $2</li>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-r-4 border-green-500 pr-4 my-3 text-gray-300 italic">$1</blockquote>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-700 px-2 py-0.5 rounded text-green-300 text-sm">$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl">جاري التحميل... ⏳</div>

  const course = staticCourses[courseId] || { title: 'المسار', color: 'from-gray-600 to-gray-800', icon: '📚' }

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">← العودة</button>
          <span className="text-green-400 font-bold">{course.icon} {course.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold">⭐ {points} نقطة</span>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto p-4">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>التقدم</span>
              <span>{completed.size}/{lessons.length}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${lessons.length ? (completed.size / lessons.length) * 100 : 0}%` }}></div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentLesson && (
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold mb-6 text-white">{currentLesson.title}</h1>
              <div className="prose prose-invert bg-gray-800 rounded-2xl p-8 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderContent(currentLesson.content) }} />
              <div className="mt-8 flex justify-between items-center">
                <div>
                  {completed.has(currentLesson.id) ? (
                    <span className="text-green-400 font-bold text-lg">✅ تم إتمام هذا الدرس</span>
                  ) : (
                    <button onClick={completeLesson}
                      className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl font-bold text-lg transition">
                      إتمام الدرس (+15 نقطة) →
                    </button>
                  )}
                </div>
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