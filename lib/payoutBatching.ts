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

// William, 2026-08-03: replaced the earlier flat GBP15 placeholder with
// real, account-verified numbers pulled directly from the actual Velor
// Commerce Ltd Payoneer account (Manage > Fees > Pay > "When paying
// directly to another Payoneer account", Customer ID 104582691): $3 flat
// when the recipient is in the same country as Velor, or 0.6% of the
// transaction amount (minimum $3) when they're in a different country.
// Velor's sellers are virtually always in a different country from Velor
// (UK), so the different-country rate -- percentage with a flat minimum --
// is the one that applies here, not a single flat number.
//
// Caveat: this is the fee schedule for the account's manual "Pay" feature,
// not yet confirmed as the exact rate the Mass Payouts API will charge.
// Velor applied to Payoneer's Mass Payouts partner program on 13 July 2026
// and followed up urgently on 21 July; Payoneer's only reply (25 July,
// ticket 260721-023420) didn't confirm approval or a rate -- it just
// pointed back to the generic contractor-payments lead form. Until that
// application clears and confirms whether the Mass Payouts rate matches
// this one, treat these two constants as the best real anchor available,
// not a final number -- update them the moment it does.
export const NON_STRIPE_PAYOUT_FEE_PERCENT = 0.006
export const NON_STRIPE_PAYOUT_FEE_MINIMUM_USD = 3

// A batch only sends once the commission Velor earned on its underlying
// orders is comfortably clear of the estimated transfer fee -- "comfortably"
// meaning a margin on top of the raw fee estimate, not just equal to it, so
// normal week-to-week variance in the real fee doesn't flip a batch from
// profitable to loss-making. 1.5x is a deliberately simple, round starting
// point -- tune once the Mass Payouts application confirms the real API rate.
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

// feeEstimateGBP: the caller computes this from the batch's real totalAmount
// via estimateFeeGBP() below, using a live USD->GBP rate from lib/fx.ts
// rather than a hardcoded conversion that would silently drift out of date.
// Required, not defaulted -- a stale hardcoded GBP figure baked in here is
// exactly the kind of drift this file exists to avoid. Keeping this function
// itself pure and synchronous (no I/O) also keeps it trivial to unit test.
//
// oldestQueuedOrderCreatedAt: createdAt of the oldest Order among the
// seller's queued Payout rows (not the Payout row's own createdAt -- an
// order that waited out its hold window already spent real time before
// ever reaching the queue).
export function shouldSendBatch(params: {
      totalCommissionGBP: number
      feeEstimateGBP: number
      oldestQueuedOrderCreatedAt: Date
      now?: Date
}): BatchDecision {
      const now = params.now ?? new Date()
      const safetyThreshold = params.feeEstimateGBP * BATCH_SEND_SAFETY_MULTIPLIER

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

// Estimated Payoneer fee (in GBP) for sending totalAmountGBP to a seller in
// a different country from Velor -- the case that applies to virtually
// every payout here. Percentage-of-amount with a currency-converted flat
// minimum, matching Payoneer's real "different country" Pay fee (see the
// 2026-08-03 note above). usdToGbpRate should come from lib/fx.ts's
// getRate('USD', 'GBP') so the $3 minimum tracks the real exchange rate
// instead of a number that quietly goes stale as GBP/USD moves.
export function estimateFeeGBP(totalAmountGBP: number, usdToGbpRate: number): number {
      const minimumGBP = NON_STRIPE_PAYOUT_FEE_MINIMUM_USD * usdToGbpRate
      return Math.max(totalAmountGBP * NON_STRIPE_PAYOUT_FEE_PERCENT, minimumGBP)
}
