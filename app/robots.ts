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
//
// Extended 2026-07-15 by the standing SEO agent (full-audit re-run): found
// one more route with the exact same tokenized-private-link profile already
// established above for `/activate`. `/auth/reset` is a password-reset
// landing page reached only via a per-user `?token=...` query string that
// `app/api/auth/forgot/route.ts` mints and emails (`${BASE}/auth/reset?
// token=${raw}` -- confirmed by reading that route directly); the token is
// single-use and expires in one hour per the page's own on-screen copy. A
// repo-wide grep found zero internal `<Link>`/`<a>` anywhere in `app/` or
// `components/` pointing at `/auth/reset` -- the only other reference in the
// codebase is the API route building the emailed URL. It was not in
// `sitemap.xml`, had no per-page `robots: noindex` of its own (`'use
// client'`, no metadata export, same constraint as `/activate`), and was
// missing from this disallow list. `/auth/forgot` (the public request form
// one step before it) is deliberately left alone here, same reasoning as
// `/auth/sign-in`/`/auth/sign-up` -- it is a public, ungated, real-content
// form, not a private tokenized link, so it stays a judgment call rather
// than a clear-cut fix.
//
// Extended 2026-07-16 by the standing SEO agent (backlog cycle, not a full
// audit -- found while checking routes added since the prior full audit).
// `app/auth/error/page.tsx` was added the same day (commit 52b601ab, "Site-
// wide readiness fixes") to give NextAuth's `pages: { error: '/auth/error' }`
// config (confirmed in `auth.ts`) a real page instead of a default 404 --
// it only exists as a landing spot for a failed sign-in redirect. Same
// profile already established above for `/activate` and `/auth/reset`:
// `'use client'`, no metadata export, zero internal `<Link>`/`<a>` anywhere
// in `app/` or `components/` pointing at it (confirmed via repo-wide grep --
// the only other reference in the codebase is `auth.ts`'s own config), not
// in `sitemap.xml`, and not previously in this disallow list. Unlike
// `/auth/sign-in`/`/auth/sign-up`/`/auth/forgot` (public, ungated forms with
// real content, left as judgment calls above), this page has no independent
// content purpose for an organic visitor to land on -- it exists purely to
// catch an auth-flow failure state, the same "reached only via a flow
// redirect, nothing for a crawler to do here" reasoning as `/auth/reset`.
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
          '/auth/reset',
          '/auth/error',
        ],
      },
    ],
    sitemap: 'https://velorcommerce.store/sitemap.xml',
  };
}
