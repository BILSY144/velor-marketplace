// Easyship provider adapter (built 2026-07-28, William: "i want it all in
// house under velor... every set up we do, i want a label generated for the
// seller"). Second shipping provider alongside lib/shippo.ts, using
// Easyship's Global Accounts model: ONE Velor account, multiple origin
// countries, pre-negotiated rates (up to 91% off; Royal Mail/DHL
// eCommerce/Evri/DPD/Asendia/FedEx/UPS live for GB at account creation),
// rates returned in the account currency (GBP).
//
// ENABLEMENT: everything here is a no-op until EASYSHIP_API_KEY is set in
// Vercel (William stores it himself; the API connection "Velor Marketplace"
// was created in the dashboard 2026-07-28). With the key absent, callers
// see empty rate lists and the existing Shippo-only behaviour is unchanged
// -- the standing "add, never silently break" directive.
//
// API: https://public-api.easyship.com/2024-09 (Bearer auth). Address
// schema verified against developers.easyship.com 2026-07-28: line_1 (max
// 35 chars), line_2, state (required; mandatory content for AU/CA/CN/ID/
// MX/MY/TH/US/VN), city (required), postal_code (required, nullable),
// country_alpha2, company_name (max 27), contact_name (max 22),
// contact_phone (max 20), contact_email (max 50). Parcel accepts
// total_actual_weight + box at parcel level (item-level physical fields
// then optional). Item-level customs fields are verified live via
// /api/admin/easyship-check before any lane is switched on -- Easyship's
// 422s name offending fields precisely.

const EASYSHIP_BASE = 'https://public-api.easyship.com/2024-09'

export function isEasyshipEnabled(): boolean {
  return !!process.env.EASYSHIP_API_KEY
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${process.env.EASYSHIP_API_KEY}`,
  }
}

export interface EasyshipAddress {
  line_1: string
  line_2?: string | null
  state?: string | null
  city: string
  postal_code?: string | null
  country_alpha2: string
  company_name?: string | null
  contact_name: string
  contact_phone?: string | null
  contact_email?: string | null
}

export interface EasyshipItem {
  quantity: number
  description: string
  declared_currency: string
  declared_customs_value: number
  actual_weight?: number // kg
  dimensions?: { length: number; width: number; height: number } // cm
  hs_code?: string | null
  origin_country_alpha2?: string | null
}

export interface EasyshipRate {
  courier_service: { id: string; name: string; umbrella_name?: string }
  total_charge: number
  currency: string
  min_delivery_time?: number
  max_delivery_time?: number
  [key: string]: unknown
}

// Truncate to Easyship's documented field limits rather than 422ing.
const trunc = (s: string | null | undefined, n: number) =>
  (s ?? '').toString().slice(0, n) || undefined

export function toEasyshipAddress(a: {
  name: string
  company?: string | null
  street1: string
  street2?: string | null
  city: string
  state?: string | null
  zip?: string | null
  country: string
  phone?: string | null
  email?: string | null
}): EasyshipAddress {
  return {
    line_1: trunc(a.street1, 35) || 'N/A',
    line_2: trunc(a.street2, 35) ?? null,
    // state is a required KEY (may be empty string for countries without
    // regions); Easyship mandates real content only for AU/CA/CN/ID/MX/MY/TH/US/VN.
    state: trunc(a.state, 200) ?? '',
    city: trunc(a.city, 200) || 'N/A',
    postal_code: a.zip || null,
    country_alpha2: (a.country || '').toUpperCase(),
    company_name: trunc(a.company, 27) ?? null,
    contact_name: trunc(a.name, 22) || 'Velor Seller',
    contact_phone: trunc(a.phone, 20) ?? null,
    contact_email: trunc(a.email, 50) ?? undefined,
  }
}

async function easyshipFetch(path: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(EASYSHIP_BASE + path, init)
  const text = await res.text()
  let json: unknown = null
  try { json = JSON.parse(text) } catch { /* non-JSON error body */ }
  if (!res.ok) {
    throw new Error(`Easyship ${init.method || 'GET'} ${path} ${res.status}: ${text.slice(0, 800)}`)
  }
  return json
}

// Request rates for a prospective shipment. Returns [] when the provider is
// disabled or errors -- callers always have the Shippo path to fall back on.
export async function getEasyshipRates(params: {
  originAddress: EasyshipAddress
  destinationAddress: EasyshipAddress
  totalWeightKg: number
  boxCm: { length: number; width: number; height: number }
  items: EasyshipItem[]
  incoterms?: 'DDU' | 'DDP'
}): Promise<EasyshipRate[]> {
  if (!isEasyshipEnabled()) return []
  try {
    const body = {
      origin_address: params.originAddress,
      destination_address: params.destinationAddress,
      incoterms: params.incoterms ?? 'DDU',
      insurance: { is_insured: false },
      courier_settings: { show_courier_logo_url: false, apply_shipping_rules: true },
      shipping_settings: { units: { weight: 'kg', dimensions: 'cm' } },
      parcels: [
        {
          total_actual_weight: params.totalWeightKg,
          box: { length: params.boxCm.length, width: params.boxCm.width, height: params.boxCm.height },
          items: params.items,
        },
      ],
      calculate_tax_and_duties: false,
    }
    const json = (await easyshipFetch('/rates', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })) as { rates?: EasyshipRate[] }
    return Array.isArray(json?.rates) ? json.rates : []
  } catch (err) {
    console.error('[easyship] getEasyshipRates failed', err)
    return []
  }
}

export interface EasyshipLabelResult {
  easyshipShipmentId: string
  courierName: string
  trackingNumber: string | null
  labelUrl: string | null
  labelState: string
  trackingPageUrl: string | null
}

// Create a shipment and purchase its label with the chosen courier service.
// Two-step per Easyship's model: POST /shipments (metadata + courier), then
// POST /labels to confirm purchase; label generation is async
// (label_state: not_created -> pending -> generated | failed), so we poll
// the shipment briefly for the document URL. Throws on failure -- the
// caller (attemptAutoLabelPurchase) treats a throw as "this provider did
// not deliver" and can fall back.
export async function purchaseEasyshipLabel(params: {
  originAddress: EasyshipAddress
  destinationAddress: EasyshipAddress
  totalWeightKg: number
  boxCm: { length: number; width: number; height: number }
  items: EasyshipItem[]
  courierServiceId: string
  incoterms?: 'DDU' | 'DDP'
}): Promise<EasyshipLabelResult> {
  if (!isEasyshipEnabled()) throw new Error('Easyship is not enabled (EASYSHIP_API_KEY missing)')

  const createBody = {
    origin_address: params.originAddress,
    destination_address: params.destinationAddress,
    incoterms: params.incoterms ?? 'DDU',
    courier_selection: { selected_courier_service_id: params.courierServiceId, allow_courier_fallback: false },
    shipping_settings: {
      units: { weight: 'kg', dimensions: 'cm' },
      buy_label: false,
      buy_label_synchronous: false,
    },
    parcels: [
      {
        total_actual_weight: params.totalWeightKg,
        box: { length: params.boxCm.length, width: params.boxCm.width, height: params.boxCm.height },
        items: params.items,
      },
    ],
  }

  const created = (await easyshipFetch('/shipments', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(createBody),
  })) as { shipment?: Record<string, unknown> }

  const shipment = created?.shipment ?? (created as Record<string, unknown>)
  const shipmentId = String(
    (shipment as { easyship_shipment_id?: string }).easyship_shipment_id ?? ''
  )
  if (!shipmentId) {
    throw new Error('Easyship shipment created but no easyship_shipment_id in response')
  }

  await easyshipFetch('/labels', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      shipments: [{ easyship_shipment_id: shipmentId, courier_service_id: params.courierServiceId }],
    }),
  })

  // Poll for label generation (bounded; webhook shipment.label.created is
  // the durable path -- app/api/webhooks/easyship -- this poll just makes
  // the common fast case synchronous so the seller email can include the
  // label link immediately).
  let last: Record<string, unknown> | null = null
  for (let attempt = 0; attempt < 6; attempt++) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 1500 : 2500))
    const got = (await easyshipFetch(`/shipments/${shipmentId}`, {
      method: 'GET',
      headers: headers(),
    })) as { shipment?: Record<string, unknown> }
    last = (got?.shipment ?? got) as Record<string, unknown>
    const state = String((last as { label_state?: string }).label_state ?? '')
    if (state === 'generated' || state === 'failed') break
  }

  const l = last as {
    label_state?: string
    shipping_documents?: Array<{ url?: string; category?: string }>
    label_url?: string
    trackings?: Array<{ tracking_number?: string; leg_number?: number }>
    tracking_page_url?: string
    courier?: { name?: string }
    courier_service?: { name?: string }
  } | null

  const labelUrl =
    l?.label_url ??
    l?.shipping_documents?.find((d) => !d.category || /label/i.test(String(d.category)))?.url ??
    null
  const trackingNumber = l?.trackings?.[0]?.tracking_number ?? null

  return {
    easyshipShipmentId: shipmentId,
    courierName: l?.courier_service?.name ?? l?.courier?.name ?? 'Courier',
    trackingNumber,
    labelUrl,
    labelState: String(l?.label_state ?? 'pending'),
    trackingPageUrl: l?.tracking_page_url ?? null,
  }
}
