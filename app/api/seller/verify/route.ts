import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Velor Marketplace <customerservice@velorcommerce.co.uk>';
const ADMIN_EMAIL = 'customerservice@velorcommerce.co.uk';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    include: { verification: true },
  });

  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

  const v = seller.verification;
  return NextResponse.json({
    status: v?.status ?? 'NOT_SUBMITTED',
    submittedAt: v?.submittedAt,
    reviewedAt: v?.reviewedAt,
    notes: v?.verificationNotes,
    businessName: v?.businessName,
    idType: v?.idType,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true, name: true } }, verification: true },
  });

  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

  if (seller.verification?.status === 'APPROVED') {
    return NextResponse.json({ error: 'Verification already approved' }, { status: 400 });
  }

  const body = await request.json();
  const { fullLegalName, dateOfBirth, nationality, idType, idDocumentUrl, businessName, businessType, businessRegNumber, businessCountry, taxId, businessDocUrl } = body;

  if (!fullLegalName || !dateOfBirth || !nationality || !idType || !idDocumentUrl) {
    return NextResponse.json({ error: 'Personal identity fields are required' }, { status: 400 });
  }

  const verification = await prisma.sellerVerification.upsert({
    where: { sellerId: seller.id },
    update: { status: 'PENDING', fullLegalName, dateOfBirth, nationality, idType, idDocumentUrl, businessName: businessName || null, businessType: businessType || null, businessRegNumber: businessRegNumber || null, businessCountry: businessCountry || null, taxId: taxId || null, businessDocUrl: businessDocUrl || null, verificationNotes: null, submittedAt: new Date(), reviewedAt: null },
    create: { sellerId: seller.id, status: 'PENDING', fullLegalName, dateOfBirth, nationality, idType, idDocumentUrl, businessName: businessName || null, businessType: businessType || null, businessRegNumber: businessRegNumber || null, businessCountry: businessCountry || null, taxId: taxId || null, businessDocUrl: businessDocUrl || null, submittedAt: new Date() },
  });

  if (seller.user?.email) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [seller.user.email],
      subject: 'Verification submitted - Velor Marketplace',
      html: '<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;"><h2 style="font-size:18px;font-weight:700;color:#111;">Verification received</h2><p style="color:#555;line-height:1.6;">We have received your verification documents. Our team will review them within 1-2 business days. You will receive an email once the review is complete.</p><p style="color:#999;font-size:12px;margin-top:32px;">Velor Marketplace - customerservice@velorcommerce.co.uk</p></div>',
    });
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [ADMIN_EMAIL],
    subject: 'New seller verification - ' + seller.storeName,
    html: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;"><h2 style="font-size:18px;font-weight:700;">New KYC submission</h2><p>Store: ' + seller.storeName + '</p><p>Email: ' + (seller.user?.email ?? '') + '</p><p>Legal name: ' + fullLegalName + '</p><p>ID type: ' + idType + '</p><p><a href="https://velorcommerce.store/admin/verifications/' + verification.id + '">Review in admin</a></p></div>',
  });

  return NextResponse.json({ success: true, status: 'PENDING' });
}
