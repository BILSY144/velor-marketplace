import Link from 'next/link'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'
import { SUPPORTED_CURRENCIES } from '@/lib/currencyData'
import { OUTREACH_V2 } from '@/lib/outreachI18n'

// /press — built 2026-07-15 at William's request, alongside the first real
// press outreach (10 pitches sent this week to ChannelX, EcommerceBytes,
// UKTN, e27, Inc42, MENAbytes, Sifted, Positive News, Rest of World and
// others). Previously journalists had to email in for a press kit; this
// page is that kit, live.
//
// Every fact below is true of the live platform today, same standing rule
// as every other page in this codebase (see /about, /sell, /founding):
//   190 countries   = WORLD_COUNTRIES.length (lib/worldCountries.ts)
//   20 currencies    = SUPPORTED_CURRENCIES.length (lib/currencyData.ts)
//   19 languages     = Object.keys(OUTREACH_V2).length (lib/outreachI18n.ts)
//   6 August 2026    = the same launch date used sitewide (/sell, /founding)
//   Company details  = Velor Commerce Ltd no. 17268133, same as /about footer
//
// Deliberately NOT claimed here: app store links. The mobile app has a
// built, installable Android APK and Play Console + Apple Developer
// registrations in progress (see CLAUDE.md's 2026-07-15 app checkpoints),
// but is not yet publicly distributed via the App Store or Google Play --
// linking a store badge that 404s is worse for press credibility than
// describing the real, honest state ("in final testing ahead of launch").
//
// Deliberately NOT claimed here: the AI-operations story is written to
// match exactly what actually happens, not a stronger version of it --
// AI agents research, draft, and do the legwork on seller recruitment and
// outreach; William reviews and sends every message himself. That
// precision is the point: a journalist who asks "so does the AI email
// people without you seeing it?" gets the same answer this page gives.
export const metadata = {
  title: 'Press — Velor',
  description:
    'Velor is a global marketplace for authentic cultural goods, built and run by a solo founder working with AI agents. Launching to buyers 6 August 2026.',
  alternates: { canonical: 'https://velorcommerce.store/press' },
  openGraph: {
    title: 'Press — Velor',
    description:
      'Velor is a global marketplace for authentic cultural goods, built and run by a solo founder working with AI agents. Launching to buyers 6 August 2026.',
    url: 'https://velorcommerce.store/press',
    siteName: 'Velor',
    locale: 'en_GB',
    type: 'website',
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Press — Velor',
    description:
      'Velor is a global marketplace for authentic cultural goods, built and run by a solo founder working with AI agents. Launching to buyers 6 August 2026.',
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

const COUNTRY_COUNT = WORLD_COUNTRIES.length
const CURRENCY_COUNT = SUPPORTED_CURRENCIES.length
const LANGUAGE_COUNT = Object.keys(OUTREACH_V2).length

const facts = [
  { v: '6 Aug', l: 'Launch date', note: 'The date buyers arrive on Velor' },
  { v: String(COUNTRY_COUNT), l: 'Countries', note: 'Sellers can list from, and ship to, any of them' },
  { v: String(CURRENCY_COUNT), l: 'Currencies', note: 'Prices convert live, reconfirmed at checkout' },
  { v: String(LANGUAGE_COUNT), l: 'Languages', note: 'Sellers are recruited and supported in their own language' },
]

const css = `
.pr{background:var(--bg);color:var(--text);font-family:var(--font-body);position:relative}
.pr::before{content:'';position:fixed;top:-320px;left:50%;transform:translateX(-50%);width:1000px;height:560px;background:radial-gradient(50% 50% at 50% 50%, rgba(255,107,0,.08) 0%, rgba(255,107,0,0) 100%);pointer-events:none}
.pr a{color:inherit;text-decoration:none}
.pr-wrap{max-width:1080px;margin:0 auto;padding:0 32px;position:relative}
.pr h1,.pr h2,.pr h3{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;margin:0}
.pr section{padding:60px 0}
.pr-shead{margin-bottom:26px}
.pr-shead h2{font-size:27px}
.pr-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;font-weight:600}
.pr-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.pr-hero{padding:70px 0 20px}
.pr-hero h1{font-size:46px;line-height:1.1;margin-bottom:20px;max-width:20ch}
.pr-lede{font-size:17px;color:var(--muted);line-height:1.7;max-width:66ch;margin:0 0 28px}
.pr-btn{border-radius:11px;padding:14px 26px;font-size:14.5px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
.pr-btn-p{background:var(--accent);color:#160a00 !important}
.pr-btn-s{background:none;border:1px solid var(--border);margin-left:10px}
.pr-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:44px}
.pr-fact{border:1px solid var(--border);border-radius:14px;background:var(--surface);padding:22px 20px}
.pr-fact .v{font-family:var(--font-display);font-size:30px;font-weight:700;color:var(--accent);margin:0 0 4px}
.pr-fact .l{font-size:13.5px;font-weight:600;margin:0 0 4px}
.pr-fact .note{font-size:12.5px;color:var(--muted);margin:0;line-height:1.5}
.pr-body p{font-size:15.5px;color:var(--muted);line-height:1.75;max-width:70ch;margin:0 0 18px}
.pr-quote{border-left:3px solid var(--accent);padding:4px 0 4px 24px;margin:30px 0;font-family:var(--font-display);font-size:19px;line-height:1.55;color:var(--text);max-width:64ch}
.pr-quote cite{display:block;font-family:var(--font-body);font-style:normal;font-size:13px;color:var(--muted);margin-top:12px}
.pr-honest{border:1px solid rgba(255,107,0,.3);border-radius:14px;background:var(--surface);padding:22px 24px;margin-top:8px;max-width:70ch}
.pr-honest .lbl{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:10px}
.pr-honest p{font-size:14px;color:var(--muted);line-height:1.7;margin:0}
.pr-linkrow{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
.pr-linkcard{border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:16px 20px;font-size:14px;font-weight:600;transition:border-color .15s,transform .15s}
.pr-linkcard:hover{border-color:var(--accent);transform:translateY(-2px)}
.pr-release{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:36px 40px}
.pr-release h3{font-size:22px;margin-bottom:6px;max-width:26ch}
.pr-release .kicker{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:14px}
.pr-release p{font-size:14.5px;color:var(--muted);line-height:1.75;max-width:74ch;margin:0 0 16px}
.pr-release p b{color:var(--text)}
.pr-kit{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.pr-kitcard{border:1px solid var(--border);border-radius:14px;background:var(--surface);padding:22px 22px;transition:border-color .15s,transform .15s}
.pr-kitcard:hover{border-color:#3d3d46;transform:translateY(-2px)}
.pr-kitcard img{max-width:100%;height:44px;object-fit:contain;object-position:left;margin-bottom:14px;display:block}
.pr-kitcard .t{font-size:14px;font-weight:600;margin-bottom:4px}
.pr-kitcard .d{font-size:12.5px;color:var(--muted);line-height:1.5}
.pr-contact{border:1px solid rgba(255,107,0,.32);border-radius:18px;padding:38px 42px;display:flex;align-items:center;justify-content:space-between;gap:32px;background:linear-gradient(120deg,rgba(255,107,0,.06) 0%,rgba(255,107,0,0) 55%),var(--surface);flex-wrap:wrap}
.pr-contact h2{font-size:25px;margin-bottom:10px;max-width:22ch}
.pr-contact p{font-size:14px;color:var(--muted);line-height:1.6;margin:0}
@media(max-width:900px){
.pr-hero h1{font-size:32px}
.pr-facts{grid-template-columns:1fr 1fr}
.pr-kit{grid-template-columns:1fr}
.pr-release{padding:26px 24px}
}
`

export default function PressPage() {
  return (
    <div className="pr">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="pr-wrap">
        <section className="pr-hero">
          <div className="pr-eyebrow"><span className="pr-dot" />Press</div>
          <h1>One founder. AI doing the legwork. A marketplace for {COUNTRY_COUNT} countries.</h1>
          <p className="pr-lede">
            Velor (velorcommerce.store) is a global marketplace for authentic cultural goods —
            every listing carries its maker&apos;s name and country of origin. It opens to buyers
            on 6 August 2026, built and operated almost entirely by one person working alongside
            AI agents. This page is the press kit: the story, the real numbers, the release, and
            how to reach us.
          </p>
          <div>
            <a className="pr-btn pr-btn-p" href="#release">Read the press release</a>
            <a className="pr-btn pr-btn-s" href="#contact">Media contact</a>
          </div>

          <div className="pr-facts">
            {facts.map((f) => (
              <div key={f.l} className="pr-fact">
                <p className="v">{f.v}</p>
                <p className="l">{f.l}</p>
                <p className="note">{f.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="pr-shead"><h2>The story</h2></div>
          <div className="pr-body">
            <p>
              Search any major marketplace for a &ldquo;Moroccan tagine&rdquo; or a &ldquo;handwoven
              kilim&rdquo; and the results are dominated by anonymous, factory-made copies. The
              artisans keeping those traditions alive are largely invisible. Velor was built to
              reverse that: if a product doesn&apos;t have a named maker and a genuine origin, it
              isn&apos;t listed.
            </p>
            <blockquote className="pr-quote">
              &ldquo;The people who actually make things had become invisible on the big
              marketplaces. On Velor, the maker and the origin are the whole point.&rdquo;
              <cite>William Sinclair, Founder, Velor</cite>
            </blockquote>
            <p>
              What makes Velor unusual isn&apos;t just the marketplace — it&apos;s who built it,
              and how. William Sinclair has a physical disability that rules out manual work, and
              built Velor entirely from a laptop in a shed. That constraint is what shaped the way
              Velor gets run: AI agents carry a large share of the operational work — researching
              and drafting seller outreach across dozens of countries and 19 languages, screening
              prospective sellers, and handling day-to-day site content and engineering alongside
              him. It is not autonomous — William reviews and personally sends every outreach
              message and makes every product and business decision — but the AI-assisted
              approach is what has let one person, working from a shed, build and run a
              190-country marketplace ahead of launch.
            </p>
          </div>

          <div className="pr-honest">
            <div className="lbl">On the record, precisely</div>
            <p>
              A companion Velor mobile app exists and is in final testing ahead of launch — a real,
              installable build exists today, with app store submissions in progress — but it is
              not yet publicly available on the App Store or Google Play. We&apos;ll update this
              page the day it is.
            </p>
          </div>
        </section>

        <section>
          <div className="pr-shead">
            <h2>See the platform live</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14.5, margin: '9px 0 0' }}>
              Velor is live today, ahead of the 6 August buyer launch — the founding-seller
              programme, the shopping experience, and the seller pitch are all real and running.
            </p>
          </div>
          <div className="pr-linkrow">
            <Link className="pr-linkcard" href="/founding">The founding-seller atlas &rarr;</Link>
            <Link className="pr-linkcard" href="/sell">The seller pitch &rarr;</Link>
            <Link className="pr-linkcard" href="/origins">Shop by origin &rarr;</Link>
            <Link className="pr-linkcard" href="/about">How Velor works &rarr;</Link>
          </div>
        </section>

        <section id="release">
          <div className="pr-shead"><h2>Press release</h2></div>
          <div className="pr-release">
            <div className="kicker">For immediate release — embargo option available on request</div>
            <h3>New Global Marketplace Velor Launches to Put the Maker — and the Country — Back on the Label</h3>
            <p>
              <b>UNITED KINGDOM</b> — Velor (velorcommerce.store), a new online marketplace for
              authentic cultural goods, opens to buyers on 6 August 2026. Built around a single
              premise — that every product should carry its maker&apos;s name and country of
              origin — Velor connects independent artisans, cooperatives and small heritage
              brands directly with customers worldwide.
            </p>
            <p>
              Velor is open to sellers from every one of the world&apos;s {COUNTRY_COUNT} countries,
              with a founding seat reserved for whoever verifies and lists first from each one.
              Sellers deal with the platform entirely in their own language — seller communications
              are currently localized into {LANGUAGE_COUNT} languages. Prices display to buyers in{' '}
              {CURRENCY_COUNT} currencies. Payments are escrow-protected, released to the seller on
              delivery, with payouts via Stripe where supported and Payoneer opening on a rolling
              basis for the countries Stripe does not cover.
            </p>
            <p>
              Ahead of launch, Velor is offering founding-seller places: the platform&apos;s Pro
              plan free for founding sellers, with commission applying only on completed sales.
              Velor includes built-in live selling — makers can broadcast from the workshop,
              showing the loom, the wheel or the forge behind each product.
            </p>
            <p>
              Velor is operated by Velor Commerce Ltd, United Kingdom. Buyers arrive 6 August 2026.
            </p>
          </div>
        </section>

        <section>
          <div className="pr-shead">
            <h2>Media kit</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14.5, margin: '9px 0 0' }}>
              Logo files for editorial use. Additional imagery — founder photo, product
              screenshots, mobile app captures — available on request as the catalogue and app
              store listings go live.
            </p>
          </div>
          <div className="pr-kit">
            <a className="pr-kitcard" href="/velor-logo-2026.png" download>
              <img src="/velor-logo-2026.png" alt="" />
              <div className="t">Primary logo (PNG)</div>
              <div className="d">The current live wordmark, as shown in the site header.</div>
            </a>
            <a className="pr-kitcard" href="/brand/velor-logo-master.png" download>
              <img src="/brand/velor-logo-master.png" alt="" />
              <div className="t">Master logo file (PNG)</div>
              <div className="d">Higher-resolution source file for print or large formats.</div>
            </a>
            <a className="pr-kitcard" href="mailto:hello@velorcommerce.co.uk?subject=Media%20kit%20request">
              <div className="t">Need something else?</div>
              <div className="d">Email hello@velorcommerce.co.uk and we&apos;ll send it over directly.</div>
            </a>
          </div>
        </section>

        <section>
          <div className="pr-contact" id="contact">
            <div>
              <h2>Media contact</h2>
              <p>
                William Sinclair, Founder<br />
                hello@velorcommerce.co.uk<br />
                velorcommerce.store
              </p>
              <p style={{ marginTop: 10, fontSize: 12.5 }}>
                Velor Commerce Ltd (company no. 17268133), registered in England and Wales.
              </p>
            </div>
            <a className="pr-btn pr-btn-p" href="mailto:hello@velorcommerce.co.uk">Get in touch</a>
          </div>
        </section>
      </div>
    </div>
  )
}
