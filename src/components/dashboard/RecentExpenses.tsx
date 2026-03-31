'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate, getCategoryColor, getCategoryIcon, getInitials } from '@/lib/utils'
import type { Expense } from '@/types'

interface RecentExpensesProps {
  expenses: Expense[]
  currentUserId: string
}

export function RecentExpenses({ expenses, currentUserId }: RecentExpensesProps) {
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div>
          <h3 className="text-sm font-semibold text-white">Recent Expenses</h3>
          <p className="text-xs text-white/30">Across all your groups</p>
        </div>
        <Link href="/expenses" className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-white/5">
        {expenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-white/20 text-sm">No expenses yet.</p>
            <Link href="/expenses/new" className="text-brand-400 text-sm hover:text-brand-300 mt-1 block">
              Add your first expense →
            </Link>
          </div>
        ) : (
          expenses.map((expense) => {
            const mySplit = expense.splits?.find((s) => s.userId === currentUserId)
            const iPaid = expense.payerId === currentUserId
            const myShare = mySplit?.amount ?? 0

            return (
              <Link
                key={expense.id}
                href={`/expenses/${expense.id}`}
                className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors"
              >
                {/* Category icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(expense.category) + '20' }}
                >
                  {getCategoryIcon(expense.category)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{expense.title}</span>
                    {expense.isRecurring && (
                      <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        recurring
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/60 flex-shrink-0">
                      {getInitials(expense.payer?.name ?? 'U')}
                    </div>
                    <span className="text-xs text-white/30 truncate">
                      {iPaid ? 'You paid' : `${expense.payer?.name?.split(' ')[0]} paid`}
                    </span>
                    <span className="text-xs text-white/20">·</span>
                    <span className="text-xs text-white/30">{formatDate(expense.date, 'relative')}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-white">
                    {formatCurrency(expense.amount)}
                  </div>
                  <div className={`text-xs ${iPaid ? 'text-brand-400' : 'text-white/30'}`}>
                    {iPaid ? `you lent` : `your share`} {formatCurrency(myShare)}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
