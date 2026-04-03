export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'
import { MobileNav } from '@/components/shared/MobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-surface-0">
      <Sidebar />
      <main className="md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
