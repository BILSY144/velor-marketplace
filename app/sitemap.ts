import type { MetadataRoute } from 'next';
import { WORLD_COUNTRIES, countrySlug } from '@/lib/worldCountries';
import { cultureHints } from '@/lib/cultureHints';
import { SPECIALITIES, specialitySlug } from '@/lib/specialities';

export default function sitemap(): MetadataRoute.Sitemap {
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
  // Extended 2026-07-13 (evening) by the standing SEO agent: /origins, the
  // buyer-facing country index, was built the same day (commit a62357e) and
  // had no metadata or sitemap entry at all until this pass (see
  // app/origins/layout.tsx, added alongside this change). Added the index
  // page itself here. Deliberately NOT adding all 190 /origins/[slug]
  // per-country URLs in this same pass -- see SEO_LOG.md backlog item 15 for
  // the thin-content-vs-indexing-value trade-off this raised at the time.
  //
  // Extended 2026-07-13 (night) by the standing SEO agent, resolving backlog
  // item 15: that item's own stated reasoning for holding back was "roughly
  // half of the 190 countries have no entry in lib/cultureHints.ts... so
  // those specific pages render close to templated boilerplate." This run
  // counted it directly (Node script over lib/worldCountries.ts and
  // lib/cultureHints.ts, not eyeballed) rather than trusting that estimate:
  // 145 of the 190 countries have a real, curated CULTURE_HINTS entry (only
  // 46 do not -- Andorra, Angola, Antigua and Barbuda, Bahamas, Barbados,
  // Benin, Burundi, Cape Verde, Central African Republic, Chad, Comoros,
  // Congo, Djibouti, Dominica, Equatorial Guinea, Eritrea, Eswatini, Gabon,
  // Gambia, Grenada, Guinea, Guinea-Bissau, Guyana, Kiribati, Lesotho,
  // Liberia, Liechtenstein, Luxembourg, Macau, Malawi, Mauritania, Monaco,
  // Niger, San Marino, Sierra Leone, Somalia, South Sudan, St Kitts and
  // Nevis, St Lucia, St Vincent and the Grenadines, Suriname, Togo,
  // Turkmenistan, Tuvalu, Vatican City, Zambia). The "roughly half" estimate
  // in the backlog was a real overstatement of the thin-content share, not
  // a fabrication -- logged and corrected here rather than silently
  // adjusted, per LAW #1. 145/190 (76%) genuinely unique per-country pages
  // is well past the threshold where withholding them from the sitemap
  // costs more (denying a freshness/priority signal on real content) than
  // it protects against (thin-content risk from the remaining 46, which
  // stay excluded below). The `isTrading` half of the original page's
  // status logic (lib/worldCountries.ts / app/origins/[slug]/page.tsx)
  // still resolves to false for every country right now -- the catalogue is
  // reconfirmed at zero products this run (see CLAUDE.md) -- so it adds
  // nothing to this filter today and was not used; if/when a country goes
  // live with real listings before it also has a cultureHints entry, this
  // filter should be revisited to include it too.
  //
  // Updated 2026-07-14 by the standing SEO agent: added 6 new, sourced
  // CULTURE_HINTS entries this run (Comoros, Eswatini, Grenada, Guinea,
  // Lesotho, Zambia -- see SEO_LOG.md for citations), so the true split is
  // now 151/190 (79%) with an entry, 40 without. This filter needed no code
  // change to pick them up -- it re-derives from cultureHints() directly.
  // The 46-name list two paragraphs up is now stale by those 6 names; left
  // as-is rather than silently rewritten, since it documents the exact
  // count backlog item 15 resolved against at the time -- the current split
  // is the sentence just above. Still without an entry (40): Andorra,
  // Angola, Antigua and Barbuda, Bahamas, Barbados, Benin, Burundi, Cape
  // Verde, Central African Republic, Chad, Congo, Djibouti, Dominica,
  // Equatorial Guinea, Eritrea, Gabon, Gambia, Guinea-Bissau, Guyana,
  // Kiribati, Liberia, Liechtenstein, Luxembourg, Macau, Malawi, Mauritania,
  // Monaco, Niger, San Marino, Sierra Leone, Somalia, South Sudan, St Kitts
  // and Nevis, St Lucia, St Vincent and the Grenadines, Suriname, Togo,
  // Turkmenistan, Tuvalu, Vatican City.
  //
  // Updated 2026-07-14 (later run) by the standing SEO agent: added 6 more
  // sourced CULTURE_HINTS entries (Turkmenistan, Malawi, Togo, Sierra Leone,
  // Suriname, St Lucia -- see SEO_LOG.md for citations). While re-deriving
  // the split with the same script, found a real data inconsistency worth
  // recording rather than silently smoothing over, per LAW #1: lib/
  // cultureHints.ts has a CI entry (Cacao, Wax-print fashion) but WORLD_
  // COUNTRIES in lib/worldCountries.ts has no Côte d'Ivoire / Ivory Coast
  // entry under any code or name -- confirmed by a full 190-name dump, not
  // a regex miss. That CI entry is orphaned: this filter iterates
  // WORLD_COUNTRIES and calls cultureHints(c.code), so a hints entry with
  // no matching country is simply never reached and changes nothing here
  // or in app/origins/layout.tsx's ItemList. Logged as a new backlog item
  // (not fixed this run -- whether to add Côte d'Ivoire as a 191st country
  // touches the "190 countries" copy used on /apply and /founding, a bigger
  // call than this agent's additive lane). Net effect on this filter: of
  // the 190 real WORLD_COUNTRIES entries, 156 now have a real cultureHints
  // entry (82%) and 34 do not -- Andorra, Angola, Antigua and Barbuda,
  // Bahamas, Barbados, Benin, Burundi, Cape Verde, Central African Republic,
  // Chad, Congo, Djibouti, Dominica, Equatorial Guinea, Eritrea, Gabon,
  // Gambia, Guinea-Bissau, Guyana, Kiribati, Liberia, Liechtenstein,
  // Luxembourg, Macau, Mauritania, Monaco, Niger, San Marino, Somalia,
  // South Sudan, St Kitts and Nevis, St Vincent and the Grenadines, Tuvalu,
  // Vatican City. No code change needed here -- this filter already
  // re-derives from cultureHints() and WORLD_COUNTRIES directly.
  //
  // Updated 2026-07-14 (08:xx UTC run) by the standing SEO agent: added 6
  // more sourced CULTURE_HINTS entries (Benin -- Abomey appliqué tapestries;
  // Gambia -- Serekunda batik textiles; Guyana -- Tibiseri straw baskets;
  // Dominica -- Kalinago larouma-reed baskets and carved calabash art; St
  // Kitts and Nevis -- Caribelle batik textiles; Kiribati -- pandanus-leaf
  // woven mats -- see SEO_LOG.md for citations). A candidate seventh entry,
  // Antigua and Barbuda, was researched and deliberately dropped: the only
  // strong lead found (Betty's Hope) is a historic sugar-plantation site,
  // not a craft or product, so nothing confidently product-level turned up
  // this run -- left for a future run rather than stretched to fill a quota.
  // Net effect on this filter: of the 190 real WORLD_COUNTRIES entries, 162
  // now have a real cultureHints entry (85%) and 28 do not -- Andorra,
  // Angola, Antigua and Barbuda, Bahamas, Barbados, Burundi, Cape Verde,
  // Central African Republic, Chad, Congo, Djibouti, Equatorial Guinea,
  // Eritrea, Gabon, Guinea-Bissau, Liberia, Liechtenstein, Luxembourg,
  // Macau, Mauritania, Monaco, Niger, San Marino, Somalia, South Sudan, St
  // Vincent and the Grenadines, Tuvalu, Vatican City. The orphaned CI
  // (Côte d'Ivoire) entry noted in the paragraph above is unaffected by
  // this run and still not counted in either the 162 or the 28, since it
  // has no matching WORLD_COUNTRIES entry either way -- still backlog item
  // 23, still not this agent's call to resolve. No code change needed here
  // -- this filter already re-derives from cultureHints() and
  // WORLD_COUNTRIES directly.
  //
  // Updated 2026-07-14 (09:xx UTC run) by the standing SEO agent: added 6
  // more sourced CULTURE_HINTS entries -- Cape Verde (grogue sugarcane
  // spirit, handwoven baskets), Bahamas (Androsia hand-batiked textiles,
  // straw-woven goods from Nassau's Straw Market), Barbados (Chalky Mount
  // pottery, rum cakes, mahogany carvings), Liechtenstein (collectible
  // postage stamps -- still actively issued today per Liechtenstein
  // Marketing's own site), Macau (almond cookies, Portuguese-style egg
  // tarts), San Marino (collectible stamps & coins, Torta Tre Monti wafer
  // cake) -- see SEO_LOG.md for citations. Net effect on this filter: of
  // the 190 real WORLD_COUNTRIES entries, 168 now have a real cultureHints
  // entry (88%) and 22 do not -- Andorra, Angola, Antigua and Barbuda,
  // Burundi, Central African Republic, Chad, Congo, Djibouti, Equatorial
  // Guinea, Eritrea, Gabon, Guinea-Bissau, Liberia, Luxembourg, Mauritania,
  // Monaco, Niger, Somalia, South Sudan, St Vincent and the Grenadines,
  // Tuvalu, Vatican City. The orphaned CI (Côte d'Ivoire) entry noted above
  // is unaffected by this run, still backlog item 23. No code change needed
  // here -- this filter already re-derives from cultureHints() and
  // WORLD_COUNTRIES directly.
  //
  // Updated 2026-07-14 (10:xx UTC run) by the standing SEO agent: added 4
  // more sourced CULTURE_HINTS entries -- Luxembourg (Péckvillercher clay
  // bird whistles, sold each Easter Monday at the Émaischen market),
  // Gabon (Mbigou stone carvings), Mauritania (Tuareg silver jewellery,
  // Malahfa embroidered textiles), Tuvalu (pandanus & coconut-leaf weaving,
  // Kolose crochet) -- see SEO_LOG.md for citations. Two candidates were
  // researched and deliberately dropped, same "don't stretch to fill a
  // quota" rule the 08:xx UTC run applied to Antigua and Barbuda: Andorra
  // (the only sourced items were gourmet food/drink brand names -- cheese,
  // cured meat, craft beer -- not a culture-first craft product this file's
  // own header rule favours) and Djibouti (the one specific-product lead
  // found, cowrie-shell-decorated vessels, is exactly the restricted-shell
  // material this file's header explicitly excludes; the only other lead,
  // woven baskets/embroidered shawls, rested on a single non-authoritative
  // source this run wasn't confident enough in to use alone). Net effect on
  // this filter: of the 190 real WORLD_COUNTRIES entries, 172 now have a
  // real cultureHints entry (90%) and 18 do not -- Andorra, Angola, Antigua
  // and Barbuda, Burundi, Central African Republic, Chad, Congo, Djibouti,
  // Equatorial Guinea, Eritrea, Guinea-Bissau, Liberia, Monaco, Niger,
  // Somalia, South Sudan, St Vincent and the Grenadines, Vatican City. The
  // orphaned CI (Côte d'Ivoire) entry noted above is unaffected by this
  // run, still backlog item 23. No code change needed here -- this filter
  // already re-derives from cultureHints() and WORLD_COUNTRIES directly.
  //
  // Correction, standing SEO agent, 2026-07-18 (09:xx UTC cycle): the
  // 172/190 (90%) figure directly above is now stale and understates real
  // coverage -- a separate, non-SEO-agent session (commit c51fa54a,
  // 2026-07-16 00:49 UTC, see SEO_LOG.md backlog item 25) fully rewrote
  // lib/cultureHints.ts from scratch, merging 19 parallel research batches,
  // and gave every one of the 190 WORLD_COUNTRIES codes a real 5-8-item
  // entry -- including the 18 named above as gapless. Verified fresh this
  // run, not assumed: a script cross-checking every WORLD_COUNTRIES code
  // against every lib/cultureHints.ts key found 190 codes, 190 keys, a
  // perfect 1:1 match, zero missing either direction, and zero orphans (the
  // CI mismatch noted above is also gone -- the rewrite dropped that
  // orphaned entry along with everything else it replaced, consistent with
  // backlog item 23's own later note). Net effect: this filter now resolves
  // to all 190 countries, not 172 -- with no code change, since it already
  // re-derives from cultureHints() and WORLD_COUNTRIES directly, exactly as
  // every prior comment in this trail predicted it would once coverage
  // reached 100%. The named country lists throughout this comment trail
  // above are now historical record of past runs' research, not a current
  // gap list -- there is no current gap list, full stop.
  const originCountryEntries: MetadataRoute.Sitemap = WORLD_COUNTRIES.filter(
    (c) => cultureHints(c.code).length > 0
  ).map((c) => ({
    url: `${base}/origins/${countrySlug(c)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

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
    { url: `${base}/origins`, changeFrequency: 'weekly', priority: 0.8 },
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
    ...originCountryEntries,
    ...specialityEntries,
  ];
}
