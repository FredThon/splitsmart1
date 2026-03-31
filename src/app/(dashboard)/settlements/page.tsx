import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { SettlementsClient } from '@/components/settlements/SettlementsClient'
import { calculateBalances, calculateOptimalSettlements } from '@/lib/fairness'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settle Up' }

export default async function SettlementsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return null

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id, isActive: true } }, isActive: true },
    include: {
      members: { where: { isActive: true }, include: { user: true } },
      expenses: { include: { splits: true } },
    },
  })

  const settlementGroups = groups.map((group) => {
    const memberIds = group.members.map((m) => m.userId)
    const memberNames = Object.fromEntries(group.members.map((m) => [m.userId, m.user.name]))
    const memberAvatars = Object.fromEntries(group.members.map((m) => [m.userId, m.user.avatarUrl ?? undefined]))

    const balances = calculateBalances(memberIds, memberNames, group.expenses)
    const settlements = calculateOptimalSettlements(balances)

    return {
      groupId: group.id,
      groupName: group.name,
      balances: balances.map((b) => ({ ...b, avatarUrl: memberAvatars[b.userId] })),
      settlements: settlements.map((s) => ({
        ...s,
        fromAvatar: memberAvatars[s.fromUserId],
        toAvatar: memberAvatars[s.toUserId],
      })),
    }
  })

  const payments = await prisma.payment.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    include: { sender: true, receiver: true, group: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settle Up</h1>
        <p className="text-white/40 text-sm mt-1">Clear balances with one tap</p>
      </div>
      <SettlementsClient
        settlementGroups={settlementGroups}
        payments={payments}
        currentUser={user}
      />
    </div>
  )
}
