'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Room, RoomEvent, Track, createLocalTracks } from 'livekit-client'
import type { LocalTrack } from 'livekit-client'
import { checkMessageContent } from '@/lib/messageFilter'

type Product = { id: string; title: string; price: number; stock: number; status: string }
type Stream = {
  id: string
  title: string
  description: string | null
  roomName: string
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
  productIds: string[]
  scheduledFor: string | null
  createdAt: string
}
type ChatMsg = { id: string; name: string; text: string }

// Data-channel message shapes shared with the viewer page
// (app/live/[room]/page.tsx) -- keep both in sync if this changes.
type DataMsg =
  | { t: 'chat'; name: string; text: string }
  | { t: 'pin'; productId: string | null }
  | { t: 'state'; productId: string | null }

const decoder = new TextDecoder()
const encoder = new TextEncoder()

// getUserMedia() throws a DOMException whose .message is a terse browser
// string ("Requested device not found") that doesn't tell a seller what to
// actually do. This turns the handful of real-world causes into plain
// instructions. NotFoundError is by far the most common one in practice:
// it means the browser could not detect ANY camera or microphone at all
// (no webcam present, or the OS is blocking device enumeration entirely) --
// not a permissions problem, so re-prompting for permission will not help.
function friendlyMediaError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return "No camera or microphone was found on this device. Make sure a webcam is connected (built-in or external), that no other app is using it, and that your operating system allows this browser to see it -- then reload and try again."
  }
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return "Camera and microphone access was blocked. Click the camera icon in your browser's address bar, allow access for velorcommerce.store, then reload and try again."
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return "Your camera or microphone is already being used by another app or browser tab. Close it there, then try again."
  }
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return "Your camera doesn't support the requested video settings. Try a different camera if you have one."
  }
  return e instanceof Error ? e.message : 'Could not go live - check camera/mic permissions.'
}

export default function GoLivePage() {
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<string | null>(null)
  const [canGoLive, setCanGoLive] = useState(false)
  const [liveKitReady, setLiveKitReady] = useState(true)
  const [streams, setStreams] = useState<Stream[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [activeStream, setActiveStream] = useState<Stream | null>(null)
  const roomRef = useRef<Room | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Scheduling (2026-07-20)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledFor, setScheduledFor] = useState('')
  const [starting, setStarting] = useState(false)

  // Live-only offer (2026-07-20)
  const [offerEnabled, setOfferEnabled] = useState(false)
  const [offerPercent, setOfferPercent] = useState('15')

  // Live chat + pinned product, broadcaster side (2026-07-20)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [chatDraft, setChatDraft] = useState('')
  const [chatError, setChatError] = useState('')
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const pinnedIdRef = useRef<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const sellerNameRef = useRef('Seller')

  useEffect(() => {
    async function load() {
      try {
        const [liveRes, prodRes] = await Promise.all([
          fetch('/api/dashboard/live'),
          fetch('/api/dashboard/products'),
        ])
        const liveData = await liveRes.json()
        const prodData = await prodRes.json()
        if (liveRes.ok) {
          setTier(liveData.tier)
          setCanGoLive(!!liveData.canGoLive)
          setLiveKitReady(liveData.liveKitReady)
          setStreams(liveData.streams || [])
          if (liveData.storeName) sellerNameRef.current = liveData.storeName
          const active = (liveData.streams || []).find((s: Stream) => s.status === 'LIVE' || s.status === 'SCHEDULED')
          if (active) setActiveStream(active)
        }
        if (prodRes.ok) setProducts(prodData.products || [])
      } catch (e) {
        setError('Could not load Live Shopping.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    return () => { roomRef.current?.disconnect() }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [chat])

  const handleData = useCallback((payload: Uint8Array) => {
    try {
      const msg = JSON.parse(decoder.decode(payload)) as DataMsg
      if (msg.t === 'chat') {
        // Defense in depth: a modified viewer client could publish raw data
        // even if our own UI blocks it. Re-validate on receive too.
        if (checkMessageContent(msg.text).blocked) return
        setChat((prev) => [...prev.slice(-119), { id: `${Date.now()}-${Math.random()}`, name: msg.name, text: msg.text }])
      }
    } catch {
      // ignore malformed payloads
    }
  }, [])

  async function connectRoom(wsUrl: string, token: string, publish: boolean) {
    const room = new Room()
    room.on(RoomEvent.DataReceived, (payload) => handleData(payload))
    if (publish) {
      room.on(RoomEvent.ParticipantConnected, () => {
        // Re-broadcast the current pin so a viewer who joins mid-stream
        // still sees whatever is currently featured. Reads from a ref, not
        // the pinnedId state captured when this listener was registered,
        // since togglePin() can run long after connectRoom() returns.
        publishPinState(pinnedIdRef.current)
      })
    }
    await room.connect(wsUrl, token)
    roomRef.current = room
    return room
  }

  function publishPinState(productId: string | null) {
    const room = roomRef.current
    if (!room) return
    const payload: DataMsg = { t: 'pin', productId }
    room.localParticipant.publishData(encoder.encode(JSON.stringify(payload)), { reliable: true })
  }

  function togglePin(productId: string) {
    const next = pinnedId === productId ? null : productId
    setPinnedId(next)
    pinnedIdRef.current = next
    publishPinState(next)
  }

  function sendChat() {
    setChatError('')
    const text = chatDraft.trim()
    if (!text) return
    const check = checkMessageContent(text)
    if (check.blocked) {
      setChatError(check.reason || "That message can't be sent.")
      return
    }
    const name = `${sellerNameRef.current} (seller)`
    const room = roomRef.current
    if (room) {
      const payload: DataMsg = { t: 'chat', name, text }
      room.localParticipant.publishData(encoder.encode(JSON.stringify(payload)), { reliable: true })
    }
    // LiveKit does not echo the sender's own data messages back to them.
    setChat((prev) => [...prev.slice(-119), { id: `${Date.now()}-${Math.random()}`, name, text }])
    setChatDraft('')
  }

  async function startStream() {
    setError('')
    if (!title.trim()) { setError('Give your stream a title.'); return }
    let scheduledForIso: string | null = null
    if (scheduleEnabled) {
      if (!scheduledFor) { setError('Pick a date and time to schedule for.'); return }
      const d = new Date(scheduledFor)
      if (isNaN(d.getTime())) { setError('Invalid schedule date.'); return }
      scheduledForIso = d.toISOString()
    }
    let liveOfferPercent: number | null = null
    if (offerEnabled) {
      const n = Number(offerPercent)
      if (!Number.isFinite(n) || n < 5 || n > 50) { setError('Live offer must be between 5 and 50 percent.'); return }
      if (selectedProductIds.length === 0) { setError('A live offer needs at least one featured product.'); return }
      liveOfferPercent = n
    }

    setConnecting(true)
    try {
      const res = await fetch('/api/dashboard/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          productIds: selectedProductIds,
          scheduledFor: scheduledForIso,
          liveOfferPercent,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not start stream.'); setConnecting(false); return }

      setActiveStream(data.stream)
      setPinnedId(null)
      pinnedIdRef.current = null
      setChat([])

      if (data.stream.status === 'SCHEDULED') {
        // Nothing to connect yet -- the seller goes live later from the
        // "Go Live" button once the scheduled time arrives.
        setConnecting(false)
        return
      }

      const tracks: LocalTrack[] = await createLocalTracks({ audio: true, video: true })
      const room = await connectRoom(data.wsUrl, data.token, true)
      for (const track of tracks) {
        await room.localParticipant.publishTrack(track)
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current)
        }
      }
    } catch (e: unknown) {
      setError(friendlyMediaError(e))
    } finally {
      setConnecting(false)
    }
  }

  async function goLiveFromSchedule() {
    if (!activeStream) return
    setError('')
    setStarting(true)
    try {
      const res = await fetch(`/api/dashboard/live/${activeStream.id}/start`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not go live.'); setStarting(false); return }

      setActiveStream(data.stream)
      setPinnedId(null)
      pinnedIdRef.current = null
      setChat([])

      const tracks: LocalTrack[] = await createLocalTracks({ audio: true, video: true })
      const room = await connectRoom(data.wsUrl, data.token, true)
      for (const track of tracks) {
        await room.localParticipant.publishTrack(track)
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current)
        }
      }
    } catch (e: unknown) {
      setError(friendlyMediaError(e))
    } finally {
      setStarting(false)
    }
  }

  async function cancelScheduled() {
    if (!activeStream) return
    try {
      await fetch(`/api/dashboard/live/${activeStream.id}/end`, { method: 'POST' })
      setActiveStream(null)
      setTitle('')
      setDescription('')
      setSelectedProductIds([])
    } catch (e) {
      setError('Could not cancel the scheduled stream.')
    }
  }

  async function endStream() {
    if (!activeStream) return
    try {
      await roomRef.current?.disconnect()
      roomRef.current = null
      await fetch(`/api/dashboard/live/${activeStream.id}/end`, { method: 'POST' })
      setActiveStream(null)
      setTitle('')
      setDescription('')
      setSelectedProductIds([])
      setPinnedId(null)
      pinnedIdRef.current = null
      setChat([])
    } catch (e) {
      setError('Could not end stream cleanly - it may still show as live for a moment.')
    }
  }

  const dark = '#111111'
  const panel = '#1A1A1A'
  const border = '#2A2A2A'
  const accent = '#FF6B00'

  if (loading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: dark }}>Loading Live Shopping...</div>
  }

  if (!canGoLive) {
    return (
      <div style={{ minHeight: '60vh', background: dark, color: '#fff', padding: '48px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 520, textAlign: 'center', background: panel, border: `1px solid ${border}`, borderRadius: 16, padding: 40 }}>
          <div style={{ fontSize: 13, letterSpacing: 1, color: accent, marginBottom: 12, textTransform: 'uppercase' }}>Live shopping</div>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Go Live Shopping</h1>
          <p style={{ color: '#aaa', lineHeight: 1.6, marginBottom: 24 }}>
            Broadcast live to buyers anywhere in the world and sell in real time, straight from your browser - no app needed. Live Shopping is included with every Velor seller plan.
          </p>
          <a href="/dashboard/settings" style={{ display: 'inline-block', background: accent, color: '#111', padding: '12px 28px', borderRadius: 999, fontWeight: 600, textDecoration: 'none' }}>
            Back to settings
          </a>
        </div>
      </div>
    )
  }

  if (!liveKitReady) {
    return (
      <div style={{ minHeight: '60vh', background: dark, color: '#fff', padding: 48, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Live Shopping is almost ready</h1>
        <p style={{ color: '#aaa' }}>We&apos;re finishing the broadcast infrastructure. Check back shortly.</p>
      </div>
    )
  }

  const streamProducts = activeStream ? products.filter((p) => activeStream.productIds.includes(p.id)) : []

  return (
    <div style={{ minHeight: '100vh', background: dark, color: '#fff', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ fontSize: 13, letterSpacing: 1, color: accent, marginBottom: 8, textTransform: 'uppercase' }}>Live Shopping</div>
        <h1 style={{ fontSize: 30, marginBottom: 24 }}>Go Live</h1>

        {error && (
          <div style={{ background: '#3a1a1a', border: '1px solid #6b2a2a', color: '#ffb4b4', padding: 14, borderRadius: 10, marginBottom: 20 }}>{error}</div>
        )}

        {activeStream && activeStream.status === 'SCHEDULED' ? (
          <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
              <strong>SCHEDULED</strong>
              <span style={{ color: '#aaa' }}>{activeStream.title}</span>
            </div>
            {activeStream.scheduledFor && (
              <p style={{ color: '#ccc', marginBottom: 20 }}>
                Goes live {new Date(activeStream.scheduledFor).toLocaleDateString()} at {new Date(activeStream.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                Buyers who tapped &quot;Notify me&quot; will get a push the moment you go live.
              </p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={goLiveFromSchedule}
                disabled={starting}
                style={{ background: accent, color: '#111', border: 'none', padding: '12px 28px', borderRadius: 999, fontWeight: 700, cursor: starting ? 'default' : 'pointer', opacity: starting ? 0.6 : 1 }}
              >
                {starting ? 'Going live...' : 'Go Live Now'}
              </button>
              <button
                onClick={cancelScheduled}
                style={{ background: 'transparent', color: '#aaa', border: `1px solid ${border}`, padding: '12px 24px', borderRadius: 999, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : activeStream ? (
          <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: accent, display: 'inline-block' }} />
              <strong>LIVE</strong>
              <span style={{ color: '#aaa' }}>{activeStream.title}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 480px) minmax(260px, 340px)', gap: 20, alignItems: 'start' }}>
              <div>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} />
                <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <a href={`/live/${activeStream.roomName}`} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: 'underline' }}>
                    View your public live page
                  </a>
                  <button onClick={endStream} style={{ marginLeft: 'auto', background: '#ff3b3b', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 999, fontWeight: 600, cursor: 'pointer' }}>
                    End stream
                  </button>
                </div>

                {streamProducts.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ color: '#ccc', fontSize: 14, marginBottom: 8 }}>Tap a product to pin it as &quot;Now showing&quot; for viewers</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                      {streamProducts.map((p) => {
                        const isPinned = pinnedId === p.id
                        return (
                          <button
                            key={p.id}
                            onClick={() => togglePin(p.id)}
                            style={{
                              textAlign: 'left', padding: 10, borderRadius: 10, cursor: 'pointer',
                              background: isPinned ? '#2a1a0a' : '#0d0d0d',
                              border: `1px solid ${isPinned ? accent : border}`, color: '#fff', fontSize: 13,
                            }}
                          >
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isPinned ? 700 : 400 }}>{p.title}</div>
                            <div style={{ color: isPinned ? accent : '#888', fontSize: 12, marginTop: 4 }}>{isPinned ? 'Now showing' : 'Pin'}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: '#0d0d0d', border: `1px solid ${border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', height: 420 }}>
                <div style={{ padding: '10px 14px', borderBottom: `1px solid ${border}`, color: '#ccc', fontSize: 13, fontWeight: 600 }}>Live chat</div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chat.length === 0 && <div style={{ color: '#555', fontSize: 13 }}>Messages from viewers will appear here.</div>}
                  {chat.map((m) => (
                    <div key={m.id} style={{ fontSize: 13, lineHeight: 1.4 }}>
                      <span style={{ color: accent, fontWeight: 600 }}>{m.name}: </span>
                      <span style={{ color: '#eee' }}>{m.text}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                {chatError && <div style={{ color: '#ffb4b4', fontSize: 12, padding: '0 14px 8px' }}>{chatError}</div>}
                <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: `1px solid ${border}` }}>
                  <input
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
                    placeholder="Reply to viewers..."
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${border}`, background: '#111', color: '#fff', fontSize: 13 }}
                  />
                  <button onClick={sendChat} style={{ background: accent, color: '#111', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>Stream title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New autumn collection - live first look"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${border}`, background: '#0d0d0d', color: '#fff', marginBottom: 16 }}
            />
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${border}`, background: '#0d0d0d', color: '#fff', marginBottom: 16, resize: 'vertical' }}
            />
            <label style={{ display: 'block', marginBottom: 8, color: '#ccc', fontSize: 14 }}>Feature products (up to 12)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 20, maxHeight: 260, overflowY: 'auto' }}>
              {products.map((p) => {
                const checked = selectedProductIds.includes(p.id)
                return (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, border: `1px solid ${checked ? accent : border}`, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedProductIds((prev) =>
                          checked ? prev.filter((id) => id !== p.id) : prev.length >= 12 ? prev : [...prev, p.id]
                        )
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                  </label>
                )
              })}
              {products.length === 0 && <span style={{ color: '#666', fontSize: 13 }}>Add products to your store to feature them in a stream.</span>}
            </div>

            <div style={{ border: `1px solid ${border}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#ccc', cursor: 'pointer' }}>
                <input type="checkbox" checked={scheduleEnabled} onChange={(e) => setScheduleEnabled(e.target.checked)} />
                Schedule for later instead of going live now
              </label>
              {scheduleEnabled && (
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: '#0d0d0d', color: '#fff' }}
                />
              )}
            </div>

            <div style={{ border: `1px solid ${border}`, borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#ccc', cursor: 'pointer' }}>
                <input type="checkbox" checked={offerEnabled} onChange={(e) => setOfferEnabled(e.target.checked)} />
                Run a live-only discount on featured products
              </label>
              {offerEnabled && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={offerPercent}
                    onChange={(e) => setOfferPercent(e.target.value)}
                    style={{ width: 80, padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: '#0d0d0d', color: '#fff' }}
                  />
                  <span style={{ color: '#aaa', fontSize: 13 }}>% off, live only -- the price reverts the moment the stream ends</span>
                </div>
              )}
            </div>

            <button
              onClick={startStream}
              disabled={connecting}
              style={{ background: accent, color: '#111', border: 'none', padding: '14px 32px', borderRadius: 999, fontWeight: 700, cursor: connecting ? 'default' : 'pointer', opacity: connecting ? 0.6 : 1 }}
            >
              {connecting ? (scheduleEnabled ? 'Scheduling...' : 'Going live...') : scheduleEnabled ? 'Schedule Stream' : 'Go Live Now'}
            </button>
            <p style={{ color: '#666', fontSize: 12, marginTop: 12 }}>
              Your browser will ask for camera and microphone access when you go live. Buyers check out the same way they always do - nothing changes there.
            </p>
          </div>
        )}

        {streams.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12, color: '#ccc' }}>Past streams</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {streams.filter((s) => s.status === 'ENDED').slice(0, 10).map((s) => (
                <div key={s.id} style={{ padding: 12, border: `1px solid ${border}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: 13 }}>
                  <span>{s.title}</span>
                  <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
