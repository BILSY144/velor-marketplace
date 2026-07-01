import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://velorcommerce.store';
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/sell-on-velor`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sellers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/seller-agreement`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
