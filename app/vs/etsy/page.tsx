// /vs/etsy — Etsy fee comparison + mission page, added 2026-08-02 per
// William's direction ("do what you think is best for velor") to build out
// the zero-budget visibility campaign. New, additive route — does not touch
// any existing page or shared component.
//
// Etsy figures are sourced (2026): $0.20 listing fee/4mo, 6.5% transaction
// fee, 3%+$0.25 payment processing (US), 12-15% Offsite Ads on attributed
// sales (conditional, not universal — see printify.com/blog/how-much-does-
// etsy-take-per-sale). Velor figures are pulled from the live commission
// constant (PLATFORM_COMMISSION_RATE = 0.1 in app/api/stripe/payment-intent/
// route.ts) and the site-wide 0% listing fee / no-subscription model
// confirmed live 2026-08-01 (see CLAUDE.md CANONICAL TIER FACTS). Velor also
// absorbs its own Stripe/Payoneer processing cost rather than passing a
// separate fee to sellers (same file, "never lose money on a sale" fix).
//
// Mission section deliberately uses conservative, present-tense-accurate
// language: Velor Roots Foundation is a real, planned initiative but is NOT
// yet a registered UK charity (prisma/schema.prisma CharityDonation model
// comment, 2026-07-31), and CHARITY_DONATIONS_ENABLED stays off until it is.
// Do not strengthen this copy to imply an active/registered charity without
// confirming registration first.

import Link from 'next/link'
import Image from 'next/image'

const css = `
.ve{background:var(--bg);color:var(--text);font-family:var(--font-body)}
.ve a{color:inherit}
.ve-wrap{max-width:960px;margin:0 auto;padding:0 32px}
.ve h1,.ve h2{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.ve-hero{padding:76px 0 44px;text-align:center}
.ve-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;font-weight:600}
.ve-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.ve-hero h1{font-size:46px;line-height:1.08;margin:0 auto 18px;max-width:16ch}
.ve-hero p{font-size:17px;color:var(--muted);line-height:1.6;max-width:52ch;margin:0 auto}
.ve-section{padding:40px 0;border-top:1px solid var(--border)}
.ve-section h2{font-size:26px;margin-bottom:8px}
.ve-note{font-size:13.5px;color:var(--muted);line-height:1.6;max-width:70ch;margin:14px 0 0}
.ve-table{width:100%;border-collapse:collapse;margin-top:22px;font-size:14.5px}
.ve-table th,.ve-table td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--border)}
.ve-table th{color:var(--muted);font-weight:600;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
.ve-table td.num{text-align:right;font-variant-numeric:tabular-nums}
.ve-table tr.total td{font-weight:700;color:var(--text)}
.ve-table tr.total.velor td{color:var(--accent)}
.ve-source{font-size:12.5px;color:var(--muted);margin-top:10px}
.ve-source a{text-decoration:underline}
.ve-list{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:12px}
.ve-list li{display:flex;gap:11px;font-size:14.5px;line-height:1.55}
.ve-list i{color:var(--green);font-style:normal;flex:0 0 auto}
.ve-mission{border:1px solid rgba(255,107,0,.3);border-radius:16px;padding:32px;background:var(--surface);text-align:center}
.ve-mission img{max-width:280px;width:100%;height:auto;margin:0 auto 20px}
.ve-mission p{font-size:14.5px;color:var(--muted);line-height:1.65;max-width:60ch;margin:0 auto}
.ve-mission .status{display:inline-block;margin-top:16px;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);font-weight:700}
.ve-cta{text-align:center;padding:50px 0 80px}
.ve-cta a{display:inline-block;background:var(--accent);color:#0d0d0d;font-weight:700;padding:15px 34px;border-radius:10px;text-decoration:none;font-size:15px}
`

export default function EtsyComparisonPage() {
  return (
    <main className="ve">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ve-wrap">
        <section className="ve-hero">
          <div className="ve-eyebrow"><span className="ve-dot" />Fee comparison</div>
          <h1>One flat fee. No ad tax. No surprises.</h1>
          <p>Velor charges 10% on completed sales — and nothing else. No listing fees, no payment-processing surcharge, no algorithm deciding whether your work gets seen unless you pay for it.</p>
        </section>

        <section className="ve-section">
          <h2>A $50 item, sold</h2>
          <table className="ve-table">
            <thead>
              <tr><th>Fee</th><th className="num">Etsy</th><th className="num">Velor</th></tr>
            </thead>
            <tbody>
              <tr><td>Listing fee</td><td className="num">$0.20</td><td className="num">$0</td></tr>
              <tr><td>Transaction fee (6.5%)</td><td className="num">$3.25</td><td className="num">—</td></tr>
              <tr><td>Payment processing (3% + $0.25)</td><td className="num">$1.75</td><td className="num">—</td></tr>
              <tr><td>Commission</td><td className="num">—</td><td className="num">$5.00 (flat 10%)</td></tr>
              <tr><td>Offsite Ads, if attributed (12–15%)</td><td className="num">$6.00–$7.50</td><td className="num">$0 — no ad mechanic</td></tr>
              <tr className="total"><td>Core total (excl. Offsite Ads)</td><td className="num">$5.20 (~10.4%)</td><td className="num">$5.00 (10%)</td></tr>
              <tr className="total velor"><td>Total if Offsite Ads applies</td><td className="num">$11.20–$12.70 (~22–25%)</td><td className="num">$5.00 (10%)</td></tr>
            </tbody>
          </table>
          <p className="ve-note">On core fees alone, Etsy and Velor land close together — the real gap opens up if Offsite Ads applies, which independent estimates put at 20–25% of a sale price all-in for many sellers. Offsite Ads isn&rsquo;t universal on Etsy, and Velor has no equivalent mechanic to compare it to, so we&rsquo;re showing both figures rather than one blended number.</p>
          <p className="ve-source">Etsy figures: <a href="https://printify.com/blog/how-much-does-etsy-take-per-sale/" target="_blank" rel="noopener noreferrer">Printify, Etsy fees explained 2026</a> and <a href="https://craftybase.com/blog/the-complete-guide-to-etsy-fees" target="_blank" rel="noopener noreferrer">Craftybase, Etsy Seller Fees 2026</a>.</p>
        </section>

        <section className="ve-section">
          <h2>What&rsquo;s actually different</h2>
          <ul className="ve-list">
            <li><i>&#10003;</i><span>No monthly subscription of any kind — one flat rate for every seller, always.</span></li>
            <li><i>&#10003;</i><span>Velor absorbs its own payment-processing cost rather than passing a separate charge to sellers.</span></li>
            <li><i>&#10003;</i><span>Every application goes through ID verification before a seller can list — not instant self-serve signup.</span></li>
            <li><i>&#10003;</i><span>One permanent founding-seller seat per country, first verified applicant only — a badge and priority placement, not a discount.</span></li>
          </ul>
        </section>

        <section className="ve-section">
          <h2>Beyond the marketplace</h2>
          <div className="ve-mission">
            <Image src="/velor-roots-foundation-logo.png" alt="Velor Roots Foundation" width={280} height={175} />
            <p>Long-term, Velor is building toward something bigger than commission rates. We&rsquo;re in the early stages of setting up Velor Roots Foundation — a planned initiative to help artisan sellers get out of, and stay out of, homelessness, funded in part by buyer donations at checkout. It isn&rsquo;t registered as a charity yet, and the donation feature isn&rsquo;t switched on until it is — we&rsquo;d rather tell you where it actually stands than oversell something that isn&rsquo;t real yet.</p>
            <div className="status">Early stages — not yet a registered charity</div>
          </div>
        </section>

        <section className="ve-cta">
          <Link href="/apply">Apply as a founding seller →</Link>
        </section>
      </div>
    </main>
  )
}
