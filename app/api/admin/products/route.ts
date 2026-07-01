import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('status') || 'PENDING'
  const where =
    filter === 'ALL' ? {} :
    filter === 'APPROVED' ? { status: 'APPROVED' as const } :
    filter === 'REJECTED' ? { status: 'REJECTED' as const } :
    { status: 'PENDING_REVIEW' as const } // PENDING default

  const products = await prisma.product.findMany({
    where,
    include: {
      seller: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { productId, action, note } = await req.json()
  if (!productId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
    },
    include: {
      seller: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  })

  const sellerEmail = product.seller.user.email
  const sellerName = product.seller.user.name || 'there'
  const storeName = product.seller.storeName

  if (action === 'approve') {
    await sendEmail({
      from: 'Velor Marketplace <noreply@velorcommerce.store>',
      reply_to: 'support@velorcommerce.store',
      to: sellerEmail,
      subject: `Your listing has been approved — ${product.name}`,
      html: `<div style="background:#0D0D0D;color:#fff;font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;"><div style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin-bottom:24px;"><span style="color:#FF6B00;">Velor</span> Marketplace</div><div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;padding:28px;"><div style="font-size:20px;font-weight:700;margin-bottom:8px;">Your listing is live</div><div style="color:#999;margin-bottom:20px;">Hi ${sellerName} — your product has been reviewed and approved.</div><div style="background:#0D0D0D;border:1px solid #2A2A2A;border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${storeName}</div><div style="font-size:16px;font-weight:600;color:#fff;">${product.name}</div><div style="font-size:20px;font-weight:700;color:#FF6B00;margin-top:8px;">£${Number(product.price).toFixed(2)}</div></div><div style="color:#00E676;font-size:14px;font-weight:600;">Your listing is now visible to buyers on Velor Marketplace.</div></div></div>`,
    })
  } else {
    await sendEmail({
      from: 'Velor Marketplace <noreply@velorcommerce.store>',
      reply_to: 'support@velorcommerce.store',
      to: sellerEmail,
      subject: `Update on your listing — ${product.name}`,
      html: `<div style="background:#0D0D0D;color:#fff;font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;"><div style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin-bottom:24px;"><span style="color:#FF6B00;">Velor</span> Marketplace</div><div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;padding:28px;"><div style="font-size:20px;font-weight:700;margin-bottom:8px;">Listing requires changes</div><div style="color:#999;margin-bottom:20px;">Hi ${sellerName} — your listing could not be approved in its current form.</div><div style="background:#0D0D0D;border:1px solid #2A2A2A;border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${storeName}</div><div style="font-size:16px;font-weight:600;color:#fff;">${product.name}</div></div>${note ? `<div style="background:rgba(255,23,68,0.08);border:1px solid rgba(255,23,68,0.2);border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:12px;color:#FF1744;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;margin-bottom:8px;">Reason</div><div style="color:#fff;font-size:14px;line-height:1.6;">${note}</div></div>` : ''}<div style="color:#999;font-size:14px;line-height:1.6;">Please update your listing and resubmit for review. If you have questions, contact support@velorcommerce.store</div></div></div>`,
    })
  }

  return NextResponse.json({ success: true })
}
