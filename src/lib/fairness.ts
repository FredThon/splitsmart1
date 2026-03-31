/**
 * SplitSmart — Fair Share Score Algorithm
 *
 * The Fairness Index (0–100) measures how equitably expenses are distributed
 * within a group over a given time period.
 *
 * Score breakdown:
 *   100 = perfect fairness (everyone pays exactly their share)
 *   80+  = excellent (within ±10% of fair share)
 *   60+  = good (within ±25%)
 *   40+  = needs attention (within ±50%)
 *   <40  = imbalanced (>50% deviation)
 */

export interface MemberBalance {
  userId: string
  name: string
  totalPaid: number
  totalOwed: number
  netBalance: number    // positive = owed to you; negative = you owe others
  fairShare: number
  deviation: number
  deviationPct: number
  score: number
}

export interface SettlementTransaction {
  fromUserId: string
  fromName: string
  toUserId: string
  toName: string
  amount: number
}

export interface GroupFairness {
  groupId: string
  period: string
  members: MemberBalance[]
  groupScore: number        // weighted average fairness
  totalExpenses: number
  settlements: SettlementTransaction[]
  alerts: FairnessAlert[]
}

export interface FairnessAlert {
  type: 'IMBALANCE' | 'STREAK' | 'TRENDING' | 'ROTATION'
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  userId: string
  message: string
}

/**
 * Calculate fairness score for a single member.
 * Uses exponential decay: large deviations are penalized more heavily.
 */
export function calculateMemberScore(deviation: number, fairShare: number): number {
  if (fairShare === 0) return 100

  const deviationPct = Math.abs(deviation) / fairShare
  // Sigmoid-based penalty: smooth curve from 100 → 0
  const penalty = 1 / (1 + Math.exp(-8 * (deviationPct - 0.3)))
  return Math.round(Math.max(0, Math.min(100, 100 * (1 - penalty))))
}

/**
 * Calculate per-user balances given a list of expenses and their splits.
 */
export function calculateBalances(
  memberIds: string[],
  memberNames: Record<string, string>,
  expenses: Array<{
    payerId: string
    amount: number
    splits: Array<{ userId: string; amount: number }>
  }>
): MemberBalance[] {
  const paid: Record<string, number> = {}
  const owed: Record<string, number> = {}

  memberIds.forEach((id) => {
    paid[id] = 0
    owed[id] = 0
  })

  for (const expense of expenses) {
    paid[expense.payerId] = (paid[expense.payerId] ?? 0) + expense.amount
    for (const split of expense.splits) {
      owed[split.userId] = (owed[split.userId] ?? 0) + split.amount
    }
  }

  const totalExpenses = Object.values(paid).reduce((a, b) => a + b, 0)
  const fairShare = totalExpenses / memberIds.length

  return memberIds.map((userId) => {
    const totalPaid = paid[userId] ?? 0
    const totalOwed = owed[userId] ?? 0
    const deviation = totalPaid - fairShare
    const deviationPct = fairShare > 0 ? (deviation / fairShare) * 100 : 0
    const netBalance = totalPaid - totalOwed

    return {
      userId,
      name: memberNames[userId] ?? 'Unknown',
      totalPaid,
      totalOwed,
      netBalance,
      fairShare,
      deviation,
      deviationPct,
      score: calculateMemberScore(deviation, fairShare),
    }
  })
}

/**
 * Optimal settlement algorithm — minimizes transaction count.
 * Based on the "minimum cash flow" algorithm (greedy approach).
 */
export function calculateOptimalSettlements(balances: MemberBalance[]): SettlementTransaction[] {
  const settlements: SettlementTransaction[] = []

  // Build net balance map: positive = owed money, negative = owes money
  const nets = balances.map((b) => ({
    userId: b.userId,
    name: b.name,
    net: b.netBalance,
  }))

  const epsilon = 0.01 // floating-point tolerance

  while (true) {
    // Find max creditor (most owed) and max debtor (owes most)
    nets.sort((a, b) => b.net - a.net)

    const creditor = nets[0]
    const debtor = nets[nets.length - 1]

    if (!creditor || !debtor) break
    if (Math.abs(creditor.net) < epsilon || Math.abs(debtor.net) < epsilon) break
    if (creditor.net <= epsilon || debtor.net >= -epsilon) break

    const amount = Math.min(creditor.net, -debtor.net)

    if (amount > epsilon) {
      settlements.push({
        fromUserId: debtor.userId,
        fromName: debtor.name,
        toUserId: creditor.userId,
        toName: creditor.name,
        amount: Math.round(amount * 100) / 100,
      })
    }

    creditor.net -= amount
    debtor.net += amount

    // Remove settled entries
    nets.splice(
      nets.findIndex((n) => Math.abs(n.net) < epsilon),
      1
    )

    if (nets.length < 2) break
  }

  return settlements
}

/**
 * Generate fairness alerts based on member balances.
 */
export function generateAlerts(balances: MemberBalance[]): FairnessAlert[] {
  const alerts: FairnessAlert[] = []

  for (const member of balances) {
    if (Math.abs(member.deviationPct) > 100) {
      alerts.push({
        type: 'IMBALANCE',
        severity: 'CRITICAL',
        userId: member.userId,
        message: `${member.name} has paid ${Math.abs(member.deviationPct).toFixed(0)}% ${
          member.deviation > 0 ? 'more' : 'less'
        } than their fair share. Time to settle up!`,
      })
    } else if (Math.abs(member.deviationPct) > 50) {
      alerts.push({
        type: 'IMBALANCE',
        severity: 'WARNING',
        userId: member.userId,
        message: `${member.name}'s contribution is ${Math.abs(member.deviationPct).toFixed(0)}% off balance.`,
      })
    }
  }

  // Check if one person always pays for a category (rotation suggestion)
  const overpayers = balances.filter((b) => b.deviation > b.fairShare * 0.3)
  if (overpayers.length === 1 && balances.length > 1) {
    alerts.push({
      type: 'ROTATION',
      severity: 'INFO',
      userId: overpayers[0].userId,
      message: `${overpayers[0].name} has been covering most expenses. Consider rotating who pays for groceries or utilities.`,
    })
  }

  return alerts
}

/**
 * Calculate group-level fairness score (0–100).
 * Uses Gini coefficient-inspired metric.
 */
export function calculateGroupScore(balances: MemberBalance[]): number {
  if (balances.length === 0) return 100

  const scores = balances.map((b) => b.score)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) / scores.length

  // Penalize both low average scores and high variance
  const variancePenalty = Math.min(20, Math.sqrt(variance) * 0.5)
  return Math.round(Math.max(0, Math.min(100, avg - variancePenalty)))
}
