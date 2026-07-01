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
  const kg = Math.max(0.05, totalWeightG / 1000)
  return {
    length: String(Math.max(1, Math.round(maxLen))),
    width: String(Math.max(1, Math.round(maxWid))),
    height: String(Math.max(1, Math.round(Math.min(totalHeight * 1.1, 60)))),
    distance_unit: 'cm',
    weight: kg.toFixed(3),
    mass_unit: 'kg',
  }
}

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

// Sort rates: DHL first (best DDP), then FedEx, then UPS, then others, cheapest within group
export function sortRatesByDDP(rates: ShippoRate[]): ShippoRate[] {
  const priority = ['dhl', 'fedex', 'ups']
  return [...rates].sort((a, b) => {
    const ap = priority.findIndex(p => (a.provider ?? '').toLowerCase().includes(p))
    const bp = priority.findIndex(p => (b.provider ?? '').toLowerCase().includes(p))
    const an = ap === -1 ? 99 : ap
    const bn = bp === -1 ? 99 : bp
    if (an !== bn) return an - bn
    return parseFloat(a.amount) - parseFloat(b.amount)
  })
}
