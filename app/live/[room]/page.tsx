'use client'
import { addToCart as addToSharedCart } from '@/lib/cart'
import { checkMessageContent } from '@/lib/messageFilter'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Room, RoomEvent, Track } from 'livekit-client'
import type { RemoteTrack } from 'livekit-client'

type ProductInfo = { id: string; title: string; price: number; images: string[]; stock: number }
type StreamInfo = {
  id: string
  title: string
  description: string | null
  status: string
  scheduledFor: string | null
  seller: { id: string; storeName: string; currency: string }
}
type LiveOffer = { percent: number; productIds: string[] }
type ChatMsg = { id: string; name: string; text: string }

// Live-room data messages (2026-07-20). Everything realtime that is not
// video rides LiveKit's data channel: chat from anyone, pin/state from the
// broadcaster. Chat is ephemeral by design (like the stream itself) and
// every message is checked against the same contact-info filter as buyer-
// seller messaging — on send AND on receive, so a crafted client can't show
// other viewers a phone number either.
const decoder = new TextDecoder()
const encoder = new TextEncoder()

export default function LiveViewerPage() {
  const params = useParams<{ room: string }>()
  const room = params.room as string
  const router = useRouter()
  const { data: session } = useSession()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const roomRef = useRef<Room | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const [stream, setStream] = useState<StreamInfo | null>(null)
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [liveOffer, setLiveOffer] = useState<LiveOffer | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [chatDraft, setChatDraft] = useState('')
  const [chatError, setChatError] = useState('')
  const [status, setStatus] = useState<'loading' | 'connecting' | 'connected' | 'ended' | 'scheduled' | 'notfound' | 'error'>('loading')
  const [reported, setReported] = useState(false)
  const [notifyState, setNotifyState] = useState<'idle' | 'saved' | 'signin'>('idle')
  const [addedId, setAddedId] = useState<string | null>(null)

  const handleData = useCallback((payload: Uint8Array) => {
    try {
      const msg = JSON.parse(decoder.decode(payload)) as { t?: string; name?: string; text?: string; productId?: string | null }
      if (msg.t === 'chat' && typeof msg.text === 'string' && msg.text.trim()) {
        // Receive-side filter: drop anything containing contact details even
        // if a modified client sent it past the send-side check.
        if (checkMessageContent(msg.text).blocked) return
        const name = (typeof msg.name === 'string' && msg.name.trim() ? msg.name : 'Viewer').slice(0, 40)
        const text = msg.text.slice(0, 300)
        setChat((prev) => [...prev.slice(-120), { id: Math.random().toString(36).slice(2), name, text }])
      } else if (msg.t === 'pin' || msg.t === 'state') {
        setPinnedId(typeof msg.productId === 'string' ? msg.productId : null)
      }
    } catch {
      // ignore malformed payloads
    }
  }, [])

  useEffect(() => {
    if (!room) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/live/${room}`)
        const data = await res.json()
        if (!res.ok) { if (!cancelled) setStatus('notfound'); return }
        if (cancelled) return
        setStream(data.stream)
        setProducts(data.products || [])
        setLiveOffer(data.liveOffer || null)

        if (data.stream.status === 'SCHEDULED') { setStatus('scheduled'); return }
        if (data.stream.status !== 'LIVE') { setStatus('ended'); return }

        setStatus('connecting')
        const tokenRes = await fetch(`/api/live/${room}/token`, { method: 'POST' })
        const tokenData = await tokenRes.json()
        if (!tokenRes.ok) { if (!cancelled) setStatus('error'); return }

        const r = new Room()
        r.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current)
          } else if (track.kind === Track.Kind.Audio) {
            track.attach()
          }
        })
        r.on(RoomEvent.DataReceived, (payload: Uint8Array) => handleData(payload))
        r.on(RoomEvent.Disconnected, () => { if (!cancelled) setStatus('ended') })

        await r.connect(tokenData.wsUrl, tokenData.token)
        roomRef.current = r
        if (!cancelled) setStatus('connected')
      } catch (e) {
        if (!cancelled) setStatus('error')
      }
    }

    load()
    return () => {
      cancelled = true
      roomRef.current?.disconnect()
      roomRef.current = null
    }
  }, [room, handleData])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  function buyNow(p: ProductInfo) {
    addToSharedCart({
      id: p.id,
      productId: p.id,
      name: p.title,
      price: p.price,
      quantity: 1,
      image: p.images[0] || '',
      sellerId: stream?.seller.id,
      sellerName: stream?.seller.storeName,
    })
    setAddedId(p.id)
    setTimeout(() => router.push('/checkout'), 500)
  }

  async function sendChat() {
    const text = chatDraft.trim()
    if (!text || !roomRef.current) return
    const check = checkMessageContent(text)
    if (check.blocked) {
      setChatError("Messages can't include contact details or links — keep the conversation on Velor.")
      return
    }
    setChatError('')
    const name = session?.user?.name?.split(' ')[0] || 'Viewer'
    const payload = { t: 'chat', name, text: text.slice(0, 300) }
    try {
      await roomRef.current.localParticipant.publishData(encoder.encode(JSON.stringify(payload)), { reliable: true })
      // LiveKit does not echo your own data messages back — append locally.
      setChat((prev) => [...prev.slice(-120), { id: Math.random().toString(36).slice(2), name: `${name} (you)`, text: payload.text }])
      setChatDraft('')
    } catch {
      setChatError('Could not send — check your connection.')
    }
  }

  async function notifyMe() {
    try {
      const res = await fetch(`/api/live/${room}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      if (res.ok) setNotifyState('saved')
      else if (res.status === 401) setNotifyState('signin')
    } catch {
      // leave button as-is; user can retry
    }
  }

  async function reportStream() {
    if (reported) return
    setReported(true)
    try {
      const res = await fetch(`/api/live/${room}/report`, { method: 'POST' })
      if (!res.ok) setReported(false)
    } catch {
      setReported(false)
    }
  }

  const dark = '#111111'
  const panel = '#1A1A1A'
  const border = '#2A2A2A'
  const accent = '#FF6B00'

  const offerApplies = (p: ProductInfo) =>
    !!liveOffer && (liveOffer.productIds.length === 0 || liveOffer.productIds.includes(p.id))
  const offerPrice = (p: ProductInfo) => p.price * (1 - (liveOffer?.percent ?? 0) / 100)
  const sym = stream?.seller?.currency === 'GBP' ? '£' : (stream?.seller?.currency || '') + ' '

  const pinned = pinnedId ? products.find((p) => p.id === pinnedId) ?? null : null
  const trayProducts = pinned ? products.filter((p) => p.id !== pinned.id) : products

  if (status === 'notfound') {
    return <div style={{ minHeight: '60vh', background: dark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Stream not found.</div>
  }

  if (status === 'scheduled') {
    const when = stream?.scheduledFor ? new Date(stream.scheduledFor) : null
    return (
      <div style={{ minHeight: '60vh', background: dark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 520, textAlign: 'center', background: panel, border: `1px solid ${border}`, borderRadius: 16, padding: 40 }}>
          <div style={{ fontSize: 13, letterSpacing: 1, color: accent, marginBottom: 12, textTransform: 'uppercase' }}>Upcoming live</div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>{stream?.title}</h1>
          <div style={{ color: '#aaa', marginBottom: 6 }}>{stream?.seller?.storeName}</div>
          {when && (
            <p style={{ color: '#ccc', marginBottom: 20 }}>
              Starts {when.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at {when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {notifyState === 'saved' ? (
            <div style={{ color: accent, fontWeight: 600 }}>You will be notified when this stream starts.</div>
          ) : notifyState === 'signin' ? (
            <a href={`/auth/sign-in?callbackUrl=/live/${room}`} style={{ display: 'inline-block', background: accent, color: '#111', padding: '12px 28px', borderRadius: 999, fontWeight: 600, textDecoration: 'none' }}>
              Sign in to be notified
            </a>
          ) : (
            <button onClick={notifyMe} style={{ background: accent, color: '#111', border: 'none', padding: '12px 28px', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>
              Notify me when it starts
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: dark, color: '#fff', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 24 }}>
        <div>
          <div style={{ position: 'relative', background: '#000', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9' }}>
            {status === 'connected' ? (
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                {status === 'connecting' && 'Connecting...'}
                {status === 'ended' && 'This stream has ended.'}
                {status === 'error' && 'Could not connect - try refreshing.'}
                {status === 'loading' && 'Loading...'}
              </div>
            )}
            {status === 'connected' && (
              <span style={{ position: 'absolute', top: 12, left: 12, background: accent, color: '#111', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>LIVE</span>
            )}
            {liveOffer && status === 'connected' && (
              <span style={{ position: 'absolute', top: 12, right: 12, background: '#111c', border: `1px solid ${accent}`, color: accent, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
                Live price: {liveOffer.percent}% off featured items
              </span>
            )}
          </div>

          {/* Pinned hero product — what the seller is showing right now */}
          {pinned && status === 'connected' && (
            <div style={{ marginTop: 14, background: panel, border: `1px solid ${accent}`, borderRadius: 14, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
              {pinned.images[0] && <img src={pinned.images[0]} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Now showing</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{pinned.title}</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {offerApplies(pinned) ? (
                    <>
                      <span style={{ color: accent }}>{sym}{offerPrice(pinned).toFixed(2)}</span>
                      <span style={{ color: '#777', textDecoration: 'line-through', marginLeft: 8, fontSize: 13 }}>{sym}{pinned.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span style={{ color: accent }}>{sym}{pinned.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => buyNow(pinned)}
                disabled={pinned.stock <= 0}
                style={{ background: pinned.stock <= 0 ? '#333' : accent, color: pinned.stock <= 0 ? '#888' : '#111', border: 'none', padding: '12px 24px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: pinned.stock <= 0 ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {addedId === pinned.id ? 'Added' : pinned.stock <= 0 ? 'Sold out' : 'Buy now'}
              </button>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: accent, marginBottom: 4 }}>{stream?.seller?.storeName}</div>
            <h1 style={{ fontSize: 22, marginBottom: 8 }}>{stream?.title}</h1>
            {stream?.description && <p style={{ color: '#aaa', lineHeight: 1.6 }}>{stream.description}</p>}
            <button onClick={reportStream} style={{ marginTop: 16, background: 'transparent', border: `1px solid ${border}`, color: '#888', fontSize: 12, padding: '6px 14px', borderRadius: 999, cursor: reported ? 'default' : 'pointer' }}>
              {reported ? 'Reported - thank you' : 'Report this stream'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Live chat */}
          {status === 'connected' && (
            <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', height: 340 }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${border}`, fontSize: 13, color: '#ccc', textTransform: 'uppercase', letterSpacing: 0.5 }}>Live chat</div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chat.length === 0 && <div style={{ color: '#666', fontSize: 13 }}>Say hello — ask the seller anything about what they are showing.</div>}
                {chat.map((m) => (
                  <div key={m.id} style={{ fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
                    <span style={{ color: accent, fontWeight: 600 }}>{m.name}</span>{' '}
                    <span style={{ color: '#ddd' }}>{m.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {chatError && <div style={{ padding: '6px 14px', color: '#ffb4b4', fontSize: 12 }}>{chatError}</div>}
              <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: `1px solid ${border}` }}>
                <input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
                  placeholder="Ask a question..."
                  maxLength={300}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: '#0d0d0d', color: '#fff', fontSize: 13 }}
                />
                <button onClick={sendChat} style={{ background: accent, color: '#111', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Send
                </button>
              </div>
            </div>
          )}

          <div>
            <h2 style={{ fontSize: 15, color: '#ccc', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Featured products</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {trayProducts.map((p) => (
                <div key={p.id} style={{ background: panel, border: `1px solid ${border}`, borderRadius: 12, padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                  {p.images[0] && <img src={p.images[0]} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {offerApplies(p) ? (
                        <>
                          <span style={{ color: accent }}>{sym}{offerPrice(p).toFixed(2)}</span>
                          <span style={{ color: '#777', textDecoration: 'line-through', marginLeft: 6, fontSize: 12 }}>{sym}{p.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span style={{ color: accent }}>{sym}{p.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => buyNow(p)}
                    disabled={p.stock <= 0}
                    style={{ background: p.stock <= 0 ? '#333' : accent, color: p.stock <= 0 ? '#888' : '#111', border: 'none', padding: '8px 14px', borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: p.stock <= 0 ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {addedId === p.id ? 'Added' : p.stock <= 0 ? 'Sold out' : 'Buy now'}
                  </button>
                </div>
              ))}
              {products.length === 0 && <p style={{ color: '#666', fontSize: 13 }}>No products featured yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
