'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Plus, Copy, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate, getCategoryColor, getCategoryIcon, getInitials, getScoreColor, getScoreLabel } from '@/lib/utils'
import type { FairnessAlert } from '@/lib/fairness'

interface Balance {
  userId: string
  name: string
  netBalance: number
  totalPaid: number
  fairShare: number
  deviation: number
  deviationPct: number
  score: number
  avatarUrl?: string
}

interface Settlement {
  fromUserId: string
  fromName: string
  toUserId: string
  toName: string
  amount: number
  fromAvatar?: string
  toAvatar?: string
}

interface Props {
  group: {
    id: string
    name: string
    description?: string | null
    inviteCode: string
    type: string
    members: Array<{ user: { id: string; name: string; email: string; avatarUrl?: string | null } }>
    expenses: Array<{
      id: string
      title: string
      amount: number
      category: string
      date: Date
      payer: { id: string; name: string }
      splits: Array<{ userId: string; amount: number; isPaid: boolean }>
      comments: Array<{ id: string; content: string; user: { name: string }; createdAt: Date }>
    }>
  }
  balances: Balance[]
  settlements: Settlement[]
  alerts: FairnessAlert[]
  groupScore: number
  currentUserId: string
}

export function GroupDetailClient({ group, balances, settlements, alerts, groupScore, currentUserId }: Props) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settle'>('expenses')

  async function copyInviteCode() {
    const url = `${window.location.origin}/join/${group.inviteCode}`
    await navigator.clipboard.writeText(url)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const tabs = [
    { id: 'expenses' as const, label: 'Expenses', count: group.expenses.length },
    { id: 'balances' as const, label: 'Balances' },
    { id: 'settle' as const, label: `Settle (${settlements.length})` },
  ]

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <Link href="/groups" className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm mb-4 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          Groups
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{group.name}</h1>
            {group.description && <p className="text-white/40 text-sm mt-1">{group.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Users className="w-3.5 h-3.5 text-white/30" />
              <span className="text-xs text-white/30">{group.members.length} members</span>
            </div>
          </div>

          {/* Score badge */}
          <div className="glass-card px-4 py-3 text-center flex-shrink-0">
            <div className={`text-2xl font-bold ${getScoreColor(groupScore)}`}>{groupScore}</div>
            <div className="text-xs text-white/30">Group Score</div>
            <div className={`text-xs ${getScoreColor(groupScore)}`}>{getScoreLabel(groupScore)}</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-500/10 border-red-500/20 text-red-300'
                  : alert.severity === 'WARNING'
                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Invite link */}
      <div className="glass-card p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-white/30 mb-0.5">Invite link</p>
          <p className="text-xs font-mono text-white/50 truncate">
            splitsmart.app/join/{group.inviteCode.slice(0, 12)}…
          </p>
        </div>
        <button
          onClick={copyInviteCode}
          className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 px-3 py-2 rounded-xl transition-all flex-shrink-0"
        >
          {copiedCode ? <CheckCircle className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedCode ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      {/* Members row */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {group.members.map((m) => (
            <div key={m.user.id} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60">
                {getInitials(m.user.name)}
              </div>
              <span className="text-sm text-white/70">{m.user.name}</span>
              {m.user.id === currentUserId && (
                <span className="text-xs text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-full">you</span>
              )}
            </div>
          ))}
          <Link
            href={`/groups/${group.id}/invite`}
            className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 rounded-xl px-3 py-2 text-sm text-white/30 hover:text-white/60 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/20'
                : 'text-white/40 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/30">{group.expenses.length} expenses</span>
            <Link
              href={`/expenses/new?groupId=${group.id}`}
              className="flex items-center gap-1.5 text-xs bg-brand-500/15 text-brand-400 border border-brand-500/20 px-3 py-1.5 rounded-xl hover:bg-brand-500/20 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add expense
            </Link>
          </div>
          <div className="glass-card divide-y divide-white/5">
            {group.expenses.map((expense) => {
              const mySplit = expense.splits.find((s) => s.userId === currentUserId)
              const iPaid = expense.payer.id === currentUserId
              return (
                <Link
                  key={expense.id}
                  href={`/expenses/${expense.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(expense.category) + '20' }}
                  >
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{expense.title}</p>
                    <p className="text-xs text-white/30">
                      {iPaid ? 'You' : expense.payer.name} · {formatDate(expense.date, 'short')}
                      {expense.comments.length > 0 && ` · 💬 ${expense.comments.length}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">{formatCurrency(expense.amount)}</p>
                    {mySplit && (
                      <p className={`text-xs ${iPaid ? 'text-brand-400' : 'text-white/30'}`}>
                        your share {formatCurrency(mySplit.amount)}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Balances */}
      {activeTab === 'balances' && (
        <div className="glass-card divide-y divide-white/5">
          {balances.map((b) => (
            <div key={b.userId} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white/60 flex-shrink-0">
                {getInitials(b.name)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{b.name}</p>
                  {b.userId === currentUserId && (
                    <span className="text-xs text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-full">you</span>
                  )}
                </div>
                <p className="text-xs text-white/30">
                  Paid {formatCurrency(b.totalPaid)} · Fair share {formatCurrency(b.fairShare)}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${b.netBalance >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                  {b.netBalance >= 0 ? '+' : ''}{formatCurrency(b.netBalance)}
                </div>
                <div className={`text-xs ${getScoreColor(b.score)}`}>
                  Score: {b.score}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Settle */}
      {activeTab === 'settle' && (
        <div className="space-y-3">
          {settlements.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <CheckCircle className="w-10 h-10 text-brand-400/40 mx-auto mb-3" />
              <p className="text-white font-medium">All balanced!</p>
              <p className="text-white/30 text-sm">No settlements needed right now</p>
            </div>
          ) : (
            settlements.map((s, i) => (
              <div key={i} className="glass-card p-4 flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-semibold text-red-400">
                    {getInitials(s.fromName)}
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20" />
                  <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-semibold text-brand-400">
                    {getInitials(s.toName)}
                  </div>
                  <div className="ml-2">
                    <p className="text-sm text-white">
                      <span className="font-medium">{s.fromName}</span>
                      <span className="text-white/40"> pays </span>
                      <span className="font-medium">{s.toName}</span>
                    </p>
                  </div>
                </div>
                <div className="text-sm font-bold text-white">{formatCurrency(s.amount)}</div>
                {s.fromUserId === currentUserId && (
                  <Link
                    href="/settlements"
                    className="text-xs bg-brand-500 hover:bg-brand-400 text-black font-semibold px-3 py-1.5 rounded-xl transition-all"
                  >
                    Pay
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
