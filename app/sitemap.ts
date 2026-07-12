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
  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/apply`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/founding`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/sell`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/seller-agreement`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
