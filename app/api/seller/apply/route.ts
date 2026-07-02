import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, buildApplicationReceivedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      contactEmail,
      contactName,
      storeDescription,
      website,
      productCategories,
      sampleImages,
      country,
    } = body;

    if (!businessName || !contactEmail || !contactName) {
      return NextResponse.json(
        { error: 'businessName, contactEmail, and contactName are required' },
        { status: 400 }
      );
    }

    const application = await prisma.sellerApplication.create({
      data: {
        businessName: String(businessName).trim(),
        contactEmail: String(contactEmail).trim().toLowerCase(),
        contactName: String(contactName).trim(),
        storeDescription: storeDescription ? String(storeDescription).trim() : null,
        website: website ? String(website).trim() : null,
        productCategories: Array.isArray(productCategories) ? productCategories.map(String) : [],
        sampleImages: Array.isArray(sampleImages) ? sampleImages.map(String) : [],
        country: country ? String(country).trim() : null,
        status: 'PENDING',
      },
    });

    const { subject, html } = buildApplicationReceivedEmail({
      contactName: application.contactName,
      businessName: application.businessName,
      applicationId: application.id,
    });

    await sendEmail({ to: application.contactEmail, subject, html });

    return NextResponse.json(
      { success: true, applicationId: application.id },
      { status: 201 }
    );
  } catch (err) {
    console.error('[apply] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}