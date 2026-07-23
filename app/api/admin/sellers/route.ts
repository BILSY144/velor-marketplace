import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { computeSellerStatus, sellerActionData } from '@/lib/sellerStatus'
import { sendEmail, buildSellerApprovedEmail, buildSellerRejectedEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'PENDING'

  // Fixed 2026-07-23: PENDING/REJECTED/SUSPENDED used to all collapse onto
  // the same `approved:false` query (see the Seller.rejectedAt schema
  // comment) -- a REJECTED filter returned every never-reviewed seller too.
  // Now that rejectedAt/suspendedAt exist, each tab is a real, distinct query.
  let where: Prisma.SellerWhereInput = {}
  if (status === 'APPROVED') {
    where = { approved: true }
  } else if (status === 'REJECTED') {
    where = { approved: false, rejectedAt: { not: null } }
  } else if (status === 'SUSPENDED') {
    where = { approved: false, suspendedAt: { not: null } }
  } else if (status === 'PENDING') {
    where = { approved: false, rejectedAt: null, suspendedAt: null }
  }
  // status === 'ALL' -> where stays {}

  const sellers = await prisma.seller.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
      products: { select: { id: true, title: true, category: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    sellers: sellers.map((s) => ({
      ...s,
      status: computeSellerStatus(s),
    })),
  })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { sellerId, action } = body
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''

  if (!sellerId || !['approve', 'reject', 'suspend'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const seller = await prisma.seller.update({
    where: { id: sellerId },
    data: sellerActionData(action, reason),
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  const sellerName = seller.user.name || 'Seller'
  const sellerEmail = seller.user.email || ''

  // Best-effort: a failed email must never undo the status change that
  // already committed. Reuses lib/email.ts's shared builders for
  // approve/reject (same copy every other seller decision email in the
  // codebase uses) rather than the old inline HTML template.
  if (sellerEmail) {
    try {
      if (action === 'approve') {
        const built = buildSellerApprovedEmail({ sellerName, storeName: seller.storeName })
        await sendEmail({ to: sellerEmail, subject: built.subject, html: built.html })
      } else if (action === 'reject') {
        const built = buildSellerRejectedEmail({
          contactName: sellerName,
          businessName: seller.storeName,
          reason: reason || 'No specific reason was provided.',
        })
        await sendEmail({ to: sellerEmail, subject: built.subject, html: built.html })
      } else {
        await sendEmail({
          to: sellerEmail,
          subject: 'Your Velor seller account has been suspended',
          html: `<div style="font-family:Inter,sans-serif;background:#0D0D0D;color:#ffffff;padding:40px;max-width:600px;margin:0 auto">
<h1 style="color:#FF1744;font-size:24px;margin-bottom:16px">Account suspended</h1>
<p style="color:#cccccc;font-size:15px;line-height:1.6">Hi ${sellerName},</p>
<p style="color:#cccccc;font-size:15px;line-height:1.6">Your Velor seller account has been suspended. Please contact our support team for more information.</p>
<p style="color:#666666;font-size:13px;margin-top:40px">The Velor Team</p>
</div>`,
        })
      }
    } catch (err) {
      console.error('admin/sellers PATCH: failed to send seller decision email', err)
    }
  }

  return NextResponse.json({ seller: { ...seller, status: computeSellerStatus(seller) } })
}
