import Link from 'next/link'

// /about — the "How it works" destination in the header nav. Revamped
// 2026-07-12 to match the visual ambition of /sell: the same design
// language (radial glow, numbered flow steps, journey cards, hover-lift
// stat cards), the same honesty rules. This page is the manifesto plus
// the mechanics (escrow, verification), for buyers first, with one
// seller door at the end. No fee percentages here — commission detail
// lives on /sell where a prospective seller compares tiers in full.
//
// Every figure on this page must be true of the live platform:
// 190 = WORLD_COUNTRIES length (lib/worldCountries.ts, same list as /sell)
// 20  = SUPPORTED_CURRENCIES length (lib/currency.ts)
// 19  = OutreachLang union size (lib/outreachI18n.ts)
// Identity verification = lib/identity.ts (Stripe Identity, pass/fail only)
// Escrow / dispute-freeze flow mirrors the payout mechanics on /sell.
// Do not write a number here that no code backs up.

export const metadata = {
    title: 'How Velor works — Velor Marketplace',
    description:
          'Every listing carries its country and its maker. Money is held in escrow until delivery is confirmed. Every seller is identity-verified.',
    alternates: { canonical: 'https://velorcommerce.store/about' },
}

const journeySteps = [
  {
        num: '01',
        title: 'Everything has an origin',
        body:
                'Every listing on Velor carries the country it comes from and the maker who made or sourced it. Not as a footnote — as the point. You shop the world the way you would travel it: by place, by craft, by the things a country does better than anywhere else.',
  },
  {
        num: '02',
        title: 'In your currency, in your language',
        body:
                'Prices convert live into 20 currencies and reconfirm at checkout. Write to a seller in your language, they answer in theirs — Velor translates both ways and always shows the original.',
  },
  ]

const protectionFlow = [
  {
        step: 'STEP 01',
        title: 'You pay Velor',
        body: 'Money is charged at checkout through Stripe and held in escrow — never sent straight to the seller.',
        tag: 'Held',
  },
  {
        step: 'STEP 02',
        title: 'The seller ships, tracked',
        body: 'Tracking is issued the moment the parcel is collected. You watch it the whole way — so do we.',
        tag: 'Held',
  },
  {
        step: 'STEP 03',
        title: 'You confirm delivery',
        body: 'The order completes once delivery is confirmed — by you, or automatically once tracking shows it arrived.',
        tag: 'Confirmed',
  },
  {
        step: 'STEP 04',
        title: 'Only then, released',
        body: 'The seller is paid after your order completes — not before. Your order was protected the entire time it was in transit.',
        tag: 'Released',
        green: true,
  },
  ]

const stats = [
  { label: 'Countries', value: '190', note: 'Sellers can list from, and ship to, anywhere' },
  { label: 'Currencies', value: '20', note: 'Prices convert live, reconfirmed at checkout' },
  { label: 'Languages', value: '19', note: 'Sellers supported in their own language' },
  ]

const css = `
.ab{background:var(--bg);color:var(--text);font-family:var(--font-body);position:relative}
.ab::before{content:'';position:fixed;top:-320px;left:50%;transform:translateX(-50%);width:1000px;height:560px;background:radial-gradient(50% 50% at 50% 50%, rgba(255,107,0,.08) 0%, rgba(255,107,0,0) 100%);pointer-events:none}
.ab a{color:inherit;text-decoration:none}
.ab-wrap{max-width:1240px;margin:0 auto;padding:0 32px;position:relative}
.ab h1,.ab h2,.ab h3{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.ab section{padding:66px 0}
.ab-shead{margin-bottom:30px}
.ab-shead h2{font-size:29px}
.ab-shead p{font-size:14.5px;color:var(--muted);margin:9px 0 0;max-width:66ch;line-height:1.65}
.ab-hero{padding:74px 0 30px;display:grid;grid-template-columns:1.15fr .85fr;gap:60px;align-items:center}
.ab-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;font-weight:600}
.ab-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.ab-hero h1{font-size:48px;line-height:1.08;margin-bottom:20px;max-width:18ch}
.ab-lede{font-size:17px;color:var(--muted);line-height:1.7;max-width:52ch;margin:0 0 16px}
.ab-btn{border-radius:11px;padding:15px 30px;font-size:15px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
.ab-btn-p{background:var(--accent);color:#160a00 !important}
.ab-btn-s{background:none;border:1px solid var(--border);margin-left:10px}
.ab-stack{display:grid;gap:14px}
.ab-stat{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:22px 26px;display:flex;align-items:center;gap:20px;transition:transform .15s, border-color .15s}
.ab-stat:hover{transform:translateY(-2px);border-color:#3d3d46}
.ab-stat .n{font-family:var(--font-display);font-size:30px;font-weight:700;color:var(--accent);min-width:74px}
.ab-stat .t{font-size:13.5px;color:var(--muted);line-height:1.55}
.ab-stat .t b{color:var(--text);font-weight:500}
.ab-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:8px}
.ab-fstep{padding:26px 28px 6px;border-left:2px solid var(--border)}
.ab-fstep.green{border-left-color:var(--green)}
.ab-fnum{font-family:var(--font-display);font-size:12px;letter-spacing:.14em;color:var(--muted);margin-bottom:12px}
.ab-fstep h3{font-size:16.5px;margin-bottom:9px}
.ab-fstep p{font-size:13.5px;color:var(--muted);line-height:1.65;margin:0}
.ab-tag{display:inline-block;margin-top:12px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;border-radius:5px;padding:4px 9px;border:1px solid var(--border);color:var(--muted)}
.ab-tag.rel{color:var(--green);border-color:rgba(46,204,113,.4)}
.ab-freeze{margin-top:30px;border:1px solid rgba(226,75,74,.35);border-radius:13px;background:rgba(226,75,74,.05);padding:16px 20px;font-size:13.5px;line-height:1.6;color:var(--muted);max-width:74ch}
.ab-freeze b{color:var(--text)}
.ab-verify{border:1px solid rgba(255,107,0,.32);border-radius:20px;background:linear-gradient(135deg,rgba(255,107,0,.08) 0%,rgba(255,107,0,0) 60%),var(--surface);padding:44px 46px;box-shadow:0 30px 80px rgba(0,0,0,.35);display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.ab-verify .toplbl{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:12px}
.ab-verify h2{font-size:27px;margin-bottom:14px;max-width:16ch}
.ab-verify p{font-size:14.5px;color:var(--muted);line-height:1.7;margin:0 0 14px;max-width:52ch}
.ab-verify-badge{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--green);margin-top:6px}
.ab-verify-list{border:1px solid var(--border);border-radius:16px;background:var(--bg);padding:8px}
.ab-verify-row{display:flex;align-items:center;gap:14px;padding:16px 18px;border-bottom:1px solid var(--border)}
.ab-verify-row:last-child{border-bottom:none}
.ab-verify-row .ic{width:34px;height:34px;border-radius:9px;background:rgba(255,107,0,.12);color:var(--accent);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:13px;flex-shrink:0}
.ab-verify-row .tx b{display:block;font-size:13.5px;font-weight:600;margin-bottom:2px}
.ab-verify-row .tx span{font-size:12.5px;color:var(--muted);line-height:1.5}
.ab-stats{display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:18px}
.ab-statcard{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:26px 24px;transition:transform .15s, border-color .15s}
.ab-statcard:hover{transform:translateY(-3px);border-color:#3d3d46}
.ab-statcard .v{font-size:36px;font-weight:700;font-family:var(--font-display);color:var(--accent);margin:0 0 4px}
.ab-statcard .l{font-size:14px;font-weight:600;margin:0 0 4px}
.ab-statcard .note{font-size:13px;color:var(--muted);margin:0}
.ab-journey{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
.ab-jcard{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:30px 32px;position:relative;overflow:hidden;transition:transform .15s, border-color .15s}
.ab-jcard:hover{transform:translateY(-3px);border-color:#3d3d46}
.ab-jnum{position:absolute;right:18px;top:12px;font-family:var(--font-display);font-size:64px;font-weight:700;color:transparent;-webkit-text-stroke:1px #26262d}
.ab-jcard h3{font-size:19px;margin-bottom:11px;max-width:20ch}
.ab-jcard p{font-size:14px;color:var(--muted);line-height:1.7;max-width:46ch;margin:0}
.ab-founding{border:1px solid rgba(255,107,0,.32);border-radius:18px;padding:42px 46px;display:flex;align-items:center;justify-content:space-between;gap:38px;background:linear-gradient(120deg,rgba(255,107,0,.06) 0%,rgba(255,107,0,0) 55%),var(--surface);flex-wrap:wrap}
.ab-founding h2{font-size:27px;margin-bottom:11px;max-width:22ch}
.ab-founding p{font-size:14.5px;color:var(--muted);line-height:1.65;max-width:54ch;margin:0}
.ab-legal{font-size:12.5px;color:var(--muted);margin-top:8px}
@media(max-width:980px){
.ab-hero{grid-template-columns:1fr;gap:36px;padding:44px 0 20px}
.ab-hero h1{font-size:34px}
.ab-flow,.ab-journey{grid-template-columns:1fr}
.ab-verify{grid-template-columns:1fr;padding:30px 26px}
}
`

export default function AboutPage() {
  return (
    <div className="ab">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ab-wrap">
        <section className="ab-hero">
          <div>
            <div className="ab-eyebrow"><span className="ab-dot" />How Velor works</div>
            <h1>Buy from the source. Sell to the world.</h1>
            <p className="ab-lede">Every listing on Velor carries the country it comes from and the maker who made or sourced it. Money is held in escrow until you confirm delivery. Every seller is identity-verified before they can list.</p>
            <p className="ab-lede">No middlemen guessing at your order, no unverified sellers, no surprise fees at checkout.</p>
            <div>
              <Link href="/shop" className="ab-btn ab-btn-p">Explore the marketplace</Link>
              <Link href="#protection" className="ab-btn ab-btn-s">See how your money is protected</Link>
            </div>
          </div>
          <div className="ab-stack">
            <div className="ab-stat"><div className="n">190</div><div className="t">Countries sellers can list from and ship to</div></div>
            <div className="ab-stat"><div className="n">ID</div><div className="t">Every seller is <b>identity-verified</b> via Stripe Identity before their first listing goes live</div></div>
            <div className="ab-stat"><div className="n">GBP</div><div className="t">Your payment sits in <b>escrow</b> until delivery is confirmed</div></div>
          </div>
        </section>
      </div>

      <div className="ab-wrap">
        <section id="protection">
          <div className="ab-shead">
            <h2>How your money is protected</h2>
            <p>Every order on Velor moves through the same four steps, whether it&apos;s a small print or a large piece of furniture.</p>
          </div>
          <div className="ab-flow">
            {protectionFlow.map((s) => (
              <div key={s.step} className={`ab-fstep${s.green ? ' green' : ''}`}>
                <div className="ab-fnum">{s.step}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <span className={`ab-tag${s.green ? ' rel' : ''}`}>{s.tag}</span>
              </div>
            ))}
          </div>
          <div className="ab-freeze"><b>If something goes wrong</b>, funds stay frozen in escrow until the dispute is resolved — a seller cannot draw on a payment that&apos;s under dispute.</div>
        </section>
      </div>

      <div className="ab-wrap">
        <section>
          <div className="ab-verify">
            <div>
              <div className="toplbl">Identity verification</div>
              <h2>Every seller is a verified person</h2>
              <p>Before anyone can list on Velor, they pass identity verification through Stripe Identity — the same check used by banks and regulated marketplaces.</p>
              <div className="ab-verify-badge">Powered by Stripe Identity</div>
            </div>
            <div className="ab-verify-list">
              <div className="ab-verify-row"><div className="ic">ID</div><div className="tx"><b>Government ID checked</b><span>Matched against the seller&apos;s application details before approval</span></div></div>
              <div className="ab-verify-row"><div className="ic">--</div><div className="tx"><b>Document never stored by Velor</b><span>Verification is handled and retained by Stripe, not on our servers</span></div></div>
              <div className="ab-verify-row"><div className="ic">OK</div><div className="tx"><b>Traceable by design</b><span>A verified identity sits behind every storefront on the platform</span></div></div>
            </div>
          </div>
        </section>
      </div>

      <div className="ab-wrap">
        <section>
          <div className="ab-shead">
            <h2>Built for buying across borders</h2>
          </div>
          <div className="ab-stats">
            {stats.map((s) => (
              <div key={s.label} className="ab-statcard">
                <p className="v">{s.value}</p>
                <p className="l">{s.label}</p>
                <p className="note">{s.note}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="ab-wrap">
        <section>
          <div className="ab-journey">
            {journeySteps.map((j) => (
              <div key={j.num} className="ab-jcard">
                <div className="ab-jnum">{j.num}</div>
                <h3>{j.title}</h3>
                <p>{j.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="ab-wrap">
        <section>
          <div className="ab-founding">
            <div>
              <h2>Make something your country is known for?</h2>
              <p>Velor is built for makers and sellers with real origin stories, not warehouses of unbranded stock. If that&apos;s you, there&apos;s a seller door at the end of this page.</p>
              <p className="ab-legal">Velor Commerce Ltd is registered in England and Wales.</p>
            </div>
            <Link href="/apply" className="ab-btn ab-btn-p">Apply to sell</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
