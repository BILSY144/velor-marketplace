// Client-side mirror of the web app's lib/messageFilter.ts (2026-07-20).
//
// Live chat over LiveKit's data channel is peer-to-peer between clients --
// it never passes through our Next.js server, so the server-side filter
// used for buyer/seller messaging cannot see or block it. Every client that
// can publish or receive live chat (this app, the seller dashboard, the
// public viewer page) must run the same check locally: once before sending,
// and again on receipt, since a modified client could otherwise broadcast
// contact info straight past a UI-only guard.
//
// IMPORTANT: keep this logic identical to lib/messageFilter.ts on the web
// app. If one changes, change the other.

export type MessageViolation = 'email' | 'phone' | 'social' | 'link'

export interface MessageCheckResult {
  blocked: boolean
  violations: MessageViolation[]
  reason: string | null
}

const EMAIL_RE = /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\bat\b)\s*[a-z0-9.-]+\s*(?:\.|\(dot\)|\[dot\]|\bdot\b)\s*[a-z]{2,}/i

const SOCIAL_RE = /\b(whatsapp|whats app|telegram|wechat|we chat|snapchat|snap chat|instagram|insta\s*:|facebook|fb\s*:|skype|kik|line\s*id|wa\.me|t\.me)\b/i

const URL_RE = /\b(?:https?:\/\/|www\.)\S+/i
const DOMAIN_RE = /\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*(?:\.|\s*(?:\(dot\)|\[dot\]|\bdot\b)\s*)(?:com|net|org|io|shop|store|site|online|app|info|biz|xyz|co\.uk|uk)\b/i

const DIGIT_RUN_RE = /(\+?\d[\d .\-()]{5,}\d)/g

function hasLongDigitRun(s: string): boolean {
  const matches = s.match(DIGIT_RUN_RE) || []
  for (const m of matches) {
    if (m.replace(/\D/g, '').length >= 7) return true
  }
  return false
}

const REASON =
  "Messages can't include email addresses, phone numbers, website links, or social/messaging handles " +
  '-- keep the conversation on Velor so orders stay covered by buyer and seller protection.'

export function checkMessageContent(raw: string): MessageCheckResult {
  const violations: MessageViolation[] = []
  const text = String(raw || '')
  const compact = text.replace(/\s+/g, '')

  if (EMAIL_RE.test(text) || EMAIL_RE.test(compact)) violations.push('email')
  if (hasLongDigitRun(text) || /\d{7,}/.test(compact)) violations.push('phone')
  if (SOCIAL_RE.test(text)) violations.push('social')
  if (URL_RE.test(text) || DOMAIN_RE.test(text) || DOMAIN_RE.test(compact)) violations.push('link')

  const blocked = violations.length > 0
  return {
    blocked,
    violations: Array.from(new Set(violations)),
    reason: blocked ? REASON : null,
  }
}
