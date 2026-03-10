'use client'
import dynamic from 'next/dynamic'

// SSR enabled now — content renders in initial HTML for fast LCP
const LandingHero = dynamic(() => import('./LandingHero'), {
  ssr: true,
  loading: () => (
    // Placeholder with exact same dimensions to prevent CLS
    <div style={{ minHeight: '100vh', background: '#050a0f' }} />
  ),
})

export default function LandingHeroWrapper() {
  return <LandingHero />
}