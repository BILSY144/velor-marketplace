import type { MetadataRoute } from 'next';
import { SPECIALITIES, specialitySlug } from '@/lib/specialities';
import { prisma } from '@/lib/prisma';
import { WORLD_COUNTRIES } from '@/lib/worldCountries';

// Forces this route to run per-request rather than being statically
// generated at build time (Next's default for a sitemap with no dynamic
// data). Required now that originCountryEntries below reads live product
// data from Prisma -- a build-time-only sitemap would freeze the set of
// indexed countries at whatever the catalogue looked like at the last
// deploy, silently going stale as sellers from new countries get approved.
export const dynamic = 'force-dynamic';

// Same origin-code normalisation as app/api/lattice/route.ts (duplicated
// rather than imported/centralised, matching this codebase's established
// convention -- e.g. SHOP_SEARCH_COUNTRY_ALIASES is already duplicated
// between GlobalHeader.tsx, /search, and /shop).
const nameToCode = new Map(WORLD_COUNTRIES.map((c) => [c.name.toLowerCase(), c.code]));
const codeSet = new Set(WORLD_COUNTRIES.map((c) => c.code));

function toCode(origin: string | null): string | null {
  if (!origin) return null;
  const v = origin.trim();
  if (v.length === 2 && codeSet.has(v.toUpperCase())) return v.toUpperCase();
  return nameToCode.get(v.toLowerCase()) ?? null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://velorcommerce.store';
  // Removed 2026-07-19 by the standing SEO agent: every entry below used to
  // carry `lastModified: now`, i.e. the exact moment this function last ran
  // (build time / request time for a dynamic route), on every single URL --
  // 20 static entries plus all 190 /origins/[slug] entries. That is not a
  // real "this page last changed on this date" signal, it is just "the
  // sitemap was generated now," and Google has said directly (Gary Illyes,
  // Search Off the Record, reported July 2026 by Search Engine Roundtable
  // and Digital Applied -- see SEO_LOG.md for citations) that a <lastmod>
  // Google can't trust as accurate is worse than no <lastmod> at all: it
  // trains Google to start ignoring the field for the whole site rather
  // than just discounting the one bad date. This codebase has no per-page
  // last-real-content-change tracking (no CMS timestamps, no git-derived
  // per-route dates wired into these objects), so there is no honest value
  // to put here -- omitting the field entirely (it's optional on
  // MetadataRoute.Sitemap) is the accurate choice, not a placeholder swap.
  // If real per-page modification timestamps become available later (e.g.
  // from a CMS or a tracked `updatedAt` column once the catalogue is real),
  // re-add `lastModified` sourced from that real data, not from `Date.now()`.
  // Fixed 2026-07-12 by the standing SEO agent: the previous list pointed
  // search engines at /sellers (no such route -- 404 live) and
  // /sell-on-velor (a redirect stub, not the canonical page), while omitting
  // /apply and /founding entirely -- the two most important seller-
  // recruitment pages while the catalogue is still near-empty and supply is
  // the bottleneck (see CLAUDE.md STANDING DIRECTIVES). Verified live routes
  // only; do not add a URL here that isn't a real, non-redirecting page.
  //
  // Extended 2026-07-13 by the standing SEO agent: a repo-wide grep of every
  // self-referencing `alternates.canonical` in the codebase (17 routes) found
  // 8 real, public, non-transactional pages that already carry their own
  // canonical (added by earlier SEO-agent runs on 2026-07-12/13) but were
  // never added here -- they simply postdate this file's last edit.
  // Confirmed each one is a genuinely public, indexable page (not a
  // one-time-token or confirmation page): /contact, /cookies, /live,
  // /legal/seller-rules, /marketplace (later redirected to /shop, see below),
  // /returns, /seller-agreement, /track.
  // Deliberately NOT added: /apply/verified, a Stripe Identity `return_url`
  // reached only via a per-applicant `?application=<id>` query string
  // (confirmed via lib/identity.ts) with no internal link pointing to it
  // anywhere in the app -- the same profile as /unsubscribe and
  // /apply/invited, neither of which is listed here either. This page
  // previously had a canonical instead of noindex (a real inconsistency
  // flagged as SEO_LOG.md backlog item 11 since 2026-07-13); corrected
  // 2026-07-22 to `robots: { index: false, follow: false }`, matching its
  // two siblings -- see app/apply/verified/page.tsx for the fix itself.
  //
  // /origins removed site-wide (William, 2026-07-26, "i dont think the
  // origins page serves any purpose at all lets remove it completly") --
  // this used to be a large per-country sitemap block (originCountryEntries,
  // one URL per WORLD_COUNTRIES entry with a real lib/cultureHints.ts
  // entry, ~145-190 URLs depending on research coverage at the time -- see
  // git history for the full research trail this replaced).
  //
  // Gap closed the same day (William, later, "how do we get around that"):
  // app/shop/page.tsx is now a server component with real per-country
  // generateMetadata for `?origin=CODE`, and app/robots.ts carves out an
  // explicit allow for `/shop?origin=` -- so `/shop?origin=CODE` is once
  // again a real, indexable per-country landing page. originCountryEntries
  // below lists it, but deliberately NOT for all 190 WORLD_COUNTRIES the
  // way the old /origins block did -- only for countries with at least one
  // real, live APPROVED product right now, queried fresh on every sitemap
  // request (see `dynamic = 'force-dynamic'` above). That is the same
  // "don't submit thin/empty pages to search engines" discipline that
  // motivated removing /origins in the first place: a country with zero
  // real listings has nothing on the page for a crawler to index, so it
  // stays out of the sitemap until a seller from there is actually
  // approved -- at which point it appears automatically, no redeploy or
  // manual sitemap edit needed.
  const originCountryEntries: MetadataRoute.Sitemap = await (async () => {
    const rows = await prisma.product.findMany({
      where: { status: 'APPROVED', originCountry: { not: null } },
      select: { originCountry: true },
    });
    const liveCodes = new Set<string>();
    for (const r of rows) {
      const code = toCode(r.originCountry);
      if (code) liveCodes.add(code);
    }
    return Array.from(liveCodes).map((code) => ({
      url: `${base}/shop?origin=${code}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));
  })();

  // Added 2026-07-20 (later same-day run) by the standing SEO agent,
  // alongside app/specialities/[term]/layout.tsx and page.tsx -- the
  // speciality-side analogue of originCountryEntries directly above. Unlike
  // the country side, there is no content-depth filter here: all 59
  // SPECIALITIES entries are the closed, fully real vocabulary itself
  // (William signed off 2026-07-08, velor-speciality-vocabulary-v2.md,
  // same source app/specialities/page.tsx and layout.tsx already render
  // from) -- there is no thin-content subset to withhold the way 40+
  // /origins/[slug] pages once had to wait on lib/cultureHints.ts research
  // (see the long comment trail above). Every one of the 59 pages this
  // resolves to has the same real term, family, standfirst line and
  // associated-countries list live today, regardless of catalogue state.
  const specialityEntries: MetadataRoute.Sitemap = SPECIALITIES.map((s) => ({
    url: `${base}/specialities/${specialitySlug(s)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/apply`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    // /marketplace removed 2026-07-15 (William's call): it now redirects to
    // /shop (see app/marketplace/page.tsx) instead of rendering its own
    // duplicate product grid, so it is no longer a real canonical page worth
    // submitting to search engines.
    { url: `${base}/founding`, changeFrequency: 'weekly', priority: 0.85 },
    // /origins index removed 2026-07-26 (William's call, "lets remove it
    // completly") along with the whole route -- see the removal note near
    // the top of this file for what it used to carry.
    // /specialities index REMOVED 2026-07-21 by William's direct request
    // ("remove specialities page as its not needed at all") -- the header
    // link it brought was also shrinking the search bar. The per-term
    // /specialities/[term] pages remain (each /origins/[slug] page's
    // speciality tags link them, plus this sitemap -- the homepage's own
    // speciality wall that used to link them too was separately removed
    // by William the same evening, commit dcdf8b0). SEO agent: do NOT
    // re-add the index page or its nav links.
    { url: `${base}/sell`, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/live`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    // /mission added 2026-07-23 (commit dbab69cc) -- a static, real-content
    // page (mission/values/seller-guidelines) with its own generateMetadata
    // (title/description/canonical/OG/Twitter, confirmed present in
    // app/mission/page.tsx) and now a real internal link from GlobalFooter
    // (commit 308548e0). Missing from this sitemap until the standing SEO
    // agent added this line -- same priority/frequency as the similar
    // static /about page.
    { url: `${base}/mission`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/help`, changeFrequency: 'monthly', priority: 0.6 },
    // /safety added 2026-07-29 (commit 876f1151) -- a static, real-content
    // trust-and-safety page (report content / appeal a decision, per the
    // signed Online Safety Act policy) with its own layout.tsx metadata
    // (title/description/canonical/OG/Twitter, added the same cycle by the
    // standing SEO agent -- see app/safety/layout.tsx) and a real internal
    // link from GlobalFooter's "Company" column. Missing from this sitemap
    // until now; same gap class and fix as /mission (2026-07-23).
    { url: `${base}/safety`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/press`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/track`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/legal/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/seller-agreement`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/seller-rules`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/seller-agreement`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/returns`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cookies`, changeFrequency: 'yearly', priority: 0.3 },
    ...specialityEntries,
    ...originCountryEntries,
  ];
}
