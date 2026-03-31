'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Users,
  Receipt,
  ArrowLeftRight,
  Lightbulb,
  Zap,
  Settings,
  Bell,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/expenses', icon: Receipt, label: 'Expenses' },
  { href: '/settlements', icon: ArrowLeftRight, label: 'Settle Up' },
  { href: '/insights', icon: Lightbulb, label: 'Insights' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-surface-1 border-r border-white/5 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-black" />
        </div>
        <div>
          <span className="text-sm font-bold text-white">SplitSmart</span>
          <p className="text-xs text-white/30">Expense Intelligence</p>
        </div>
      </div>

      {/* Quick add */}
      <div className="px-4 py-3">
        <Link
          href="/expenses/new"
          className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-400 text-black text-sm font-semibold py-2.5 rounded-xl transition-all hover:shadow-glow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive ? 'text-brand-400' : 'text-white/30')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/5 space-y-0.5">
        <Link
          href="/notifications"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <Bell className="w-4 h-4 text-white/30" />
          Notifications
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings className="w-4 h-4 text-white/30" />
          Settings
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-7 h-7',
              },
            }}
          />
          <span className="text-sm text-white/40">Account</span>
        </div>
      </div>
    </aside>
  )
}
