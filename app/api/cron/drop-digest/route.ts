import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCronSecret } from '@/lib/cronAuth'
import { sendEmail } from '@/lib/email'

// Pre-drop digest: runs daily (vercel.json, 15:00 UTC). If a drop opens
// within the next 24h and its digest has not been sent, email every
// opted-in DropDigestSubscriber a preview. One email a week per person
// at most, by construction (digestSentAt latch on the drop).

export const dynamic = 'force-dynamic'

function unsubUrl(email: string): string {
  return 'https://velorcommerce.store/api/drops/subscribe?u=' + Buffer.from(email, 'utf8').toString('base64url')
}

export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError
  if (process.env.VELOR_SOCIAL_ENABLED === 'false') return NextResponse.json({ ok: true, skipped: 'social disabled' })

  const now = new Date()
  const drop = await prisma.drop.findFirst({
    where: { digestSentAt: null, scheduledAt: { gte: now, lte: new Date(now.getTime() + 24 * 3600 * 1000) } },
    orderBy: { scheduledAt: 'asc' },
  })
  if (!drop) return NextResponse.json({ ok: true, skipped: 'no drop opening in the next 24h' })

  const items = await prisma.dropItem.findMany({
    where: { dropId: drop.id, product: { status: 'APPROVED' } },
    select: { product: { select: { id: true, title: true, images: true, seller: { select: { storeName: true } } } } },
    orderBy: { createdAt: 'asc' },
    take: 6,
  })
  const subscribers = await prisma.dropDigestSubscriber.findMany({ select: { email: true }, take: 2000 })
  if (subscribers.length === 0) return NextResponse.json({ ok: true, skipped: 'no subscribers yet' })

  const when = drop.scheduledAt.toUTCString().replace(':00:00 GMT', ':00 UTC')
  const cards = items.map(i => {
    const img = i.product.images[0] ? '<img src="' + i.product.images[0] + '" width="260" style="display:block;width:260px;height:200px;object-fit:cover;border-radius:8px" alt=""/>' : ''
    return '<td style="padding:8px;vertical-align:top"><a href="https://velorcommerce.store/shop/' + i.product.id + '" style="text-decoration:none;color:#111">' + img + '<p style="margin:8px 0 0 0;font-size:14px;font-weight:600">' + i.product.title + '</p><p style="margin:2px 0 0 0;font-size:12px;color:#666">' + i.product.seller.storeName + '</p></a></td>'
  }).join('')
  let sent = 0
  const errors: string[] = []
  for (const s of subscribers) {
    const html = [
      '<div style="background:#FF6B00;padding:24px 32px"><h1 style="margin:0;font-size:22px;font-weight:800;color:#FFF;letter-spacing:0.1em">VELOR</h1></div>',
      '<div style="padding:28px 32px;background:#FFF;font-family:sans-serif">',
      '<h2 style="margin:0 0 6px 0;font-size:20px">Fresh from the Workshop</h2>',
      '<p style="margin:0 0 16px 0;font-size:14px;color:#444">The weekly drop opens ' + when + '. New pieces from real makers, live for 48 hours.</p>',
      '<table style="border-collapse:collapse"><tr>' + cards + '</tr></table>',
      '<p style="margin:20px 0 0 0"><a href="https://velorcommerce.store/drops" style="display:inline-block;background:#FF6B00;color:#FFF;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px;text-decoration:none">See the drop</a></p>',
      '<p style="margin:24px 0 0 0;font-size:12px;color:#999">One email a week, only when a drop opens. <a href="' + unsubUrl(s.email) + '" style="color:#999">Unsubscribe</a></p>',
      '</div>',
    ].join('')
    try {
      await sendEmail({ to: s.email, subject: 'Fresh from the Workshop -- this week\'s drop opens soon', html })
      sent++
    } catch (err) {
      errors.push(s.email + ': ' + (err instanceof Error ? err.message : 'error'))
    }
  }
  await prisma.drop.update({ where: { id: drop.id }, data: { digestSentAt: new Date() } })
  return NextResponse.json({ ok: true, dropId: drop.id, sent, errors: errors.slice(0, 5) })
}
