// Server-side Expo push sender (2026-07-20) — used to tell people who
// tapped "Notify me" that a scheduled live stream has started. Plain fetch
// to Expo's push API, batched at 100 messages per request (Expo's limit),
// best-effort: a failed batch is logged and skipped, never thrown, because
// notifying is a side-effect of going live and must not block the seller.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, string>
}

export function isExpoPushToken(token: string): boolean {
  return /^ExponentPushToken\[[A-Za-z0-9_-]+\]$/.test(token) && token.length <= 200
}

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<number> {
  const valid = messages.filter((m) => isExpoPushToken(m.to))
  let sent = 0
  for (let i = 0; i < valid.length; i += 100) {
    const batch = valid.slice(i, i + 100)
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(batch),
      })
      if (res.ok) sent += batch.length
      else console.warn('[expoPush] batch failed', res.status)
    } catch (err) {
      console.warn('[expoPush] batch error', err)
    }
  }
  return sent
}
