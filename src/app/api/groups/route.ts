import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['ROOMMATES', 'COUPLE', 'FRIENDS', 'TRAVEL', 'FAMILY', 'OTHER']).default('ROOMMATES'),
  currency: z.string().default('USD'),
})

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id, isActive: true } }, isActive: true },
    include: {
      members: { where: { isActive: true }, include: { user: true } },
      _count: { select: { expenses: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ data: groups })
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

  const result = createGroupSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const group = await prisma.group.create({
    data: {
      name: result.data.name,
      description: result.data.description,
      type: result.data.type,
      currency: result.data.currency,
      members: {
        create: [{ userId: user.id, role: 'ADMIN' }],
      },
    },
    include: {
      members: { include: { user: true } },
    },
  })

  // Award badge for first group creation
  await prisma.userBadge.create({
    data: { userId: user.id, badge: 'GROUP_CREATOR', groupId: group.id },
  }).catch(() => {})  // Ignore if already exists

  return NextResponse.json({ data: group }, { status: 201 })
}
