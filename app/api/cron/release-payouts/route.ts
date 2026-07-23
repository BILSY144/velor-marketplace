import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { isPayoneerConfigured, createPayout as createPayoneerPayout, getPayeeStatus } from '@/lib/payoneer'
import { isDotsConfigured, createPayout as createDotsPayout, getUserStatus as getDotsUserStatus } from '@/lib/dots'
import { isTrolleyConfigured, createPayout as createTrolleyPayout, getRecipientStatus as getTrolleyRecipientStatus } from '@/lib/trolley'
import { getPayoutRail } from '@/lib/payoutRail'
import {
  PROBATION_HOLD_MS,
  TRUSTED_HOLD_MS,
  isSellerTrusted,
  orderHasOpenIssue,
} from '@/lib/payouts'
import { requireCronSecret } from '@/lib/cronAuth'

export const maxDuration = 60

// Payout release cron. Holds funds on the platform until delivery is confirmed,
// then releases the seller's share (from the PaymentIntent metadata) once the
// hold window passes and no return/dispute is open. The rail differs by seller
// (Stripe transfer, or a Trolley payout for Stripe-unsupported countries --
// see lib/payoutRail.ts; Dots and Payoneer kept only for a legacy few) but
// the RULES are identical on every rail by explicit decision: same delivery
// confirmation requirement, same 15-day/72-hour holds, same dispute freeze.
export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  })
  const now = Date.now()

  // The platform's own Stripe account id -- a seller row must NEVER carry
  // it as a payout destination (possible via the pre-2026-07-21 cookie
  // contamination bug in /api/stripe/connect/account). Transfers to self
  // would fail anyway, but this guard also CLEANS the corrupt row.
  let platformAccountId: string | null = null
  try {
    const platform = await stripe.accounts.retrieve()
    platformAccountId = platform.id
  } catch {
    platformAccountId = null
  }

  // Delivered orders that have not been paid out yet (no payout row).
  const candidates = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
      deliveredAt: { not: null },
      payout: null,
      stripePaymentId: { not: null },
    },
    select: { id: true, sellerId: true, deliveredAt: true, stripePaymentId: true, currency: true },
    take: 200,
  })

  let released = 0
  let releasedPayoneer = 0
  let releasedDots = 0
  let releasedTrolley = 0
  let heldOpen = 0
  let waiting = 0
  let heldForPayoneer = 0
  let heldForDots = 0
  let heldForTrolley = 0
  let heldForStripeSetup = 0
  let skipped = 0
  let heldUnverified = 0

  for (const o of candidates) {
    try {
      if (!o.deliveredAt) {
        skipped++
        continue
      }
      // Open return/dispute freezes this order regardless of the timer.
      if (await orderHasOpenIssue(o.id)) {
        heldOpen++
        continue
      }
      const trusted = await isSellerTrusted(o.sellerId)
      const hold = trusted ? TRUSTED_HOLD_MS : PROBATION_HOLD_MS
      if (o.deliveredAt.getTime() + hold > now) {
        waiting++
        continue
      }

      const pi = await stripe.paymentIntents.retrieve(o.stripePaymentId as string)
      const md = (pi.metadata || {}) as Record<string, string>
      // A single PaymentIntent can now cover MULTIPLE sellers (a mixed
      // cart -- see lib/orders.ts), each with their own Order and their own
      // share of the payment. sellerBreakdown holds one compact entry per
      // seller (i=sellerId, e=sellerShareGBP -- see app/api/stripe/
      // payment-intent/route.ts for the full key legend); this order's own
      // share is whichever entry matches ITS sellerId, never the whole
      // PaymentIntent's total.
      let sellerBreakdown: Array<{ i: string; e: number }> = []
      try {
        sellerBreakdown = JSON.parse(md.sellerBreakdown || '[]')
      } catch {
        sellerBreakdown = []
      }
      const sellerEntry = sellerBreakdown.find((s) => s && s.i === o.sellerId)
      const sellerShareGBP = Number(sellerEntry?.e) || 0
      const sellerShare = Math.round(sellerShareGBP * 100) // minor units (pence) for Stripe/Payoneer
      if (!sellerShare || sellerShare <= 0) {
        skipped++
        continue
      }
      const chargeId = (pi as unknown as { latest_charge?: string }).latest_charge
      // sellerShareGBP is ALWAYS GBP-denominated, computed server-side in GBP
      // regardless of what currency the buyer actually paid in (payment-intent/
      // route.ts converts everything to GBP before working out each seller's
      // share). pi.currency reflects the buyer's charge currency instead, which
      // can be non-GBP -- pairing that with a GBP-denominated amount would
      // silently send the wrong amount in the wrong currency. Using 'gbp' here
      // is the only pairing that's ever actually correct; if the platform's
      // Stripe balance doesn't hold enough GBP to cover it, the transfer call
      // below throws and is caught by the existing catch-and-retry -- a safe
      // failure (funds stay in escrow, retried next run), never a silently
      // wrong payout.
      const currency = 'gbp'

      // This order's Stripe Connect account, looked up fresh from the
      // database by the order's own sellerId -- not from PaymentIntent
      // metadata (checkout no longer stores sellerAccountId there at all,
      // both because a fresh DB read is always current rather than a
      // checkout-time snapshot, and because dropping it kept sellerBreakdown
      // small enough to fit Stripe's 500-char metadata-value cap for carts
      // with several sellers). Also grabs payoutRail/payoneerPayeeId in the
      // same query, replacing the second lookup that used to happen further
      // down only for the Payoneer branch.
      const sellerRow = await prisma.seller.findUnique({
        where: { id: o.sellerId },
        select: {
          country: true,
          stripeAccountId: true,
          payoutRail: true,
          payoneerPayeeId: true,
          dotsUserId: true,
          dotsOnboarded: true,
          trolleyRecipientId: true,
          trolleyOnboarded: true,
          identityVerified: true,
        },
      })
      let sellerAccountId = sellerRow?.stripeAccountId || ''
      if (sellerAccountId && platformAccountId && sellerAccountId === platformAccountId) {
        // Corrupt row: clean it and treat the seller as not yet onboarded --
        // funds stay safely in escrow until they connect a real account.
        await prisma.seller
          .update({ where: { id: o.sellerId }, data: { stripeAccountId: null, stripeOnboarded: false } })
          .catch(() => {})
        sellerAccountId = ''
      }

      // LAW (identity model changed 2026-07-21, William: identity works
      // "like payouts"): never release a payout -- on any rail -- to a
      // seller who has not passed the payout rail's own regulated KYC.
      // This replaced the old separate photo-ID (Stripe Identity) gate:
      //   STRIPE rail   -> the connected account must be LIVE-verified as
      //                    charges+payouts enabled (checked below, fresh
      //                    from Stripe, before every transfer). Stripe only
      //                    enables payouts once its KYC has passed.
      //   DOTS rail     -> the user must be LIVE-reported onboarded
      //                    (checked below, lib/dots.ts getUserStatus).
      //                    Dots only reports this once its own compliance
      //                    checks have passed.
      //   PAYONEER rail -> the payee must be LIVE-reported ACTIVE (checked
      //                    below). Payoneer only activates a payee once its
      //                    KYC has passed.
      // Funds stay safely in escrow and retry every run until the seller's
      // rail reports them verified. Seller.identityVerified is self-healed
      // to true at that moment so every other surface reads consistently.
      if (!sellerRow) {
        skipped++
        continue
      }

      // Rail is resolved LIVE from the seller's country -- never from the
      // stored payoutRail field, which can be stale (the exact bug class
      // caught live on 2026-07-21: a GB seller stuck on a persisted
      // PAYONEER value would never have been paid). lib/payoutRail.ts is
      // the single source of truth and accepts country names or ISO codes;
      // it now resolves every non-Stripe country to DOTS, not PAYONEER
      // (2026-07-23). Branching is STRICT per rail: a Stripe-rail seller
      // can only ever be paid through Stripe Connect, a Dots-rail seller
      // only ever through Dots, a Payoneer-rail seller only ever through
      // Payoneer -- a leftover account/payee on the wrong rail can no
      // longer route money down it. Self-heal the stored field while we're
      // here, same pattern as /api/dashboard/payouts.
      const rail = getPayoutRail(sellerRow.country)
      if (rail !== sellerRow.payoutRail) {
        await prisma.seller.update({ where: { id: o.sellerId }, data: { payoutRail: rail } }).catch(() => {})
      }

      if (rail === 'STRIPE' && sellerAccountId) {
        // STRIPE rail. LIVE KYC gate: only transfer to an account Stripe
        // itself reports fully enabled -- payouts_enabled means Stripe's
        // identity verification has passed. A part-onboarded account never
        // receives funds (they would strand in the connected account's
        // balance); the order waits in escrow and retries.
        const account = await stripe.accounts.retrieve(sellerAccountId)
        if (!account.charges_enabled || !account.payouts_enabled) {
          heldForStripeSetup++
          continue
        }
        if (!sellerRow.identityVerified) {
          await prisma.seller
            .update({ where: { id: o.sellerId }, data: { identityVerified: true, stripeOnboarded: true } })
            .catch(() => {})
        }
        // Idempotency key keyed on the order guarantees we never
        // double-transfer, even if a later step fails and the cron retries.
        const transfer = await stripe.transfers.create(
          {
            amount: sellerShare,
            currency,
            destination: sellerAccountId,
            transfer_group: o.id,
            ...(chargeId ? { source_transaction: chargeId } : {}),
            metadata: { orderId: o.id },
          },
          { idempotencyKey: `payout_${o.id}` }
        )

        await prisma.payout.create({
          data: {
            sellerId: o.sellerId,
            orderId: o.id,
            amount: sellerShare / 100,
            currency,
            stripeTransferId: transfer.id,
            status: 'paid',
          },
        })
        released++
        continue
      }

      // TROLLEY rail -- the default for non-Stripe countries since
      // 2026-07-23 evening (see lib/payoutRail.ts), replacing DOTS (a
      // confirmed permanent dead end -- Dots.dev is hard-locked to US
      // businesses only). Same holds and dispute checks already passed
      // above -- only the transfer differs. A trolleyRecipientId is stored
      // the moment onboarding starts, BEFORE the seller has necessarily
      // finished it -- pay only a recipient Trolley itself reports
      // onboarded (compliance verified AND a payout method added),
      // otherwise keep the funds safely in escrow and retry next run.
      if (rail === 'TROLLEY' && sellerRow.trolleyRecipientId && isTrolleyConfigured()) {
        const trolleyStatus = await getTrolleyRecipientStatus(sellerRow.trolleyRecipientId)
        if (!trolleyStatus.onboarded) {
          heldForTrolley++
          continue
        }
        if (!sellerRow.trolleyOnboarded) {
          await prisma.seller
            .update({ where: { id: o.sellerId }, data: { trolleyOnboarded: true } })
            .catch(() => {})
        }
        if (!sellerRow.identityVerified) {
          await prisma.seller
            .update({ where: { id: o.sellerId }, data: { identityVerified: true } })
            .catch(() => {})
        }
        const { payoutId } = await createTrolleyPayout({
          recipientId: sellerRow.trolleyRecipientId,
          amount: sellerShare / 100,
          currency: currency.toUpperCase(),
          clientReferenceId: `payout_${o.id}`,
          description: `Velor Marketplace payout for order ${o.id}`,
        })
        await prisma.payout.create({
          data: {
            sellerId: o.sellerId,
            orderId: o.id,
            amount: sellerShare / 100,
            currency,
            trolleyPayoutId: payoutId,
            status: 'paid',
          },
        })
        releasedTrolley++
        continue
      } else if (rail === 'TROLLEY') {
        // Trolley rail not configured yet, or seller not onboarded: funds
        // stay safely in the platform escrow and this order retries every
        // run.
        heldForTrolley++
        continue
      }

      // DOTS rail -- LEGACY. Confirmed a permanent dead end (Dots.dev is
      // hard-locked to United States businesses only; Velor Commerce Ltd is
      // UK-registered and can never create an account), no longer
      // auto-assigned by getPayoutRail() (see lib/payoutRail.ts). This
      // branch only matters for a seller stored as DOTS before 2026-07-23
      // evening who has not yet self-healed to TROLLEY -- kept only so
      // in-flight rows never silently strand; the rail resolves fresh from
      // country at the top of this loop, so any such seller self-heals to
      // TROLLEY on this very run before reaching this branch.
      if (rail === 'DOTS' && sellerRow.dotsUserId && isDotsConfigured()) {
        const dotsStatus = await getDotsUserStatus(sellerRow.dotsUserId)
        if (!dotsStatus.onboarded) {
          heldForDots++
          continue
        }
        if (!sellerRow.dotsOnboarded) {
          await prisma.seller
            .update({ where: { id: o.sellerId }, data: { dotsOnboarded: true } })
            .catch(() => {})
        }
        if (!sellerRow.identityVerified) {
          await prisma.seller
            .update({ where: { id: o.sellerId }, data: { identityVerified: true } })
            .catch(() => {})
        }
        const { payoutId } = await createDotsPayout({
          userId: sellerRow.dotsUserId,
          amount: sellerShare / 100,
          currency,
          clientReferenceId: `payout_${o.id}`,
          description: `Velor Marketplace payout for order ${o.id}`,
        })
        await prisma.payout.create({
          data: {
            sellerId: o.sellerId,
            orderId: o.id,
            amount: sellerShare / 100,
            currency,
            dotsPayoutId: payoutId,
            status: 'paid',
          },
        })
        releasedDots++
        continue
      } else if (rail === 'DOTS') {
        // Dots rail not configured yet, or seller not onboarded: funds stay
        // safely in the platform escrow and this order retries every run.
        heldForDots++
        continue
      }

      // PAYONEER rail (legacy -- no longer auto-assigned by getPayoutRail(),
      // see lib/payoutRail.ts -- or a Stripe-rail seller who has not
      // finished Connect onboarding, who simply waits in escrow). Same
      // holds and dispute checks already passed above -- only the transfer
      // differs.
      if (rail === 'PAYONEER' && sellerRow.payoneerPayeeId && isPayoneerConfigured()) {
        // A payeeId is stored the moment a registration link is generated,
        // BEFORE the seller has necessarily completed Payoneer signup --
        // pay only a payee Payoneer itself reports as active, otherwise
        // keep the funds safely in escrow and retry next run.
        const payee = await getPayeeStatus(sellerRow.payoneerPayeeId)
        if (String(payee.status).toUpperCase() !== 'ACTIVE') {
          heldForPayoneer++
          continue
        }
        // ACTIVE means Payoneer's KYC has passed -- self-heal the identity
        // flag so every surface reads consistently (same as Stripe branch).
        if (!sellerRow.identityVerified) {
          await prisma.seller
            .update({ where: { id: o.sellerId }, data: { identityVerified: true } })
            .catch(() => {})
        }
        // client_reference_id `payout_<orderId>` mirrors the Stripe
        // idempotency convention so a retried run can never double-pay.
        const { payoutId } = await createPayoneerPayout({
          payeeId: sellerRow.payoneerPayeeId,
          amount: sellerShare / 100,
          currency,
          clientReferenceId: `payout_${o.id}`,
          description: `Velor Marketplace payout for order ${o.id}`,
        })
        await prisma.payout.create({
          data: {
            sellerId: o.sellerId,
            orderId: o.id,
            amount: sellerShare / 100,
            currency,
            payoneerPayoutId: payoutId,
            status: 'paid',
          },
        })
        releasedPayoneer++
      } else if (rail === 'PAYONEER') {
        // Payoneer rail not live yet, or seller not onboarded: funds stay
        // safely in the platform escrow and this order retries every run.
        heldForPayoneer++
      } else {
        // Stripe-rail seller without a completed Connect account: funds
        // stay safely in escrow until their Stripe onboarding finishes.
        heldForStripeSetup++
      }
    } catch {
      skipped++
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates.length,
    released,
    releasedTrolley,
    releasedDots,
    releasedPayoneer,
    heldOpen,
    waiting,
    heldForTrolley,
    heldForDots,
    heldForPayoneer,
    heldForStripeSetup,
    heldUnverified,
    skipped,
  })
}
