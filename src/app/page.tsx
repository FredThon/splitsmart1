import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { ArrowRight, Zap, Shield, BarChart3, Users, Receipt, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Receipt,
    title: 'Snap-to-Split',
    desc: 'Point camera at receipt. AI extracts every line item. Split in 3 seconds.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: BarChart3,
    title: 'Fair Share Score',
    desc: 'A live fairness index (0–100) that tracks contribution balance over time.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Zap,
    title: 'Smart Settlement',
    desc: 'One-tap settle. Minimizes transactions. Venmo, PayPal, bank transfer.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Sparkles,
    title: 'AI Insights Engine',
    desc: '"You paid 18% more this month." Conflict prevention before it starts.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Users,
    title: 'Group System',
    desc: 'Household groups, shared feeds, comments on disputed expenses.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Shield,
    title: 'Conflict Prevention',
    desc: 'Proactive nudges before imbalances become arguments.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
]

const stats = [
  { value: '$2.4M', label: 'Tracked monthly' },
  { value: '94%', label: 'Conflict reduction' },
  { value: '3 sec', label: 'Average split time' },
  { value: '10K+', label: 'Happy households' },
]

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
const clerkConfigured =
  (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')) &&
  publishableKey.length > 30

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0 overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-blue-500/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/6 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="text-lg font-bold text-white">SplitSmart</span>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Sign in</button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="text-sm bg-brand-500 hover:bg-brand-400 text-black font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Get started free
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm bg-brand-500 hover:bg-brand-400 text-black font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-16 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3 h-3" />
          Powered by GPT-4o Vision
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold text-white leading-tight tracking-tight mb-6">
          Stop arguing
          <br />
          <span className="text-gradient">about money.</span>
        </h1>

        <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          SplitSmart uses AI to track, split, and settle shared expenses fairly —
          for roommates, couples, and friend groups. The therapist you never needed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignedOut>
            <Link
              href="/sign-up"
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-black font-bold px-8 py-4 rounded-2xl text-base transition-all hover:scale-105 hover:shadow-glow-md"
            >
              Start splitting smart
              <ArrowRight className="w-4 h-4" />
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-black font-bold px-8 py-4 rounded-2xl text-base transition-all hover:scale-105 hover:shadow-glow-md"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </SignedIn>
          <button className="text-white/50 hover:text-white text-sm transition-colors px-4 py-4">
            Watch demo →
          </button>
        </div>

        {/* Floating UI preview */}
        <div className="mt-16 relative">
          <div className="glass-card p-6 max-w-md mx-auto text-left animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-white/40 font-mono">FAIRNESS SCORE</span>
              <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">LIVE</span>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-bold text-white">73</span>
              <span className="text-white/40 text-sm mb-2">/ 100</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-brand-500 to-blue-400 h-2 rounded-full w-[73%] transition-all duration-1000" />
            </div>
            <div className="flex gap-2">
              {['Alex', 'Jordan', 'Sam'].map((name, i) => (
                <div key={name} className="flex-1 bg-white/5 rounded-xl p-3">
                  <div className="text-xs text-white/40 mb-1">{name}</div>
                  <div className={`text-sm font-semibold ${i === 0 ? 'text-brand-400' : i === 1 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {i === 0 ? '+$218' : i === 1 ? '-$94' : '-$124'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -top-4 -right-4 sm:right-16 glass-card p-3 animate-bounce-gentle">
            <div className="flex items-center gap-2 text-xs">
              <span>🧾</span>
              <span className="text-white/70">Whole Foods parsed in 2s</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-5 text-center">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-3">Everything you need</h2>
        <p className="text-white/40 text-center mb-12">Built like Stripe. Designed like Revolut. Works like magic.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass-card-hover p-6">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Ready to split smarter?
        </h2>
        <p className="text-white/40 mb-8">Join thousands of households keeping it fair.</p>
        <SignedOut>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-black font-bold px-10 py-4 rounded-2xl text-base transition-all hover:scale-105 hover:shadow-glow-lg"
          >
            Create free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </SignedOut>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center text-white/20 text-xs">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-3 h-3 text-brand-400" />
          <span className="text-white/40 font-medium">SplitSmart</span>
        </div>
        <p>© 2026 SplitSmart. Built with GPT-4o + Next.js + ❤️</p>
      </footer>
    </div>
  )
}
