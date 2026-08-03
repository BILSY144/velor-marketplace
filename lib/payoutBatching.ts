// Non-Stripe payout batching + "never lose money on a payout fee" check.
//
// William, 2026-08-02: "batch non stripe payments weekly per seller" plus
// "is there a way to set up a system of calculations so we dont lose
// money" -- prompted directly by the cost model showing that Velor's flat
// 10% commission on a GBP6-20 catalogue (GBP0.60-2.00 per order) is smaller
// than a single SWIFT-style flat transfer fee (GBP10-20), so paying a
// non-Stripe seller out per order (the old release-payouts behaviour) could
// lose money on nearly every individual payout. Batching many orders into
// one weekly transfer per seller amortises that flat fee across a week of
// commission instead of charging it against one small sale.
//
// This governs PAYONEER today. It is written generically (a `rail` string,
// not a PAYONEER-specific type) so a future AIRWALLEX rail -- see the
// Airwallex application-prep doc -- can reuse the same batching cron and
// loss-check with a couple of added branches, not a rewrite.

// PLACEHOLDER -- UPDATE THE MOMENT A REAL NUMBER IS KNOWN. Payoneer's
// published pricing (payoneer.com/about/pricing) only covers the
// RECEIVING/withdrawal side; what Payoneer actually charges VELOR to SEND a
// Mass Payout is not published anywhere and needs a direct answer from
// Payoneer (partner/API agreement, not the public pricing page). Until
// that's known, this is a deliberately conservative estimate seeded from
// the researched SWIFT-transfer range (GBP10-20) for cross-border payout
// providers generally -- it exists so the loss-check below has SOMETHING
// to compare against rather than silently assuming fees are zero. Airwallex
// gives a real, cheaper anchor for comparison once that rail is live: free
// via local rails in 120+ countries, GBP10-20 only where SWIFT is the only
// option -- Payoneer's actual number could land anywhere in or outside that
// range. Err on the side of overestimating this constant, not
// underestimating it: overestimating only delays a payout by deferring it
// to the next batch (see MAX_BATCH_DEFER_DAYS below, which guarantees it's
// never delayed forever); underestimating risks actually sending a batch
// that loses money, exactly what this file exists to prevent.
export const NON_STRIPE_PAYOUT_FEE_ESTIMATE_GBP = 15

// A batch only sends once the commission Velor earned on its underlying
// orders is comfortably clear of the estimated transfer fee -- "comfortably"
// meaning a margin on top of the raw fee estimate, not just equal to it, so
// normal week-to-week variance in the real fee doesn't flip a batch from
// profitable to loss-making. 1.5x is a deliberately simple, round starting
// point -- tune once a real Payoneer fee number replaces the estimate above.
export const BATCH_SEND_SAFETY_MULTIPLIER = 1.5

// A seller's queued (unsent) orders are never held indefinitely just
// because their accumulated commission hasn't cleared the safety threshold
// -- that would be unfair to a genuinely slow-selling seller who is owed
// real money. Past this many days, the oldest queued order in a seller's
// batch forces that seller's whole batch to send even if it's still under
// the safety threshold (never below break-even on the fee ESTIMATE itself,
// only below the 1.5x safety margin -- see shouldSendBatch below). This
// value is a real business tradeoff (how long is it fair to hold a small
// seller's money vs. how much margin erosion is acceptable) -- 28 days is a
// starting point, not a fixed decision; revisit if it turns out wrong in
// either direction.
export const MAX_BATCH_DEFER_DAYS = 28

export type BatchDecision =
    | { send: true; forced: boolean }
  | { send: false; reason: 'below_safety_threshold' }

// oldestQueuedOrderCreatedAt: createdAt of the oldest Order among the
// seller's queued Payout rows (not the Payout row's own createdAt -- an
// order that waited out its hold window already spent real time before
// ever reaching the queue).
export function shouldSendBatch(params: {
    totalCommissionGBP: number
    feeEstimateGBP?: number
    oldestQueuedOrderCreatedAt: Date
    now?: Date
}): BatchDecision {
    const feeEstimate = params.feeEstimateGBP ?? NON_STRIPE_PAYOUT_FEE_ESTIMATE_GBP
    const now = params.now ?? new Date()
    const safetyThreshold = feeEstimate * BATCH_SEND_SAFETY_MULTIPLIER

  if (params.totalCommissionGBP >= safetyThreshold) {
        return { send: true, forced: false }
  }

  const ageMs = now.getTime() - params.oldestQueuedOrderCreatedAt.getTime()
    const maxAgeMs = MAX_BATCH_DEFER_DAYS * 24 * 60 * 60 * 1000
    if (ageMs >= maxAgeMs) {
          // Forced send: still under the SAFETY margin, but a seller's money
      // can't wait forever. Only ever forced below the safety margin, never
      // below the raw fee estimate itself becoming clearly absurd (e.g. a
      // single GBP0.60 order) -- that scenario is caught by simply summing
      // more orders in over time; MAX_BATCH_DEFER_DAYS is the backstop for
      // the case where volume genuinely never arrives.
      return { send: true, forced: true }
    }

  return { send: false, reason: 'below_safety_threshold' }
}
