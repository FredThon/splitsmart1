import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Public: look up group info by invite code
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const group = await prisma.group.findFirst({
    where: { inviteCode: code, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      _count: { select: { members: true } },
    },
  })
  if (!group) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
  return NextResponse.json({ data: group })
}

// Authenticated: join a group by invite code
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const group = await prisma.group.findFirst({
    where: { inviteCode: code, isActive: true },
  })
  if (!group) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  })
  if (existing?.isActive) {
    return NextResponse.json({ data: { groupId: group.id }, alreadyMember: true })
  }

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
    update: { isActive: true },
    create: { groupId: group.id, userId: user.id, role: 'MEMBER' },
  })

  // Notify group admins
  const admins = await prisma.groupMember.findMany({
    where: { groupId: group.id, role: 'ADMIN', isActive: true },
  })
  await Promise.all(
    admins.map((a) =>
      prisma.notification.create({
        data: {
          userId: a.userId,
          type: 'GROUP_INVITE',
          title: 'New member joined',
          body: `${user.name} joined ${group.name}`,
        },
      }).catch(() => {})
    )
  )

  return NextResponse.json({ data: { groupId: group.id } }, { status: 201 })
}
