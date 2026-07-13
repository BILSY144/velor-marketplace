// Turning an approved application into a real seller account.
//
// This logic used to live only inside the admin PATCH handler. It is extracted
// here so the automated 24-hour review cron and a human admin take exactly the
// same path -- there is no "fast path" that skips account provisioning or the
// notification emails.

import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import {
  sendEmail,
  buildSellerApprovedEmail,
  buildSellerRejectedEmail,
  buildNewSellerAlertEmail,
} from '@/lib/email'

const DIRECTOR_EMAIL = 'willsinclair144@gmail.com'
const ACTIVATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

interface ApplicationRow {
  id: string
  businessName: string
  contactEmail: string
  contactName: string
  storeDescription: string | null
  country: string | null
  status: string
  // Ship-from address captured on the application form. Optional here only
  // to tolerate PENDING applications submitted before this field existed --
  // provisionSellerShippingProfile() below no-ops if the required pieces
  // are missing rather than throwing, so an old application can still be
  // approved (the seller just has to fill in Settings -> Shipping manually,
  // same as before this change).
  shippingName?: string | null
  shippingCompany?: string | null
  shippingStreet1?: string | null
  shippingStreet2?: string | null
  shippingCity?: string | null
  shippingState?: string | null
  shippingZip?: string | null
  shippingCountry?: string | null
  shippingPhone?: string | null
}

/**
 * Create the seller's SellerShippingProfile from their application's
 * ship-from address, if they gave one. Called once, right after a Seller
 * row is created or attached during approval -- by the time an approved
 * seller reaches their dashboard, real shipping rates already work for
 * them; they never have to discover a "Settings -> Shipping" step on their
 * own, and app/api/shipping/rates/route.ts never has to fall back to a
 * placeholder quote for a founding seller's very first listing.
 *
 * Deliberately a plain upsert with no throw on missing data: an application
 * submitted before the ship-from fields existed on the form has nothing to
 * seed with, and that must not block approval. dashboard/products/route.ts
 * has its own belt-and-suspenders check that requires a shipping profile
 * before a product can be listed at all, which is what actually catches
 * that legacy case.
 */
async function provisionSellerShippingProfile(sellerId: string, app: ApplicationRow) {
  if (!app.shippingName || !app.shippingStreet1 || !app.shippingCity || !app.shippingZip || !app.shippingCountry) {
    return
  }
  await prisma.sellerShippingProfile.upsert({
    where: { sellerId },
    create: {
      sellerId,
      name: app.shippingName,
      company: app.shippingCompany || null,
      street1: app.shippingStreet1,
      street2: app.shippingStreet2 || null,
      city: app.shippingCity,
      state: app.shippingState || null,
      zip: app.shippingZip,
      country: app.shippingCountry,
      phone: app.shippingPhone || null,
    },
    // If a profile somehow already exists (re-approval of an already-seller
    // application, see the existingUser?.seller branch below), leave it
    // alone rather than overwrite whatever the seller may have since edited
    // themselves in Settings -> Shipping.
    update: {},
  })
}

/**
 * Approve an application: mark it approved, provision the User + Seller rows,
 * email the seller (with an activation link if they have no credentials yet),
 * and alert the director. Idempotent-ish: refuses anything not PENDING.
 */
export async function approveApplication(application: ApplicationRow, reviewedBy: string) {
  if (application.status !== 'PENDING') {
    throw new Error(`Cannot approve an application with status ${application.status}`)
  }
  const now = new Date()

  const updated = await prisma.sellerApplication.update({
    where: { id: application.id },
    data: { status: 'APPROVED', reviewedAt: now, reviewedBy },
  })

  const existingUser = await prisma.user.findUnique({
    where: { email: application.contactEmail },
    include: { seller: true },
  })

  // Founding-seller eligibility: the first approved seller from a given
  // country, decided once, here, at approval. This only makes the seller
  // ELIGIBLE -- the perks themselves do not activate until they list their
  // first product (lib/founding.ts).
  const foundingEligible = application.country
    ? !(await prisma.seller.findFirst({ where: { country: application.country, foundingEligible: true } }))
    : false

  let activationLink: string | undefined
  let alertTier = 'STARTER'
  let alertStoreName = application.businessName
  let alertSignedUpAt = now

  if (existingUser?.seller) {
    // Already a seller (re-approval or duplicate application). Do not create a
    // second account; just make sure they are marked approved.
    if (!existingUser.seller.approved) {
      await prisma.seller.update({
        where: { id: existingUser.seller.id },
        data: { approved: true },
      })
    }
    await provisionSellerShippingProfile(existingUser.seller.id, application)
    alertTier = existingUser.seller.tier
    alertStoreName = existingUser.seller.storeName
    alertSignedUpAt = existingUser.seller.createdAt
  } else if (existingUser) {
    // Existing buyer account with no seller profile: attach a Seller row.
    const seller = await prisma.seller.create({
      data: {
        userId: existingUser.id,
        storeName: application.businessName,
        description: application.storeDescription ?? undefined,
        country: application.country ?? undefined,
        approved: true,
        foundingEligible,
      },
    })
    await provisionSellerShippingProfile(seller.id, application)
    alertTier = seller.tier
    alertStoreName = seller.storeName
    alertSignedUpAt = seller.createdAt
  } else {
    // Brand new account. No password yet -- send a one-time activation link.
    const setupToken = randomBytes(32).toString('hex')
    const created = await prisma.user.create({
      data: {
        name: application.contactName,
        email: application.contactEmail,
        password: null,
        role: 'SELLER',
        setupToken,
        setupTokenExpiresAt: new Date(now.getTime() + ACTIVATION_WINDOW_MS),
        seller: {
          create: {
            storeName: application.businessName,
            description: application.storeDescription ?? undefined,
            country: application.country ?? undefined,
            approved: true,
            foundingEligible,
          },
        },
      },
      include: { seller: true },
    })
    if (created.seller) {
      await provisionSellerShippingProfile(created.seller.id, application)
    }
    activationLink = `https://velorcommerce.store/activate?token=${setupToken}`
    alertTier = created.seller?.tier ?? 'STARTER'
    alertStoreName = created.seller?.storeName ?? application.businessName
    alertSignedUpAt = created.seller?.createdAt ?? now
  }

  const { subject, html } = buildSellerApprovedEmail({
    sellerName: application.contactName,
    storeName: application.businessName,
    activationLink,
  })

  await Promise.allSettled([
    sendEmail({ to: application.contactEmail, subject, html }),
    sendEmail({
      to: DIRECTOR_EMAIL,
      ...buildNewSellerAlertEmail({
        name: application.contactName,
        email: application.contactEmail,
        storeName: alertStoreName,
        tier: alertTier,
        signedUpAt: alertSignedUpAt,
      }),
    }),
  ])

  return updated
}

/** Reject an application with a required, seller-facing reason. */
export async function rejectApplication(application: ApplicationRow, reason: string, reviewedBy: string) {
  if (application.status !== 'PENDING') {
    throw new Error(`Cannot reject an application with status ${application.status}`)
  }
  const trimmed = String(reason).trim()
  if (!trimmed) throw new Error('reason is required for rejection')

  const updated = await prisma.sellerApplication.update({
    where: { id: application.id },
    data: {
      status: 'REJECTED',
      rejectionReason: trimmed,
      reviewedAt: new Date(),
      reviewedBy,
    },
  })

  const { subject, html } = buildSellerRejectedEmail({
    contactName: application.contactName,
    businessName: application.businessName,
    reason: trimmed,
  })
  await sendEmail({ to: application.contactEmail, subject, html })

  return updated
}
