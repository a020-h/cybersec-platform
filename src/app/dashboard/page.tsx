'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const courses = [
  { id: 1, title: 'أساسيات الأمن السيبراني', level: 'مبتدئ', icon: '🛡️', lessons: 3, color: 'from-emerald-500 to-teal-700', bg: 'bg-emerald-500' },
  { id: 2, title: 'الشبكات وبروتوكولات TCP/IP', level: 'مبتدئ', icon: '🌐', lessons: 2, color: 'from-blue-500 to-cyan-700', bg: 'bg-blue-500' },
  { id: 3, title: 'اختبار الاختراق', level: 'متوسط', icon: '💻', lessons: 1, color: 'from-violet-500 to-purple-700', bg: 'bg-violet-500' },
  { id: 4, title: 'تحليل البرمجيات الخبيثة', level: 'متقدم', icon: '🦠', lessons: 1, color: 'from-rose-500 to-red-700', bg: 'bg-rose-500' },
  { id: 5, title: 'الهندسة الاجتماعية', level: 'متوسط', icon: '🎭', lessons: 1, color: 'from-amber-500 to-orange-700', bg: 'bg-amber-500' },
  { id: 6, title: 'التشفير وعلم الكريبتو', level: 'متقدم', icon: '🔐', lessons: 1, color: 'from-pink-500 to-fuchsia-700', bg: 'bg-pink-500' },
]

const levelColors: Record<string, string> = {
  'مبتدئ': 'bg-emerald-500 text-white',
  'متوسط': 'bg-amber-500 text-white',
  'متقدم': 'bg-rose-500 text-white',
}

const getLevel = (points: number) => {
  if (points >= 200) return { label: 'خبير', color: 'text-yellow-400', icon: '👑' }
  if (points >= 100) return { label: 'متقدم', color: 'text-purple-400', icon: '⚡' }
  if (points >= 50) return { label: 'متوسط', color: 'text-blue-400', icon: '🔥' }
  return { label: 'مبتدئ', color: 'text-green-400', icon: '🌱' }
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [lessonsCompleted, setLessonsCompleted] = useState(0)
  const [courseProgress, setCourseProgress] = useState<Record<number, number>>({})
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/') }
      else { setUser(session.user); loadStats(session.user.id) }
    })
  }, [])

  const loadStats = async (userId: string) => {
    const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single()
    if (profile) setPoints(profile.points)
    const { data: completions } = await supabase.from('lesson_completions').select('course_id, lesson_id').eq('user_id', userId)
    if (completions) {
      setLessonsCompleted(completions.length)
      const progress: Record<number, number> = {}
      completions.forEach((c: any) => { progress[c.course_id] = (progress[c.course_id] || 0) + 1 })
      setCourseProgress(progress)
    }
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">جاري التحميل...</p>
      </div>
    </div>
  )

  const level = getLevel(points)
  const totalLessons = courses.reduce((a, c) => a + c.lessons, 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">🔐 CYBERعربي</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full">
              <span className="text-yellow-400">⭐</span>
              <span className="font-bold text-white">{points}</span>
              <span className="text-gray-400 text-sm">نقطة</span>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-full text-sm text-gray-300">
              {user.email?.split('@')[0]}
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-sm font-medium transition">
              خروج
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-gray-950 to-blue-900/20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 px-4 py-2 rounded-full text-sm text-gray-300 mb-6">
            <span>{level.icon}</span>
            <span>مستواك الحالي:</span>
            <span className={`font-bold ${level.color}`}>{level.label}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            أهلاً، <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">{user.email?.split('@')[0]}</span> 👋
          </h1>
          <p className="text-gray-400 text-lg mb-10">واصل رحلتك في عالم الأمن السيبراني</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-green-500/50 transition">
              <p className="text-3xl font-black text-green-400 mb-1">{points}</p>
              <p className="text-gray-400 text-sm">نقطة مكتسبة</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-blue-500/50 transition">
              <p className="text-3xl font-black text-blue-400 mb-1">{lessonsCompleted}</p>
              <p className="text-gray-400 text-sm">درس مكتمل</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-purple-500/50 transition">
              <p className="text-3xl font-black text-purple-400 mb-1">{Math.round((lessonsCompleted/totalLessons)*100)}%</p>
              <p className="text-gray-400 text-sm">نسبة الإنجاز</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black">المسارات التعليمية</h2>
            <p className="text-gray-400 mt-1">اختر مساراً وابدأ التعلم</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-full text-sm text-gray-400">
            {courses.filter(c => (courseProgress[c.id] || 0) >= c.lessons).length}/{courses.length} مسار مكتمل
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => {
            const done = courseProgress[course.id] || 0
            const percent = Math.round((done / course.lessons) * 100)
            const isComplete = percent === 100

            return (
              <div key={course.id}
                className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50">
                {/* Card Header */}
                <div className={`bg-gradient-to-br ${course.color} p-6 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative flex justify-between items-start">
                    <span className="text-5xl">{course.icon}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium bg-black/30 text-white`}>
                      {course.level}
                    </span>
                  </div>
                  <h3 className="relative text-xl font-bold mt-4 text-white">{course.title}</h3>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400 text-sm">{done}/{course.lessons} درس</span>
                    <span className={`text-sm font-bold ${isComplete ? 'text-green-400' : 'text-gray-400'}`}>
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-5">
                    <div className={`h-2 rounded-full transition-all bg-gradient-to-r ${course.color}`}
                      style={{ width: `${percent}%` }} />
                  </div>
                  <button onClick={() => window.location.href = `/dashboard/course/${course.id}`}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition
                      ${isComplete
                        ? 'bg-gray-800 hover:bg-gray-700 text-green-400 border border-green-500/30'
                        : `bg-gradient-to-r ${course.color} text-white hover:opacity-90`
                      }`}>
                    {isComplete ? '✓ مكتمل — مراجعة' : percent > 0 ? 'متابعة المسار ←' : 'ابدأ المسار ←'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}