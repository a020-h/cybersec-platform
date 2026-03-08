'use client'
import BottomNav from '@/components/BottomNav'
import { SessionWarningToast } from '@/components/SessionWarningToast'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useSessionTimeout()
  
  return (
    <>
      <SessionWarningToast />
      {children}
      <BottomNav />
    </>
  )
}