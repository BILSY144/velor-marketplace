// Shared seller status helper -- added 2026-07-23 alongside the schema fix
// for the "reject keeps coming back as pending" bug (see the schema.prisma
// comment on Seller.rejectedAt for the full root cause). `Seller.approved`
// remains the single field every other code path gates access on; these
// three helpers exist purely so the two admin surfaces (desktop
// /admin/sellers and Pulse /pulse/sellers) can show and act on a real
// PENDING / APPROVED / REJECTED / SUSPENDED status instead of collapsing
// "denied" and "never reviewed" into the same thing.

export type SellerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export function computeSellerStatus(s: {
  approved: boolean
  rejectedAt: Date | string | null
  suspendedAt: Date | string | null
}): SellerStatus {
  if (s.approved) return 'APPROVED'
  if (s.suspendedAt) return 'SUSPENDED'
  if (s.rejectedAt) return 'REJECTED'
  return 'PENDING'
}

// The exact Prisma `data` object for each action, shared by both PATCH
// routes so their behaviour can never drift apart again. `reason` is only
// meaningful for 'reject' (stored in rejectionReason); ignored otherwise.
export function sellerActionData(action: 'approve' | 'reject' | 'suspend', reason?: string | null) {
  if (action === 'approve') {
    return { approved: true, rejectedAt: null, rejectionReason: null, suspendedAt: null }
  }
  if (action === 'reject') {
    return { approved: false, rejectedAt: new Date(), rejectionReason: reason || null, suspendedAt: null }
  }
  // suspend
  return { approved: false, suspendedAt: new Date(), rejectedAt: null, rejectionReason: null }
}
