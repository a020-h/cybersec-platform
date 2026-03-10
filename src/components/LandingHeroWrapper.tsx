'use client'
import dynamic from 'next/dynamic'

const LandingHero = dynamic(() => import('./LandingHero'), { ssr: false })

export default function LandingHeroWrapper() {
  return <LandingHero />
}