import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { productId, quantity, buyerEmail } = body;
    if (!productId || !quantity || !buyerEmail) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Order received. Payment processing coming soon.', orderId: `ord_${Date.now()}` });
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
���