'use client'

import { useState, useEffect } from 'react'
import { getInitials, formatCurrency } from '@/lib/utils'
import { Check, AlertCircle } from 'lucide-react'

type SplitMode = 'EQUAL' | 'PERCENTAGE' | 'EXACT'

interface Member {
  id: string
  name: string
  avatarUrl?: string | null
}

interface SplitEntry {
  userId: string
  name: string
  amount: number
}

interface SplitEditorProps {
  members: Member[]
  totalAmount: number
  splits: SplitEntry[]
  onSplitsChange: (splits: SplitEntry[]) => void
}

export function SplitEditor({ members, totalAmount, splits, onSplitsChange }: SplitEditorProps) {
  const [mode, setMode] = useState<SplitMode>('EQUAL')
  const [percentages, setPercentages] = useState<Record<string, number>>({})

  // Initialize equal split on mount or when members/amount changes
  useEffect(() => {
    if (mode === 'EQUAL') applyEqualSplit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount, members.length, mode])

  function applyEqualSplit() {
    const per = Math.round((totalAmount / members.length) * 100) / 100
    const remainder = Math.round((totalAmount - per * (members.length - 1)) * 100) / 100
    onSplitsChange(
      members.map((m, i) => ({
        userId: m.id,
        name: m.name,
        amount: i === members.length - 1 ? remainder : per,
      }))
    )
  }

  function applyPercentageSplit() {
    const newSplits = members.map((m) => {
      const pct = percentages[m.id] ?? 100 / members.length
      return { userId: m.id, name: m.name, amount: Math.round((totalAmount * pct) / 100 * 100) / 100 }
    })
    onSplitsChange(newSplits)
  }

  function handleModeChange(newMode: SplitMode) {
    setMode(newMode)
    if (newMode === 'EQUAL') applyEqualSplit()
    else if (newMode === 'PERCENTAGE') {
      const defaultPct = 100 / members.length
      const newPcts = Object.fromEntries(members.map((m) => [m.id, defaultPct]))
      setPercentages(newPcts)
    }
  }

  function handleExactChange(userId: string, value: string) {
    const amount = parseFloat(value) || 0
    const updated = splits.map((s) => s.userId === userId ? { ...s, amount } : s)
    onSplitsChange(updated)
  }

  function handlePctChange(userId: string, value: string) {
    const pct = parseFloat(value) || 0
    const newPcts = { ...percentages, [userId]: pct }
    setPercentages(newPcts)
    const newSplits = members.map((m) => {
      const p = newPcts[m.id] ?? 0
      return { userId: m.id, name: m.name, amount: Math.round((totalAmount * p) / 100 * 100) / 100 }
    })
    onSplitsChange(newSplits)
  }

  const totalSplit = splits.reduce((a, b) => a + b.amount, 0)
  const diff = Math.abs(totalAmount - totalSplit)
  const isBalanced = diff < 0.02
  const totalPct = Object.values(percentages).reduce((a, b) => a + b, 0)

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Split</h3>
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
          {(['EQUAL', 'PERCENTAGE', 'EXACT'] as SplitMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                mode === m ? 'bg-brand-500/20 text-brand-400' : 'text-white/30 hover:text-white'
              }`}
            >
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const split = splits.find((s) => s.userId === member.id)
          const pct = percentages[member.id] ?? (100 / members.length)

          return (
            <div key={member.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60 flex-shrink-0">
                {getInitials(member.name)}
              </div>
              <span className="flex-1 text-sm text-white/70 truncate">{member.name}</span>

              {mode === 'EQUAL' && (
                <div className="text-sm font-medium text-brand-400">
                  {formatCurrency(split?.amount ?? 0)}
                </div>
              )}

              {mode === 'PERCENTAGE' && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={pct.toFixed(1)}
                      onChange={(e) => handlePctChange(member.id, e.target.value)}
                      className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-brand-500/50"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-xs">%</span>
                  </div>
                  <span className="text-sm text-white/40 w-16 text-right">
                    {formatCurrency(split?.amount ?? 0)}
                  </span>
                </div>
              )}

              {mode === 'EXACT' && (
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={split?.amount.toFixed(2) ?? '0.00'}
                    onChange={(e) => handleExactChange(member.id, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-5 pr-2 py-1 text-sm text-white text-right focus:outline-none focus:border-brand-500/50"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Validation */}
      <div className={`flex items-center justify-between pt-2 border-t border-white/5 text-sm ${
        isBalanced ? 'text-brand-400' : 'text-red-400'
      }`}>
        <div className="flex items-center gap-1.5">
          {isBalanced ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          <span className="text-xs">{isBalanced ? 'Balanced' : `${formatCurrency(diff)} unaccounted`}</span>
        </div>
        <span className="text-xs font-medium">
          {formatCurrency(totalSplit)} / {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  )
}
