import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
price: true,
stock: true,
status: true,
category: true,
images: true,
createdAt: true,
_count: { select: { orderItems: true } },
},
},
},
})

if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })

const products = seller.products.map((p) => ({ ...p, sales: p._count.orderItems }))
return NextResponse.json({ products })
}

// An image is either an externally-hosted URL, or an uploaded photo stored as a
// compressed data URL (see resizeAndCompressImage in the Add Product form).
function isValidImage(u: unknown): u is string {
return typeof u === 'string' && (u.startsWith('http') || u.startsWith('data:image/'))
}

export async function POST(req: NextRequest) {
const session = await auth()
if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
if (!seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 403 })
if (!seller.approved) {
return NextResponse.json({ error: 'Seller account pending approval' }, { status: 403 })
}

const LISTING_LIMITS: Record<string, number | null> = { STARTER: 50, PRO: null, ENTERPRISE: null }
const sellerTier = (seller as any).tier ?? 'STARTER'
const listingLimit = LISTING_LIMITS[sellerTier]
if (listingLimit !== null) {
const listingCount = await prisma.product.count({ where: { sellerId: seller.id } })
if (listingCount >= listingLimit) {
return NextResponse.json({ error: 'Listing limit reached. Upgrade to Pro for unlimited listings.', upgradeRequired: true }, { status: 403 })
}
}

let body: Record<string, unknown>
try {
body = await req.json()
} catch {
return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
}

const { name, description, price, stock, category, images, tags } = body as {
name?: string
description?: string
price?: number
stock?: number
category?: string
images?: string[]
tags?: string[]
}

if (!name || !category || price == null) {
return NextResponse.json({ error: 'name, category, and price are required' }, { status: 400 })
}

const parsedPrice = parseFloat(String(price))
if (isNaN(parsedPrice) || parsedPrice <= 0) {
return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
}

const validImages = Array.isArray(images) ? images.filter(isValidImage) : []
if (validImages.length < 3) {
return NextResponse.json({ error: 'Please add at least 3 product images' }, { status: 400 })
}

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
status: 'PENDING_REVIEW',
},
})

return NextResponse.json({ product }, { status: 201 })
}
