// Live client for the real production API (velorcommerce.store). Shapes below
// were read from the actual route handlers, not guessed:
//   /api/lattice            -> { totalCountries, trading, countries:[{code,name,products,specialities}], specialities }
//   /api/shop/products      -> { products:[...], total, pages, pagination }
//   /api/assistant/chat POST { messages, audience:'buyer' } -> { reply, escalated }
// No fabricated data: empty results render as honest zero states.
const BASE = 'https://velorcommerce.store'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json() as Promise<T>
}

export type LatticeCountry = {
  code: string
  name: string
  products: number
  specialities: string[]
}

export type Lattice = {
  totalCountries: number
  trading: number
  countries: LatticeCountry[]
  specialities: Record<string, { countries: number; products: number }>
}

export function fetchLattice(): Promise<Lattice> {
  return get<Lattice>('/api/lattice')
}

export type ShopProduct = {
  id: string
  name?: string
  title?: string
  price: number
  images?: string[]
  originCountry?: string
  sellerName?: string
  discountedPrice?: number | null
  percentOff?: number | null
  rating?: number | null
  reviewCount?: number
  // Extra fields the live route already returns (it spreads the full Prisma
  // row): used by the product page. All optional — never assumed present.
  description?: string | null
  category?: string | null
  specialities?: string[]
  avgRating?: number | null
  sellerId?: string
}

export async function fetchProductsByOrigin(cc: string, limit = 12): Promise<ShopProduct[]> {
  const data = await get<{ products: ShopProduct[] }>(
    `/api/shop/products?origin=${encodeURIComponent(cc)}&limit=${limit}`
  )
  return Array.isArray(data?.products) ? data.products : []
}

// Full shop query — the SAME /api/shop/products route the website's /shop
// page uses, with the same filter params (2026-08-04 website-parity pass).
export type ShopQuery = {
  search?: string
  category?: string
  origin?: string
  sellerId?: string
  excludeId?: string
  page?: number
  limit?: number
  sort?: string
}

export type ShopPage = { products: ShopProduct[]; total: number; pages: number }

export async function fetchShop(q: ShopQuery = {}): Promise<ShopPage> {
  const p = new URLSearchParams()
  if (q.search) p.set('search', q.search)
  if (q.category) p.set('category', q.category)
  if (q.origin) p.set('origin', q.origin)
  if (q.sellerId) p.set('sellerId', q.sellerId)
  if (q.excludeId) p.set('excludeId', q.excludeId)
  if (q.sort) p.set('sort', q.sort)
  p.set('page', String(q.page ?? 1))
  p.set('limit', String(q.limit ?? 60))
  const data = await get<{ products?: ShopProduct[]; total?: number; pages?: number }>(
    `/api/shop/products?${p.toString()}`
  )
  return {
    products: Array.isArray(data?.products) ? data.products : [],
    total: data?.total ?? 0,
    pages: data?.pages ?? 1,
  }
}

// ---------------------------------------------------------------------------
// WEBSITE-PARITY BUYER APIS (2026-08-04). Every call below hits the exact
// route the website itself uses -- server-priced, session-cookie authed
// (the app shares the platform cookie jar the sign-in flow fills).

export type Variant = {
  id: string
  name: string
  label?: string | null
  color?: string | null
  size?: string | null
  price: number
  stock: number
  image?: string
  images?: string[]
}

export type ProductReview = {
  id: string
  rating: number
  comment?: string | null
  buyerName?: string | null
  createdAt?: string
  images?: string[]
  helpfulCount?: number
}

export type ProductDetail = ShopProduct & {
  variants?: Variant[]
  reviews?: ProductReview[]
  stock?: number
  isHandmade?: boolean
  makerStory?: string | null
  materials?: string | null
}

/** Full product detail -- same /api/shop/products/[id] the website PDP uses. */
export const fetchProductDetail = (id: string) =>
  get<ProductDetail>(`/api/shop/products/${encodeURIComponent(id)}`)

/** Answered public Q&A for a listing (askers masked server-side). */
export async function fetchQuestions(productId: string): Promise<{ id: string; question: string; answer: string | null }[]> {
  try {
    const d = await get<{ questions?: { id: string; question: string; answer: string | null }[] }>(
      `/api/questions?productId=${encodeURIComponent(productId)}`
    )
    return Array.isArray(d?.questions) ? d.questions : []
  } catch {
    return []
  }
}

// --- Wishlist (server-backed, signed-in buyers; same /api/wishlist) ---
export type WishlistEntry = { id: string; productId: string; product: ShopProduct }

export async function fetchWishlist(): Promise<WishlistEntry[]> {
  const res = await fetch(`${BASE}/api/wishlist`, { headers: { accept: 'application/json' }, credentials: 'include' })
  if (!res.ok) return []
  const d = await res.json()
  return Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : []
}

export async function addToWishlist(productId: string): Promise<boolean> {
  const res = await fetch(`${BASE}/api/wishlist`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId }),
  })
  return res.ok
}

export async function removeFromWishlist(productId: string): Promise<boolean> {
  const res = await fetch(`${BASE}/api/wishlist?productId=${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  return res.ok
}

// --- Buyer account (same /api/auth/register-buyer the website /auth/join uses) ---
export async function registerBuyer(
  name: string,
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/auth/register-buyer`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (res.ok) return { ok: true }
  try {
    const d = await res.json()
    return { ok: false, error: d?.error ?? `Sign-up failed (${res.status})` }
  } catch {
    return { ok: false, error: `Sign-up failed (${res.status})` }
  }
}

// --- Payment (the SAME server-priced /api/stripe/payment-intent as the site) ---
export type CheckoutAddress = {
  line1: string
  line2?: string
  city: string
  postcode: string
  country: string // ISO-2
}

export type PaymentBreakdown = {
  currency: string
  productSubtotal: number
  shippingCost: number
  dutiesAmount: number
  discountAmount: number
  donationAmount?: number
  total: number
}

// Per-seller shipping rates (2026-08-04, William hit "Shipping has not been
// selected for every seller in this cart" at payment): the payment-intent
// route REQUIRES a chosen rateId per seller group, re-verified server-side.
// Same POST /api/shipping/rates call the website checkout makes.
export type ShippingRate = {
  rateId: string
  carrier?: string
  service?: string
  amount?: number
  currency?: string
  amountGBP?: number
}
export type SellerRateGroup = { sellerId: string; sellerName?: string; rates: ShippingRate[] }

export async function fetchShippingRates(body: {
  cartItems: {
    productId: string
    variantId: string | null
    sellerId: string
    quantity: number
    price: number
  }[]
  shippingAddress: { street1: string; city: string; zip: string; country: string }
}): Promise<SellerRateGroup[]> {
  const res = await fetch(`${BASE}/api/shipping/rates`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`rates ${res.status}`)
  const d = await res.json()
  return Array.isArray(d?.sellerGroups) ? d.sellerGroups : []
}

export async function createPaymentIntent(body: {
  items: { productId: string; variantId: string | null; quantity: number }[]
  currency: string
  buyerName: string
  shippingAddress: CheckoutAddress
  sellerShipping: { sellerId: string; rateId: string }[]
}): Promise<{ clientSecret?: string; breakdown?: PaymentBreakdown; error?: string }> {
  const res = await fetch(`${BASE}/api/stripe/payment-intent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  try {
    const d = await res.json()
    if (!res.ok) return { error: d?.error ?? `Checkout failed (${res.status})` }
    return d
  } catch {
    return { error: `Checkout failed (${res.status})` }
  }
}

/** Confirmation accelerator -- the webhook is the reliable path; this returns
 *  order ids immediately for the success screen (idempotent server-side). */
export async function confirmOrders(paymentIntentId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${BASE}/api/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ paymentIntentId }),
  })
  return { ok: res.ok }
}

// --- Buyer orders (same /api/account/orders as the website /orders page) ---
export type BuyerOrderItem = {
  id: string
  title?: string | null
  quantity: number
  price: number
  image?: string | null
  originCountry?: string | null
}
export type BuyerOrder = {
  id: string
  status: string
  total: number
  currency?: string | null
  createdAt: string
  trackingNumber?: string | null
  carrier?: string | null
  items: BuyerOrderItem[]
}

// Website parity (2026-08-04): the site's /orders page reads GET /api/orders,
// which joins each item's product (title/images/origin) and the shipment —
// the app previously used the thinner /api/account/orders and so had no
// titles or images at all. Same scoping: server trusts only the session.
export async function fetchMyOrders(): Promise<BuyerOrder[]> {
  const res = await fetch(`${BASE}/api/orders`, { headers: { accept: 'application/json' }, credentials: 'include' })
  if (!res.ok) return []
  const d = await res.json()
  const raw = Array.isArray(d) ? d : Array.isArray(d?.orders) ? d.orders : []
  return raw.map((o: any): BuyerOrder => ({
    id: o.id,
    status: o.status ?? 'PENDING',
    total: Number(o.total) || 0,
    currency: o.currency ?? null,
    createdAt: o.createdAt,
    trackingNumber: o.shipment?.trackingNumber ?? o.trackingNumber ?? null,
    carrier: o.shipment?.carrier ?? null,
    items: (o.items ?? []).map((it: any): BuyerOrderItem => ({
      id: it.id,
      title: it.product?.title ?? it.title ?? null,
      quantity: it.quantity ?? 1,
      price: Number(it.price) || 0,
      image: Array.isArray(it.product?.images) ? it.product.images[0] ?? null : it.image ?? null,
      originCountry: it.product?.originCountry ?? null,
    })),
  }))
}

/** Buyer confirms a SHIPPED order arrived — starts the escrow release window
 *  (website parity: the "I have received this order" button on /orders). */
export async function confirmDelivery(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/orders/${encodeURIComponent(orderId)}/confirm-delivery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) {
    try { const d = await res.json(); return { ok: false, error: d?.error } } catch { return { ok: false } }
  }
  return { ok: true }
}

export type TrackEvent = { status?: string | null; description?: string | null; location?: string | null; date?: string | null }
export type OrderTracking = {
  carrier?: string | null
  service?: string | null
  status?: string | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  events: TrackEvent[]
}

/** Tracking timeline for one order — same endpoint as the site's
 *  /orders/[orderId]/track page (requires the buyer's email, which the
 *  server cross-checks against the order; the session cookie rides along). */
export async function fetchOrderTracking(orderId: string, email: string): Promise<OrderTracking | null> {
  const res = await fetch(
    `${BASE}/api/orders/${encodeURIComponent(orderId)}/track?email=${encodeURIComponent(email)}`,
    { headers: { accept: 'application/json' }, credentials: 'include' }
  )
  if (!res.ok) return null
  const d = await res.json()
  const sh = d?.shipment
  return {
    carrier: sh?.carrier ?? null,
    service: sh?.status ?? null,
    status: d?.status ?? null,
    trackingNumber: sh?.trackingNumber ?? null,
    trackingUrl: sh?.trackingUrl ?? null,
    events: Array.isArray(sh?.events)
      ? sh.events.map((e: any): TrackEvent => ({
          status: e.status ?? null,
          description: e.description ?? null,
          location: e.location ?? null,
          date: e.occurredAt ?? null,
        }))
      : [],
  }
}

// --- Public runtime config (Stripe publishable key; never anything secret) ---
export async function fetchPublicConfig(): Promise<{ stripePublishableKey: string | null }> {
  try {
    return await get<{ stripePublishableKey: string | null }>('/api/public/config')
  } catch {
    return { stripePublishableKey: null }
  }
}

export type AssistMessage = { role: 'user' | 'assistant'; content: string }

/** Ask Velor — the exact same brain as the website chat (buyer persona). */
export async function askVelor(messages: AssistMessage[]): Promise<string> {
  const res = await fetch(`${BASE}/api/assistant/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages, audience: 'buyer' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `assistant -> ${res.status}`)
  return data.reply ?? ''
}

// ---------------------------------------------------------------------------
// Seller sign-in — against the live site's NextAuth (credentials + JWT).
// React Native's fetch uses the platform cookie jar, so the session cookie
// NextAuth sets on sign-in rides along automatically on every later call
// with credentials:'include'. No backend changes needed.
// ---------------------------------------------------------------------------

export type SessionUser = {
  id: string
  email?: string | null
  name?: string | null
  role?: string | null
  sellerId?: string | null
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${BASE}/api/auth/session`, {
      credentials: 'include',
      headers: { accept: 'application/json' },
    })
    const data = await res.json().catch(() => null)
    return data?.user?.id ? (data.user as SessionUser) : null
  } catch {
    return null
  }
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { credentials: 'include' })
  const { csrfToken } = await csrfRes.json()
  await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${BASE}/`,
    }).toString(),
  })
  // The callback 302s regardless of outcome — the session endpoint is the
  // only honest success check.
  return getSession()
}

export async function signOutRemote(): Promise<void> {
  try {
    const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { credentials: 'include' })
    const { csrfToken } = await csrfRes.json()
    await fetch(`${BASE}/api/auth/signout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, callbackUrl: `${BASE}/` }).toString(),
    })
  } catch {}
}

async function authedGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json() as Promise<T>
}

export type SellerPayouts = {
  payoutRail: string
  stripeOnboarded: boolean
  payoneerConfigured: boolean
  payoneerLinked: boolean
  pendingEscrow: number
  pendingOrderCount: number
  lifetimePaidOut: number
  isTrusted: boolean
  holdLabel: string
  history: { id: string; amount: number; currency: string; status: string; method: string; date: string }[]
}

export const fetchSellerPayouts = () => authedGet<SellerPayouts>('/api/dashboard/payouts')

// Matches app/api/dashboard/orders EXACTLY (reshaped 2026-07-21, commit
// a4bd2fe + sellerEarnings added same day). The old shape (productName/
// totalRevenue/totalPayout) no longer exists -- reading it crashed the
// app's seller screens to black and rendered NaN under EARNED (the
// "abnormal symbols" William reported).
export type SellerOrder = {
  id: string
  buyerName: string
  status: string
  createdAt: string
  total: number
  sellerEarnings: number
  currency: string
  items: { id: string; productId: string; quantity: number; price: number; product: { name: string; images: string[] } }[]
}

export const fetchSellerOrders = async (): Promise<SellerOrder[]> =>
  (await authedGet<{ orders: SellerOrder[] }>('/api/dashboard/orders')).orders ?? []

export type SellerProduct = {
  id: string
  name: string
  title?: string
  price: number
  stock: number
  status: string
  images?: string[]
  sales?: number
  requiresCertificate?: boolean
}

export const fetchSellerProducts = async (): Promise<SellerProduct[]> =>
  (await authedGet<{ products: SellerProduct[] }>('/api/dashboard/products')).products ?? []

export type SellerSubscription = { tier: string; [k: string]: unknown }

export const fetchSubscription = () => authedGet<SellerSubscription>('/api/seller/subscription')

// Upgrade to Pro — asks the site for a Stripe Checkout session for the
// PRO subscription (POST /api/seller/subscription, action upgrade_to_pro).
// The returned URL is Stripe's own hosted page: the seller enters their
// payment details there, never in the app, and the existing Stripe webhook
// flips the tier to PRO on completion.
export async function startProUpgrade(): Promise<{ checkoutUrl?: string; error?: string }> {
  const res = await fetch(`${BASE}/api/seller/subscription`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'upgrade_to_pro' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { error: data?.error ?? `Upgrade failed (${res.status})` }
  return { checkoutUrl: data.checkoutUrl }
}

export async function createListing(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/dashboard/products`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return res.ok ? { ok: true } : { ok: false, error: data?.error ?? `Failed (${res.status})` }
}

// Password reset — the site emails a one-hour verified link (William's
// standing requirement: email verification for resets). Always resolves
// regardless of whether the account exists (no user enumeration).
export async function requestPasswordReset(email: string): Promise<void> {
  await fetch(`${BASE}/api/auth/forgot`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

// Push token registry — the server keeps Expo push tokens so launch-time
// events (opening bells, order updates) can notify this device with the
// bell chime. Remote delivery activates with the store build; Expo Go
// cannot receive remote push since SDK 53.
export async function registerPushToken(token: string, platform: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/push/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, platform }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Live Shopping (2026-07-20) — same backend as the website's /live pages and
// the seller dashboard's Go Live screen. Real LiveKit rooms: a broadcaster
// token for the seller, a viewer token for everyone else, plus scheduling, a
// live-only discount, and "notify me" for a scheduled stream.
// ---------------------------------------------------------------------------

async function authedPost<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data?.error || `${path} -> ${res.status}`), { status: res.status, data })
  return data as T
}

export type LiveStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'

export type LiveStreamListItem = {
  id: string
  title: string
  roomName: string
  status: LiveStatus
  startedAt: string | null
  scheduledFor: string | null
  sellerName: string
  currency: string
  products: { id: string; title: string; price: number; images: string[] }[]
}

/** Public discovery feed — every live and scheduled stream, best sellers first. */
export const fetchLiveStreams = () => get<{ streams: LiveStreamListItem[] }>('/api/live').then((d) => d.streams ?? [])

export type LiveRoomProduct = { id: string; title: string; price: number; images: string[]; stock: number }
export type LiveOffer = { percent: number; productIds: string[] }
export type LiveRoomData = {
  stream: {
    id: string
    title: string
    description: string | null
    roomName: string
    status: LiveStatus
    scheduledFor: string | null
    startedAt: string | null
    // storeLogo added 2026-07-20 alongside the website's TikTok-style live
    // redesign (app/api/live/[room]/route.ts now selects it) -- same shared
    // /api/live/[room] endpoint this screen already calls, so this was
    // already coming back in the response; the type just didn't list it and
    // the UI didn't use it yet. Real data when a seller has set a logo,
    // null otherwise -- never a placeholder image.
    seller: { id: string; storeName: string; currency: string; storeLogo: string | null }
  }
  products: LiveRoomProduct[]
  liveOffer: LiveOffer | null
}

/** One stream's public detail — status, featured products, active live-only offer. */
export const fetchLiveRoom = (room: string) => get<LiveRoomData>(`/api/live/${encodeURIComponent(room)}`)

export async function fetchLiveViewerToken(room: string): Promise<{ token: string; wsUrl: string }> {
  return authedPost(`/api/live/${encodeURIComponent(room)}/token`)
}

/** "Notify me" for a scheduled stream — session cookie if signed in, else an Expo push token. */
export async function notifyMeForLive(room: string, pushToken?: string): Promise<{ ok: boolean; error?: string; status?: number }> {
  try {
    const res = await fetch(`${BASE}/api/live/${encodeURIComponent(room)}/notify`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pushToken ? { pushToken } : {}),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok ? { ok: true } : { ok: false, error: data?.error, status: res.status }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

// Report form rules (William, 2026-07-21): every report carries a reason
// (details required for 'other'); 5 separate filled-in reports end a
// stream, never 1. Reasons mirror lib/liveReportReasons.ts on the server.
export const LIVE_REPORT_REASONS: Record<string, string> = {
  contact: 'Sharing contact details or steering buyers off Velor',
  inappropriate: 'Inappropriate or offensive behaviour',
  prohibited: 'Counterfeit or prohibited items',
  misleading: 'Spam or misleading claims',
  safety: 'Safety concern',
  other: 'Something else',
}

export async function reportLiveStream(room: string, reason: string, details?: string): Promise<{ ended: boolean; reportCount: number } | { error: string }> {
  try {
    return await authedPost(`/api/live/${encodeURIComponent(room)}/report`, { reason, details })
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Could not report this stream.' }
  }
}

export type SellerLiveStream = {
  id: string
  title: string
  description: string | null
  roomName: string
  status: LiveStatus
  productIds: string[]
  scheduledFor: string | null
  createdAt: string
}

export type SellerLiveStatus = {
  tier: string
  canGoLive: boolean
  liveKitReady: boolean
  streams: SellerLiveStream[]
  storeName: string
}

export const fetchSellerLive = () => authedGet<SellerLiveStatus>('/api/dashboard/live')

export type CreateLiveStreamBody = {
  title: string
  description?: string
  productIds?: string[]
  scheduledFor?: string | null
  liveOfferPercent?: number | null
}

export type CreateLiveStreamResult = { stream: SellerLiveStream; token?: string; wsUrl?: string }

export async function createLiveStream(body: CreateLiveStreamBody): Promise<CreateLiveStreamResult> {
  return authedPost('/api/dashboard/live', body)
}

export async function startScheduledLiveStream(id: string): Promise<CreateLiveStreamResult> {
  return authedPost(`/api/dashboard/live/${encodeURIComponent(id)}/start`)
}

export async function endLiveStream(id: string): Promise<{ stream: SellerLiveStream }> {
  return authedPost(`/api/dashboard/live/${encodeURIComponent(id)}/end`)
}

// ---- Batch 2 website-parity APIs (2026-08-04) --------------------------------

/** Write a product review (server enforces the purchased-it rule + the
 *  no-contact-details filter; surfaces its error message verbatim). */
export async function writeReview(
  productId: string,
  rating: number,
  comment: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/reviews`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId, rating, comment }),
  })
  if (!res.ok) {
    try { const d = await res.json(); return { ok: false, error: d?.error } } catch { return { ok: false } }
  }
  return { ok: true }
}

/** Toggle a helpful vote on a review (idempotent toggle server-side). */
export async function markReviewHelpful(reviewId: string): Promise<boolean> {
  const res = await fetch(`${BASE}/api/reviews/helpful`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reviewId }),
  })
  return res.ok
}

export type VelorNotification = { id: string; title?: string | null; body?: string | null; href?: string | null; readAt?: string | null; createdAt?: string }
/** Real notifications — the same feed the website's bell polls. */
export async function fetchNotifications(): Promise<{ items: VelorNotification[]; unread: number }> {
  const res = await fetch(`${BASE}/api/notifications`, { headers: { accept: 'application/json' }, credentials: 'include' })
  if (!res.ok) return { items: [], unread: 0 }
  const d = await res.json()
  return { items: Array.isArray(d?.items) ? d.items : [], unread: Number(d?.unread) || 0 }
}
export async function markNotificationsRead(): Promise<void> {
  await fetch(`${BASE}/api/notifications`, { method: 'POST', credentials: 'include' }).catch(() => {})
}

export type AppliedDiscount = { code?: string; label?: string; amountGBP?: number }
/** Auto-applied seller discounts for the current cart (website parity: no
 *  code entry anywhere — codes apply themselves). One call per seller. */
export async function validateDiscounts(
  sellerId: string,
  items: { productId: string; quantity: number; price: number }[]
): Promise<{ totalDiscountGBP: number; applied: AppliedDiscount[] }> {
  const res = await fetch(`${BASE}/api/discount/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sellerId, items }),
  })
  if (!res.ok) return { totalDiscountGBP: 0, applied: [] }
  const d = await res.json()
  return { totalDiscountGBP: Number(d?.totalDiscountGBP) || 0, applied: Array.isArray(d?.applied) ? d.applied : [] }
}

export type DeliveryEstimate = {
  country: string
  available: boolean
  amountGBP?: number
  carrier?: string
  service?: string
  estimatedDays?: number | null
  isFree?: boolean
}
/** PDP delivery estimate — same widget data as the website product page. */
export async function fetchDeliveryEstimate(productId: string, country: string): Promise<DeliveryEstimate | null> {
  const res = await fetch(
    `${BASE}/api/shipping/estimate?productId=${encodeURIComponent(productId)}&country=${encodeURIComponent(country)}`,
    { headers: { accept: 'application/json' } }
  )
  if (!res.ok) return null
  const d = await res.json()
  return {
    country: d?.country ?? country,
    available: Boolean(d?.available),
    amountGBP: typeof d?.amountGBP === 'number' ? d.amountGBP : undefined,
    carrier: d?.carrier,
    service: d?.service,
    estimatedDays: d?.estimatedDays ?? null,
    isFree: d?.amountGBP === 0 || /free/i.test(String(d?.service ?? '')),
  }
}

// --- Seller follows (site FollowSellerButton parity). The server keeps this
// DORMANT until VELOR_SOCIAL_ENABLED is on: every method 403s, and the UI
// hides itself exactly like the website does. ---
export async function fetchFollowedSellers(): Promise<{ enabled: boolean; sellerIds: string[] }> {
  const res = await fetch(`${BASE}/api/social/follows`, { headers: { accept: 'application/json' }, credentials: 'include' })
  if (res.status === 403) return { enabled: false, sellerIds: [] }
  if (!res.ok) return { enabled: true, sellerIds: [] }
  const d = await res.json()
  const ids = Array.isArray(d?.follows) ? d.follows.map((f: any) => f.sellerId).filter(Boolean) : Array.isArray(d?.sellerIds) ? d.sellerIds : []
  return { enabled: true, sellerIds: ids }
}
export async function followSeller(sellerId: string): Promise<boolean> {
  const res = await fetch(`${BASE}/api/social/follows`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sellerId }),
  })
  return res.ok
}
export async function unfollowSeller(sellerId: string): Promise<boolean> {
  const res = await fetch(`${BASE}/api/social/follows`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sellerId }),
  })
  return res.ok
}
