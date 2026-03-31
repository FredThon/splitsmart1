'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { Sparkles, Loader2, TrendingUp, TrendingDown, AlertTriangle, Info, RefreshCw } from 'lucide-react'
import { formatCurrency, getCategoryColor, getCategoryIcon, getScoreColor } from '@/lib/utils'
import type { AIInsight } from '@/lib/openai'
import type { FairnessMetric } from '@/types'

interface Props {
  groups: Array<{ id: string; name: string }>
  fairnessHistory: FairnessMetric[]
  expensesByCategory: Array<{ category: string; total: number }>
  expenses: Array<{ date: Date; amount: number; category: string; payerId: string }>
  userId: string
}

interface InsightsResponse {
  insights: AIInsight[]
  balances: Array<{ userId: string; name: string; netBalance: number; totalPaid: number; fairShare: number }>
  settlements: Array<{ fromName: string; toName: string; amount: number }>
  period: string
}

const insightConfig = {
  SUMMARY: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  ALERT: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  SUGGESTION: { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  TREND: { icon: TrendingUp, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
}

const severityBg = {
  INFO: '',
  WARNING: 'border-orange-500/30',
  SUCCESS: 'border-brand-500/30',
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-2/95 backdrop-blur border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-white/50 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: {typeof p.value === 'number' && p.name !== 'Score'
              ? formatCurrency(p.value)
              : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function InsightsClient({ groups, fairnessHistory, expensesByCategory, expenses, userId }: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? '')

  const { data, isLoading, refetch, isFetching } = useQuery<InsightsResponse>({
    queryKey: ['insights', selectedGroupId],
    queryFn: async () => {
      const res = await fetch(`/api/ai/insights?groupId=${selectedGroupId}`)
      if (!res.ok) throw new Error('Failed to load insights')
      return res.json()
    },
    enabled: !!selectedGroupId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (AI calls are expensive)
  })

  // Monthly spend trend from expenses
  const monthlyTrend = buildMonthlyTrend(expenses)

  // Fairness score chart data
  const scoreChartData = fairnessHistory.map((m) => ({
    period: m.period.slice(5) + '/' + m.period.slice(2, 4),
    Score: m.score,
  }))

  return (
    <div className="space-y-6">
      {/* Group selector */}
      {groups.length > 1 && (
        <div className="flex gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroupId(g.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                selectedGroupId === g.id
                  ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
                  : 'border-white/10 text-white/40 hover:border-white/20'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Monthly spend trend */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Spend Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" name="Spend" stroke="#22c55e" fill="url(#spendGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fairness score history */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Fairness Score History</h3>
          {scoreChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={scoreChartData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Score" stroke="#a855f7" fill="url(#scoreGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-white/20 text-sm">
              No history yet
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Spending by Category (3 months)</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={expensesByCategory} layout="vertical" barSize={8}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
                tickFormatter={(v) => `${getCategoryIcon(v)} ${v.charAt(0) + v.slice(1).toLowerCase()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}>
                {expensesByCategory.map((entry) => (
                  <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* List */}
          <div className="space-y-2">
            {expensesByCategory.slice(0, 6).map((e) => {
              const total = expensesByCategory.reduce((a, b) => a + b.total, 0)
              const pct = total > 0 ? (e.total / total) * 100 : 0
              return (
                <div key={e.category} className="flex items-center gap-3">
                  <span className="text-lg w-6">{getCategoryIcon(e.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60 capitalize">
                        {e.category.charAt(0) + e.category.slice(1).toLowerCase()}
                      </span>
                      <span className="text-white/40">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full">
                      <div
                        className="h-1 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: getCategoryColor(e.category) }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-white w-16 text-right">
                    {formatCurrency(e.total)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* AI Insights panel */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Insights</h3>
              <p className="text-xs text-white/30">Powered by GPT-4o</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="p-4">
          {isLoading || isFetching ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              <p className="text-white/40 text-sm">AI is analyzing your expenses...</p>
            </div>
          ) : data?.insights ? (
            <div className="space-y-3">
              {data.insights.map((insight, i) => {
                const config = insightConfig[insight.type] ?? insightConfig.SUMMARY
                const Icon = insight.type === 'TREND' && insight.changePercent && insight.changePercent < 0
                  ? TrendingDown : config.icon
                return (
                  <div
                    key={i}
                    className={`flex gap-3 p-4 rounded-xl border ${config.bg} ${severityBg[insight.severity]}`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{insight.title}</p>
                        {insight.metric && (
                          <span className={`text-sm font-bold ${config.color}`}>{insight.metric}</span>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-1 leading-relaxed">{insight.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-white/20 text-sm">Select a group to see AI insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function buildMonthlyTrend(expenses: Array<{ date: Date; amount: number }>) {
  const months: Record<string, number> = {}
  const now = new Date()

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`
    months[key] = 0
  }

  for (const e of expenses) {
    const d = new Date(e.date)
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`
    if (key in months) months[key] += e.amount
  }

  return Object.entries(months).map(([month, amount]) => ({ month, amount }))
}
