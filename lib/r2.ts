// Cloudflare R2 (S3-compatible) image storage.
//
// WHY THIS EXISTS (2026-07-29): listing/variant/logo images have always been
// stored as base64 data URLs directly in Postgres. That works at a tiny
// catalogue size but makes every DB row huge, slows every product query, and
// is the #1 technical prerequisite blocking the Velor Social feed (see
// velor-social-5-year-plan.md). This module moves image BYTES to R2 and
// leaves only a small https URL in the database.
//
// DORMANT UNTIL CONFIGURED -- same pattern as lib/easyship.ts. Until all
// env vars below exist in Vercel, isR2Configured() is false and every write
// path falls back to storing the data URL exactly as before. Nothing breaks
// on deploy; the switch flips when William adds the vars.
//
// Env vars (William adds to Vercel, Production + Preview, Sensitive):
//   R2_ACCOUNT_ID        -- Cloudflare account id (dash.cloudflare.com URL / R2 API page)
//   R2_ACCESS_KEY_ID     -- from an R2 API token (Object Read & Write)
//   R2_SECRET_ACCESS_KEY -- from the same R2 API token
//   R2_BUCKET            -- bucket name (velor-images)
//   R2_PUBLIC_BASE       -- public base URL serving the bucket, no trailing
//                           slash (the bucket's r2.dev public URL for now,
//                           e.g. https://pub-xxxx.r2.dev; later a custom
//                           domain like https://img.velorcommerce.store)
//
// Zero new npm dependencies: AWS Signature V4 is implemented directly with
// node:crypto (same "no heavy SDK for one endpoint" judgement as
// lib/easyship.ts / lib/shippo.ts).

import { createHash, createHmac, randomUUID } from 'crypto'

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBase: string
}

function getConfig(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const publicBase = process.env.R2_PUBLIC_BASE
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) return null
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBase: publicBase.replace(/\/+$/, '') }
}

export function isR2Configured(): boolean {
  return getConfig() !== null
}

// ---------------------------------------------------------------------------
// AWS SigV4 (region "auto", service "s3") -- the exact scheme R2's S3 API
// expects. Reference: Cloudflare R2 S3-compat docs + AWS SigV4 spec.
// ---------------------------------------------------------------------------

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest()
}

function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

async function r2Request(
  method: 'PUT' | 'DELETE',
  key: string,
  body: Buffer | null,
  contentType?: string,
): Promise<{ ok: boolean; status: number; text: string }> {
  const cfg = getConfig()
  if (!cfg) return { ok: false, status: 0, text: 'R2 not configured' }

  const host = `${cfg.accountId}.r2.cloudflarestorage.com`
  // Every segment of the key is URI-encoded per SigV4's canonical-URI rules;
  // keys we generate are [a-z0-9/-.] only, so this is belt-and-braces.
  const canonicalUri = `/${cfg.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`
  const url = `https://${host}${canonicalUri}`

  const now = new Date()
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8)
  const payloadHash = sha256Hex(body ?? Buffer.alloc(0))

  const headers: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  }
  if (contentType) headers['content-type'] = contentType
  if (method === 'PUT') headers['cache-control'] = 'public, max-age=31536000, immutable'

  const signedHeaderNames = Object.keys(headers).sort()
  const canonicalHeaders = signedHeaderNames.map((h) => `${h}:${headers[h].trim()}\n`).join('')
  const signedHeaders = signedHeaderNames.join(';')

  const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')
  const scope = `${dateStamp}/auto/s3/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n')

  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp)
  const kRegion = hmac(kDate, 'auto')
  const kService = hmac(kRegion, 's3')
  const kSigning = hmac(kService, 'aws4_request')
  const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex')

  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const fetchHeaders: Record<string, string> = { ...headers, authorization }
  delete fetchHeaders.host // fetch sets Host itself; it must still be SIGNED above

  const res = await fetch(url, {
    method,
    headers: fetchHeaders,
    // Buffer isn't in TS's BodyInit union under this tsconfig -- hand fetch
    // a plain Uint8Array view over the same bytes instead.
    body: body ? new Uint8Array(body) : undefined,
  })
  const text = res.ok ? '' : await res.text().catch(() => '')
  return { ok: res.ok, status: res.status, text }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,([A-Za-z0-9+/=]+)$/
const EXT_BY_TYPE: Record<string, string> = {
  png: 'png',
  jpeg: 'jpg',
  jpg: 'jpg',
  webp: 'webp',
  gif: 'gif',
  avif: 'avif',
}
// Safety cap: nothing legitimate in the current pipeline exceeds this (the
// forms client-compress before upload; the logo route caps at 200KB).
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export function isDataUrlImage(u: unknown): u is string {
  return typeof u === 'string' && u.startsWith('data:image/')
}

/**
 * Upload one base64 data-URL image to R2. Returns the public https URL on
 * success, or null on ANY failure (bad input, R2 unconfigured, network/API
 * error) -- callers keep the original data URL when this returns null, so a
 * storage hiccup can never lose a seller's image or block a listing.
 */
export async function uploadDataUrlToR2(dataUrl: string, keyPrefix: string): Promise<string | null> {
  const cfg = getConfig()
  if (!cfg) return null
  const m = DATA_URL_RE.exec(dataUrl)
  if (!m) return null
  const [, type, b64] = m
  let bytes: Buffer
  try {
    bytes = Buffer.from(b64, 'base64')
  } catch {
    return null
  }
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null

  const ext = EXT_BY_TYPE[type] ?? 'bin'
  const cleanPrefix = keyPrefix.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '')
  const key = `${cleanPrefix}/${randomUUID()}.${ext}`
  const contentType = `image/${type === 'jpg' ? 'jpeg' : type}`

  try {
    const res = await r2Request('PUT', key, bytes, contentType)
    if (!res.ok) {
      console.error(`[r2] PUT ${key} failed: ${res.status} ${res.text.slice(0, 300)}`)
      return null
    }
    return `${cfg.publicBase}/${key}`
  } catch (e) {
    console.error('[r2] upload error', e)
    return null
  }
}

/**
 * Map an image list through R2: data URLs are uploaded and replaced with
 * public URLs; existing http(s) URLs pass through untouched; any upload
 * failure keeps the original value. Order preserved.
 */
export async function imagesToR2(images: string[], keyPrefix: string): Promise<string[]> {
  if (!isR2Configured()) return images
  const out: string[] = []
  for (const img of images) {
    if (isDataUrlImage(img)) {
      const uploaded = await uploadDataUrlToR2(img, keyPrefix)
      out.push(uploaded ?? img)
    } else {
      out.push(img)
    }
  }
  return out
}
