import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCronSecret } from '@/lib/cronAuth'
import { checkProhibitedListingContent, prohibitedListingReason } from '@/lib/prohibitedListingContent'
import { grantCountryFounderIfFirst } from '@/lib/founding'
import { FORBIDDEN_PATTERNS, REGULATED_SIGNALS } from '@/lib/listingModeration'

// NOTE (William, 2026-07-26): "i want every listing to be approved
// automatically. so they dont wait for approval. then once listed we will
// review for banned products... that is how ebay do it." Since
// app/api/dashboard/products/route.ts now auto-approves a clean listing
// the instant it's created, this cron no longer sees ordinary listings at
// all -- only the narrow set that stays in PENDING_REVIEW on purpose (the
// certificate track, or an undeclared regulated-material signal caught at
// creation) plus any legacy row from before that change. It's the backstop
// that eventually resolves those, not the normal path any more.
// FORBIDDEN_PATTERNS/REGULATED_SIGNALS now live in lib/listingModeration.ts
// (shared with the creation route) so the two lists never drift apart.

const MIN_PRICE = 0.01
const MAX_PRICE = 50000

function moderateProduct(product: {
  title: string
  description: string | null
  price: number
  images: string[]
  materials: string | null
}): { verdict: 'approve' | 'reject' | 'hold'; reason?: string } {
  const text = [product.title, product.description || '', product.materials || ''].join(' ')

  // Antiques/artifacts and CITES-adjacent hard-reject materials -- shared
  // with the immediate check in app/api/dashboard/products/route.ts so
  // there is only one list to keep current. See lib/prohibitedListingContent.ts.
  const prohibited = checkProhibitedListingContent(product.title, product.description, product.materials)
  if (prohibited.blocked) {
    return { verdict: 'reject', reason: prohibitedListingReason(prohibited) }
  }
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(product.title)) {
      return { verdict: 'reject', reason: `Forbidden pattern in name: ${pattern}` }
    }
  }
  if (product.description) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(product.description)) {
        return { verdict: 'reject', reason: `Forbidden pattern in description: ${pattern}` }
      }
    }
  }
  if (product.price < MIN_PRICE) {
    return { verdict: 'reject', reason: `Price too low: ${product.price}` }
  }
  if (product.price > MAX_PRICE) {
    return { verdict: 'reject', reason: `Price too high: ${product.price}` }
  }
  if (!product.images || product.images.length === 0) {
    return { verdict: 'reject', reason: 'No images provided' }
  }
  if (product.title.length < 3) {
    return { verdict: 'reject', reason: 'Name too short' }
  }
  if (product.title.length > 200) {
    return { verdict: 'reject', reason: 'Name too long' }
  }
  // Undeclared regulated-material signal: do not approve automatically --
  // leave in PENDING_REVIEW for a human to decide whether it needs the
  // certificate track.
  for (const pattern of REGULATED_SIGNALS) {
    if (pattern.test(text)) {
      return { verdict: 'hold', reason: `Possible regulated material, needs human review: ${pattern}` }
    }
  }
  return { verdict: 'approve' }
}

export async function GET(request: NextRequest) {
  const authError = requireCronSecret(request)
  if (authError) return authError
  try {
    const pending = await prisma.product.findMany({
      where: { status: 'PENDING_REVIEW' },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        images: true,
        materials: true,
        sellerId: true,
        originCountry: true,
        requiresCertificate: true,
      },
    })
    const results = { approved: 0, rejected: 0, heldForCertificate: 0, heldForReview: 0, errors: 0 }
    for (const product of pending) {
      try {
        // Certificate-gated listings are NEVER auto-approved: they stay in
        // PENDING_REVIEW until a human verifies the permit documents in the
        // certificate review queue and approves manually.
        if (product.requiresCertificate) {
          results.heldForCertificate++
          continue
        }
        const { verdict, reason } = moderateProduct({
          title: product.title,
          description: product.description,
          price: product.price,
          images: product.images,
          materials: product.materials,
        })
        if (verdict === 'hold') {
          results.heldForReview++
          console.log(`Held product ${product.id} for human review: ${reason}`)
          continue
        }
        await prisma.product.update({
          where: { id: product.id },
          data: { status: verdict === 'approve' ? 'APPROVED' : 'REJECTED' },
        })
        if (verdict === 'approve') {
          results.approved++
          await grantCountryFounderIfFirst(product.sellerId, product.id, product.originCountry)
        } else {
          results.rejected++
          console.log(`Auto-rejected product ${product.id}: ${reason}`)
        }
      } catch (err) {
        results.errors++
        console.error(`Error moderating product ${product.id}:`, err)
      }
    }
    return NextResponse.json({
      success: true,
      processed: pending.length,
      ...results,
    })
  } catch (error) {
    console.error('Auto-moderation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
