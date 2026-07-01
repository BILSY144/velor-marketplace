import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'PENDING_REVIEW'

  const where = status === 'ALL' ? {} : { status: status as any }

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
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId, action, note } = await req.json()
  if (!productId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

  const product = await prisma.product.update({
    where: { id: productId },
    data: { status: newStatus },
    include: {
      seller: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  })

  const sellerEmail = product.seller.user.email
  const sellerName = product.seller.user.name

  const subject =
    action === 'approve'
      ? `Your product "${product.name}" has been approved`
      : `Your product "${product.name}" needs attention`

  const html =
    action === 'approve'
      ? `<h2>Product Approved</h2><p>Hi ${sellerName},</p><p>Your product <strong>${product.name}</strong> has been approved and is now live on Velor Marketplace.</p><p><a href="https://velorcommerce.store/dashboard/products">View your products</a></p>`
      : `<h2>Product Requires Changes</h2><p>Hi ${sellerName},</p><p>Your product <strong>${product.name}</strong> was not approved for the following reason:</p><blockquote>${note || 'Please review our listing guidelines and resubmit.'}</blockquote><p><a href="https://velorcommerce.store/dashboard/products">Update your listing</a></p>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Velor Marketplace <noreply@velorcommerce.co.uk>',
      reply_to: 'customerservice@velorcommerce.co.uk',
      to: sellerEmail,
      subject,
      html,
    }),
  }).catch(() => {})

  return NextResponse.json({ success: true, product })
}
