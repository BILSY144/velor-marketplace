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
  // Broader origin sweep (2026-07-28, William: "what about the rest of the
  // country sellers") -- plausible real addresses; state populated where
  // Easyship mandates content (CN/ID/MX/MY/TH/VN + AU/CA/US already above).
  CN: { line1: '1 Chouzhou North Rd', city: 'Yiwu', state: 'Zhejiang', zip: '322000' },
  TH: { line1: '1 Sukhumvit Rd', city: 'Bangkok', state: 'Bangkok', zip: '10110' },
  VN: { line1: '1 Trang Tien', city: 'Hanoi', state: 'Ha Noi', zip: '100000' },
  ID: { line1: 'Jl Thamrin 1', city: 'Jakarta', state: 'DKI Jakarta', zip: '10310' },
  MY: { line1: '1 Jalan Ampang', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan Kuala Lumpur', zip: '50450' },
  PH: { line1: '1 Ayala Ave', city: 'Makati', zip: '1226' },
  KR: { line1: '1 Sejong-daero', city: 'Seoul', zip: '04524' },
  TW: { line1: '1 Xinyi Rd', city: 'Taipei', zip: '110' },
  TR: { line1: 'Istiklal Cd 1', city: 'Istanbul', zip: '34430' },
  PL: { line1: 'Nowy Swiat 1', city: 'Warszawa', zip: '00-496' },
  PT: { line1: 'Rua Augusta 1', city: 'Lisboa', zip: '1100-053' },
  CZ: { line1: 'Vaclavske namesti 1', city: 'Praha', zip: '110 00' },
  GR: { line1: 'Ermou 1', city: 'Athina', zip: '105 63' },
  RO: { line1: 'Calea Victoriei 1', city: 'Bucuresti', zip: '010061' },
  HU: { line1: 'Vaci utca 1', city: 'Budapest', zip: '1052' },
  AT: { line1: 'Graben 1', city: 'Wien', zip: '1010' },
  BE: { line1: 'Rue Neuve 1', city: 'Bruxelles', zip: '1000' },
  CH: { line1: 'Bahnhofstrasse 1', city: 'Zurich', zip: '8001' },
  SE: { line1: 'Drottninggatan 1', city: 'Stockholm', zip: '111 51' },
  DK: { line1: 'Stroget 1', city: 'Kobenhavn', zip: '1160' },
  NO: { line1: 'Karl Johans gate 1', city: 'Oslo', zip: '0154' },
  FI: { line1: 'Aleksanterinkatu 1', city: 'Helsinki', zip: '00100' },
  ZA: { line1: '1 Long St', city: 'Cape Town', zip: '8001' },
  EG: { line1: '1 Talaat Harb St', city: 'Cairo', zip: '11511' },
  MA: { line1: '1 Avenue Mohammed V', city: 'Casablanca', zip: '20000' },
  KE: { line1: '1 Kenyatta Ave', city: 'Nairobi', zip: '00100' },
  NG: { line1: '1 Broad St', city: 'Lagos', zip: '101233' },
  GH: { line1: '1 High St', city: 'Accra', zip: 'GA000' },
  BR: { line1: 'Av Paulista 1', city: 'Sao Paulo', state: 'SP', zip: '01310-100' },
  AR: { line1: 'Av de Mayo 1', city: 'Buenos Aires', zip: 'C1084' },
  CL: { line1: 'Paseo Ahumada 1', city: 'Santiago', zip: '8320000' },
  CO: { line1: 'Carrera 7 1', city: 'Bogota', zip: '110311' },
  PE: { line1: 'Jiron de la Union 1', city: 'Lima', zip: '15001' },
  AE: { line1: '1 Sheikh Zayed Rd', city: 'Dubai', zip: null },
  IL: { line1: '1 Dizengoff St', city: 'Tel Aviv', zip: '6433222' },
  SA: { line1: '1 King Fahd Rd', city: 'Riyadh', zip: '12271' },
  PK: { line1: '1 Mall Rd', city: 'Lahore', zip: '54000' },
  BD: { line1: '1 Gulshan Ave', city: 'Dhaka', zip: '1212' },
  LK: { line1: '1 Galle Rd', city: 'Colombo', zip: '00300' },
  NP: { line1: '1 Durbar Marg', city: 'Kathmandu', zip: '44600' },
  UA: { line1: 'Khreshchatyk 1', city: 'Kyiv', zip: '01001' },
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isEasyshipEnabled()) {
    return NextResponse.json({ enabled: false, note: 'EASYSHIP_API_KEY not set in this environment' })
  }

  // Config visibility (added 2026-07-28 to verify activation env vars took
  // effect without exposing any secret values).
  const configuredOrigins = (process.env.EASYSHIP_ORIGINS || '')
    .split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
  const webhookSecretConfigured = !!process.env.EASYSHIP_WEBHOOK_SECRET
  const easyshipForceActive = process.env.EASYSHIP_FORCE === '1'

  const { searchParams } = new URL(request.url)
  const origin = (searchParams.get('origin') || '').toUpperCase()
  if (!origin) {
    return NextResponse.json({
      enabled: true,
      configuredOrigins,
      webhookSecretConfigured,
      easyshipForceActive,
      note: 'pass ?origin=GB (and optional &dest=US&grams=200) to probe rates',
    })
  }
  const dest = (searchParams.get('dest') || 'US').toUpperCase()
  const grams = Math.max(1, Number(searchParams.get('grams') || 200))

  const o = PROBE_ADDRESSES[origin] ?? { line1: '1 Main Street', city: 'City', zip: null }
  const d = PROBE_ADDRESSES[dest] ?? { line1: '1 Main Street', city: 'City', zip: null }

  const rates = await getEasyshipRates({
    originAddress: toEasyshipAddress({
      name: 'Velor Probe', street1: o.line1, city: o.city, state: o.state ?? '',
      zip: o.zip, country: origin, email: 'customerservice@velorglobalmarket.com',
    }),
    destinationAddress: toEasyshipAddress({
      name: 'Velor Probe', street1: d.line1, city: d.city, state: d.state ?? '',
      zip: d.zip, country: dest, email: 'customerservice@velorglobalmarket.com',
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
