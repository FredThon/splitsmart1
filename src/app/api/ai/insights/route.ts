import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateGroupInsights } from '@/lib/openai'
import { calculateBalances, calculateOptimalSettlements } from '@/lib/fairness'

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [group, expenses, prevExpenses] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { isActive: true }, include: { user: true } } },
    }),
    prisma.expense.findMany({
      where: { groupId, date: { gte: firstOfMonth } },
      include: { splits: true, payer: true },
    }),
    prisma.expense.findMany({
      where: { groupId, date: { gte: firstOfLastMonth, lt: firstOfMonth } },
      include: { splits: true },
    }),
  ])

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  const memberIds = group.members.map((m) => m.userId)
  const memberNames = Object.fromEntries(group.members.map((m) => [m.userId, m.user.name]))

  const balances = calculateBalances(memberIds, memberNames, expenses)
  const settlements = calculateOptimalSettlements(balances)

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {}
  for (const e of expenses) {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] ?? 0) + e.amount
  }

  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0)
  const prevTotal = prevExpenses.reduce((a, b) => a + b.amount, 0)

  const insights = await generateGroupInsights({
    groupName: group.name,
    period,
    members: balances.map((b) => ({
      name: b.name,
      totalPaid: b.totalPaid,
      fairShare: b.fairShare,
      deviationPct: b.deviationPct,
    })),
    totalExpenses,
    categoryBreakdown,
    previousPeriodTotal: prevTotal,
    settlements,
  })

  return NextResponse.json({ insights, balances, settlements, period })
}
