'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const courses = [
  { id: 1, title: 'أساسيات الأمن السيبراني', level: 'مبتدئ', icon: '🛡️', lessons: 3, color: 'from-green-600 to-green-800' },
  { id: 2, title: 'الشبكات وبروتوكولات TCP/IP', level: 'مبتدئ', icon: '🌐', lessons: 2, color: 'from-blue-600 to-blue-800' },
  { id: 3, title: 'اختبار الاختراق', level: 'متوسط', icon: '💻', lessons: 1, color: 'from-purple-600 to-purple-800' },
  { id: 4, title: 'تحليل البرمجيات الخبيثة', level: 'متقدم', icon: '🦠', lessons: 1, color: 'from-red-600 to-red-800' },
  { id: 5, title: 'الهندسة الاجتماعية', level: 'متوسط', icon: '🎭', lessons: 1, color: 'from-yellow-600 to-yellow-800' },
  { id: 6, title: 'التشفير وعلم الكريبتو', level: 'متقدم', icon: '🔐', lessons: 1, color: 'from-pink-600 to-pink-800' },
]

const getLevel = (points: number) => {
  if (points >= 200) return 'خبير'
  if (points >= 100) return 'متقدم'
  if (points >= 50) return 'متوسط'
  return 'مبتدئ'
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
      else {
        setUser(session.user)
        loadStats(session.user.id)
      }
    })
  }, [])

  const loadStats = async (userId: string) => {
    // تحميل النقاط
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single()
    if (profile) setPoints(profile.points)

    // تحميل الدروس المكتملة
    const { data: completions } = await supabase
      .from('lesson_completions')
      .select('course_id, lesson_id')
      .eq('user_id', userId)

    if (completions) {
      setLessonsCompleted(completions.length)
      // حساب التقدم لكل كورس
      const progress: Record<number, number> = {}
      completions.forEach(c => {
        progress[c.course_id] = (progress[c.course_id] || 0) + 1
      })
      setCourseProgress(progress)
    }
  }

  if (!user) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">جاري التحميل...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-400">🔐 CYBERعربي</h1>
        <div className="flex items-center gap-4">
          <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">⭐ {points} نقطة</span>
          <span className="text-gray-400 text-sm">{user.email}</span>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="bg-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-700 text-white"
          >خروج</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-12 text-center border-b border-gray-700">
        <h2 className="text-4xl font-bold mb-2">مرحباً بك في رحلتك! 🚀</h2>
        <p className="text-gray-400 text-lg">اختر مساراً وابدأ التعلم الآن</p>
        <div className="flex justify-center gap-8 mt-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{points}</p>
            <p className="text-gray-400 text-sm">نقطة</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">{lessonsCompleted}</p>
            <p className="text-gray-400 text-sm">درس مكتمل</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-400">{getLevel(points)}</p>
            <p className="text-gray-400 text-sm">المستوى</p>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="px-6 py-10 max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold mb-6">📚 المسارات التعليمية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => {
            const done = courseProgress[course.id] || 0
            const percent = Math.round((done / course.lessons) * 100)
            return (
              <div key={course.id} className={`bg-gradient-to-br ${course.color} rounded-2xl p-6 hover:scale-105 transition-transform`}>
                <div className="text-4xl mb-3">{course.icon}</div>
                <h4 className="text-xl font-bold mb-2">{course.title}</h4>
                <div className="flex justify-between items-center mt-4">
                  <span className="bg-black bg-opacity-30 px-3 py-1 rounded-full text-sm">{course.level}</span>
                  <span className="text-sm text-gray-200">{done}/{course.lessons} درس</span>
                </div>
                {/* شريط التقدم */}
                <div className="mt-3 bg-black bg-opacity-30 rounded-full h-2">
                  <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${percent}%` }}></div>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/course/${course.id}`)}
                  className="mt-4 w-full bg-white bg-opacity-20 hover:bg-opacity-30 py-2 rounded-lg text-sm font-bold transition text-white"
                >
                  {percent === 100 ? '✓ مكتمل — مراجعة' : percent > 0 ? 'متابعة المسار ←' : 'ابدأ المسار ←'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}