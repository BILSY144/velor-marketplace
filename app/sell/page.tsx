'use client'

// /sell — the seller pitch page, ported 2026-07-08 from velor-sell.html.
// Every figure on this page must be true of the live platform:
//   190       = WORLD_COUNTRIES length (same list as /apply and the flag strip)
//   24h       = APPLICATION_SLA_HOURS, enforced by /api/cron/review-applications
//   10/4/0%   = TIER_COMMISSION in app/api/stripe/payment-intent/route.ts
//   GBP 49 = Pro subscription (Enterprise retired 2026-07-15)
// The old copy rule stands: do not write a number here that no code backs up.
//
// Payout detail policy (William, 2026-07-08): public pages do not state hold
// windows or release timing — the full payout schedule lives in the seller
// agreement shown at signup. This page says payouts follow the agreement.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { APPLICATION_SLA_HOURS } from '@/lib/sellerApplicationReview'

const TIERS = [
  { name: 'Starter', sub: 0, com: 0.1, fee: 'Free · 10% commission', meta: 'No subscription. Every tool included. The right start for most sellers.' },
  { name: 'Pro', sub: 49, com: 0.04, fee: '£49 / month · 4% commission', meta: 'Pays for itself past £820 a month. Free for life for founding sellers.' },
]

const css = `
.vs{background:var(--bg);color:var(--text);font-family:var(--font-body);position:relative}
.vs::before{content:'';position:fixed;top:-320px;left:50%;transform:translateX(-50%);width:1000px;height:560px;background:radial-gradient(50% 50% at 50% 50%, rgba(255,107,0,.08) 0%, rgba(255,107,0,0) 100%);pointer-events:none}
.vs a{color:inherit;text-decoration:none}
.vs-wrap{max-width:1240px;margin:0 auto;padding:0 32px;position:relative}
.vs h1,.vs h2,.vs h3{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.vs section{padding:66px 0}
.vs-shead{margin-bottom:30px}
.vs-shead h2{font-size:29px}
.vs-shead p{font-size:14.5px;color:var(--muted);margin:9px 0 0;max-width:66ch;line-height:1.65}
.vs-hero{padding:74px 0 30px;display:grid;grid-template-columns:1.1fr .9fr;gap:60px;align-items:center}
.vs-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;font-weight:600}
.vs-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.vs-hero h1{font-size:52px;line-height:1.06;margin-bottom:20px;max-width:15ch}
.vs-lede{font-size:17px;color:var(--muted);line-height:1.65;max-width:48ch;margin:0 0 30px}
.vs-btn{border-radius:11px;padding:15px 30px;font-size:15px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
.vs-btn-p{background:var(--accent);color:#160a00 !important}
.vs-btn-s{background:none;border:1px solid var(--border);margin-left:10px}
.vs-microtrust{display:flex;gap:22px;font-size:13px;color:var(--muted);flex-wrap:wrap;margin-top:26px}
.vs-microtrust i{color:var(--green);font-style:normal;margin-right:6px}
.vs-stack{display:grid;gap:14px}
.vs-stat{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:22px 26px;display:flex;align-items:center;gap:20px;transition:transform .15s, border-color .15s}
.vs-stat:hover{transform:translateY(-2px);border-color:#3d3d46}
.vs-stat .n{font-family:var(--font-display);font-size:34px;font-weight:700;color:var(--accent);min-width:96px}
.vs-stat .t{font-size:13.5px;color:var(--muted);line-height:1.55}
.vs-stat .t b{color:var(--text);font-weight:500}
.vs-calc{border:1px solid var(--border);border-radius:20px;background:var(--surface);padding:40px 44px;box-shadow:0 30px 80px rgba(0,0,0,.35)}
.vs-calc .toplbl{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:12px}
.vs-calc h2{font-size:26px;margin-bottom:8px}
.vs-calc .sub{font-size:14px;color:var(--muted);margin:0 0 30px;max-width:60ch;line-height:1.6}
.vs-sliderrow{display:flex;align-items:baseline;gap:18px;margin-bottom:14px;flex-wrap:wrap}
.vs-bigval{font-family:var(--font-display);font-size:46px;font-weight:700;line-height:1}
.vs-unit{font-size:15px;color:var(--muted)}
.vs-range{width:100%;-webkit-appearance:none;appearance:none;height:8px;border-radius:99px;background:var(--surface-2);outline:none;margin:8px 0 34px}
.vs-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:26px;border-radius:50%;background:var(--text);border:4px solid var(--accent);cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.5)}
.vs-tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.vs-tier{border:1px solid var(--border);border-radius:16px;padding:24px 26px;background:var(--bg);position:relative;transition:border-color .2s, transform .2s}
.vs-tier.best{border-color:var(--accent);transform:translateY(-4px)}
.vs-bestbadge{position:absolute;top:-11px;left:22px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;background:var(--accent);color:#160a00;border-radius:5px;padding:4px 9px;opacity:0;transition:opacity .2s}
.vs-tier.best .vs-bestbadge{opacity:1}
.vs-tier h3{font-size:17px;margin-bottom:3px}
.vs-tier .fee{font-size:12.5px;color:var(--muted);margin-bottom:18px}
.vs-tier .keep{font-family:var(--font-display);font-size:31px;font-weight:700;transition:color .2s}
.vs-tier.best .keep{color:var(--accent)}
.vs-tier .keeplbl{font-size:11.5px;color:var(--muted);margin-top:4px;letter-spacing:.04em}
.vs-tier .meta{border-top:1px solid var(--border);margin-top:18px;padding-top:14px;font-size:12.5px;color:var(--muted);line-height:1.7}
.vs-calcnote{font-size:12px;color:var(--muted);margin-top:22px;line-height:1.6}
.vs-policy{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.vs-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:8px}
.vs-fstep{padding:26px 28px 6px;border-left:2px solid var(--border)}
.vs-fstep.green{border-left-color:var(--green)}
.vs-fnum{font-family:var(--font-display);font-size:12px;letter-spacing:.14em;color:var(--muted);margin-bottom:12px}
.vs-fstep h3{font-size:16.5px;margin-bottom:9px}
.vs-fstep p{font-size:13.5px;color:var(--muted);line-height:1.65;margin:0}
.vs-tag{display:inline-block;margin-top:12px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;border-radius:5px;padding:4px 9px;border:1px solid var(--border);color:var(--muted)}
.vs-tag.rel{color:var(--green);border-color:rgba(46,204,113,.4)}
.vs-freeze{margin-top:30px;border:1px solid rgba(226,75,74,.35);border-radius:13px;background:rgba(226,75,74,.05);padding:16px 20px;font-size:13.5px;line-height:1.6;color:var(--muted);max-width:74ch}
.vs-freeze b{color:var(--text)}
.vs-journey{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.vs-jcard{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:26px 28px;position:relative;overflow:hidden;transition:transform .15s, border-color .15s}
.vs-jcard:hover{transform:translateY(-3px);border-color:#3d3d46}
.vs-jnum{position:absolute;right:14px;top:10px;font-family:var(--font-display);font-size:58px;font-weight:700;color:transparent;-webkit-text-stroke:1px #26262d}
.vs-jcard h3{font-size:17px;margin-bottom:9px;max-width:18ch}
.vs-jcard p{font-size:13.5px;color:var(--muted);line-height:1.65;max-width:32ch;margin:0}
.vs-jtag{display:inline-block;margin-top:14px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--green)}
.vs-founding{border:1px solid rgba(255,107,0,.32);border-radius:18px;padding:42px 46px;display:flex;align-items:center;justify-content:space-between;gap:38px;background:linear-gradient(120deg,rgba(255,107,0,.06) 0%,rgba(255,107,0,0) 55%),var(--surface);flex-wrap:wrap}
.vs-founding h2{font-size:27px;margin-bottom:11px;max-width:22ch}
.vs-founding p{font-size:14.5px;color:var(--muted);line-height:1.65;max-width:54ch;margin:0}.vs-launch{border:1px solid rgba(255,107,0,.32);border-radius:20px;background:linear-gradient(135deg,rgba(255,107,0,.08) 0%,rgba(255,107,0,0) 60%),var(--surface);padding:46px 48px;box-shadow:0 30px 80px rgba(0,0,0,.35);margin-bottom:8px}.vs-launch .toplbl{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:12px}.vs-launch h2{font-size:28px;margin-bottom:12px;max-width:26ch}.vs-launch .sub{font-size:15px;color:var(--muted);margin:0 0 34px;max-width:66ch;line-height:1.7}.vs-count{display:flex;gap:14px;margin-bottom:38px;flex-wrap:wrap;align-items:center}.vs-countbox{border:1px solid var(--border);border-radius:14px;background:var(--bg);padding:16px 20px;min-width:84px;text-align:center;position:relative;overflow:hidden}.vs-countbox .v{font-family:var(--font-display);font-size:38px;font-weight:700;color:var(--accent);line-height:1;position:relative}.vs-countbox .l{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:8px;position:relative}.vs-countlabel{font-size:13px;color:var(--muted);margin-left:4px}.vs-launch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px}.vs-launch-card{border:1px solid var(--border);border-radius:16px;background:var(--bg);padding:24px 24px 22px;transition:transform .15s,border-color .15s}.vs-launch-card:hover{transform:translateY(-3px);border-color:rgba(255,107,0,.5)}.vs-launch-card .ic{font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--accent);letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}.vs-launch-card h3{font-size:16.5px;margin-bottom:9px}.vs-launch-card p{font-size:13.5px;color:var(--muted);line-height:1.65;margin:0}.vs-launch-risk{border-top:1px solid var(--border);padding-top:22px;font-size:13.5px;color:var(--muted);line-height:1.6;max-width:80ch}.vs-launch-risk b{color:var(--text)}@media(max-width:980px){.vs-launch{padding:30px 24px}.vs-launch-grid{grid-template-columns:1fr}.vs-count{gap:10px}.vs-countbox{min-width:70px;padding:12px 14px}.vs-countbox .v{font-size:28px}}
@media(max-width:980px){
.vs-hero{grid-template-columns:1fr;gap:36px;padding:44px 0 20px}
.vs-hero h1{font-size:36px}
.vs-tiers,.vs-journey{grid-template-columns:1fr}
.vs-flow{grid-template-columns:1fr}
.vs-calc{padding:26px 22px}
}
`

function gbp(n: number) {
  return '£' + Math.round(n).toLocaleString('en-GB')
}

export default function SellPage() {
  const [sales, setSales] = useState(1000); const LAUNCH_AT = new Date('2026-08-06T00:00:00+01:00').getTime(); const [now, setNow] = useState<number | null>(null); useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, []); const msLeft = now !== null ? Math.max(0, LAUNCH_AT - now) : null; const dLeft = msLeft !== null ? Math.floor(msLeft / 86400000) : null; const hLeft = msLeft !== null ? Math.floor((msLeft % 86400000) / 3600000) : null; const mLeft = msLeft !== null ? Math.floor((msLeft % 3600000) / 60000) : null; const sLeft = msLeft !== null ? Math.floor((msLeft % 60000) / 1000) : null



  const keeps = TIERS.map(t => Math.max(0, sales * (1 - t.com) - t.sub))
  const best = keeps.indexOf(Math.max(...keeps))
  const pct = ((sales - 100) / (20000 - 100)) * 100

  return (
    <div className="vs">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="vs-wrap">
        <div className="vs-hero">
          <div>
            <div className="vs-eyebrow"><span className="vs-dot" /> Sell on Velor &middot; buyers arrive 6 August</div>
            <h1>Your country&apos;s shopping channel.</h1>
            <p className="vs-lede">
              Velor is a live shopping channel with a marketplace built in. Your listings sell
              around the clock — and sellers go on air from the workshop, the stall, the
              kitchen, selling in the stream while buyers watch it made. Buyers come looking for
              what your country does best, and your name, your city and your story stay on every
              listing.
            </p>
            <div>
              <Link className="vs-btn vs-btn-p" href="/apply">Apply to sell</Link>
              <a className="vs-btn vs-btn-s" href="#calc">See what you&apos;d keep</a>
            </div>
            <div className="vs-microtrust">
              <span><i>&#10003;</i>Free to start</span>
              <span><i>&#10003;</i>Decision within {APPLICATION_SLA_HOURS} hours of verification</span>
              <span><i>&#10003;</i>Sell in your own language</span>
            </div>
          </div>
          <div className="vs-stack">
            <div className="vs-stat"><div className="n">LIVE</div><div className="t"><b>Live broadcasting — for every seller.</b> Go on air on Velor Live from any tier, Starter included. Founding sellers keep the whole Pro tier free for life.</div></div>
            <div className="vs-stat"><div className="n">190</div><div className="t"><b>Countries, one marketplace.</b> Your country&apos;s page exists the day you list — and the first seller from each country opens it.</div></div>
            <div className="vs-stat"><div className="n">0%</div><div className="t"><b>Listing fees. None.</b> You pay commission when you sell, or a subscription that lowers it. Nothing to list.</div></div>
            <div className="vs-stat"><div className="n">{APPLICATION_SLA_HOURS}h</div><div className="t"><b>Application decision</b> within {APPLICATION_SLA_HOURS} hours of your identity verification completing. The clock is ours, the camera is yours.</div></div>
          </div>
        </div>
      </div>

      <section style={{ paddingTop: 0 }}><div className="vs-wrap"><div className="vs-launch"><div className="toplbl">The honest answer</div><h2>We don&apos;t have buyers yet. Here&apos;s exactly what that means for you.</h2><p className="sub">Every established marketplace&apos;s commission buys access to an audience that already exists. Velor&apos;s doesn&apos;t — not yet. Buyers arrive 6 August. Until then, here is exactly what joining costs you, and exactly what you get for going first.</p><div className="vs-count"><div className="vs-countbox"><div className="v">{dLeft ?? '—'}</div><div className="l">Days</div></div><div className="vs-countbox"><div className="v">{hLeft ?? '—'}</div><div className="l">Hours</div></div><div className="vs-countbox"><div className="v">{mLeft ?? '—'}</div><div className="l">Minutes</div></div><div className="vs-countbox"><div className="v">{sLeft ?? '—'}</div><div className="l">Seconds</div></div><span className="vs-countlabel">until buyers arrive on Velor</span></div><div className="vs-launch-grid"><div className="vs-launch-card"><div className="ic">Cost while you wait</div><h3>£0, not a maybe</h3><p>Starter has no monthly fee, and commission is only ever charged on a completed sale. Every day between now and 6 August costs you nothing — the risk of listing early is your time, never your money.</p></div><div className="vs-launch-card"><div className="ic">Shelf space</div><h3>First, not buried</h3><p>Each of the 190 country pages opens with its first verified seller. List now and you are what buyers see the moment a country switches on — not one listing among thousands in a marketplace that filled up without you.</p></div><div className="vs-launch-card"><div className="ic">Founding perks</div><h3>Benefits that don&apos;t come back</h3><p>The first verified seller from each country keeps the full Pro tier free for life — unlimited listings, Go Live, the dedicated AI account manager — a deal no seller gets by joining after the doors are already open.</p></div></div><div className="vs-launch-risk"><b>Put plainly:</b> the commission and subscription numbers above only start mattering once a buyer actually pays you. Between now and 6 August, joining Velor is free, reversible, and the only thing it asks of you is the time to list.</div></div></div></section><section id="calc">
        <div className="vs-wrap">
          <div className="vs-calc">
            <div className="toplbl">The honest maths</div>
            <h2>What would you keep?</h2>
            <p className="sub">Drag to your expected monthly sales. Every tier is shown with its real
            cost — commission plus subscription — so the best tier for you is a calculation, not a
            sales pitch.</p>

            <div className="vs-sliderrow">
              <span className="vs-bigval">{gbp(sales)}</span>
              <span className="vs-unit">in sales per month</span>
            </div>
            <input
              className="vs-range" type="range" min={100} max={20000} step={100} value={sales}
              onChange={e => setSales(parseInt(e.target.value, 10))}
              style={{ background: `linear-gradient(90deg,var(--accent) 0%,var(--accent) ${pct}%,var(--surface-2) ${pct}%)` }}
            />

            <div className="vs-tiers">
              {TIERS.map((t, i) => (
                <div key={t.name} className={'vs-tier' + (i === best ? ' best' : '')}>
                  <div className="vs-bestbadge">Best for you</div>
                  <h3>{t.name}</h3>
                  <div className="fee">{t.fee}</div>
                  <div className="keep">{gbp(keeps[i])}</div>
                  <div className="keeplbl">yours per month, after Velor</div>
                  <div className="meta">{t.meta}</div>
                </div>
              ))}
            </div>
            <div className="vs-calcnote">Figures are sales minus commission minus subscription, in GBP.
            You price in your own currency; buyers pay in theirs.</div>
          </div>
        </div>
      </section>

      <section className="vs-policy">
        <div className="vs-wrap">
          <div className="vs-shead">
            <h2>How and when you get paid</h2>
            <p>The same protection that makes buyers trust a store they&apos;ve never heard of is the
            reason your sales convert.</p>
          </div>
          <div className="vs-flow">
            <div className="vs-fstep">
              <div className="vs-fnum">STEP 01</div>
              <h3>The buyer pays Velor</h3>
              <p>Money is charged at checkout through Stripe and held in escrow. It is never in
              limbo — it is reserved for you.</p>
              <span className="vs-tag">Held</span>
            </div>
            <div className="vs-fstep">
              <div className="vs-fnum">STEP 02</div>
              <h3>You ship, tracked</h3>
              <p>Tracking is issued the moment the parcel is collected. The buyer watches it the
              whole way — so do we.</p>
              <span className="vs-tag">Held</span>
            </div>
            <div className="vs-fstep">
              <div className="vs-fnum">STEP 03</div>
              <h3>Delivery is confirmed</h3>
              <p>The order completes and your payout is queued on the schedule in your seller
              agreement.</p>
              <span className="vs-tag">Confirmed</span>
            </div>
            <div className="vs-fstep green">
              <div className="vs-fnum">STEP 04</div>
              <h3>Paid, your way</h3>
              <p>Weekly payouts by Stripe where supported. Payoneer is on the way for everywhere else — sign up today and your earnings are held safely until payouts go live for your country.</p>
              <span className="vs-tag rel">Released</span>
            </div>
          </div>
          <div className="vs-freeze"><b>The one exception, stated plainly:</b> an open return or dispute
          freezes that order&apos;s funds until it is resolved. No exceptions, for anyone — it is the
          promise that makes the whole marketplace work, and it protects you as much as the buyer.</div>
        </div>
      </section>

      <section>
        <div className="vs-wrap">
          <div className="vs-shead">
            <h2>From application to first sale</h2>
            <p>Three steps, and the slowest one is the post office.</p>
          </div>
          <div className="vs-journey">
            <div className="vs-jcard"><div className="vs-jnum">01</div>
              <h3>Apply and verify</h3>
              <p>Tell us what you make and where. Verify your identity with a government ID — hosted
              by Stripe, never stored by Velor.</p>
              <span className="vs-jtag">Decision within {APPLICATION_SLA_HOURS}h of verification</span>
            </div>
            <div className="vs-jcard"><div className="vs-jnum">02</div>
              <h3>List with your origin on it</h3>
              <p>Your country, your city, your specialities, your words — on every listing and every
              product card.</p>
              <span className="vs-jtag">Reviewed within 6 hours</span>
            </div>
            <div className="vs-jcard"><div className="vs-jnum">03</div>
              <h3>Sell in your language</h3>
              <p>Buyers write in theirs, you write in yours — Velor translates both ways and always
              shows the original. Support answers you in your language too.</p>
              <span className="vs-jtag">19 languages and counting</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="vs-wrap">
          <div className="vs-founding">
            <div>
              <div className="vs-eyebrow"><span className="vs-dot" /> Founding sellers</div>
              <h2>First from your country? Pro is free, for life.</h2>
              <p>The first verified seller from each country opens it on Velor — and keeps the
              founding badge, the showreel slot, Pro free for as long as the subscription runs
              unbroken — every Pro benefit, on the house, for as long as they keep selling.</p>
            </div>
            <Link className="vs-btn vs-btn-p" href="/founding">See the open countries</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
