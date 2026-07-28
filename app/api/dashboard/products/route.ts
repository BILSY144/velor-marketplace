import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { checkProhibitedListingContent, prohibitedListingReason } from '@/lib/prohibitedListingContent'
import { checkMessageContent } from '@/lib/messageFilter'
import { checkForbiddenPatterns, detectRegulatedSignal } from '@/lib/listingModeration'
import { grantCountryFounderIfFirst } from '@/lib/founding'
import { sendEmail, buildListingNeedsReviewAlertEmail } from '@/lib/email'

// William, 2026-07-26: "anything that needs a review, is brought to me by
// email immediately... ill check the reason its flagged and make a
// decision based on the evidence." Same address lib/provisionSeller.ts's
// DIRECTOR_EMAIL already uses for every other direct-to-William alert.
const DIRECTOR_EMAIL = 'willsinclair144@gmail.com'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    include: {
      products: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          stock: true,
          status: true,
          category: true,
          images: true,
          weightGrams: true,
          lengthCm: true,
          widthCm: true,
          heightCm: true,
          hsCode: true,
          originCountry: true,
          isHandmade: true,
          makerStory: true,
          materials: true,
          requiresCertificate: true,
          createdAt: true,
          variants: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, label: true, color: true, size: true, stock: true, priceOverride: true, sku: true },
          },
          _count: { select: { orderItems: true } },
        },
      },
    },
  })

  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

  // The dashboard UI reads product.name; the schema field is title.
  const products = seller.products.map((p) => ({ ...p, name: p.title, sales: p._count.orderItems }))
  return NextResponse.json({ products })
}

// An image is either an externally-hosted URL, or an uploaded photo stored as a
// compressed data URL (see resizeAndCompressImage in the Add Product form).
function isValidImage(u: unknown): u is string {
  return typeof u === 'string' && (u.startsWith('http') || u.startsWith('data:image/'))
}

interface VariantBody {
  label?: string | null
  color?: string | null
  size?: string | null
  stock?: number
  priceOverride?: number | null
  sku?: string | null
}

interface ProductBody {
  name?: string
  description?: string
  price?: number
  stock?: number
  category?: string
  images?: string[]
  tags?: string[]
  weightGrams?: number | null
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
  hsCode?: string | null
  originCountry?: string | null
  isHandmade?: boolean
  makerStory?: string | null
  materials?: string | null
  containsRegulatedMaterial?: boolean
  rulesAccepted?: boolean
  // Optional colour/size options (added 2026-07-27). Omitted or empty array
  // means this listing has no variants -- price/stock above stay the only
  // source of truth, exactly as every listing worked before this feature.
  variants?: VariantBody[]
  // 2026-07-28 listing-form overhaul (spec in CLAUDE.md): free video link,
  // made-to-order with lead time, and a seller-written size guide.
  videoUrl?: string | null
  madeToOrder?: boolean
  leadTimeDays?: number | string | null
  sizeGuide?: string | null
}

// Video is LINK-ONLY for now (William, 2026-07-28: "the video can be a link
// for now as its free. we can add the cost version later"). Only YouTube and
// Vimeo URLs are accepted so the PDP can embed a known-safe player -- an
// arbitrary URL would be an open redirect / mixed-content risk.
function normalizeVideoUrl(raw: unknown): { videoUrl: string | null } | { error: string } {
  if (raw === null || raw === undefined || String(raw).trim() === '') return { videoUrl: null }
  const url = String(raw).trim().slice(0, 300)
  const ok = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+|youtube\.com\/shorts\/[\w-]+|vimeo\.com\/\d+)/.test(url)
  if (!ok) return { error: 'Video must be a YouTube or Vimeo link (e.g. https://youtube.com/watch?v=... or https://vimeo.com/...).' }
  return { videoUrl: url }
}

// Shared by POST and PATCH. Returns either a normalized, de-duplicated list
// ready for createMany, or an error string to show the seller. Validation
// lives here (not just relying on the DB's @@unique([productId, color,
// size])) so a seller gets a clear message instead of a raw constraint
// error.
function normalizeVariants(raw: unknown): { variants: VariantBody[] } | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { variants: [] }
  const seen = new Set<string>()
  const out: VariantBody[] = []
  for (const v of raw) {
    const label = typeof (v as VariantBody)?.label === 'string' ? (v as VariantBody).label!.trim().slice(0, 80) : ''
    const color = typeof (v as VariantBody)?.color === 'string' ? (v as VariantBody).color!.trim() : ''
    const size = typeof (v as VariantBody)?.size === 'string' ? (v as VariantBody).size!.trim() : ''
    if (!label && !color && !size) {
      return { error: 'Each option needs a name (e.g. "Dragon design"), a colour, a size, or some combination.' }
    }
    const key = `${label.toLowerCase()}|${color.toLowerCase()}|${size.toLowerCase()}`
    if (seen.has(key)) {
      return { error: `You have more than one option for ${[label, color, size].filter(Boolean).join(' / ')} -- each option can only appear once.` }
    }
    seen.add(key)
    const stock = Math.max(0, parseInt(String((v as VariantBody)?.stock ?? 0)) || 0)
    const priceRaw = (v as VariantBody)?.priceOverride
    const priceOverride = priceRaw !== null && priceRaw !== undefined && String(priceRaw).trim() !== ''
      ? parseFloat(String(priceRaw))
      : null
    if (priceOverride !== null && (isNaN(priceOverride) || priceOverride <= 0)) {
      return { error: 'Variant price override must be a positive number.' }
    }
    out.push({
      label: label || null,
      color: color || null,
      size: size || null,
      stock,
      priceOverride,
      sku: typeof (v as VariantBody)?.sku === 'string' ? (v as VariantBody).sku!.trim().slice(0, 60) || null : null,
    })
  }
  return { variants: out }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    include: { shippingProfile: true },
  })
  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })
  if (!seller.approved) {
    return NextResponse.json({ error: 'Seller account pending approval' }, { status: 403 })
  }

  // Belt-and-suspenders: every seller approved via lib/provisionSeller.ts
  // now gets a SellerShippingProfile automatically from their application's
  // ship-from address, so this should never actually trigger for a new
  // seller. It exists to catch anyone approved before that change (an
  // application with no ship-from fields on file) before they can publish
  // a listing that would silently fall back to a placeholder shipping
  // quote at checkout -- see app/api/shipping/rates/route.ts's
  // FALLBACK_QUOTE_RATE. Failing fast here, with a clear next step, beats
  // a buyer discovering it weeks later at checkout.
  if (!seller.shippingProfile) {
    return NextResponse.json(
      {
        error: 'Add your ship-from address before listing a product.',
        shippingProfileRequired: true,
      },
      { status: 400 }
    )
  }

  // Starter: 10 listings. Pro: unlimited (Enterprise retired 2026-07-15 —
  // Pro inherited its unlimited listings; legacy ENTERPRISE rows read as Pro).
  const LISTING_LIMITS: Record<string, number | null> = { STARTER: 10, PRO: null, ENTERPRISE: null }
  const sellerTier = (seller as any).tier ?? 'STARTER'
  const listingLimit = LISTING_LIMITS[sellerTier]
  if (listingLimit !== null) {
    const listingCount = await prisma.product.count({ where: { sellerId: seller.id } })
    if (listingCount >= listingLimit) {
      return NextResponse.json({ error: 'Listing limit reached. Upgrade for more listings.', upgradeRequired: true }, { status: 403 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    name, description, price, stock, category, images, tags,
    weightGrams, lengthCm, widthCm, heightCm, hsCode, originCountry,
    isHandmade, makerStory, materials, containsRegulatedMaterial, rulesAccepted,
    variants: rawVariants,
    videoUrl: rawVideoUrl, madeToOrder, leadTimeDays, sizeGuide,
  } = body as ProductBody

  const variantResult = normalizeVariants(rawVariants)
  if ('error' in variantResult) {
    return NextResponse.json({ error: variantResult.error }, { status: 400 })
  }
  const variants = variantResult.variants

  const videoResult = normalizeVideoUrl(rawVideoUrl)
  if ('error' in videoResult) {
    return NextResponse.json({ error: videoResult.error }, { status: 400 })
  }
  const parsedLeadTime = leadTimeDays !== null && leadTimeDays !== undefined && String(leadTimeDays).trim() !== ''
    ? Math.min(120, Math.max(1, parseInt(String(leadTimeDays)) || 0)) || null
    : null

  // Every listing submission must confirm compliance with the Seller Rules
  // and Product Compliance Policy (/legal/seller-rules). Enforced server-side
  // so the checkbox cannot be bypassed by calling the API directly.
  if (rulesAccepted !== true) {
    return NextResponse.json({ error: 'You must confirm this listing complies with the Seller Rules and Product Compliance Policy.' }, { status: 400 })
  }

  // Immediate hard-reject check for antiques/artifacts and CITES-adjacent
  // materials, shared with the auto-moderate cron (lib/prohibitedListingContent.ts)
  // -- gives the seller a specific reason right away instead of finding out
  // up to 5 minutes later that their listing silently disappeared.
  const prohibitedOnCreate = checkProhibitedListingContent(name, description, materials, makerStory)
  if (prohibitedOnCreate.blocked) {
    return NextResponse.json({ error: prohibitedListingReason(prohibitedOnCreate) }, { status: 400 })
  }

  // Velor is the platform -- sellers promote through Velor, not their own
  // business or contact details. Reuses the same email/phone/social
  // detector that guards buyer<->seller messages (lib/messageFilter.ts) and
  // seller settings (app/api/dashboard/settings/route.ts), since a listing
  // is exactly as public as either of those once it is live on /shop/[id].
  const contactOnCreate = checkMessageContent(`${name} ${description || ''} ${makerStory || ''} ${materials || ''}`)
  if (contactOnCreate.blocked) {
    return NextResponse.json(
      { error: "Listings can't include email addresses, phone numbers, or social/messaging handles -- Velor is the platform, sellers promote through Velor, not their own contact details." },
      { status: 400 }
    )
  }

  // originCountry is mandatory -- it is what routes this listing onto the
  // correct country/culture page (see CountryFounder in prisma/schema.prisma
  // and grantCountryFounderIfFirst in lib/founding.ts). A listing with no
  // declared origin can't be placed on any country page at all.
  if (!name || !category || price === null || !originCountry) {
    return NextResponse.json({ error: 'name, category, price, and origin country are required' }, { status: 400 })
  }
  if (weightGrams === null || weightGrams === undefined || lengthCm === null || lengthCm === undefined || widthCm === null || widthCm === undefined || heightCm === null || heightCm === undefined) {
    return NextResponse.json({ error: 'weight and dimensions are required' }, { status: 400 })
  }

  const parsedPrice = parseFloat(String(price))
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
  }

  const validImages = Array.isArray(images) ? images.filter(isValidImage) : []
  if (validImages.length < 3) {
    return NextResponse.json({ error: 'Please add at least 3 product images' }, { status: 400 })
  }

  // Instant-listing moderation (William, 2026-07-26: "i want every listing
  // to be approved automatically. so they dont wait for approval. then
  // once listed we will review for banned products... that is how ebay do
  // it"). A hard-forbidden term (weapons, adult content, drugs,
  // counterfeits, tobacco, alcohol) blocks creation outright -- same
  // immediate-feedback pattern as checkProhibitedListingContent above, the
  // listing is never created. See lib/listingModeration.ts.
  const forbiddenMatch = checkForbiddenPatterns(String(name), description, materials)
  if (forbiddenMatch) {
    return NextResponse.json(
      { error: 'This listing contains a term Velor does not allow (weapons, adult content, drugs, counterfeits, tobacco, or alcohol). Please remove it and resubmit.' },
      { status: 400 }
    )
  }

  // Certificate-track (seller declared regulated material) and an
  // undeclared-but-detected regulated-material signal both still hold in
  // PENDING_REVIEW for a human check before going live -- confirmed with
  // William 2026-07-26: publishing possibly-protected-species material
  // publicly, even briefly, without proof of legal sourcing is a real legal
  // risk, unlike an ordinary quality issue that can just be taken down
  // after the fact. Every other listing now goes straight to APPROVED with
  // zero wait.
  const regulatedSignalMatch = detectRegulatedSignal(String(name), description, materials)
  const needsHumanReviewFirst = !!containsRegulatedMaterial || regulatedSignalMatch !== null
  const initialStatus = needsHumanReviewFirst ? 'PENDING_REVIEW' : 'APPROVED'
  const holdReason = containsRegulatedMaterial
    ? 'Seller declared this listing contains a regulated material and requested the certificate track. It cannot go live until a valid export certificate (e.g. CITES) is verified.'
    : regulatedSignalMatch
      ? `Not declared as regulated by the seller, but the listing text matched a possible regulated-material term (pattern: ${regulatedSignalMatch}). Held for a human check rather than approved automatically.`
      : ''

  // When the seller has defined variants, Product.stock becomes a derived
  // display total (sum of variant stock) rather than the authoritative
  // number -- checkout resolves and decrements stock per-variant (see
  // app/api/stripe/payment-intent/route.ts and lib/orders.ts). Products
  // with no variants are completely unaffected: stock stays exactly what
  // the seller typed in the form, same as before this feature existed.
  const productStock = variants.length > 0
    ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : Math.max(0, parseInt(String(stock || 0)))

  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      title: String(name).trim(),
      description: String(description || '').trim(),
      price: parsedPrice,
      stock: productStock,
      category: String(category).trim(),
      images: validImages,
      tags: Array.isArray(tags)
        ? tags.filter((t: unknown) => typeof t === 'string')
        : [],
      status: initialStatus,
      weightGrams: weightGrams !== null ? Number(weightGrams) : null,
      lengthCm: lengthCm !== null ? Number(lengthCm) : null,
      widthCm: widthCm !== null ? Number(widthCm) : null,
      heightCm: heightCm !== null ? Number(heightCm) : null,
      hsCode: hsCode || null,
      originCountry: originCountry || null,
      isHandmade: !!isHandmade,
      makerStory: makerStory || null,
      materials: materials ? String(materials).trim() : null,
      // Declared regulated material puts the listing on the certificate
      // track: it stays in enhanced review and cannot be approved until a
      // valid certificate is verified by admin (enforced at approval time).
      requiresCertificate: !!containsRegulatedMaterial,
      videoUrl: videoResult.videoUrl,
      madeToOrder: !!madeToOrder,
      leadTimeDays: madeToOrder ? parsedLeadTime : null,
      sizeGuide: sizeGuide ? String(sizeGuide).trim().slice(0, 4000) || null : null,
      ...(variants.length > 0
        ? { variants: { create: variants.map((v) => ({ label: v.label ?? null, color: v.color, size: v.size, stock: v.stock, priceOverride: v.priceOverride, sku: v.sku })) } }
        : {}),
    },
  })

  // This is now the third code path (alongside the auto-moderate cron and
  // the manual admin approval route) that can transition a product straight
  // to APPROVED, so it must also grant country-founder credit the same way
  // those two do -- see lib/founding.ts. Never blocks/affects the response:
  // a P2002 (country already founded, or this seller already founded one)
  // is expected and swallowed inside grantCountryFounderIfFirst itself.
  if (initialStatus === 'APPROVED') {
    await grantCountryFounderIfFirst(seller.id, product.id, originCountry)
  } else {
    // Held for review -- alert William immediately with the evidence, per
    // his 2026-07-26 instruction, rather than letting it sit silently in
    // the admin queue. Best-effort: a Resend outage must never block the
    // seller's listing submission from completing.
    sendEmail({
      to: DIRECTOR_EMAIL,
      ...buildListingNeedsReviewAlertEmail({
        productId: product.id,
        productTitle: product.title,
        storeName: seller.storeName,
        sellerEmail: session.user.email || 'unknown',
        originCountry: product.originCountry,
        materials: product.materials,
        description: product.description,
        reason: holdReason,
      }),
    }).catch((err) => console.error(`Failed to send review-needed alert for product ${product.id}:`, err))
  }

  return NextResponse.json({ product }, { status: 201 })
}


export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing || existing.sellerId !== seller.id) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const body = await req.json()
  const {
    name, description, price, stock, category, images, tags,
    weightGrams, lengthCm, widthCm, heightCm, hsCode, originCountry,
    isHandmade, makerStory, materials, containsRegulatedMaterial, rulesAccepted,
    variants: rawVariants,
    videoUrl: rawVideoUrl, madeToOrder, leadTimeDays, sizeGuide,
  } = body as ProductBody

  const videoResult = normalizeVideoUrl(rawVideoUrl)
  if ('error' in videoResult) {
    return NextResponse.json({ error: videoResult.error }, { status: 400 })
  }
  const parsedLeadTime = leadTimeDays !== null && leadTimeDays !== undefined && String(leadTimeDays).trim() !== ''
    ? Math.min(120, Math.max(1, parseInt(String(leadTimeDays)) || 0)) || null
    : null

  // Distinguish "seller submitted the variants section" (key present, even
  // as []) from "this caller doesn't know about variants at all" (key
  // absent) -- only the former should touch existing variant rows, so a
  // future partial-update caller can never silently wipe a seller's
  // colour/size options just by not mentioning them.
  const variantsProvided = 'variants' in body
  const variantResult = normalizeVariants(rawVariants)
  if ('error' in variantResult) {
    return NextResponse.json({ error: variantResult.error }, { status: 400 })
  }
  const variants = variantResult.variants

  if (rulesAccepted !== true) {
    return NextResponse.json({ error: 'You must confirm this listing complies with the Seller Rules and Product Compliance Policy.' }, { status: 400 })
  }

  // Immediate hard-reject check for antiques/artifacts and CITES-adjacent
  // materials -- see the matching check in POST above for why this is
  // enforced at submission time as well as in the auto-moderate cron.
  const prohibitedOnEdit = checkProhibitedListingContent(name, description, materials, makerStory)
  if (prohibitedOnEdit.blocked) {
    return NextResponse.json({ error: prohibitedListingReason(prohibitedOnEdit) }, { status: 400 })
  }

  // See the matching check in POST above -- Velor is the platform, sellers
  // promote through Velor, not their own business or contact details.
  const contactOnEdit = checkMessageContent(`${name} ${description || ''} ${makerStory || ''} ${materials || ''}`)
  if (contactOnEdit.blocked) {
    return NextResponse.json(
      { error: "Listings can't include email addresses, phone numbers, or social/messaging handles -- Velor is the platform, sellers promote through Velor, not their own contact details." },
      { status: 400 }
    )
  }

  // originCountry is mandatory here too -- see the matching check in POST
  // above; an edit cannot clear the origin country any more than a new
  // listing can be created without one.
  if (!name || !category || price === null || !originCountry) {
    return NextResponse.json({ error: 'name, category, price, and origin country are required' }, { status: 400 })
  }
  if (weightGrams === null || weightGrams === undefined || lengthCm === null || lengthCm === undefined || widthCm === null || widthCm === undefined || heightCm === null || heightCm === undefined) {
    return NextResponse.json({ error: 'weight and dimensions are required' }, { status: 400 })
  }


  const parsedPrice = parseFloat(String(price))
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
  }

  const validImages = Array.isArray(images) ? images.filter(isValidImage) : []
  if (validImages.length < 3) {
    return NextResponse.json({ error: 'Please add at least 3 product images' }, { status: 400 })
  }

  // Same derived-total rule as POST above: once a listing has variants,
  // Product.stock just mirrors their sum for display -- checkout is
  // authoritative against the variant rows themselves.
  const productStock = variantsProvided && variants.length > 0
    ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : Math.max(0, parseInt(String(stock || 0)))

  const product = await prisma.product.update({
    where: { id },
    data: {
      title: String(name).trim(),
      description: String(description || '').trim(),
      price: parsedPrice,
      stock: productStock,
      category: String(category).trim(),
      images: validImages,
      tags: Array.isArray(tags)
        ? tags.filter((t: unknown) => typeof t === 'string')
        : [],
      weightGrams: weightGrams !== null ? Number(weightGrams) : null,
      lengthCm: lengthCm !== null ? Number(lengthCm) : null,
      widthCm: widthCm !== null ? Number(widthCm) : null,
      heightCm: heightCm !== null ? Number(heightCm) : null,
      hsCode: hsCode || null,
      originCountry: originCountry || null,
      isHandmade: !!isHandmade,
      makerStory: makerStory || null,
      materials: materials ? String(materials).trim() : null,
      // One-way latch: once a product is on the certificate track it cannot
      // be taken off it by the seller unticking the box on a later edit --
      // only admin review can clear requiresCertificate.
      requiresCertificate: existing.requiresCertificate || !!containsRegulatedMaterial,
      videoUrl: videoResult.videoUrl,
      madeToOrder: !!madeToOrder,
      leadTimeDays: madeToOrder ? parsedLeadTime : null,
      sizeGuide: sizeGuide ? String(sizeGuide).trim().slice(0, 4000) || null : null,
      // Replace the variant set wholesale on every edit that includes the
      // variants key. This intentionally mints new ProductVariant ids each
      // time rather than diffing/reusing old ones -- simple and safe,
      // because OrderItem never holds a live foreign key to a variant (see
      // the schema comment): a past order's variantId/color/size is a
      // permanent snapshot, so old variant rows disappearing here can never
      // corrupt order history. The only edge case is a variant sitting in
      // an unpaid buyer's cart at the exact moment the seller edits -- the
      // checkout re-resolution in app/api/stripe/payment-intent/route.ts
      // treats a since-removed variant as no longer available rather than
      // erroring the whole checkout.
      ...(variantsProvided
        ? { variants: { deleteMany: {}, create: variants.map((v) => ({ label: v.label ?? null, color: v.color, size: v.size, stock: v.stock, priceOverride: v.priceOverride, sku: v.sku })) } }
        : {}),
    },
  })

  return NextResponse.json({ product })
}

// William, 2026-07-27: sellers previously had no way to fully remove a
// listing -- only edit it. A listing that has never been ordered (e.g. a
// test listing, or one created by mistake) is safe to hard-delete outright.
// A listing with real order history CANNOT be hard-deleted: OrderItem.product
// has no cascade/set-null (deliberately -- past orders must always resolve
// to a real product row for receipts, disputes, and returns), so Postgres
// would reject that delete with a foreign-key violation. For that case we
// fall back to the same DELISTED status admins already use (see
// app/api/admin/products/route.ts) -- it immediately hides the listing from
// the storefront/buyers, which is what "remove" means to a seller in
// practice, while keeping order history intact.
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing || existing.sellerId !== seller.id) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const orderCount = await prisma.orderItem.count({ where: { productId: id } })

  if (orderCount === 0) {
    // Never been ordered -- fully removable. Variants, certificates,
    // reviews and wishlist entries cascade-delete with it (see schema.prisma);
    // any Message referencing it has productId set to null instead of
    // failing, so buyer/seller message history is preserved.
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ ok: true, mode: 'deleted' })
  }

  await prisma.product.update({ where: { id }, data: { status: 'DELISTED' } })
  return NextResponse.json({
    ok: true,
    mode: 'delisted',
    message: 'This listing has order history, so it has been delisted instead of deleted -- it is hidden from buyers, but its record is kept for past orders, receipts, and disputes.',
  })
}
