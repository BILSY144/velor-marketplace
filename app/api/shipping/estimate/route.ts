import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { weightBandFor } from '@/lib/shipping-zones'

// PDP delivery estimate (2026-07-29, William's Amazon-comparison direction:
// live shipping cost + arrival estimate with a deliver-to picker, right on
// the product page).
//
// GET /api/shipping/estimate?productId=...&country=CC
//
// - country omitted -> resolved from the visitor's x-vercel-ip-country
//   header (falls back to GB) and RETURNED, so the client can initialise
//   its picker without a separate geo endpoint.
// - Quotes come from a self-call to POST /api/shipping/rates -- the exact
//   engine checkout uses (live Shippo/Easyship, seller flat rate, platform
//   default, seller buffer, per-item admin fee all included), with the same
//   blank-city representative destination address the 247-country rate
//   survey proved works. The PDP number can therefore never drift from the
//   checkout number for the same lane.
// - Cached in ShippingEstimate per (seller, destination country, weight
//   band) for 24h so product-page traffic never hammers carrier APIs. On a
//   re-quote failure the stale row is served rather than nothing.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function isEstimateTier(rateId: string): boolean {
  return rateId === 'seller-flat-rate' || rateId === 'platform-default-rate' || rateId === 'pending-standard'
}

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('productId') || ''
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

    let country = (request.nextUrl.searchParams.get('country') || '').toUpperCase()
    if (!/^[A-Z]{2}$/.test(country)) {
      const ipCountry = (request.headers.get('x-vercel-ip-country') || '').toUpperCase()
      country = /^[A-Z]{2}$/.test(ipCountry) ? ipCountry : 'GB'
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true, title: true, price: true, weightGrams: true, sellerId: true,
        status: true,
      },
    })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const band = weightBandFor(product.weightGrams ?? 450)

    // 1) Fresh cache hit -- the normal, fast path.
    const cached = await prisma.shippingEstimate.findUnique({
      where: { sellerId_destCountry_weightBandMinGrams: { sellerId: product.sellerId, destCountry: country, weightBandMinGrams: band.minGrams } },
    })
    if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS) {
      return NextResponse.json({
        country,
        available: true,
        amountGBP: cached.amountGBP,
        carrier: cached.carrier,
        service: cached.service,
        estimatedDays: cached.estimatedDays,
        isEstimate: cached.isEstimate,
        cached: true,
      })
    }

    // 2) Live quote through the real checkout rates engine (self-call).
    let best: { amountGBP: number; carrier: string; service: string; estimatedDays: number | null; isEstimate: boolean } | null = null
    try {
      const res = await fetch(new URL('/api/shipping/rates', request.nextUrl.origin), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: [{ productId: product.id, sellerId: product.sellerId, quantity: 1, price: product.price, name: product.title }],
          // Same minimal representative shape the rate survey proved fine
          // across 247 destination countries -- country is what matters.
          shippingAddress: { name: 'Velor Marketplace Buyer', street1: '1 Main Street', city: '', zip: '', country },
        }),
        // The rates engine can take a while on cold carrier calls.
        signal: AbortSignal.timeout(45000),
      })
      if (res.ok) {
        const data = await res.json()
        const rates: Array<{ rateId: string; carrier: string; service: string; amount: string; amountGBP?: string; estimatedDays: number | null; isFallback: boolean }> =
          data?.sellerGroups?.[0]?.rates ?? []
        const real = rates.filter(r => !r.isFallback)
        if (real.length) {
          const sorted = [...real].sort((a, b) => parseFloat(a.amountGBP ?? a.amount) - parseFloat(b.amountGBP ?? b.amount))
          const b0 = sorted[0]
          best = {
            amountGBP: parseFloat(b0.amountGBP ?? b0.amount),
            carrier: b0.carrier,
            service: b0.service,
            estimatedDays: b0.estimatedDays,
            isEstimate: isEstimateTier(b0.rateId) || b0.estimatedDays == null,
          }
        }
      }
    } catch (err) {
      console.error('[shipping/estimate] live quote failed', productId, country, err)
    }

    if (best && Number.isFinite(best.amountGBP)) {
      await prisma.shippingEstimate.upsert({
        where: { sellerId_destCountry_weightBandMinGrams: { sellerId: product.sellerId, destCountry: country, weightBandMinGrams: band.minGrams } },
        create: {
          sellerId: product.sellerId, destCountry: country, weightBandMinGrams: band.minGrams,
          amountGBP: best.amountGBP, carrier: best.carrier, service: best.service,
          estimatedDays: best.estimatedDays, isEstimate: best.isEstimate,
        },
        update: {
          amountGBP: best.amountGBP, carrier: best.carrier, service: best.service,
          estimatedDays: best.estimatedDays, isEstimate: best.isEstimate,
        },
      }).catch((e) => console.error('[shipping/estimate] cache write failed', e))
      return NextResponse.json({
        country,
        available: true,
        amountGBP: best.amountGBP,
        carrier: best.carrier,
        service: best.service,
        estimatedDays: best.estimatedDays,
        isEstimate: best.isEstimate,
        cached: false,
      })
    }

    // 3) Quote failed this time -- serve the stale cache honestly rather
    //    than nothing, else admit there's no number for this lane yet.
    if (cached) {
      return NextResponse.json({
        country,
        available: true,
        amountGBP: cached.amountGBP,
        carrier: cached.carrier,
        service: cached.service,
        estimatedDays: cached.estimatedDays,
        isEstimate: true,
        cached: true,
      })
    }
    return NextResponse.json({ country, available: false })
  } catch (err) {
    console.error('[shipping/estimate]', err)
    return NextResponse.json({ error: 'Estimate failed' }, { status: 500 })
  }
}
