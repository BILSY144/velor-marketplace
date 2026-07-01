import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const FORBIDDEN_PATTERNS = [
  /weapon|gun|knife|blade|explosive|bomb/i,
  /adult|porn|xxx/i,
  /drug|narcotic|steroid/i,
  /counterfeit|fake|replica|knockoff/i,
  /tobacco|cigarette|vape|nicotine/i,
  /alcohol|liquor|spirits|wine|beer/i,
]

const SUSPICIOUS_PRICE_MULTIPLIER = 10
const MIN_PRICE = 0.01
const MAX_PRICE = 50000

function moderateProduct(product: {
  title: string
  description: string | null
  price: number
  images: string[]
}): { approved: boolean; reason?: string } {
  // Check forbidden patterns in title
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(product.title)) {
      return { approved: false, reason: `Forbidden pattern in title: ${pattern}` }
    }
  }

  // Check forbidden patterns in description
  if (product.description) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(product.description)) {
        return { approved: false, reason: `Forbidden pattern in description: ${pattern}` }
      }
    }
  }

  // Price sanity checks
  if (product.price < MIN_PRICE) {
    return { approved: false, reason: `Price too low: ${product.price}` }
  }
  if (product.price > MAX_PRICE) {
    return { approved: false, reason: `Price too high: ${product.price}` }
  }

  // Must have at least one image
  if (!product.images || product.images.length === 0) {
    return { approved: false, reason: 'No images provided' }
  }

  // Title length check
  if (product.title.length < 3) {
    return { approved: false, reason: 'Title too short' }
  }
  if (product.title.length > 200) {
    return { approved: false, reason: 'Title too long' }
  }

  return { approved: true }
}

export async function POST(request: NextRequest) {
  // Verify CRON_SECRET
  const secret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all products pending review
    const pending = await prisma.product.findMany({
      where: { status: 'PENDING_REVIEW' },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        images: true,
      },
    })

    const results = { approved: 0, rejected: 0, errors: 0 }

    for (const product of pending) {
      try {
        const { approved, reason } = moderateProduct({
          title: product.title,
          description: product.description,
          price: product.price,
          images: product.images,
        })

        await prisma.product.update({
          where: { id: product.id },
          data: { status: approved ? 'APPROVED' : 'REJECTED' },
        })

        if (approved) {
          results.approved++
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
