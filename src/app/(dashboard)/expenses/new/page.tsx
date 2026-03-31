import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { AddExpenseForm } from '@/components/expenses/AddExpenseForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Expense' }

export default async function NewExpensePage() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return null

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id, isActive: true } }, isActive: true },
    include: { members: { where: { isActive: true }, include: { user: true } } },
  })

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Add Expense</h1>
        <p className="text-white/40 text-sm mt-1">Snap a receipt or enter details manually</p>
      </div>
      <AddExpenseForm groups={groups} currentUser={user} />
    </div>
  )
}
