// Detects likely duplicate seller sign-ups: the SAME real-world business
// applying more than once under a DIFFERENT email.
//
// William found this live 2026-08-07 via Pulse: the Sellers list showed two
// separate, fully live storefronts both named "hushlume" -- same contact
// name (侯冲冲), same country and payout rail, approved the same day --
// under two different email addresses. Nothing in the pipeline ever caught
// it: lib/provisionSeller.ts's approveApplication() only dedupes an EXACT
// contactEmail match against an existing User ("Already a seller
// (re-approval or duplicate application). Do not create a second
// account."), which does nothing once a second email is involved. The
// automated hourly review cron (app/api/cron/review-applications) and the
// human "Approve" action in Pulse (app/api/agents/applications/[id]) both
// go straight from content screening (lib/sellerApplicationReview.ts's
// screenApplication, deliberately "pure and synchronous: no network, no
// database" per its own header) to provisioning a live account, with no
// step in between that ever compared one application against another or
// against an already-approved seller.
//
// This check needs the database, so it lives here rather than inside
// sellerApplicationReview.ts, and is deliberately conservative (LAW #1
// everywhere else in this codebase: never guess, hold anything ambiguous
// for a human). It only reports a match when BOTH the business name AND a
// hard identifier (the ship-from phone, or the exact street + postcode)
// agree -- so two unrelated sellers who happen to share a common store
// name are never wrongly flagged. A signal here is always a HOLD for a
// human to look at, never an automatic reject: a seller correcting a
// typo'd email by reapplying is a normal, legitimate case this must not
// punish.

import { prisma } from '@/lib/prisma'

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

export interface DuplicateCheckInput {
  businessName: string
  contactEmail: string
  shippingStreet1?: string | null
  shippingZip?: string | null
  shippingPhone?: string | null
}

export interface DuplicateSignal {
  reason: string
}

/**
 * Look for another PENDING or already-APPROVED application, or an existing
 * approved Seller, that is very likely the same real business as `input`
 * under a different email. Returns null when nothing matches, which is the
 * ordinary, expected case for the overwhelming majority of applications.
 */
export async function findDuplicateApplicant(
  input: DuplicateCheckInput,
  excludeApplicationId?: string
): Promise<DuplicateSignal | null> {
  const name = normalize(input.businessName)
  if (!name) return null

  const phone = normalizePhone(input.shippingPhone)
  const street = normalize(input.shippingStreet1)
  const zip = normalize(input.shippingZip)
  // Business name alone is too weak a signal on its own (common words,
  // transliterations, coincidental overlap) -- require at least one hard
  // identifier to also be present before we even look.
  if (!phone && !(street && zip)) return null

  const sameHardIdentifier = (otherPhone: string | null | undefined, otherStreet: string | null | undefined, otherZip: string | null | undefined) => {
    const op = normalizePhone(otherPhone)
    if (phone && op && phone === op) return 'ship-from phone'
    if (street && zip && normalize(otherStreet) === street && normalize(otherZip) === zip) return 'ship-from address'
    return null
  }

  // Other applications under a DIFFERENT email. REJECTED is excluded on
  // purpose -- a rejected applicant fixing something and reapplying is
  // normal, not a duplicate.
  const otherApplications = await prisma.sellerApplication.findMany({
    where: {
      id: excludeApplicationId ? { not: excludeApplicationId } : undefined,
      status: { in: ['PENDING', 'APPROVED'] },
      // NOT hoisted to the top level of `where`, rather than nested as
      // `contactEmail: { not: { equals, mode } }` -- Prisma's
      // NestedStringFilter (used inside a field-level `not`) does not carry
      // `mode` for this field/provider combination, only the top-level
      // StringFilter does. This failed the production build (TS2353,
      // "'mode' does not exist in type 'NestedStringFilter'") --
      // caught here after the fact; see the note left for William.
      NOT: { contactEmail: { equals: input.contactEmail, mode: 'insensitive' } },
    },
    select: {
      id: true,
      businessName: true,
      contactEmail: true,
      shippingStreet1: true,
      shippingZip: true,
      shippingPhone: true,
    },
  })

  for (const other of otherApplications) {
    if (normalize(other.businessName) !== name) continue
    const matchedOn = sameHardIdentifier(other.shippingPhone, other.shippingStreet1, other.shippingZip)
    if (matchedOn) {
      return {
        reason: `Same business name ("${input.businessName}") and ${matchedOn} as an existing application from ${other.contactEmail} (application ${other.id}). Needs a human to confirm this is not a duplicate account before approving.`,
      }
    }
  }

  // Already-approved sellers under a different email.
  const existingSellers = await prisma.seller.findMany({
    where: { storeName: { equals: input.businessName, mode: 'insensitive' } },
    select: {
      id: true,
      storeName: true,
      user: { select: { email: true } },
      shippingProfile: { select: { street1: true, zip: true, phone: true } },
    },
  })

  for (const seller of existingSellers) {
    if (normalize(seller.user.email) === normalize(input.contactEmail)) continue
    const sp = seller.shippingProfile
    if (!sp) continue
    const matchedOn = sameHardIdentifier(sp.phone, sp.street1, sp.zip)
    if (matchedOn) {
      return {
        reason: `Same business name ("${input.businessName}") and ${matchedOn} as an already-approved seller under ${seller.user.email} (seller ${seller.id}). Needs a human to confirm this is not a duplicate account before approving.`,
      }
    }
  }

  return null
}
