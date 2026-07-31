import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/fx'

// "Never lose money" fee-recovery helpers (William, 2026-07-31). See
// docs/PAYOUTS.md's AMENDMENT for the full design and reasoning. Two real
// costs Stripe never returns to Velor, verified directly against Stripe's
// own docs:
//   1. The original card-processing fee on a refunded charge (refunding a
//      charge never returns the fee Stripe took when it was charged).
//   2. The dispute fee (~GBP15 in the UK) on a chargeback -- taken the
//      moment a dispute opens and NEVER returned, win or lose (confirmed
//      against docs.stripe.com/disputes/responding: "Otherwise, the dispute
//      fee isn't returned" applies to both the won and lost outcomes for a
//      UK business).
// The buyer must still get a full refund (UK consumer law), and Velor's own
// margin isn't the right place to eat these either -- Amazon (Refund Admin
// Fee), Etsy, and eBay all handle the equivalent gap the same way: recover
// it from the seller whose returned/disputed item caused the cost, never
// from the buyer. Since a seller can only be reversed up to whatever was
// actually transferred to them, recovering MORE than that (or recovering it
// before any transfer happened at all) has to happen as a running ledger
// balance recovered out of a FUTURE payout, not a same-transaction claw-back.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

/**
 * The EXACT original Stripe processing fee Velor was charged on a charge,
 * converted to GBP. Never an estimate -- read straight from the charge's
 * own balance transaction, which is the authoritative source for what
 * Stripe actually deducted.
 */
export async function getOriginalStripeFeeGBP(chargeId: string): Promise<number> {
  try {
    const charge = await stripe.charges.retrieve(chargeId, { expand: ['balance_transaction'] })
    const bt = charge.balance_transaction as Stripe.BalanceTransaction | null
    if (!bt || typeof bt.fee !== 'number') return 0
    const feeCurrency = String(bt.currency || 'gbp').toUpperCase()
    const feeAmountGBP = bt.fee / 100
    return feeCurrency === 'GBP' ? feeAmountGBP : await convert(feeAmountGBP, feeCurrency, 'GBP')
  } catch (err) {
    // Never let a fee lookup failure block a refund or dispute resolution
    // from completing -- worst case Velor doesn't recover this one cost,
    // which is strictly better than the refund/dispute itself failing.
    console.error('[feeRecovery] failed to read original Stripe fee for charge', chargeId, err)
    return 0
  }
}

/**
 * Reverses an already-paid-out seller transfer, if one exists. Safe to call
 * even when there's nothing to reverse (payout hadn't gone out yet) or it's
 * already been reversed -- never throws, since this must never be what
 * blocks a buyer refund or a dispute resolution from completing.
 */
export async function reverseSellerTransferIfAny(
  stripeTransferId: string | null | undefined,
  idempotencyKey: string
): Promise<void> {
  if (!stripeTransferId) return
  try {
    await stripe.transfers.createReversal(stripeTransferId, {}, { idempotencyKey })
  } catch (err) {
    console.error('[feeRecovery] transfer reversal failed (may already be reversed)', stripeTransferId, err)
  }
}

/**
 * Adds a GBP amount to the seller's running "owed to Velor" balance --
 * a cost the platform absorbed (an un-refunded Stripe fee, a lost dispute's
 * fee) that gets recovered out of a FUTURE payout instead of coming
 * straight out of Velor's own margin. See release-payouts cron's
 * deductOwedBalance() for where this is actually collected.
 */
export async function addToSellerOwedBalance(sellerId: string, amountGBP: number): Promise<void> {
  const rounded = Math.round(amountGBP * 100) / 100
  if (rounded <= 0) return
  await prisma.seller.update({
    where: { id: sellerId },
    data: { platformFeeOwedGBP: { increment: rounded } },
  })
}

/**
 * Called from the release-payouts cron right before transferring a
 * seller's earnings on an order. Deducts as much of their outstanding
 * platformFeeOwedGBP as this payout can cover (never below 0), decrements
 * the ledger by exactly what was recovered, and returns the reduced amount
 * to actually pay out. Any remainder carries forward to their next payout.
 */
export async function deductOwedBalance(sellerId: string, sellerShareGBP: number): Promise<{ payableGBP: number; deductedGBP: number }> {
  if (sellerShareGBP <= 0) return { payableGBP: sellerShareGBP, deductedGBP: 0 }
  const seller = await prisma.seller.findUnique({ where: { id: sellerId }, select: { platformFeeOwedGBP: true } })
  const owedGBP = seller?.platformFeeOwedGBP || 0
  if (owedGBP <= 0) return { payableGBP: sellerShareGBP, deductedGBP: 0 }

  const deductedGBP = Math.round(Math.min(owedGBP, sellerShareGBP) * 100) / 100
  const payableGBP = Math.round((sellerShareGBP - deductedGBP) * 100) / 100
  await prisma.seller.update({
    where: { id: sellerId },
    data: { platformFeeOwedGBP: { decrement: deductedGBP } },
  })
  return { payableGBP, deductedGBP }
}

// Stripe's standard published dispute ("chargeback") fee for UK/GBP
// businesses -- charged the moment a dispute opens and NEVER returned by
// Stripe, win or lose (verified against docs.stripe.com/disputes/responding,
// 2026-07-31). Not otherwise readable as a single clean field via the API in
// a way that's safe to depend on here, so this is a documented constant
// rather than a live lookup -- check Stripe's current dispute pricing if
// this is ever suspected to be stale.
export const UK_DISPUTE_FEE_GBP = 15

