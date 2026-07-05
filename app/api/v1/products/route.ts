import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { hashApiKey } from '@/lib/apiKey'

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 50

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)

  if (!match) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header. Use: Authorization: Bearer <api_key>' },
      { status: 401 }
      )
    }

  const rawKey = match[1].trim()
  const hashedKey = hashApiKey(rawKey)

  const apiKey = await prisma.apiKey.findUnique({ where: { hashedKey } })
  if (!apiKey || apiKey.revokedAt) {
    return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })
    }

  const seller = await prisma.seller.findUnique({ where: { id: apiKey.sellerId } })
  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

  if (seller.tier !== 'ENTERPRISE') {
    return NextResponse.json({ error: 'API access requires the Enterprise plan' }, { status: 403 })
    }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
    })

  const { searchParams } = new URL(req.url)
  const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)
  const limit = Math.min(Math.max(Number.isNaN(limitParam) ? DEFAULT_LIMIT : limitParam, 1), MAX_LIMIT)
  const cursor = searchParams.get('cursor') || undefined

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      compareAt: true,
      images: true,
      category: true,
      tags: true,
      stock: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      },
    })

  const nextCursor = products.length === limit ? products[products.length - 1].id : null

  return NextResponse.json({
    data: products,
    pagination: {
      limit,
      nextCursor,
      },
    })
  }
