import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { isPayoneerConfigured, getRegistrationLink } from '@/lib/payoneer'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// One-off (and safely re-runnable) activation job for sellers who were
// already resolved onto the PAYONEER payout rail (lib/payoutRail.ts, by
// country) before Payoneer's Mass Payouts partner application was approved.
// Those sellers only ever got the "being set up" holding message from
// POST /api/payoneer/onboard (that route short-circuits to an AgentLog
// interest record while !isPayoneerConfigured()), so they were never
// actually issued a real Payoneer registration link. Their earnings have
// been accruing safely in platform escrow the whole time (release-payouts'
// heldForPayoneer bucket) -- nothing was lost, they just cannot be paid
// until each one completes Payoneer's own hosted bank/ID registration.
//
// Trigger this ONCE, by hand (POST with the ADMIN_SECRET bearer header),
// the same day PAYONEER_CLIENT_ID/SECRET/PROGRAM_ID/API_BASE are added to
// Vercel and sandbox-verified per docs/PAYONEER_SETUP.md. Safe to re-run
// any time after that too: it only ever selects sellers who still have no
// payoneerPayeeId, and a successful send sets that field, so an
// already-activated seller is never re-emailed or double-charged an
// activation attempt.
export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPayoneerConfigured()) {
    return NextResponse.json(
      {
        error:
          'Payoneer is not configured yet -- add PAYONEER_CLIENT_ID, PAYONEER_CLIENT_SECRET, ' +
          'PAYONEER_PROGRAM_ID and PAYONEER_API_BASE in Vercel first, then sandbox-verify per ' +
          'docs/PAYONEER_SETUP.md before running this against real sellers.',
      },
      { status: 400 }
    )
  }

  const sellers = await prisma.seller.findMany({
    where: { approved: true, payoutRail: 'PAYONEER', payoneerPayeeId: null },
    select: {
      id: true,
      storeName: true,
      country: true,
      user: { select: { email: true, name: true } },
    },
  })

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://velorcommerce.store'
  let activated = 0
  let failed = 0
  const errors: Array<{ sellerId: string; error: string }> = []

  for (const seller of sellers) {
    try {
      if (!seller.user?.email) {
        throw new Error('no account email on file')
      }

      const { registrationLink } = await getRegistrationLink({
        payeeId: seller.id,
        redirectUrl: base + '/dashboard/payoneer',
      })

      // Set immediately after a registration link is issued, mirroring the
      // same-session self-serve flow in POST /api/payoneer/onboard -- the
      // link is what actually gates real money movement (release-payouts
      // will attempt, fail safely, and retry against a payee who has not
      // yet finished Payoneer's own hosted verification), so marking the
      // seller as issued a link here does not itself risk a bad payout.
      await prisma.seller.update({
        where: { id: seller.id },
        data: { payoneerPayeeId: seller.id },
      })

      await sendEmail({
        to: seller.user.email,
        subject: 'Your Velor payouts are ready to activate',
        html: buildActivationEmail({
          name: seller.user.name || seller.storeName,
          storeName: seller.storeName,
          registrationLink,
        }),
        from: 'Velor Seller Team <sellers@velorcommerce.store>',
      })

      await prisma.agentLog.create({
        data: {
          agentName: 'payoneer-onboarding',
          action: 'activation-email-sent',
          status: 'success',
          details: { sellerId: seller.id, email: seller.user.email, country: seller.country },
        },
      })

      activated++
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : 'unknown error'
      errors.push({ sellerId: seller.id, error: message })
      await prisma.agentLog.create({
        data: {
          agentName: 'payoneer-onboarding',
          action: 'activation-email-failed',
          status: 'error',
          details: { sellerId: seller.id, error: message },
        },
      })
    }
  }

  return NextResponse.json({ ok: true, candidates: sellers.length, activated, failed, errors })
}

function buildActivationEmail(params: { name: string; storeName: string; registrationLink: string }): string {
  const { name, storeName, registrationLink } = params
  return `
    <div style="background:#0D0D0D;padding:32px 24px;font-family:Inter,Arial,sans-serif">
      <div style="max-width:520px;margin:0 auto;background:#161616;border-radius:8px;padding:32px">
        <h2 style="color:#FFF;font-size:22px;margin:0 0 16px">Your payouts are ready to activate</h2>
        <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 16px">
          Hi ${name}, good news for <strong style="color:#FFF">${storeName}</strong> -- Payoneer
          payouts are now live for your country. Your earnings so far have been held safely in
          escrow the whole time; nothing has been lost.
        </p>
        <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 20px">
          One step left: complete your bank and ID details directly with Payoneer (Velor never
          sees or stores these details). Once that's done, your held earnings release
          automatically on our next payout run.
        </p>
        <p style="margin:0 0 24px">
          <a href="${registrationLink}" style="display:inline-block;background:#FF6B00;color:#FFF;
            text-decoration:none;font-weight:600;padding:12px 24px;border-radius:6px;font-size:15px">
            Complete your Payoneer setup
          </a>
        </p>
        <p style="color:#777;font-size:13px;line-height:1.6">
          Questions? Write to customerservice@velorcommerce.co.uk.
        </p>
      </div>
    </div>`
}
