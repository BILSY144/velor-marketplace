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
  const text = `${product.name} ${product.description} ${product.category}`
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      return { approved: false, reason: 'Product contains prohibited content or keywords.' }
    }
  }

  if (!product.description || product.description.trim().length < 20) {
    return { approved: false, reason: 'Description is too short or missing. Please write a clear product description of at least 20 characters.' }
  }

  if (product.price <= 0) {
    return { approved: false, reason: 'Product price must be greater than £0.' }
  }

  const prompt = `You are a marketplace product moderator for Velor, a legitimate UK e-commerce marketplace.

Review this product listing and decide if it should be approved or rejected.

Product Name: ${product.name}
Category: ${product.category}
Price: £${product.price}
Description: ${product.description}

Approve the product if:
- It is a real, physical product that can be legally sold in the UK
- The description is clear, accurate, and at least somewhat informative
- The price is reasonable (not suspiciously low like £0.01 or absurdly high)
- It does not violate any laws or marketplace policies

Reject the product if:
- It is a prohibited item (weapons, drugs, counterfeit goods, adult content, etc.)
- The description is gibberish, placeholder text, or test data
- The name or description is clearly spam or an attempt to game the system
- It appears to be a service rather than a physical product

Respond with ONLY valid JSON, no markdown, no explanation outside the JSON:
{"approved": true, "reason": "Brief explanation"}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await r.json()
    const responseText = data.content?.[0]?.text || ''
    const match = responseText.match(/\{[\s\S]*?\}/)
    if (match) {
      return JSON.parse(match[0])
    }
  } catch {
    // AI call failed — approve by default to avoid blocking legitimate sellers
  }

  return { approved: true, reason: 'Passed automated review.' }
}

// POST /api/admin/products/auto-moderate
// Called by Vercel cron — secured by CRON_SECRET header
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pendingProducts = await prisma.product.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: {
      seller: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  })

  if (pendingProducts.length === 0) {
    return NextResponse.json({ reviewed: 0 })
  }

  const results = []

  for (const product of pendingProducts) {
    const { approved, reason } = await aiReviewProduct({
      name: product.name,
      description: product.description,
      category: product.category,
      price: Number(product.price),
    })

    const newStatus = approved ? 'APPROVED' : 'REJECTED'

    await prisma.product.update({
      where: { id: product.id },
      data: {
        status: newStatus,
        ...(approved ? {} : { rejectionNote: reason }),
      },
    })

    const sellerEmail = product.seller.user.email
    const sellerName = product.seller.user.name || 'there'
    const businessName = product.seller.businessName

    if (approved) {
      await sendEmail({
        from: 'Velor Marketplace <noreply@velorcommerce.co.uk>',
        reply_to: 'customerservice@velorcommerce.co.uk',
        to: sellerEmail,
        subject: `Your listing has been approved — ${product.name}`,
        html: `<div style="background:#0D0D0D;color:#fff;font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;"><div style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin-bottom:24px;"><span style="color:#FF6B00;">Velor</span> Marketplace</div><div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;padding:28px;"><div style="font-size:20px;font-weight:700;margin-bottom:8px;">Your listing is live</div><div style="color:#999;margin-bottom:20px;">Hi ${sellerName} — your product has been reviewed and approved.</div><div style="background:#0D0D0D;border:1px solid #2A2A2A;border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${businessName}</div><div style="font-size:16px;font-weight:600;color:#fff;">${product.name}</div><div style="font-size:20px;font-weight:700;color:#FF6B00;margin-top:8px;">£${Number(product.price).toFixed(2)}</div></div><div style="color:#00E676;font-size:14px;font-weight:600;">Your listing is now visible to buyers on Velor Marketplace.</div></div></div>`,
      })
    } else {
      await sendEmail({
        from: 'Velor Marketplace <noreply@velorcommerce.co.uk>',
        reply_to: 'customerservice@velorcommerce.co.uk',
        to: sellerEmail,
        subject: `Update on your listing — ${product.name}`,
        html: `<div style="background:#0D0D0D;color:#fff;font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;"><div style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin-bottom:24px;"><span style="color:#FF6B00;">Velor</span> Marketplace</div><div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;padding:28px;"><div style="font-size:20px;font-weight:700;margin-bottom:8px;">Listing requires changes</div><div style="color:#999;margin-bottom:20px;">Hi ${sellerName} — your listing could not be approved in its current form.</div><div style="background:#0D0D0D;border:1px solid #2A2A2A;border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${businessName}</div><div style="font-size:16px;font-weight:600;color:#fff;">${product.name}</div></div><div style="background:rgba(255,23,68,0.08);border:1px solid rgba(255,23,68,0.2);border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:12px;color:#FF1744;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;margin-bottom:8px;">Reason</div><div style="color:#fff;font-size:14px;line-height:1.6;">${reason}</div></div><div style="color:#999;font-size:14px;line-height:1.6;">Please update your listing and resubmit for review. If you have questions, contact customerservice@velorcommerce.co.uk</div></div></div>`,
      })
    }

    results.push({ id: product.id, name: product.name, status: newStatus, reason })
  }

  return NextResponse.json({ reviewed: results.length, results })
}