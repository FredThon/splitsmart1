'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Receipt, ArrowLeftRight, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/expenses', icon: Receipt, label: 'Expenses' },
  { href: '/settlements', icon: ArrowLeftRight, label: 'Settle' },
  { href: '/insights', icon: Lightbulb, label: 'Insights' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-1/95 backdrop-blur-xl border-t border-white/5 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all',
                isActive ? 'text-brand-400' : 'text-white/30 hover:text-white/60'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(0,255,136,0.6)]')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
