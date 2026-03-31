// ─── Core Entity Types ────────────────────────────────────────────────────────

export interface User {
  id: string
  clerkId: string
  email: string
  name: string
  avatarUrl?: string | null
  currency: string
  createdAt: Date
}

export interface Group {
  id: string
  name: string
  description?: string | null
  avatarUrl?: string | null
  currency: string
  type: GroupType
  inviteCode: string
  isActive: boolean
  members?: GroupMemberWithUser[]
  createdAt: Date
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: MemberRole
  joinedAt: Date
  isActive: boolean
}

export interface GroupMemberWithUser extends GroupMember {
  user: User
}

export interface Expense {
  id: string
  groupId: string
  payerId: string
  title: string
  description?: string | null
  amount: number
  currency: string
  category: ExpenseCategory
  date: Date
  receiptUrl?: string | null
  receiptData?: ParsedReceiptData | null
  splitType: SplitType
  isSettled: boolean
  isRecurring: boolean
  notes?: string | null
  payer?: User
  splits?: ExpenseSplit[]
  comments?: Comment[]
  createdAt: Date
}

export interface ExpenseSplit {
  id: string
  expenseId: string
  userId: string
  amount: number
  percentage?: number | null
  isPaid: boolean
  paidAt?: Date | null
  user?: User
}

export interface Payment {
  id: string
  groupId: string
  senderId: string
  receiverId: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  note?: string | null
  settledAt?: Date | null
  sender?: User
  receiver?: User
  createdAt: Date
}

export interface FairnessMetric {
  id: string
  groupId: string
  userId: string
  period: string
  totalPaid: number
  totalOwed: number
  fairShare: number
  deviation: number
  deviationPct: number
  score: number
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE'
  user?: User
}

export interface Comment {
  id: string
  expenseId: string
  userId: string
  content: string
  user?: User
  createdAt: Date
}

export interface ParsedReceiptData {
  merchant: string
  date: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    category: string
  }>
  subtotal: number
  tax: number
  tip: number
  total: number
  currency: string
  suggestedCategory: string
  confidence: number
}

// ─── Enums ────────────────────────────────────────────────────────────────────

export type GroupType = 'ROOMMATES' | 'COUPLE' | 'FRIENDS' | 'TRAVEL' | 'FAMILY' | 'OTHER'
export type MemberRole = 'ADMIN' | 'MEMBER'
export type ExpenseCategory = 'RENT' | 'UTILITIES' | 'GROCERIES' | 'DINING' | 'TRANSPORT' | 'ENTERTAINMENT' | 'HEALTH' | 'SUBSCRIPTIONS' | 'HOUSEHOLD' | 'TRAVEL' | 'OTHER'
export type SplitType = 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'SHARES'
export type PaymentMethod = 'VENMO' | 'PAYPAL' | 'BANK_TRANSFER' | 'STRIPE' | 'CASH' | 'MANUAL'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalBalance: number          // net amount others owe you (can be negative)
  youOwe: number               // total you owe others
  youAreOwed: number           // total others owe you
  fairnessScore: number        // your personal fairness score
  activeGroups: number
  pendingSettlements: number
  monthlySpend: number
  recentExpenses: Expense[]
  groups: Group[]
}

// ─── Receipt Upload ───────────────────────────────────────────────────────────

export interface ReceiptUploadState {
  file: File | null
  preview: string | null
  isUploading: boolean
  isParsing: boolean
  parsed: ParsedReceiptData | null
  error: string | null
}

// ─── Settlement ───────────────────────────────────────────────────────────────

export interface SettlementSuggestion {
  fromUserId: string
  fromName: string
  fromAvatar?: string
  toUserId: string
  toName: string
  toAvatar?: string
  amount: number
}
