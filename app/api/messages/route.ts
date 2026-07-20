import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkMessageContent } from '@/lib/messageFilter';
import { displayIdentities } from '@/lib/messageIdentity';

// Privacy rule (2026-07-20): responses from this API never include email
// addresses, and every name is a display identity -- store name for sellers,
// "First L." for buyers -- resolved server-side via lib/messageIdentity.ts.

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    include: {
      sender: { select: { id: true, image: true } },
      receiver: { select: { id: true, image: true } },
      product: { select: { id: true, title: true, images: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const names = await displayIdentities(
    messages.flatMap((m) => [m.senderId, m.receiverId]).concat(user.id)
  );

  // format=raw: the flat message list the buyer inbox (app/messages/page.tsx)
  // builds its threads from. The default shape below is the conversation
  // summary list the seller dashboard uses. Both consumers existed before
  // 2026-07-20 but only the dashboard shape was actually served -- the buyer
  // inbox tried to parse an array out of an object and always rendered empty.
  const { searchParams } = new URL(req.url);
  if (searchParams.get('format') === 'raw') {
    return NextResponse.json(
      messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt,
        sender: { id: m.sender.id, name: names.get(m.sender.id) ?? 'Velor member', image: m.sender.image },
        receiver: { id: m.receiver.id, name: names.get(m.receiver.id) ?? 'Velor member', image: m.receiver.image },
        product: m.product
          ? { id: m.product.id, name: m.product.title, images: m.product.images }
          : null,
      }))
    );
  }

  const seen = new Map<string, {
    conversationId: string;
    otherUser: { id: string; name: string };
    product: { id: string; title: string } | null;
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
        otherUser: { id: otherUser.id, name: names.get(otherUser.id) ?? 'Velor member' },
        product: msg.product ? { id: msg.product.id, title: msg.product.title } : null,
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

  const body = await req.json() as {
    receiverId?: string;
    sellerId?: string;
    productId?: string;
    content?: string;
  };
  const { receiverId, sellerId, productId, content } = body;

  // The product page's "Message seller" button only knows the Seller-table id
  // (product.sellerId), not the seller's User id -- resolve it here. Before
  // 2026-07-20 the API silently required receiverId, so every buyer-initiated
  // message 400'd and no conversation could ever start.
  let receiverUserId = receiverId ?? null;
  if (!receiverUserId && sellerId) {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: { userId: true },
    });
    receiverUserId = seller?.userId ?? null;
  }

  if (!receiverUserId || !content?.trim()) {
    return NextResponse.json({ error: 'receiverId and content required' }, { status: 400 });
  }
  if (receiverUserId === user.id) {
    return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverUserId } });
  if (!receiver) return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });

  const check = checkMessageContent(content);
  if (check.blocked) {
    return NextResponse.json({ error: check.reason, violations: check.violations }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: user.id,
      receiverId: receiverUserId,
      productId: productId ?? null,
      content: content.trim(),
      isRead: false,
    },
    include: {
      sender: { select: { id: true, image: true } },
      receiver: { select: { id: true, image: true } },
    },
  });

  const names = await displayIdentities([message.senderId, message.receiverId]);

  return NextResponse.json({
    message: {
      ...message,
      sender: { id: message.sender.id, name: names.get(message.sender.id) ?? 'Velor member', image: message.sender.image },
      receiver: { id: message.receiver.id, name: names.get(message.receiver.id) ?? 'Velor member', image: message.receiver.image },
    },
    currentUserId: user.id,
  });
}
