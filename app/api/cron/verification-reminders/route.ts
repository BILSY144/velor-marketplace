import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCronSecret } from '@/lib/cronAuth'
import { createVerificationSession, isIdentityConfigured, isRestrictedForIdentity } from '@/lib/identity'
import { sendEmail } from '@/lib/email'

export const maxDuration = 60

// Verification-urgency cron. Velor is temporarily approving sellers before
// their Stripe Identity check finishes, to keep seller recruitment moving
// while we are short on supply. That gap is only safe because
// app/api/cron/release-payouts/route.ts refuses to release a single payout
// -- on either rail -- to a seller whose Seller.identityVerified is not
// true (see that route). This cron is the other half of the deal: it keeps
// escalating pressure on an approved-but-unverified seller to actually
// finish verification, so the gap closes on its own instead of sellers
// sitting approved-but-unpaid indefinitely.
//
// Escalation ladder, measured in hours since SellerApplication.reviewedAt:
//   24h, 48h, 72h, 120h (5d), 168h (7d)
// verificationRemindersSent tracks how many rungs have fired so far, so each
// threshold sends exactly once no matter how often this cron runs. After the
// final (7-day) reminder, William gets a one-time escalation email instead
// of the seller getting reminder #6, #7, ... forever.
const THRESHOLDS_HOURS = [24, 48, 72, 120, 168]

export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError

  let sent = 0
  let escalated = 0
  let skippedRestricted = 0
  let skippedNoSession = 0

  try {
    const stalled = await prisma.sellerApplication.findMany({
      where: {
        status: 'APPROVED',
        verificationStatus: { in: ['NOT_STARTED', 'PENDING', 'PROCESSING', 'FAILED', 'CANCELED'] },
        reviewedAt: { not: null },
      },
    })

    const now = Date.now()

    for (const app of stalled) {
      if (isRestrictedForIdentity(app.country)) {
        // Stripe Identity cannot verify this jurisdiction at all -- these
        // sellers wait on the Payoneer KYC rail instead. Chasing them with
        // "verify with Stripe" emails would just be wrong, not urgent.
        skippedRestricted++
        continue
      }

      const reviewedAt = app.reviewedAt as Date
      const hoursSince = (now - reviewedAt.getTime()) / (1000 * 60 * 60)
      const alreadySent = app.verificationRemindersSent
      const nextRung = alreadySent + 1 // 1-indexed reminder number due next

      if (nextRung > THRESHOLDS_HOURS.length) continue // ladder already exhausted
      if (hoursSince < THRESHOLDS_HOURS[nextRung - 1]) continue // not due yet

      let verifyUrl: string | null = null
      if (isIdentityConfigured()) {
        try {
          const session = await createVerificationSession(app.id, app.contactEmail)
          verifyUrl = session.url
        } catch {
          // Best-effort -- if Stripe Identity itself is having a bad moment,
          // still send the nudge without a broken link rather than silently
          // skipping this seller's reminder entirely.
          skippedNoSession++
        }
      }

      const daysWaiting = Math.floor(hoursSince / 24)
      const isFinalRung = nextRung === THRESHOLDS_HOURS.length
      const daysLabel = daysWaiting <= 0 ? 'today' : (daysWaiting + ' day' + (daysWaiting === 1 ? '' : 's') + ' ago')

      try {
        await sendEmail({
          to: app.contactEmail,
          from: 'Velor Seller Team <sellers@velorcommerce.store>',
          subject: isFinalRung
            ? ('Action needed: ' + app.businessName + ' still isn\'t verified')
            : ('Reminder: verify ' + app.businessName + ' to receive payouts'),
          html: '<p>Hi ' + app.contactName + ',</p>' +
            '<p>' + app.businessName + ' was approved to sell on Velor ' + daysLabel + ', but your identity verification is not finished yet.</p>' +
            '<p><strong>Payouts are held until verification completes.</strong> You can list and sell products now, but Velor cannot release any money to you until Stripe confirms your identity.</p>' +
            (verifyUrl
              ? '<p><a href="' + verifyUrl + '" style="display:inline-block;background:#FF6B00;color:#000;font-weight:800;text-decoration:none;padding:14px 30px;border-radius:8px;">Verify your identity now</a></p>'
              : '<p>Sign back in to your Velor dashboard to pick up where you left off with verification.</p>') +
            (isFinalRung ? '<p>This is our final automatic reminder. Please complete verification as soon as possible so your sales are not held up.</p>' : ''),
        })
        sent++
      } catch {
        // Best-effort; do not let one failed email stop the run or the
        // reminder count from advancing next hour.
      }

      await prisma.sellerApplication.update({
        where: { id: app.id },
        data: {
          verificationRemindersSent: nextRung,
          verificationReminderLastSentAt: new Date(),
        },
      })

      if (isFinalRung) {
        try {
          await sendEmail({
            to: 'willsinclair144@gmail.com',
            subject: 'Stalled verification: ' + app.businessName + ' (7 days, no payouts released)',
            html: '<p>' + app.businessName + ' (' + app.contactEmail + ') was approved ' + daysWaiting + ' days ago and still has not completed Stripe identity verification, despite 5 automatic reminders.</p>' +
              '<p>No payouts have been released to this seller -- app/api/cron/release-payouts holds their funds until verification finishes -- but you may want to follow up directly or reconsider the approval.</p>',
          })
          escalated++
        } catch {
          // Best-effort.
        }
      }
    }

    return NextResponse.json({ ok: true, scanned: stalled.length, sent, escalated, skippedRestricted, skippedNoSession })
  } catch (err) {
    console.error('[verification-reminders] failed', err)
    return NextResponse.json({ ok: false, error: 'internal error' }, { status: 500 })
  }
}
