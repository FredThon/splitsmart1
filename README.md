# SplitSmart — AI-Powered Expense Intelligence

> Stop arguing about money. SplitSmart uses AI to track, split, and settle shared expenses fairly — for roommates, couples, and friend groups.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748)](https://prisma.io)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8)](https://tailwindcss.com)

---

## Features

| Feature | Description |
|---------|-------------|
| **Snap-to-Split** | Upload a receipt photo → GPT-4o Vision extracts items, prices, tax, category |
| **Fair Share Score** | 0–100 fairness index per user, updated every expense |
| **Smart Settlement** | Optimal payment algorithm (minimum transaction count) |
| **AI Insights Engine** | Monthly natural-language insights, trend detection, conflict nudges |
| **Group System** | Multi-group support, invite codes, member management |
| **Real-time Balances** | Net balances per member, history charts |
| **Badges & Gamification** | Fair Payer, Quick Settler, Streak rewards |
| **Recurring Expenses** | Rent, subscriptions with auto-scheduling |
| **Notifications** | In-app alerts for imbalances, payments, new expenses |

---

## Tech Stack

```
Frontend:  Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui
Backend:   Next.js API Routes (Node.js)
Database:  PostgreSQL via Prisma ORM
Auth:      Clerk
AI:        OpenAI GPT-4o (receipt parsing + insights)
Payments:  Stripe (simulated flows)
Charts:    Recharts
Animation: Framer Motion
State:     TanStack Query + Zustand
Hosting:   Vercel
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or [Supabase](https://supabase.com) / [Neon](https://neon.tech))
- [Clerk](https://clerk.com) account (free tier)
- [OpenAI](https://platform.openai.com) API key

### 1. Clone & Install

```bash
git clone https://github.com/your-org/splitsmart
cd splitsmart
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/splitsmart"

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Stripe (optional for MVP)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
splitsmart/
├── prisma/
│   ├── schema.prisma          # Full database schema
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/            # Clerk sign-in/sign-up pages
│   │   ├── (dashboard)/       # Protected app pages
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── groups/        # Group list + detail + create
│   │   │   ├── expenses/      # Expense list + add (with receipt scanner)
│   │   │   ├── settlements/   # Settle up flows
│   │   │   └── insights/      # AI insights + charts
│   │   ├── api/               # API routes
│   │   │   ├── expenses/      # CRUD expenses
│   │   │   ├── groups/        # CRUD groups + members
│   │   │   ├── settlements/   # Create settlements
│   │   │   ├── fairness/      # Calculate fairness metrics
│   │   │   ├── ai/
│   │   │   │   ├── parse-receipt/  # GPT-4o receipt OCR
│   │   │   │   └── insights/       # LLM monthly insights
│   │   │   └── users/         # User profile management
│   │   ├── layout.tsx         # Root layout (Clerk + QueryProvider)
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── expenses/          # Receipt scanner, split editor, forms
│   │   ├── groups/            # Group cards, detail view
│   │   ├── settlements/       # Settlement UI
│   │   ├── insights/          # Charts, AI insight cards
│   │   ├── shared/            # Sidebar, mobile nav
│   │   ├── providers/         # QueryProvider
│   │   └── ui/                # Toaster + base UI components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── openai.ts          # OpenAI helpers (parse + insights)
│   │   ├── fairness.ts        # Fair Share Score algorithm
│   │   └── utils.ts           # Formatters, colors, helpers
│   ├── hooks/
│   │   └── useToast.ts        # Toast notification hook
│   ├── types/
│   │   └── index.ts           # Shared TypeScript types
│   └── middleware.ts          # Clerk auth middleware
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Database Schema

```
Users          — Clerk-linked user profiles
Groups         — Household/friend groups with invite codes
GroupMembers   — Many-to-many: users ↔ groups (roles: ADMIN/MEMBER)
Expenses       — Individual expenses with category + split type
ExpenseSplits  — Per-user split amounts within an expense
Payments       — Settlement transactions between users
FairnessMetric — Monthly fairness scores per user per group
Comments       — Threaded comments on expenses (dispute resolution)
RecurringExpense — Rent/subscription templates
UserBadge      — Gamification badges
Notification   — In-app notification log
```

---

## API Reference

### Expenses

```http
GET  /api/expenses                    # List all (paginated, filterable)
POST /api/expenses                    # Create expense + splits
GET  /api/expenses/[id]               # Get single expense
```

### Groups

```http
GET  /api/groups                      # List user's groups
POST /api/groups                      # Create group
GET  /api/groups/[id]                 # Group detail + balances
POST /api/groups/[id]/members         # Add member by email
PUT  /api/groups/[id]/members         # Join via invite code
```

### AI

```http
POST /api/ai/parse-receipt            # Parse receipt image → structured JSON
GET  /api/ai/insights?groupId=...     # Generate monthly AI insights
```

### Settlements

```http
GET  /api/settlements                 # All pending settlements + history
POST /api/settlements                 # Record a payment
```

### Fairness

```http
GET  /api/fairness                    # Calculate + persist fairness metrics
```

---

## Sample API Response — Receipt Parse

```json
{
  "merchant": "Whole Foods Market",
  "date": "2026-03-28T14:22:00Z",
  "items": [
    { "name": "Organic Chicken", "quantity": 1, "unitPrice": 18.99, "totalPrice": 18.99, "category": "GROCERIES" },
    { "name": "Avocados 6pk", "quantity": 1, "unitPrice": 7.49, "totalPrice": 7.49, "category": "GROCERIES" }
  ],
  "subtotal": 187.43,
  "tax": 0.00,
  "tip": 0.00,
  "total": 187.43,
  "currency": "USD",
  "suggestedCategory": "GROCERIES",
  "confidence": 0.96
}
```

## Sample API Response — AI Insights

```json
{
  "insights": [
    {
      "title": "Alex overpaid by $218 this month",
      "body": "Alex has covered 62% of shared costs while their fair share is 33%. Consider rotating who buys groceries.",
      "type": "ALERT",
      "severity": "WARNING",
      "metric": "$218",
      "changePercent": 89
    },
    {
      "title": "Dining costs up 32% vs last month",
      "body": "Restaurant spending jumped from $142 to $188. This is your largest growing category.",
      "type": "TREND",
      "severity": "INFO",
      "changePercent": 32
    },
    {
      "title": "Settle Jordan's balance today",
      "body": "Jordan owes $94.50 from recent shared meals. Quick settlement keeps scores balanced.",
      "type": "SUGGESTION",
      "severity": "INFO"
    }
  ]
}
```

---

## Fair Share Score Algorithm

```typescript
// Deviation-based sigmoid scoring (src/lib/fairness.ts)
function calculateMemberScore(deviation: number, fairShare: number): number {
  if (fairShare === 0) return 100
  const deviationPct = Math.abs(deviation) / fairShare
  // Sigmoid: smooth penalty curve from 100 → 0
  const penalty = 1 / (1 + Math.exp(-8 * (deviationPct - 0.3)))
  return Math.round(Math.max(0, Math.min(100, 100 * (1 - penalty))))
}

// Group score = weighted average - variance penalty
function calculateGroupScore(balances): number {
  const avg = mean(balances.map(b => b.score))
  const variancePenalty = min(20, sqrt(variance(balances.map(b => b.score))) * 0.5)
  return round(clamp(avg - variancePenalty, 0, 100))
}
```

| Score | Label          | Meaning                        |
|-------|----------------|--------------------------------|
| 90-100 | Excellent     | Within ±5% of fair share       |
| 75-89  | Good          | Within ±15%                    |
| 60-74  | Fair          | Within ±25%                    |
| 40-59  | Needs Attention | Within ±50%                 |
| 0-39   | Imbalanced    | >50% deviation — settle up!    |

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# Add DATABASE_URL, CLERK_*, OPENAI_API_KEY, STRIPE_*

# Run migrations on production DB
npx prisma migrate deploy
```

---

## Demo Seed Data

Running `npm run db:seed` creates:

- **3 Users**: Alex Rivera, Jordan Kim, Sam Patel
- **1 Group**: Brooklyn Apartment
- **6 Expenses**: Rent, groceries, utilities, subscriptions, dining, furniture
- **2 Completed Payments**
- **Fairness Metrics**: 2 months of history
- **Badges**: Group Creator, Quick Settler, Fair Payer

Login with any demo account email to explore the full app.

---

## Roadmap

- [ ] Push notifications (Web Push API)
- [ ] Stripe payment links
- [ ] Venmo/PayPal OAuth deep links
- [ ] Expense export (CSV/PDF)
- [ ] Budget limits per category
- [ ] Recurring expense scheduler (cron)
- [ ] Mobile app (React Native / Expo)
- [ ] Multi-currency support

---

Built with ❤️ using Next.js, Prisma, Clerk, and GPT-4o.
