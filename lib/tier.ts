// Enterprise retired 2026-07-15 -- Pro now includes everything Enterprise
// used to offer (see prisma/schema.prisma's SellerTier enum comment). The
// ENTERPRISE enum value is kept only so legacy Seller rows written before
// the retirement never fail to load; every seller-facing surface is
// supposed to treat it as an alias for PRO.
//
// 2026-07-16 readiness audit finding: that aliasing was implemented
// ad-hoc per call site (`tier === 'PRO' || tier === 'ENTERPRISE'`) for
// FEATURE GATING, which mostly worked, but nothing normalized the raw
// VALUE itself before it reached the client. So any seller whose DB row
// still literally says tier: 'ENTERPRISE' saw a distinct gold "Enterprise"
// badge/theme throughout the dashboard instead of Pro's blue one --
// exactly backwards from "Enterprise no longer exists as a plan."
//
// Call this at the boundary where a seller-facing API route reads
// seller.tier from Prisma and hands it to the client, so the client only
// ever sees 'STARTER' | 'PRO' and never has to special-case 'ENTERPRISE'
// itself. Internal admin/pulse tooling (app/api/admin/pulse-*) intentionally
// does NOT use this -- it needs the raw legacy value for data-hygiene
// auditing (e.g. finding which rows still need a one-time cleanup).
export function normalizeSellerTier(tier: string | null | undefined): 'STARTER' | 'PRO' {
  return tier === 'PRO' || tier === 'ENTERPRISE' ? 'PRO' : 'STARTER'
}
