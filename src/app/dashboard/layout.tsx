import BottomNav from '@/components/BottomNav'
import SessionWarning from '@/components/SessionWarning'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionWarning />
      {children}
      <BottomNav />
    </>
  )
}