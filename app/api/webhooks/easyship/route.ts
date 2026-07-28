import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'
import { createTrack, normalizeCarrierToken } from '@/lib/shippo'

export const dynamic = 'force-dynamic'

// Easyship webhook (2026-07-28). Delivery confirmation for Easyship-bought
// labels flows through the EXISTING Shippo tracks pipeline (the tracking
// number is registered with Shippo's /tracks at purchase time), so this
// route's main job is the async piece Shippo can't see: label generation.
// Easyship label URLs can arrive a little after purchase
// (label_state pending -> generated); when the label.created event lands we
// backfill labelUrl/trackingNumber onto the Shipment row so the seller
// dashboard shows the PDF, and register tracking if purchase-time
// registration had nothing to register yet.
//
// Signature: verified as HMAC-SHA256 of the raw body against
// EASYSHIP_WEBHOOK_SECRET when that env var is set (accepting the common
// signature header spellings). Until the secret is configured in Easyship's
// dashboard + Vercel, events are accepted and logged -- this route only
// ever updates label metadata on shipments Velor itself created, so the
// blast radius of a forged event is a wrong label URL on our own row, but
// set the secret before launch regardless.

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const secret = process.env.EASYSHIP_WEBHOOK_SECRET
  if (secret) {
    const signature =
      request.headers.get('x-easyship-signature') ??
      request.headers.get('x-easyship-hmac-sha256') ??
      request.headers.get('x-signature') ??
      ''
    const expectedHex = createHmac('sha256', secret).update(rawBody).digest('hex')
    const expectedB64 = createHmac('sha256', secret).update(rawBody).digest('base64')
    if (signature !== expectedHex && signature !== expectedB64) {
      console.warn('[easyship webhook] invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const eventType = String(payload.event_type ?? payload.event ?? '')
    // Event payloads nest the shipment under different keys across event
    // types; probe the common ones and fall back to the payload itself.
    const data = (payload.shipment ?? payload.label ?? payload.data ?? payload) as Record<string, unknown>
    const easyshipShipmentId = String(
      (data.easyship_shipment_id as string) ?? (payload.easyship_shipment_id as string) ?? ''
    )
    if (!easyshipShipmentId) {
      return NextResponse.json({ received: true })
    }

    const shipment = await prisma.shipment.findFirst({ where: { easyshipShipmentId } })
    if (!shipment) {
      return NextResponse.json({ received: true })
    }

    if (/label/i.test(eventType)) {
      const docs = (data.shipping_documents as Array<{ url?: string; category?: string }>) ?? []
      const labelUrl =
        (data.label_url as string) ??
        docs.find((d) => !d.category || /label/i.test(String(d.category)))?.url ??
        null
      const trackings = (data.trackings as Array<{ tracking_number?: string }>) ?? []
      const trackingNumber = trackings[0]?.tracking_number ?? (data.tracking_number as string) ?? null
      const courierName =
        ((data.courier_service as { name?: string })?.name) ??
        ((data.courier as { name?: string })?.name) ??
        shipment.carrier ?? 'Courier'

      await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          ...(labelUrl ? { labelUrl } : {}),
          ...(trackingNumber ? { trackingNumber } : {}),
          carrier: courierName,
        },
      })

      // Purchase-time registration is skipped when Easyship hadn't assigned
      // a tracking number yet -- do it now so the Shippo delivery webhook
      // can drive escrow release for this shipment too.
      if (trackingNumber && !shipment.trackRegistered) {
        try {
          await createTrack(normalizeCarrierToken(courierName), trackingNumber)
          await prisma.shipment.update({ where: { id: shipment.id }, data: { trackRegistered: true } })
        } catch (trackErr) {
          console.error('[easyship webhook] tracking registration failed for shipment', shipment.id, trackErr)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[easyship webhook]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
