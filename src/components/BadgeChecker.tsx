'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  userId: string
  points: number
  lessonsCompleted: number
  completedCourses: number
}

export default function BadgeChecker({ userId, points, lessonsCompleted, completedCourses }: Props) {
  useEffect(() => {
    if (!userId) return
    checkAndGrantBadges()
  }, [points, lessonsCompleted, completedCourses])

  const checkAndGrantBadges = async () => {
    // جلب كل الـ badges من DB
    const { data: allBadges } = await supabase.from('badges').select('*')
    if (!allBadges) return

    // جلب الـ badges الي عند المستخدم
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)

    const earned = new Set(userBadges?.map((b: any) => b.badge_id) || [])

    for (const badge of allBadges) {
      if (earned.has(badge.id)) continue

      let qualified = false
      if (badge.condition_type === 'points' && points >= badge.condition_value) qualified = true
      if (badge.condition_type === 'lessons' && lessonsCompleted >= badge.condition_value) qualified = true
      if (badge.condition_type === 'courses' && completedCourses >= badge.condition_value) qualified = true

      if (qualified) {
        // منح الـ badge
        await supabase.from('user_badges').insert({
          user_id: userId,
          badge_id: badge.id,
        })

        // إرسال إشعار
        await supabase.from('notifications').insert({
          user_id: userId,
          title: `🏅 إنجاز جديد: ${badge.name}`,
          message: badge.description,
          type: 'badge',
        })
      }
    }
  }

  return null // invisible component
}