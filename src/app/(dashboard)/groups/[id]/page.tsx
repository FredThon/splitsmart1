import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { calculateBalances, calculateOptimalSettlements, generateAlerts, calculateGroupScore } from '@/lib/fairness'
import { GroupDetailClient } from '@/components/groups/GroupDetailClient'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const group = await prisma.group.findUnique({ where: { id }, select: { name: true } })
  return { title: group?.name ?? 'Group' }
}

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return null

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: { where: { isActive: true }, include: { user: true } },
      expenses: {
        include: {
          payer: true,
          splits: { include: { user: true } },
          comments: { include: { user: true }, orderBy: { createdAt: 'asc' } },
        },
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  })

  if (!group) notFound()

  const isMember = group.members.some((m) => m.userId === user.id)
  if (!isMember) notFound()

  const memberIds = group.members.map((m) => m.userId)
  const memberNames = Object.fromEntries(group.members.map((m) => [m.userId, m.user.name]))
  const memberAvatars = Object.fromEntries(group.members.map((m) => [m.userId, m.user.avatarUrl ?? undefined]))

  const balances = calculateBalances(memberIds, memberNames, group.expenses)
  const settlements = calculateOptimalSettlements(balances)
  const alerts = generateAlerts(balances)
  const groupScore = calculateGroupScore(balances)

  return (
    <div className="space-y-6 animate-fade-in">
      <GroupDetailClient
        group={group}
        balances={balances.map((b) => ({ ...b, avatarUrl: memberAvatars[b.userId] }))}
        settlements={settlements.map((s) => ({ ...s, fromAvatar: memberAvatars[s.fromUserId], toAvatar: memberAvatars[s.toUserId] }))}
        alerts={alerts}
        groupScore={groupScore}
        currentUserId={user.id}
      />
    </div>
  )
}
