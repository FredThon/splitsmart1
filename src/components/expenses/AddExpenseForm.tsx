'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptScanner } from './ReceiptScanner'
import { SplitEditor } from './SplitEditor'
import { formatCurrency, getCategoryIcon } from '@/lib/utils'
import { Loader2, ChevronDown, Save } from 'lucide-react'
import type { ParsedReceiptData, Group } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = [
  'RENT', 'UTILITIES', 'GROCERIES', 'DINING', 'TRANSPORT',
  'ENTERTAINMENT', 'HEALTH', 'SUBSCRIPTIONS', 'HOUSEHOLD', 'TRAVEL', 'OTHER',
]

interface Member { id: string; name: string; avatarUrl?: string | null }

interface AddExpenseFormProps {
  groups: (Group & { members: Array<{ user: Member }> })[]
  currentUser: { id: string; name: string }
}

interface SplitEntry { userId: string; name: string; amount: number }

export function AddExpenseForm({ groups, currentUser }: AddExpenseFormProps) {
  const router = useRouter()
  const [tab, setTab] = useState<'scan' | 'manual'>('scan')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('OTHER')
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [splits, setSplits] = useState<SplitEntry[]>([])
  const [receiptData, setReceiptData] = useState<ParsedReceiptData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)
  const members: Member[] = selectedGroup?.members.map((m) => m.user) ?? []

  function handleReceiptParsed(data: ParsedReceiptData) {
    setReceiptData(data)
    setAmount(data.total.toFixed(2))
    setTitle(data.merchant)
    setCategory(data.suggestedCategory)
    setTab('manual')
    // Initialize equal splits
    if (members.length > 0) {
      const perPerson = Math.round((data.total / members.length) * 100) / 100
      setSplits(members.map((m) => ({ userId: m.id, name: m.name, amount: perPerson })))
    }
  }

  function handleGroupChange(groupId: string) {
    setSelectedGroupId(groupId)
    const grp = groups.find((g) => g.id === groupId)
    const mbrs = grp?.members.map((m) => m.user) ?? []
    const total = parseFloat(amount) || 0
    if (mbrs.length > 0 && total > 0) {
      const perPerson = Math.round((total / mbrs.length) * 100) / 100
      setSplits(mbrs.map((m) => ({ userId: m.id, name: m.name, amount: perPerson })))
    }
  }

  function handleAmountChange(val: string) {
    setAmount(val)
    const total = parseFloat(val) || 0
    if (members.length > 0 && total > 0) {
      const perPerson = Math.round((total / members.length) * 100) / 100
      setSplits(members.map((m) => ({ userId: m.id, name: m.name, amount: perPerson })))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !amount || !selectedGroupId) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroupId,
          title,
          amount: parseFloat(amount),
          category,
          date,
          notes,
          receiptData,
          splits: splits.length > 0
            ? splits
            : members.map((m) => ({
                userId: m.id,
                name: m.name,
                amount: Math.round((parseFloat(amount) / members.length) * 100) / 100,
              })),
        }),
      })

      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save expense')
      router.push('/expenses')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (groups.length === 0) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-2xl">👥</span>
        </div>
        <h2 className="text-lg font-bold text-white">No groups yet</h2>
        <p className="text-white/40 text-sm">You need to create or join a group before adding an expense.</p>
        <a
          href="/groups/new"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
        >
          Create a group
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tab switcher */}
      <div className="glass-card p-1 flex gap-1">
        {(['scan', 'manual'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
              tab === t
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-white/40 hover:text-white'
            }`}
          >
            {t === 'scan' ? '📷 Scan Receipt' : '✏️ Enter Manually'}
          </button>
        ))}
      </div>

      {/* Receipt scanner */}
      <AnimatePresence mode="wait">
        {tab === 'scan' && (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ReceiptScanner onParsed={handleReceiptParsed} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual form */}
      <div className="glass-card p-5 space-y-4">
        {/* Group */}
        <div>
          <label className="text-xs text-white/40 font-medium block mb-1.5">Group</label>
          <div className="relative">
            <select
              value={selectedGroupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-brand-500/50"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-surface-2">
                  {g.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs text-white/40 font-medium block mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Whole Foods, March Rent..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
            required
          />
        </div>

        {/* Amount + Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-brand-500/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-surface-2">
                    {getCategoryIcon(c)} {c.charAt(0) + c.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs text-white/40 font-medium block mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 [color-scheme:dark]"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-white/40 font-medium block mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any context or details..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 resize-none"
          />
        </div>
      </div>

      {/* Split editor */}
      {members.length > 0 && parseFloat(amount) > 0 && (
        <SplitEditor
          members={members}
          totalAmount={parseFloat(amount)}
          splits={splits}
          onSplitsChange={setSplits}
        />
      )}

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !title || !amount || !selectedGroupId}
        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-3.5 rounded-2xl transition-all hover:shadow-glow-sm disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Expense
          </>
        )}
      </button>
    </form>
  )
}
