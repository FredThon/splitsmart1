import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { calculateBalances, calculateOptimalSettlements } from '@/lib/fairness'
import { z } from 'zod'

const settleSchema = z.object({
  groupId: z.string().cuid(),
  receiverId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.enum(['VENMO', 'PAYPAL', 'BANK_TRANSFER', 'STRIPE', 'CASH', 'MANUAL']).default('MANUAL'),
  note: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')

  // Get all groups where user is a member
  const groups = await prisma.group.findMany({
    where: {
      members: { some: { userId: user.id, isActive: true } },
      isActive: true,
      ...(groupId && { id: groupId }),
    },
    include: {
      members: { where: { isActive: true }, include: { user: true } },
      expenses: { include: { splits: true } },
    },
  })

  const allSettlements = []

  for (const group of groups) {
    const memberIds = group.members.map((m) => m.userId)
    const memberNames = Object.fromEntries(group.members.map((m) => [m.userId, m.user.name]))
    const memberAvatars = Object.fromEntries(group.members.map((m) => [m.userId, m.user.avatarUrl]))

    const balances = calculateBalances(memberIds, memberNames, group.expenses)
    const settlements = calculateOptimalSettlements(balances)

    const relevantSettlements = settlements.filter(
      (s) => s.fromUserId === user.id || s.toUserId === user.id
    )

    allSettlements.push({
      groupId: group.id,
      groupName: group.name,
      settlements: relevantSettlements.map((s) => ({
        ...s,
        fromAvatar: memberAvatars[s.fromUserId],
        toAvatar: memberAvatars[s.toUserId],
      })),
      balances: balances.map((b) => ({
        ...b,
        avatarUrl: memberAvatars[b.userId],
      })),
    })
  }

  // Payments history
  const payments = await prisma.payment.findMany({
    where: {
      OR: [{ senderId: user.id }, { receiverId: user.id }],
      ...(groupId && { groupId }),
    },
    include: { sender: true, receiver: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ settlements: allSettlements, payments })
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = settleSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })

  const data = result.data

  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: data.groupId, userId: user.id } },
  })
  if (!membership?.isActive) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const payment = await prisma.payment.create({
    data: {
      groupId: data.groupId,
      senderId: user.id,
      receiverId: data.receiverId,
      amount: data.amount,
      method: data.method,
      status: 'COMPLETED',  // MVP: instant complete (no external payment)
      note: data.note,
      settledAt: new Date(),
    },
    include: { sender: true, receiver: true },
  })

  // Mark relevant splits as paid
  await prisma.expenseSplit.updateMany({
    where: {
      userId: user.id,
      isPaid: false,
      expense: { groupId: data.groupId, payerId: data.receiverId },
    },
    data: { isPaid: true, paidAt: new Date() },
  })

  // Notify receiver
  await prisma.notification.create({
    data: {
      userId: data.receiverId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment received',
      body: `${user.name} paid you ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}`,
      data: { paymentId: payment.id },
    },
  })

  // Award quick settler badge
  await prisma.userBadge.create({
    data: { userId: user.id, badge: 'QUICK_SETTLER' },
  }).catch(() => {})

  return NextResponse.json({ data: payment }, { status: 201 })
}
