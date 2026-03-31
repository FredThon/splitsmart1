import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createExpenseSchema = z.object({
  groupId: z.string().cuid(),
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  category: z.enum(['RENT', 'UTILITIES', 'GROCERIES', 'DINING', 'TRANSPORT', 'ENTERTAINMENT', 'HEALTH', 'SUBSCRIPTIONS', 'HOUSEHOLD', 'TRAVEL', 'OTHER']),
  date: z.string().optional(),
  notes: z.string().optional(),
  receiptData: z.any().optional(),
  receiptUrl: z.string().optional(),
  splits: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    amount: z.number(),
  })).optional(),
})

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20')
  const category = searchParams.get('category')

  const where = {
    group: { members: { some: { userId: user.id, isActive: true } } },
    ...(groupId && { groupId }),
    ...(category && { category: category as never }),
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        payer: true,
        splits: { include: { user: true } },
        group: true,
        _count: { select: { comments: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
  ])

  return NextResponse.json({
    data: expenses,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  })
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = createExpenseSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const data = result.data

  // Verify user is a member of the group
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: data.groupId, userId: user.id } },
  })
  if (!membership?.isActive) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  // Get group members for default equal split
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId: data.groupId, isActive: true },
    select: { userId: true },
  })

  const splitsData = data.splits ?? groupMembers.map((m) => ({
    userId: m.userId,
    name: '',
    amount: Math.round((data.amount / groupMembers.length) * 100) / 100,
  }))

  const expense = await prisma.expense.create({
    data: {
      groupId: data.groupId,
      payerId: user.id,
      title: data.title,
      amount: data.amount,
      category: data.category,
      date: data.date ? new Date(data.date) : new Date(),
      notes: data.notes,
      receiptData: data.receiptData ?? undefined,
      receiptUrl: data.receiptUrl,
      splitType: 'EQUAL',
      splits: {
        create: splitsData.map((s) => ({
          userId: s.userId,
          amount: s.amount,
        })),
      },
    },
    include: {
      payer: true,
      splits: { include: { user: true } },
    },
  })

  // Update group's updatedAt
  await prisma.group.update({
    where: { id: data.groupId },
    data: { updatedAt: new Date() },
  })

  // Create notification for group members
  const otherMemberIds = groupMembers.map((m) => m.userId).filter((id) => id !== user.id)
  if (otherMemberIds.length > 0) {
    await prisma.notification.createMany({
      data: otherMemberIds.map((memberId) => ({
        userId: memberId,
        type: 'EXPENSE_ADDED' as const,
        title: 'New expense added',
        body: `${user.name} added "${data.title}" for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}`,
        data: { expenseId: expense.id, groupId: data.groupId },
      })),
    })
  }

  return NextResponse.json({ data: expense }, { status: 201 })
}
