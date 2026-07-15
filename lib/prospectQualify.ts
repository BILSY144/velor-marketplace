// AI qualification gate for scouted seller prospects.
//
// app/api/cron/scout-sellers finds candidates by search query and domain
// blocklist alone -- that is a guess, not a verified match. A query built
// around "moroccan ceramic tagine artisan store" can still surface a hotel
// blog post, a factory wholesaler the blocklist missed, or an unrelated
// business that happens to use the right words. William's standing rule
// (this session, 2026-07-09): outreach must never go to factory/wholesale
// or service businesses -- only real, small, independent makers of
// authentic cultural goods. This module is the enforcement point: every
// prospect is judged here before it becomes eligible for the first
// outreach email (see qualified gate on Stage 1 of
// app/api/cron/outreach-auto).
//
// LAW #1 (borrowed from lib/sellerApplicationReview.ts): never guess. An
// ambiguous prospect is rejected from auto-outreach, not approved to hit a
// send-volume target.

export type ProspectVerdict = 'qualify' | 'reject'

export interface QualifyResult {
  verdict: ProspectVerdict
  reason: string
}

export interface QualifiableProspect {
  name: string
  platform: string
  storeUrl: string
  category: string
  sellerType: string
  country: string | null
  notes: string | null
}

const SYSTEM_PROMPT = `You screen prospective sellers for Velor, a marketplace and shopping channel for authentic cultural goods from independent makers around the world.

Velor wants ONLY: small or independent businesses/makers selling handmade, artisan, or culturally-specific goods (ceramics, textiles, jewellery, food/tea/coffee, personal care items rooted in a craft tradition, etc.), tied to a real country of origin.

Velor does NOT want:
- Factories, wholesalers, dropshippers, B2B/trade suppliers, or anyone selling in bulk to other businesses rather than to end customers
- Hospitality or service businesses (hotels, restaurants, tour operators, travel agencies, salons, clinics, consultancies) even if their name or page mentions a craft or cultural product in passing
- Generic mass-market retailers with no genuine connection to the craft or country claimed
- Anything that is not clearly a seller of physical goods a buyer could purchase and receive

You will be given a scouted prospect's name, platform, store URL, category, seller type, country, and any notes from the search result that found it. Decide "qualify" only if it is clearly, plausibly a genuine independent maker/seller of authentic cultural goods matching Velor's criteria. If there is real doubt, or the evidence suggests factory/wholesale/service/unrelated, decide "reject" -- do not guess in favour of qualifying just because the query matched.

Respond with ONLY a JSON object, no other text: {"verdict": "qualify" | "reject", "reason": "one short sentence"}`

// Separate criteria for 'multiplier' prospects (2026-07-15, William's
// global-reach directive): organizations that represent MANY makers. The
// maker prompt above would wrongly reject a cooperative as "not an
// independent maker" -- but a genuine artisan cooperative is exactly the
// kind of partner that can bring hundreds of real makers to Velor at once.
const MULTIPLIER_SYSTEM_PROMPT = `You screen prospective PARTNER ORGANIZATIONS for Velor, a marketplace for authentic cultural goods from independent makers around the world.

Velor wants organizations that genuinely REPRESENT or are OWNED BY groups of independent artisans: artisan cooperatives, weaver/potter/maker collectives, fair-trade organizations and federations, craft associations, and community craft enterprises -- tied to a real craft tradition and country of origin. These partners can bring their member makers to sell on Velor.

Velor does NOT want:
- Factories or manufacturers presenting themselves as "cooperatives" while mass-producing
- Pure B2B wholesalers or trading companies with no artisan ownership or mission
- Hospitality, tourism, or service businesses (hotels, tour operators, travel agencies, craft-workshop tourism experiences)
- Government tourism boards, museums, galleries, blogs, or news/directory sites
- NGOs or charities with no connection to artisans who sell physical goods

You will be given a scouted organization's name, platform, URL, category, seller type, country, and notes from the search result that found it. Decide "qualify" only if it is clearly, plausibly a genuine organization of or for independent artisans making authentic cultural goods. If there is real doubt, or the evidence suggests factory/pure-wholesale/service/unrelated, decide "reject".

Respond with ONLY a JSON object, no other text: {"verdict": "qualify" | "reject", "reason": "one short sentence"}`

function buildUserMessage(p: QualifiableProspect): string {
  return [
    `Name: ${p.name}`,
    `Platform: ${p.platform}`,
    `Store URL: ${p.storeUrl}`,
    `Category: ${p.category}`,
    `Seller type: ${p.sellerType}`,
    `Country: ${p.country ?? 'unknown'}`,
    `Search notes: ${p.notes ?? 'none'}`,
  ].join('\n')
}

/**
 * Judge a single scouted prospect. Throws on API/config failure so the
 * caller can decide how to handle it (the cron treats a failure as "leave
 * unqualified, try again next run" -- it never defaults to qualify on error).
 */
export async function qualifyProspect(p: QualifiableProspect): Promise<QualifyResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 200,
      system: p.sellerType === 'multiplier' ? MULTIPLIER_SYSTEM_PROMPT : SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(p) }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  const text: string = data?.content?.[0]?.text ?? ''

  let parsed: { verdict?: string; reason?: string }
  try {
    // Model is instructed to return only JSON, but strip any stray
    // fencing/whitespace defensively before parsing.
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text)
  } catch {
    throw new Error(`Could not parse qualifier response: ${text.slice(0, 200)}`)
  }

  const verdict: ProspectVerdict = parsed.verdict === 'qualify' ? 'qualify' : 'reject'
  const reason = String(parsed.reason ?? '').slice(0, 500) || 'No reason given'
  return { verdict, reason }
}
