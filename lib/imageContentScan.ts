// Automated scanning of buyer-uploaded photos (customisation-request
// images etc.) for contact info -- OCRs each image and runs the extracted
// text through the exact same filter already trusted for message text (see
// lib/messageFilter.ts), so a phone number or social handle typed INTO a
// photo is caught the same way as one typed into the message box.
//
// WHY THIS EXISTS (William, 2026-08-01): buyers had no way to send a
// seller a reference photo (e.g. a pet photo for a custom portrait)
// without reopening the exact hole lib/messageFilter.ts was built to
// close -- an image can't be regex-matched for an email/phone/handle the
// way plain text can. This module closes that gap with OCR instead of
// leaving photos completely unscanned.
//
// DORMANT UNTIL CONFIGURED -- same pattern as lib/r2.ts / lib/easyship.ts.
// Callers MUST fail CLOSED (reject the upload) when isImageScanConfigured()
// is false, or when a scan attempt errors -- never silently let an
// unscanned photo through just because Vision is unreachable or unset.
// See app/api/messages/route.ts for the fail-closed caller.
//
// Env var (William adds to Vercel, Production + Preview, Sensitive):
//   GOOGLE_VISION_API_KEY -- an API key with the Cloud Vision API enabled
//   on a Google Cloud project (console.cloud.google.com -> APIs & Services
//   -> Credentials -> Create API key, then enable "Cloud Vision API" for
//   that project). Free tier covers the first 1,000 text-detection units
//   per month -- comfortably enough for this feature's expected volume.
//
// Zero new npm dependencies: this is one REST call via fetch(), the same
// "no heavy SDK for one endpoint" judgement as lib/r2.ts / lib/shippo.ts.

import { checkMessageContent, type MessageCheckResult } from './messageFilter'

const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate'

export function isImageScanConfigured(): boolean {
  return !!process.env.GOOGLE_VISION_API_KEY
}

function stripDataUrlPrefix(dataUrl: string): string | null {
  const m = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(dataUrl)
  return m ? m[1] : null
}

// OCRs a single image. ok:false means Vision itself could not be reached or
// errored -- the CALLER must treat that as a failed scan (fail closed), not
// as "no text found in this image".
async function ocrImage(base64: string, apiKey: string): Promise<{ text: string; ok: boolean }> {
  try {
    const res = await fetch(`${VISION_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    })
    if (!res.ok) return { text: '', ok: false }
    const data = await res.json()
    const text: string = data?.responses?.[0]?.fullTextAnnotation?.text ?? ''
    return { text, ok: true }
  } catch {
    return { text: '', ok: false }
  }
}

export interface ImageScanResult extends MessageCheckResult {
  // true if the scan itself could not be completed (not configured, Vision
  // errored/unreachable) -- distinct from `blocked`, which means the scan
  // ran fine and found a violation. Callers must fail closed on either.
  scanFailed: boolean
}

// Scans every data-URL image in `images` for embedded contact info. Images
// that are not data URLs (e.g. already-hosted https URLs) are skipped --
// nothing new to scan, since they didn't just arrive from this upload.
export async function scanImagesForContactInfo(images: string[]): Promise<ImageScanResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) {
    return { blocked: true, violations: [], reason: 'Image scanning is not configured.', scanFailed: true }
  }

  let combinedText = ''
  for (const img of images) {
    const b64 = stripDataUrlPrefix(img)
    if (!b64) continue
    const { text, ok } = await ocrImage(b64, apiKey)
    if (!ok) {
      return {
        blocked: true,
        violations: [],
        reason: 'Could not verify this image right now -- please try again.',
        scanFailed: true,
      }
    }
    combinedText += '\n' + text
  }

  const check = checkMessageContent(combinedText)
  return { ...check, scanFailed: false }
}
