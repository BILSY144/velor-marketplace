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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
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
