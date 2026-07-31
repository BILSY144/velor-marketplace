import { redirect } from 'next/navigation'

// 2026-07-31: Starter is no longer a distinct named tier -- it's just "the
// flat rate every seller is on." Redirects to /dashboard/upgrade so old
// links/bookmarks still land somewhere useful.
export default function UpgradeStarterPage() {
  redirect('/dashboard/upgrade')
}
