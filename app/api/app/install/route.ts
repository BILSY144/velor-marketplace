import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// First-launch / cold-start ping from the mobile app. The app generates an
// anonymous random installId (no device identifier, no personal data) and
// calls this on every cold start: the first ping creates the row (an
// "activated install" -- someone actually opened the app, which is the
// number that matters more than store downloads), later pings bump
// lastSeenAt and refresh mutable fields, giving Pulse honest DAU/WAU.
// Country comes from Vercel's geo header server-side, identical to how
// PageView records it. Idempotent by design; the unique constraint dedupes.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const str = (v: unknown, max: number) =>
    typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null

  const installId = str(body.installId, 64)
  if (!installId || !/^[A-Za-z0-9_-]{8,64}$/.test(installId)) {
    return NextResponse.json({ error: 'Invalid installId' }, { status: 400 })
  }

  const platform = str(body.platform, 16) ?? 'unknown'
  const osVersion = str(body.osVersion, 32)
  const appVersion = str(body.appVersion, 32)
  const language = str(body.language, 8)
  const currency = str(body.currency, 8)
  const country = req.headers.get('x-vercel-ip-country')

  const mutable = { platform, osVersion, appVersion, language, currency, lastSeenAt: new Date() }
  await prisma.appInstall.upsert({
    where: { installId },
    update: { ...mutable, ...(country ? { country } : {}) },
    create: { installId, country, ...mutable },
  })

  return NextResponse.json({ ok: true })
}
