import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

const apiKey = process.env.LIVEKIT_API_KEY
const apiSecret = process.env.LIVEKIT_API_SECRET
const wsUrl = process.env.LIVEKIT_URL

export function liveKitConfigured() {
  return Boolean(apiKey && apiSecret && wsUrl)
}

function httpUrlFromWs(url: string) {
  return url.replace('wss://', 'https://').replace('ws://', 'http://')
}

export function getRoomServiceClient() {
  if (!apiKey || !apiSecret || !wsUrl) throw new Error('LiveKit is not configured (missing LIVEKIT_API_KEY / LIVEKIT_API_SECRET / LIVEKIT_URL)')
  return new RoomServiceClient(httpUrlFromWs(wsUrl), apiKey, apiSecret)
}

export async function createBroadcasterToken(roomName: string, identity: string, name: string) {
  if (!apiKey || !apiSecret) throw new Error('LiveKit is not configured')
  const at = new AccessToken(apiKey, apiSecret, { identity, name, ttl: '4h' })
  at.addGrant({ room: roomName, roomJoin: true, roomCreate: true, canPublish: true, canSubscribe: true, canPublishData: true })
  return await at.toJwt()
}

export async function createViewerToken(roomName: string, identity: string, name: string) {
  if (!apiKey || !apiSecret) throw new Error('LiveKit is not configured')
  const at = new AccessToken(apiKey, apiSecret, { identity, name, ttl: '4h' })
  at.addGrant({ room: roomName, roomJoin: true, canPublish: false, canSubscribe: true, canPublishData: true })
  return await at.toJwt()
}

export async function endLiveKitRoom(roomName: string) {
  try {
    const svc = getRoomServiceClient()
    await svc.deleteRoom(roomName)
  } catch (err) {
    // Room may already be gone or LiveKit may not be configured yet - non-fatal, DB state is the source of truth
    console.error('endLiveKitRoom error', err)
  }
}

export function getWsUrl() {
  return wsUrl ?? ''
}

export function makeRoomName(sellerId: string) {
  return `velor-${sellerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
