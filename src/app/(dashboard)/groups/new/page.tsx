'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Users } from 'lucide-react'

const GROUP_TYPES = [
  { id: 'ROOMMATES', label: 'Roommates', emoji: '🏠' },
  { id: 'COUPLE', label: 'Couple', emoji: '💑' },
  { id: 'FRIENDS', label: 'Friends', emoji: '🫂' },
  { id: 'TRAVEL', label: 'Travel', emoji: '✈️' },
  { id: 'FAMILY', label: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'OTHER', label: 'Other', emoji: '🤝' },
]

export default function NewGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('ROOMMATES')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, type }),
      })

      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create group')
      const { data } = await res.json()
      router.push(`/groups/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <Link href="/groups" className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm mb-6 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Groups
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create a Group</h1>
        <p className="text-white/40 text-sm mt-1">Set up your shared expense household</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selector */}
        <div className="glass-card p-5">
          <label className="text-xs text-white/40 font-medium block mb-3">Group Type</label>
          <div className="grid grid-cols-3 gap-2">
            {GROUP_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  type === t.id
                    ? 'border-brand-500/40 bg-brand-500/15 text-brand-400'
                    : 'border-white/5 hover:border-white/10 text-white/40 hover:text-white/70'
                }`}
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="glass-card p-5 space-y-4">
          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brooklyn Apartment, Europe Trip..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
              required
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-xs text-white/40 font-medium block mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="A short description..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 resize-none transition-colors"
              maxLength={300}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-3.5 rounded-2xl transition-all hover:shadow-glow-sm disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
          ) : (
            <><Users className="w-4 h-4" />Create Group</>
          )}
        </button>
      </form>
    </div>
  )
}
