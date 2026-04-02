import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as { inviteCode?: string; email?: string }

  // Verify current user is member
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: user.id } },
  })
  if (!membership?.isActive) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Find invitee by email
  if (!body.email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const invitee = await prisma.user.findUnique({ where: { email: body.email } })
  if (!invitee) return NextResponse.json({ error: 'User not found with that email' }, { status: 404 })

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: invitee.id } },
  })

  if (existing?.isActive) return NextResponse.json({ error: 'Already a member' }, { status: 409 })

  const member = await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: id, userId: invitee.id } },
    update: { isActive: true },
    create: { groupId: id, userId: invitee.id, role: 'MEMBER' },
    include: { user: true },
  })

  // Send notification to invitee
  await prisma.notification.create({
    data: {
      userId: invitee.id,
      type: 'GROUP_INVITE',
      title: 'You joined a group',
      body: `${user.name} added you to the group`,
      data: { groupId: id },
    },
  })

  return NextResponse.json({ data: member }, { status: 201 })
}

// Join via invite code
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json() as { inviteCode: string }

  const group = await prisma.group.findFirst({
    where: { inviteCode: body.inviteCode, isActive: true },
  })

  if (!group) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

  const member = await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
    update: { isActive: true },
    create: { groupId: group.id, userId: user.id, role: 'MEMBER' },
    include: { user: true },
  })

  return NextResponse.json({ data: member, group })
}
