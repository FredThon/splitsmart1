import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { InsightsClient } from '@/components/insights/InsightsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'AI Insights' }

export default async function InsightsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return null

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id, isActive: true } }, isActive: true },
    select: { id: true, name: true },
  })

  // Fetch fairness history for charts
  const fairnessHistory = await prisma.fairnessMetric.findMany({
    where: { userId: user.id },
    orderBy: { period: 'asc' },
    take: 6,
  })

  // Category spend for the last 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const expensesByCategory = await prisma.expense.groupBy({
    by: ['category'],
    where: {
      group: { members: { some: { userId: user.id, isActive: true } } },
      date: { gte: threeMonthsAgo },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  })

  // Monthly spend trend
  const expenses = await prisma.expense.findMany({
    where: {
      group: { members: { some: { userId: user.id, isActive: true } } },
      date: { gte: threeMonthsAgo },
    },
    select: { date: true, amount: true, category: true, payerId: true },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Insights</h1>
        <p className="text-white/40 text-sm mt-1">Your personal expense intelligence</p>
      </div>
      <InsightsClient
        groups={groups}
        fairnessHistory={fairnessHistory}
        expensesByCategory={expensesByCategory.map((e) => ({
          category: e.category,
          total: e._sum.amount ?? 0,
        }))}
        expenses={expenses}
        userId={user.id}
      />
    </div>
  )
}
