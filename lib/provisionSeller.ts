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
      },
    })
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
          },
        },
      },
      include: { seller: true },
    })
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
