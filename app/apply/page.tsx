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
//
// Server Component (2026-08-01, William's request): the wizard's "founding
// seats" copy used to say a hardcoded "190 founding seats, all still open",
// which went stale the moment the first CountryFounder row was created.
// This now reads the live remaining count server-side via
// getAvailableFoundingSeatCount() (lib/founding.ts) and passes it down as a
// prop, so the number on screen always matches the database.
import SellerApplication from '@/components/seller-application/SellerApplication';
import { getAvailableFoundingSeatCount, getFoundedCountryCodes } from '@/lib/founding';

// Forces this page to run fresh on every request instead of being statically
// generated once at build time -- without this, Next.js could bake in
// whatever seat count happened to exist at build time and serve that same
// stale number to every visitor afterwards, defeating the point of making it
// live.
export const dynamic = 'force-dynamic';

export default async function ApplyPage() {
  // 2026-08-xx: also fetched live so Step 2's Founding Seller Badge panel
  // can stop offering the badge once the applicant's chosen shipping
  // country already has a founder (see getFoundedCountryCodes, lib/founding.ts).
  const [foundingSeatsAvailable, foundedCountryCodes] = await Promise.all([
    getAvailableFoundingSeatCount(),
    getFoundedCountryCodes(),
  ]);
  return <SellerApplication foundingSeatsAvailable={foundingSeatsAvailable} foundedCountryCodes={foundedCountryCodes} />;
}
