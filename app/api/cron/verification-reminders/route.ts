import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCronSecret } from '@/lib/cronAuth'
import { payoutGateSatisfied } from '@/lib/payoutGateCookie'
import { sendEmail, buildPayoutSetupReminderEmail, buildFirstListingReminderEmail } from '@/lib/email'

export const maxDuration = 60

// List-Unsubscribe header for these reminder sends specifically (William,
// 2026-08-07: "we need to make the emails go to their inboxes not junk").
// This ladder is the highest-volume automated send in the codebase (up to
// 29 recipients per run, indefinitely repeating), so it's the one most
// exposed to Gmail/Yahoo's bulk-sender requirements. A mailto: address is
// used rather than a one-click HTTPS unsubscribe link because there is no
// unsubscribe endpoint built yet -- List-Unsubscribe-Post/RFC 8058 one-click
// only applies to a URL-based List-Unsubscribe, so it is intentionally
// omitted here rather than added incorrectly.
const UNSUBSCRIBE_HEADERS = {
  'List-Unsubscribe': '<mailto:customerservice@velorcommerce.co.uk?subject=unsubscribe>',
}

// Seller Activation Reminder ladder (William, 2026-08-07: "we have 34
// sellers but only 4-5 of them have actually listed"). This route used to
// run a photo-ID verification reminder ladder that was RETIRED 2026-07-21
// when identity assurance moved to the payout rail's own KYC (see git
// history) -- it sat as a harmless no-op since then, with a comment flagging
// it as a "FOLLOW-UP CANDIDATE... repurpose this slot as a payout-SETUP
// reminder ladder". This is that repurposing, extended to also cover the
// next gap in the same funnel: a seller whose payout IS set up but who has
// never listed a product.
//
// Researched how Etsy/Amazon/eBay/Depop/Poshmark/Faire handle this before
// building it (William approved the approach): NONE of them suspend or
// remove a seller purely for never listing in the early weeks -- Etsy
// avoids the state entirely by requiring a first listing before a shop can
// even open, and the others either charge a standing fee that self-selects
// dormant sellers out (Amazon) or simply keep nudging. William's explicit
// decision here: nudge indefinitely, no penalty, no auto-suspension --
// closest to the Etsy/Faire model of reducing friction and reminding,
// never the punitive end of the spectrum.
//
// A seller lands in exactly one of two states at a time, never both:
//   1. Payout not yet set up (STRIPE-rail, not stripeOnboarded) -- they are
//      blocked from reaching Products at all by middleware.ts's payout
//      gate, so the reminder is "finish payout setup", not "list a
//      product". PAYONEER-rail sellers are exempt from that gate (see
//      lib/payoutGateCookie.ts's payoutGateSatisfied) and go straight to
//      stage 2.
//   2. Payout satisfied but zero products -- "list your first product".
// The moment a seller has ANY product row, this query's `products: { none:
// {} }` filter excludes them for good -- no further reminders, no need to
// track a separate "done" flag.
//
// Cadence: day 3 / 7 / 14 since Seller.createdAt (i.e. since approval --
// provisionSeller.ts creates the Seller row at approval time), then every
// 30 days indefinitely. Driven by activationRemindersSent (a count, not a
// calendar check) so this is safe to run hourly without double-sending --
// see nextThresholdDays below.
const REMINDER_DAY_THRESHOLDS = [3, 7, 14]
const REPEAT_INTERVAL_DAYS = 30
const AGENT = 'seller-activation'

function nextThresholdDays(remindersSent: number): number {
  if (remindersSent < REMINDER_DAY_THRESHOLDS.length) {
    return REMINDER_DAY_THRESHOLDS[remindersSent]
  }
  const stepsPastLadder = remindersSent - REMINDER_DAY_THRESHOLDS.length + 1
  return REMINDER_DAY_THRESHOLDS[REMINDER_DAY_THRESHOLDS.length - 1] + REPEAT_INTERVAL_DAYS * stepsPastLadder
}

function daysSince(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / 86_400_000
}

export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError

  const now = new Date()

  const candidates = await prisma.seller.findMany({
    where: {
      approved: true,
      rejectedAt: null,
      suspendedAt: null,
      products: { none: {} },
    },
    select: {
      id: true,
      storeName: true,
      createdAt: true,
      activationRemindersSent: true,
      payoutRail: true,
      stripeOnboarded: true,
      user: { select: { email: true, name: true } },
    },
  })

  let payoutSetupSent = 0
  let firstListingSent = 0
  const errors: string[] = []

  for (const seller of candidates) {
    const days = daysSince(seller.createdAt, now)
    const dueAt = nextThresholdDays(seller.activationRemindersSent)
    if (days < dueAt) continue

    const payoutDone = payoutGateSatisfied(seller.payoutRail, seller.stripeOnboarded)
    const contactName = seller.user.name || seller.storeName

    try {
      if (!payoutDone) {
        const setupUrl = seller.payoutRail === 'PAYONEER'
          ? 'https://velorcommerce.store/dashboard/payoneer'
          : 'https://velorcommerce.store/dashboard/stripe-connect'
        const { subject, html } = buildPayoutSetupReminderEmail({
          contactName,
          storeName: seller.storeName,
          setupUrl,
        })
        await sendEmail({ to: seller.user.email, subject, html, headers: UNSUBSCRIBE_HEADERS })
        payoutSetupSent++
      } else {
        const { subject, html } = buildFirstListingReminderEmail({
          contactName,
          storeName: seller.storeName,
        })
        await sendEmail({ to: seller.user.email, subject, html, headers: UNSUBSCRIBE_HEADERS })
        firstListingSent++
      }

      await prisma.seller.update({
        where: { id: seller.id },
        data: {
          activationRemindersSent: { increment: 1 },
          activationReminderLastSentAt: now,
        },
      })
    } catch (err) {
      errors.push(`${seller.id}: ${err instanceof Error ? err.message : 'error'}`)
    }
  }

  await prisma.agentLog
    .create({
      data: {
        agentName: AGENT,
        action: 'activation_reminders',
        status: errors.length === 0 ? 'success' : 'partial',
        details: {
          scanned: candidates.length,
          payoutSetupSent,
          firstListingSent,
          errorCount: errors.length,
          errors: errors.slice(0, 10).join(' | '),
        },
      },
    })
    .catch(() => {})

  return NextResponse.json({
    ok: true,
    scanned: candidates.length,
    payoutSetupSent,
    firstListingSent,
    errors,
  })
}
