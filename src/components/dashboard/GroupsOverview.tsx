'use client'

import Link from 'next/link'
import { Users, ArrowRight, Plus } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { Group } from '@/types'

interface GroupsOverviewProps {
  groups: (Group & { _count?: { expenses: number } })[]
}

const groupTypeEmoji: Record<string, string> = {
  ROOMMATES: '🏠',
  COUPLE: '💑',
  FRIENDS: '🫂',
  TRAVEL: '✈️',
  FAMILY: '👨‍👩‍👧',
  OTHER: '🤝',
}

export function GroupsOverview({ groups }: GroupsOverviewProps) {
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div>
          <h3 className="text-sm font-semibold text-white">Your Groups</h3>
          <p className="text-xs text-white/30">{groups.length} active household{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/groups/new"
            className="flex items-center gap-1.5 text-xs bg-brand-500/15 text-brand-400 border border-brand-500/20 px-3 py-1.5 rounded-lg hover:bg-brand-500/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Group
          </Link>
          <Link href="/groups" className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.length === 0 ? (
          <div className="col-span-3 py-8 text-center">
            <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-white/20 text-sm">No groups yet.</p>
            <Link href="/groups/new" className="text-brand-400 text-sm hover:text-brand-300 mt-1 block">
              Create your first group →
            </Link>
          </div>
        ) : (
          groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="bg-white/3 hover:bg-white/6 border border-white/5 rounded-xl p-4 transition-all hover:border-white/10 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                  {groupTypeEmoji[group.type] ?? '🤝'}
                </div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
              </div>
              <div className="font-semibold text-sm text-white mb-1 truncate">{group.name}</div>
              <div className="text-xs text-white/30 mb-3">
                {group._count?.expenses ?? 0} expenses
              </div>
              {/* Member avatars */}
              <div className="flex -space-x-1.5">
                {group.members?.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="w-6 h-6 rounded-full bg-surface-3 border border-surface-1 flex items-center justify-center text-[9px] font-medium text-white/60"
                    title={m.user.name}
                  >
                    {getInitials(m.user.name)}
                  </div>
                ))}
                {(group.members?.length ?? 0) > 4 && (
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-surface-1 flex items-center justify-center text-[9px] text-white/40">
                    +{(group.members?.length ?? 0) - 4}
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
