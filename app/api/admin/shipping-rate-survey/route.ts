import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import {
  createShippoShipment, ShippoAddress, ShippoCustomsItem, ShippoParcel,
} from '@/lib/shippo'
import { computeZone, WEIGHT_BANDS } from '@/lib/shipping-zones'
import { convert } from '@/lib/fx'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// One-off calibration survey (2026-07-27) -- gathers REAL live Shippo quotes
// across every destination country and weight band, from whichever origins
// actually have live carrier coverage, to build the calibrated base for
// PlatformShippingRate (the platform-default estimate used at checkout when
// neither a live per-order quote nor a seller flat rate is available -- see
// flatRateOrFallback() in app/api/shipping/rates/route.ts).
//
// Intentionally self-discovering rather than assuming which origins have
// live coverage: an origin/destination/weight combo that returns zero rates
// from Shippo just contributes no data point (counted in `failed`), it
// doesn't throw. Call repeatedly with different destination batches (this
// endpoint is stateless/idempotent per batch) to cover the full country
// list without hitting a single invocation's time limit -- results
// accumulate in ShippingRateBenchmark and PlatformShippingRate across calls.
//
// This is NOT called by any user-facing flow. Admin/internal use only.

const CONCURRENCY = 8

// Real city/zip/state for candidate ORIGIN countries only (2026-07-27 fix --
// a blank city/zip silently failed carrier-side address validation for
// several origins during a live spot-check, making them look like "no
// carrier coverage" when the real issue was an incomplete probe address, not
// an account limitation). Destination side has always used blank city/zip
// and that's fine -- it's only pickup-side rating that needs a real
// city/zip/state to resolve service area and accessorials. Add more entries
// here as new candidate origins are spot-checked.
const REPRESENTATIVE_ORIGIN_ADDRESS: Record<string, { city: string; zip: string; state?: string }> = {
  GB: { city: 'London', zip: 'SW1A 1AA' },
  US: { city: 'New York', zip: '10001', state: 'NY' },
  DE: { city: 'Berlin', zip: '10115' },
  FR: { city: 'Paris', zip: '75001' },
  ES: { city: 'Madrid', zip: '28001' },
  CA: { city: 'Toronto', zip: 'M5H 2N2', state: 'ON' },
  AU: { city: 'Sydney', zip: '2000', state: 'NSW' },
  CN: { city: 'Shenzhen', zip: '518000', state: 'Guangdong' },
  JP: { city: 'Tokyo', zip: '100-0001' },
  IN: { city: 'Mumbai', zip: '400001', state: 'MH' },
  BR: { city: 'Sao Paulo', zip: '01310-100', state: 'SP' },
  IT: { city: 'Rome', zip: '00100' },
  NL: { city: 'Amsterdam', zip: '1011 AB' },
  MX: { city: 'Mexico City', zip: '01000' },
  HK: { city: 'Hong Kong', zip: '999077' },
  SG: { city: 'Singapore', zip: '018956' },
  AE: { city: 'Dubai', zip: '00000' },
  ZA: { city: 'Johannesburg', zip: '2000' },
  KR: { city: 'Seoul', zip: '04524' },
  TR: { city: 'Istanbul', zip: '34000' },
}

// Minimal representative address -- Shippo's rate-shopping only needs enough
// to identify pickup/delivery country; sellers' own real addresses are used
// for actual orders (see app/api/shipping/rates/route.ts). This survey
// exists purely to calibrate the platform-default ESTIMATE, not to quote or
// ship a real parcel. Origin side uses a real city/zip/state where we have
// one on file (see REPRESENTATIVE_ORIGIN_ADDRESS above); destination side
// stays blank -- proven fine across the full 247-country main survey.
function genericAddress(country: string, isOrigin: boolean): ShippoAddress {
  const rep = isOrigin ? REPRESENTATIVE_ORIGIN_ADDRESS[country] : undefined
  return {
    name: isOrigin ? 'Velor Marketplace Seller' : 'Velor Marketplace Buyer',
    street1: '1 Main Street',
    city: rep?.city ?? '',
    zip: rep?.zip ?? '',
    state: rep?.state,
    country,
    phone: '+00 000 000 0000',
    email: 'noreply@velorcommerce.store',
  }
}

async function withConcurrency<T, R>(
  items: T[], limit: number, fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let idx = 0
  async function worker() {
    while (idx < items.length) {
      const i = idx++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

interface ComboResult {
  zone: string
  bandIndex: number
  amountGBP: number
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const origins: string[] =
    Array.isArray(body.origins) && body.origins.length ? body.origins : ['GB']
  const destinations: string[] = Array.isArray(body.destinations) ? body.destinations : []
  const weightBandIndexes: number[] =
    Array.isArray(body.weightBandIndexes) && body.weightBandIndexes.length
      ? body.weightBandIndexes
      : WEIGHT_BANDS.map((_, i) => i)

  if (!destinations.length) {
    return NextResponse.json({ error: 'destinations required' }, { status: 400 })
  }

  const combos: Array<{ origin: string; destination: string; bandIndex: number }> = []
  for (const origin of origins) {
    for (const destination of destinations) {
      if (origin === destination) continue // domestic already covered by the seller's own live quote
      for (const bandIndex of weightBandIndexes) {
        combos.push({ origin, destination, bandIndex })
      }
    }
  }

  let succeeded = 0
  let failed = 0
  const errors: Array<{ origin: string; destination: string; bandIndex: number; error: string }> = []

  const results = await withConcurrency(combos, CONCURRENCY, async ({ origin, destination, bandIndex }) => {
    const band = WEIGHT_BANDS[bandIndex]
    try {
      const parcel: ShippoParcel = {
        length: '20', width: '15', height: '10', distance_unit: 'cm',
        weight: (band.sampleGrams / 1000).toFixed(3), mass_unit: 'kg',
      }
      const customsItems: ShippoCustomsItem[] = [{
        description: 'Merchandise',
        quantity: 1,
        net_weight: (band.sampleGrams / 1000).toFixed(3),
        mass_unit: 'kg',
        value_amount: '25.00',
        value_currency: 'GBP',
        origin_country: origin,
      }]

      const shipment = await createShippoShipment({
        addressFrom: genericAddress(origin, true),
        addressTo: genericAddress(destination, false),
        parcels: [parcel],
        customsItems,
        declaredValue: 25,
        currency: 'GBP',
        isInternational: true,
      })

      const rates = (shipment.rates ?? []).filter(r => r.amount && !isNaN(parseFloat(r.amount)))
      if (!rates.length) {
        failed++
        return null
      }

      // Cheapest live rate -- the estimate should reflect what a seller can
      // actually achieve, not an average pulled up by premium/express options.
      const cheapest = rates.reduce((a, b) => (parseFloat(a.amount) <= parseFloat(b.amount) ? a : b))
      const amountGBP = await convert(parseFloat(cheapest.amount), cheapest.currency || 'USD', 'GBP')
      const zone = computeZone(origin, destination)

      await prisma.shippingRateBenchmark.create({
        data: {
          originCountry: origin, destinationCountry: destination, zone,
          weightGrams: band.sampleGrams, carrier: cheapest.provider ?? 'Unknown',
          service: cheapest.servicelevel?.name ?? 'Standard',
          amountGBP, estimatedDays: cheapest.estimated_days ?? null,
        },
      })

      succeeded++
      return { zone, bandIndex, amountGBP } as ComboResult
    } catch (err) {
      failed++
      errors.push({
        origin, destination, bandIndex,
        error: err instanceof Error ? err.message : String(err),
      })
      return null
    }
  })

  // Re-aggregate every (zone, band) bucket touched by this batch. Idempotent
  // and safe to run repeatedly as later batches add more data points for the
  // same zone -- each call only tightens the estimate.
  const touched = new Set(
    results.filter((r): r is ComboResult => r != null).map(r => `${r.zone}:${r.bandIndex}`)
  )

  for (const key of Array.from(touched)) {
    const [zone, bandIndexStr] = key.split(':')
    const bandIndex = parseInt(bandIndexStr, 10)
    const band = WEIGHT_BANDS[bandIndex]

    const rows: Array<{ amountGBP: number }> = await prisma.shippingRateBenchmark.findMany({
      where: { zone, weightGrams: band.sampleGrams },
      select: { amountGBP: true },
    })
    if (!rows.length) continue

    const sorted = rows.map((r: { amountGBP: number }) => r.amountGBP).sort((a: number, b: number) => a - b)
    // 75th percentile rather than median/mean: the estimate needs to cover
    // MOST real routes in the bucket, not just the typical one -- undershooting
    // (seller loses money on the actual shipment) is the failure mode this
    // whole system exists to prevent.
    const p75Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))
    const baseAmountGBP = sorted[p75Index]

    await prisma.platformShippingRate.upsert({
      where: { zone_weightBandMinGrams: { zone, weightBandMinGrams: band.minGrams } },
      update: { baseAmountGBP, sampleSize: rows.length, lastSurveyedAt: new Date() },
      create: {
        zone, weightBandMinGrams: band.minGrams, weightBandMaxGrams: band.maxGrams,
        baseAmountGBP, sampleSize: rows.length,
      },
    })
  }

  return NextResponse.json({
    requested: combos.length,
    succeeded,
    failed,
    zonesUpdated: Array.from(touched),
    sampleErrors: errors.slice(0, 10),
  })
}

// Read-only status check -- how populated is the platform default table
// right now, broken down by zone/weight band. Used to track survey progress
// across many batched POST calls without needing to inspect the DB directly.
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rates = await prisma.platformShippingRate.findMany({
    orderBy: [{ zone: 'asc' }, { weightBandMinGrams: 'asc' }],
  })
  const benchmarkCount = await prisma.shippingRateBenchmark.count()

  return NextResponse.json({ benchmarkCount, rates })
}
