'use client'

import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import type { FairnessMetric } from '@/types'

interface FairnessScoreCardProps {
  score: number
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE'
  metrics: FairnessMetric[]
}

const circumference = 2 * Math.PI * 54 // r=54

function ScoreArc({ score }: { score: number }) {
  const progress = (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444'

  return (
    <svg width="140" height="140" className="rotate-[-90deg]">
      <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
      <circle
        cx="70"
        cy="70"
        r="54"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s ease' }}
        filter={`drop-shadow(0 0 8px ${color}80)`}
      />
    </svg>
  )
}

export function FairnessScoreCard({ score, trend, metrics }: FairnessScoreCardProps) {
  const TrendIcon = trend === 'IMPROVING' ? TrendingUp : trend === 'DECLINING' ? TrendingDown : Minus
  const trendColor = trend === 'IMPROVING' ? 'text-brand-400' : trend === 'DECLINING' ? 'text-red-400' : 'text-white/40'
  const trendText = trend === 'IMPROVING' ? 'Improving' : trend === 'DECLINING' ? 'Declining' : 'Stable'

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Fair Share Score</h3>
          <p className="text-xs text-white/30">Your contribution balance</p>
        </div>
        <button className="text-white/20 hover:text-white/40 transition-colors">
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Score ring */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <ScoreArc score={score} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-xs text-white/30">/ 100</span>
          </div>
        </div>
      </div>

      {/* Label + trend */}
      <div className="text-center mb-4">
        <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </span>
        <div className={`flex items-center justify-center gap-1 mt-1 ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span className="text-xs">{trendText} this month</span>
        </div>
      </div>

      {/* Mini history */}
      {metrics.length > 1 && (
        <div className="border-t border-white/5 pt-4">
          <p className="text-xs text-white/30 mb-3">Last {Math.min(metrics.length, 3)} months</p>
          <div className="space-y-2">
            {metrics.slice(0, 3).map((m) => (
              <div key={m.period} className="flex items-center gap-3">
                <span className="text-xs text-white/30 w-14">{m.period.slice(5)}/{m.period.slice(2, 4)}</span>
                <div className="flex-1 bg-white/5 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${m.score}%`,
                      background: m.score >= 80 ? '#22c55e' : m.score >= 60 ? '#eab308' : '#ef4444',
                    }}
                  />
                </div>
                <span className={`text-xs font-medium w-7 text-right ${getScoreColor(m.score)}`}>
                  {m.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
