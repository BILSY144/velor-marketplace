import type { MetadataRoute } from 'next';

// Extended 2026-07-14 by the standing SEO agent: a repo-wide check of every
// top-level route under app/ against this existing disallow list found four
// real, live, session- or token-gated pages that were NOT covered by any of
// the existing rules and had no per-page `robots: noindex` of their own
// either (all four are 'use client' pages with no metadata export, so a
// per-page noindex isn't an option the way it was for e.g. /unsubscribe or
// /apply/invited): `/account` and `/account/wishlist` (both verified via
// `useSession`/`status === 'unauthenticated'` redirect logic -- an
// unauthenticated crawler sees only a loading/redirect state, never real
// content), `/messages` (same `useSession` redirect pattern, private
// buyer/seller DMs), `/activate` (a tokenized account-activation link,
// `?token=` from an email, same reached-only-via-private-link profile
// already established as noindex-worthy for `/unsubscribe` and
// `/apply/invited`), and `/setup-admin` (a public, unauthenticated form
// that POSTs to `/api/setup-admin` to create an admin account -- has no
// visible secret gate in the frontend, so from a crawl-and-index
// standpoint this must never be discoverable via search, independent of
// whatever the API route's own auth does). None of the four appear in
// sitemap.xml (checked) and none are linked from GlobalHeader/GlobalFooter
// (checked). No trailing slash used, matching the existing `/orders`
// convention, so each rule also blocks its own bare path plus any query
// string (e.g. `/activate?token=...`) and future subroutes, not just
// nested paths. Deliberately NOT added: `/auth/sign-in` and
// `/auth/sign-up` -- unlike the four above these are public, ungated forms
// with a real (if generic) content purpose, and whether login/signup pages
// should be indexable is a judgment call, not a clear-cut privacy/thin-
// content case -- flagged in SEO_LOG.md instead of decided here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/checkout/',
          '/orders',
          '/account',
          '/messages',
          '/activate',
          '/setup-admin',
        ],
      },
    ],
    sitemap: 'https://velorcommerce.store/sitemap.xml',
  };
}
