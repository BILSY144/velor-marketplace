import Link from 'next/link'

// /mission — Velor's mission / impact page, added 2026-07-23 in response to
// Good Business Charter... and Good Market's accreditation review, which
// both asked for a public page explaining how Velor benefits people and
// the planet, not just how the mechanics work (that's /about).
//
// Honesty rules, same standard as every other page in this app:
// - No fee percentages or fabricated stats. 190 = WORLD_COUNTRIES length,
//   reused from /about, the only number on this page that isn't plain prose.
// - The site is pre-launch to buyers (opens 6 August 2026) with no filler
//   or placeholder listings — this page says that plainly rather than
//   implying an established live catalogue.
// - No claims about supplier certification schemes, charities, or NGO
//   partnerships that don't exist yet. Where something is an early idea
//   rather than active work, it's labelled that way or left out.

export const metadata = {
  title: 'Our mission — Velor Marketplace',
  description:
    'Velor exists so real makers and artisans -- not factories, wholesalers, or dropshippers -- get direct, fair access to a global market for authentic, culturally rooted work.',
  alternates: { canonical: 'https://velorcommerce.store/mission' },
  openGraph: {
    title: 'Our mission — Velor Marketplace',
    description:
      'Velor exists so real makers and artisans get direct, fair access to a global market for authentic, culturally rooted work.',
    url: 'https://velorcommerce.store/mission',
    siteName: 'Velor',
    locale: 'en_GB',
    type: 'website',
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our mission — Velor Marketplace',
    description:
      'Velor exists so real makers and artisans get direct, fair access to a global market for authentic, culturally rooted work.',
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

const pillars = [
  {
    num: '01',
    title: 'Real makers, not warehouses',
    body:
      "Every seller is screened to be a genuine artisan, family workshop, or cooperative -- not a reseller of generic goods relabelled as \"cultural.\" Factory, wholesale, and dropship sources are excluded by design.",
  },
  {
    num: '02',
    title: 'The maker’s story, on every listing',
    body:
      'Who made it, where, and what tradition it comes from -- alongside the item, not buried in an about page. Authenticity is the point of the catalogue, not a marketing claim on top of it.',
  },
  {
    num: '03',
    title: 'Sellers keep control',
    body:
      'Sellers set their own prices and keep their own storefront and story. Our commission is a single published rate, the same for everyone -- not a hidden or negotiated number.',
  },
  {
    num: '04',
    title: 'Paid safely, paid directly',
    body:
      "Payment sits in escrow until delivery is confirmed, then goes straight to the maker via Stripe or Payoneer -- built specifically so sellers in countries most marketplaces ignore can still get paid.",
  },
]

const css = `
.ms{background:var(--bg);color:var(--text);font-family:var(--font-body);position:relative}
.ms::before{content:'';position:fixed;top:-320px;left:50%;transform:translateX(-50%);width:1000px;height:560px;background:radial-gradient(50% 50% at 50% 50%, rgba(255,107,0,.08) 0%, rgba(255,107,0,0) 100%);pointer-events:none}
.ms a{color:inherit;text-decoration:none}
.ms-wrap{max-width:1240px;margin:0 auto;padding:0 32px;position:relative}
.ms h1,.ms h2,.ms h3{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.ms section{padding:60px 0}
.ms-shead{margin-bottom:30px}
.ms-shead h2{font-size:29px}
.ms-shead p{font-size:14.5px;color:var(--muted);margin:9px 0 0;max-width:66ch;line-height:1.65}
.ms-hero{padding:74px 0 20px}
.ms-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;font-weight:600}
.ms-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.ms-hero h1{font-size:46px;line-height:1.1;margin-bottom:20px;max-width:20ch}
.ms-lede{font-size:17px;color:var(--muted);line-height:1.7;max-width:64ch;margin:0 0 16px}
.ms-btn{border-radius:11px;padding:15px 30px;font-size:15px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
.ms-btn-p{background:var(--accent);color:#160a00 !important}
.ms-btn-s{background:none;border:1px solid var(--border);margin-left:10px}
.ms-pillars{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
.ms-pcard{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:30px 32px;position:relative;overflow:hidden;transition:transform .15s, border-color .15s}
.ms-pcard:hover{transform:translateY(-3px);border-color:#3d3d46}
.ms-pnum{position:absolute;right:18px;top:12px;font-family:var(--font-display);font-size:64px;font-weight:700;color:transparent;-webkit-text-stroke:1px #26262d}
.ms-pcard h3{font-size:18px;margin-bottom:11px;max-width:22ch}
.ms-pcard p{font-size:14px;color:var(--muted);line-height:1.7;max-width:48ch;margin:0}
.ms-honest{border:1px solid rgba(255,107,0,.32);border-radius:18px;background:linear-gradient(120deg,rgba(255,107,0,.06) 0%,rgba(255,107,0,0) 55%),var(--surface);padding:38px 42px}
.ms-honest .toplbl{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:12px}
.ms-honest h2{font-size:25px;margin-bottom:14px;max-width:30ch}
.ms-honest p{font-size:14.5px;color:var(--muted);line-height:1.75;margin:0 0 14px;max-width:74ch}
.ms-badge-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:8px}
.ms-founding{border:1px solid rgba(255,107,0,.32);border-radius:18px;padding:42px 46px;display:flex;align-items:center;justify-content:space-between;gap:38px;background:linear-gradient(120deg,rgba(255,107,0,.06) 0%,rgba(255,107,0,0) 55%),var(--surface);flex-wrap:wrap}
.ms-founding h2{font-size:27px;margin-bottom:11px;max-width:22ch}
.ms-founding p{font-size:14.5px;color:var(--muted);line-height:1.65;max-width:54ch;margin:0}
.ms-legal{font-size:12.5px;color:var(--muted);margin-top:8px}
@media(max-width:980px){
.ms-hero h1{font-size:32px}
.ms-pillars{grid-template-columns:1fr}
.ms-honest{padding:30px 26px}
}
`

export default function MissionPage() {
  return (
    <div className="ms">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ms-wrap">
        <section className="ms-hero">
          <div className="ms-eyebrow"><span className="ms-dot" />Our mission</div>
          <h1>Real makers should keep more of what they make.</h1>
          <p className="ms-lede">
            Most global marketplaces sell the same mass-produced catalogue sourced from a handful of
            manufacturing hubs. Velor exists to give traditional artisans and makers -- many in regions
            overlooked by mainstream e-commerce -- direct access to a global market for authentic,
            culturally rooted work, at a time when generic, factory-made goods are displacing
            traditional-craft economies.
          </p>
          <p className="ms-lede">
            Velor&apos;s commercial success is tied directly to more real makers earning fair, direct
            income from their craft -- and more of that craft surviving commercially.
          </p>
          <div>
            <Link href="/apply" className="ms-btn ms-btn-p">Apply to sell</Link>
            <Link href="/about" className="ms-btn ms-btn-s">See how buyer protection works</Link>
          </div>
        </section>
      </div>

      <div className="ms-wrap">
        <section>
          <div className="ms-shead">
            <h2>What makes a marketplace good for people</h2>
            <p>Four things we build for, not just claim.</p>
          </div>
          <div className="ms-pillars">
            {pillars.map((p) => (
              <div key={p.num} className="ms-pcard">
                <div className="ms-pnum">{p.num}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="ms-wrap">
        <section>
          <div className="ms-honest">
            <div className="toplbl">Where we are today</div>
            <h2>We&apos;re early, and we&apos;d rather say so than overstate it.</h2>
            <p>
              Velor is a new marketplace. Our payment and escrow pipeline is live and tested -- a real
              end-to-end transaction has gone through Stripe, from payment to buyer confirmation to
              payout -- but we haven&apos;t opened publicly to buyers yet, and by design we don&apos;t
              fill the shop with filler or placeholder listings while we wait. Buyers arrive on 6 August
              2026, once our founding sellers -- real, identity-verified makers -- are onboarded and
              ready.
            </p>
            <p>
              Velor Commerce Ltd is accredited by the Good Business Charter (UK), which verifies
              responsible business practice across 10 components including fair payment, employee
              wellbeing, environmental responsibility, and ethical sourcing.
            </p>
            <div className="ms-badge-row">
              <a
                href="https://goodbusinesscharter.com/what-good-business-charter-accreditation-means-and-why-it-matters/"
                target="_blank"
                rel="noopener noreferrer"
                title="Velor Commerce Ltd is Good Business Charter accredited"
              >
                <img src="/gbc-accredited.jpg" alt="Good Business Charter Accredited" style={{ height: 64, width: 'auto', display: 'block' }} />
              </a>
            </div>
          </div>
        </section>
      </div>

      <div className="ms-wrap">
        <section>
          <div className="ms-founding">
            <div>
              <h2>Make something your country is known for?</h2>
              <p>
                Our Founding Seller programme recruits real makers by country and craft tradition, free
                to join. If that&apos;s you, there&apos;s an application at the end of this page.
              </p>
              <p className="ms-legal">Velor Commerce Ltd (company no. 17268133) is registered in England and Wales, registered office 49 Station Road, Polegate, East Sussex, BN26 6EA.</p>
            </div>
            <Link href="/apply" className="ms-btn ms-btn-p">Apply to sell</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
