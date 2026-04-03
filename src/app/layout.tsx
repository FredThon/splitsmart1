export const dynamic = 'force-dynamic'

import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SplitSmart — AI Expense Intelligence',
    template: '%s | SplitSmart',
  },
  description: 'Stop arguing about money. SplitSmart uses AI to track, split, and settle shared expenses fairly.',
  keywords: ['expense splitting', 'shared expenses', 'roommates', 'couples finance'],
  authors: [{ name: 'SplitSmart' }],
  openGraph: {
    title: 'SplitSmart — AI-Powered Expense Intelligence',
    description: 'Fair splits. Zero drama. Powered by AI.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#00ff88',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#22c55e',
          colorBackground: '#111118',
          colorInputBackground: '#1a1a24',
          colorText: '#ffffff',
          colorTextSecondary: 'rgba(255,255,255,0.5)',
          borderRadius: '0.75rem',
        },
      }}
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <body suppressHydrationWarning>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
