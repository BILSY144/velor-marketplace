import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { sendEmail } from '@/lib/email'

// One-shot announcement to every APPROVED seller: the Maker Journal
// studio is live (William, 2026-07-30: "email all sellers and let them
// know that they now have the opportunatey to create their profiles and
// that there are placeholder images and text but once they add to it it
// will replace placeholders").
//
// POST {dryRun: true}  -> returns the recipient list + subject, sends nothing
// POST {}              -> sends for real, one email per approved seller
// Safe to re-run only intentionally -- there is no built-in dedupe latch,
// so run it once. Admin-gated (Pulse Bearer token or admin session).

const SUBJECT = 'Your Maker Journal is ready — tell your story on Velor'

function buildHtml(storeName: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://velorcommerce.store'
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1d;line-height:1.6;">
    <p style="font-size:15px;">Hello ${storeName},</p>
    <p style="font-size:15px;"><b>Your Maker Journal is now open.</b> It is your own page on Velor where buyers follow the story behind your work &mdash; your process, your materials, your workshop.</p>
    <p style="font-size:15px;">From your dashboard you can now:</p>
    <p style="font-size:15px;margin-left:14px;">
      &bull; Write journal entries with photos and a video link<br />
      &bull; Save drafts or schedule entries to publish later<br />
      &bull; Tag up to four of your listings so readers can buy them<br />
      &bull; See real numbers &mdash; views, likes, comments, product clicks and sales<br />
      &bull; Press <b>View as buyer</b> to see your journal exactly as buyers do
    </p>
    <p style="font-size:15px;">Right now your journal page shows <b>example images and text as placeholders</b>. The moment you add your own entries, your real story replaces them &mdash; piece by piece, it becomes fully yours.</p>
    <p style="margin:24px 0;">
      <a href="${base}/dashboard/journal" style="background:#FF6B00;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:bold;font-size:15px;display:inline-block;">Open your Creator Journals</a>
    </p>
    <p style="font-size:13.5px;color:#6b6b74;">Buyers arrive soon &mdash; makers with a living journal are the first faces they will see in The Makers&rsquo; Circle.</p>
    <p style="font-size:13.5px;color:#6b6b74;">Questions? Just reply to this email.</p>
    <p style="font-size:13.5px;color:#6b6b74;">&mdash; The Velor team<br />velorcommerce.store</p>
  </div>`
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const dryRun = Boolean(body?.dryRun)

  const sellers = await prisma.seller.findMany({
    where: { approved: true },
    select: { id: true, storeName: true, user: { select: { email: true } } },
  })
  const recipients = sellers.filter((s) => s.user?.email)

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      subject: SUBJECT,
      count: recipients.length,
      recipients: recipients.map((s) => ({ store: s.storeName, email: s.user!.email })),
    })
  }

  const sent: string[] = []
  const failed: { email: string; error: string }[] = []
  for (const s of recipients) {
    try {
      await sendEmail({ to: s.user!.email!, subject: SUBJECT, html: buildHtml(s.storeName) })
      sent.push(s.user!.email!)
    } catch (e) {
      failed.push({ email: s.user!.email!, error: e instanceof Error ? e.message : 'send failed' })
    }
  }

  await prisma.agentLog.create({
    data: {
      agentName: 'journal-announce',
      action: 'announce_journals_email',
      status: failed.length === 0 ? 'success' : 'partial',
      details: { sent: sent.length, failed },
    },
  }).catch(() => {})

  return NextResponse.json({ sent: sent.length, failed })
}
