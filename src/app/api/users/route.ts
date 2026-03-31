import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET /api/users - search users by email (for adding to group)
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const q = searchParams.get('q')

  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, avatarUrl: true },
    })
    return NextResponse.json({ data: user })
  }

  if (q) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true, avatarUrl: true },
      take: 10,
    })
    return NextResponse.json({ data: users })
  }

  return NextResponse.json({ error: 'email or q param required' }, { status: 400 })
}

// POST /api/users - upsert current user profile
export async function POST(_req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  if (!clerkUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {
      name: clerkUser.fullName ?? clerkUser.firstName ?? 'User',
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      name: clerkUser.fullName ?? clerkUser.firstName ?? 'User',
      avatarUrl: clerkUser.imageUrl,
    },
  })

  return NextResponse.json({ data: user })
}
