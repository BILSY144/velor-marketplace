import { NextRequest, NextResponse } from 'next/server'
import { getRateTable, SUPPORTED_CURRENCIES } from '@/lib/fx'

export const dynamic = 'force-dynamic'

// Public endpoint used by the shop/product pages to convert displayed prices
// into whatever currency the buyer has selected. GET /api/fx/rates?base=GBP
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const base = (searchParams.get('base') || 'GBP').toUpperCase()

  if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(base)) {
    return NextResponse.json({ error: 'Unsupported base currency' }, { status: 400 })
  }

  try {
    const rates = await getRateTable(base)
    return NextResponse.json({ base, rates, fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[fx/rates]', err)
    return NextResponse.json({ error: 'Could not fetch exchange rates' }, { status: 502 })
  }
}
