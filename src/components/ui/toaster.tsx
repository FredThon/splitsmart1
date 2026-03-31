'use client'

import { useToast } from '@/hooks/useToast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto glass-card p-4 border animate-slide-up ${
            toast.variant === 'destructive'
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-brand-500/20 bg-brand-500/5'
          }`}
        >
          {toast.title && (
            <p className="text-sm font-semibold text-white">{toast.title}</p>
          )}
          {toast.description && (
            <p className="text-xs text-white/50 mt-0.5">{toast.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}
