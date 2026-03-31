import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (format === 'relative') {
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    RENT: '#8b5cf6',
    UTILITIES: '#3b82f6',
    GROCERIES: '#22c55e',
    DINING: '#f97316',
    TRANSPORT: '#06b6d4',
    ENTERTAINMENT: '#ec4899',
    HEALTH: '#ef4444',
    SUBSCRIPTIONS: '#a855f7',
    HOUSEHOLD: '#eab308',
    TRAVEL: '#14b8a6',
    OTHER: '#6b7280',
  }
  return colors[category] ?? '#6b7280'
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    RENT: '🏠',
    UTILITIES: '⚡',
    GROCERIES: '🛒',
    DINING: '🍽️',
    TRANSPORT: '🚗',
    ENTERTAINMENT: '🎬',
    HEALTH: '💊',
    SUBSCRIPTIONS: '📱',
    HOUSEHOLD: '🛋️',
    TRAVEL: '✈️',
    OTHER: '📌',
  }
  return icons[category] ?? '📌'
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-brand-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 40) return 'Needs Attention'
  return 'Imbalanced'
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
