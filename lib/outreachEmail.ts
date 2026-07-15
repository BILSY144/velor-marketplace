// Localized founding-seller outreach emails.
//
// This is the single source of truth for the 3-touch outreach sequence.
// It supersedes the English-only buildOutreachEmail() still exported from
// lib/email.ts (that copy is now unused by any caller and is scheduled for
// deletion -- do not add features to it).
//
// Why localized: Velor recruits sellers worldwide, weighted towards the East.
// A cold email that opens in the seller's own language, and promises they can
// deal with Velor in that language, is a genuine differentiator. The promise
// is true: the Velor assistant and the agent inbox reply in whatever language
// the seller writes in (see LANG_RULE in app/api/assistant/chat/route.ts).
//
// Language is resolved from the prospect's country. Unknown country -> English.
// No translation API is called; all copy is hand-written in lib/outreachI18n.ts.
//
// Every claim remains verifiably true of the live platform: free listing on the
// Starter plan, 10% commission only on completed sales, 190+ shipping
// destinations, live prices in 20 currencies, escrow-protected payments,
// payouts via Stripe or Payoneer, buyers arrive 6 August 2026. The unsubscribe
// link is mandatory in every email.
//
// RENDERING (2026-07-09, William): the visual design below is unchanged from
// the previous version -- same colours, same copy, same layout. What changed
// is the HTML *structure* underneath it. The previous build used plain
// `<div style="background:...">` for every coloured region. Modern clients
// (Gmail, Apple Mail, Outlook web/mobile) render that fine, but classic
// desktop Outlook on Windows renders HTML email through Microsoft Word's
// engine, which routinely ignores `background-color`/`border-radius` on
// `<div>` and silently falls back to plain white -- no error, just a
// "boring white email" where a dark, on-brand one was sent. Every region
// that carries its own distinct background colour is now a
// `<table><td bgcolor="#hex" style="background:#hex;...">` instead: the
// `bgcolor` HTML attribute is one of the oldest, most universally supported
// pieces of HTML and is what Word's engine actually honours. Gradients keep
// their CSS `linear-gradient` for clients that support it, plus a solid
// `bgcolor` fallback (Outlook shows the solid colour instead of the
// gradient -- expected, standard, and infinitely better than white). Two
// meta tags are added so Gmail/Apple Mail's automatic dark-mode colour
// inversion doesn't fight an email that is intentionally, permanently dark.

import {
  OUTREACH_COPY,
  OUTREACH_V2,
  RTL_OUTREACH_LANGS,
  langForCountry,
  type OutreachLang,
} from './outreachI18n'

// V2 REDESIGN (2026-07-16, William's design): the initial email now follows
// his "Bring Your Country's Culture to the World" layout -- centered serif
// masthead, hero image band, kicker between hairlines, big serif headline
// with an orange accent, three centered paragraphs, a 2x2 feature grid with
// line icons, categories line, full-width orange CTA pill (a DIRECT link to
// /apply/invited per William), and the REAL CULTURE / REAL PEOPLE / GLOBAL
// OPPORTUNITY tagline. Assets live in public/email-assets/ (line icons are
// generated; outreach-hero.jpg is a brand-styled fallback band until William
// supplies the hero art from his design as a standalone file).
// Two corrections vs the mockup, on purpose: the footer carries the REAL
// registered company (Velor Commerce Ltd, no. 17268133 -- the mockup's
// "Velor Global Market Ltd 16243986" does not exist), and the Pro panel says
// "free for founding sellers" rather than "lifetime / first verified seller
// per country", which is not currently a platform policy.
const ASSETS = 'https://velorcommerce.store/email-assets'

export type OutreachEmailType = 'initial' | 'followup1' | 'followup2'

export interface OutreachProspect {
  name: string
  platform: string
  storeUrl: string
  category: string
  // 'multiplier' (2026-07-15): a partner ORGANIZATION representing many
  // makers (cooperative, fair-trade org, craft association). Gets the
  // partnership pitch below instead of the single-maker copy. English only
  // by design: these orgs have staff, and hand-writing a second full
  // template in 19 languages adds risk, not value.
  sellerType: 'individual' | 'small_business' | 'brand' | 'multiplier'
  country?: string | null
}

function h(text: string) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Region-specific hero art (2026-07-16, William): the hero band matches the
// prospect's part of the world when a regional image exists; everyone else
// gets the global default. William generates each region's art (no text in
// the image, same copper/globe style); new regions are added here as their
// files land in public/email-assets/hero-<region>.jpg.
const HERO_REGIONS: Array<{ file: string; codes: string[]; names: string[] }> = [
  {
    file: 'hero-morocco.jpg',
    codes: ['MA', 'EG', 'AE', 'SA', 'JO', 'QA', 'KW', 'TN', 'DZ', 'BH', 'OM', 'LB'],
    names: ['MOROCCO', 'EGYPT', 'EMIRATES', 'SAUDI', 'JORDAN', 'QATAR', 'KUWAIT', 'TUNISIA', 'ALGERIA', 'BAHRAIN', 'OMAN', 'LEBANON', 'DUBAI'],
  },
  {
    file: 'hero-seasia.jpg',
    codes: ['VN', 'TH', 'ID', 'MY', 'PH', 'SG', 'KH', 'LA', 'MM'],
    names: ['VIETNAM', 'THAILAND', 'INDONESIA', 'MALAYSIA', 'PHILIPPINES', 'SINGAPORE', 'CAMBODIA', 'LAOS', 'MYANMAR', 'BALI'],
  },
  {
    file: 'hero-mexico.jpg',
    codes: ['MX', 'GT'],
    names: ['MEXICO', 'GUATEMALA', 'OAXACA', 'PUEBLA'],
  },
  {
    file: 'hero-japan.jpg',
    codes: ['JP'],
    names: ['JAPAN', 'KYOTO', 'OSAKA', 'TOKYO'],
  },
  {
    file: 'hero-india.jpg',
    codes: ['IN', 'BD'],
    names: ['INDIA', 'BANGLADESH', 'RAJASTHAN', 'JAIPUR', 'DELHI', 'MUMBAI'],
  },
  {
    file: 'hero-eastafrica.jpg',
    codes: ['KE', 'ET', 'TZ', 'UG', 'RW'],
    names: ['KENYA', 'ETHIOPIA', 'TANZANIA', 'UGANDA', 'RWANDA', 'MAASAI'],
  },
  {
    file: 'hero-westafrica.jpg',
    codes: ['GH', 'ML', 'NG', 'SN', 'CI', 'BF', 'TG', 'BJ', 'CM'],
    names: ['GHANA', 'MALI', 'NIGERIA', 'SENEGAL', 'IVORY COAST', "COTE D'IVOIRE", 'BURKINA', 'TOGO', 'BENIN', 'CAMEROON'],
  },
  {
    file: 'hero-europe.jpg',
    codes: ['PL', 'PT', 'IT', 'GR', 'ES', 'FR', 'DE', 'NL', 'BE', 'AT', 'CH', 'CZ', 'HU', 'RO', 'HR', 'BG', 'LT', 'LV', 'EE', 'SK', 'SI', 'IE', 'DK', 'SE', 'NO', 'FI'],
    names: ['POLAND', 'PORTUGAL', 'ITALY', 'GREECE', 'SPAIN', 'FRANCE', 'GERMANY', 'NETHERLANDS', 'BELGIUM', 'AUSTRIA', 'CZECH', 'HUNGARY', 'ROMANIA', 'CROATIA', 'BULGARIA', 'LITHUANIA', 'LATVIA', 'ESTONIA', 'SLOVAK', 'SLOVENIA', 'IRELAND', 'DENMARK', 'SWEDEN', 'NORWAY', 'FINLAND'],
  },
]

function heroForCountry(country: string | null | undefined): string {
  if (!country) return 'outreach-hero.jpg'
  const key = country.trim().toUpperCase()
  for (const r of HERO_REGIONS) {
    if (r.codes.includes(key)) return r.file
    if (r.names.some((n) => key.includes(n))) return r.file
  }
  return 'outreach-hero.jpg'
}

// Bulletproof table+bgcolor wrapper for any block that needs its own solid
// background colour distinct from its parent. `extra` carries any additional
// td-level styles (padding, borders) so callers keep exact prior spacing.
function colorBlock(bg: string, extra: string, inner: string): string {
  return `<table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='background:${bg};'><tr><td bgcolor='${bg}' style='background:${bg};${extra}'>${inner}</td></tr></table>`
}

// Badge sits in its own row above the ident bar so it never collides with
// the "VELOR / SHOPPING CHANNEL" text underneath it. Same two colour
// regions as before (#141414 badge row, #0D0D0D ident bar); now built as
// one bulletproof table with a spacer row in place of the old margin-top.
// align='right' as an HTML attribute (not just CSS) is what actually shifts
// a block-level table to the right in Outlook -- text-align on the parent
// only ever reliably aligns inline content, not a nested table.
const GLOBAL_MARKET_BADGE = `<table role='presentation' align='right' border='0' cellpadding='0' cellspacing='0'><tr><td bgcolor='#1FAE7A' style='background-color:#1FAE7A;background-image:url('https://velorcommerce.store/email-assets/badge-bg.png');background-size:100% 100%;background-repeat:no-repeat;color:#06231A;font-size:10.5px;font-weight:800;letter-spacing:1px;padding:6px 12px;border-radius:100px;'>GLOBAL MARKET</td></tr></table>`

// V2 masthead, cropped directly from William's template file: the VELOR
// globe-O wordmark image on black, then the full-width orange rule with a
// centered diamond. dir stays ltr -- a centered wordmark is direction-neutral.
const OUTREACH_HEADER = `<table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' dir='ltr'>
  <tr><td bgcolor='#010101' align='center' style='background-color:#010101;background:#010101;padding:24px 32px 20px;'>
    <img src='${ASSETS}/masthead.png' width='310' alt='VELOR — GLOBAL MARKET' style='display:block;margin:0 auto;width:310px;height:auto;border:0;'>
  </td></tr>
  <tr><td bgcolor='#010101' style='background-color:#010101;background:#010101;'>
    <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0'>
      <tr>
        <td style='border-bottom:1px solid #FF6B00;font-size:0;line-height:0;'>&nbsp;</td>
        <td width='26' align='center' style='color:#FF6B00;font-size:12px;line-height:12px;padding:0 2px;'>&#9670;</td>
        <td style='border-bottom:1px solid #FF6B00;font-size:0;line-height:0;'>&nbsp;</td>
      </tr>
    </table>
  </td></tr>
</table>`

// The footer stays in English on purpose: it is the compliance/identification
// block, and "Unsubscribe" is the string recipients and mail clients expect.
// V2: William's design footer, but with the REAL registered company details
// (Velor Commerce Ltd, company no. 17268133).
function outreachFooter(name: string, platform: string, unsubUrl: string) {
  const inner = `<table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0'>
    <tr>
      <td width='150' valign='middle'>
        <div style='font-family:Georgia,"Times New Roman",serif;color:#FF6B00;font-size:19px;font-weight:700;letter-spacing:5px;'>VELOR</div>
        <div style='font-family:Arial,Helvetica,sans-serif;color:#8a8a8a;font-size:8px;letter-spacing:3px;padding-top:4px;'>GLOBAL&nbsp;MARKET</div>
      </td>
      <td valign='middle' style='border-left:1px solid #2A2A2A;padding-left:18px;'>
        <div style='font-family:Arial,Helvetica,sans-serif;color:#9a9a9a;font-size:12px;line-height:1.6;'>Connecting independent sellers and cultures worldwide.</div>
      </td>
    </tr>
  </table>
  <div style='border-top:1px solid #222222;margin-top:18px;padding-top:14px;font-family:Arial,Helvetica,sans-serif;color:#666666;font-size:10.5px;letter-spacing:1px;text-align:center;'>VELOR COMMERCE LTD &nbsp;|&nbsp; UNITED KINGDOM</div>
  <p style='font-family:Arial,Helvetica,sans-serif;color:#5a5a5a;font-size:11px;line-height:1.6;margin:12px 0 0;text-align:center;'>You received this because ${h(name)} appeared on a public ${h(platform)} listing. Not interested? <a href='${unsubUrl}' style='color:#FF6B00;text-decoration:underline;'>Unsubscribe</a> &mdash; one click and we will not contact you again.</p>`
  return `<table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0'><tr><td bgcolor='#0A0A0A' style='background-color:#0A0A0A;background:#0A0A0A;padding:24px 32px;border-top:1px solid #2A2A2A;' dir='ltr'>${inner}</td></tr></table>`
}

// No icon column -- William's approved reference (saved 2026-07-09,
// C:\Users\wills\Downloads\velor-outreach-email-initial.html) renders each
// benefit as plain title+body under its own border-top rule. Match it
// exactly rather than the icon-box variant that had crept in.
function benefitRow(title: string, body: string) {
  return `<div style='border-top:1px solid #2A2A2A;padding:16px 0;'><div style='color:#FFFFFF;font-size:14px;font-weight:700;margin-bottom:2px;'>${title}</div><div style='color:#A9A9A9;font-size:13px;line-height:1.6;'>${body}</div></div>`
}

// Pro-plan value card, placed right before the CTA. Mirrors the actual
// "Pro" tier card in components/dashboard/TierUpgradeView.tsx -- same
// purple gradient, same "Most popular" kicker, same 6 features and real
// price (ÃÂ£49/mo, struck through) -- so the email promises exactly what
// the website delivers, not a made-up summary. Falls back to English
// copy for any language not yet translated (see OutreachCopy.proTitle).
// The purple gradient keeps a solid #5B21B6 bgcolor fallback for Outlook.
function proPlanCard(c: { proTitle?: string; proFeatures?: string[]; proCommissionNote?: string }): string {
  const title = c.proTitle || OUTREACH_COPY.en.proTitle
  const features = c.proFeatures && c.proFeatures.length ? c.proFeatures : OUTREACH_COPY.en.proFeatures!
  // "FREE" describes the monthly fee only -- without this line it reads as
  // if commission is free too, which it is not (William caught this).
  const commissionNote = c.proCommissionNote || OUTREACH_COPY.en.proCommissionNote
  const featureRows = features
    .map(
      (f) =>
        `<tr><td style='color:#EDE9FE;font-size:13px;line-height:1.9;padding:2px 0;'><span style='color:#C4B5FD;'>&#10003;</span>&nbsp; ${f}</td></tr>`
    )
    .join('')
  const inner = `<div style='display:inline-block;background-color:#4b3a7a;background:rgba(255,255,255,0.18);color:#FFFFFF;font-size:10.5px;font-weight:800;letter-spacing:1px;padding:5px 12px;border-radius:100px;margin-bottom:14px;'>MOST POPULAR</div>
    <div style='color:#FFFFFF;font-size:16px;font-weight:800;margin-bottom:10px;'>${title}</div>
    <div style='margin-bottom:6px;'>
      <span style='color:rgba(255,255,255,0.55);font-size:14px;text-decoration:line-through;'>&pound;49/mo</span>
      <span style='color:#FFFFFF;font-size:14px;font-weight:800;margin-left:10px;'>FREE</span>
    </div>
    <div style='color:rgba(255,255,255,0.65);font-size:11.5px;line-height:1.5;margin-bottom:14px;'>${commissionNote}</div>
    <table role='presentation' width='100%' cellpadding='0' cellspacing='0'>${featureRows}</table>`
  return `<table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='margin:8px 0 22px;'><tr><td bgcolor='#5B21B6' style='background-color:#5B21B6;background-image:url('https://velorcommerce.store/email-assets/pro-card-bg.png');background-size:100% 100%;background-repeat:no-repeat;border-radius:12px;padding:22px 24px;'>${inner}</td></tr></table>`
}

// The language promise -- rendered as a distinct panel so it reads as a
// commitment rather than a footnote. This is the selling point.
function languagePanel(text: string) {
  return `<table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='margin:22px 0 0;'><tr><td bgcolor='#0D0D0D' style='background-color:#0D0D0D;background:#0D0D0D;border:1px solid #2A2A2A;border-left:3px solid #FF6B00;border-radius:0 8px 8px 0;padding:14px 16px;'>
    <div style='color:#EAEAEA;font-size:13px;line-height:1.6;'>${text}</div>
  </td></tr></table>`
}

// Bulletproof button: bgcolor on the <td> guarantees the orange fill in
// Outlook even if the <a>'s own CSS background is ignored.
function ctaButton(url: string, label: string): string {
  return `<table role='presentation' border='0' cellpadding='0' cellspacing='0'><tr><td bgcolor='#FF6B00' style='background-color:#FF6B00;background:#FF6B00;border-radius:8px;'>
    <a href='${url}' style='display:inline-block;background-color:#FF6B00;background:#FF6B00;color:#0D0D0D;font-size:15px;font-weight:800;text-decoration:none;padding:14px 34px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;'>${label}</a>
  </td></tr></table>`
}

// Partnership pitch for multiplier organizations. Reuses the exact same
// chrome (header, footer, CTA button, benefit rows) as the maker emails so
// the brand reads identically; only the words change. Every claim is true of
// the live platform, same discipline as the maker copy.
const MULTIPLIER_COPY = {
  subjectInitial: 'A founding-seller partnership for your artisans on Velor -- before buyers arrive 6 August',
  subjectFollowup1: 'How your artisans join Velor as founding sellers (4 steps)',
  subjectFollowup2: 'Last call: founding-seller places for your artisans on Velor',
  badge: 'PARTNER INVITATION',
  headline: 'Bring your artisans to a global marketplace built for them',
  intro:
    'Velor is a new global marketplace for authentic cultural goods -- every listing carries its maker and country of origin, and buyers arrive on 6 August 2026. We are inviting a small number of artisan organizations to join as founding partners before launch: every one of your member makers can claim a founding-seller place, free.',
  b1t: 'Founding Pro plan, free for your members',
  b1b: 'Each maker you bring gets the Pro seller plan (normally £49/mo) free as a founding seller -- their own storefront, listings, and payouts.',
  b2t: 'Built for where your makers are',
  b2b: 'Live prices in 20 currencies, 190+ shipping destinations, and sellers can deal with Velor entirely in their own language -- our team replies in whatever language they write.',
  f1Intro: 'A quick follow-up on the founding-partner invitation. Getting your artisans onto Velor takes four steps:',
  f1s1: 'Reply to this email or apply at the link below -- tell us roughly how many makers you represent.',
  f1s2: 'We set up founding-seller places for your members (free Pro plan for every one).',
  f1s3: 'Makers list their goods -- each listing carries the maker’s name and country of origin.',
  f1s4: 'Buyers arrive 6 August. Payouts are escrow-protected and released on delivery.',
  f2Line1: 'Buyers arrive on Velor on 6 August, and founding-partner places close before then. This is our last note about it.',
  f2Line2: 'If bringing your artisans to a global marketplace -- free, in their own language, with their craft and country on every listing -- is interesting, reply to this email and we will set it up together.',
  cta: 'Start the partnership',
  ctaNote: 'Or simply reply to this email -- a real person reads every reply, in any language.',
  signoff: 'William Sinclair<br>Founder, Velor -- velorcommerce.store',
}

function buildMultiplierBody(
  c: typeof MULTIPLIER_COPY,
  emailType: OutreachEmailType,
  p: OutreachProspect,
  cta: (label: string) => string,
  appNote: string
): string {
  if (emailType === 'initial') {
    // Same v2 visual language as the maker initial email (William's design):
    // hero band, kicker between hairlines, serif headline with orange accent,
    // centered paragraphs, icon feature grid, full-width pill CTA, tagline.
    const featCell = (icon: string, title: string, note: string, extra: string) =>
      `<td width='25%' align='center' valign='top' style='padding:20px 8px;${extra}'>
        <img src='${ASSETS}/icon-${icon}.png' width='44' alt='' style='display:block;margin:0 auto 10px;width:44px;height:auto;'>
        <div style='font-family:Arial,Helvetica,sans-serif;color:#EAEAEA;font-size:12px;font-weight:bold;line-height:1.5;'>${title}</div>
        ${note ? `<div style='font-family:Arial,Helvetica,sans-serif;color:#8a8a8a;font-size:10.5px;line-height:1.5;padding-top:3px;'>${note}</div>` : ''}
      </td>`
    return `
      <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0'><tr><td bgcolor='#010101' style='background-color:#010101;padding:0;'>
        <img src='${ASSETS}/${heroForCountry(p.country)}' width='600' alt='Velor -- a global network of makers and buyers' style='display:block;width:100%;height:auto;border:0;'>
      </td></tr></table>
      <div style='padding:30px 36px 36px;text-align:center;'>
        <table role='presentation' border='0' cellpadding='0' cellspacing='0' align='center' style='margin:0 auto;'>
          <tr>
            <td width='40' style='border-top:1px solid #3a2410;font-size:0;line-height:0;'>&nbsp;</td>
            <td style='padding:0 12px;'><div style='font-family:Arial,Helvetica,sans-serif;color:#FF6B00;font-size:12px;font-weight:700;letter-spacing:3px;white-space:nowrap;'>FOUNDING&nbsp;PARTNER&nbsp;INVITATION</div></td>
            <td width='40' style='border-top:1px solid #3a2410;font-size:0;line-height:0;'>&nbsp;</td>
          </tr>
        </table>
        <div style='font-family:Georgia,"Times New Roman",serif;color:#FFFFFF;font-size:33px;line-height:1.25;font-weight:400;padding-top:20px;'>Bring your artisans to the <span style='color:#FF6B00;'>world</span></div>
        <table role='presentation' border='0' cellpadding='0' cellspacing='0' align='center' style='margin:18px auto 0;'><tr><td width='64' height='2' bgcolor='#FF6B00' style='background-color:#FF6B00;font-size:0;line-height:0;'>&nbsp;</td></tr></table>
        <p style='font-family:Arial,Helvetica,sans-serif;color:#CFCFCF;font-size:14.5px;line-height:1.75;margin:26px 0 0;'>Hello ${h(p.name)},</p>
        <p style='font-family:Arial,Helvetica,sans-serif;color:#B9B9B9;font-size:14.5px;line-height:1.75;margin:14px 0 0;'>${c.intro}</p>
        <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='margin:28px 0 0;border:1px solid #2A2A2A;border-radius:14px;'>
          <tr>
            ${featCell('globe', 'Reach customers around the world', '', 'border-right:1px solid #222222;')}
            ${featCell('live', 'Live selling for your makers', '', 'border-right:1px solid #222222;')}
            ${featCell('star', 'Founding places for every member', '', 'border-right:1px solid #222222;')}
            ${featCell('pro', 'Free lifetime Pro membership', 'for your member makers', '')}
          </tr>
        </table>
        <p style='font-family:Arial,Helvetica,sans-serif;color:#A9A9A9;font-size:13px;line-height:1.75;margin:24px 0 0;'>${c.b2b}</p>
        <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='margin:26px 0 0;'>
          <tr><td bgcolor='#FF6B00' align='center' style='background-color:#FF6B00;background:linear-gradient(180deg,#FF7D1A 0%,#F26200 100%);border-radius:10px;'>
            <a href='https://velorcommerce.store/apply/invited' style='display:block;font-family:Arial,Helvetica,sans-serif;color:#FFFFFF;font-size:15.5px;font-weight:800;letter-spacing:1.5px;text-decoration:none;padding:17px 20px;border-radius:10px;'>BECOME A FOUNDING PARTNER</a>
          </td></tr>
        </table>
        <div style='font-family:Arial,Helvetica,sans-serif;color:#FF9A4d;font-size:12.5px;letter-spacing:1px;padding-top:16px;'>&mdash;&nbsp; velorcommerce.store &nbsp;&mdash;</div>
        <p style='font-family:Arial,Helvetica,sans-serif;color:#8a8a8a;font-size:12px;line-height:1.6;margin:16px 0 0;'>${c.ctaNote}</p>
        ${appNote ? `<p style='font-family:Arial,Helvetica,sans-serif;color:#8a8a8a;font-size:12px;line-height:1.6;margin:8px 0 0;'>${appNote}</p>` : ''}
        <table role='presentation' border='0' cellpadding='0' cellspacing='0' align='center' style='margin:26px auto 0;'>
          <tr>
            <td width='170' style='border-top:1px solid #2A2A2A;font-size:0;line-height:0;'>&nbsp;</td>
            <td width='30' align='center' style='color:#FF6B00;font-size:10px;line-height:10px;padding:0 4px;'>&#9670;</td>
            <td width='170' style='border-top:1px solid #2A2A2A;font-size:0;line-height:0;'>&nbsp;</td>
          </tr>
        </table>
        <div style='font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:2.5px;line-height:1.8;padding-top:20px;'><span style='color:#EAEAEA;'>REAL CULTURE. REAL PEOPLE.</span> <span style='color:#FF6B00;'>GLOBAL OPPORTUNITY.</span></div>
      </div>`
  }
  if (emailType === 'followup1') {
    const step = (n: number, text: string, last = false) =>
      `<div style='${last ? '' : 'margin-bottom:10px;'}'><span style='color:#FF6B00;font-weight:800;'>${n}.</span>&nbsp; ${text}</div>`
    return `
      <div style='padding:32px;'>
        <div style='display:inline-block;background-color:#2A1A0A;background:#2A1A0A;color:#FF6B00;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:6px 14px;border-radius:100px;margin-bottom:18px;'>${c.badge}</div>
        <div style='color:#FFFFFF;font-size:24px;font-weight:800;line-height:1.2;margin-bottom:18px;'>${c.subjectFollowup1.replace(' (4 steps)', '')}</div>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.7;margin:0 0 8px;'>Hello ${h(p.name)},</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:0 0 20px;'>${c.f1Intro}</p>
        <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='margin-bottom:22px;'><tr><td bgcolor='#0D0D0D' style='background-color:#0D0D0D;background:#0D0D0D;border:1px solid #2A2A2A;border-radius:10px;padding:20px 22px;'>
          <div style='color:#EAEAEA;font-size:14px;line-height:1.8;'>
            ${step(1, c.f1s1)}
            ${step(2, c.f1s2)}
            ${step(3, c.f1s3)}
            ${step(4, c.f1s4, true)}
          </div>
        </td></tr></table>
        ${cta(c.cta)}
        <p style='color:#888888;font-size:13px;line-height:1.6;margin:18px 0 0;'>${c.ctaNote}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:22px 0 0;'>${c.signoff}</p>
      </div>`
  }
  return `
      <div style='padding:36px 32px;'>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.8;margin:0 0 16px;'>Hello ${h(p.name)},</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.8;margin:0 0 16px;'>${c.f2Line1}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.8;margin:0 0 24px;'>${c.f2Line2}</p>
        ${cta(c.cta)}
        <p style='color:#888888;font-size:13px;line-height:1.6;margin:18px 0 0;'>${c.ctaNote}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.8;margin:22px 0 0;'>${c.signoff}</p>
      </div>`
}

export function buildOutreachEmail(d: {
  prospect: OutreachProspect
  emailType: OutreachEmailType
  unsubscribeUrl?: string
  /** Explicit language override. If omitted, resolved from prospect.country. */
  lang?: OutreachLang
}): { subject: string; html: string; lang: OutreachLang } {
  const { prospect, emailType } = d
  const p = prospect
  const unsub = d.unsubscribeUrl || 'https://velorcommerce.store/unsubscribe'
  const isBrand = p.sellerType === 'brand'

  // Multiplier organizations always get the English partnership pitch (see
  // OutreachProspect.sellerType comment) -- forcing 'en' here also keeps the
  // document dir/align ltr even for e.g. a Moroccan cooperative.
  const lang: OutreachLang = p.sellerType === 'multiplier' ? 'en' : d.lang || langForCountry(p.country)
  const c = OUTREACH_COPY[lang] || OUTREACH_COPY.en
  const rtl = RTL_OUTREACH_LANGS.includes(lang)
  const dir = rtl ? 'rtl' : 'ltr'
  const align = rtl ? 'right' : 'left'

  // English keeps its brand-specific subject line; other languages use the one
  // localized subject (writing two variants per language adds risk, not value).
  const multiplierSubject =
    emailType === 'initial'
      ? MULTIPLIER_COPY.subjectInitial
      : emailType === 'followup1'
        ? MULTIPLIER_COPY.subjectFollowup1
        : MULTIPLIER_COPY.subjectFollowup2
  const makerSubject =
    emailType === 'initial'
      ? lang === 'en' && isBrand
        ? `Founding seller invitation: ${p.category} on Velor before buyers arrive 6 August`
        : lang === 'en'
          ? `${p.name}, a founding seller spot on Velor — free before buyers arrive 6 August`
          : c.subjectInitial
      : emailType === 'followup1'
        ? c.subjectFollowup1
        : c.subjectFollowup2
  const subject = p.sellerType === 'multiplier' ? multiplierSubject : makerSubject

  // Outreach recipients land on the congratulations page (/apply/invited),
  // not the general /apply form -- that page is only reachable via this
  // link, and carries the country through so /apply's country field arrives
  // pre-filled once they continue.
  const inviteUrl = p.country
    ? `https://velorcommerce.store/apply/invited?country=${encodeURIComponent(p.country)}`
    : 'https://velorcommerce.store/apply/invited'

  const cta = (label: string) => ctaButton(inviteUrl, label)

  // One true forward-looking line: the mobile app launches August 2026.
  // Deliberately text-only -- no store badges, QR codes, or download links
  // until the App Store / Play listings actually exist (William, 2026-07-15).
  const appNote = c.appNote || OUTREACH_COPY.en.appNote || ''

  // Full HTML document, not a fragment: the two meta tags below stop
  // Gmail/Apple Mail's automatic dark-mode colour inversion from fighting a
  // design that is intentionally, permanently dark rather than adapting to
  // the recipient's light/dark preference.
  const wrapOpen = `<!DOCTYPE html><html dir='${dir}' lang='${lang}'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><meta name='color-scheme' content='dark'><meta name='supported-color-schemes' content='dark'><title></title></head><body style='margin:0;padding:0;background-color:#0D0D0D;background:#0D0D0D;' bgcolor='#0D0D0D'>
<table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='background-color:#0D0D0D;background:#0D0D0D;'><tr><td bgcolor='#0D0D0D' align='center' style='background-color:#0D0D0D;background:#0D0D0D;padding:24px 0;font-family:Arial,Helvetica,sans-serif;'>
<table role='presentation' width='600' border='0' cellpadding='0' cellspacing='0' style='width:600px;max-width:600px;'><tr><td bgcolor='#141414' style='background-color:#141414;background:#141414;border:1px solid #2A2A2A;border-radius:12px;overflow:hidden;text-align:${align};' dir='${dir}'>
${OUTREACH_HEADER}`
  const wrapClose = `${outreachFooter(p.name, p.platform, unsub)}
</td></tr></table>
</td></tr></table>
</body></html>`

  let body = ''

  if (p.sellerType === 'multiplier') {
    body = buildMultiplierBody(MULTIPLIER_COPY, emailType, p, cta, appNote)
  } else if (emailType === 'initial') {
    // V2 initial email -- William's design. Everything centered; feature grid
    // is 2x2 (not 4-across like the flat mockup) so localized titles never
    // crush at 600px. The CTA pill is a DIRECT <a> link to /apply/invited.
    const v2 = OUTREACH_V2[lang] || OUTREACH_V2.en
    // 4-across icon row, per William's design (single row, vertical rules).
    const featCell = (icon: string, title: string, note: string, extra: string) =>
      `<td width='25%' align='center' valign='top' style='padding:20px 8px;${extra}'>
        <img src='${ASSETS}/icon-${icon}.png' width='44' alt='' style='display:block;margin:0 auto 10px;width:44px;height:auto;'>
        <div style='font-family:Arial,Helvetica,sans-serif;color:#EAEAEA;font-size:12px;font-weight:bold;line-height:1.5;'>${title}</div>
        ${note ? `<div style='font-family:Arial,Helvetica,sans-serif;color:#8a8a8a;font-size:10.5px;line-height:1.5;padding-top:3px;'>${note}</div>` : ''}
      </td>`
    body = `
      <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0'><tr><td bgcolor='#010101' style='background-color:#010101;padding:0;'>
        <img src='${ASSETS}/${heroForCountry(p.country)}' width='600' alt='Velor -- a global network of makers and buyers' style='display:block;width:100%;height:auto;border:0;'>
      </td></tr></table>
      <div style='padding:30px 36px 36px;text-align:center;'>
        <table role='presentation' border='0' cellpadding='0' cellspacing='0' align='center' style='margin:0 auto;'>
          <tr>
            <td width='40' style='border-top:1px solid #3a2410;font-size:0;line-height:0;'>&nbsp;</td>
            <td style='padding:0 12px;'><div style='font-family:Arial,Helvetica,sans-serif;color:#FF6B00;font-size:12px;font-weight:700;letter-spacing:3px;white-space:nowrap;'>${v2.kicker}</div></td>
            <td width='40' style='border-top:1px solid #3a2410;font-size:0;line-height:0;'>&nbsp;</td>
          </tr>
        </table>
        <div style='font-family:Georgia,"Times New Roman",serif;color:#FFFFFF;font-size:33px;line-height:1.25;font-weight:400;padding-top:20px;'>${v2.headlineA} <span style='color:#FF6B00;'>${v2.headlineB}</span></div>
        <table role='presentation' border='0' cellpadding='0' cellspacing='0' align='center' style='margin:18px auto 0;'><tr><td width='64' height='2' bgcolor='#FF6B00' style='background-color:#FF6B00;font-size:0;line-height:0;'>&nbsp;</td></tr></table>
        <p style='font-family:Arial,Helvetica,sans-serif;color:#CFCFCF;font-size:14.5px;line-height:1.75;margin:26px 0 0;'>${c.greeting(h(p.name))}</p>
        <p style='font-family:Arial,Helvetica,sans-serif;color:#B9B9B9;font-size:14.5px;line-height:1.75;margin:14px 0 0;'>${v2.p1}</p>
        <p style='font-family:Arial,Helvetica,sans-serif;color:#B9B9B9;font-size:14.5px;line-height:1.75;margin:14px 0 0;'>${v2.p2}</p>
        <p style='font-family:Arial,Helvetica,sans-serif;color:#B9B9B9;font-size:14.5px;line-height:1.75;margin:14px 0 0;'>${v2.p3}</p>
        <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='margin:28px 0 0;border:1px solid #2A2A2A;border-radius:14px;'>
          <tr>
            ${featCell('globe', v2.feat1, '', 'border-right:1px solid #222222;')}
            ${featCell('live', v2.feat2, '', 'border-right:1px solid #222222;')}
            ${featCell('star', v2.feat3, '', 'border-right:1px solid #222222;')}
            ${featCell('pro', v2.feat4, v2.feat4note, '')}
          </tr>
        </table>
        <p style='font-family:Arial,Helvetica,sans-serif;color:#A9A9A9;font-size:12.5px;line-height:1.9;margin:24px 0 0;'>${v2.cats}</p>
        <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='margin:26px 0 0;'>
          <tr><td bgcolor='#FF6B00' align='center' style='background-color:#FF6B00;background:linear-gradient(180deg,#FF7D1A 0%,#F26200 100%);border-radius:10px;'>
            <a href='${inviteUrl}' style='display:block;font-family:Arial,Helvetica,sans-serif;color:#FFFFFF;font-size:15.5px;font-weight:800;letter-spacing:1.5px;text-decoration:none;padding:17px 20px;border-radius:10px;'>${v2.ctaV2}</a>
          </td></tr>
        </table>
        <div style='font-family:Arial,Helvetica,sans-serif;color:#FF9A4d;font-size:12.5px;letter-spacing:1px;padding-top:16px;'>&mdash;&nbsp; velorcommerce.store &nbsp;&mdash;</div>
        ${appNote ? `<p style='font-family:Arial,Helvetica,sans-serif;color:#8a8a8a;font-size:12px;line-height:1.6;margin:16px 0 0;'>${appNote}</p>` : ''}
        <p style='font-family:Arial,Helvetica,sans-serif;color:#8a8a8a;font-size:12px;line-height:1.6;margin:8px 0 0;'>${c.languagePromise}</p>
        <table role='presentation' border='0' cellpadding='0' cellspacing='0' align='center' style='margin:26px auto 0;'>
          <tr>
            <td width='170' style='border-top:1px solid #2A2A2A;font-size:0;line-height:0;'>&nbsp;</td>
            <td width='30' align='center' style='color:#FF6B00;font-size:10px;line-height:10px;padding:0 4px;'>&#9670;</td>
            <td width='170' style='border-top:1px solid #2A2A2A;font-size:0;line-height:0;'>&nbsp;</td>
          </tr>
        </table>
        <div style='font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:2.5px;line-height:1.8;padding-top:20px;'><span style='color:#EAEAEA;'>${v2.tagA}</span> <span style='color:#FF6B00;'>${v2.tagB}</span></div>
      </div>`
  } else if (emailType === 'followup1') {
    const step = (n: number, text: string, last = false) =>
      `<div style='${last ? '' : 'margin-bottom:10px;'}'><span style='color:#FF6B00;font-weight:800;'>${n}.</span>&nbsp; ${text}</div>`
    body = `
      <div style='padding:32px;'>
        <div style='display:inline-block;background-color:#2A1A0A;background:#2A1A0A;color:#FF6B00;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:6px 14px;border-radius:100px;margin-bottom:18px;'>${c.badge}</div>
        <div style='color:#FFFFFF;font-size:24px;font-weight:800;line-height:1.2;margin-bottom:18px;'>${c.f1Headline}</div>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.7;margin:0 0 8px;'>${c.greeting(h(p.name))}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:0 0 20px;'>${c.f1Intro}</p>
        <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0' style='margin-bottom:22px;'><tr><td bgcolor='#0D0D0D' style='background-color:#0D0D0D;background:#0D0D0D;border:1px solid #2A2A2A;border-radius:10px;padding:20px 22px;'>
          <div style='color:#EAEAEA;font-size:14px;line-height:1.8;'>
            ${step(1, c.f1s1)}
            ${step(2, c.f1s2)}
            ${step(3, c.f1s3)}
            ${step(4, c.f1s4, true)}
          </div>
        </td></tr></table>
        ${cta(c.cta)}
        <p style='color:#888888;font-size:13px;line-height:1.6;margin:18px 0 0;'>${c.ctaNote}</p>
        ${languagePanel(c.languagePromise)}
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:22px 0 0;'>${c.signoff}</p>
      </div>`
  } else {
    const closing = isBrand ? c.f2LineBrand : c.f2LineMaker
    body = `
      <div style='padding:36px 32px;'>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.8;margin:0 0 16px;'>${c.greeting(h(p.name))}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.8;margin:0 0 16px;'>${c.f2Line1}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.8;margin:0 0 24px;'>${closing}</p>
        ${cta(c.cta)}
        <p style='color:#888888;font-size:13px;line-height:1.6;margin:18px 0 0;'>${c.ctaNote}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.8;margin:22px 0 0;'>${c.signoff}</p>
      </div>`
  }

  return { subject, html: `${wrapOpen}${body}${wrapClose}`, lang }
}
