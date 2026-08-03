import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPayout as createPayoneerPayout, getPayeeStatus } from '@/lib/payoneer'
import { requireCronSecret } from '@/lib/cronAuth'
import { shouldSendBatch, estimateFeeGBP } from '@/lib/payoutBatching'
import { getRate } from '@/lib/fx'

export const maxDuration = 60

// Weekly Payoneer batch-send cron (William, 2026-08-02: "batch non stripe
// payments weekly per seller ... is there a way to set up a system of
// calculations so we dont lose money"). app/api/cron/release-payouts/route.ts
// no longer pays a Payoneer-rail seller per order -- it queues their share
// as a Payout row with status 'queued_for_batch' the moment it clears the
// usual delivery/hold/dispute checks. This cron is the only place a real
// Payoneer transfer for a non-Stripe seller is actually sent: once a week,
// it groups every seller's queued rows into ONE payout covering everything
// they're owed, so a flat per-transfer fee lands against a week of
// commission instead of a single GBP6-20 sale. See lib/payoutBatching.ts
// for the loss-prevention check (shouldSendBatch) this cron enforces before
// ever calling Payoneer.
export async function GET(req: NextRequest) {
      const authError = requireCronSecret(req)
      if (authError) return authError

  const queued = await prisma.payout.findMany({
          where: { status: 'queued_for_batch', batchId: null, rail: 'PAYONEER' },
          select: {
                    id: true,
                    sellerId: true,
                    amount: true,
                    currency: true,
                    orderId: true,
                    order: { select: { platformFee: true, createdAt: true } },
          },
  })

  const bySeller = new Map<string, typeof queued>()
      for (const p of queued) {
              const list = bySeller.get(p.sellerId) ?? []
                      list.push(p)
              bySeller.set(p.sellerId, list)
      }

  // Live USD->GBP rate (cached in the DB by lib/fx.ts, refreshed every 6h)
  // for converting Payoneer's $3 minimum fee into GBP -- see the
  // 2026-08-03 note in lib/payoutBatching.ts. Fetched once per run, not
  // once per seller, since it's the same rate for every batch below.
  const usdToGbp = await getRate('USD', 'GBP')

  let sent = 0
      let sentForced = 0
      let deferred = 0
      let heldForPayee = 0
      let failed = 0
      let skippedSellers = 0

  for (const [sellerId, rows] of bySeller) {
          try {
                    const sellerRow = await prisma.seller.findUnique({
                                where: { id: sellerId },
                                select: { payoneerPayeeId: true, currency: true },
                    })
                    if (!sellerRow?.payoneerPayeeId) {
                                // Shouldn't normally happen (rows only get queued once a payeeId
                      // exists), but a seller row can change between queue-time and
                      // batch-time -- fail safe by leaving this seller's rows queued for
                      // next week rather than guessing a destination.
                      skippedSellers++
                                continue
                    }

            // Re-check the payee is still ACTIVE at send time, not just at
            // queue time -- same "only pay a KYC-passed payee" rule the release
            // cron already enforces, re-verified because up to a week may have
            // passed since the oldest row in this batch was queued.
            const payee = await getPayeeStatus(sellerRow.payoneerPayeeId)
                    if (String(payee.status).toUpperCase() !== 'ACTIVE') {
                                heldForPayee += rows.length
                                continue
                    }

            const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0)
                    const totalCommissionGBP = rows.reduce((sum, r) => sum + (r.order?.platformFee ?? 0), 0)
                    const oldestQueuedOrderCreatedAt = rows.reduce<Date>((oldest, r) => {
                                const createdAt = r.order?.createdAt
                                if (!createdAt) return oldest
                                return createdAt < oldest ? createdAt : oldest
                    }, new Date())

            // totalAmount is GBP-denominated (see the currency comment below),
            // so estimateFeeGBP can compare it directly against Payoneer's real
            // percentage fee, converting only the flat-minimum side to GBP.
            const feeEstimateGBP = estimateFeeGBP(totalAmount, usdToGbp)

            const decision = shouldSendBatch({
                        totalCommissionGBP,
                        feeEstimateGBP,
                        oldestQueuedOrderCreatedAt,
            })

            if (!decision.send) {
                        // Leave every row in this seller's batch queued -- they'll be
                      // re-evaluated next week, joined by whatever else lands in the
                      // meantime, until either the commission clears the safety
                      // threshold or MAX_BATCH_DEFER_DAYS forces a send regardless.
                      deferred += rows.length
                        continue
            }

            // Currency: sellerShare is always GBP-denominated (see the comment
            // in release-payouts/route.ts) -- every queued row already carries
            // 'gbp' as its currency for the same reason, so summing is safe.
            const currency = rows[0]?.currency || 'gbp'

            const batch = await prisma.payoutBatch.create({
                        data: {
                                      sellerId,
                                      rail: 'PAYONEER',
                                      totalAmount,
                                      currency,
                                      orderCount: rows.length,
                                      totalCommissionGBP,
                                      status: 'pending',
                        },
            })

            try {
                        // client_reference_id keyed on the BATCH id (not any one order) --
                      // a retried cron run that finds this batch already 'sent' won't
                      // reach this call again (see the status update below), and a crash
                      // between this call succeeding and the status update below is
                      // caught by Payoneer's own idempotent client_reference_id handling
                      // if this exact batch row is ever retried some other way.
                      const { payoutId } = await createPayoneerPayout({
                                    payeeId: sellerRow.payoneerPayeeId,
                                    amount: totalAmount,
                                    currency,
                                    clientReferenceId: `payout_batch_${batch.id}`,
                                    description: `Velor Marketplace weekly payout (${rows.length} order${rows.length === 1 ? '' : 's'})`,
                      })

                      await prisma.$transaction([
                                    prisma.payoutBatch.update({
                                                    where: { id: batch.id },
                                                    data: { payoneerPayoutId: payoutId, status: 'sent', sentAt: new Date() },
                                    }),
                                    prisma.payout.updateMany({
                                                    where: { id: { in: rows.map((r) => r.id) } },
                                                    data: { status: 'paid', batchId: batch.id },
                                    }),
                                  ])

                      if (decision.forced) sentForced += rows.length
                        else sent += rows.length
            } catch (err) {
                        // The Payoneer call itself failed (or the follow-up transaction
                      // did) -- mark this batch row 'failed' for the audit trail, but
                      // deliberately do NOT touch the underlying Payout rows: they stay
                      // 'queued_for_batch' with batchId still null, so next week's run
                      // picks them up fresh (possibly combined with newer orders too),
                      // with no risk of double-paying since no payoneerPayoutId was ever
                      // recorded.
                      await prisma.payoutBatch
                          .update({ where: { id: batch.id }, data: { status: 'failed' } })
                          .catch(() => {})
                        console.error('[release-payoneer-batch] send failed for seller', sellerId, err)
                        failed += rows.length
            }
          } catch (err) {
                    console.error('[release-payoneer-batch] error processing seller', sellerId, err)
                    skippedSellers++
          }
  }

  return NextResponse.json({
          ok: true,
          sellersScanned: bySeller.size,
          ordersQueued: queued.length,
          sent,
          sentForced,
          deferred,
          heldForPayee,
          failed,
          skippedSellers,
  })
}
