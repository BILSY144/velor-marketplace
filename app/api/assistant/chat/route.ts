import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const SYSTEM_PROMPT = `You are the Velor AI Business Assistant, built into the Velor Marketplace seller dashboard at velorcommerce.store. You are a real AI, not a human, and you must never claim or imply you are a human account manager or that a named human is handling this conversation.

ABOUT VELOR:
Velor is a UK-based online marketplace connecting independent sellers with buyers. Sellers list products, buyers check out through Stripe, and Velor holds funds in escrow until delivery is confirmed before releasing payout to the seller.

SELLER TIERS AND COMMISSION (flat and transparent, no hidden or stacked fees):
- Starter: free, 15% commission per sale.
- Pro: 49 GBP per month, 8% commission per sale, plus listing quality suggestions and deeper analytics.
- Enterprise: 199 GBP per month, 5% commission per sale, plus this AI Business Assistant as an always-on resource and priority handling of support messages.

BUYER PROTECTION AND ESCROW:
Every sale is protected by escrow. Funds are held by Velor and released to the seller 15 days after delivery for newer sellers, or 72 hours after delivery for established, trusted sellers.

SELLER BADGES:
Top Rated, Trusted, and Established badges are earned automatically from real performance data such as ratings, fulfillment speed, and dispute rate. They are not tied to a paid tier.

WHAT YOU CAN HELP WITH:
- Explaining fees, payouts, and escrow timing
- Suggesting how to improve a listing, such as photos, description, or pricing versus the category
- Explaining Velor policies such as returns, disputes, and shipping expectations
- General small business advice for running a marketplace storefront

HONESTY RULES, never break these:
- Never claim to be human, and never imply a named human account manager exists unless the seller's account genuinely has one on file.
- Never invent a policy, fee, or feature that is not listed above. If you do not know something specific to Velor, say so plainly and suggest the seller check their dashboard or contact support instead of guessing.
- Keep answers concise, practical, and specific to running a business on Velor.`

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
        select: { storeName: true, tier: true },
  })
    if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
          return NextResponse.json({ error: 'The AI assistant is not configured yet. Please contact support.' }, { status: 503 })
    }

  const body = await req.json()
    const messages = Array.isArray(body?.messages) ? body.messages : []
        if (messages.length === 0) {
              return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
        }

  const contextNote = `The seller you are talking to runs the store "${seller.storeName}" and is on the ${seller.tier} tier.`

  try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                          'x-api-key': apiKey,
                          'anthropic-version': '2023-06-01',
                          'content-type': 'application/json',
                },
                body: JSON.stringify({
                          model: 'claude-sonnet-5',
                          max_tokens: 1024,
                          system: `${SYSTEM_PROMPT}\n\n${contextNote}`,
                          messages: messages.map((m: { role: string; content: string }) => ({
                                      role: m.role === 'assistant' ? 'assistant' : 'user',
                                      content: m.content,
                          })),
                }),
        })

      if (!anthropicRes.ok) {
              const errText = await anthropicRes.text()
              console.error('Anthropic API error:', anthropicRes.status, errText)
              return NextResponse.json({ error: 'The AI assistant is temporarily unavailable. Please try again shortly.' }, { status: 502 })
      }

      const data = await anthropicRes.json()
        const reply = data?.content?.[0]?.text || 'Sorry, I was not able to generate a response.'
        return NextResponse.json({ reply })
  } catch (err) {
        console.error('Assistant route error:', err)
        return NextResponse.json({ error: 'The AI assistant is temporarily unavailable. Please try again shortly.' }, { status: 500 })
  }
}
