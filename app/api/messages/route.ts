import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const seen = new Map<string, {
    conversationId: string;
    otherUser: { id: string; name: string | null; email: string };
    product: { id: string; name: string } | null;
    lastMessage: { content: string; createdAt: Date; senderId: string };
    unreadCount: number;
  }>();

  for (const msg of messages) {
    const otherUser = msg.senderId === user.id ? msg.receiver : msg.sender;
    const pid = msg.productId ?? 'none';
    const key = [...[user.id, otherUser.id].sort(), pid].join('__');

    if (!seen.has(key)) {
      seen.set(key, {
        conversationId: [user.id, otherUser.id].sort().join('_'),
        otherUser: { id: otherUser.id, name: otherUser.name, email: otherUser.email },
        product: msg.product ?? null,
        lastMessage: { content: msg.content, createdAt: msg.createdAt, senderId: msg.senderId },
        unreadCount: 0,
      });
    }

    if (!msg.isRead && msg.receiverId === user.id) {
      seen.get(key)!.unreadCount++;
    }
  }

  return NextResponse.json({
    currentUserId: user.id,
    conversations: Array.from(seen.values()),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json() as { receiverId?: string; productId?: string; content?: string };
  const { receiverId, productId, content } = body;

  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: 'receiverId and content required' }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      senderId: user.id,
      receiverId,
      productId: productId ?? null,
      content: content.trim(),
      isRead: false,
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ message, currentUserId: user.id });
}
