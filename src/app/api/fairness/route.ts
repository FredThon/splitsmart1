import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { calculateBalances, calculateGroupScore, generateAlerts } from '@/lib/fairness'

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  const period = searchParams.get('period') ?? getCurrentPeriod()

  const where = {
    members: { some: { userId: user.id, isActive: true } },
    isActive: true,
    ...(groupId && { id: groupId }),
  }

  const groups = await prisma.group.findMany({
    where,
    include: {
      members: { where: { isActive: true }, include: { user: true } },
    },
  })

  const results = await Promise.all(
    groups.map(async (group) => {
      const [start, end] = getPeriodDates(period)

      const expenses = await prisma.expense.findMany({
        where: { groupId: group.id, date: { gte: start, lt: end } },
        include: { splits: true },
      })

      const memberIds = group.members.map((m) => m.userId)
      const memberNames = Object.fromEntries(group.members.map((m) => [m.userId, m.user.name]))
      const memberAvatars = Object.fromEntries(group.members.map((m) => [m.userId, m.user.avatarUrl]))

      const balances = calculateBalances(memberIds, memberNames, expenses)
      const groupScore = calculateGroupScore(balances)
      const alerts = generateAlerts(balances)

      // Upsert fairness metrics
      await Promise.all(
        balances.map((b) =>
          prisma.fairnessMetric.upsert({
            where: { groupId_userId_period: { groupId: group.id, userId: b.userId, period } },
            update: {
              totalPaid: b.totalPaid,
              totalOwed: b.totalOwed,
              fairShare: b.fairShare,
              deviation: b.deviation,
              deviationPct: b.deviationPct,
              score: b.score,
              calculatedAt: new Date(),
            },
            create: {
              groupId: group.id,
              userId: b.userId,
              period,
              totalPaid: b.totalPaid,
              totalOwed: b.totalOwed,
              fairShare: b.fairShare,
              deviation: b.deviation,
              deviationPct: b.deviationPct,
              score: b.score,
            },
          })
        )
      )

      // Trigger imbalance notifications
      for (const alert of alerts.filter((a) => a.severity === 'CRITICAL')) {
        await prisma.notification.create({
          data: {
            userId: alert.userId,
            type: 'IMBALANCE_ALERT',
            title: '⚠️ Expense imbalance detected',
            body: alert.message,
            data: { groupId: group.id },
          },
        }).catch(() => {})
      }

      return {
        groupId: group.id,
        groupName: group.name,
        period,
        groupScore,
        alerts,
        balances: balances.map((b) => ({ ...b, avatarUrl: memberAvatars[b.userId] })),
      }
    })
  )

  return NextResponse.json({ data: results })
}

function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getPeriodDates(period: string): [Date, Date] {
  const [year, month] = period.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return [start, end]
}
