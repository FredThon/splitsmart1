'use client'

import { Bell, Search } from 'lucide-react'
import { useState } from 'react'

interface DashboardHeaderProps {
  userName: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [hasNotif] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/40 text-sm">{greeting}</p>
        <h1 className="text-2xl font-bold text-white">{userName.split(' ')[0]} 👋</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors">
          <Search className="w-4 h-4 text-white/40" />
        </button>
        <button className="relative w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-white/40" />
          {hasNotif && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-400 rounded-full" />
          )}
        </button>
      </div>
    </div>
  )
}
