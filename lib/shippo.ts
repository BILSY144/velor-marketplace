// Shippo API client — no SDK, pure fetch, DDP-first
// Docs: https://docs.goshippo.com/

const SHIPPO_BASE = 'https://api.goshippo.com'

export interface ShippoAddress {
  name: string
  company?: string
  street1: string
  street2?: string
  city: string
  state?: string
  zip: string
  country: string
  phone?: string
  email?: string
}

export interface ShippoParcel {
  length: string
  width: string
  height: string
  distance_unit: 'cm' | 'in'
  weight: string
  mass_unit: 'kg' | 'lb' | 'g' | 'oz'
}

export interface ShippoCustomsItem {
  description: string
  quantity: number
  net_weight: string
  mass_unit: 'kg'
  value_amount: string
  value_currency: string
  tariff_number?: string
  origin_country: string
}

export interface ShippoRate {
  object_id: string
  carrier_account: string
  servicelevel: { name: string; token: string; terms?: string }
  amount: string
  currency: string
  estimated_days: number | null
  arrives_by: string | null
  provider: string
  provider_image_75?: string
}

export interface ShippoShipment {
  object_id: string
  status: string
  rates: ShippoRate[]
  messages: Array<{ source: string; code: string; text: string }>
}

export interface ShippoTransaction {
  object_id: string
  status: string
  tracking_number: string
  tracking_url_provider: string
  label_url: string
  rate: ShippoRate
  messages: Array<{ source: string; code: string; text: string }>
}

function shippoHeaders(): HeadersInit {
  return {
    Authorization: 'ShippoToken ' + process.env.SHIPPO_API_KEY,
    'Content-Type': 'application/json',
  }
}

export function buildParcelFromItems(
  items: Array<{
    weightGrams?: number | null
    lengthCm?: number | null
    widthCm?: number | null
    heightCm?: number | null
    quantity: number
  }>
): ShippoParcel {
  const totalWeightG = items.reduce(
    (sum, item) => sum + (item.weightGrams ?? 500) * item.quantity,
    0
  )
  const maxLen = Math.max(...items.map(i => i.lengthCm ?? 20))
  const maxWid = Math.max(...items.map(i => i.widthCm ?? 15))
  const totalHeight = items.reduce(
    (sum, item) => sum + (item.heightCm ?? 10) * item.quantity,
    0
  )
  // Dimensional weight: carriers charge whichever is greater — actual vs volumetric
  // Standard divisor 5000 cm³/kg used by DHL, FedEx, UPS, Royal Mail
  const dimWeightKg = (maxLen * maxWid * Math.min(totalHeight * 1.1, 60)) / 5000
  const kg = Math.max(0.05, Math.max(totalWeightG / 1000, dimWeightKg))
  return {
    length: String(Math.max(1, Math.round(maxLen))),
    width: String(Math.max(1, Math.round(maxWid))),
    height: String(Math.max(1, Math.round(Math.min(totalHeight * 1.1, 60)))),
    distance_unit: 'cm',
    weight: kg.toFixed(3),
    mass_unit: 'kg',
  }
}

// Rate quoting only — this Shippo endpoint is free (no label is purchased).
// Used to show buyers a live shipping cost at checkout. Velor's platform
// Shippo balance is never charged by this call.
export async function createShippoShipment(params: {
  addressFrom: ShippoAddress
  addressTo: ShippoAddress
  parcels: ShippoParcel[]
  customsItems: ShippoCustomsItem[]
  declaredValue: number
  currency: string
  isInternational: boolean
}): Promise<ShippoShipment> {
  const { addressFrom, addressTo, parcels, customsItems, isInternational } = params

  const body: Record<string, unknown> = {
    address_from: addressFrom,
    address_to: addressTo,
    parcels,
    async: false,
  }

  if (isInternational && customsItems.length > 0) {
    body.customs_declaration = {
      contents_type: 'MERCHANDISE',
      non_delivery_option: 'RETURN',
      certify: true,
      certify_signer: addressFrom.name,
      incoterm: 'DDP',
      items: customsItems,
    }
  }

  const res = await fetch(SHIPPO_BASE + '/shipments/', {
    method: 'POST',
    headers: shippoHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error('Shippo /shipments error ' + res.status + ': ' + err)
  }

  return res.json()
}

// Server-side re-verification of a rate a buyer selected at checkout.
// app/api/shipping/rates/route.ts hands the browser a list of live Shippo
// rates; until the 2026-07-16 readiness audit, app/api/stripe/payment-intent
// simply trusted whatever shippingAmount the client sent back for that
// rateId, with no check that the two ever matched -- a tampered request
// could set shippingAmount to anything (including 0) while keeping a real
// rateId. Shippo rate objects stay retrievable by id for a window after
// they're quoted (they're only consumed by an actual label purchase, which
// Velor never does -- see purchaseLabel below), so GET /rates/{id}/ is the
// authoritative source of truth for what a rate actually costs. Throws if
// the rate can't be found/has expired -- callers should treat that as "ask
// the buyer to reselect shipping," never as license to fall back to the
// client-supplied amount.
export async function getRate(rateId: string): Promise<ShippoRate> {
  const res = await fetch(SHIPPO_BASE + '/rates/' + encodeURIComponent(rateId) + '/', {
    headers: shippoHeaders(),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error('Shippo /rates/' + rateId + ' error ' + res.status + ': ' + err)
  }
  return res.json()
}

// NOT CALLED ANYWHERE as of 2026-07-06 (William's decision: Velor is a pure
// platform and never spends its own money on shipping). Kept only for
// reference / possible future opt-in (e.g. a seller-funded label-purchase
// feature that draws from the seller's own connected balance, not Velor's).
// Do not wire this back up without an explicit new decision from William —
// see docs/PAYOUTS.md.
export async function purchaseLabel(rateId: string): Promise<ShippoTransaction> {
  const res = await fetch(SHIPPO_BASE + '/transactions/', {
    method: 'POST',
    headers: shippoHeaders(),
    body: JSON.stringify({ rate: rateId, label_file_type: 'PDF', async: false }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error('Shippo /transactions error ' + res.status + ': ' + err)
  }

  return res.json()
}

// Common carrier-name -> Shippo tracking-carrier-token mapping, for sellers
// who type a human name ("Royal Mail", "DHL") into the manual ship form.
// Falls back to a lowercase/underscored guess if not found — best effort only.
const CARRIER_TOKEN_MAP: Record<string, string> = {
  'royal mail': 'royal_mail',
  'royalmail': 'royal_mail',
  'dhl': 'dhl_express',
  'dhl express': 'dhl_express',
  'ups': 'ups',
  'fedex': 'fedex',
  'usps': 'usps',
  'dpd': 'dpd',
  'hermes': 'evri',
  'evri': 'evri',
  'canada post': 'canada_post',
  'australia post': 'australia_post',
  'auspost': 'australia_post',
  'tnt': 'tnt',
  'an post': 'an_post',
  'yodel': 'yodel',
  'parcelforce': 'parcelforce',
  'china post': 'china_post',
  'sf express': 'sf_express',
}

export function normalizeCarrierToken(carrier: string): string {
  const key = carrier.trim().toLowerCase()
  return CARRIER_TOKEN_MAP[key] ?? key.replace(/\s+/g, '_')
}

// Registers an ALREADY-SHIPPED, seller-purchased tracking number for status
// updates. This is Shippo's free /tracks/ endpoint — no label is bought and
// no money is spent — it just subscribes Velor's webhook to that carrier's
// tracking events for this tracking number. This is what lets the existing
// Shippo delivery webhook keep stamping deliveredAt (and therefore drive the
// normal payout-escrow release) even though Velor never purchases the label
// itself; the seller ships with their own carrier account and their own
// money, and simply reports the tracking number back to Velor.
// Best-effort by design: callers should catch and swallow errors rather than
// block marking an order as shipped (some regional carriers aren't
// recognised by Shippo's tracking API).
export async function createTrack(carrier: string, trackingNumber: string): Promise<void> {
  const res = await fetch(SHIPPO_BASE + '/tracks/', {
    method: 'POST',
    headers: shippoHeaders(),
    body: JSON.stringify({ carrier, tracking_number: trackingNumber }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error('Shippo /tracks error ' + res.status + ': ' + err)
  }
}

// Sort rates: DHL first (best DDP), then FedEx, then UPS, then others, cheapest within group
// Sort rates globally: cheapest first, then by speed.
// No hardcoded carrier bias — Shippo returns only carriers valid for the route.
export function sortRatesGlobal(rates: ShippoRate[]): ShippoRate[] {
  return [...rates].sort((a, b) => {
    const priceDiff = parseFloat(a.amount) - parseFloat(b.amount)
    if (Math.abs(priceDiff) > 0.50) return priceDiff
    // Within 50p of each other: prefer faster
    const aDays = a.estimated_days ?? 99
    const bDays = b.estimated_days ?? 99
    return aDays - bDays
  })
}

// Alias for backward compatibility during migration
export const sortRatesByDDP = sortRatesGlobal

// AI auto-selection: pick cheapest rate that includes tracking.
// Falls back to absolute cheapest if none have tracking.
export function pickBestRate(rates: ShippoRate[]): ShippoRate | null {
  if (!rates.length) return null
  return sortRatesGlobal(rates)[0]
}
