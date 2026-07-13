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
      prospectId,
      // Ship-from address -- required for every new application so
      // provisionSeller.ts can create a real SellerShippingProfile at
      // approval time, before the seller ever lists a product. See the
      // schema comment on SellerApplication for why this exists.
      shippingName,
      shippingCompany,
      shippingStreet1,
      shippingStreet2,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      shippingPhone,
    } = body;

    if (
      !businessName ||
      !contactEmail ||
      !contactName ||
      !Array.isArray(productCategories) ||
      productCategories.length === 0
    ) {
      return NextResponse.json(
        { error: 'businessName, contactEmail, contactName and productCategories are required' },
        { status: 400 }
      );
    }

    if (!shippingName || !shippingStreet1 || !shippingCity || !shippingZip || !shippingCountry) {
      return NextResponse.json(
        {
          error:
            'Ship-from address is required: shippingName, shippingStreet1, shippingCity, shippingZip and shippingCountry.',
        },
        { status: 400 }
      );
    }

    const application = await prisma.sellerApplication.create({
      data: {
        businessName,
        contactEmail,
        contactName,
        storeDescription: storeDescription ?? null,
        website: website ?? null,
        productCategories,
        sampleImages: Array.isArray(sampleImages) ? sampleImages : [],
        country: country ?? null,
        prospectId: prospectId ?? null,
        shippingName,
        shippingCompany: shippingCompany || null,
        shippingStreet1,
        shippingStreet2: shippingStreet2 || null,
        shippingCity,
        shippingState: shippingState || null,
        shippingZip,
        shippingCountry,
        shippingPhone: shippingPhone || null,
      },
    });

    const { subject, html } = buildApplicationReceivedEmail({
      contactName,
      businessName,
      applicationId: application.id,
    });

    await sendEmail({ to: contactEmail, subject, html });

    return NextResponse.json({ success: true, applicationId: application.id }, { status: 201 });
  } catch (error) {
    console.error('[seller/apply]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
