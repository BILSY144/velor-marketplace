import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { grantCountryFounderIfFirst } from '@/lib/founding'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

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
      certificates: {
        select: { id: true, type: true, status: true, destinationCountry: true, expiresAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // Accepts EITHER a NextAuth ADMIN session (desktop /admin/products) or a
  // Bearer ADMIN_SECRET header (Velor Pulse mobile dashboard) -- same shared
  // gate already used by /api/admin/certificates and /api/admin/pulse-listings.
  // Does not weaken the check: a mobile caller still needs the real admin
  // secret, same as any other admin action. (William, 2026-08-04.)
  const session = await auth()

  const { productId, action, note } = await req.json()

  // One-off admin data-fix action (William, 2026-08-08): clears a bad
  // ProductVariant.priceOverride so it falls back to the listing's own
  // (correct) base price -- added after the Premium Leather Sling Bag
  // listing showed £180 on the homepage but £1600 on its own page because
  // both variants had a stray priceOverride of 1600. Clearing rather than
  // hardcoding a number keeps variants correctly following the base price
  // if it's ever changed later. This is a stopgap for pre-existing bad data;
  // going forward the save-time guardrail in normalizeVariants
  // (app/api/dashboard/products/route.ts) blocks a new priceOverride from
  // diverging more than 3x from the base price in the first place, so this
  // action should rarely be needed again. Kept separate from the
  // approve/reject/delist actions below -- it never touches product.status.
  if (action === 'fix_variant_prices') {
    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
    const target = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, price: true, title: true } })
    if (!target) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    const result = await prisma.productVariant.updateMany({
      where: { productId },
      data: { priceOverride: null },
    })
    return NextResponse.json({ ok: true, productTitle: target.title, basePrice: target.price, variantsCleared: result.count })
  }

  // 'delist' added 2026-07-26 alongside instant-listing (William: "once
  // listed we will review for banned products or something that should not
  // be listed") -- it's the takedown half of that: 'approve'/'reject' still
  // resolve a PENDING_REVIEW listing (now only the certificate/regulated-
  // signal ones, since ordinary listings go live instantly and never reach
  // this queue); 'delist' takes an already-live APPROVED listing down after
  // the fact.
      if (!productId || !['approve', 'reject', 'delist', 'override_approve'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
      // Admin override: lets an authenticated admin push a certificate-gated listing live on their own judgement, without a verified certificate on file. Deliberately a SEPARATE action from 'approve' below, so the hard certificate gate stays completely untouched for any listing that hasn't been overridden. A written reason is mandatory and stored permanently against the product for audit/regulatory defensibility, per velor-global-compliance's Certificate-Required Products section. (William, 2026-08-04.)
      if (action === 'override_approve' && (!note || !String(note).trim())) {
              return NextResponse.json({ error: 'A reason is required to override the certificate gate.' }, { status: 400 })
      }

  // Certificate gate: a regulated-material listing can never be approved
  // until at least one certificate has been VERIFIED by admin review and is
  // not expired. See /legal/seller-rules section 4 and the
  // velor-global-compliance research -- default-deny is deliberate.
  if (action === 'approve') {
    const target = await prisma.product.findUnique({
      where: { id: productId },
      select: { requiresCertificate: true },
    })
    if (!target) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    if (target.requiresCertificate) {
      const validCert = await prisma.productCertificate.findFirst({
        where: {
          productId,
          status: 'VERIFIED',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true },
      })
      if (!validCert) {
        return NextResponse.json({
          error: 'This listing is certificate-gated: it cannot be approved until a valid certificate has been verified in the certificate review queue (/api/admin/certificates).',
          certificateRequired: true,
        }, { status: 409 })
      }
    }
  }

  // A delist only makes sense against a listing that is currently live --
  // guard against accidentally delisting something still in PENDING_REVIEW
  // or already REJECTED, which should go through 'approve'/'reject' instead.
  if (action === 'delist') {
    const target = await prisma.product.findUnique({
      where: { id: productId },
      select: { status: true },
    })
    if (!target) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    if (target.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Only a live (APPROVED) listing can be delisted.' }, { status: 409 })
    }
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
            status: (action === 'approve' || action === 'override_approve') ? 'APPROVED' : action === 'delist' ? 'DELISTED' : 'REJECTED',
            ...(action === 'override_approve' ? { certificateOverrideNote: String(note).slice(0, 2000), certificateOverrideBy: (session?.user as any)?.email || (session?.user as any)?.name || 'William (Pulse mobile)', certificateOverrideAt: new Date() } : {}),
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

      if (action === 'approve' || action === 'override_approve') {
      await grantCountryFounderIfFirst(product.sellerId, product.id, product.originCountry)
    await sendEmail({
      from: 'Velor Marketplace <noreply@velorglobalmarket.com>',
      reply_to: 'support@velorglobalmarket.com',
      to: sellerEmail,
      subject: `Your listing has been approved - ${product.title}`,
      html: `<div style="background:#0D0D0D;color:#fff;font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;"><div style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin-bottom:24px;"><span style="color:#FF6B00;">Velor</span> Marketplace</div><div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;padding:28px;"><div style="font-size:20px;font-weight:700;margin-bottom:8px;">Your listing is live</div><div style="color:#999;margin-bottom:20px;">Hi ${sellerName} - your product has been reviewed and approved.</div><div style="background:#0D0D0D;border:1px solid #2A2A2A;border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${storeName}</div><div style="font-size:16px;font-weight:600;color:#fff;">${product.title}</div><div style="font-size:20px;font-weight:700;color:#FF6B00;margin-top:8px;">${Number(product.price).toFixed(2)}</div></div><div style="color:#00E676;font-size:14px;font-weight:600;">Your listing is now visible to buyers on Velor Marketplace.</div></div></div>`,
    })
  } else if (action === 'delist') {
    await sendEmail({
      from: 'Velor Marketplace <noreply@velorglobalmarket.com>',
      reply_to: 'support@velorglobalmarket.com',
      to: sellerEmail,
      subject: `Your listing has been taken down - ${product.title}`,
      html: `<div style="background:#0D0D0D;color:#fff;font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;"><div style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin-bottom:24px;"><span style="color:#FF6B00;">Velor</span> Marketplace</div><div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;padding:28px;"><div style="font-size:20px;font-weight:700;margin-bottom:8px;">Listing removed</div><div style="color:#999;margin-bottom:20px;">Hi ${sellerName} - on review, this listing has been removed from Velor Marketplace and is no longer visible to buyers.</div><div style="background:#0D0D0D;border:1px solid #2A2A2A;border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${storeName}</div><div style="font-size:16px;font-weight:600;color:#fff;">${product.title}</div></div>${note ? `<div style="background:rgba(255,23,68,0.08);border:1px solid rgba(255,23,68,0.2);border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:12px;color:#FF1744;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;margin-bottom:8px;">Reason</div><div style="color:#fff;font-size:14px;line-height:1.6;">${note}</div></div>` : ''}<div style="color:#999;font-size:14px;line-height:1.6;">If you believe this was a mistake, contact support@velorglobalmarket.com</div></div></div>`,
    })
  } else {
    await sendEmail({
      from: 'Velor Marketplace <noreply@velorglobalmarket.com>',
      reply_to: 'support@velorglobalmarket.com',
      to: sellerEmail,
      subject: `Update on your listing - ${product.title}`,
      html: `<div style="background:#0D0D0D;color:#fff;font-family:Inter,sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;"><div style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin-bottom:24px;"><span style="color:#FF6B00;">Velor</span> Marketplace</div><div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;padding:28px;"><div style="font-size:20px;font-weight:700;margin-bottom:8px;">Listing requires changes</div><div style="color:#999;margin-bottom:20px;">Hi ${sellerName} - your listing could not be approved in its current form.</div><div style="background:#0D0D0D;border:1px solid #2A2A2A;border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${storeName}</div><div style="font-size:16px;font-weight:600;color:#fff;">${product.title}</div></div>${note ? `<div style="background:rgba(255,23,68,0.08);border:1px solid rgba(255,23,68,0.2);border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:12px;color:#FF1744;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;margin-bottom:8px;">Reason</div><div style="color:#fff;font-size:14px;line-height:1.6;">${note}</div></div>` : ''}<div style="color:#999;font-size:14px;line-height:1.6;">Please update your listing and resubmit for review. If you have questions, contact support@velorglobalmarket.com</div></div></div>`,
    })
  }

  return NextResponse.json({ success: true })
}
