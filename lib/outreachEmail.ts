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
// Starter plan, 12% commission only on completed sales, 190+ shipping
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
  RTL_OUTREACH_LANGS,
  langForCountry,
  type OutreachLang,
} from './outreachI18n'

export type OutreachEmailType = 'initial' | 'followup1' | 'followup2'

export interface OutreachProspect {
  name: string
  platform: string
  storeUrl: string
  category: string
  sellerType: 'individual' | 'small_business' | 'brand'
  country?: string | null
}

function h(text: string) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

const OUTREACH_HEADER = `<table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0'>
  <tr><td bgcolor='#141414' align='right' style='background-color:#141414;background:#141414;padding:14px 14px 0;text-align:right;'>
    ${GLOBAL_MARKET_BADGE}
  </td></tr>
  <tr><td bgcolor='#141414' style='background-color:#141414;background:#141414;height:10px;line-height:10px;font-size:0;'>&nbsp;</td></tr>
  <tr><td bgcolor='#0D0D0D' style='background-color:#0D0D0D;background:#0D0D0D;padding:18px 32px;border-bottom:1px solid #2A2A2A;'>
    <span style='color:#FF6B00;font-size:22px;font-weight:800;letter-spacing:-0.5px;'>VELOR</span>
    <span style='color:#777777;font-size:11px;font-weight:700;letter-spacing:2px;margin-left:10px;'>SHOPPING CHANNEL</span>
  </td></tr>
</table>`

// The footer stays in English on purpose: it is the compliance/identification
// block, and "Unsubscribe" is the string recipients and mail clients expect.
function outreachFooter(name: string, platform: string, unsubUrl: string) {
  const inner = `<p style='color:#666666;font-size:12px;line-height:1.6;margin:0 0 8px;'>Velor Commerce Ltd &middot; a global online marketplace &middot; velorcommerce.store</p>
    <p style='color:#666666;font-size:12px;line-height:1.6;margin:0;'>You received this because ${h(name)} appeared on a public ${h(platform)} listing. Not interested? <a href='${unsubUrl}' style='color:#FF6B00;text-decoration:underline;'>Unsubscribe</a> &mdash; one click and we will not contact you again.</p>`
  return `<table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0'><tr><td bgcolor='#0D0D0D' style='background-color:#0D0D0D;background:#0D0D0D;padding:20px 32px;border-top:1px solid #2A2A2A;' dir='ltr'>${inner}</td></tr></table>`
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

  const lang: OutreachLang = d.lang || langForCountry(p.country)
  const c = OUTREACH_COPY[lang] || OUTREACH_COPY.en
  const rtl = RTL_OUTREACH_LANGS.includes(lang)
  const dir = rtl ? 'rtl' : 'ltr'
  const align = rtl ? 'right' : 'left'

  // English keeps its brand-specific subject line; other languages use the one
  // localized subject (writing two variants per language adds risk, not value).
  const subject =
    emailType === 'initial'
      ? lang === 'en' && isBrand
        ? `Founding seller invitation: ${p.category} on Velor before buyers arrive 6 August`
        : lang === 'en'
          ? `${p.name}, a founding seller spot on Velor Ã¢ÂÂ free before buyers arrive 6 August`
          : c.subjectInitial
      : emailType === 'followup1'
        ? c.subjectFollowup1
        : c.subjectFollowup2

  // Outreach recipients land on the congratulations page (/apply/invited),
  // not the general /apply form -- that page is only reachable via this
  // link, and carries the country through so /apply's country field arrives
  // pre-filled once they continue.
  const inviteUrl = p.country
    ? `https://velorcommerce.store/apply/invited?country=${encodeURIComponent(p.country)}`
    : 'https://velorcommerce.store/apply/invited'

  const cta = (label: string) => ctaButton(inviteUrl, label)

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

  if (emailType === 'initial') {
    const intro = isBrand ? c.introBrand : c.introMaker
    // No hotlinked stock photo -- a plain gradient strip instead. A hotlinked
    // image can render as a broken-image icon in some viewers/clients, which
    // is confusing next to the logo; a CSS gradient always renders. Solid
    // #0D0D0D bgcolor fallback for clients (Outlook) that drop the gradient.
    body = `
      <table role='presentation' width='100%' border='0' cellpadding='0' cellspacing='0'><tr><td bgcolor='#0D0D0D' height='64' style='background-color:#0D0D0D;background:linear-gradient(100deg,#2A1505 0%,#0D0D0D 70%);line-height:64px;font-size:0;'>&nbsp;</td></tr></table>
      <div style='padding:32px;'>
        <div style='display:inline-block;background-color:#2A1A0A;background:#2A1A0A;color:#FF6B00;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:6px 14px;border-radius:100px;margin-bottom:18px;'>${c.badge}</div>
        <div style='color:#FFFFFF;font-size:28px;font-weight:800;line-height:1.15;margin-bottom:18px;'>${c.headline}</div>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.7;margin:0 0 8px;'>${c.greeting(h(p.name))}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:0 0 24px;'>${intro}</p>
        <div style='margin-bottom:8px;'>
          ${benefitRow(c.b1t, c.b1b)}
          ${benefitRow(c.b4t, c.b4b)}
        </div>
        <!-- b2 (commission/free plan) and b3 (escrow payout) are deliberately
             not shown here: William flagged them as wrong or irrelevant for a
             founding-tier invitation -- b2's 12% is the Starter rate, not the
             founding Pro rate, and b3 describes live payout mechanics that
             don't apply before launch. Fields stay in outreachI18n.ts for any
             non-founding context that may use them later. -->
        ${proPlanCard(c)}
        ${cta(c.cta)}
        <p style='color:#888888;font-size:13px;line-height:1.6;margin:18px 0 0;'>${c.ctaNote}</p>
        ${languagePanel(c.languagePromise)}
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:22px 0 0;'>${c.signoff}</p>
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
