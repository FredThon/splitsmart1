import OpenAI from 'openai'

let _openai: OpenAI | null = null
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

export interface ParsedReceipt {
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

export interface AIInsight {
  title: string
  body: string
  type: 'SUMMARY' | 'ALERT' | 'SUGGESTION' | 'TREND'
  severity: 'INFO' | 'WARNING' | 'SUCCESS'
  metric?: string
  changePercent?: number
}

/**
 * Parse a receipt image using GPT-4 Vision.
 * Returns structured expense data.
 */
export async function parseReceiptWithAI(imageBase64: string): Promise<ParsedReceipt> {
  const response = await getOpenAI().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    max_tokens: 1500,
    messages: [
      {
        role: 'system',
        content: `You are an expert receipt parser for a shared expense app.
Extract all information from receipt images with high accuracy.
Always return valid JSON matching the exact schema provided.
For categories use: RENT | UTILITIES | GROCERIES | DINING | TRANSPORT | ENTERTAINMENT | HEALTH | SUBSCRIPTIONS | HOUSEHOLD | TRAVEL | OTHER`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' },
          },
          {
            type: 'text',
            text: `Parse this receipt and return ONLY valid JSON with this exact structure:
{
  "merchant": "store name",
  "date": "ISO date string",
  "items": [{"name": "item name", "quantity": 1, "unitPrice": 0.00, "totalPrice": 0.00, "category": "GROCERIES"}],
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "total": 0.00,
  "currency": "USD",
  "suggestedCategory": "GROCERIES",
  "confidence": 0.95
}`,
          },
        ],
      },
    ],
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as ParsedReceipt
  } catch {
    throw new Error('Failed to parse receipt response from AI')
  }
}

/**
 * Generate monthly AI insights for a group.
 */
export async function generateGroupInsights(data: {
  groupName: string
  period: string
  members: Array<{ name: string; totalPaid: number; fairShare: number; deviationPct: number }>
  totalExpenses: number
  categoryBreakdown: Record<string, number>
  previousPeriodTotal?: number
  settlements: Array<{ fromName: string; toName: string; amount: number }>
}): Promise<AIInsight[]> {
  const prompt = `You are a financial advisor for a shared expense app called SplitSmart.
Analyze the following group expense data and generate actionable, friendly insights.

Group: ${data.groupName}
Period: ${data.period}
Total Expenses: $${data.totalExpenses.toFixed(2)}
${data.previousPeriodTotal ? `Previous Period: $${data.previousPeriodTotal.toFixed(2)}` : ''}

Members:
${data.members.map((m) => `- ${m.name}: Paid $${m.totalPaid.toFixed(2)}, Fair Share $${m.fairShare.toFixed(2)}, Deviation ${m.deviationPct > 0 ? '+' : ''}${m.deviationPct.toFixed(1)}%`).join('\n')}

Category Breakdown:
${Object.entries(data.categoryBreakdown).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n')}

Pending Settlements:
${data.settlements.map((s) => `- ${s.fromName} owes ${s.toName} $${s.amount.toFixed(2)}`).join('\n')}

Return a JSON array of 3-5 insights with this structure:
[{
  "title": "Short title (max 8 words)",
  "body": "Friendly, specific insight (1-2 sentences)",
  "type": "SUMMARY|ALERT|SUGGESTION|TREND",
  "severity": "INFO|WARNING|SUCCESS",
  "metric": "optional metric value as string",
  "changePercent": optional_number
}]

Be specific with dollar amounts, percentages, and names. Be conversational and helpful, not clinical.`

  const response = await getOpenAI().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    max_tokens: 1200,
    temperature: 0.7,
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  const content = response.choices[0]?.message?.content ?? '[]'
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as AIInsight[]
  } catch {
    return [{
      title: 'Expense Summary Ready',
      body: `Your group spent $${data.totalExpenses.toFixed(2)} this period. Check balances to settle up.`,
      type: 'SUMMARY',
      severity: 'INFO',
    }]
  }
}

/**
 * Suggest smart split for an expense using AI.
 */
export async function suggestSmartSplit(data: {
  title: string
  amount: number
  category: string
  members: Array<{ id: string; name: string }>
  context?: string
}): Promise<{ splits: Array<{ userId: string; amount: number; reasoning: string }> }> {
  const response = await getOpenAI().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    max_tokens: 600,
    messages: [
      {
        role: 'system',
        content: 'You suggest fair expense splits for shared living situations. Return only valid JSON.',
      },
      {
        role: 'user',
        content: `Expense: "${data.title}" ($${data.amount}) Category: ${data.category}
Members: ${data.members.map((m) => m.name).join(', ')}
${data.context ? `Context: ${data.context}` : ''}

Return JSON: {"splits": [{"userId": "id", "amount": 0.00, "reasoning": "why"}]}
Ensure amounts sum to ${data.amount}. Usually equal split unless context suggests otherwise.`,
      },
    ],
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    // Fallback to equal split
    const equalAmount = Math.round((data.amount / data.members.length) * 100) / 100
    return {
      splits: data.members.map((m) => ({
        userId: m.id,
        amount: equalAmount,
        reasoning: 'Equal split',
      })),
    }
  }
}
