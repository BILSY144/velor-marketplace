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

  // --- Job 3: Stripe payout-account hygiene, ALL sellers ------------------
  // (William, 2026-07-21: "make sure this is set for all seller dashboards")
  // The pre-fix cookie bug could persist a wrong Stripe account id onto any
  // seller row. This sweep cleans every seller daily:
  //   - a row carrying the PLATFORM's own account id is cleared
  //   - the SAME account id on multiple seller rows is contamination for
  //     all of them (rightful owner cannot be proven) -- all cleared;
  //     affected sellers simply re-onboard, funds stay safely in escrow
  //   - surviving unique accounts get stripeOnboarded synced with live
  //     Stripe truth; deleted/missing accounts are cleared
  let hygieneCleared = 0
  let hygieneSynced = 0
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const { default: Stripe } = await import('stripe')
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
      let platformId: string | null = null
      try { platformId = (await stripe.accounts.retrieve()).id } catch { platformId = null }

      const rows = await prisma.seller.findMany({
        where: { stripeAccountId: { not: null } },
        select: { id: true, stripeAccountId: true, stripeOnboarded: true },
        take: 500,
      })
      const byAccount = new Map<string, string[]>()
      for (const r of rows) {
        const acc = r.stripeAccountId as string
        byAccount.set(acc, [...(byAccount.get(acc) || []), r.id])
      }
      for (const [acc, sellerIds] of Array.from(byAccount.entries())) {
        const isPlatform = platformId !== null && acc === platformId
        if (isPlatform || sellerIds.length > 1) {
          await prisma.seller.updateMany({
            where: { id: { in: sellerIds } },
            data: { stripeAccountId: null, stripeOnboarded: false },
          })
          hygieneCleared += sellerIds.length
          await prisma.agentLog.create({
            data: {
              agentName: 'confirm-deliveries',
              action: 'stripe-account-hygiene-cleared',
              status: 'success',
              details: { reason: isPlatform ? 'platform-account' : 'duplicate-across-sellers', sellerIds },
            },
          }).catch(() => {})
          continue
        }
        // Unique, non-platform account: sync the stored flag with Stripe.
        try {
          const account = await stripe.accounts.retrieve(acc)
          const onboarded = !!(account.charges_enabled && account.payouts_enabled)
          const row = rows.find((r) => r.id === sellerIds[0])
          if (row && row.stripeOnboarded !== onboarded) {
            await prisma.seller.update({ where: { id: sellerIds[0] }, data: { stripeOnboarded: onboarded } })
            hygieneSynced++
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : ''
          // Only clear when Stripe says the account genuinely does not
          // exist -- transient API errors must not wipe a valid link.
          if (/No such account|does not exist/i.test(msg)) {
            await prisma.seller.updateMany({
              where: { id: { in: sellerIds } },
              data: { stripeAccountId: null, stripeOnboarded: false },
            })
            hygieneCleared += sellerIds.length
          }
        }
      }
    } catch (err) {
      console.error('[confirm-deliveries] stripe hygiene sweep failed (non-blocking):', err)
    }
  }

  if (autoConfirmed > 0 || retried > 0 || hygieneCleared > 0 || hygieneSynced > 0) {
    await prisma.agentLog
      .create({
        data: {
          agentName: 'confirm-deliveries',
          action: 'delivery-backstop-run',
          status: 'success',
          details: { retried, retryFailed, autoConfirmed, blockedByIssue, hygieneCleared, hygieneSynced },
        },
      })
      .catch(() => {})
  }

  return NextResponse.json({ ok: true, retried, retryFailed, autoConfirmed, blockedByIssue, hygieneCleared, hygieneSynced })
}
