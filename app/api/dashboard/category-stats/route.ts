import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  if (!category) {
    return NextResponse.json({ count: 0, avgPrice: 0, medianPrice: 0 })
    }

  const products = await prisma.product.findMany({
    where: { category, status: 'APPROVED' },
    select: { price: true },
    orderBy: { price: 'asc' },
    })

  const count = products.length
  if (count === 0) {
    return NextResponse.json({ count: 0, avgPrice: 0, medianPrice: 0 })
    }

  const prices = products.map(p => p.price)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / count
  const mid = Math.floor(count / 2)
  const medianPrice = count % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid]

  return NextResponse.json({ count, avgPrice, medianPrice })
  }
