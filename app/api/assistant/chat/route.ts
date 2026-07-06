import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { capabilitiesForTier, buildAccountSnapshot, type AssistantTier } from '@/lib/assistant-context'

const BASE_SYSTEM_PROMPT = `You are the Velor AI Assistant, built into the Velor Marketplace seller dashboard at velorcommerce.store. You are a real AI, not a human, and you must never claim or imply you are a human account manager or that a named human is handling this conversation - even for Enterprise sellers who get the fullest version of you.

ABOUT VELOR:
Velor is a UK-based online marketplace connecting independent sellers with buyers. Sellers list products, buyers check out through Stripe, and Velor holds funds in escrow until delivery is confirmed before releasing payout to the seller.

SELLER TIERS AND COMMISSION (flat and transparent, no hidden or stacked fees):
- Starter: free, 15% commission per sale.
- Pro: 49 GBP per month, 8% commission per sale, plus listing quality suggestions, deeper analytics, and this assistant grounded in the seller's own account data.
- Enterprise: 199 GBP per month, 5% commission per sale, plus Go Live live-shopping, and this assistant acting as a full dedicated AI account manager with order lookups, drafting, and escalation.

BUYER PROTECTION AND ESCROW:
Every sale is protected by escrow. Funds are held by Velor and released to the seller 15 days after delivery for newer sellers, or 72 hours after delivery for sellers who qualify as payout-trusted (10+ delivered orders, 30+ days on Velor, and zero unresolved disputes or returns).

SELLER BADGES:
Top Rated, Trusted, and Established badges are earned automatically from real performance data such as ratings, fulfillment speed, and dispute rate. They are not tied to a paid tier, and they are a different thing from the payout-trusted status above - do not conflate the two even though both use the word "trusted".

WHAT YOU CAN HELP WITH:
- Explaining fees, payouts, and escrow timing
- Suggesting how to improve a listing, such as photos, description, or pricing versus the category
- Explaining Velor policies such as returns, disputes, and shipping expectations
- General small business advice for running a marketplace storefront

HONESTY RULES, never break these:
- Never claim to be human, and never imply a named human account manager exists unless the seller's account genuinely has one on file.
- Never invent a policy, fee, or feature that is not listed above. If you do not know something specific to Velor, say so plainly and suggest the seller check their dashboard or contact support instead of guessing.
- Keep answers concise, practical, and specific to running a business on Velor.`

const TIER_ADDENDUM: Record<AssistantTier, string> = {
  STARTER: `

You are talking to a Starter-tier seller. You do not have access to this seller's private order or payout data - answer from general Velor knowledge only. If they ask something that needs their real account data (a specific order status, their exact payout date), tell them plainly that account-specific lookups are a Pro and Enterprise feature and point them at their dashboard, or mention that upgrading unlocks it - do not guess numbers on their behalf.`,
  PRO: `

You are talking to a Pro-tier seller. Below this line is a real, live snapshot of THIS seller's own account - use it to give specific, personalized answers about their orders, payout timing, and standing instead of generic ones. Never mention or imply any other seller's data. You do not have order-lookup-by-ID, drafting, or escalation tools - if asked for those, say plainly that they are an Enterprise feature.`,
  ENTERPRISE: `

You are talking to an Enterprise-tier seller and acting as their dedicated AI account manager. Below this line is a real, live snapshot of THIS seller's own account, including their most recent orders - use it to give specific answers, including about individual recent orders. Never mention or imply any other seller's data.

You have three extra capabilities Pro and Starter do not have:
1. Order lookups - answer specific questions about their recent orders using the snapshot below.
2. Drafting - if asked, you can write a ready-to-send draft reply to a buyer, or a draft message to Velor support, clearly labelled as a draft. You never send anything yourself; the seller copies and sends it.
3. Escalation - if the seller clearly wants to escalate an issue to a human at Velor (not just ask a question), say so plainly in your reply, and end your entire reply with the exact marker [[ESCALATE]] on its own final line. Only use this marker when the seller genuinely wants a human to step in - never for routine questions you can already answer. The marker is stripped before the seller sees your reply and instead files a real priority support ticket for them.`,
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true } } },
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

  const tier = (seller.tier as AssistantTier) ?? 'STARTER'
  const capabilities = capabilitiesForTier(tier)

  let contextNote = `The seller you are talking to runs the store "${seller.storeName}" and is on the ${tier} tier.`
  if (capabilities.canReadOwnData) {
    const snapshot = await buildAccountSnapshot(seller.id, tier)
    if (snapshot) {
      contextNote += `\n\nSELLER'S OWN ACCOUNT DATA (real, live, private to this seller - never share with or reference for anyone else):\n${snapshot}`
    }
  }

  const systemPrompt = `${BASE_SYSTEM_PROMPT}${TIER_ADDENDUM[tier]}\n\n${contextNote}`

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
        system: systemPrompt,
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
    let reply: string = data?.content?.[0]?.text || 'Sorry, I was not able to generate a response.'

    let escalated = false
    if (capabilities.canEscalate && reply.includes('[[ESCALATE]]')) {
      reply = reply.replace('[[ESCALATE]]', '').trim()
      const lastUserMessage = [...messages].reverse().find((m: { role: string; content: string }) => m.role === 'user')
      try {
        await prisma.supportTicket.create({
          data: {
            sellerId: seller.id,
            name: seller.storeName,
            email: seller.user.email ?? '',
            subject: 'Escalated by AI Account Manager',
            message: lastUserMessage?.content ?? 'Seller asked the AI Account Manager to escalate this conversation.',
            priority: 'PRIORITY',
          },
        })
        escalated = true
        reply += '\n\n(I have flagged this with our support team as priority - expect a response within 2 hours.)'
      } catch (escalationErr) {
        console.error('Assistant escalation ticket error:', escalationErr)
      }
    }

    return NextResponse.json({ reply, escalated })
  } catch (err) {
    console.error('Assistant route error:', err)
    return NextResponse.json({ error: 'The AI assistant is temporarily unavailable. Please try again shortly.' }, { status: 500 })
  }
}
