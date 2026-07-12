import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import ConditionalLayout from '@/components/ConditionalLayout'
import AnalyticsTracker from '@/components/AnalyticsTracker'

export const metadata: Metadata = {
  metadataBase: new URL('https://velorcommerce.store'),
  title: 'Velor - Global Marketplace',
  description: 'Discover unique products from sellers around the world.',
  openGraph: {
    title: 'Velor - Global Marketplace',
    description: 'Discover unique products from sellers around the world.',
    url: 'https://velorcommerce.store',
    siteName: 'Velor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Velor - Global Marketplace',
    description: 'Discover unique products from sellers around the world.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Velor',
      url: 'https://velorcommerce.store',
      logo: 'https://velorcommerce.store/velor-logo-globe-v2.png',
    },
    {
      '@type': 'WebSite',
      name: 'Velor',
      url: 'https://velorcommerce.store',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://velorcommerce.store/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>
        <AnalyticsTracker />
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  )
}
