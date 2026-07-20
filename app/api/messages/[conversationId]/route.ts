import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { displayIdentities } from '@/lib/messageIdentity';

// Privacy rule (2026-07-20): never send the other party's email address to
// the client; names are display identities (store name for sellers, masked
// "First L." for buyers) resolved via lib/messageIdentity.ts.

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { conversationId } = await params;
  const userIds = conversationId.split('_');

  if (userIds.length !== 2 || !userIds.includes(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const otherUserId = userIds.find((id) => id !== user.id)!;
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: user.id },
      ],
      ...(productId ? { productId } : {}),
    },
    include: {
      sender: { select: { id: true, image: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Mark received messages as read
  await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: user.id,
      isRead: false,
      ...(productId ? { productId } : {}),
    },
    data: { isRead: true },
  });

  const names = await displayIdentities([user.id, otherUserId]);

  return NextResponse.json({
    messages: messages.map((m) => ({
      ...m,
      sender: {
        id: m.sender.id,
        name: names.get(m.sender.id) ?? 'Velor member',
        image: m.sender.image,
      },
    })),
    currentUserId: user.id,
    otherUser: { id: otherUserId, name: names.get(otherUserId) ?? 'Velor member' },
  });
}
