import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/dashboard/messages — returns all message threads for the logged-in seller
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all messages involving this user as sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
        product: { select: { id: true, name: true, images: true } },
      },
    });

    // Group into threads keyed by productId + other party ID
    const threadMap = new Map<string, {
      threadKey: string;
      productId: string;
      productName: string;
      productImage: string | null;
      otherUserId: string;
      otherUserName: string | null;
      otherUserImage: string | null;
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
      messages: typeof messages;
    }>();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      const threadKey = [msg.productId, otherUser.id].sort().join(':');

      if (!threadMap.has(threadKey)) {
        threadMap.set(threadKey, {
          threadKey,
          productId: msg.productId,
          productName: msg.product.name,
          productImage: msg.product.images?.[0] ?? null,
          otherUserId: otherUser.id,
          otherUserName: otherUser.name,
          otherUserImage: otherUser.image,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
          messages: [],
        });
      }

      const thread = threadMap.get(threadKey)!;
      thread.messages.push(msg);

      // Count messages sent TO the current user that are unread
      if (msg.receiverId === userId && !msg.read) {
        thread.unreadCount++;
      }
    }

    const threads = Array.from(threadMap.values()).sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );

    const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

    return NextResponse.json({ threads, totalUnread });
  } catch (err) {
    console.error('[GET /api/dashboard/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/dashboard/messages — seller replies to a buyer message
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, productId, content } = body;

    if (!receiverId || !productId || !content?.trim()) {
      return NextResponse.json({ error: 'receiverId, productId, and content are required' }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    if (receiverId === session.user.id) {
      return NextResponse.json({ error: 'Cannot send a message to yourself' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        productId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/dashboard/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
