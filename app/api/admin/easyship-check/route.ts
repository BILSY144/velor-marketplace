import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { getEasyshipRates, isEasyshipEnabled, toEasyshipAddress } from '@/lib/easyship'

// Read-only Easyship diagnostic (2026-07-28). Two jobs:
//  (a) prove the EASYSHIP_API_KEY works and the request/response shapes in
//      lib/easyship.ts are correct against the LIVE API (per the standing
//      verify-before-relying rule) -- Easyship 422s name offending fields;
//  (b) probe origin coverage lane by lane for William's "add all countries
//      possible" directive: call with ?origin=CC to see whether an origin
//      country returns real rates, and which couriers/prices.
//
// GET /api/admin/easyship-check                -> enabled check only
// GET /api/admin/easyship-check?origin=GB      -> rates probe GB -> US (default dest)
// GET /api/admin/easyship-check?origin=HK&dest=GB&grams=200 -> custom probe
// Never mutates anything; never purchases.

const PROBE_ADDRESSES: Record<string, { line1: string; city: string; state?: string; zip: string | null }> = {
  GB: { line1: '49 Station Road', city: 'Polegate', zip: 'BN26 6EA' },
  US: { line1: '350 5th Ave', city: 'New York', state: 'NY', zip: '10118' },
  HK: { line1: '1 Harbour Rd', city: 'Wan Chai', zip: null },
  AU: { line1: '100 George St', city: 'Sydney', state: 'NSW', zip: '2000' },
  CA: { line1: '100 King St W', city: 'Toronto', state: 'ON', zip: 'M5X 1A9' },
  DE: { line1: 'Unter den Linden 1', city: 'Berlin', zip: '10117' },
  FR: { line1: '1 Rue de Rivoli', city: 'Paris', zip: '75001' },
  ES: { line1: 'Gran Via 1', city: 'Madrid', zip: '28013' },
  IT: { line1: 'Via del Corso 1', city: 'Roma', zip: '00186' },
  NL: { line1: 'Damrak 1', city: 'Amsterdam', zip: '1012 LG' },
  SG: { line1: '1 Raffles Place', city: 'Singapore', zip: '048616' },
  JP: { line1: '1-1 Chiyoda', city: 'Tokyo', state: 'Tokyo', zip: '100-0001' },
  IN: { line1: '1 MG Road', city: 'Bengaluru', state: 'Karnataka', zip: '560001' },
  NZ: { line1: '1 Queen St', city: 'Auckland', zip: '1010' },
  IE: { line1: '1 O Connell St', city: 'Dublin', zip: 'D01 F5P2' },
  MX: { line1: 'Av Juarez 1', city: 'Ciudad de Mexico', state: 'CDMX', zip: '06000' },
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isEasyshipEnabled()) {
    return NextResponse.json({ enabled: false, note: 'EASYSHIP_API_KEY not set in this environment' })
  }

  const { searchParams } = new URL(request.url)
  const origin = (searchParams.get('origin') || '').toUpperCase()
  if (!origin) {
    return NextResponse.json({ enabled: true, note: 'pass ?origin=GB (and optional &dest=US&grams=200) to probe rates' })
  }
  const dest = (searchParams.get('dest') || 'US').toUpperCase()
  const grams = Math.max(1, Number(searchParams.get('grams') || 200))

  const o = PROBE_ADDRESSES[origin] ?? { line1: '1 Main Street', city: 'City', zip: null }
  const d = PROBE_ADDRESSES[dest] ?? { line1: '1 Main Street', city: 'City', zip: null }

  const rates = await getEasyshipRates({
    originAddress: toEasyshipAddress({
      name: 'Velor Probe', street1: o.line1, city: o.city, state: o.state ?? '',
      zip: o.zip, country: origin, email: 'customerservice@velorcommerce.co.uk',
    }),
    destinationAddress: toEasyshipAddress({
      name: 'Velor Probe', street1: d.line1, city: d.city, state: d.state ?? '',
      zip: d.zip, country: dest, email: 'customerservice@velorcommerce.co.uk',
    }),
    totalWeightKg: grams / 1000,
    boxCm: { length: 20, width: 15, height: 10 },
    items: [{
      quantity: 1,
      description: 'Handmade cultural goods',
      declared_currency: 'GBP',
      declared_customs_value: 25,
    }],
  })

  return NextResponse.json({
    enabled: true,
    origin, dest, grams,
    rateCount: rates.length,
    rates: rates
      .map((r) => ({
        courier: r.courier_service?.name,
        courierServiceId: r.courier_service?.id,
        totalCharge: r.total_charge,
        currency: r.currency,
        minDays: r.min_delivery_time,
        maxDays: r.max_delivery_time,
      }))
      .sort((a, b) => Number(a.totalCharge) - Number(b.totalCharge)),
  })
}
