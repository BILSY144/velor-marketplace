import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProductDetail } from '@/lib/cj'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// One-off repricing tool for the 3 Pet Supplies pilot products.
// CORRECTED per William: shipping is quoted live and charged separately at
// checkout via Shippo -- it must NEVER be folded into the item price.
// Price = item cost + 30% margin ONLY, rounded to the nearest CENT (2dp),
// never to the nearest whole currency unit (whole-unit ceiling was
// over-inflating margin on sub-$5 items, e.g. $0.70 -> $1.00, a ~43% markup).
// This undoes the earlier (incorrect) shipping-inclusive reprice.
// Delete this route after running once.
export async function GET() {
  const targets = [
    { id: 'cmr9fzq260005w54wuqdl228o', cjProductId: '2509180719571602300', cjVid: '2509180719571602500' },
    { id: 'cmr9fzq1z0003w54wca4t382e', cjProductId: '2411300828541613100', cjVid: '2411300828541613300' },
    { id: 'cmr9fzq1m0001w54wuh24chp2', cjProductId: '2507230543351619600', cjVid: '2507230543361610700' },
  ]

  const results = []
  for (const t of targets) {
    try {
      const detail = await getProductDetail(t.cjProductId)
      await sleep(1100)
      const variant = detail.variants.find((v: { vid: string }) => v.vid === t.cjVid) || detail.variants[0]
      const cost = parseFloat(variant.variantSellPrice)

      const newPrice = Math.ceil(cost * 1.3 * 100) / 100

      const before = await prisma.product.findUnique({ where: { id: t.id }, select: { price: true, title: true } })
      await prisma.product.update({ where: { id: t.id }, data: { price: newPrice } })

      results.push({ id: t.id, title: before?.title, oldPrice: before?.price, itemCost: cost, newPrice })
    } catch (err) {
      results.push({ id: t.id, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ ok: true, results })
}
