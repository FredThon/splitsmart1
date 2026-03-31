'use client'

import Link from 'next/link'
import { Receipt, UserPlus, ArrowLeftRight, Lightbulb } from 'lucide-react'

const actions = [
  {
    href: '/expenses/new',
    icon: Receipt,
    label: 'Add Expense',
    sub: 'Snap or enter',
    color: 'bg-brand-500/15 text-brand-400 border-brand-500/20 hover:bg-brand-500/20',
  },
  {
    href: '/settlements',
    icon: ArrowLeftRight,
    label: 'Settle Up',
    sub: '2 pending',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
  },
  {
    href: '/groups/new',
    icon: UserPlus,
    label: 'New Group',
    sub: 'Invite people',
    color: 'bg-purple-500/15 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
  },
  {
    href: '/insights',
    icon: Lightbulb,
    label: 'AI Insights',
    sub: '3 new tips',
    color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20',
  },
]

export function QuickActions() {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border transition-all ${action.color}`}
          >
            <action.icon className="w-4 h-4" />
            <div>
              <div className="text-xs font-semibold">{action.label}</div>
              <div className="text-xs opacity-60">{action.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
