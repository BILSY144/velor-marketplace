import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateApiKey } from '@/lib/apiKey'

const MAX_ACTIVE_KEYS = 5

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  if (seller.tier !== 'ENTERPRISE') {
    return NextResponse.json({ error: 'API access is available on the Enterprise plan' }, { status: 403 })
    }

  const keys = await prisma.apiKey.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
      },
    })

  return NextResponse.json({ keys })
  }

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  if (seller.tier !== 'ENTERPRISE') {
    return NextResponse.json({ error: 'API access is available on the Enterprise plan' }, { status: 403 })
    }

  const activeCount = await prisma.apiKey.count({
    where: { sellerId: seller.id, revokedAt: null },
    })

  if (activeCount >= MAX_ACTIVE_KEYS) {
    return NextResponse.json({ error: `Maximum of ${MAX_ACTIVE_KEYS} active API keys reached. Revoke one before creating another.` }, { status: 400 })
    }

  let body: { name?: string } = {}
  try {
    body = await req.json()
    } catch {
    body = {}
    }

  const name = body.name?.trim() || 'API key'
  const { key, keyPrefix, hashedKey } = generateApiKey()

  const created = await prisma.apiKey.create({
    data: {
      sellerId: seller.id,
      name,
      keyPrefix,
      hashedKey,
      },
    })

  return NextResponse.json({
    key,
    id: created.id,
    name: created.name,
    keyPrefix: created.keyPrefix,
    createdAt: created.createdAt,
    })
  }

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing key id' }, { status: 400 })

  const existingKey = await prisma.apiKey.findUnique({ where: { id } })
  if (!existingKey || existingKey.sellerId !== seller.id) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
    })

  return NextResponse.json({ ok: true })
  }
