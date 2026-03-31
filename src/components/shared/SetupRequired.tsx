'use client'

import Link from 'next/link'
import { KeyRound, Database, ExternalLink, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface SetupRequiredProps {
  page: 'sign-in' | 'sign-up'
}

const steps = [
  {
    icon: KeyRound,
    title: 'Add Clerk keys',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10 border-brand-500/20',
    description: 'Create a free app at clerk.com and copy your API keys.',
    keys: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
    link: 'https://dashboard.clerk.com',
    linkLabel: 'dashboard.clerk.com',
  },
  {
    icon: Database,
    title: 'Add database URL',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    description: 'Get a free PostgreSQL from neon.tech or supabase.com.',
    keys: ['DATABASE_URL'],
    link: 'https://neon.tech',
    linkLabel: 'neon.tech (free)',
  },
]

export function SetupRequired({ page }: SetupRequiredProps) {
  const [copied, setCopied] = useState(false)

  async function copyEnvPath() {
    await navigator.clipboard.writeText('splitsmart\\.env.local')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface-1 border border-white/8 rounded-2xl overflow-hidden shadow-card">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 text-sm w-fit mb-4">
          <span>⚠️</span>
          <span className="font-medium">Setup required</span>
        </div>
        <h2 className="text-lg font-bold text-white">Configure your environment</h2>
        <p className="text-white/40 text-sm mt-1">
          Add these keys to <code className="text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded text-xs">.env.local</code> to activate {page === 'sign-in' ? 'sign-in' : 'account creation'}.
        </p>
      </div>

      {/* Steps */}
      <div className="p-6 space-y-4">
        {steps.map((step, i) => (
          <div key={i} className={`border rounded-xl p-4 ${step.bg}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${step.bg} flex items-center justify-center flex-shrink-0`}>
                <step.icon className={`w-4 h-4 ${step.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1 text-xs ${step.color} hover:opacity-80 transition-opacity`}
                  >
                    {step.linkLabel}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-white/40 mt-0.5 mb-2">{step.description}</p>
                <div className="space-y-1">
                  {step.keys.map((key) => (
                    <code key={key} className="block text-xs font-mono text-white/60 bg-black/20 px-2 py-1 rounded-lg">
                      {key}=<span className="text-white/30">your_value_here</span>
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* File path */}
        <div className="flex items-center justify-between bg-white/3 border border-white/8 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs text-white/30 mb-0.5">Edit this file</p>
            <code className="text-sm font-mono text-white">.env.local</code>
          </div>
          <button
            onClick={copyEnvPath}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy path'}
          </button>
        </div>

        {/* After setup */}
        <div className="bg-white/3 border border-white/5 rounded-xl p-4 text-xs text-white/40 space-y-1.5">
          <p className="text-white/60 font-medium">After adding keys, also run:</p>
          <code className="block text-brand-400 font-mono bg-black/20 px-2 py-1 rounded">pnpm db:push</code>
          <code className="block text-brand-400 font-mono bg-black/20 px-2 py-1 rounded">pnpm db:seed</code>
        </div>
      </div>

      <div className="px-6 pb-6">
        <Link
          href="/"
          className="block w-full text-center text-sm text-white/40 hover:text-white transition-colors py-2"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
