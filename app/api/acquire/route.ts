import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, buyerEmail } = body;
    if (!productId || !quantity || !buyerEmail) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Order received. Payment processing coming soon.', orderId: `ord_${Date.now()}` });
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
