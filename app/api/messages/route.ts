import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// POST /api/messages — buyer sends a message to a seller about a product
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, sellerId, content } = body;

    if (!productId || !sellerId || !content?.trim()) {
      return NextResponse.json({ error: 'productId, sellerId, and content are required' }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    // Prevent messaging yourself
    if (sellerId === session.user.id) {
      return NextResponse.json({ error: 'Cannot send a message to yourself' }, { status: 400 });
    }

    // Verify product exists and belongs to the seller
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, sellerId: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Product does not belong to the specified seller' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: sellerId,
        productId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
        product: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/messages?productId=X&sellerId=Y — fetch a thread between buyer and seller on a product
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const sellerId = searchParams.get('sellerId');

    if (!productId || !sellerId) {
      return NextResponse.json({ error: 'productId and sellerId are required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Fetch all messages in this thread (between the two parties about this product)
    const messages = await prisma.message.findMany({
      where: {
        productId,
        OR: [
          { senderId: userId, receiverId: sellerId },
          { senderId: sellerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Mark unread messages sent to the current user as read
    await prisma.message.updateMany({
      where: {
        productId,
        senderId: sellerId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[GET /api/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
