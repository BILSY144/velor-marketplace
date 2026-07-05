import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Internal QA tool only - lets the site owner flip a seller's tier directly,
// bypassing Stripe, so tier-gated pages/features can be reviewed without paying.
// Protected by CRON_SECRET (already set in Vercel). Never share this URL.
// force-dynamic: without this, Next.js can cache this GET handler's response
// at build/edge time and serve the same frozen output to every request,
// ignoring query params entirely.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  const envSecret = process.env.CRON_SECRET
  if (!envSecret || secret !== envSecret) {
    return NextResponse.json({
      error: 'Unauthorized',
      debug: {
        envIsSet: !!envSecret,
        envLength: envSecret ? envSecret.length : 0,
        givenLength: secret ? secret.length : 0,
        envFirst6: envSecret ? envSecret.slice(0, 6) : null,
        givenFirst6: secret ? secret.slice(0, 6) : null,
        envLast6: envSecret ? envSecret.slice(-6) : null,
        givenLast6: secret ? secret.slice(-6) : null,
        buildTag: 'debug-v2-dynamic',
      },
    }, { status: 401 })
  }

  const email = searchParams.get('email')
  const tier = searchParams.get('tier')
  const validTiers = ['STARTER', 'PRO', 'ENTERPRISE']
  if (!email || !tier || !validTiers.includes(tier)) {
    return NextResponse.json({ error: 'Provide email and tier (STARTER|PRO|ENTERPRISE)' }, { status: 400 })
  }

  const seller = await prisma.seller.findFirst({
    where: { user: { email } },
    include: { user: { select: { email: true } } },
  })
  if (!seller) {
    return NextResponse.json({ error: 'No seller found for that email' }, { status: 404 })
  }

  const updated = await prisma.seller.update({
    where: { id: seller.id },
    data: { tier: tier as any },
  })

  return NextResponse.json({ ok: true, email: seller.user.email, tier: updated.tier })
}
