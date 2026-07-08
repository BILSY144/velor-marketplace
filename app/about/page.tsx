import Link from 'next/link'

// /about — the "How it works" destination in the header nav. Rewritten
// 2026-07-09 to the origin positioning: this page is the manifesto plus the
// honest mechanics (escrow, verification), for buyers first, with one seller
// door at the end. No fee percentages here — commission detail lives on
// /sell where a prospective seller compares tiers in full.

export const metadata = {
  title: 'How Velor works — Velor Marketplace',
  description:
    'Every listing carries its country and its maker. Money is held in escrow until delivery is confirmed. Every seller is identity-verified.',
}

const steps = [
  {
    num: '01',
    title: 'Everything has an origin',
    body:
      'Every listing on Velor carries the country it comes from and the maker who made or sourced it. Not as a footnote — as the point. You shop the world the way you would travel it: by place, by craft, by the things a country does better than anywhere else.',
  },
  {
    num: '02',
    title: 'Every seller is a verified person',
    body:
      'Before a store opens, the seller verifies a government ID through Stripe. Velor never sees or stores the document — only the result. No anonymous storefronts, no untraceable sellers.',
  },
  {
    num: '03',
    title: 'Your money is protected the whole way',
    body:
      'You pay Velor, not the seller. The money sits in escrow while your order ships — tracked from collection to your door — and stays held until delivery is confirmed. Open a dispute and the funds freeze immediately. No exceptions, for anyone.',
  },
  {
    num: '04',
    title: 'In your currency, in your language',
    body:
      'Prices convert live into 20 currencies and reconfirm at checkout. Write to a seller in your language, they answer in theirs — Velor translates both ways and always shows the original.',
  },
]

export default function AboutPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '80px 24px 90px' }}>
        <p style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 12, fontWeight: 600, letterSpacing: '.13em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 18 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          How Velor works
        </p>
        <h1 style={{ fontSize: 48, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.08, margin: '0 0 22px', maxWidth: '18ch' }}>
          The world has more to sell than you&apos;ve been shown.
        </h1>
        <p style={{ fontSize: 17.5, lineHeight: 1.7, color: 'var(--muted)', margin: '0 0 14px', maxWidth: '58ch' }}>
          Everywhere makes something better than everywhere else. Japan forges knives the way it once
          forged swords. Morocco has tanned leather the same way for a thousand years. Korea reinvented
          skincare. Ghana weaves cloth you can read like a language.
        </p>
        <p style={{ fontSize: 17.5, lineHeight: 1.7, color: 'var(--muted)', margin: 0, maxWidth: '58ch' }}>
          Most marketplaces flatten all of that into anonymous listings from nowhere. Velor is built the
          other way up: a global marketplace where the origin is the organising idea, real makers are the
          only sellers, and buying something means knowing exactly where it came from.
        </p>

        <div style={{ marginTop: 64 }}>
          {steps.map((s) => (
            <div key={s.num} style={{ position: 'relative', borderTop: '1px solid var(--border)', padding: '36px 0 34px' }}>
              <div aria-hidden style={{ position: 'absolute', right: 0, top: 26, fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 700, lineHeight: 1, color: 'transparent', WebkitTextStroke: '1px #26262d', userSelect: 'none' }}>
                {s.num}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', margin: '0 0 10px' }}>{s.title}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: 0, maxWidth: '62ch' }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, margin: '56px 0 64px' }}>
          {[
            { label: 'Countries', value: '190', note: 'Sellers can list from, and ship to, anywhere' },
            { label: 'Currencies', value: '20', note: 'Prices convert live, reconfirmed at checkout' },
            { label: 'Languages', value: '19', note: 'Sellers supported in their own language' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '26px 24px' }}>
              <p style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent)', margin: '0 0 4px' }}>{s.value}</p>
              <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{s.note}</p>
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid rgba(255,107,0,.32)', background: 'var(--surface)', borderRadius: 18, padding: '36px 34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 500, fontFamily: 'var(--font-display)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
              Make something your country is known for?
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0, maxWidth: '48ch', lineHeight: 1.6 }}>
              The first verified seller from each country opens it on Velor — and keeps the founding
              badge and Pro free for life.
            </p>
          </div>
          <Link href="/apply" style={{ display: 'inline-block', background: 'var(--accent)', color: '#160a00', textDecoration: 'none', padding: '15px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15 }}>
            Apply to sell
          </Link>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 40 }}>
          Velor Commerce Ltd is registered in England and Wales.
        </p>
      </section>
    </main>
  )
}
