import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCronSecret } from '@/lib/cronAuth'
import { createTrack, normalizeCarrierToken } from '@/lib/shippo'
import { orderHasOpenIssue } from '@/lib/payouts'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Delivery-confirmation backstop cron (William, 2026-07-21: "buyer confirm +
// auto after 30 days"). Two jobs, both protecting the same guarantee -- no
// order can ever be permanently stranded short of DELIVERED with its
// seller's money stuck in escrow:
//
// 1. RETRY failed tracking registrations. Shippo's /tracks registration at
//    tracking-entry time is best-effort; when it fails, trackRegistered
//    stays false on the shipment and this cron retries it, so the delivery
//    webhook gets its chance to work automatically after all.
//
// 2. AUTO-CONFIRM delivery 30 days after shipping. If an order has been
//    SHIPPED for 30+ days with no webhook confirmation and no buyer
//    confirmation, it is deemed delivered (Etsy/Amazon model) -- UNLESS a
//    return or dispute is open, which blocks auto-confirmation entirely.
//    Auto-confirming only starts the normal escrow hold window; the payout
//    cron still applies its own open-issue freeze and identity checks.
//
// The anchor is Order.shippedAt (stamped when tracking is first added);
// orders shipped before that field existed fall back to the shipment row's
// createdAt, never to the order's creation date.

const AUTO_CONFIRM_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError

  const now = Date.now()
  let retried = 0
  let retryFailed = 0
  let autoConfirmed = 0
  let blockedByIssue = 0

  // --- Job 1: retry Shippo tracking registration -------------------------
  if (process.env.SHIPPO_API_KEY) {
    const unregistered = await prisma.shipment.findMany({
      where: {
        trackRegistered: false,
        trackingNumber: { not: null },
        carrier: { not: null },
        order: { status: 'SHIPPED' },
      },
      select: { id: true, carrier: true, trackingNumber: true },
      take: 50,
    })
    for (const s of unregistered) {
      try {
        await createTrack(normalizeCarrierToken(s.carrier as string), s.trackingNumber as string)
        await prisma.shipment.update({ where: { id: s.id }, data: { trackRegistered: true } })
        retried++
      } catch {
        // Unsupported carrier or transient failure -- stays false, retried
        // next run; the 30-day auto-confirm below is the final backstop.
        retryFailed++
      }
    }
  }

  // --- Job 2: 30-day auto-confirm ----------------------------------------
  const cutoff = new Date(now - AUTO_CONFIRM_MS)
  const stale = await prisma.order.findMany({
    where: {
      status: 'SHIPPED',
      OR: [
        { shippedAt: { not: null, lte: cutoff } },
        // Orders shipped before shippedAt existed: anchor on the shipment
        // row's creation (when tracking was first entered).
        { shippedAt: null, shipment: { is: { createdAt: { lte: cutoff } } } },
      ],
    },
    select: { id: true },
    take: 200,
  })

  for (const o of stale) {
    try {
      // An open return or dispute blocks auto-confirmation -- a buyer who
      // has raised a problem must never have "delivered" decided by a timer.
      if (await orderHasOpenIssue(o.id)) {
        blockedByIssue++
        continue
      }
      await prisma.order.update({
        where: { id: o.id },
        data: { status: 'DELIVERED', deliveredAt: new Date(), deliveryConfirmedBy: 'AUTO' },
      })
      await prisma.shipment.updateMany({ where: { orderId: o.id }, data: { status: 'DELIVERED' } })
      autoConfirmed++
    } catch {
      // Skipped this run, retried next run.
    }
  }

  if (autoConfirmed > 0 || retried > 0) {
    await prisma.agentLog
      .create({
        data: {
          agentName: 'confirm-deliveries',
          action: 'delivery-backstop-run',
          status: 'success',
          details: { retried, retryFailed, autoConfirmed, blockedByIssue },
        },
      })
      .catch(() => {})
  }

  return NextResponse.json({ ok: true, retried, retryFailed, autoConfirmed, blockedByIssue })
}
