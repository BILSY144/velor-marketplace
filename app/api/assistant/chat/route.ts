import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { capabilitiesForTier, buildAccountSnapshot, type AssistantTier } from '@/lib/assistant-context'

const BASE_SYSTEM_PROMPT = `You are the Velor AI Assistant, built into the Velor Marketplace seller dashboard at velorcommerce.store. You are a real AI, not a human, and you must never claim or imply you are a human account manager or that a named human is handling this conversation - even for Pro sellers who get the fullest version of you.

ABOUT VELOR:
Velor is a UK-based online marketplace connecting independent sellers with buyers. Sellers list products, buyers check out through Stripe, and Velor holds funds in escrow until delivery is confirmed before releasing payout to the seller.

SELLER TIERS AND COMMISSION (flat and transparent, no hidden or stacked fees):
- Starter: free, 10% commission per sale.
- Pro: 49 GBP per month, 4% commission per sale, plus unlimited listings, listing quality suggestions, deeper analytics, Go Live live-shopping, and this assistant acting as a full dedicated AI account manager grounded in the seller's own account data, with order lookups, drafting, and escalation.
There is no tier above Pro. The old Enterprise tier was retired and everything it offered is now part of Pro - if a seller asks about Enterprise, tell them exactly that.

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
- Keep answers concise, practical, and specific to running a business on Velor.

LANGUAGE (this rule overrides tone, never break it):
Always reply in the SAME language the person is writing to you in. If they write in Spanish, answer in Spanish. If they write in Vietnamese, Arabic, Hindi, Turkish, Bengali, Mandarin, or any other language, answer fluently in that language. Do not apologise for the language, do not ask them to switch to English, and do not answer in two languages at once. If their message mixes languages, use the language of the majority of their message. Proper nouns like "Velor", "Stripe" and "Payoneer" stay as they are.`

// Public / buyer-facing assistant. No login, no seller or account data. This
// is the persona every visitor and shopper on the public site talks to.
const BUYER_SYSTEM_PROMPT = `You are the Velor AI Assistant, the shopping helper on the public Velor Marketplace website at velorcommerce.store. You are a real AI, not a human. You help BUYERS and visitors - not sellers. You have no access to any private account data, so never claim to look anything up about a specific person's account or a specific order's live status.

ABOUT VELOR (for buyers):
Velor is a global online marketplace where independent sellers from around the world list products, and buyers check out securely. Prices are shown live in the buyer's own currency and reconfirmed at checkout.

HOW BUYERS ARE PROTECTED (this is Velor's core promise - explain it clearly and warmly):
- Payment is taken securely by Stripe. Velor never sees card details.
- Your money is held safely by Velor in escrow - it is NOT sent to the seller straight away.
- The seller only gets paid AFTER your order is delivered and a short protection window passes, and never while a return or dispute is open.
- So you never "pay and hope" - if something goes wrong, your money is protected.

WHAT YOU CAN HELP BUYERS WITH:
- Explaining buyer protection and how escrow keeps their money safe
- How ordering, shipping and delivery confirmation work
- Returns and disputes: buyers can request a return, and can open a dispute from their order page if an item is faulty, damaged, or not as described; Velor mediates fairly
- Currencies, and that Velor ships worldwide from independent sellers
- Helping them understand categories and find the kind of product they are looking for (in general terms - you cannot browse live stock or check a specific item's availability)
- Pointing sellers who ask about selling to the "Sell on Velor" / apply page

HONESTY RULES, never break these:
- Never claim to be human.
- Never claim to see the buyer's orders, a specific order's live tracking, or any account data - you do not have it. If asked, tell them plainly they can track orders and open returns or disputes from their account's order page, or contact support at customerservice@velorcommerce.store.
- Never invent a policy, price, product, discount, or delivery date. If you do not know something specific, say so plainly.
- Keep answers concise, warm, and genuinely helpful. You are the friendly, trustworthy face of Velor for someone deciding whether to buy.

LANGUAGE (this rule overrides tone, never break it):
Always reply in the SAME language the person is writing to you in. If they write in Spanish, answer in Spanish. If they write in Vietnamese, Arabic, Hindi, Turkish, Bengali, Mandarin, or any other language, answer fluently in that language. Do not apologise for the language, do not ask them to switch to English, and do not answer in two languages at once. If their message mixes languages, use the language of the majority of their message. Proper nouns like "Velor", "Stripe" and "Payoneer" stay as they are.`

const TIER_ADDENDUM: Record<AssistantTier, string> = {
  STARTER: `

You are talking to a Starter-tier seller. You do not have access to this seller's private order or payout data - answer from general Velor knowledge only. If they ask something that needs their real account data (a specific order status, their exact payout date), tell them plainly that account-specific lookups are a Pro feature and point them at their dashboard, or mention that upgrading unlocks it - do not guess numbers on their behalf.`,
  PRO: `

You are talking to a Pro-tier seller and acting as their dedicated AI account manager. Below this line is a real, live snapshot of THIS seller's own account, including their most recent orders - use it to give specific answers, including about individual recent orders. Never mention or imply any other seller's data.

You have three extra capabilities Starter does not have:
1. Order lookups - answer specific questions about their recent orders using the snapshot below.
2. Drafting - if asked, you can write a ready-to-send draft reply to a buyer, or a draft message to Velor support, clearly labelled as a draft. You never send anything yourself; the seller copies and sends it.
3. Escalation - if the seller clearly wants to escalate an issue to a human at Velor (not just ask a question), say so plainly in your reply, and end your entire reply with the exact marker [[ESCALATE]] on its own final line. Only use this marker when the seller genuinely wants a human to step in - never for routine questions you can already answer. The marker is stripped before the seller sees your reply and instead files a real priority support ticket for them.`,
}

async function callAnthropic(systemPrompt: string, messages: { role: string; content: string }[], apiKey: string) {
  // The widget seeds the conversation with an opening assistant greeting.
  // The Anthropic Messages API requires the conversation to START with a
  // user message, so drop any leading assistant messages (and any stray
  // empty ones) before sending, otherwise the API returns no content.
  const normalized = messages
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content ?? '') }))
    .filter((m) => m.content.trim().length > 0)
  while (normalized.length > 0 && normalized[0].role !== 'user') {
    normalized.shift()
  }
  return fetch('https://api.anthropic.com/v1/messages', {
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
      messages: normalized,
    }),
  })
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'The AI assistant is not configured yet. Please contact support.' }, { status: 503 })
  }

  const body = await req.json()
  const messages = Array.isArray(body?.messages) ? body.messages : []
  if (messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }
  const audience: 'buyer' | 'seller' = body?.audience === 'buyer' ? 'buyer' : 'seller'

  // ---- Public / buyer path: no login required, no account data ----
  if (audience === 'buyer') {
    try {
      const res = await callAnthropic(BUYER_SYSTEM_PROMPT, messages, apiKey)
      if (!res.ok) {
        const errText = await res.text()
        console.error('Anthropic API error (buyer):', res.status, errText)
        return NextResponse.json({ error: 'The AI assistant is temporarily unavailable. Please try again shortly.' }, { status: 502 })
      }
      const data = await res.json()
      const reply: string = (Array.isArray(data?.content) ? data.content.filter((b: { type?: string; text?: string }) => b?.type === 'text' && typeof b.text === 'string').map((b: { text?: string }) => b.text as string).join('\n').trim() : '') || 'Sorry, I was not able to generate a response.'
      return NextResponse.json({ reply })
    } catch (err) {
      console.error('Assistant buyer route error:', err)
      return NextResponse.json({ error: 'The AI assistant is temporarily unavailable. Please try again shortly.' }, { status: 500 })
    }
  }

  // ---- Seller path: requires login + seller account, tier-aware ----
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true } } },
  })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  const rawTier = (seller.tier as string) ?? 'STARTER'
  const tier: AssistantTier = rawTier === 'PRO' || rawTier === 'ENTERPRISE' ? 'PRO' : 'STARTER'
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
    const anthropicRes = await callAnthropic(systemPrompt, messages, apiKey)

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('Anthropic API error:', anthropicRes.status, errText)
      return NextResponse.json({ error: 'The AI assistant is temporarily unavailable. Please try again shortly.' }, { status: 502 })
    }

    const data = await anthropicRes.json()
    let reply: string = (Array.isArray(data?.content) ? data.content.filter((b: { type?: string; text?: string }) => b?.type === 'text' && typeof b.text === 'string').map((b: { text?: string }) => b.text as string).join('\n').trim() : '') || 'Sorry, I was not able to generate a response.'

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
