import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { sendEmail } from '@/lib/email'

// One-off admin endpoint (2026-08-01, William). The product video that used
// to show on Forever Paw Atelier's "Custom Classic Pet Portrait Frame"
// listing (cms899cjz0001j5q1fqy9ptu5, seller cms3hmo4j0003h0y0a6u42mqq) is
// gone -- the listing's videoUrl is currently null/empty in the live
// database and no video section renders at all. Before assuming this is a
// Velor-side bug, William asked for this seller to be asked directly
// whether THEY removed/changed the video themselves, so we know whether a
// platform fix is actually needed.
//
// Seller contact looked up live via GET /api/admin/pulse-sellers?q=Forever
// Paw (Bearer ADMIN_SECRET): storeName "Forever Paw Atelier", contactName
// "Jimmy", contactEmail qimingou586@gmail.com.
export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const html = `
<p>Hi Jimmy,</p>

<p>Quick question about your "Custom Classic Pet Portrait Frame" listing on Velor -- we noticed the product video that used to show on the listing page isn't there anymore.</p>

<p>Could you let us know if you removed or changed the video yourself (for example, editing the listing, or the original video being taken down wherever it was hosted)? We just want to confirm whether this was a change on your end, or something we need to fix on ours.</p>

<p>If you didn't touch it, no action needed from you -- we'll look into it further on our side. If you did remove it and would like it back up, just reply and we can help you re-add it.</p>

<p>Thanks,<br/>The Velor Seller Team</p>
`.trim()

  await sendEmail({
    to: 'qimingou586@gmail.com',
    from: 'Velor Seller Team <sellers@velorglobalmarket.com>',
    subject: 'Quick question about your product video',
    html,
  })

  return NextResponse.json({ ok: true, sentTo: 'qimingou586@gmail.com' })
}
