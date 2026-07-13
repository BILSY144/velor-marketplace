import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { orderId } = await params

  // IDOR fix: this used to be a plain findUnique by id, so ANY signed-in
  // buyer could view ANY other buyer's order (items, prices, shipping
  // address) just by knowing or guessing an order id -- being logged in was
  // enough, ownership was never checked. Always scope to the session's own
  // email, same convention as GET /api/orders.
  const sessionEmail = session.user.email.toLowerCase().trim();
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerEmail: sessionEmail },
    include: {
      items: true,
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  return NextResponse.json({ order })
}
