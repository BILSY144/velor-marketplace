import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      status: 'APPROVED',
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 8,
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
      category: true,
      seller: {
        select: {
          id: true,
          businessName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const results = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.images[0] ?? null,
    category: p.category,
    sellerId: p.seller.id,
    sellerName: p.seller.businessName,
  }));

  return NextResponse.json({ results });
}
