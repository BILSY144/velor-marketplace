// Shared contact-info filter for buyer <-> seller messages.
//
// Velor takes a commission on every sale that goes through checkout. A
// buyer and seller who swap an email, phone number, or social/messaging
// handle in the chat can arrange to transact off-platform and Velor never
// sees a penny of it -- and loses its only lever (escrow, dispute handling,
// buyer protection) over that transaction. This filter blocks a message
// before it is ever saved, rather than saving-then-redacting, so contact
// info is never even briefly visible to the other party.
//
// Deliberately blunt: false positives (a legitimate order number that
// happens to look like a phone number) are an acceptable cost against the
// alternative of contact info slipping through. Sellers can always resend
// a message with the flagged part rephrased.

export type MessageViolation = 'email' | 'phone' | 'social'

export interface MessageCheckResult {
  blocked: boolean
  violations: MessageViolation[]
  reason: string | null
}

// Matches a normal email address, plus the common ' at '/'(at)'/' dot '
// obfuscations people use to sneak an address past a naive filter.
const EMAIL_RE = /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\bat\b)\s*[a-z0-9.-]+\s*(?:\.|\(dot\)|\[dot\]|\bdot\b)\s*[a-z]{2,}/i

// Named messaging/social platforms -- the standard vector for taking a
// conversation off-platform without tripping the email or phone checks.
const SOCIAL_RE = /\b(whatsapp|whats app|telegram|wechat|we chat|snapchat|snap chat|instagram|insta\s*:|facebook|fb\s*:|skype|kik|line\s*id|wa\.me|t\.me)\b/i

// A run of digits, allowing the usual phone punctuation between them.
const DIGIT_RUN_RE = /(\+?\d[\d .\-()]{5,}\d)/g

function hasLongDigitRun(s: string): boolean {
  const matches = s.match(DIGIT_RUN_RE) || []
  for (const m of matches) {
    if (m.replace(/\D/g, '').length >= 7) return true
  }
  return false
}

const REASON =
  "Messages can't include email addresses, phone numbers, or social/messaging handles " +
  "-- keep the conversation on Velor so orders stay covered by buyer and seller protection."

export function checkMessageContent(raw: string): MessageCheckResult {
  const violations: MessageViolation[] = []
  const text = String(raw || '')
  // Also check with whitespace stripped out, to catch spaced-out evasion
  // like "e m a i l @ g m a i l . c o m" or "0 7 9 1 2 3 4 5 6 7 8".
  const compact = text.replace(/\s+/g, '')

  if (EMAIL_RE.test(text) || EMAIL_RE.test(compact)) violations.push('email')
  if (hasLongDigitRun(text) || /\d{7,}/.test(compact)) violations.push('phone')
  if (SOCIAL_RE.test(text)) violations.push('social')

  const blocked = violations.length > 0
  return {
    blocked,
    violations: Array.from(new Set(violations)),
    reason: blocked ? REASON : null,
  }
}
