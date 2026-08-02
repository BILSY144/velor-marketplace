import type { Metadata } from 'next'

// New route, added 2026-08-02 per William's direction to link the Velor
// Roots Foundation footer badge (components/GlobalFooter.tsx) to a real
// vision/mission page. Kept under Google's ~155-160 char SERP display
// limit per the standing SEO agent's established convention on other
// route layouts (see /vs/etsy/layout.tsx, /founding/layout.tsx).
export const metadata: Metadata = {
  title: 'Velor Roots Foundation — Our Vision & Mission',
  description:
    'Velor Roots Foundation is our plan to help artisan sellers get out of, and stay out of, homelessness — trade with purpose, not just commerce.',
}

export default function RootsFoundationLayout({ children }: { children: React.ReactNode }) {
  return children
}
