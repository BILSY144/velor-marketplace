import Stripe from 'stripe'
import { Prisma, Order } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendEmail, buildOrderConfirmationEmail } from '@/lib/email'
import {
  createShippoShipment, purchaseLabel, buildParcelFromItems, pickBestRate, createTrack,
  ShippoAddress, ShippoCustomsItem,
} from '@/lib/shippo'

interface PricedItem {
  productId: string
  quantity: number
  priceGBP: number
}

// Compact per-seller money breakdown stored in PaymentIntent metadata by
// app/api/stripe/payment-intent/route.ts. Short keys because the whole
// array is one Stripe metadata value (500-char cap). i=sellerId,
// c=commissionRate, s=subtotalGBP (pre-discount), d=discountGBP,
// h=shippingGBP, u=dutiesGBP, o=thisSeller'sTotalGBP, e=sellerShareGBP.
interface SellerBreakdownEntry {
  i: string
  c: number
  s: number
  d: number
  h: number
  u: number
  o: number
  e: number
}

// Creates one Order + OrderItems per SELLER for a successfully-paid
// PaymentIntent, and returns all of them.
//
// SECURITY: this is the ONLY place an Order should ever be created. It reads
// exclusively from PaymentIntent metadata that app/api/stripe/payment-intent/route.ts
// computed itself, server-side, at PaymentIntent-creation time (price, quantity,
// commission rate, seller breakdown, totals). It never trusts anything supplied
// directly by a client at order-creation time -- there is no client-suppliable
// price, total, or seller ID anywhere in this function. Each item's REAL
// seller is re-resolved fresh from the database by productId below, never
// taken from metadata -- so even a tampered or stale items list can never
// attribute an item's sale to the wrong seller.
//
// A single checkout can span MULTIPLE sellers (a mixed cart). Each seller
// gets their own Order, their own Shipment, and their own Payout -- they
// ship their own parcel and get paid their own share, independent of every
// other seller in the same payment. Idempotent per (stripePaymentId,
// sellerId) via Order's compound unique constraint: if the Stripe webhook
// and the checkout-confirmation accelerator (app/api/orders POST) both race
// to create the same seller's order, the loser's transaction hits a P2002
// unique violation and this function just returns the winner's row instead
// of erroring. Sellers are also independent of each other here -- if one
// seller's order creation fails (e.g. a stock race), the others still
// succeed; the failed one is retried on the next webhook delivery or the
// next call to this function for the same PaymentIntent.

// Tier A auto-label purchase: real-time Shippo label bought at order-
// creation time for sellers dispatching from GB/DE/CA -- the only origins
// with live Shippo carrier coverage as of the 2026-07-27 rate survey (see
// CLAUDE.md). Everyone else stays on the existing Tier B self-ship-and-
// reimburse model (the seller ships with their own carrier account, using
// the platform-default estimate, then reports tracking via "Mark as
// Shipped"). Funded by Velor's own Shippo balance -- this supersedes the
// 2026-07-06 "Velor never buys shipping labels" decision in docs/PAYOUTS.md
// (see the 2026-07-27 amendment there for the full reasoning: Velor fronts
// the cost as recoverable working capital, funded via William's iwoca
// facility, and recovers it from the shipping amount already collected
// from the buyer at checkout).
//
// Silent no-op (not an error) whenever Tier A doesn't apply: no shipping
// profile, non-GB/DE/CA origin, no buyer country, or Shippo returning zero
// live rates for this route. The caller wraps this whole function in its
// own try/catch and only ever logs failures -- this must never roll back
// or fail an already-successful, already-paid order.
export async function attemptAutoLabelPurchase(
  order: Order,
  sellerId: string,
  sellerItems: PricedItem[],
  shippingAddressJson: Prisma.InputJsonValue
): Promise<void> {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    include: { shippingProfile: true, user: { select: { email: true } } },
  })
  const profile = seller?.shippingProfile
  if (!profile) return // no dispatch address on file -- Tier B, nothing to do

  const TIER_A_ORIGINS = new Set(['GB', 'DE', 'CA'])
  if (!TIER_A_ORIGINS.has(profile.country.toUpperCase())) return // Tier B origin

  const shippingAddress = (shippingAddressJson || {}) as Record<string, unknown>
  const destinationCountry = String(shippingAddress.country || '').toUpperCase()
  if (!destinationCountry) return // no buyer address -- can't quote, Tier B fallback stands

  const productIds = sellerItems.map((i) => i.productId)
  const productDims = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true, weightGrams: true, lengthCm: true, widthCm: true,
          heightCm: true, price: true, originCountry: true,
        },
      })
    : []
  const productMap = new Map(productDims.map((p) => [p.id, p]))

  const addressFrom: ShippoAddress = {
    name: profile.name,
    company: profile.company || undefined,
    street1: profile.street1,
    street2: profile.street2 || undefined,
    city: profile.city,
    state: profile.state || undefined,
    zip: profile.zip,
    country: profile.country,
    phone: profile.phone || undefined,
  }

  const addressTo: ShippoAddress = {
    name: (shippingAddress.name as string) || order.customerName || 'Customer',
    street1: (shippingAddress.street1 as string) || (shippingAddress.line1 as string) || '',
    street2: (shippingAddress.street2 as string) || (shippingAddress.line2 as string) || undefined,
    city: (shippingAddress.city as string) || '',
    state: (shippingAddress.state as string) || (shippingAddress.county as string) || undefined,
    // 'postcode' added 2026-07-28: checkout's payment-intent metadata stores
    // the buyer's postcode under `postcode` (see app/checkout/page.tsx),
    // while the client-side rates call uses `zip`. Reading only zip/postalCode
    // here sent Shippo an empty postcode at label time, so the FIRST live
    // Tier A order (cms4u5jfo0001woyre0rf4i7v) got zero rates while checkout
    // had quoted the same route fine seconds earlier.
    zip: (shippingAddress.zip as string) || (shippingAddress.postalCode as string) || (shippingAddress.postcode as string) || '',
    country: destinationCountry,
    phone: (shippingAddress.phone as string) || undefined,
    email: (shippingAddress.email as string) || undefined,
  }

  const isInternational = destinationCountry !== addressFrom.country

  const itemsWithDimensions = sellerItems.map((item) => {
    const pr = productMap.get(item.productId)
    return {
      weightGrams: pr?.weightGrams,
      lengthCm: pr?.lengthCm,
      widthCm: pr?.widthCm,
      heightCm: pr?.heightCm,
      quantity: Math.round(Number(item.quantity)) || 1,
    }
  })
  const parcel = buildParcelFromItems(itemsWithDimensions)

  const customsItems: ShippoCustomsItem[] = sellerItems.map((item) => {
    const pr = productMap.get(item.productId)
    return {
      description: 'Product',
      quantity: Math.round(Number(item.quantity)) || 1,
        net_weight: String((pr?.weightGrams || 180) / 1000),
      mass_unit: 'kg',
      value_amount: String(item.priceGBP || pr?.price || 0),
      value_currency: 'GBP',
      origin_country: pr?.originCountry || addressFrom.country,
    }
  })

  const declaredValue = sellerItems.reduce(
    (sum, item) => sum + (Number(item.priceGBP) || 0) * (Math.round(Number(item.quantity)) || 1),
    0
  )

  const shipment = await createShippoShipment({
    addressFrom, addressTo, parcels: [parcel],
    customsItems, declaredValue, currency: 'GBP', isInternational,
  })

  const chosen = pickBestRate(shipment.rates || [])
  if (!chosen) {
    console.warn('[attemptAutoLabelPurchase] Shippo returned zero rates for order', order.id, 'seller', sellerId)
    return // Tier B fallback stands -- the seller ships manually, reimbursed via the platform-default estimate they were quoted
  }

  const transaction = await purchaseLabel(chosen.object_id)
  if (transaction.status !== 'SUCCESS') {
    console.error('[attemptAutoLabelPurchase] Shippo transaction did not succeed for order', order.id, transaction)
    return
  }

  const shipmentData = {
    sellerId,
    shippoShipmentId: shipment.object_id,
    shippoRateId: chosen.object_id,
    shippoLabelId: transaction.object_id,
    trackingNumber: transaction.tracking_number,
    trackingUrl: transaction.tracking_url_provider,
    carrier: chosen.provider || 'Carrier',
    labelUrl: transaction.label_url,
    status: 'LABEL_PURCHASED' as const,
  }
  await prisma.shipment.upsert({
    where: { orderId: order.id },
    create: { orderId: order.id, ...shipmentData },
    update: shipmentData,
  })

  // Best-effort, isolated from the label purchase above: registers the
  // tracking number with Shippo's free /tracks endpoint so the existing
  // delivery webhook keeps working the same way it does for Tier B's
  // manually-reported tracking numbers.
  try {
    await createTrack(chosen.provider || '', transaction.tracking_number)
    await prisma.shipment.update({ where: { orderId: order.id }, data: { trackRegistered: true } })
  } catch (trackErr) {
    console.error('[attemptAutoLabelPurchase] tracking registration failed for order', order.id, trackErr)
  }

  if (seller?.user?.email) {
    try {
      const html = `
        <p>Hi ${seller.storeName},</p>
        <p>Good news -- a new order came in and Velor has already purchased and paid for the shipping label. No need to buy your own postage for this one.</p>
        <p><strong>Order:</strong> ${order.id}<br/>
        <strong>Carrier:</strong> ${chosen.provider || 'Carrier'}<br/>
        <strong>Tracking number:</strong> ${transaction.tracking_number}</p>
        <p><a href="${transaction.label_url}">Download and print the shipping label (PDF)</a></p>
        <p>Please attach it to the package and drop it off as usual. Tracking updates will appear on your Velor dashboard automatically.</p>
      `
      await sendEmail({
        to: seller.user.email,
        subject: `Shipping label ready for order ${order.id}`,
        html,
      })
    } catch (emailErr) {
      console.error('[attemptAutoLabelPurchase] seller label email failed for order', order.id, emailErr)
    }
  }
}

export async function createOrderFromPaymentIntent(pi: Stripe.PaymentIntent) {
  const md = (pi.metadata || {}) as Record<string, string>

  let sellerBreakdown: SellerBreakdownEntry[] = []
  try {
    sellerBreakdown = JSON.parse(md.sellerBreakdown || '[]')
  } catch {
    sellerBreakdown = []
  }
  sellerBreakdown = sellerBreakdown.filter((s) => s && s.i)
  if (sellerBreakdown.length === 0) {
    throw new Error(`PaymentIntent ${pi.id} has no sellerBreakdown in metadata -- refusing to create order`)
  }

  let items: PricedItem[] = []
  try {
    items = JSON.parse(md.items || '[]')
  } catch {
    items = []
  }
  items = items.filter((i) => i && i.productId && Number(i.quantity) > 0)
  if (items.length === 0) {
    throw new Error(`PaymentIntent ${pi.id} has no valid items in metadata -- refusing to create order`)
  }

  // Each item's REAL seller, resolved fresh from the database -- never
  // trusted from metadata. A product's seller can't be spoofed by tampering
  // with PaymentIntent metadata, since this is a fresh, authoritative lookup.
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, title: true, sellerId: true },
  })
  const productById = new Map(products.map((p) => [p.id, p]))

  const itemsBySeller = new Map<string, PricedItem[]>()
  for (const item of items) {
    const product = productById.get(item.productId)
    if (!product) continue // deleted product between checkout and now -- skip, don't crash the whole order
    const list = itemsBySeller.get(product.sellerId) || []
    list.push(item)
    itemsBySeller.set(product.sellerId, list)
  }

  let shippingAddress: Prisma.InputJsonValue = {}
  try {
    shippingAddress = JSON.parse(md.shippingAddress || '{}') as Prisma.InputJsonValue
  } catch {
    shippingAddress = {}
  }

  const customerEmail = (md.buyerEmail || '').toLowerCase().trim()
  const customerName = md.buyerName || customerEmail || 'Velor customer'

  // Orders that already exist for this PaymentIntent (a previous, partial
  // or full, call to this function -- e.g. the webhook fired after the
  // checkout-confirmation accelerator already created some or all of them).
  const existingOrders = await prisma.order.findMany({ where: { stripePaymentId: pi.id } })
  const existingBySeller = new Map(existingOrders.map((o) => [o.sellerId, o]))

  const orders: Order[] = [...existingOrders]
  // Tracks which orders THIS call actually created, as opposed to ones that
  // already existed from an earlier call (webhook vs. the checkout-
  // confirmation accelerator racing, or a retried Stripe webhook delivery).
  // Added in the 2026-07-16 readiness audit: the discount usedCount
  // increment in app/api/stripe/webhook/route.ts used to run unconditionally
  // on every payment_intent.succeeded delivery, so a Stripe retry of the
  // same event could inflate a usage-limited discount code's count and
  // prematurely lock out real future customers. Callers should only credit
  // side effects (like discount usage) for genuinely new orders.
  const newlyCreatedCount = { value: 0 }
  const failedSellerIds: string[] = []

  for (const sb of sellerBreakdown) {
    if (existingBySeller.has(sb.i)) continue // already created -- this seller's row is done

    const sellerItems = itemsBySeller.get(sb.i) || []
    if (sellerItems.length === 0) continue // every one of this seller's products was deleted -- nothing to create

    const platformFee = Math.max(0, sb.o - sb.e)

    let order
    try {
      const [created] = await prisma.$transaction([
        prisma.order.create({
          data: {
            sellerId: sb.i,
            customerEmail,
            customerName,
            shippingAddress,
            subtotal: sb.o,
            platformFee,
            sellerEarnings: sb.e,
            currency: 'gbp',
            status: 'PAID',
            stripePaymentId: pi.id,
            items: {
              create: sellerItems.map((item) => ({
                productId: item.productId,
                quantity: Math.round(Number(item.quantity)) || 0,
                price: Number(item.priceGBP) || 0,
                commission: (Number(item.priceGBP) || 0) * (Math.round(Number(item.quantity)) || 0) * sb.c,
              })),
            },
          },
        }),
        // Decrement stock atomically with order creation. payment-intent/
        // route.ts already blocked the charge if quantity exceeded stock at
        // intent-creation time, so this should always have enough -- the
        // stock:{gte} guard here is just defense against a race between two
        // near-simultaneous checkouts, so stock can never go negative even
        // in that edge case.
        ...sellerItems.map((item) =>
          prisma.product.updateMany({
            where: { id: item.productId, stock: { gte: Math.round(Number(item.quantity)) || 0 } },
            data: { stock: { decrement: Math.round(Number(item.quantity)) || 0 } },
          })
        ),
      ])
      order = created
    } catch (err: unknown) {
      // Someone else (webhook vs. the confirmation-page accelerator) won the
      // race and created THIS SELLER'S order first -- not an error, just use
      // their row. No confirmation email here either: whichever call
      // actually created the row is the one that sends it, below.
      if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
        const raced = await prisma.order.findUnique({
          where: { stripePaymentId_sellerId: { stripePaymentId: pi.id, sellerId: sb.i } },
        })
        if (raced) {
          orders.push(raced)
          continue
        }
      }
      // This seller's order failed -- don't let it block the other sellers
      // in the same cart from being created below. Logged and tracked in
      // failedSellerIds; after every seller has been attempted, a non-empty
      // failedSellerIds throws so the webhook returns 500 and Stripe retries
      // the whole event -- same "never silently lose an order" guarantee as
      // before, just scoped per seller instead of per payment. A retry is
      // safe and idempotent: existingBySeller already has every seller that
      // succeeded, so only the failed one(s) are attempted again.
      console.error('[createOrderFromPaymentIntent] order creation failed for seller', sb.i, 'on payment', pi.id, err)
      failedSellerIds.push(sb.i)
      continue
    }

    orders.push(order)
    newlyCreatedCount.value += 1

    // Order confirmation email -- best-effort, one per seller-order. Reached
    // exactly once per genuinely NEW order (existingBySeller already
    // filtered out anything created by an earlier call), so this can never
    // double-send even though both the webhook and the checkout-confirmation
    // accelerator call this same function for the same PaymentIntent. A
    // failure here is logged but never thrown -- a broken email send must
    // not roll back or fail an already-successful order. A buyer who bought
    // from 3 sellers in one cart gets 3 separate confirmation emails, one
    // per parcel -- matching the fact that each seller ships and is paid
    // independently.
    if (customerEmail) {
      try {
        const titleById = new Map(products.map((p) => [p.id, p.title]))
        const { subject, html } = buildOrderConfirmationEmail({
          buyerName: customerName,
          orderId: order.id,
          items: sellerItems.map((item) => ({
            name: titleById.get(item.productId) || 'Item',
            quantity: Math.round(Number(item.quantity)) || 0,
            price: Number(item.priceGBP) || 0,
          })),
          total: sb.o,
          // buildOrderConfirmationEmail concatenates this directly before each
          // amount (`${currency}${amount}`) -- it wants a display symbol, not
          // an ISO code. Orders are always GBP-denominated (see currency:
          // 'gbp' on the Order record above), so '£' is always correct here.
          currency: '£',
        })
        await sendEmail({ to: customerEmail, subject, html })
      } catch (emailErr) {
        console.error('[createOrderFromPaymentIntent] order confirmation email failed for order', order.id, emailErr)
      }
    }

    // Tier A: GB/DE/CA-origin sellers get a real Shippo label auto-purchased
    // and emailed to them right now, funded by Velor's own Shippo balance
    // (2026-07-27 decision superseding the 2026-07-06 "pure platform" rule --
    // see docs/PAYOUTS.md). Every other origin stays Tier B (self-ship,
    // reimbursed via the platform-default estimate) -- attemptAutoLabelPurchase
    // itself decides which tier applies and is a total no-op for Tier B
    // sellers. Best-effort and fully isolated: a Shippo outage or a seller
    // with no shipping profile must never roll back or fail an
    // already-successful, already-paid order.
    try {
      await attemptAutoLabelPurchase(order, sb.i, sellerItems, shippingAddress)
    } catch (labelErr) {
      console.error('[createOrderFromPaymentIntent] auto label purchase failed for order', order.id, labelErr)
    }
  }

  if (failedSellerIds.length > 0) {
    throw new Error(
      `PaymentIntent ${pi.id}: order creation failed for seller(s) ${failedSellerIds.join(', ')} -- ${orders.length} other order(s) succeeded`
    )
  }

  // newOrderCount is 0 on a pure retry/race (every seller's order already
  // existed) -- callers use this to gate one-time side effects like
  // discount-usage increments so a retried Stripe webhook delivery can't
  // apply them twice for the same PaymentIntent.
  return { orders, newOrderCount: newlyCreatedCount.value }
}
