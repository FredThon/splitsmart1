'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Zap, Users, Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

const GROUP_TYPE_LABELS: Record<string, string> = {
  ROOMMATES: '🏠 Roommates',
  COUPLE: '💑 Couple',
  FRIENDS: '🫂 Friends',
  TRAVEL: '✈️ Travel',
  FAMILY: '👨‍👩‍👧 Family',
  OTHER: '🤝 Other',
}

interface GroupInfo {
  id: string
  name: string
  description?: string | null
  type: string
  _count: { members: number }
}

export default function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/join/${code}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setLoadError(j.error)
        else setGroup(j.data)
      })
      .catch(() => setLoadError('Could not load invite link'))
  }, [code])

  async function handleJoin() {
    setJoining(true)
    setJoinError(null)
    try {
      const res = await fetch(`/api/join/${code}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to join')
      setJoined(true)
      setTimeout(() => router.push(`/groups/${json.data.groupId}`), 1500)
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="text-lg font-bold text-white">SplitSmart</span>
        </div>

        <div className="glass-card p-6 space-y-5">
          {/* Loading state */}
          {!group && !loadError && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            </div>
          )}

          {/* Invalid link */}
          {loadError && (
            <div className="text-center py-6 space-y-3">
              <XCircle className="w-10 h-10 text-red-400/60 mx-auto" />
              <p className="text-white font-semibold">Invalid invite link</p>
              <p className="text-white/40 text-sm">{loadError}</p>
              <Link href="/" className="text-brand-400 text-sm hover:underline block">
                Go to SplitSmart →
              </Link>
            </div>
          )}

          {/* Group info */}
          {group && !joined && (
            <>
              <div className="text-center space-y-2">
                <p className="text-xs text-white/30 uppercase tracking-wider">You've been invited to join</p>
                <h1 className="text-2xl font-bold text-white">{group.name}</h1>
                {group.description && (
                  <p className="text-white/40 text-sm">{group.description}</p>
                )}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <span className="text-sm text-white/40">{GROUP_TYPE_LABELS[group.type] ?? group.type}</span>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1 text-sm text-white/40">
                    <Users className="w-3.5 h-3.5" />
                    {group._count.members} member{group._count.members !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {joinError && (
                <p className="text-red-400 text-sm text-center">{joinError}</p>
              )}

              {!isLoaded ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                </div>
              ) : isSignedIn ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-3 rounded-2xl transition-all"
                >
                  {joining ? <><Loader2 className="w-4 h-4 animate-spin" />Joining...</> : 'Join Group'}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-sm text-white/40">Sign in to join this group</p>
                  <Link
                    href={`/sign-in?redirect_url=/join/${code}`}
                    className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-black font-bold py-3 rounded-2xl transition-all"
                  >
                    Sign in to join
                  </Link>
                  <Link
                    href={`/sign-up?redirect_url=/join/${code}`}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-2xl transition-all text-sm"
                  >
                    Create account
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Success */}
          {joined && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="w-10 h-10 text-brand-400 mx-auto" />
              <p className="text-white font-semibold">You joined {group?.name}!</p>
              <p className="text-white/40 text-sm">Redirecting to group...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
