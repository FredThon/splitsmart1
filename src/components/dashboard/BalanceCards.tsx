'use client'

import { TrendingDown, TrendingUp, Activity, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

interface BalanceCardsProps {
  youOwe: number
  youAreOwed: number
  monthlySpend: number
  pendingSettlements: number
}

export function BalanceCards({ youOwe, youAreOwed, monthlySpend, pendingSettlements }: BalanceCardsProps) {
  const netBalance = youAreOwed - youOwe

  const cards = [
    {
      label: 'Net Balance',
      value: formatCurrency(Math.abs(netBalance)),
      sub: netBalance >= 0 ? 'you are owed' : 'you owe',
      icon: netBalance >= 0 ? TrendingUp : TrendingDown,
      positive: netBalance >= 0,
      color: netBalance >= 0 ? 'text-brand-400' : 'text-red-400',
      bg: netBalance >= 0 ? 'bg-brand-500/10 border-brand-500/20' : 'bg-red-500/10 border-red-500/20',
      iconColor: netBalance >= 0 ? 'text-brand-400' : 'text-red-400',
    },
    {
      label: 'You Are Owed',
      value: formatCurrency(youAreOwed),
      sub: 'others owe you',
      icon: TrendingUp,
      color: 'text-brand-400',
      bg: 'bg-white/3 border-white/5',
      iconColor: 'text-brand-400',
    },
    {
      label: 'You Owe',
      value: formatCurrency(youOwe),
      sub: 'outstanding splits',
      icon: TrendingDown,
      color: 'text-white',
      bg: 'bg-white/3 border-white/5',
      iconColor: 'text-white/30',
    },
    {
      label: 'Monthly Spend',
      value: formatCurrency(monthlySpend),
      sub: 'your share this month',
      icon: Activity,
      color: 'text-white',
      bg: 'bg-white/3 border-white/5',
      iconColor: 'text-white/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`glass-card p-4 border ${card.bg}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/40">{card.label}</span>
            <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center`}>
              <card.icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
            </div>
          </div>
          <div className={`text-xl font-bold ${card.color} mb-0.5`}>{card.value}</div>
          <div className="text-xs text-white/30">{card.sub}</div>
          {pendingSettlements > 0 && card.label === 'You Owe' && (
            <div className="mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-orange-400">{pendingSettlements} pending</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
