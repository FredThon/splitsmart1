'use client'

import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import { getInitials } from '@/lib/utils'

const groupTypeEmoji: Record<string, string> = {
  ROOMMATES: '🏠', COUPLE: '💑', FRIENDS: '🫂', TRAVEL: '✈️', FAMILY: '👨‍👩‍👧', OTHER: '🤝',
}

interface GroupCardProps {
  group: {
    id: string
    name: string
    description?: string | null
    type: string
    members: Array<{ user: { id: string; name: string; avatarUrl?: string | null } }>
    _count?: { expenses: number }
  }
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`} className="glass-card-hover p-5 block">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
          {groupTypeEmoji[group.type] ?? '🤝'}
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors mt-1" />
      </div>

      <h3 className="text-white font-semibold mb-1 truncate">{group.name}</h3>
      {group.description && (
        <p className="text-white/30 text-xs mb-3 truncate">{group.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {group.members.slice(0, 4).map((m) => (
            <div
              key={m.user.id}
              className="w-7 h-7 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center text-[10px] font-medium text-white/60"
              title={m.user.name}
            >
              {getInitials(m.user.name)}
            </div>
          ))}
          {group.members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-surface-1 flex items-center justify-center text-[10px] text-white/40">
              +{group.members.length - 4}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-white/30">
          <Users className="w-3 h-3" />
          <span className="text-xs">{group.members.length}</span>
        </div>
      </div>

      {group._count && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/20">
          {group._count.expenses} expense{group._count.expenses !== 1 ? 's' : ''}
        </div>
      )}
    </Link>
  )
}
