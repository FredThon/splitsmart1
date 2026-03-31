import { SignIn } from '@clerk/nextjs'
import { Zap } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/6 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-blue-400 flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="text-lg font-bold text-white">SplitSmart</span>
        </div>
        <SignIn />
      </div>
    </div>
  )
}
