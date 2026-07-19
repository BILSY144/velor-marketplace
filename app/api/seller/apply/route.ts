import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendEmail, buildApplicationReceivedEmail } from '@/lib/email';

// The /apply form only asks for a bare domain now (William, 2026-07-19 --
// the old `type="url"` field forced sellers to type the full "https://"
// scheme themselves, which the browser's own validation rejected without
// it, and that confused people out of applying). Add the scheme back here,
// server-side, so app.website is still always a real absolute link -- the
// Pulse admin dashboard renders it as an <a href> and needs a scheme to not
// be treated as a path on velorcommerce.store.
function normalizeWebsite(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      businessName,
      contactEmail,
      contactName,
      password,
      sellerType,
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

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'A password of at least 8 characters is required.' },
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

    // Legal disclosure -- Velor's Seller Rules page tells buyers this is
    // always shown, because it changes their statutory consumer-protection
    // rights depending on whether they're buying from a business/trader or
    // a private individual. Required for every new application; see the
    // schema comment on Seller.sellerType for the full reasoning.
    if (sellerType !== 'individual' && sellerType !== 'business') {
      return NextResponse.json(
        { error: "Please select whether you're selling as an individual or as a registered business." },
        { status: 400 }
      );
    }

    // Hashed immediately, never held in a variable longer than needed and
    // never written to `application` as plaintext -- lib/provisionSeller.ts
    // copies this hash straight onto the User row it creates on approval.
    const passwordHash = await bcrypt.hash(password, 12);

    const application = await prisma.sellerApplication.create({
      data: {
        businessName,
        contactEmail,
        contactName,
        passwordHash,
        sellerType,
        storeDescription: storeDescription ?? null,
        website: normalizeWebsite(website),
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
