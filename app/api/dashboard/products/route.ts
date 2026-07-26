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
  } = body as ProductBody

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

  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      title: String(name).trim(),
      description: String(description || '').trim(),
      price: parsedPrice,
      stock: Math.max(0, parseInt(String(stock || 0))),
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
  } = body as ProductBody

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

  const parsedPrice = parseFloat(String(price))
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
  }

  const validImages = Array.isArray(images) ? images.filter(isValidImage) : []
  if (validImages.length < 3) {
    return NextResponse.json({ error: 'Please add at least 3 product images' }, { status: 400 })
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      title: String(name).trim(),
      description: String(description || '').trim(),
      price: parsedPrice,
      stock: Math.max(0, parseInt(String(stock || 0))),
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
    },
  })

  return NextResponse.json({ product })
}
