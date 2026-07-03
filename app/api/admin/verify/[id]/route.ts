import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Velor Marketplace <noreply@velorcommerce.store>';

// GET — get one verification by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const verification = await prisma.sellerVerification.findUnique({
    where: { id },
    include: {
      seller: {
        include: {
          user: { select: { email: true, name: true } },
        },
      },
    },
  });

  if (!verification) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(verification);
}

// PATCH — approve or reject a verification
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action, notes } = body as { action: 'approve' | 'reject'; notes?: string };

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
  }

  const verification = await prisma.sellerVerification.findUnique({
    where: { id },
    include: {
      seller: {
        include: {
          user: { select: { email: true, name: true } },
        },
      },
    },
  });

  if (!verification) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

  const updated = await prisma.sellerVerification.update({
    where: { id },
    data: {
      status: newStatus,
      verificationNotes: notes ?? null,
      reviewedAt: new Date(),
    },
  });

  if (action === 'approve') {
    await prisma.seller.update({
      where: { id: verification.sellerId },
      data: { approved: true },
    });
  }

  const sellerEmail = verification.seller.user?.email;
  const sellerName = verification.seller.user?.name ?? verification.seller.storeName;

  if (sellerEmail) {
    if (action === 'approve') {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [sellerEmail],
        subject: 'Your Velor Marketplace verification is approved',
        html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f8f8f8;margin:0;padding:40px 20px;"><div style="max-width:560px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);"><div style="background:#0f0f0f;padding:32px 40px;"><p style="color:white;font-size:22px;font-weight:700;margin:0;">Velor Marketplace</p></div><div style="padding:40px;"><h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 16px;">Your account is verified</h1><p style="color:#555;line-height:1.6;margin:0 0 20px;">Hi ${sellerName},</p><p style="color:#555;line-height:1.6;margin:0 0 24px;">Great news — your identity verification has been approved. You can now list products on Velor Marketplace.</p><a href="https://velorcommerce.store/dashboard" style="display:inline-block;background:#7c3aed;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Go to dashboard</a><hr style="border:none;border-top:1px solid #eee;margin:32px 0;"/><p style="color:#999;font-size:12px;margin:0;">Questions? <a href="mailto:customerservice@velorcommerce.co.uk" style="color:#7c3aed;">customerservice@velorcommerce.co.uk</a></p></div></div></body></html>`,
      });
    } else {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [sellerEmail],
        subject: 'Update required: Velor Marketplace verification',
        html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f8f8f8;margin:0;padding:40px 20px;"><div style="max-width:560px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);"><div style="background:#0f0f0f;padding:32px 40px;"><p style="color:white;font-size:22px;font-weight:700;margin:0;">Velor Marketplace</p></div><div style="padding:40px;"><h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 16px;">Verification update required</h1><p style="color:#555;line-height:1.6;margin:0 0 20px;">Hi ${sellerName},</p><p style="color:#555;line-height:1.6;margin:0 0 16px;">We were unable to complete your verification with the documents submitted. Please review the notes below and resubmit.</p>${notes ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px;margin-bottom:24px;"><p style="color:#991b1b;font-size:14px;margin:0;">${notes}</p></div>` : ''}<a href="https://velorcommerce.store/dashboard/verify" style="display:inline-block;background:#111;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Resubmit verification</a><hr style="border:none;border-top:1px solid #eee;margin:32px 0;"/><p style="color:#999;font-size:12px;margin:0;">Questions? <a href="mailto:customerservice@velorcommerce.co.uk" style="color:#7c3aed;">customerservice@velorcommerce.co.uk</a></p></div></div></body></html>`,
      });
    }
  }

  return NextResponse.json({ success: true, status: newStatus, id: updated.id });
}
