import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const FORBIDDEN_PATTERNS = [
  /weapon|gun|knife|blade|explosive|bomb/i,
  /adult|porn|xxx/i,
  /drug|narcotic|steroid/i,
  /counterfeit|replica/i,
]

async function sendEmail(payload: object) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

async function aiReviewProduct(product: {
  name: string
  description: string
  category: string
  price: number
}): Promise<{ approved: boolean; reason: string }> {
  // Check forbidden patterns
  const textToCheck = `${product.name} ${product.description}`.toLowerCase()
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(textToCheck)) {
      return { approved: false, reason: `Contains forbidden content matching pattern: ${pattern}` }
    }
  }

  // Check description length
  if (!product.description || product.description.trim().length < 20) {
    return { approved: false, reason: 'Description is too short or missing.' }
  }

  // Check price is positive
  if (product.price <= 0) {
    return { approved: false, reason: 'Price must be greater than zero.' }
  }

  // AI review via Claude
  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `You are a marketplace product moderator. Review this product listing and decide if it should be approved.

Product name: ${product.name}
Category: ${product.category}
Price: ${product.price}
Description: ${product.description}

Reply with JSON only: { "approved": true/false, "reason": "brief reason" }
Reject if: dangerous, illegal, adult content, clearly fraudulent, or spam.`,
          },
        ],
      }),
    })

    const aiData = await aiRes.json()
    const text = aiData.content?.[0]?.text || ''
    const match = text.match(/{[sS]*}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return { approved: !!parsed.approved, reason: parsed.reason || 'AI review complete.' }
    }
  } catch {
    // Fall through to approve if AI fails
  }

  return { approved: true, reason: 'Passed automated review.' }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pendingProducts = await prisma.product.findMany({
    where: { status: 'PENDING' },
    include: {
      seller: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  })

  const results: Array<{ productId: string; approved: boolean; reason: string }> = []

  for (const product of pendingProducts) {
    const { approved, reason } = await aiReviewProduct({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price,
    })

    await prisma.product.update({
      where: { id: product.id },
      data: { status: approved ? 'APPROVED' : 'REJECTED' },
    })

    const sellerEmail = product.seller?.user?.email
    const sellerName = product.seller?.user?.name || 'Seller'

    if (sellerEmail) {
      await sendEmail({
        from: 'noreply@velorcommerce.store',
        to: sellerEmail,
        subject: approved
          ? `Your product "${product.name}" has been approved`
          : `Your product "${product.name}" was not approved`,
        html: approved
          ? `<p>Hi ${sellerName},</p><p>Great news! Your product <strong>${product.name}</strong> has been approved and is now live on Velor Marketplace.</p><p>Thank you for selling on Velor.</p>`
          : `<p>Hi ${sellerName},</p><p>Unfortunately your product <strong>${product.name}</strong> was not approved.</p><p>Reason: ${reason}</p><p>Please review our product guidelines and resubmit if appropriate.</p>`,
      })
    }

    results.push({ productId: product.id, approved, reason })
  }

  return NextResponse.json({ reviewed: results.length, results })
}
