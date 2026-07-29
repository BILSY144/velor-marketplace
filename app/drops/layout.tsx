import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fresh from the Workshop -- the weekly drop | Velor',
  description: 'One moment a week when new pieces from real makers go live together. Follow the drop, catch the piece.',
  alternates: { canonical: 'https://velorcommerce.store/drops' },
  openGraph: {
    title: 'Fresh from the Workshop -- the weekly Velor drop',
    description: 'New pieces from real makers, live for 48 hours every week.',
    url: 'https://velorcommerce.store/drops',
  },
}

export default function DropsLayout({ children }: { children: React.ReactNode }) {
  return children
}
