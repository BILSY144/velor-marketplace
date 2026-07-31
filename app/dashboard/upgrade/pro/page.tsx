import { redirect } from 'next/navigation'

// 2026-07-31: the purchasable Pro tier is retired -- there is nothing tier-
// specific left to show here. Redirects to the flat /dashboard/upgrade
// status view so old links/bookmarks still land somewhere useful.
export default function UpgradeProPage() {
  redirect('/dashboard/upgrade')
}
