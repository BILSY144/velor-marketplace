// /roots-foundation — Velor Roots Foundation vision & mission page, added
// 2026-08-02 per William's direction to make the Velor Roots Foundation
// footer badge (components/GlobalFooter.tsx) a clickable link to a real
// page explaining our vision and mission. New, additive route — does not
// touch any existing page or shared component.
//
// Status is deliberately accurate and present-tense: Velor Roots Foundation
// is a real, planned UK charity but is NOT yet registered with the Charity
// Commission, and the checkout micro-donation feature stays off until it
// is (see the identical status language already live on /vs/etsy's
// "Beyond the marketplace" section — kept consistent with this page). Do
// not strengthen this copy to imply an active/registered charity, a live
// donation feature, or a working signup mechanism without confirming those
// are real first.

import Link from 'next/link'
import Image from 'next/image'

const css = `
.vrf{background:var(--bg);color:var(--text);font-family:var(--font-body)}
.vrf a{color:inherit}
.vrf-wrap{max-width:880px;margin:0 auto;padding:0 32px}
.vrf h1,.vrf h2{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.vrf-hero{padding:76px 0 32px;text-align:center}
.vrf-hero img{max-width:220px;width:100%;height:auto;margin:0 auto 24px}
.vrf-status{display:inline-block;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);font-weight:700;border:1px solid rgba(255,107,0,.35);border-radius:999px;padding:7px 16px;margin-bottom:22px}
.vrf-hero h1{font-size:38px;line-height:1.12;margin:0 auto 16px;max-width:20ch}
.vrf-hero p{font-size:16.5px;color:var(--muted);line-height:1.65;max-width:56ch;margin:0 auto}
.vrf-section{padding:36px 0;border-top:1px solid var(--border)}
.vrf-section h2{font-size:23px;margin-bottom:14px}
.vrf-section p{font-size:15px;color:var(--muted);line-height:1.7;margin:0 0 14px}
.vrf-section p:last-child{margin-bottom:0}
.vrf-list{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:12px}
.vrf-list li{display:flex;gap:11px;font-size:14.5px;line-height:1.6;color:var(--muted)}
.vrf-list i{color:var(--accent);font-style:normal;flex:0 0 auto}
.vrf-cta{text-align:center;padding:50px 0 80px}
.vrf-cta a{display:inline-block;background:var(--accent);color:#0d0d0d;font-weight:700;padding:15px 34px;border-radius:10px;text-decoration:none;font-size:15px;margin:8px}
.vrf-cta a.ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.vrf-cta p{font-size:13px;color:var(--muted);margin-top:20px}
.vrf-cta p a{text-decoration:underline;background:none;padding:0;margin:0;color:inherit;font-weight:400;font-size:inherit;display:inline}
`

export default function RootsFoundationPage() {
  return (
    <main className="vrf">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="vrf-wrap">
        <section className="vrf-hero">
          <Image src="/velor-roots-foundation-logo.png" alt="Velor Roots Foundation" width={220} height={138} />
          <div className="vrf-status">Early stages — not yet a registered charity</div>
          <h1>Trade that helps people out of homelessness — for good.</h1>
          <p>Velor Roots Foundation is our plan for something bigger than a marketplace: a UK charity, independent from Velor Commerce Ltd but built alongside it, working to help artisan sellers get out of, and stay out of, homelessness.</p>
        </section>

        <section className="vrf-section">
          <h2>Our vision</h2>
          <p>Every Velor seller is a real person with a name, a country, and a craft, passed down or self-taught. Some of the people best placed to benefit from that — makers experiencing or at risk of homelessness — are also some of the hardest to reach through ordinary retail. Velor Roots Foundation exists to close that gap: using trade itself, not just donations, as a route out.</p>
          <p>We don&rsquo;t think a marketplace and a charity have to be separate projects. Every sale on Velor already moves money to a real maker. Velor Roots Foundation is our plan to point some of that same energy — buyer generosity, seller opportunity — directly at ending homelessness for the people closest to our own mission.</p>
        </section>

        <section className="vrf-section">
          <h2>How it will work</h2>
          <ul className="vrf-list">
            <li><i>&#9679;</i><span>At checkout, buyers will be able to add a small optional donation — 20p, 50p or £1 — to Velor Roots Foundation. Entirely opt-in, never a default or a dark pattern.</span></li>
            <li><i>&#9679;</i><span>We&rsquo;ll work with homelessness-focused social enterprises and individual makers experiencing or at risk of homelessness who want to sell their craft on Velor — opt-in recruitment, never a requirement to disclose anything they don&rsquo;t want to.</span></li>
            <li><i>&#9679;</i><span>Support to Foundation-connected sellers means onboarding help, materials and photography support, and access to buyers worldwide — real opportunity, not charity pricing.</span></li>
            <li><i>&#9679;</i><span>Once registered, Velor Roots Foundation will be run by a small board of unpaid, independent trustees, legally separate from Velor Commerce Ltd.</span></li>
          </ul>
        </section>

        <section className="vrf-section">
          <h2>Where it actually stands today</h2>
          <p>Velor Roots Foundation is not yet registered as a charity, and the checkout donation feature is switched off until it is. We&rsquo;d rather tell you plainly where things stand than oversell something that isn&rsquo;t real yet — this page will be updated the moment that changes.</p>
        </section>

        <section className="vrf-cta">
          <Link href="/apply">Apply as a founding seller →</Link>
          <Link href="/contact" className="ghost">Get in touch →</Link>
          <p>Questions about Velor Roots Foundation? Reach us at <a href="mailto:customerservice@velorcommerce.co.uk">customerservice@velorcommerce.co.uk</a>.</p>
        </section>
      </div>
    </main>
  )
}
