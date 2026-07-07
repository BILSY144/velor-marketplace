import { prisma } from '@/lib/prisma'

// CJ Dropshipping API v2 client.
//
// SCOPE: this integration exists ONLY to seed velor-marketplace product
// listings (attached to one internal Seller account, seller.isInternal =
// true) and to automate fulfillment for orders on those listings. It has
// nothing to do with, and does not affect, the separate velorcommerce.co.uk
// project -- see CLAUDE.md, "CLARIFICATION -- 2026-07-06" for the full
// decision record.
//
// Auth flow verified against https://developers.cjdropshipping.cn/en/api/api2/api/auth.html
// on 2026-07-06:
//   - POST /authentication/getAccessToken  body: { apiKey }
//     apiKey is generated in the CJ dashboard (My CJ > API tab > Add API,
//     Type = "API Key"), format "CJUserNum@api@xxxxx...". Rate limit: 1 QPS.
//     Access token life: 15 days. Refresh token life: 180 days.
//   - POST /authentication/refreshAccessToken  body: { refreshToken }
//   - Every response is wrapped as { code, result, message, data, success }.
//     A 200 HTTP status does NOT guarantee success -- check json.result too.
//
// Product search, freight-calc, and order-create endpoints below are taken
// from CJ's docs but not yet exercised against a live account -- if CJ
// returns an unexpected body shape on first real use, fix the shape here.
//
// Required env var (William adds this in Vercel himself -- never hardcoded
// or entered by Claude, same rule as ADMIN_SECRET):
//   CJ_API_KEY - the API key from My CJ > API panel, format CJUserNum@api@...

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var ${name} for CJ Dropshipping integration`)
  return v
}

interface CjEnvelope<T> {
  code: number
  result: boolean
  message: string
  data: T
  success: boolean
}

interface CjTokenData {
  openId?: number
  accessToken: string
  accessTokenExpiryDate: string
  refreshToken: string
  refreshTokenExpiryDate: string
  createDate?: string
}

async function requestToken(body: Record<string, string>): Promise<{ accessToken: string; accessTokenExpiry: Date; refreshToken: string; refreshTokenExpiry: Date }> {
  const path = body.apiKey ? '/authentication/getAccessToken' : '/authentication/refreshAccessToken'
  const res = await fetch(`${CJ_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as CjEnvelope<CjTokenData>

  if (!json.result || !json.data) {
    throw new Error(`CJ ${path} failed: [${json.code}] ${json.message}`)
  }

  return {
    accessToken: json.data.accessToken,
    accessTokenExpiry: new Date(json.data.accessTokenExpiryDate),
    refreshToken: json.data.refreshToken,
    refreshTokenExpiry: new Date(json.data.refreshTokenExpiryDate),
  }
}

// Returns a valid access token: reuses the DB-cached one while it still has
// more than 30 minutes of life, refreshes via refreshToken if the access
// token is stale but the refresh token isn't, otherwise does a full
// getAccessToken call with CJ_API_KEY.
export async function getAccessToken(): Promise<string> {
  const cached = await prisma.cjAuthToken.findFirst({ orderBy: { updatedAt: 'desc' } })
  const buffer = new Date(Date.now() + 30 * 60 * 1000)

  if (cached && cached.accessTokenExpiry > buffer) {
    return cached.accessToken
  }

  let fresh
  if (cached && cached.refreshTokenExpiry > new Date()) {
    fresh = await requestToken({ refreshToken: cached.refreshToken })
  } else {
    fresh = await requestToken({ apiKey: requireEnv('CJ_API_KEY') })
  }

  if (cached) {
    await prisma.cjAuthToken.update({ where: { id: cached.id }, data: fresh })
  } else {
    await prisma.cjAuthToken.create({ data: fresh })
  }

  return fresh.accessToken
}

async function cjFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${CJ_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const json = (await res.json()) as CjEnvelope<T>
  if (!json.result) {
    throw new Error(`CJ API ${path} failed: [${json.code}] ${json.message}`)
  }
  return json.data
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface CjCategory {
  categoryFirstName: string
  categoryFirstList: {
    categorySecondName: string
    categorySecondList: { categoryId: string; categoryName: string }[]
  }[]
}

export async function getCategories(): Promise<CjCategory[]> {
  return cjFetch<CjCategory[]>('/product/getCategory')
}

// ---------------------------------------------------------------------------
// Product search
// ---------------------------------------------------------------------------

export interface CjProduct {
  pid: string
  productName: string
  productNameEn: string
  productImage: string
  productSku: string
  sellPrice: string
  categoryName: string
}

interface CjRawSearchProduct {
  id: string
  nameEn: string
  name?: string
  bigImage: string
  sku: string
  sellPrice: string
  categoryId?: string
}

interface CjSearchData {
  content: { productList: CjRawSearchProduct[] }[]
}

export async function searchProducts(params: { categoryId?: string; keyWord?: string; page?: number; size?: number }): Promise<CjProduct[]> {
  const qs = new URLSearchParams()
  if (params.categoryId) qs.set('categoryId', params.categoryId)
  if (params.keyWord) qs.set('keyWord', params.keyWord)
  qs.set('page', String(params.page || 1))
  qs.set('size', String(params.size || 20))

  // NOTE: CJ's real listV2 response is grouped -- data.content[].productList[],
  // not the flat data.list the docs imply. Confirmed 2026-07-06 via raw
  // response inspection. Field names also differ from the docs: id (not
  // pid), nameEn, bigImage, sku. sellPrice can be a range string like
  // "0.62 -- 0.70" for multi-variant products -- callers should treat it as
  // a display-only estimate and always get the real per-variant price from
  // getProductDetail().variants[].variantSellPrice before charging anyone.
  const json = await cjFetch<CjSearchData>(`/product/listV2?${qs.toString()}`)
  const flat = (json.content || []).flatMap((c) => c.productList || [])
  return flat.map((p) => ({
    pid: p.id,
    productName: p.name || p.nameEn,
    productNameEn: p.nameEn,
    productImage: p.bigImage,
    productSku: p.sku,
    sellPrice: p.sellPrice,
    categoryName: p.categoryId || '',
  }))
}

export interface CjProductDetail {
  pid: string
  productName: string
  productNameEn: string
  description: string
  productImageSet: string[]
  // Confirmed present on the raw /product/query response per CJ's official
  // API docs (developers.cjdropshipping.com/en/api/api2/api/product.html).
  // Often an empty string for ORDINARY_PRODUCT (CJ manages the inventory
  // itself, so there is no separate named supplier) -- only populated for
  // SUPPLIER_PRODUCT / SUPPLIER_SHIPPED_PRODUCT types. Callers must not
  // fabricate a name when this is blank.
  supplierName?: string
  supplierId?: string
  variants: {
    vid: string
    variantSku: string
    variantSellPrice: string
    variantImage: string
    variantKey: string // e.g. colour/size label
  }[]
}

export async function getProductDetail(pid: string): Promise<CjProductDetail> {
  return cjFetch<CjProductDetail>(`/product/query?pid=${encodeURIComponent(pid)}`)
}

// ---------------------------------------------------------------------------
// Shipping availability -- this is the check that replaces the old
// "UK PO Box shipping required" verification step. A product only gets
// imported if this returns at least one option, and free-shipping quoting at
// checkout depends on being able to price this in.
// ---------------------------------------------------------------------------

export interface CjFreightOption {
  logisticName: string
  logisticPrice: number
  logisticAging: string // e.g. "7-12 days"
}

export async function checkFreight(vid: string, quantity: number, endCountryCode: string, startCountryCode = 'CN'): Promise<CjFreightOption[]> {
  // Global marketplace — destination is whichever country the buyer/shipment is in.
  // Never hardcode a destination country here.
  const json = await cjFetch<CjFreightOption[]>('/logistic/freightCalculate', {
    method: 'POST',
    body: {
      startCountryCode,
      endCountryCode,
      products: [{ vid, quantity }],
    },
  })
  return json || []
}

// ---------------------------------------------------------------------------
// Order placement
// ---------------------------------------------------------------------------

export interface CjOrderShippingAddress {
  customerName: string
  phone: string
  email: string
  country: string
  countryCode: string
  province: string
  city: string
  address: string
  zip: string
}

export interface CjCreateOrderParams {
  orderNumber: string // our internal Order.id, so CJ's order can be traced back to ours
  shippingAddress: CjOrderShippingAddress
  logisticName: string // chosen from checkUkFreight results
  products: { vid: string; quantity: number }[]
}

export interface CjCreateOrderResult {
  orderId: string // CJ's own order id -- store this on Shipment.cjOrderId
}

export async function createOrder(params: CjCreateOrderParams): Promise<CjCreateOrderResult> {
  const json = await cjFetch<{ orderId: string }>('/shopping/order/createOrderV2', {
    method: 'POST',
    body: {
      orderNumber: params.orderNumber,
      shippingCountryCode: params.shippingAddress.countryCode.toUpperCase(),
      shippingCountry: params.shippingAddress.country,
      shippingProvince: params.shippingAddress.province,
      shippingCity: params.shippingAddress.city,
      shippingAddress: params.shippingAddress.address,
      shippingZip: params.shippingAddress.zip,
      shippingCustomerName: params.shippingAddress.customerName,
      shippingPhone: params.shippingAddress.phone,
      email: params.shippingAddress.email,
      payType: 2, // balance payment -- CJ docs: continues through cart/confirm/deduct automatically
      logisticName: params.logisticName,
      fromCountryCode: 'CN', // all Velor CJ products ship from CJ's CN warehouse network
      platform: 'Api',
      products: params.products.map((p) => ({ vid: p.vid, quantity: p.quantity })),
    },
  })
  return { orderId: json.orderId }
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

export interface CjTrackingInfo {
  trackNumber: string
  logisticName: string
  trackingUrl?: string
}

// NOTE: CJ's tracking-query endpoint path was not confirmed against a live
// account -- verify this against developers.cjdropshipping.com/en/api/api2/api/logistic.html
// once we have credentials, before relying on it in the fulfillment webhook.
export async function getTracking(cjOrderId: string): Promise<CjTrackingInfo | null> {
  return cjFetch<CjTrackingInfo | null>(`/logistic/trackInfo?orderId=${encodeURIComponent(cjOrderId)}`)
}


// Full English country name for a 2-letter ISO code, derived from the
// platform's own locale data. Never hand-maintain a country list here --
// that's exactly the kind of thing that goes stale or gets a country wrong.
export function countryNameFromCode(code: string): string {
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase())
    return name || code
  } catch {
    return code
  }
}


export interface CjOrderDetail {
  orderId: string
  orderNum: string
  cjOrderId?: string
  cjOrderCode?: string
  orderStatus: string
  subStatus?: string
  trackNumber?: string
  trackingProvider?: string
  trackingUrl?: string
}

// orderId here accepts either our own orderNumber or CJ's internal orderId
// (CJ's docs: "support: Custom order id, CJ order id"). Used right after
// createOrder() to recover the real cjOrderId/cjOrderCode -- createOrderV2's
// own response does not include them.
export async function getOrderDetail(orderId: string): Promise<CjOrderDetail | null> {
  return cjFetch<CjOrderDetail | null>(`/shopping/order/getOrderDetail?orderId=${encodeURIComponent(orderId)}`)
}

// A multi-product order needs ONE logisticName valid for every item in it,
// but checkFreight() is only ever keyed by a single vid. This checks each
// item independently then intersects by logisticName, so the value handed to
// createOrder() is genuinely valid for the whole basket -- never guessed or
// assumed. Returns null (never fabricates a fallback) if no common option
// exists; the caller must treat that as a hard failure needing manual
// placement, not silently drop items from the order.
export async function findCommonLogistic(
  items: { vid: string; quantity: number }[],
  endCountryCode: string,
  startCountryCode = 'CN'
): Promise<string | null> {
  if (items.length === 0) return null
  const optionSets = await Promise.all(
    items.map((item) => checkFreight(item.vid, item.quantity, endCountryCode, startCountryCode))
  )
  if (optionSets.some((set) => set.length === 0)) return null
  const [first, ...rest] = optionSets
  const common = first.filter((opt) =>
    rest.every((set) => set.some((o) => o.logisticName === opt.logisticName))
  )
  if (common.length === 0) return null
  common.sort((a, b) => a.logisticPrice - b.logisticPrice)
  return common[0].logisticName
}
