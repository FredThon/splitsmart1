import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Bell, CheckCheck } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return null

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-white/40 text-sm mt-1">Stay on top of your shared expenses</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <form action={async () => {
            'use server'
            await prisma.notification.updateMany({
              where: { userId: user.id, isRead: false },
              data: { isRead: true },
            })
          }}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-5 h-5 text-white/20" />
          </div>
          <p className="text-white/40 text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`glass-card p-4 flex items-start gap-3 transition-all ${
                !n.isRead ? 'border-brand-500/20 bg-brand-500/3' : ''
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.isRead ? 'bg-brand-400' : 'bg-white/10'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? 'text-white' : 'text-white/60'}`}>{n.body}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
