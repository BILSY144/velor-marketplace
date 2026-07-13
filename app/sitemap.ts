import type { MetadataRoute } from 'next';

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
  // per-country URLs in this same pass -- see SEO_LOG.md backlog for the
  // thin-content-vs-indexing-value trade-off this raises; they are still
  // fully crawlable via the real internal links on /origins itself, a
  // sitemap listing just isn't the only path to discovering them.
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
  ];
}
