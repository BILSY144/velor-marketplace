'use client';

// Seller application -- 4-step wizard.
//
// Rebuilt 2026-08-01: William connected Claude directly with the ChatGPT
// conversation ("Seller Sign Up Redesign") where he and ChatGPT had already
// worked out the visual spec for this page. ChatGPT is Creative Director
// (design tokens, copy, layout, build order); this recreates that spec as
// real, typed, responsive React/Tailwind components directly in the
// production Next.js app -- see components/seller-application/ -- rather
// than the earlier approach (this same file, prior version) of using
// design-step1..4.png as a literal pixel background with controls overlaid
// on top. That version is preserved in git history if it's ever needed
// again; William, ChatGPT and Claude agreed together to switch to a full
// component recreation instead (2026-08-01).
//
// Build order per ChatGPT's brief: Step 1 (About You) first, shown for
// approval before Steps 2-4 (Your Store / Shipping / Finish) are built out.
import SellerApplication from '@/components/seller-application/SellerApplication';

export default function ApplyPage() {
  return <SellerApplication />;
}
