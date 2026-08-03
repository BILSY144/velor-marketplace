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
    // /vs/etsy added 2026-08-03 by the standing SEO agent (full audit
    // cycle). Real, live route (commit a844b0b1, 2026-08-02, "Add /vs/etsy
    // comparison page with sourced fee breakdown and mission section")
    // built specifically for a "zero-budget visibility campaign" per its
    // own top-of-file comment -- a server component (no 'use client'), not
    // auth-gated (middleware.ts's protected-route matcher does not cover
    // /vs/etsy), with its own real layout.tsx metadata (title/description/
    // canonical/OG/Twitter, completed the same cycle -- see
    // app/vs/etsy/layout.tsx). Missing from this sitemap until now; same
    // gap class as every prior new-route omission this file has fixed
    // (/workshop, /drops, /community, /mission, /safety). Priority 0.7,
    // one notch below /sell/founding/apply -- a real seller-recruitment
    // and fee-comparison page (the exact "Etsy alternative" query class
    // CLAUDE.md's own standing directive weights above buyer terms while
    // supply is the bottleneck) but not a core funnel page. changeFrequency
    // 'monthly' -- a static comparison page, not a feed, though its sourced
    // fee figures may be revisited periodically as either platform's
    // pricing changes.
    { url: `${base}/vs/etsy`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/live`, changeFrequency: 'daily', priority: 0.6 },
    // /workshop added 2026-07-29 (commit 7b520baa, "Workshop Feed (Velor
    // Social stage 5)") -- a real, chronological maker-journal feed with
    // its own layout.tsx metadata (title/description/canonical/OG/Twitter,
    // added the same cycle by the standing SEO agent -- see
    // app/workshop/layout.tsx) and a real internal link from
    // GlobalHeader's main nav (commit c6ee186a, "William approved
    // 2026-07-29", desktop + mobile panel). Missing from this sitemap
    // until now; same gap class as /mission (2026-07-23) and /safety
    // (2026-07-29). changeFrequency 'daily' mirrors /live above -- both
    // are newest-first feeds that genuinely change often, unlike the
    // static monthly pages below.
    { url: `${base}/workshop`, changeFrequency: 'daily', priority: 0.6 },
    // /drops added 2026-07-30 by the standing SEO agent. Real, live route
    // (commit 26671523, "Drops page redesigned: a market square," 2026-07-29)
    // with its own real generateMetadata already in place (title/description/
    // canonical/OG -- see app/drops/layout.tsx, added the same session, not
    // this cycle) and a prominent internal link in GlobalHeader's main nav,
    // desktop + mobile (commit 6c338319, "Drops nav links... in the main
    // header"). Verified not auth-gated: middleware.ts's protected-route
    // matcher does not cover /drops, and app/drops/page.tsx is a plain async
    // server component (no 'use client', no session check) that renders real
    // content -- the current drop's live items -- for any visitor, signed in
    // or not. Missing from this sitemap until now; same gap class as
    // /workshop (2026-07-29) and /safety (2026-07-29) before it. changeFrequency
    // 'weekly' reflects the page's own real cadence (one drop cycle per week,
    // per DROP_LIVE_HOURS in lib/drops.ts), distinct from /workshop's/live's
    // daily-updating feed.
    { url: `${base}/drops`, changeFrequency: 'weekly', priority: 0.6 },
    // /community added 2026-07-30 by the standing SEO agent. "The Makers'
    // Circle" (commit 99a777a4, "community hub replaces Workshop/Drops in
    // nav") is the new primary community destination in GlobalHeader's main
    // nav (desktop mega-menu + mobile panel), with its own layout.tsx
    // metadata added the same cycle (title/description/canonical/OG/Twitter
    // -- see app/community/layout.tsx). Verified not auth-gated: same
    // middleware.ts check already documented for /workshop and /drops above.
    // changeFrequency/priority match /workshop -- both are hub/feed-style
    // pages whose content genuinely changes often, distinct from the static
    // monthly pages below.
    { url: `${base}/community`, changeFrequency: 'daily', priority: 0.6 },
    // Eight /community/* sub-routes added 2026-07-31 by the standing SEO
    // agent (full audit cycle). All shipped 2026-07-30/31 (commits
    // 952e975d, 185c20a9) as real, DB-backed pages -- three ("featured",
    // "journals", "ask") replacing what used to fall through to the
    // /community/[section] "being crafted right now" placeholder, and five
    // more ("videos", "world", "collections", "learning", "countries")
    // built the same way per William: "a lot of the clickable
    // links/buttons go nowhere." Each is prominently linked from
    // /community's own section boxes (app/community/CommunityPageClient.tsx,
    // confirmed via grep) and now has its own real generateMetadata-
    // equivalent (a sibling layout.tsx with title/description/canonical/
    // OG/Twitter, added this same cycle -- see each route's own
    // app/community/<slug>/layout.tsx) so it no longer inherits /community's
    // canonical, the same false-canonical shape backlog items 2/3/8 already
    // fixed for /shop and /shop/[productId]. All confirmed not auth-gated
    // (same middleware.ts check already documented for /workshop/community
    // above). changeFrequency 'daily' for the two genuinely live/newest-
    // first feeds (featured, journals); 'weekly' for the rest, which
    // reflect real but slower-moving underlying data (seller/product/video
    // counts, follower rankings). Priority 0.5, one notch below the
    // /community hub itself (0.6) -- real, permanent, linked content, but
    // one level deeper in the site's own hierarchy. /community/journals/
    // [sellerId] is deliberately NOT listed -- it is now a plain redirect
    // to /seller/[sellerId] (commit f170c61a), which is already covered by
    // this sitemap's dynamic seller-URL section below with its own real
    // metadata. /community/[section]'s remaining live slug ("challenge", an
    // honest "being crafted right now" placeholder) is also deliberately
    // NOT listed -- unresolved judgment call, see backlog item 50.
    { url: `${base}/community/featured`, changeFrequency: 'daily', priority: 0.5 },
    { url: `${base}/community/journals`, changeFrequency: 'daily', priority: 0.5 },
    { url: `${base}/community/ask`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/community/videos`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/community/world`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/community/collections`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/community/learning`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/community/countries`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/community/passport`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    // /mission added 2026-07-23 (commit dbab69cc) -- a static, real-content
    // page (mission/values/seller-guidelines) with its own generateMetadata
    // (title/description/canonical/OG/Twitter, confirmed present in
    // app/mission/page.tsx) and now a real internal link from GlobalFooter
    // (commit 308548e0). Missing from this sitemap until the standing SEO
    // agent added this line -- same priority/frequency as the similar
    // static /about page.
    { url: `${base}/mission`, changeFrequency: 'monthly', priority: 0.6 },
    // /roots-foundation added 2026-08-03 by the standing SEO agent (full
    // audit cycle). Real, live route (commit 3b58d20c, 2026-08-02, "Create
    // Velor Roots Foundation vision & mission page") -- a server component
    // (no 'use client'), not auth-gated (same middleware.ts check
    // documented above), with a real internal link from GlobalFooter's
    // Roots Foundation badge (commit 28a3ec3c) and its own layout.tsx
    // metadata (title/description/canonical/OG/Twitter, completed the same
    // cycle -- see app/roots-foundation/layout.tsx). Missing from this
    // sitemap until now; same gap class and fix as /mission/ /safety
    // directly above. changeFrequency/priority match /mission -- both are
    // static, real-content, footer-linked pages one level below the core
    // funnel.
    { url: `${base}/roots-foundation`, changeFrequency: 'monthly', priority: 0.6 },
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
