'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle, Loader2, Wallet, Clock, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type PaymentMethod = 'VENMO' | 'PAYPAL' | 'BANK_TRANSFER' | 'CASH' | 'MANUAL'

interface SettlementItem {
  fromUserId: string
  fromName: string
  fromAvatar?: string
  toUserId: string
  toName: string
  toAvatar?: string
  amount: number
}

interface Balance {
  userId: string
  name: string
  netBalance: number
  totalPaid: number
  fairShare: number
  score: number
  avatarUrl?: string
}

interface SettlementGroup {
  groupId: string
  groupName: string
  settlements: SettlementItem[]
  balances: Balance[]
}

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  note?: string | null
  settledAt?: Date | null
  createdAt: Date
  sender: { name: string }
  receiver: { name: string }
  group: { name: string }
}

interface Props {
  settlementGroups: SettlementGroup[]
  payments: Payment[]
  currentUser: { id: string; name: string }
}

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; icon: string }> = [
  { id: 'VENMO', label: 'Venmo', icon: '💳' },
  { id: 'PAYPAL', label: 'PayPal', icon: '🅿️' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
  { id: 'CASH', label: 'Cash', icon: '💵' },
  { id: 'MANUAL', label: 'Mark as Paid', icon: '✓' },
]

export function SettlementsClient({ settlementGroups, payments, currentUser }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MANUAL')
  const [settlingId, setSettlingId] = useState<string | null>(null)
  const [settled, setSettled] = useState<Set<string>>(new Set())

  const mySettlements = settlementGroups.flatMap((g) =>
    g.settlements
      .filter((s) => s.fromUserId === currentUser.id)
      .map((s) => ({ ...s, groupId: g.groupId, groupName: g.groupName }))
  )

  const myIncoming = settlementGroups.flatMap((g) =>
    g.settlements
      .filter((s) => s.toUserId === currentUser.id)
      .map((s) => ({ ...s, groupId: g.groupId, groupName: g.groupName }))
  )

  async function handleSettle(settlement: SettlementItem & { groupId: string }) {
    const key = `${settlement.fromUserId}-${settlement.toUserId}-${settlement.groupId}`
    setSettlingId(key)

    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: settlement.groupId,
          receiverId: settlement.toUserId,
          amount: settlement.amount,
          method: selectedMethod,
          note: `Settlement via ${selectedMethod}`,
        }),
      })

      if (res.ok) {
        setSettled((prev) => new Set(prev).add(key))
      }
    } finally {
      setSettlingId(null)
    }
  }

  const totalOwed = mySettlements.reduce((a, b) => a + b.amount, 0)
  const totalIncoming = myIncoming.reduce((a, b) => a + b.amount, 0)

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 border border-red-500/20 bg-red-500/5">
          <div className="text-xs text-white/40 mb-1">You owe</div>
          <div className="text-2xl font-bold text-red-400">{formatCurrency(totalOwed)}</div>
          <div className="text-xs text-white/30 mt-1">{mySettlements.length} payment{mySettlements.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="glass-card p-4 border border-brand-500/20 bg-brand-500/5">
          <div className="text-xs text-white/40 mb-1">You're owed</div>
          <div className="text-2xl font-bold text-brand-400">{formatCurrency(totalIncoming)}</div>
          <div className="text-xs text-white/30 mt-1">{myIncoming.length} incoming</div>
        </div>
      </div>

      {/* Payment method selector */}
      {mySettlements.length > 0 && (
        <div className="glass-card p-4">
          <p className="text-xs text-white/40 mb-3">Pay via</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  selectedMethod === m.id
                    ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
                }`}
              >
                <span>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payments you need to make */}
      {mySettlements.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">You owe</h3>
          </div>
          <div className="divide-y divide-white/5">
            {mySettlements.map((s) => {
              const key = `${s.fromUserId}-${s.toUserId}-${s.groupId}`
              const isSettled = settled.has(key)
              const isSettling = settlingId === key

              return (
                <motion.div
                  key={key}
                  layout
                  className="flex items-center gap-4 p-4"
                >
                  {/* Avatars */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60">
                      {getInitials(s.fromName)}
                    </div>
                    <ArrowRight className="w-3 h-3 text-white/20" />
                    <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-semibold text-brand-400">
                      {getInitials(s.toName)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">Pay {s.toName}</p>
                    <p className="text-xs text-white/30">{s.groupName}</p>
                  </div>

                  {/* Amount + action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-white">{formatCurrency(s.amount)}</span>
                    {isSettled ? (
                      <div className="flex items-center gap-1 text-brand-400 text-xs">
                        <CheckCircle className="w-4 h-4" />
                        Paid
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSettle(s)}
                        disabled={isSettling}
                        className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-400 disabled:bg-white/10 text-black disabled:text-white/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                      >
                        {isSettling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wallet className="w-3 h-3" />}
                        {isSettling ? 'Sending...' : 'Settle'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Incoming */}
      {myIncoming.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Awaiting from others</h3>
          </div>
          <div className="divide-y divide-white/5">
            {myIncoming.map((s) => (
              <div key={`${s.fromUserId}-${s.toUserId}-${s.groupId}`} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60">
                  {getInitials(s.fromName)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{s.fromName}</p>
                  <p className="text-xs text-white/30">{s.groupName}</p>
                </div>
                <div className="text-sm font-semibold text-brand-400">{formatCurrency(s.amount)}</div>
                <div className="flex items-center gap-1 text-xs text-white/30">
                  <Clock className="w-3 h-3" />
                  Pending
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mySettlements.length === 0 && myIncoming.length === 0 && (
        <div className="glass-card p-12 text-center">
          <CheckCircle className="w-12 h-12 text-brand-400/50 mx-auto mb-3" />
          <p className="text-white font-semibold">All settled up! 🎉</p>
          <p className="text-white/30 text-sm mt-1">No outstanding balances across your groups</p>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Payment History</h3>
          </div>
          <div className="divide-y divide-white/5">
            {payments.map((p) => {
              const isSent = p.sender.name === currentUser.name
              return (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSent ? 'bg-red-500/10' : 'bg-brand-500/10'
                  }`}>
                    <DollarSign className={`w-4 h-4 ${isSent ? 'text-red-400' : 'text-brand-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {isSent ? `You paid ${p.receiver.name}` : `${p.sender.name} paid you`}
                    </p>
                    <p className="text-xs text-white/30">{p.group.name} · {formatDate(p.createdAt, 'relative')}</p>
                  </div>
                  <div className={`text-sm font-semibold ${isSent ? 'text-white' : 'text-brand-400'}`}>
                    {isSent ? '-' : '+'}{formatCurrency(p.amount)}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'COMPLETED'
                      ? 'bg-brand-500/10 text-brand-400'
                      : 'bg-white/5 text-white/30'
                  }`}>
                    {p.status.toLowerCase()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
