import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/', '/checkout/', '/orders'],
      },
    ],
    sitemap: 'https://velorcommerce.store/sitemap.xml',
  };
}
