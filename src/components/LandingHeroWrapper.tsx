'use client'
import dynamic from 'next/dynamic'

// ✅ SSR: true — Hero يُرسم في الـ HTML مباشرة (أسرع LCP)
// ✅ loading: placeholder بنفس الأبعاد (يمنع CLS)
const LandingHero = dynamic(() => import('./LandingHero'), {
  ssr: true,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#050a0f' }} />
  ),
})

export default function LandingHeroWrapper() {
  return <LandingHero />
}