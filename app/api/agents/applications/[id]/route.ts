import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { randomBytes } from 'crypto';
import { sendEmail, buildSellerApprovedEmail, buildSellerRejectedEmail, buildNewSellerAlertEmail } from '@/lib/email';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') return null;
  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const application = await prisma.sellerApplication.findUnique({
    where: { id: (await params).id },
  });

  if (!application) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ application });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, reason } = body;

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
  }

  const application = await prisma.sellerApplication.findUnique({
    where: { id: (await params).id },
  });

  if (!application) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (application.status !== 'PENDING') {
    return NextResponse.json(
      { error: `Cannot ${action} an application with status ${application.status}` },
      { status: 400 }
    );
  }

  const reviewerEmail = (session.user as { email?: string }).email ?? 'admin';
  const now = new Date();

  if (action === 'approve') {
    const updated = await prisma.sellerApplication.update({
      where: { id: (await params).id },
      data: { status: 'APPROVED', reviewedAt: now, reviewedBy: reviewerEmail },
    });

    // Provision the actual seller account. This is the only place this
    // pipeline converts an approved application into a real User+Seller
    // row -- previously this step did not exist at all (approval only
    // sent an email; no account was ever created).
    const existingUser = await prisma.user.findUnique({
      where: { email: application.contactEmail },
      include: { seller: true },
    });

    let activationLink: string | undefined;
    let alertTier = 'STARTER';
    let alertStoreName = application.businessName;
    let alertSignedUpAt = now;

    if (existingUser?.seller) {
      // Already a seller (rare -- e.g. re-approved or duplicate application).
      // Don't create a duplicate account; just make sure they're marked approved.
      if (!existingUser.seller.approved) {
        await prisma.seller.update({
          where: { id: existingUser.seller.id },
          data: { approved: true },
        });
      }
      alertTier = existingUser.seller.tier;
      alertStoreName = existingUser.seller.storeName;
      alertSignedUpAt = existingUser.seller.createdAt;
      // No activation link -- they already have credentials.
    } else if (existingUser) {
      // Existing user (e.g. a buyer account) with no seller profile yet --
      // attach a Seller row to their existing account. No new credentials needed.
      const seller = await prisma.seller.create({
        data: {
          userId: existingUser.id,
          storeName: application.businessName,
          description: application.storeDescription ?? undefined,
          country: application.country ?? undefined,
          approved: true,
        },
      });
      alertTier = seller.tier;
      alertStoreName = seller.storeName;
      alertSignedUpAt = seller.createdAt;
    } else {
      // Brand new account. No password yet -- send a one-time activation
      // link so the seller sets their own password.
      const setupToken = randomBytes(32).toString('hex');
      const setupTokenExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const created = await prisma.user.create({
        data: {
          name: application.contactName,
          email: application.contactEmail,
          password: null,
          role: 'SELLER',
          setupToken,
          setupTokenExpiresAt,
          seller: {
            create: {
              storeName: application.businessName,
              description: application.storeDescription ?? undefined,
              country: application.country ?? undefined,
              approved: true,
            },
          },
        },
        include: { seller: true },
      });

      activationLink = `https://velorcommerce.store/activate?token=${setupToken}`;
      alertTier = created.seller?.tier ?? 'STARTER';
      alertStoreName = created.seller?.storeName ?? application.businessName;
      alertSignedUpAt = created.seller?.createdAt ?? now;
    }

    const { subject, html } = buildSellerApprovedEmail({
      sellerName: application.contactName,
      storeName: application.businessName,
      activationLink,
    });

    await Promise.allSettled([
      sendEmail({ to: application.contactEmail, subject, html }),
      sendEmail({
        to: 'willsinclair144@gmail.com',
        ...buildNewSellerAlertEmail({
          name: application.contactName,
          email: application.contactEmail,
          storeName: alertStoreName,
          tier: alertTier,
          signedUpAt: alertSignedUpAt,
        }),
      }),
    ]);

    return NextResponse.json({ application: updated });
  }

  if (action === 'reject') {
    if (!reason) {
      return NextResponse.json({ error: 'reason is required for rejection' }, { status: 400 });
    }

    const updated = await prisma.sellerApplication.update({
      where: { id: (await params).id },
      data: {
        status: 'REJECTED',
        rejectionReason: String(reason).trim(),
        reviewedAt: now,
        reviewedBy: reviewerEmail,
      },
    });

    const { subject, html } = buildSellerRejectedEmail({
      contactName: application.contactName,
      businessName: application.businessName,
      reason: String(reason).trim(),
    });
    await sendEmail({ to: application.contactEmail, subject, html });

    return NextResponse.json({ application: updated });
  }
}
