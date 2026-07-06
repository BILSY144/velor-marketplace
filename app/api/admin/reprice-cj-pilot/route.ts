import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProductDetail, checkFreight } from '@/lib/cj'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const WORLDWIDE_BASKET = ['US', 'GB', 'DE', 'AU', 'JP', 'AE', 'BR', 'ZA']

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// One-off repricing tool for the 3 Pet Supplies pilot products imported
// before the shipping-cost-inclusive margin fix (commit fixing cj-candidates).
// Recomputes correct price (item cost + max worldwide shipping) * 1.3 and
// updates the live Product rows directly. Delete this route after running once.
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
      const cost = parseFloat(variant.variantSellPrice || detail.sellPrice)

      let maxShippingCost = 0
      for (const country of WORLDWIDE_BASKET) {
        const freightOptions = await checkFreight(t.cjVid, 1, country)
        await sleep(1100)
        if (freightOptions.length > 0) {
          maxShippingCost = Math.max(maxShippingCost, freightOptions[0].logisticPrice)
        }
      }

      const totalCost = cost + maxShippingCost
      const newPrice = Math.ceil(totalCost * 1.3)

      const before = await prisma.product.findUnique({ where: { id: t.id }, select: { price: true, title: true } })
      await prisma.product.update({ where: { id: t.id }, data: { price: newPrice } })

      results.push({
        id: t.id,
        title: before?.title,
        oldPrice: before?.price,
        itemCost: cost,
        maxShippingCost,
        totalCost,
        newPrice,
      })
    } catch (err) {
      results.push({ id: t.id, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ ok: true, results })
}
