import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { sendEmail } from '@/lib/email'

// Sends a "you're welcome to reapply" email to a rejected SellerApplication's
// contactEmail, telling them exactly what was missing. Read+send only --
// does not mutate the application row (status stays REJECTED; the applicant
// reapplies via a fresh submission at /apply, which the review cron picks up
// as its own new PENDING row). Built 2026-07-12 alongside application-lookup,
// same ADMIN_SECRET gate via middleware.ts on /api/admin/*.
export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const id = body?.id
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const application = await prisma.sellerApplication.findUnique({ where: { id } })
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }
  if (!application.contactEmail) {
    return NextResponse.json({ error: 'Application has no contact email' }, { status: 400 })
  }

  const reasonLine = application.rejectionReason
    ? `Your application couldn't be reviewed because: ${application.rejectionReason}`
    : `Your application couldn't be reviewed the first time round.`

  const subject = `You're welcome to reapply to sell on Velor — ${application.businessName}`
  const html = `
    <div style="background:#0D0D0D;padding:32px 24px;font-family:Inter,Arial,sans-serif">
      <div style="max-width:520px;margin:0 auto;background:#161616;border-radius:8px;padding:32px">
        <h2 style="color:#FFF;font-size:22px;margin:0 0 16px">You're welcome to reapply</h2>
        <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 16px">
          Hi ${application.contactName}, thank you again for applying to sell on Velor with
          <strong style="color:#FFF">${application.businessName}</strong>.
        </p>
        <div style="background:#1A1508;border-left:3px solid #FF6B00;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:20px">
          <p style="margin:0;color:#E0B080;font-size:14px;line-height:1.6">${reasonLine}</p>
        </div>
        <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 20px">
          That's the only thing standing between you and a founding-seller slot. Please submit
          a new application with at least 3 clear photos of your products at
          <a href="https://velorcommerce.store/apply" style="color:#FF6B00">velorcommerce.store/apply</a>
          and we'll review it within 24 hours.
        </p>
        <p style="color:#777;font-size:13px;line-height:1.6">
          Questions? Write to customerservice@velorcommerce.co.uk.
        </p>
      </div>
    </div>`

  await sendEmail({
    to: application.contactEmail,
    subject,
    html,
    from: 'Velor Seller Team <sellers@velorcommerce.store>',
  })

  return NextResponse.json({ sent: true, to: application.contactEmail, applicationId: application.id })
}
