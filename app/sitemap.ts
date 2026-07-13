import type { MetadataRoute } from 'next';
import { WORLD_COUNTRIES, countrySlug } from '@/lib/worldCountries';
import { cultureHints } from '@/lib/cultureHints';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://velorcommerce.store';
  const now = new Date();
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
  // /legal/seller-rules, /marketplace, /returns, /seller-agreement, /track.
  // Deliberately NOT added: /apply/verified, which also has a canonical set
  // but is a Stripe Identity `return_url` reached only via a per-applicant
  // `?application=<id>` query string (confirmed via lib/identity.ts) with no
  // internal link pointing to it anywhere in the app -- the same profile as
  // /unsubscribe and /apply/invited, both of which prior runs correctly set
  // to noindex rather than canonical. That looks like a real inconsistency
  // in an earlier run's canonical batch, not something to paper over by
  // listing it here -- logged as a new backlog item instead of decided
  // unilaterally in a sitemap-only change.
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
  const originCountryEntries: MetadataRoute.Sitemap = WORLD_COUNTRIES.filter(
    (c) => cultureHints(c.code).length > 0
  ).map((c) => ({
    url: `${base}/origins/${countrySlug(c)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/apply`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/founding`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/origins`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/sell`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/live`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/track`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/seller-agreement`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/seller-rules`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/seller-agreement`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/returns`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ...originCountryEntries,
  ];
}
