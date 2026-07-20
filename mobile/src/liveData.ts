// Shared data-channel message shape for Live Shopping (2026-07-20).
// Mirrors the JSON messages the web app publishes/consumes over LiveKit's
// data channel in app/live/[room]/page.tsx and app/dashboard/live/page.tsx
// -- broadcaster and viewer, web and mobile, all speak this same wire
// format so a web seller's chat/pin works with an app viewer and vice versa.

export type LiveDataMsg =
  | { t: 'chat'; name: string; text: string }
  | { t: 'pin'; productId: string | null }
  | { t: 'state'; productId: string | null }

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function encodeLiveData(msg: LiveDataMsg): Uint8Array {
  return encoder.encode(JSON.stringify(msg))
}

export function decodeLiveData(payload: Uint8Array): LiveDataMsg | null {
  try {
    const parsed = JSON.parse(decoder.decode(payload))
    if (parsed && typeof parsed === 'object' && typeof parsed.t === 'string') {
      return parsed as LiveDataMsg
    }
    return null
  } catch {
    return null
  }
}
