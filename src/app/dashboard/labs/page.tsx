'use client'
import SqlInjectionLab from '@/components/SqlInjectionLab'

export default function LabsPage() {
  return (
    <div style={{ height: '100vh', background: '#050508' }}>
      <SqlInjectionLab onComplete={(score) => console.log('Score:', score)} />
    </div>
  )
}