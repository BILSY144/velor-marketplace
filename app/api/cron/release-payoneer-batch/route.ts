import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPayout as createPayoneerPayout, getPayeeStatus } from '@/lib/payoneer'
import { requireCronSecret } from '@/lib/cronAuth'
import { shouldSendBatch } from '@/lib/payoutBatching'

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
                          skippedSellers++
                          continue
                }

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

          const decision = shouldSendBatch({
                    totalCommissionGBP,
                    oldestQueuedOrderCreatedAt,
          })

          if (!decision.send) {
                    deferred += rows.length
                    continue
          }

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
