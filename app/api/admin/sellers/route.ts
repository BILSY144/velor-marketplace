import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'PENDING'

  let where: Prisma.SellerWhereInput = {}
  if (status === 'APPROVED') {
    where = { isApproved: true, isSuspended: false }
  } else if (status === 'SUSPENDED') {
    where = { isSuspended: true }
  } else if (status === 'REJECTED') {
    where = { isApproved: false, isSuspended: true }
  } else if (status !== 'ALL') {
    where = { isApproved: false, isSuspended: false }
  }

  const sellers = await prisma.seller.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ sellers })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { sellerId, action } = body

  if (!sellerId || !['approve', 'reject', 'suspend'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  let updateData: Prisma.SellerUpdateInput = { isSuspended: true }
  if (action === 'approve') {
    updateData = { isApproved: true, isSuspended: false }
  } else if (action === 'reject') {
    updateData = { isApproved: false, isSuspended: true }
  }

  const seller = await prisma.seller.update({
    where: { id: sellerId },
    data: updateData,
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  if (action === 'approve') {
    await prisma.user.update({
      where: { id: seller.userId },
      data: { role: 'SELLER' },
    })
  }

  const sellerName = seller.user.name || 'Seller'
  const sellerEmail = seller.user.email || ''

  if (sellerEmail && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const subject =
      action === 'approve'
        ? 'Your Velor seller account has been approved'
        : action === 'reject'
        ? 'Update on your Velor seller application'
        : 'Your Velor seller account has been suspended'

    const bodyHtml =
      action === 'approve'
        ? `<div style="font-family:Inter,sans-serif;background:#0D0D0D;color:#ffffff;padding:40px;max-width:600px;margin:0 auto">
<h1 style="color:#FF6B00;font-size:24px;margin-bottom:16px">You're approved!</h1>
<p style="color:#cccccc;font-size:15px;line-height:1.6">Hi ${sellerName},</p>
<p style="color:#cccccc;font-size:15px;line-height:1.6">Great news — your Velor seller account has been approved. You can now list products, manage orders, and receive payouts through your seller dashboard.</p>
<a href="https://velorcommerce.store/dashboard" style="display:inline-block;margin-top:24px;background:#FF6B00;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Go to Dashboard</a>
<p style="color:#666666;font-size:13px;margin-top:40px">The Velor Team</p>
</div>`
        : action === 'reject'
        ? `<div style="font-family:Inter,sans-serif;background:#0D0D0D;color:#ffffff;padding:40px;max-width:600px;margin:0 auto">
<h1 style="color:#ffffff;font-size:24px;margin-bottom:16px">Application update</h1>
<p style="color:#cccccc;font-size:15px;line-height:1.6">Hi ${sellerName},</p>
<p style="color:#cccccc;font-size:15px;line-height:1.6">Thank you for applying to sell on Velor. After reviewing your application, we are unable to approve it at this time. If you believe this is an error or have further information to share, please contact our team.</p>
<p style="color:#666666;font-size:13px;margin-top:40px">The Velor Team</p>
</div>`
        : `<div style="font-family:Inter,sans-serif;background:#0D0D0D;color:#ffffff;padding:40px;max-width:600px;margin:0 auto">
<h1 style="color:#FF1744;font-size:24px;margin-bottom:16px">Account suspended</h1>
<p style="color:#cccccc;font-size:15px;line-height:1.6">Hi ${sellerName},</p>
<p style="color:#cccccc;font-size:15px;line-height:1.6">Your Velor seller account has been suspended. Please contact our support team for more information.</p>
<p style="color:#666666;font-size:13px;margin-top:40px">The Velor Team</p>
</div>`

    await resend.emails.send({
      from: 'noreply@velorcommerce.store',
      to: sellerEmail,
      subject,
      html: bodyHtml,
    })
  }

  return NextResponse.json({ seller })
}
