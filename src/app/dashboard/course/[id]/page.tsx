'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

const coursesData: Record<string, any> = {
  '1': {
    title: 'أساسيات الأمن السيبراني',
    icon: '🛡️',
    color: 'from-green-600 to-green-800',
    lessons: [
      { id: 1, title: 'ما هو الأمن السيبراني؟', duration: '10 دقائق', points: 10, content: `## ما هو الأمن السيبراني؟\n\nالأمن السيبراني هو ممارسة حماية الأنظمة والشبكات والبرامج من الهجمات الرقمية.\n\n### لماذا هو مهم؟\n- 🔴 تكلّف الجرائم الإلكترونية العالم **تريليونات الدولارات** سنوياً\n- 🔴 كل **39 ثانية** يحدث هجوم إلكتروني\n- 🔴 **95%** من الاختراقات سببها خطأ بشري\n\n### أنواع التهديدات الرئيسية\n1. **Malware** — برمجيات خبيثة تضر بالأجهزة\n2. **Phishing** — التصيد الاحتيالي لسرقة البيانات\n3. **Ransomware** — تشفير ملفاتك وطلب فدية\n4. **DDoS** — إغراق الخوادم بالطلبات\n\n> 💡 **القاعدة الذهبية:** لا تثق بأي رابط أو إيميل غير متوقع!` },
      { id: 2, title: 'مبدأ CIA Triad', duration: '15 دقائق', points: 15, content: `## مبدأ CIA Triad — ثالوث الأمن\n\nهذا المبدأ هو أساس كل أمن سيبراني في العالم.\n\n### C — Confidentiality (السرية)\nالبيانات لا يراها إلا من يملك الصلاحية.\n- مثال: كلمة مرور الحساب البنكي\n\n### I — Integrity (النزاهة)\nالبيانات لم تُعدَّل أو تُزوَّر.\n- مثال: رصيدك في البنك لم يتغير بدون إذنك\n\n### A — Availability (التوفر)\nالخدمة متاحة دائماً لمن يحتاجها.\n- مثال: موقع البنك يعمل 24/7\n\n> 💡 أي هجوم إلكتروني يستهدف واحداً من هذه المبادئ الثلاثة!` },
      { id: 3, title: 'أنواع المهاجمين (Threat Actors)', duration: '12 دقائق', points: 20, content: `## من هم المهاجمون؟\n\n### 1. Script Kiddies 👶\nمبتدئون يستخدمون أدوات جاهزة بدون فهم.\n- **الخطر:** منخفض نسبياً\n\n### 2. Hacktivists 🏴\nمخترقون لأهداف سياسية أو اجتماعية.\n- **مثال:** مجموعة Anonymous\n\n### 3. Cybercriminals 💰\nهدفهم المال فقط.\n- **مثال:** عصابات Ransomware\n\n### 4. Nation-State Actors 🏛️\nمخترقون تموّلهم حكومات.\n- **الخطر:** عالي جداً\n\n### 5. Insider Threats 😈\nموظفون داخل الشركة.\n- **أخطر أنواع التهديدات!**` },
    ]
  },
  '2': {
    title: 'الشبكات وبروتوكولات TCP/IP', icon: '🌐', color: 'from-blue-600 to-blue-800',
    lessons: [
      { id: 1, title: 'مقدمة في الشبكات', duration: '10 دقائق', points: 10, content: `## مقدمة في الشبكات\n\nالشبكة هي مجموعة من الأجهزة المتصلة ببعضها لتبادل البيانات.\n\n### أنواع الشبكات\n- **LAN** — شبكة محلية (المنزل، المكتب)\n- **WAN** — شبكة واسعة (الإنترنت)\n- **MAN** — شبكة المدينة` },
      { id: 2, title: 'بروتوكول TCP/IP', duration: '20 دقائق', points: 20, content: `## بروتوكول TCP/IP\n\nهو اللغة التي تتحدث بها الأجهزة على الإنترنت.\n\n### الطبقات الأربع\n1. **Application** — HTTP, DNS, FTP\n2. **Transport** — TCP, UDP\n3. **Internet** — IP\n4. **Network Access** — Ethernet, WiFi` },
    ]
  },
  '3': { title: 'اختبار الاختراق', icon: '💻', color: 'from-purple-600 to-purple-800', lessons: [{ id: 1, title: 'مقدمة في Penetration Testing', duration: '15 دقائق', points: 15, content: `## اختبار الاختراق\n\nهو عملية محاكاة هجوم حقيقي على نظام بإذن رسمي.\n\n### المراحل الخمس\n1. **Reconnaissance** — جمع المعلومات\n2. **Scanning** — فحص الثغرات\n3. **Exploitation** — استغلال الثغرات\n4. **Post-Exploitation** — ماذا بعد؟\n5. **Reporting** — كتابة التقرير` }] },
  '4': { title: 'تحليل البرمجيات الخبيثة', icon: '🦠', color: 'from-red-600 to-red-800', lessons: [{ id: 1, title: 'أنواع البرمجيات الخبيثة', duration: '12 دقائق', points: 12, content: `## أنواع البرمجيات الخبيثة\n\n### 1. Virus\nيلصق نفسه ببرامج أخرى وينتشر.\n\n### 2. Worm\nينتشر وحده عبر الشبكة.\n\n### 3. Trojan\nيتنكر كبرنامج شرعي.\n\n### 4. Ransomware\nيشفّر ملفاتك ويطلب فدية.` }] },
  '5': { title: 'الهندسة الاجتماعية', icon: '🎭', color: 'from-yellow-600 to-yellow-800', lessons: [{ id: 1, title: 'ما هي الهندسة الاجتماعية؟', duration: '10 دقائق', points: 10, content: `## الهندسة الاجتماعية\n\nهي فن التلاعب بالبشر للحصول على معلومات سرية.\n\n### أشهر الأساليب\n- **Phishing** — إيميلات مزيفة\n- **Pretexting** — انتحال شخصية\n- **Baiting** — إغراء الضحية\n- **Tailgating** — الدخول خلف موظف` }] },
  '6': { title: 'التشفير وعلم الكريبتو', icon: '🔐', color: 'from-pink-600 to-pink-800', lessons: [{ id: 1, title: 'مقدمة في التشفير', duration: '15 دقائق', points: 15, content: `## التشفير\n\nهو تحويل البيانات لصيغة غير مقروءة إلا بمفتاح خاص.\n\n### أنواع التشفير\n- **Symmetric** — مفتاح واحد للتشفير والفك (AES)\n- **Asymmetric** — مفتاح عام وخاص (RSA)\n- **Hashing** — تحويل أحادي الاتجاه (SHA-256)` }] },
}

export default function CoursePage() {
  const [user, setUser] = useState<any>(null)
  const [activeLesson, setActiveLesson] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const course = coursesData[courseId]

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/')
      else {
        setUser(session.user)
        loadProgress(session.user.id)
      }
    })
  }, [])

  const loadProgress = async (userId: string) => {
    // تحميل الدروس المكتملة
    const { data: completions } = await supabase
      .from('lesson_completions')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', parseInt(courseId))

    if (completions) {
      setCompleted(completions.map(c => c.lesson_id - 1))
    }

    // تحميل النقاط
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single()

    if (profile) setTotalPoints(profile.points)
  }

  const markComplete = async () => {
    if (!user || completed.includes(activeLesson)) {
      if (activeLesson < course.lessons.length - 1) setActiveLesson(activeLesson + 1)
      return
    }

    setSaving(true)
    const lesson = course.lessons[activeLesson]
    const points = lesson.points || 10

    // حفظ الدرس كمكتمل
    await supabase.from('lesson_completions').upsert({
      user_id: user.id,
      course_id: parseInt(courseId),
      lesson_id: lesson.id,
    })

    // تحديث أو إنشاء الملف الشخصي مع النقاط
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single()

    if (profile) {
      await supabase.from('profiles').update({ points: profile.points + points }).eq('id', user.id)
      setTotalPoints(profile.points + points)
    } else {
      await supabase.from('profiles').insert({ id: user.id, points: points })
      setTotalPoints(points)
    }

    setCompleted([...completed, activeLesson])
    setEarnedPoints(points)
    setShowPoints(true)
    setTimeout(() => setShowPoints(false), 2000)
    setSaving(false)

    if (activeLesson < course.lessons.length - 1) {
      setTimeout(() => setActiveLesson(activeLesson + 1), 500)
    }
  }

  if (!user || !course) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">جاري التحميل...</div>

  const lesson = course.lessons[activeLesson]

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">
      {/* نقاط تظهر عند الإتمام */}
      {showPoints && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-8 py-4 rounded-2xl text-2xl font-bold shadow-2xl animate-bounce">
          +{earnedPoints} نقطة! 🎉
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <button onClick={() => router.push('/dashboard')} className="text-green-400 hover:text-green-300 flex items-center gap-2">
          ← العودة للرئيسية
        </button>
        <div className="flex items-center gap-3">
          <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">⭐ {totalPoints} نقطة</span>
          <h1 className="text-xl font-bold text-green-400">🔐 CYBERعربي</h1>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className={`bg-gradient-to-r ${course.color} p-6`}>
            <div className="text-4xl mb-2">{course.icon}</div>
            <h2 className="text-xl font-bold">{course.title}</h2>
            <p className="text-sm mt-2 opacity-80">{completed.length}/{course.lessons.length} درس مكتمل</p>
            <div className="mt-3 bg-black bg-opacity-30 rounded-full h-2">
              <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${(completed.length / course.lessons.length) * 100}%` }}></div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-gray-400 text-sm mb-3 font-bold">محتوى المسار</h3>
            {course.lessons.map((l: any, i: number) => (
              <button
                key={l.id}
                onClick={() => setActiveLesson(i)}
                className={`w-full text-right p-3 rounded-lg mb-2 flex items-center gap-3 transition ${activeLesson === i ? 'bg-green-600' : 'hover:bg-gray-700'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${completed.includes(i) ? 'bg-green-400 text-black' : 'bg-gray-600'}`}>
                  {completed.includes(i) ? '✓' : i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{l.title}</p>
                  <p className="text-xs text-gray-400">{l.duration} • +{l.points} نقطة</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-gray-400 text-sm">الدرس {activeLesson + 1} من {course.lessons.length}</p>
                <h2 className="text-3xl font-bold mt-1">{lesson.title}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">+{lesson.points} نقطة</span>
                <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">{lesson.duration}</span>
              </div>
            </div>

            {/* Content */}
            <div className="bg-gray-800 rounded-2xl p-8">
              {lesson.content.split('\n').map((line: string, i: number) => {
                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-green-400 mt-4 mb-3">{line.replace('## ', '')}</h2>
                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold text-blue-400 mt-4 mb-2">{line.replace('### ', '')}</h3>
                if (line.startsWith('- ')) return <li key={i} className="text-gray-300 ml-4 mb-1">{line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '$1')}</li>
                if (line.startsWith('> ')) return <blockquote key={i} className="border-r-4 border-green-400 pr-4 my-3 text-yellow-300 font-bold">{line.replace('> ', '')}</blockquote>
                if (line.match(/^\d\./)) return <p key={i} className="text-gray-300 mb-1 mr-4">{line}</p>
                if (line.trim() === '') return <br key={i} />
                return <p key={i} className="text-gray-300 mb-2">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={() => activeLesson > 0 && setActiveLesson(activeLesson - 1)}
                disabled={activeLesson === 0}
                className="bg-gray-700 px-6 py-3 rounded-xl disabled:opacity-30 hover:bg-gray-600 transition text-white"
              >← الدرس السابق</button>

              <button
                onClick={markComplete}
                disabled={saving}
                className={`px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 text-white ${completed.includes(activeLesson) ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {saving ? '⏳ جاري الحفظ...' : completed.includes(activeLesson) ? '✓ مكتمل' : `إتمام الدرس (+${lesson.points} نقطة)`}
                {!completed.includes(activeLesson) && activeLesson < course.lessons.length - 1 ? ' ←' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}