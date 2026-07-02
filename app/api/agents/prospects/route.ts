import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') return null;
  return session;
}

const ALLOWED_UPDATE_FIELDS = ['status', 'notes', 'email', 'score'] as const;

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = 50;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const [prospects, total] = await Promise.all([
    prisma.sellerProspect.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        outreachLogs: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.sellerProspect.count({ where }),
  ]);

  return NextResponse.json({ prospects, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, platform, storeUrl, email, category, score, country, sellerType, notes } = body;

  if (!name || !platform || !storeUrl || !category || !sellerType) {
    return NextResponse.json(
      { error: 'name, platform, storeUrl, category, and sellerType are required' },
      { status: 400 }
    );
  }

  const prospect = await prisma.sellerProspect.create({
    data: {
      name: String(name).trim(),
      platform: String(platform).trim(),
      storeUrl: String(storeUrl).trim(),
      email: email ? String(email).trim() : null,
      category: String(category).trim(),
      score: typeof score === 'number' ? Math.min(100, Math.max(0, score)) : 50,
      country: country ? String(country).trim() : null,
      sellerType: String(sellerType).trim(),
      notes: notes ? String(notes).trim() : null,
      status: 'prospected',
    },
  });

  return NextResponse.json({ prospect }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const sanitized: Record<string, unknown> = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (field in updates) {
      sanitized[field] = updates[field];
    }
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const prospect = await prisma.sellerProspect.update({
    where: { id: String(id) },
    data: sanitized,
  });

  return NextResponse.json({ prospect });
}