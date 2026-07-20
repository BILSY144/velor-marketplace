'use client'
import { addToCart as addToSharedCart } from '@/lib/cart'
import { checkMessageContent } from '@/lib/messageFilter'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
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
  seller: { id: string; storeName: string; currency: string; storeLogo: string | null }
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
  // TikTok LIVE parity (William, 2026-07-20): a real, LiveKit-reported
  // viewer count (room.remoteParticipants -- genuine connected viewers, not
  // invented), a local tap-to-like counter with a floating heart burst like
  // TikTok's double-tap gesture, a collapsible shop rail so the video can go
  // fully edge-to-edge, and a "more" menu that tucks Report behind the same
  // overflow affordance TikTok uses instead of a permanent floating button.
  const [viewerCount, setViewerCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [hearts, setHearts] = useState<{ id: string; x: number }[]>([])
  const [shopOpen, setShopOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

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

  // Fix: RoomEvent.TrackSubscribed can fire for an already-published video
  // track before this component has re-rendered into the 'connected' state
  // (the <video> element, and therefore videoRef.current, doesn't exist yet
  // at that instant). When that race is lost the video track was silently
  // dropped forever -- audio has no such guard, which is why viewers heard
  // sound with no picture. Stash the track and attach it either immediately
  // (if the element already exists) or via the ref callback once it mounts.
  const pendingVideoTrackRef = useRef<RemoteTrack | null>(null)
  const attachVideoIfReady = useCallback(() => {
    if (pendingVideoTrackRef.current && videoRef.current) {
      pendingVideoTrackRef.current.attach(videoRef.current)
      pendingVideoTrackRef.current = null
    }
  }, [])
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    attachVideoIfReady()
  }, [attachVideoIfReady])

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
          if (track.kind === Track.Kind.Video) {
            pendingVideoTrackRef.current = track
            attachVideoIfReady()
          } else if (track.kind === Track.Kind.Audio) {
            track.attach()
          }
        })
        r.on(RoomEvent.DataReceived, (payload: Uint8Array) => handleData(payload))
        r.on(RoomEvent.Disconnected, () => { if (!cancelled) setStatus('ended') })
        // Real viewer count -- every other viewer connected to this same
        // LiveKit room is a remote participant; the broadcaster publishes
        // but is not counted as a "viewer" of themselves. Kept in sync via
        // the same connect/disconnect events LiveKit already fires, so this
        // never drifts from who is actually in the room.
        const syncViewerCount = () => { if (!cancelled) setViewerCount(r.remoteParticipants.size) }
        r.on(RoomEvent.ParticipantConnected, syncViewerCount)
        r.on(RoomEvent.ParticipantDisconnected, syncViewerCount)

        await r.connect(tokenData.wsUrl, tokenData.token)
        roomRef.current = r
        if (!cancelled) { setStatus('connected'); syncViewerCount() }
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

  // TikTok-style tap/double-tap-to-like: a floating heart drifts up and
  // fades, same gesture TikTok uses on both regular videos and LIVE. This is
  // a local engagement gesture only -- there is no like-count field on
  // LiveStream to persist it against, so it is never presented as a
  // server-tracked total, only as in-the-moment feedback for this viewer.
  function sendHeart() {
    setLikeCount((c) => c + 1)
    const id = Math.random().toString(36).slice(2)
    const x = 50 + (Math.random() * 40 - 20)
    setHearts((prev) => [...prev.slice(-14), { id, x }])
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1600)
  }

  async function shareStream() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const shareData = { title: stream?.title || 'Velor Live', text: `Watch ${stream?.seller?.storeName || 'this seller'} live on Velor`, url }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setChatError('Link copied.')
        setTimeout(() => setChatError(''), 2000)
      }
    } catch {
      // user cancelled the native share sheet -- not an error
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

  // TikTok Live model (William, 2026-07-20 -- refined same day per "make it
  // exactly like tiktoks set up all but name"): full-bleed edge-to-edge
  // video with every control laid over it exactly where TikTok LIVE puts
  // it -- avatar + name top-left, eye/viewer-count + overflow menu + close
  // top-right, a vertical action rail (like / share / shop) on the right
  // edge, and comments + composer along the bottom. Only Velor's own name,
  // products and data replace TikTok's -- the arrangement is theirs.
  const avatarNode = stream?.seller?.storeLogo ? (
    <img src={stream.seller.storeLogo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.85)' }} />
  ) : (
    <span style={{ width: 32, height: 32, borderRadius: '50%', background: accent, color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, border: '1.5px solid rgba(255,255,255,0.85)' }}>
      {(stream?.seller?.storeName || 'V').charAt(0).toUpperCase()}
    </span>
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', background: '#000', color: '#fff', overflow: 'hidden' }}>
      <style>{`
        @keyframes velorLivePulse { 0% { box-shadow: 0 0 0 0 rgba(255,107,0,0.55); } 70% { box-shadow: 0 0 0 6px rgba(255,107,0,0); } 100% { box-shadow: 0 0 0 0 rgba(255,107,0,0); } }
        .velor-live-dot { animation: velorLivePulse 1.8s ease-out infinite; }
        @keyframes velorHeartFloat {
          0% { transform: translate(0, 0) scale(0.6) rotate(0deg); opacity: 0; }
          15% { opacity: 1; transform: translate(0, -10px) scale(1) rotate(-4deg); }
          100% { transform: translate(var(--drift, 12px), -230px) scale(1.05) rotate(6deg); opacity: 0; }
        }
        .velor-heart { animation: velorHeartFloat 1.6s ease-out forwards; }
        .velor-rail-btn { background: none; border: none; color: #fff; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; }
      `}</style>

      {status === 'connected' ? (
        <video
          ref={setVideoRef}
          autoPlay
          playsInline
          onDoubleClick={sendHeart}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', textAlign: 'center', padding: 24 }}>
          {status === 'connecting' && 'Connecting...'}
          {status === 'ended' && 'This stream has ended.'}
          {status === 'error' && 'Could not connect - try refreshing.'}
          {status === 'loading' && 'Loading...'}
          {status === 'notfound' && 'Stream not found.'}
        </div>
      )}

      {/* Top scrim: avatar + name (links to storefront) left, viewer count / overflow / close right */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'max(14px, env(safe-area-inset-top)) 12px 40px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)' }}>
        <Link href={stream ? `/seller/${stream.seller.id}` : '/live'} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff', minWidth: 0 }}>
          {avatarNode}
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 14, textShadow: '0 1px 3px rgba(0,0,0,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{stream?.seller?.storeName}</span>
            {status === 'connected' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                <span className="velor-live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }} />
                Live
              </span>
            )}
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          {status === 'connected' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.45)', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 600 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
              {viewerCount}
            </span>
          )}
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="More" style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: 1, letterSpacing: 1 }}>
            &#8226;&#8226;&#8226;
          </button>
          <button onClick={() => router.push('/live')} aria-label="Close" style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>
            &times;
          </button>

          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 3 }} />
              <div style={{ position: 'absolute', top: 36, right: 0, zIndex: 4, background: '#1a1a1aee', border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                <button
                  onClick={() => { reportStream(); setMenuOpen(false) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: reported ? '#888' : '#ffb4b4', padding: '10px 14px', fontSize: 13, cursor: reported ? 'default' : 'pointer' }}
                >
                  {reported ? 'Reported' : 'Report stream'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {liveOffer && status === 'connected' && (
        <span style={{ position: 'absolute', top: 62, left: 14, zIndex: 2, background: '#111c', border: `1px solid ${accent}`, color: accent, fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
          {liveOffer.percent}% off featured items
        </span>
      )}

      {/* Right action rail: like, share, shop -- TikTok's vertical icon stack */}
      {status === 'connected' && (
        <div style={{ position: 'absolute', right: 10, bottom: 210, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <button className="velor-rail-btn" onClick={sendHeart} aria-label="Like">
              <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={likeCount > 0 ? accent : 'none'} stroke={likeCount > 0 ? accent : '#fff'} strokeWidth="2"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2.4 4.5 6 4.5c2.2 0 3.7 1.2 4.5 2.6.8-1.4 2.3-2.6 4.5-2.6 3.6 0 5.5 3.5 4 7.2C19.5 16.4 12 21 12 21Z" /></svg>
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{likeCount}</span>
            </button>
            <div style={{ position: 'absolute', bottom: 30, left: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
              {hearts.map((h) => (
                <span key={h.id} className="velor-heart" style={{ position: 'absolute', left: h.x - 50, fontSize: 20, '--drift': `${(h.x - 50) * 0.6}px` } as React.CSSProperties}>
                  &#10084;
                </span>
              ))}
            </div>
          </div>

          <button className="velor-rail-btn" onClick={shareStream} aria-label="Share">
            <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v14" /></svg>
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>Share</span>
          </button>

          {products.length > 0 && (
            <button className="velor-rail-btn" onClick={() => setShopOpen((v) => !v)} aria-label="Shop">
              <span style={{ width: 42, height: 42, borderRadius: '50%', background: shopOpen ? accent : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={shopOpen ? '#111' : '#fff'} strokeWidth="2"><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{products.length}</span>
            </button>
          )}
        </div>
      )}

      {/* Bottom scrim stack: now-showing card, caption, chat feed, composer */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 40%, transparent 100%)', paddingTop: 60, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {shopOpen && pinned && status === 'connected' && (
          <div style={{ margin: '0 66px 10px 14px', background: 'rgba(20,20,20,0.72)', border: `1px solid ${accent}`, borderRadius: 14, padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            {pinned.images[0] && <img src={pinned.images[0]} alt="" style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Now showing</div>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pinned.title}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {offerApplies(pinned) ? (
                  <>
                    <span style={{ color: accent }}>{sym}{offerPrice(pinned).toFixed(2)}</span>
                    <span style={{ color: '#999', textDecoration: 'line-through', marginLeft: 6, fontSize: 11 }}>{sym}{pinned.price.toFixed(2)}</span>
                  </>
                ) : (
                  <span style={{ color: accent }}>{sym}{pinned.price.toFixed(2)}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => buyNow(pinned)}
              disabled={pinned.stock <= 0}
              style={{ background: pinned.stock <= 0 ? '#333' : accent, color: pinned.stock <= 0 ? '#888' : '#111', border: 'none', padding: '9px 16px', borderRadius: 999, fontWeight: 700, fontSize: 12, cursor: pinned.stock <= 0 ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {addedId === pinned.id ? 'Added' : pinned.stock <= 0 ? 'Sold out' : 'Buy now'}
            </button>
          </div>
        )}

        {shopOpen && trayProducts.length > 0 && status === 'connected' && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 66px 10px 14px' }}>
            {trayProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => buyNow(p)}
                disabled={p.stock <= 0}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left', padding: '6px 10px 6px 6px', borderRadius: 999, cursor: p.stock <= 0 ? 'default' : 'pointer',
                  background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, whiteSpace: 'nowrap',
                }}
              >
                {p.images[0] && <img src={p.images[0]} alt="" style={{ width: 26, height: 26, objectFit: 'cover', borderRadius: '50%' }} />}
                <span>{p.title}</span>
                <span style={{ color: accent, fontWeight: 700 }}>{addedId === p.id ? 'Added' : p.stock <= 0 ? 'Sold out' : `${sym}${(offerApplies(p) ? offerPrice(p) : p.price).toFixed(2)}`}</span>
              </button>
            ))}
          </div>
        )}

        {/* Title + description, directly on the video -- no separate box */}
        <div style={{ padding: '0 66px 8px 14px', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{stream?.title}</div>
          {stream?.description && <div style={{ fontSize: 12.5, opacity: 0.85, lineHeight: 1.4 }}>{stream.description}</div>}
        </div>

        {/* Chat feed, newest at the bottom, fading upward into the video -- TikTok-style rounded bubbles */}
        {status === 'connected' && (
          <div style={{ height: 130, overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', gap: 6, padding: '0 66px 0 14px', maskImage: 'linear-gradient(to bottom, transparent, black 35%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 35%)' }}>
            <div ref={chatEndRef} />
            {chat.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>Say hello — ask the seller anything about what they are showing.</div>}
            {chat.slice(-40).reverse().map((m) => (
              <div key={m.id} style={{ display: 'inline-flex', alignSelf: 'flex-start', maxWidth: '92%', background: 'rgba(0,0,0,0.38)', borderRadius: 14, padding: '5px 11px', fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>
                <span style={{ color: accent, fontWeight: 700, marginRight: 5 }}>{m.name}</span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
        )}

        {chatError && <div style={{ padding: '0 14px 4px', color: '#ffb4b4', fontSize: 12, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{chatError}</div>}

        {/* Composer, pinned at the very bottom of the frame */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px 14px' }}>
          <input
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
            placeholder="Say something..."
            maxLength={300}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 13 }}
          />
          <button onClick={sendChat} style={{ background: accent, color: '#111', border: 'none', padding: '10px 18px', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
