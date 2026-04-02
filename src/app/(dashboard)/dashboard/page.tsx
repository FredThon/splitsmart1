import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { BalanceCards } from '@/components/dashboard/BalanceCards'
import { FairnessScoreCard } from '@/components/dashboard/FairnessScoreCard'
import { RecentExpenses } from '@/components/dashboard/RecentExpenses'
import { GroupsOverview } from '@/components/dashboard/GroupsOverview'
import { QuickActions } from '@/components/dashboard/QuickActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

async function getDashboardData(clerkId: string) {
  // Ensure user exists in our DB
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return null

  const [groups, recentExpenses, fairnessMetrics, pendingPayments] = await Promise.all([
    prisma.group.findMany({
      where: { members: { some: { userId: user.id, isActive: true } }, isActive: true },
      include: {
        members: { where: { isActive: true }, include: { user: true } },
        _count: { select: { expenses: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { group: { members: { some: { userId: user.id, isActive: true } } } },
      include: { payer: true, splits: { include: { user: true } } },
      orderBy: { date: 'desc' },
      take: 8,
    }),
    prisma.fairnessMetric.findMany({
      where: { userId: user.id },
      orderBy: { period: 'desc' },
      take: 6,
    }),
    prisma.payment.findMany({
      where: {
        OR: [{ senderId: user.id }, { receiverId: user.id }],
        status: 'PENDING',
      },
      include: { sender: true, receiver: true },
    }),
  ])

  const groupIds = groups.map((g) => g.id)
  const splits = await prisma.expenseSplit.findMany({
    where: { userId: user.id, isPaid: false, expense: { groupId: { in: groupIds } } },
    include: { expense: { include: { payer: true } } },
  })

  const youOwe = splits
    .filter((s) => s.expense.payerId !== user.id)
    .reduce((acc, s) => acc + s.amount, 0)

  const youAreOwed = splits
    .filter((s) => s.expense.payerId === user.id)
    .reduce((acc, s) => {
      // sum what others owe in expenses where user is payer
      return acc
    }, 0)

  // Sum what others owe you (you paid for them)
  const paidExpenses = recentExpenses.filter((e) => e.payerId === user.id)
  const totalOwedToMe = paidExpenses.reduce((acc, e) => {
    const myOwedAmount = e.splits.find((s) => s.userId === user.id)?.amount ?? 0
    return acc + (e.amount - myOwedAmount)
  }, 0)

  const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const currentMetric = fairnessMetrics.find((m) => m.period === currentPeriod)

  const monthlySpend = recentExpenses
    .filter((e) => {
      const expDate = new Date(e.date)
      const now = new Date()
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
    })
    .reduce((acc, e) => {
      const mySplit = e.splits.find((s) => s.userId === user.id)?.amount ?? 0
      return acc + mySplit
    }, 0)

  return {
    user,
    groups,
    recentExpenses,
    fairnessMetrics,
    pendingPayments,
    youOwe,
    youAreOwed: totalOwedToMe,
    fairnessScore: currentMetric?.score ?? 85,
    fairnessTrend: currentMetric?.trend ?? 'STABLE',
    monthlySpend,
    pendingSettlements: pendingPayments.length,
  }
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null

  let clerkUser = null
  try {
    clerkUser = await currentUser()
  } catch {
    // Clerk API unavailable — fall back to existing DB record
  }

  // Auto-create/update user in DB if first login
  try {
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: clerkUser ? { name: clerkUser.fullName ?? clerkUser.firstName ?? 'User' } : {},
      create: {
        clerkId: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? '',
        name: clerkUser?.fullName ?? clerkUser?.firstName ?? 'User',
        avatarUrl: clerkUser?.imageUrl,
      },
    })
  } catch {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card p-8 max-w-lg w-full text-center space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-2xl">🗄️</span>
          </div>
          <h2 className="text-xl font-bold text-white">Database not connected</h2>
          <p className="text-white/40 text-sm">
            Your app needs a PostgreSQL database. Get a free one at{' '}
            <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">neon.tech</a>
            {' '}or{' '}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">supabase.com</a>
            , then update <code className="text-brand-400 bg-brand-500/10 px-1 rounded">DATABASE_URL</code> in <code className="text-white/60 bg-white/5 px-1 rounded">.env.local</code>.
          </p>
          <div className="bg-black/20 rounded-xl p-4 text-left space-y-2 text-xs font-mono">
            <p className="text-white/30"># After adding your database URL, run:</p>
            <p className="text-brand-400">pnpm db:push</p>
            <p className="text-brand-400">pnpm dev</p>
          </div>
        </div>
      </div>
    )
  }

  const data = await getDashboardData(userId)
  if (!data) return <div className="text-white/40 p-8">Loading...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardHeader userName={data.user.name} />

      {/* KPI row */}
      <BalanceCards
        youOwe={data.youOwe}
        youAreOwed={data.youAreOwed}
        monthlySpend={data.monthlySpend}
        pendingSettlements={data.pendingSettlements}
      />

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentExpenses expenses={data.recentExpenses as unknown as import('@/types').Expense[]} currentUserId={data.user.id} />
        </div>
        <div className="space-y-6">
          <FairnessScoreCard
            score={data.fairnessScore}
            trend={data.fairnessTrend as 'IMPROVING' | 'DECLINING' | 'STABLE'}
            metrics={data.fairnessMetrics as unknown as import('@/types').FairnessMetric[]}
          />
          <QuickActions />
        </div>
      </div>

      <GroupsOverview groups={data.groups} />
    </div>
  )
}
