import { PrismaClient, GroupType, ExpenseCategory, SplitType, PaymentMethod, PaymentStatus, BadgeType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SplitSmart database...')

  // ─── Users ────────────────────────────────────────────────────────────────
  const alex = await prisma.user.upsert({
    where: { email: 'alex@splitsmart.dev' },
    update: {},
    create: {
      clerkId: 'demo_alex_001',
      email: 'alex@splitsmart.dev',
      name: 'Alex Rivera',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  })

  const jordan = await prisma.user.upsert({
    where: { email: 'jordan@splitsmart.dev' },
    update: {},
    create: {
      clerkId: 'demo_jordan_002',
      email: 'jordan@splitsmart.dev',
      name: 'Jordan Kim',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
    },
  })

  const sam = await prisma.user.upsert({
    where: { email: 'sam@splitsmart.dev' },
    update: {},
    create: {
      clerkId: 'demo_sam_003',
      email: 'sam@splitsmart.dev',
      name: 'Sam Patel',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam',
      currency: 'USD',
      timezone: 'America/Chicago',
    },
  })

  // ─── Groups ───────────────────────────────────────────────────────────────
  const apartment = await prisma.group.upsert({
    where: { inviteCode: 'DEMO_APT_001' },
    update: {},
    create: {
      name: 'Brooklyn Apartment',
      description: 'Shared expenses for our Brooklyn pad',
      type: GroupType.ROOMMATES,
      currency: 'USD',
      inviteCode: 'DEMO_APT_001',
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN' },
          { userId: jordan.id, role: 'MEMBER' },
          { userId: sam.id, role: 'MEMBER' },
        ],
      },
    },
  })

  // ─── Expenses ─────────────────────────────────────────────────────────────
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000)

  const rentExpense = await prisma.expense.create({
    data: {
      groupId: apartment.id,
      payerId: alex.id,
      title: 'March Rent',
      amount: 3600,
      category: ExpenseCategory.RENT,
      splitType: SplitType.EQUAL,
      date: daysAgo(5),
      notes: 'Monthly rent — all 3 rooms equal split',
      splits: {
        create: [
          { userId: alex.id, amount: 1200 },
          { userId: jordan.id, amount: 1200 },
          { userId: sam.id, amount: 1200 },
        ],
      },
    },
  })

  await prisma.expense.create({
    data: {
      groupId: apartment.id,
      payerId: jordan.id,
      title: 'Whole Foods Grocery Run',
      amount: 187.43,
      category: ExpenseCategory.GROCERIES,
      splitType: SplitType.EQUAL,
      date: daysAgo(3),
      receiptData: {
        items: [
          { name: 'Organic Chicken', price: 18.99 },
          { name: 'Avocados (6pk)', price: 7.49 },
          { name: 'Sparkling Water 12pk', price: 11.99 },
          { name: 'Sourdough Bread', price: 6.99 },
          { name: 'Greek Yogurt', price: 5.49 },
          { name: 'Mixed Greens', price: 4.99 },
          { name: 'Salmon Fillet', price: 24.99 },
          { name: 'Eggs (18)', price: 8.99 },
          { name: 'Oat Milk', price: 5.49 },
          { name: 'Misc Produce & Pantry', price: 92.02 },
        ],
        subtotal: 187.43,
        tax: 0,
        total: 187.43,
        merchant: 'Whole Foods Market',
        date: daysAgo(3).toISOString(),
      },
      splits: {
        create: [
          { userId: alex.id, amount: 62.48 },
          { userId: jordan.id, amount: 62.47 },
          { userId: sam.id, amount: 62.48 },
        ],
      },
    },
  })

  await prisma.expense.create({
    data: {
      groupId: apartment.id,
      payerId: sam.id,
      title: 'Con Edison — February Bill',
      amount: 142.80,
      category: ExpenseCategory.UTILITIES,
      splitType: SplitType.EQUAL,
      date: daysAgo(8),
      splits: {
        create: [
          { userId: alex.id, amount: 47.60 },
          { userId: jordan.id, amount: 47.60 },
          { userId: sam.id, amount: 47.60 },
        ],
      },
    },
  })

  await prisma.expense.create({
    data: {
      groupId: apartment.id,
      payerId: alex.id,
      title: 'Netflix + Spotify Bundle',
      amount: 28.99,
      category: ExpenseCategory.SUBSCRIPTIONS,
      splitType: SplitType.EQUAL,
      date: daysAgo(12),
      isRecurring: true,
      splits: {
        create: [
          { userId: alex.id, amount: 9.66 },
          { userId: jordan.id, amount: 9.66 },
          { userId: sam.id, amount: 9.67 },
        ],
      },
    },
  })

  await prisma.expense.create({
    data: {
      groupId: apartment.id,
      payerId: jordan.id,
      title: 'Thai Night Out — Pok Pok',
      amount: 94.50,
      category: ExpenseCategory.DINING,
      splitType: SplitType.EQUAL,
      date: daysAgo(1),
      splits: {
        create: [
          { userId: alex.id, amount: 31.50 },
          { userId: jordan.id, amount: 31.50 },
          { userId: sam.id, amount: 31.50 },
        ],
      },
    },
  })

  await prisma.expense.create({
    data: {
      groupId: apartment.id,
      payerId: sam.id,
      title: 'IKEA — Living Room Shelf',
      amount: 219.00,
      category: ExpenseCategory.HOUSEHOLD,
      splitType: SplitType.EQUAL,
      date: daysAgo(15),
      splits: {
        create: [
          { userId: alex.id, amount: 73.00 },
          { userId: jordan.id, amount: 73.00 },
          { userId: sam.id, amount: 73.00 },
        ],
      },
    },
  })

  // ─── Payments ─────────────────────────────────────────────────────────────
  await prisma.payment.create({
    data: {
      groupId: apartment.id,
      senderId: jordan.id,
      receiverId: alex.id,
      amount: 1200,
      method: PaymentMethod.VENMO,
      status: PaymentStatus.COMPLETED,
      note: 'March rent ✓',
      settledAt: daysAgo(4),
    },
  })

  await prisma.payment.create({
    data: {
      groupId: apartment.id,
      senderId: sam.id,
      receiverId: alex.id,
      amount: 1200,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.COMPLETED,
      note: 'March rent payment',
      settledAt: daysAgo(4),
    },
  })

  // ─── Fairness Metrics ─────────────────────────────────────────────────────
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastPeriod = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

  await prisma.fairnessMetric.createMany({
    data: [
      // Current month
      { groupId: apartment.id, userId: alex.id, period: currentPeriod, totalPaid: 3628.99, totalOwed: 1411.24, fairShare: 1411.24, deviation: 2217.75, deviationPct: 157.0, score: 62, trend: 'DECLINING' },
      { groupId: apartment.id, userId: jordan.id, period: currentPeriod, totalPaid: 281.93, totalOwed: 1411.24, fairShare: 1411.24, deviation: -1129.31, deviationPct: -79.9, score: 38, trend: 'STABLE' },
      { groupId: apartment.id, userId: sam.id, period: currentPeriod, totalPaid: 361.80, totalOwed: 1411.24, fairShare: 1411.24, deviation: -1049.44, deviationPct: -74.3, score: 45, trend: 'IMPROVING' },
      // Last month
      { groupId: apartment.id, userId: alex.id, period: lastPeriod, totalPaid: 2890.00, totalOwed: 1320.00, fairShare: 1320.00, deviation: 1570.00, deviationPct: 118.9, score: 71, trend: 'STABLE' },
      { groupId: apartment.id, userId: jordan.id, period: lastPeriod, totalPaid: 1100.00, totalOwed: 1320.00, fairShare: 1320.00, deviation: -220.00, deviationPct: -16.6, score: 84, trend: 'IMPROVING' },
      { groupId: apartment.id, userId: sam.id, period: lastPeriod, totalPaid: 970.00, totalOwed: 1320.00, fairShare: 1320.00, deviation: -350.00, deviationPct: -26.5, score: 76, trend: 'DECLINING' },
    ],
    skipDuplicates: true,
  })

  // ─── Badges ───────────────────────────────────────────────────────────────
  await prisma.userBadge.createMany({
    data: [
      { userId: alex.id, badge: BadgeType.GROUP_CREATOR, groupId: apartment.id },
      { userId: alex.id, badge: BadgeType.FIRST_EXPENSE },
      { userId: jordan.id, badge: BadgeType.QUICK_SETTLER },
      { userId: sam.id, badge: BadgeType.FAIR_PAYER },
    ],
    skipDuplicates: true,
  })

  // ─── Recurring Expenses ───────────────────────────────────────────────────
  await prisma.recurringExpense.create({
    data: {
      groupId: apartment.id,
      createdById: alex.id,
      title: 'Monthly Rent',
      amount: 3600,
      category: ExpenseCategory.RENT,
      frequency: 'MONTHLY',
      nextDue: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      splitType: SplitType.EQUAL,
    },
  })

  console.log('✅ Seed completed successfully!')
  console.log(`   Users: alex, jordan, sam`)
  console.log(`   Group: Brooklyn Apartment`)
  console.log(`   Expenses: 6 seeded`)
  console.log(`   Payments: 2 completed`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
