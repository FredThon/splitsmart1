import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatCurrency, formatDate, getCategoryColor, getCategoryIcon } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Expenses' }

export default async function ExpensesPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return null

  const expenses = await prisma.expense.findMany({
    where: { group: { members: { some: { userId: user.id, isActive: true } } } },
    include: {
      payer: true,
      splits: { include: { user: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
    take: 50,
  })

  const totalThisMonth = expenses
    .filter((e) => {
      const d = new Date(e.date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((acc, e) => {
      const split = e.splits.find((s) => s.userId === user.id)
      return acc + (split?.amount ?? 0)
    }, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-white/40 text-sm mt-1">
            Your share this month: <span className="text-white font-semibold">{formatCurrency(totalThisMonth)}</span>
          </p>
        </div>
        <Link
          href="/expenses/new"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-black text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-glow-sm"
        >
          <Plus className="w-4 h-4" />
          Add
        </Link>
      </div>

      <div className="glass-card divide-y divide-white/5">
        {expenses.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-white/20 text-sm mb-4">No expenses yet</p>
            <Link href="/expenses/new" className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
              Add your first expense →
            </Link>
          </div>
        ) : (
          expenses.map((expense) => {
            const mySplit = expense.splits.find((s) => s.userId === user.id)
            const iPaid = expense.payerId === user.id

            return (
              <div key={expense.id} className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(expense.category) + '20' }}
                >
                  {getCategoryIcon(expense.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{expense.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/30">{expense.group.name}</span>
                    <span className="text-xs text-white/20">·</span>
                    <span className="text-xs text-white/30">{formatDate(expense.date, 'relative')}</span>
                    {expense.isRecurring && (
                      <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">recurring</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-white">{formatCurrency(expense.amount)}</p>
                  <p className={`text-xs ${iPaid ? 'text-brand-400' : 'text-white/30'}`}>
                    {mySplit ? `${formatCurrency(mySplit.amount)} share` : ''}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
