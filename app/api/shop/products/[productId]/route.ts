import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeListingDiscount } from '@/lib/discount'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params

  const product = await prisma.product.findFirst({
    where: { id: productId, status: 'APPROVED' },
    include: {
      seller: {
        select: {
          id: true,
          storeName: true,
          description: true,
          country: true,
          currency: true,
          createdAt: true,
          storeLogo: true,
          tier: true,
          sellerBadge: true,
          foundingBadge: true,
          countryFounded: { select: { countryName: true } },
          // Real, approved-only listing count -- the previous unfiltered
          // _count.products included PENDING_REVIEW/REJECTED rows too, which
          // would have overstated an active catalogue size on the storefront
          // trust card added 2026-07-25 (William: "serious work" PDP upgrade).
          _count: { select: { products: { where: { status: 'APPROVED' } } } },
        },
      },
      // 2026-07-28: variants were stored by the dashboard since 2026-07-27
      // but never returned to the storefront -- the PDP's option buttons had
      // no data. Now included and mapped below to the shape the PDP renders.
      variants: { orderBy: { createdAt: 'asc' } },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { name: true, image: true } },
        },
      },
      _count: { select: { reviews: true } },
    },
  })

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0

  // Automatic discount preview — same rules and same numbers checkout will
  // actually charge, so what the buyer sees here is what they pay.
  const now = new Date()
  const codes = await prisma.discountCode.findMany({
    where: { sellerId: product.seller.id, isActive: true },
  })
  const discount = computeListingDiscount(codes, product.id, product.price, now)

  // Seller trust-card stats (2026-07-25, William: PDP redesign -- "a whole
  // lot more than just basic"). Every number here is computed live from real
  // rows, never fabricated -- LAW #1. totalSales counts real paid OrderItems
  // across every product this seller has ever listed (not just this one);
  // sellerAvgRating/sellerReviewCount aggregate Reviews across the seller's
  // whole catalogue, matching what a buyer would find by visiting the actual
  // storefront at /seller/[sellerId].
  // productSoldAgg + wishlistCount (2026-07-28 PDP additions, William-approved
  // Amazon-comparison pass): per-PRODUCT social proof under the same LAW #1
  // rule as everything else here -- computed live from real OrderItem /
  // WishlistItem rows, never fabricated; the client renders them only when
  // they are genuinely > 0.
  const [totalSalesAgg, sellerReviewAgg, productSoldAgg, wishlistCount] = await Promise.all([
    prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        product: { sellerId: product.seller.id },
        order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
      where: { product: { sellerId: product.seller.id } },
    }),
    prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        productId: product.id,
        order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      },
    }),
    prisma.wishlistItem.count({ where: { productId: product.id } }),
  ])

  const sellerStats = {
    totalSales: totalSalesAgg._sum.quantity ?? 0,
    approvedProductCount: product.seller._count.products,
    avgRating: sellerReviewAgg._count._all > 0 ? Math.round((sellerReviewAgg._avg.rating ?? 0) * 10) / 10 : null,
    reviewCount: sellerReviewAgg._count._all,
    memberSinceYear: new Date(product.seller.createdAt).getFullYear(),
  }

  return NextResponse.json({
    ...product,
    // Flat reviewCount alongside the existing _count.reviews shape -- the PDP
    // client has always read product.reviewCount directly (a pre-existing
    // field expectation that the raw Prisma `...product` spread never
    // actually satisfied, since Prisma nests it under _count.reviews; fixed
    // here rather than silently left to render "undefined reviews").
    reviewCount: product._count.reviews,
    // PDP option shape: display name from label (generic options) or
    // colour/size; price falls back to the base listing price when the
    // seller set no per-option override.
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.label || [v.color, v.size].filter(Boolean).join(' / ') || 'Option',
      // Raw dimensions so the PDP can render separate Colour / Size pickers
      // (William, 2026-07-28: "when the buyer picks a size or colour it can
      // then add to the cart") instead of one combined button per row.
      label: v.label ?? null,
      color: v.color ?? null,
      size: v.size ?? null,
      price: v.priceOverride ?? product.price,
      stock: v.stock,
      image: v.images[0] ?? null,
      // Full photo set for this option (2026-07-28, William: up to 6 photos
      // per version) -- the PDP leads the gallery with these when the buyer
      // picks this option. `image` above stays for cart-line thumbnails.
      images: v.images,
    })),
    avgRating: Math.round(avgRating * 10) / 10,
    discountedPrice: discount?.discountedPriceGBP ?? null,
    percentOff: discount?.percentOff ?? null,
    sellerStats,
    soldCount: productSoldAgg._sum.quantity ?? 0,
    wishlistCount,
  })
}
