import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface ImportVariant {
  vid: string
  sku?: string
  key?: string
  price?: string
  image?: string
}

interface ImportItem {
  pid: string
  vid: string
  name: string
  description: string
  computedPrice: number
  images: string[]
  variants?: ImportVariant[]
  category: string
  supplierName?: string | null
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function stripEmoji(input: string): string {
  return input.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()
}

// Velor has no ProductVariant/color-selector model or UI today (confirmed --
// zero 'variant' references anywhere in app/**/*.tsx). Until that is built as
// its own feature, real CJ colour/style options are surfaced two ways so
// nothing is silently dropped: (1) every real product image -- including
// colour-swatch photos -- goes into Product.images so buyers can see the full
// range in the gallery, and (2) the real option names are listed in the
// description text. The listing itself is fulfilled using the first variant
// real vid/price, matching what actually gets ordered from CJ.
function buildDescription(rawDescription: string, variants?: ImportVariant[]): string {
  const base = stripEmoji(stripHtml(rawDescription))
  const optionNames = (variants || [])
    .map((v) => v.key || v.sku)
    .filter((v): v is string => Boolean(v))
  const uniqueOptions = Array.from(new Set(optionNames))
  if (uniqueOptions.length > 1) {
    return (base + '\n\nAvailable options: ' + uniqueOptions.join(', ')).trim()
  }
  return base
}

export async function POST(request: NextRequest) {
  try {
    const { sellerId, items } = (await request.json()) as { sellerId: string; items: ImportItem[] }
    if (!sellerId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'sellerId and items[] required' }, { status: 400 })
    }
    const created = []
    const skipped = []
    for (const item of items) {
      const existing = await prisma.product.findFirst({ where: { cjProductId: item.pid, sellerId } })
      if (existing) {
        skipped.push({ pid: item.pid, reason: 'already imported', productId: existing.id })
        continue
      }
      // Defense-in-depth: cj-candidates already filters these out before they
      // reach this route, but reject here too in case items are ever posted
      // from another source. No variant/colour picker UI exists on the
      // buyer-facing pages, and this route always fulfils using item.vid
      // (the first variant) -- letting a multi-option item through risks
      // shipping a different colour/design than the one implied in the listing.
      const uniqueOptionKeys = new Set(
        (item.variants || []).map((v) => v.key || v.sku).filter(Boolean)
      )
      if (uniqueOptionKeys.size > 1) {
        skipped.push({ pid: item.pid, reason: 'multi-option product -- no variant picker UI exists' })
        continue
      }
      const title = stripEmoji(item.name).slice(0, 200)
      const description = buildDescription(item.description, item.variants).slice(0, 4000)
      const images = Array.from(new Set((item.images || []).filter(Boolean)))
      const product = await prisma.product.create({
        data: {
          sellerId,
          title,
          description: description || null,
          price: item.computedPrice,
          images,
          category: item.category,
          tags: [],
          stock: 999,
          status: 'APPROVED',
          cjSourced: true,
          cjProductId: item.pid,
          cjVid: item.vid,
          // Real CJ supplier name only -- never fall back to a fabricated
          // name. Empty/undefined stays null; the product page falls back
          // to an honest "CJ Dropshipping" label in that case.
          cjSupplierName: item.supplierName || null,
          // Real CJ variant rows (vid + colour/style + image + real sell
          // price per variant) -- NOT squashed into description text.
          // checkFreight() and the variant picker both need a real vid per
          // colour, not just the one representative vid on the product row.
          variants: item.variants && item.variants.length
            ? {
                create: item.variants
                  .filter((v) => v.vid)
                  .map((v) => ({
                    cjVid: v.vid,
                    color: v.key || null,
                    sku: v.sku || null,
                    image: v.image || null,
                    sellPrice: v.price ? Number(v.price) : null,
                  })),
              }
            : undefined,
        },
      })
      created.push({ pid: item.pid, productId: product.id, title, imageCount: images.length })
    }
    return NextResponse.json({ ok: true, createdCount: created.length, skippedCount: skipped.length, created, skipped })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}


// One-off admin utility: reassign a CJ-imported product to a different
// (already-resolved) internal seller. Used to correct a product that was
// imported under the shared "CJ Dropshippers" fallback before its real CJ
// supplier name was resolved into its own seller record.
export async function PATCH(request: NextRequest) {
  try {
    const { productId, sellerId } = (await request.json()) as { productId: string; sellerId: string }
    if (!productId || !sellerId) {
      return NextResponse.json({ ok: false, error: 'productId and sellerId are required' }, { status: 400 })
    }
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } })
    if (!seller) {
      return NextResponse.json({ ok: false, error: 'seller not found' }, { status: 404 })
    }
    const updated = await prisma.product.update({ where: { id: productId }, data: { sellerId } })
    return NextResponse.json({ ok: true, productId: updated.id, sellerId: updated.sellerId })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
