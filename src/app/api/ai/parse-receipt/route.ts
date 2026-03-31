import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { parseReceiptWithAI } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { image?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!body.image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  // Validate base64 size (~10MB limit)
  const sizeBytes = (body.image.length * 3) / 4
  if (sizeBytes > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 413 })
  }

  try {
    const parsed = await parseReceiptWithAI(body.image)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[parse-receipt] Error:', err)
    return NextResponse.json(
      { error: 'Failed to parse receipt. Please try a clearer image or enter manually.' },
      { status: 422 }
    )
  }
}
