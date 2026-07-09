'use client'

// /help — rebuilt 2026-07-09 to the design standard. FAQ content updated to
// the channel + origin positioning. Standing rules: buyer-facing money copy
// says only "held until delivery is confirmed" (no payout timing anywhere on
// public pages — the schedule lives in the seller agreement); live badges
// are never faked; live broadcasting is the founding privilege.

import { useState } from 'react'
import Link from 'next/link'

const FAQS: { category: string; blurb: string; items: { q: string; a: string }[] }[] = [
  {
    category: 'Buying',
    blurb: 'Ordering, paying, and what happens if something goes wrong.',
    items: [
      { q: 'Where do the products come from?', a: 'Everything on Velor carries its origin — the country it comes from and the maker who made or sourced it. You can shop by country, by speciality, or straight from a live broadcast.' },
      { q: 'Is my money safe?', a: 'Yes. You pay Velor, not the seller, through Stripe. The money is held until delivery is confirmed — and if anything is wrong, opening a dispute freezes the funds immediately.' },
      { q: 'How do I place an order?', a: 'Browse the shop, add items to your basket, and check out. Prices convert live into 20 currencies and are reconfirmed at checkout.' },
      { q: 'What payment methods are accepted?', a: 'Visa, Mastercard, American Express and other major cards, processed securely by Stripe. Velor never sees your card details.' },
      { q: 'Can I track my order?', a: 'Yes. Tracking is issued the moment the parcel is collected, and you can watch it the whole way from your orders page.' },
      { q: 'What is the returns policy?', a: 'Most items can be returned within 15 days of confirmed delivery. Start a return from the order page and the seller takes it from there.' },
      { q: 'My item arrived damaged — what do I do?', a: 'Open a dispute from your order page within 7 days. The funds freeze immediately while our team reviews the case and ensures a fair resolution.' },
    ],
  },
  {
    category: 'Velor Live',
    blurb: 'The shopping channel — watching, buying, and who broadcasts.',
    items: [
      { q: 'What is Velor Live?', a: 'The live side of the channel. Sellers broadcast from the workshop, the market stall, the kitchen — you watch things being made, ask questions in real time, and buy without leaving the stream.' },
      { q: 'How do I buy from a stream?', a: 'The products a seller is showing sit right below the broadcast. Tap one, check out as normal, and keep watching — your money is protected the same way as any other order.' },
      { q: 'Is a LIVE badge always real?', a: 'Always. A LIVE badge on Velor means a real person is on air right now — we never fake liveness, ever. Anything labelled Preview is exactly that.' },
      { q: 'Can any seller broadcast?', a: 'Live broadcasting is the founding privilege: the first verified seller from each country keeps Velor Live access for life — it is not part of any standard subscription.' },
    ],
  },
  {
    category: 'Selling',
    blurb: 'Opening your country, fees, and how you get paid.',
    items: [
      { q: 'How do I start selling on Velor?', a: 'Apply on the Sell on Velor page. Every seller verifies a government ID before their store opens, and you get a decision within 24 hours of your verification completing.' },
      { q: 'What does it cost?', a: 'Nothing to list — ever. You pay commission when you sell: 12% on the free Starter tier, 8% on Pro, 5% on Enterprise. The earnings calculator on the Sell page shows the honest maths for your numbers.' },
      { q: 'How do payouts work?', a: 'Buyers pay into escrow, and once delivery is confirmed your earnings are queued for payout on the schedule in your seller agreement — to Stripe Connect, or Payoneer where Stripe is unavailable.' },
      { q: 'What do founding sellers get?', a: 'The first verified seller from each country keeps Pro free for life, live broadcasting on Velor Live for life, the permanent founding badge, and the first store on their country’s page.' },
      { q: 'Can I sell internationally?', a: 'Yes — that is the point. Your listings are visible worldwide by default, prices convert into the buyer’s currency, and you can sell and get support in your own language.' },
      { q: 'How do listings get approved?', a: 'Submit a listing and it is reviewed within 1 to 2 business days. You get an email either way.' },
    ],
  },
  {
    category: 'Account',
    blurb: 'Signing in and getting help.',
    items: [
      { q: 'How do I create an account?', a: 'Click Sign in at the top of any page and follow the prompts — an email address is all you need to start.' },
      { q: 'I forgot my password — how do I reset it?', a: 'Click Sign in, then Forgot password, and a reset link goes to your email.' },
      { q: 'How do I contact Velor?', a: 'Use the contact page or email support@velorcommerce.store — we reply within one business day.' },
    ],
  },
]

const css = `
.vhc{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh}
.vhc a{color:var(--accent);text-decoration:none}
.vhc-wrap{max-width:860px;margin:0 auto;padding:64px 32px 90px}
.vhc-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:18px;font-weight:600}
.vhc-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.vhc h1{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;font-size:42px;line-height:1.08;margin:0 0 14px}
.vhc-lede{font-size:16px;color:var(--muted);line-height:1.65;margin:0 0 50px;max-width:56ch}
.vhc-cat{margin-bottom:44px}
.vhc-cathead{display:flex;align-items:baseline;gap:14px;margin-bottom:16px;flex-wrap:wrap}
.vhc-cathead h2{font-family:var(--font-display);font-weight:500;font-size:21px;letter-spacing:-0.01em;margin:0}
.vhc-catblurb{font-size:13px;color:var(--muted)}
.vhc-catline{flex:1;height:1px;background:var(--border);align-self:center;min-width:40px}
.vhc-item{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:8px;transition:border-color .15s}
.vhc-item.open{border-color:rgba(255,107,0,.4)}
.vhc-q{width:100%;text-align:left;padding:16px 20px;background:none;border:none;color:var(--text);cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:500;font-family:var(--font-body);gap:16px}
.vhc-q .m{font-size:19px;color:var(--muted);flex:0 0 auto;font-weight:400}
.vhc-a{padding:0 20px 17px;font-size:14px;line-height:1.7;color:var(--muted)}
.vhc-still{border:1px solid rgba(255,107,0,.32);background:var(--surface);border-radius:16px;padding:28px 30px;margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.vhc-still h2{font-family:var(--font-display);font-weight:500;font-size:20px;margin:0 0 6px;letter-spacing:-0.01em}
.vhc-still p{font-size:14px;color:var(--muted);line-height:1.6;margin:0;max-width:52ch}
.vhc-btn{display:inline-block;background:var(--accent);color:#160a00 !important;border-radius:10px;padding:13px 24px;font-size:14px;font-weight:600;white-space:nowrap}
@media(max-width:720px){.vhc h1{font-size:32px}}
`

export default function HelpPage() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="vhc">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="vhc-wrap">
        <div className="vhc-eyebrow"><span className="vhc-dot" /> Help centre</div>
        <h1>How can we help?</h1>
        <p className="vhc-lede">
          The common questions, answered plainly — buying, watching the channel, selling, and
          your account. Anything else, the contact page reaches a real reply within a day.
        </p>

        {FAQS.map(cat => (
          <div className="vhc-cat" key={cat.category}>
            <div className="vhc-cathead">
              <h2>{cat.category}</h2>
              <span className="vhc-catblurb">{cat.blurb}</span>
              <span className="vhc-catline" />
            </div>
            {cat.items.map(item => {
              const key = cat.category + item.q
              const isOpen = open === key
              return (
                <div key={item.q} className={'vhc-item' + (isOpen ? ' open' : '')}>
                  <button className="vhc-q" onClick={() => setOpen(isOpen ? null : key)}>
                    {item.q}
                    <span className="m">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && <div className="vhc-a">{item.a}</div>}
                </div>
              )
            })}
          </div>
        ))}

        <div className="vhc-still">
          <div>
            <h2>Still stuck?</h2>
            <p>
              Write to us and a real answer comes back within one business day — in your own
              language, if you prefer.
            </p>
          </div>
          <Link className="vhc-btn" href="/contact">Contact Velor</Link>
        </div>
      </div>
    </div>
  )
}
