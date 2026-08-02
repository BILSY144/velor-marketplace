import type { Metadata } from 'next'

// New route, added 2026-08-02 per William's direction to build out the
// zero-budget visibility campaign. Fee figures for Etsy are sourced (see
// page.tsx comments); Velor figures are pulled from the live commission
// constant (PLATFORM_COMMISSION_RATE = 0.1 in app/api/stripe/payment-intent/
// route.ts) and 0% listing fees, both already true site-wide. Kept under
// Google's ~155-160 char SERP display limit per the standing SEO agent's
// established convention on other route layouts (see /founding/layout.tsx).
export const metadata: Metadata = {
  title: 'Etsy Alternative: Velor vs Etsy Fees Compared (2026)',
  description:
    'Flat 10% commission, no listing fees, no ad tax. See exactly how Velor’s fees compare to Etsy’s in 2026, with real sourced numbers.',
}

export default function EtsyComparisonLayout({ children }: { children: React.ReactNode }) {
  return children
}
