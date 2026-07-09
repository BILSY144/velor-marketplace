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

const OUTREACH_HEADER = `<div style='background:#0D0D0D;padding:18px 32px;border-bottom:1px solid #2A2A2A;'>
  <span style='color:#FF6B00;font-size:22px;font-weight:800;letter-spacing:-0.5px;'>VELOR</span>
  <span style='color:#777777;font-size:11px;font-weight:700;letter-spacing:2px;margin-left:10px;'>SHOPPING CHANNEL</span>
</div>`

// The footer stays in English on purpose: it is the compliance/identification
// block, and "Unsubscribe" is the string recipients and mail clients expect.
function outreachFooter(name: string, platform: string, unsubUrl: string) {
  return `<div style='background:#0D0D0D;padding:20px 32px;border-top:1px solid #2A2A2A;' dir='ltr'>
    <p style='color:#666666;font-size:12px;line-height:1.6;margin:0 0 8px;'>Velor Commerce Ltd &middot; a global online marketplace &middot; velorcommerce.store</p>
    <p style='color:#666666;font-size:12px;line-height:1.6;margin:0;'>You received this because ${h(name)} appeared on a public ${h(platform)} listing. Not interested? <a href='${unsubUrl}' style='color:#FF6B00;text-decoration:underline;'>Unsubscribe</a> &mdash; one click and we will not contact you again.</p>
  </div>`
}

function benefitRow(title: string, body: string) {
  return `<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:14px;'><tr>
    <td width='36' valign='top' style='padding-top:2px;'><div style='width:26px;height:26px;border-radius:6px;background:#2A1A0A;color:#FF6B00;font-weight:800;font-size:14px;text-align:center;line-height:26px;'>&#10003;</div></td>
    <td valign='top'><div style='color:#FFFFFF;font-size:14px;font-weight:700;margin-bottom:2px;'>${title}</div><div style='color:#A9A9A9;font-size:13px;line-height:1.6;'>${body}</div></td>
  </tr></table>`
}

// The language promise -- rendered as a distinct panel so it reads as a
// commitment rather than a footnote. This is the selling point.
function languagePanel(text: string) {
  return `<div style='background:#0D0D0D;border:1px solid #2A2A2A;border-left:3px solid #FF6B00;border-radius:0 8px 8px 0;padding:14px 16px;margin:22px 0 0;'>
    <div style='color:#EAEAEA;font-size:13px;line-height:1.6;'>${text}</div>
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
          ? `${p.name}, a founding seller spot on Velor — free before buyers arrive 6 August`
          : c.subjectInitial
      : emailType === 'followup1'
        ? c.subjectFollowup1
        : c.subjectFollowup2

  const cta = (label: string) =>
    `<a href='https://velorcommerce.store/apply' style='display:inline-block;background:#FF6B00;color:#0D0D0D;font-size:15px;font-weight:800;text-decoration:none;padding:14px 34px;border-radius:8px;'>${label}</a>`

  const wrapOpen = `<div style='background:#0D0D0D;padding:24px 0;font-family:Arial,Helvetica,sans-serif;'><div dir='${dir}' style='max-width:600px;margin:0 auto;background:#141414;border:1px solid #2A2A2A;border-radius:12px;overflow:hidden;text-align:${align};'>${OUTREACH_HEADER}`
  const wrapClose = `${outreachFooter(p.name, p.platform, unsub)}</div></div>`

  let body = ''

  if (emailType === 'initial') {
    const intro = isBrand ? c.introBrand : c.introMaker
    body = `
      <img src='https://images.pexels.com/photos/35509025/pexels-photo-35509025.jpeg?auto=compress&cs=tinysrgb&w=1200' width='600' alt='A market of real makers, the kind of place Velor sellers come from' style='display:block;width:100%;max-width:600px;height:auto;border:0;' />
      <div style='padding:32px;'>
        <div style='display:inline-block;background:#2A1A0A;color:#FF6B00;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:6px 14px;border-radius:100px;margin-bottom:18px;'>${c.badge}</div>
        <div style='color:#FFFFFF;font-size:28px;font-weight:800;line-height:1.15;margin-bottom:18px;'>${c.headline}</div>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.7;margin:0 0 8px;'>${c.greeting(h(p.name))}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:0 0 24px;'>${intro}</p>
        <div style='border-top:1px solid #2A2A2A;padding-top:20px;margin-bottom:8px;'>
          ${benefitRow(c.b1t, c.b1b)}
          ${benefitRow(c.b2t, c.b2b)}
          ${benefitRow(c.b3t, c.b3b)}
          ${benefitRow(c.b4t, c.b4b)}
        </div>
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
        <div style='display:inline-block;background:#2A1A0A;color:#FF6B00;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:6px 14px;border-radius:100px;margin-bottom:18px;'>${c.badge}</div>
        <div style='color:#FFFFFF;font-size:24px;font-weight:800;line-height:1.2;margin-bottom:18px;'>${c.f1Headline}</div>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.7;margin:0 0 8px;'>${c.greeting(h(p.name))}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:0 0 20px;'>${c.f1Intro}</p>
        <div style='background:#0D0D0D;border:1px solid #2A2A2A;border-radius:10px;padding:20px 22px;margin-bottom:22px;'>
          <div style='color:#EAEAEA;font-size:14px;line-height:1.8;'>
            ${step(1, c.f1s1)}
            ${step(2, c.f1s2)}
            ${step(3, c.f1s3)}
            ${step(4, c.f1s4, true)}
          </div>
        </div>
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
        <p style='color:#888888;font-size:13px;line-height:1.6;margin:18px 0 0;'>${c.f2Note}</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.8;margin:22px 0 0;'>${c.signoff}</p>
      </div>`
  }

  return { subject, html: `${wrapOpen}${body}${wrapClose}`, lang }
}
