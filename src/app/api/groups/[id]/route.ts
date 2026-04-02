import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { calculateBalances, calculateOptimalSettlements, generateAlerts, calculateGroupScore } from '@/lib/fairness'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: { where: { isActive: true }, include: { user: true } },
      expenses: {
        include: { payer: true, splits: { include: { user: true } }, _count: { select: { comments: true } } },
        orderBy: { date: 'desc' },
        take: 50,
      },
    },
  })

  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isMember = group.members.some((m) => m.userId === user.id)
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const memberIds = group.members.map((m) => m.userId)
  const memberNames = Object.fromEntries(group.members.map((m) => [m.userId, m.user.name]))

  const balances = calculateBalances(memberIds, memberNames, group.expenses)
  const settlements = calculateOptimalSettlements(balances)
  const alerts = generateAlerts(balances)
  const groupScore = calculateGroupScore(balances)

  return NextResponse.json({
    data: group,
    balances,
    settlements,
    alerts,
    groupScore,
  })
}

