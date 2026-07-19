import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Velor Pulse',
  description: 'Private live operations dashboard',
  manifest: '/pulse-manifest.json',
  icons: {
    icon: '/pulse-icon-192.png',
    apple: '/pulse-icon-180.png',
  },
  robots: {
    index: false,
    follow: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Velor Pulse',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0d0d0d',
}

export default function PulseLayout({ children }: { children: React.ReactNode }) {
  return children
}
