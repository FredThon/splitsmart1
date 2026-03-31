import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { GroupCard } from '@/components/groups/GroupCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Groups' }

export default async function GroupsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return null

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id, isActive: true } }, isActive: true },
    include: {
      members: { where: { isActive: true }, include: { user: true } },
      _count: { select: { expenses: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Groups</h1>
          <p className="text-white/40 text-sm mt-1">Your shared households</p>
        </div>
        <Link
          href="/groups/new"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-black text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-glow-sm"
        >
          <Plus className="w-4 h-4" />
          New Group
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-white font-semibold mb-2">No groups yet</h3>
          <p className="text-white/30 text-sm mb-6">Create a group to start splitting expenses</p>
          <Link
            href="/groups/new"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-black font-semibold px-6 py-3 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Create your first group
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
