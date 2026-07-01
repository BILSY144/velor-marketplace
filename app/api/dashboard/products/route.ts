import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })
  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, price: true, currency: true, images: true, category: true, stock: true, status: true, createdAt: true }
  })
  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  const { name, description, price, currency, images, category, stock, tags } = body
  if (!name || !description || price === undefined || !category) {
    return NextResponse.json({ error: 'name, description, price, and category are required' }, { status: 400 })
  }
  const product = await prisma.product.create({
    data: {
      sellerId: seller.id, name: String(name), description: String(description),
      price: parseFloat(String(price)), currency: String(currency ?? 'GBP'),
      images: Array.isArray(images) ? images : [], category: String(category),
      stock: parseInt(String(stock ?? '0')), tags: Array.isArray(tags) ? tags : [],
      status: 'PENDING_REVIEW'
    }
  })
  return NextResponse.json({ product }, { status: 201 })
}