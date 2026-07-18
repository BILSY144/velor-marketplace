import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { sendEmail } from '@/lib/email'

// One-off admin endpoint: sends Wasizo deco (Santoz nugroz, Indonesia,
// approved 2026-07-18 via /api/admin/approve-wasizo-deco) a follow-up to
// their standard approval email, specifically about the founding-seller
// mechanic and the urgency of listing first.
//
// Founding credit is strictly first-APPROVED-listing-wins per origin
// country (see grantCountryFounderIfFirst in lib/founding.ts -- countryCode
// is a unique constraint on CountryFounder, so once one seller's product
// from a country clears review, no other seller can ever claim that
// country's founding credit). William asked specifically that this seller
// be told to list quickly for exactly this reason: whoever else lists an
// Indonesia-origin product and gets approved first takes the credit
// permanently, no matter how much earlier Wasizo deco was approved as a
// seller.
export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const html = `
<p>Hi Santoz,</p>

<p>Great news -- Wasizo deco is now an approved seller on Velor. You should have a separate email with a link to set up your account; if you don't see it, check spam or just reply here and we'll resend it.</p>

<p>One thing worth acting on quickly: Velor credits founding-seller status to whichever seller gets the <strong>first approved</strong> product listing from a given country. Nobody has claimed that credit for Indonesia yet, so it's currently open -- but it's strictly first-come-first-served. The moment another Indonesian seller's listing clears review before yours, they get the credit instead, permanently, and it can't be reassigned afterwards, no matter when they were approved as a seller relative to you. So the sooner your first listing is submitted, reviewed, and live, the sooner Wasizo deco locks in a permanent "Founding Seller of Indonesia" badge that shows on every one of your listings to every buyer on Velor.</p>

<p>To get there: add your first product with at least 3 clear photos, a name, description and price, and confirm you agree with Velor's Seller Rules. Photos matter -- your original application was held up because it didn't include any yet, so please make sure to include at least three clear photos this time. Listings go through a short review before going live, so getting yours submitted soon gives you the best shot at being first.</p>

<p>If anything is unclear or you run into trouble listing, just reply to this email.</p>

<p>Welcome aboard,<br/>The Velor Seller Team</p>
`.trim()

  await sendEmail({
    to: 'nugrahamedia@gmail.com',
    from: 'Velor Seller Team <sellers@velorcommerce.store>',
    subject: "Wasizo deco is approved \u2014 list first to become Velor's Founding Seller of Indonesia",
    html,
  })

  return NextResponse.json({ ok: true, sentTo: 'nugrahamedia@gmail.com' })
}
