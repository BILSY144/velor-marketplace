import TierUpgradeView from '@/components/dashboard/TierUpgradeView'

// 2026-07-31: this used to be a two-tile "choose a plan" picker linking to
// /dashboard/upgrade/starter and /dashboard/upgrade/pro. Both sub-routes are
// now redirects back here (see their own files) -- there is only one flat
// commission rate to show a seller now, so this page shows it directly.
export default function UpgradeIndexPage() {
  return <TierUpgradeView />
}
