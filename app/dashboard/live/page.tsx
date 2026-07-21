'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Room, RoomEvent, Track, createLocalTracks, ConnectionQuality } from 'livekit-client'
import type { LocalTrack } from 'livekit-client'
import { checkMessageContent } from '@/lib/messageFilter'
import { HALO, HaloBackdrop, HaloButton, glassStyle } from '@/lib/halo'

type Product = { id: string; title: string; price: number; stock: number; status: string; images?: string[] }
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

  // Mobile-responsive Go Live layout (fix: "End stream" button was
  // unreachable on narrow viewports because the live grid used a fixed
  // two-column layout with no responsive breakpoint).
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 800)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fix: the mobile full-screen broadcaster view sized itself with the CSS
  // `100dvh` unit, which does not reliably shrink when the on-screen
  // keyboard opens across mobile browsers (Safari overlays the keyboard
  // without resizing `dvh` at all in some versions; Android Chrome's
  // handling has also been inconsistent build to build). The visible
  // symptom William hit repeatedly: tapping the chat box looked like the
  // screen "expanding" and cropping the video, and it never reliably
  // settled back to normal. `window.visualViewport` is the one API every
  // mobile browser keeps accurate for the keyboard-open height, so track
  // it directly and use it instead of trusting any viewport-height CSS
  // unit for this specific full-screen overlay.
  const [viewportH, setViewportH] = useState<number | null>(null)
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return
    const update = () => setViewportH(vv.height)
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  // Belt-and-suspenders against iOS Safari's zoom-on-input-focus (William:
  // "the screen does not auto resize" -- it expands once and stays
  // expanded). Every input here is already at the 16px no-zoom threshold,
  // but the site's shared viewport meta tag still allows pinch-zoom, and
  // once iOS Safari zooms in for any reason it does NOT automatically zoom
  // back out on blur -- the page just stays "expanded" until the user
  // manually pinches back out. Locking the viewport to
  // maximum-scale=1/user-scalable=no while on this mobile broadcaster page
  // removes the zoom trigger at the source. Restored on unmount.
  useEffect(() => {
    if (!isMobile) return
    const meta = document.querySelector('meta[name="viewport"]')
    const prev = meta?.getAttribute('content') ?? null
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    }
    return () => {
      if (meta && prev !== null) meta.setAttribute('content', prev)
    }
  }, [isMobile])

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

  // Advanced Go Live setup (William, 2026-07-20: "the sellers dashboard/go
  // live page looks absolutely prehistoric... needs an advanced go live
  // page not blocked boxes... every angle covered"). A real self-view
  // camera/mic check before going live -- genuinely useful, the same thing
  // every professional streaming tool (StreamYard, OBS, TikTok LIVE Studio)
  // opens with -- plus device selection when a seller has more than one
  // camera or microphone. This preview is a *separate* getUserMedia call
  // from the one createLocalTracks() makes when actually going live; it is
  // stopped and released the moment the seller goes live or leaves the
  // page, so the browser's camera indicator doesn't stay on for no reason.
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)
  const [previewState, setPreviewState] = useState<'idle' | 'starting' | 'ready' | 'denied' | 'error'>('idle')
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<string>('')
  const [selectedAudioId, setSelectedAudioId] = useState<string>('')

  // Real viewer count while broadcasting -- every other participant in this
  // same LiveKit room is a genuine connected viewer, not invented.
  const [viewerCount, setViewerCount] = useState(0)
  // Real connection quality while broadcasting, from LiveKit's own
  // ConnectionQualityChanged event on the local participant -- not a
  // decorative signal-bars icon, an actual read of the publish connection.
  const [connQuality, setConnQuality] = useState<ConnectionQuality>(ConnectionQuality.Unknown)

  // Live mic level meter during the preview -- Web Audio API reading the
  // same preview stream, a genuine level (not decorative), so a seller can
  // tell before going live whether their mic is actually picking up sound.
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const levelRafRef = useRef<number | null>(null)
  const [micLevel, setMicLevel] = useState(0)

  function stopPreview() {
    previewStreamRef.current?.getTracks().forEach((t) => t.stop())
    previewStreamRef.current = null
    if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current)
    levelRafRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    analyserRef.current = null
    setMicLevel(0)
    setPreviewState('idle')
  }

  function startLevelMeter(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new AudioCtx()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioCtxRef.current = audioCtx
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setMicLevel(Math.min(1, avg / 90))
        levelRafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // the level meter is a nice-to-have -- a browser without AudioContext
      // support still gets a working camera preview, just no meter
    }
  }

  async function startPreview(videoId?: string, audioId?: string) {
    stopPreview()
    setPreviewState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoId ? { deviceId: { exact: videoId } } : true,
        audio: audioId ? { deviceId: { exact: audioId } } : true,
      })
      previewStreamRef.current = stream
      if (previewVideoRef.current) previewVideoRef.current.srcObject = stream
      setPreviewState('ready')
      startLevelMeter(stream)

      // Device labels are only populated by the browser once permission has
      // been granted at least once -- (re-)enumerate now that it has.
      const all = await navigator.mediaDevices.enumerateDevices()
      const vids = all.filter((d) => d.kind === 'videoinput')
      const auds = all.filter((d) => d.kind === 'audioinput')
      setVideoDevices(vids)
      setAudioDevices(auds)
      const activeVideoTrack = stream.getVideoTracks()[0]
      const activeAudioTrack = stream.getAudioTracks()[0]
      if (activeVideoTrack) setSelectedVideoId(activeVideoTrack.getSettings().deviceId || vids[0]?.deviceId || '')
      if (activeAudioTrack) setSelectedAudioId(activeAudioTrack.getSettings().deviceId || auds[0]?.deviceId || '')
    } catch (e: unknown) {
      const name = e instanceof DOMException ? e.name : ''
      setPreviewState(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'error')
    }
  }

  useEffect(() => {
    return () => stopPreview()
  }, [])

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
      const syncViewerCount = () => setViewerCount(room.remoteParticipants.size)
      room.on(RoomEvent.ParticipantConnected, () => {
        // Re-broadcast the current pin so a viewer who joins mid-stream
        // still sees whatever is currently featured. Reads from a ref, not
        // the pinnedId state captured when this listener was registered,
        // since togglePin() can run long after connectRoom() returns.
        publishPinState(pinnedIdRef.current)
        syncViewerCount()
      })
      room.on(RoomEvent.ParticipantDisconnected, syncViewerCount)
      room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        if (participant.isLocal) setConnQuality(quality)
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

  // startStream()/goLiveFromSchedule() flip the stream to LIVE in the database
  // (via the POST to /api/dashboard/live or .../start) *before* grabbing the
  // camera. If createLocalTracks()/publishTrack() then throws, the seller was
  // otherwise left stuck on the LIVE view -- black video, "End stream" button
  // -- with no way back to a fresh Go Live form except manually ending it.
  // This rolls that back: disconnect any partial room, tell the backend to
  // end the stream, and clear activeStream so the UI drops back to the form.
  async function rollbackFailedStart(streamId: string) {
    try {
      await roomRef.current?.disconnect()
    } catch {
      // best effort
    }
    roomRef.current = null
    try {
      await fetch(`/api/dashboard/live/${streamId}/end`, { method: 'POST' })
    } catch {
      // best effort -- the error banner already tells the seller what to fix
    }
    setActiveStream(null)
  }

  async function startStream() {
    setError('')
    if (!title.trim()) { setError('Give your stream a title.'); return }
    // Client-side mirror of the server filter -- catch it before the API does.
    if (checkMessageContent(`${title} ${description}`).blocked) { setError("Titles and descriptions can't include contact details, links, or social handles -- everything stays on Velor, on stream too."); return }
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
    let startedStreamId: string | undefined
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
      startedStreamId = data.stream.id
      setPinnedId(null)
      pinnedIdRef.current = null
      setChat([])

      if (data.stream.status === 'SCHEDULED') {
        // Nothing to connect yet -- the seller goes live later from the
        // "Go Live" button once the scheduled time arrives.
        setConnecting(false)
        return
      }

      // Release the setup-form preview's camera/mic before requesting the
      // real broadcast tracks -- some browsers/OSes refuse a second
      // concurrent open of the same physical device and would otherwise
      // surface a confusing NotReadableError right as the seller goes live.
      stopPreview()
      const tracks: LocalTrack[] = await createLocalTracks({
        audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
        video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
      })
      const room = await connectRoom(data.wsUrl, data.token, true)
      for (const track of tracks) {
        await room.localParticipant.publishTrack(track)
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current)
        }
      }
    } catch (e: unknown) {
      setError(friendlyMediaError(e))
      if (startedStreamId) await rollbackFailedStart(startedStreamId)
    } finally {
      setConnecting(false)
    }
  }

  async function goLiveFromSchedule() {
    if (!activeStream) return
    setError('')
    setStarting(true)
    let startedStreamId: string | undefined
    try {
      const res = await fetch(`/api/dashboard/live/${activeStream.id}/start`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not go live.'); setStarting(false); return }

      setActiveStream(data.stream)
      startedStreamId = data.stream.id
      setPinnedId(null)
      pinnedIdRef.current = null
      setChat([])

      stopPreview()
      const tracks: LocalTrack[] = await createLocalTracks({
        audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
        video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
      })
      const room = await connectRoom(data.wsUrl, data.token, true)
      for (const track of tracks) {
        await room.localParticipant.publishTrack(track)
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current)
        }
      }
    } catch (e: unknown) {
      setError(friendlyMediaError(e))
      if (startedStreamId) await rollbackFailedStart(startedStreamId)
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
      setViewerCount(0)
      setConnQuality(ConnectionQuality.Unknown)
    } catch (e) {
      setError('Could not end stream cleanly - it may still show as live for a moment.')
    }
  }

  // HALO REDESIGN (2026-07-21, William: "go live page needs complete
  // redesign"). Scope, deliberately: every "boxed dashboard" surface below
  // -- gates, the setup form, the scheduled card, the desktop chrome around
  // the live video, past streams -- moves to the light Halo glass language.
  // The actual broadcast surfaces stay dark on purpose (stageDark/
  // stageBorder/stageMuted below): a dark stage around live video is
  // correct cinematic design, not leftover "boxed" styling, and the mobile
  // full-screen broadcaster overlay further down is untouched entirely --
  // it's a separate immersive layer with hard-won iOS-zoom/viewport fixes
  // from the 2026-07-20 session, verified working, not part of this pass.
  const dark = HALO.paper
  const panel = 'rgba(255,255,255,0.62)'
  const border = 'rgba(255,255,255,0.95)'
  const accent = HALO.accent
  const ink = HALO.ink
  const muted = HALO.muted
  // Dark stage tokens -- used ONLY for genuine video/broadcast chrome.
  const stageDark = '#111111'
  const stagePanel = '#1A1A1A'
  const stageBorder = '#2A2A2A'
  const stageMuted = '#999999'

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, background: dark, fontFamily: HALO.fontBody }}>
        <HaloBackdrop />
        <span style={{ position: 'relative', zIndex: 1 }}>Loading Live Shopping…</span>
      </div>
    )
  }

  if (!canGoLive) {
    return (
      <div style={{ minHeight: '60vh', background: dark, color: ink, padding: '48px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <HaloBackdrop />
        <div style={{ ...glassStyle('lens'), position: 'relative', zIndex: 1, maxWidth: 520, textAlign: 'center', padding: 40 }}>
          <div style={{ fontFamily: HALO.fontDisplay, fontSize: 11, letterSpacing: '0.16em', color: accent, marginBottom: 12, textTransform: 'uppercase', fontWeight: 800 }}>Live shopping</div>
          <h1 style={{ fontFamily: HALO.fontSerif, fontStyle: 'italic', fontWeight: 500, fontSize: 28, marginBottom: 12, color: ink }}>Go Live Shopping</h1>
          <p style={{ color: muted, lineHeight: 1.6, marginBottom: 24 }}>
            Broadcast live to buyers anywhere in the world and sell in real time, straight from your browser - no app needed. Live Shopping is included with every Velor seller plan.
          </p>
          <HaloButton variant="accent" href="/dashboard/settings">Back to settings</HaloButton>
        </div>
      </div>
    )
  }

  if (!liveKitReady) {
    return (
      <div style={{ minHeight: '60vh', background: dark, color: ink, padding: 48, textAlign: 'center', position: 'relative' }}>
        <HaloBackdrop />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: HALO.fontSerif, fontStyle: 'italic', fontWeight: 500, fontSize: 24, marginBottom: 12, color: ink }}>Live Shopping is almost ready</h1>
          <p style={{ color: muted }}>We&apos;re finishing the broadcast infrastructure. Check back shortly.</p>
        </div>
      </div>
    )
  }

  const streamProducts = activeStream ? products.filter((p) => activeStream.productIds.includes(p.id)) : []
  // First selected product, used to drive the "how buyers will see it" mock
  // preview card in the setup form -- real product data (title, image,
  // price), not a placeholder, just not pinned to a live room yet.
  const mockPinnedProduct = products.find((p) => p.id === selectedProductIds[0]) ?? null

  return (
    <div style={{ minHeight: '100vh', background: dark, color: ink, padding: '32px 24px', position: 'relative', fontFamily: HALO.fontBody }}>
      <HaloBackdrop />
      <style>{`
        @keyframes velorLivePulse {
          0% { box-shadow: 0 0 0 0 rgba(255,107,0,0.55); }
          70% { box-shadow: 0 0 0 8px rgba(255,107,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,107,0,0); }
        }
        .velor-live-dot { animation: velorLivePulse 1.8s ease-out infinite; }
        .velor-drawer-handle { width: 36px; height: 4px; border-radius: 999px; background: #3a3a3a; margin: 8px auto 0; }
      `}</style>
      <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: HALO.fontDisplay, fontSize: 11, letterSpacing: '0.16em', color: HALO.amber, marginBottom: 10, textTransform: 'uppercase', fontWeight: 800 }}>Live Shopping</div>
        <h1 style={{ fontFamily: HALO.fontSerif, fontStyle: 'italic', fontWeight: 500, fontSize: 34, marginBottom: 24, color: ink }}>Go Live</h1>

        {error && (
          <div style={{ ...glassStyle('lens', { borderRadius: 14 }), background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.35)', color: '#A8342E', padding: 14, marginBottom: 20 }}>{error}</div>
        )}

        {activeStream && activeStream.status === 'SCHEDULED' ? (
          <div style={{ ...glassStyle('lens'), padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: muted, display: 'inline-block' }} />
              <strong style={{ fontFamily: HALO.fontDisplay }}>SCHEDULED</strong>
              <span style={{ color: muted }}>{activeStream.title}</span>
            </div>
            {activeStream.scheduledFor && (
              <p style={{ color: HALO.inkSoft, marginBottom: 20 }}>
                Goes live {new Date(activeStream.scheduledFor).toLocaleDateString()} at {new Date(activeStream.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                Buyers who tapped &quot;Notify me&quot; will get a push the moment you go live.
              </p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <HaloButton variant="accent" onClick={goLiveFromSchedule} style={starting ? { opacity: 0.6, cursor: 'default' } : undefined}>
                {starting ? 'Going live...' : 'Go Live Now'}
              </HaloButton>
              <HaloButton variant="soft" onClick={cancelScheduled}>Cancel</HaloButton>
            </div>
          </div>
        ) : activeStream ? (
          <div style={{ ...glassStyle('lens'), padding: 24 }}>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span className="velor-live-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: accent, display: 'inline-block' }} />
                <strong style={{ fontFamily: HALO.fontDisplay, color: ink }}>LIVE</strong>
                <span style={{ color: muted }}>{activeStream.title}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ViewerCountBadge count={viewerCount} border={HALO.border} />
                  <ConnQualityBadge quality={connQuality} />
                </span>
              </div>
            )}

            {isMobile ? (
              // Full-screen broadcaster view, TikTok/Instagram-Live style:
              // one always-visible input box pinned at the very bottom, and
              // messages climb the screen above it as they arrive -- never
              // a toggled drawer that eats half the picture (William:
              // "the live chat box needs to be single file box as it takes
              // up the screen once opened").
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: viewportH ? `${viewportH}px` : '100dvh', background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="velor-live-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: accent, display: 'inline-block' }} />
                    <strong style={{ color: '#fff' }}>LIVE</strong>
                    <ViewerCountBadge count={viewerCount} border="rgba(255,255,255,0.25)" dark />
                    <ConnQualityBadge quality={connQuality} dark />
                  </div>
                  <button onClick={endStream} style={{ background: '#ff3b3b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>
                    End stream
                  </button>
                </div>

                <div style={{ flex: 1 }} />

                {/* Chat feed: fixed-height, newest message at the bottom,
                    fading upward into the video -- never grows or covers
                    the picture no matter how many messages arrive. */}
                <div style={{ position: 'relative', zIndex: 1, height: 130, overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', gap: 6, padding: '0 14px', maskImage: 'linear-gradient(to bottom, transparent, black 35%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 35%)' }}>
                  <div ref={chatEndRef} />
                  {chat.length === 0 && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>Messages from viewers will appear here.</div>}
                  {chat.slice(-40).reverse().map((m) => (
                    <div key={m.id} style={{ display: 'inline-flex', alignSelf: 'flex-start', maxWidth: '92%', fontSize: 13, lineHeight: 1.4, background: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: '5px 11px', wordBreak: 'break-word' }}>
                      <span style={{ color: accent, fontWeight: 700, marginRight: 5 }}>{m.name}</span>
                      <span style={{ color: '#fff' }}>{m.text}</span>
                    </div>
                  ))}
                </div>

                {chatError && <div style={{ position: 'relative', zIndex: 1, padding: '4px 14px 0', color: '#ffb4b4', fontSize: 12, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{chatError}</div>}

                {/* Product pin tray -- directly above the composer, not
                    floating higher up where it could put off the seller's
                    own view of the video (William, 2026-07-20). The "View
                    public page" link that used to sit here was removed
                    entirely -- it served no purpose over the live video
                    itself (William: "it has no purpose on the video at
                    all"). */}
                {streamProducts.length > 0 && (
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8, overflowX: 'auto', padding: '0 14px 8px' }}>
                    {streamProducts.map((p) => {
                      const isPinned = pinnedId === p.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePin(p.id)}
                          style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, textAlign: 'left', padding: '5px 12px 5px 5px', borderRadius: 999, cursor: 'pointer',
                            background: isPinned ? 'rgba(255,107,0,0.25)' : 'rgba(0,0,0,0.55)',
                            border: `1px solid ${isPinned ? accent : 'rgba(255,255,255,0.25)'}`, color: '#fff', fontSize: 12, whiteSpace: 'nowrap',
                          }}
                        >
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a2a2a', flexShrink: 0 }} />
                          )}
                          <span>{isPinned ? `Now showing: ${p.title}` : p.title}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Single-line composer, always visible -- typing here is */}
                {/* the only chat action; nothing to open or dismiss. */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8, padding: '10px 14px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                  <input
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
                    placeholder="Reply to viewers..."
                    // 16px -- below this, iOS Safari zooms the whole page in
                    // on focus, which is what looked like the screen
                    // "expanding" and cutting off the video.
                    style={{ flex: 1, padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 16 }}
                  />
                  <button onClick={sendChat} style={{ background: accent, color: '#111', border: 'none', padding: '10px 18px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 480px) minmax(260px, 340px)', gap: 20, alignItems: 'start' }}>
                <div>
                  <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} />
                  <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <a href={`/live/${activeStream.roomName}`} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: 'underline' }}>
                      View your public live page
                    </a>
                    <button onClick={endStream} style={{ marginLeft: 'auto', background: '#ff3b3b', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 999, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                      End stream
                    </button>
                  </div>

                  {streamProducts.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ color: stageMuted, fontSize: 14, marginBottom: 8 }}>Tap a product to pin it as &quot;Now showing&quot; for viewers</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                        {streamProducts.map((p) => {
                          const isPinned = pinnedId === p.id
                          return (
                            <button
                              key={p.id}
                              onClick={() => togglePin(p.id)}
                              style={{
                                textAlign: 'left', padding: 0, borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                                background: '#0d0d0d', border: `2px solid ${isPinned ? accent : stageBorder}`,
                                boxShadow: isPinned ? '0 0 0 3px rgba(255,107,0,0.18)' : 'none', color: '#fff', fontSize: 13,
                              }}
                            >
                              <div style={{ width: '100%', aspectRatio: '1 / 1', position: 'relative', background: '#161616' }}>
                                {p.images?.[0] ? (
                                  <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#2a2a2a,#141414)' }} />
                                )}
                                {isPinned && (
                                  <span style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: accent, color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>✓</span>
                                )}
                              </div>
                              <div style={{ padding: '8px 10px' }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isPinned ? 700 : 400, fontSize: 12.5 }}>{p.title}</div>
                                <div style={{ color: isPinned ? accent : '#888', fontSize: 11.5, marginTop: 3, fontWeight: 600 }}>{isPinned ? 'Now showing' : 'Tap to pin'}</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ background: '#0d0d0d', border: `1px solid ${stageBorder}`, borderRadius: 12, display: 'flex', flexDirection: 'column', height: 420 }}>
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${stageBorder}`, color: stageMuted, fontSize: 13, fontWeight: 600 }}>Live chat</div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {chat.length === 0 && <div style={{ color: '#555', fontSize: 13 }}>Messages from viewers will appear here.</div>}
                    {chat.map((m) => (
                      <div key={m.id} style={{ fontSize: 13, lineHeight: 1.4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '6px 10px', alignSelf: 'flex-start', maxWidth: '92%' }}>
                        <span style={{ color: accent, fontWeight: 600 }}>{m.name}: </span>
                        <span style={{ color: '#eee' }}>{m.text}</span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  {chatError && <div style={{ color: '#ffb4b4', fontSize: 12, padding: '0 14px 8px' }}>{chatError}</div>}
                  <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: `1px solid ${stageBorder}` }}>
                    <input
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
                      placeholder="Reply to viewers..."
                      style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${stageBorder}`, background: '#111', color: '#fff', fontSize: 13 }}
                    />
                    <button onClick={sendChat} style={{ background: accent, color: '#111', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 340px) 1fr', gap: 20, alignItems: 'start' }}>
            {/* Left column: real camera/mic self-check + a live mockup of what buyers will actually see */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 16, padding: 18 }}>
                <SectionHeading icon="camera" title="Camera & mic check" />
                <div style={{ position: 'relative', width: '100%', aspectRatio: '9 / 12', borderRadius: 12, overflow: 'hidden', background: '#000', marginTop: 12 }}>
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: previewState === 'ready' ? 'block' : 'none' }}
                  />
                  {previewState !== 'ready' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', gap: 12 }}>
                      {previewState === 'starting' ? (
                        <span style={{ color: '#aaa', fontSize: 13 }}>Starting camera...</span>
                      ) : previewState === 'denied' ? (
                        <>
                          <span style={{ color: '#ffb4b4', fontSize: 12.5, lineHeight: 1.5 }}>Camera access blocked. Allow it for velorcommerce.store in your browser's address bar, then retry.</span>
                          <button onClick={() => startPreview()} style={ghostBtnStyle(accent, stageBorder)}>Retry</button>
                        </>
                      ) : previewState === 'error' ? (
                        <>
                          <span style={{ color: '#ffb4b4', fontSize: 12.5 }}>Couldn't reach a camera or mic.</span>
                          <button onClick={() => startPreview()} style={ghostBtnStyle(accent, stageBorder)}>Retry</button>
                        </>
                      ) : (
                        <>
                          <span style={{ width: 46, height: 46, borderRadius: '50%', border: `1.5px solid ${stageBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stageMuted }}>
                            <Icon name="camera" size={20} />
                          </span>
                          <span style={{ color: stageMuted, fontSize: 12.5, lineHeight: 1.5 }}>See yourself before you go live -- this preview isn't visible to buyers.</span>
                          <button onClick={() => startPreview()} style={{ background: accent, color: '#111', border: 'none', padding: '10px 20px', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            Enable camera preview
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {previewState === 'ready' && (
                    <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', color: '#ccc', fontSize: 10.5, fontWeight: 600, padding: '4px 9px', borderRadius: 999, letterSpacing: 0.3 }}>
                      PREVIEW · not visible to buyers
                    </span>
                  )}
                </div>

                {previewState === 'ready' && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <DeviceSelect
                      icon="camera"
                      value={selectedVideoId}
                      devices={videoDevices}
                      fallbackLabel="Camera"
                      border={border}
                      onChange={(id) => { setSelectedVideoId(id); startPreview(id, selectedAudioId) }}
                    />
                    <DeviceSelect
                      icon="mic"
                      value={selectedAudioId}
                      devices={audioDevices}
                      fallbackLabel="Microphone"
                      border={border}
                      onChange={(id) => { setSelectedAudioId(id); startPreview(selectedVideoId, id) }}
                    />
                    {/* Real mic level meter (Web Audio AnalyserNode on the
                        preview stream) -- lets a seller confirm their mic is
                        actually picking up sound before going live, not a
                        decorative animation. */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 2px 0' }}>
                      <span style={{ color: HALO.muted, fontSize: 11 }}>Mic level</span>
                      <div style={{ flex: 1, display: 'flex', gap: 2, height: 14, alignItems: 'flex-end' }}>
                        {Array.from({ length: 20 }).map((_, i) => {
                          const lit = micLevel * 20 > i
                          const hot = i > 15
                          return (
                            <span
                              key={i}
                              style={{
                                flex: 1, borderRadius: 1,
                                height: lit ? `${40 + i * 3}%` : '30%',
                                background: lit ? (hot ? '#ff5a52' : accent) : 'rgba(26,26,29,0.10)',
                                transition: 'height 0.05s linear',
                              }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* How buyers will actually see it -- the same TikTok-style pinned
                  card from the public /live/[room] page, mirrored live from the
                  title/product/offer fields as the seller fills them in. */}
              <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 16, padding: 18 }}>
                <SectionHeading icon="eye" title="How buyers will see it" />
                <div style={{ marginTop: 12, borderRadius: 14, overflow: 'hidden', border: `1px solid ${border}`, background: '#000', position: 'relative', aspectRatio: '9 / 14' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(255,140,60,0.16), transparent 55%), linear-gradient(200deg, #241b12 0%, #100d0a 55%, #000 100%)' }} />
                  <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: accent, color: '#111', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sellerNameRef.current.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{sellerNameRef.current}</span>
                    <span className="velor-live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: accent, marginLeft: 2 }} />
                  </div>
                  {mockPinnedProduct && (
                    <div style={{ position: 'absolute', left: 10, right: 10, bottom: 46, background: 'rgba(20,20,20,0.8)', border: `1px solid ${accent}`, borderRadius: 10, padding: 7, display: 'flex', gap: 7, alignItems: 'center' }}>
                      {mockPinnedProduct.images?.[0] ? (
                        <img src={mockPinnedProduct.images[0]} alt="" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: 'linear-gradient(135deg,#7a5230,#3c2814)', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 8, color: accent, textTransform: 'uppercase', letterSpacing: 0.4 }}>Now showing</div>
                        <div style={{ fontSize: 10.5, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mockPinnedProduct.title}</div>
                        <div style={{ fontSize: 10, fontWeight: 700 }}>
                          {offerEnabled ? (
                            <>
                              <span style={{ color: accent }}>{fmtPrice(mockPinnedProduct.price * (1 - (Number(offerPercent) || 0) / 100))}</span>
                              <span style={{ color: '#999', textDecoration: 'line-through', marginLeft: 4, fontSize: 9 }}>{fmtPrice(mockPinnedProduct.price)}</span>
                            </>
                          ) : (
                            <span style={{ color: accent }}>{fmtPrice(mockPinnedProduct.price)}</span>
                          )}
                        </div>
                      </div>
                      <span style={{ background: accent, color: '#111', borderRadius: 999, padding: '5px 9px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>Buy now</span>
                    </div>
                  )}
                  <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10 }}>
                    <div style={{ color: '#fff', fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {title.trim() || 'Your stream title appears here'}
                    </div>
                  </div>
                </div>
                <p style={{ color: HALO.muted, fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
                  A mockup of your live page -- updates as you fill in the details on the right.
                </p>
              </div>
            </div>

            {/* Right column: the actual form */}
            <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
              <SectionHeading icon="info" title="Stream details" />
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ color: HALO.inkSoft, fontSize: 14 }}>Stream title</label>
                  <span style={{ color: title.length > 70 ? '#B4342C' : HALO.muted, fontSize: 11.5 }}>{title.length}/80</span>
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  placeholder="e.g. New autumn collection - live first look"
                  style={fieldInputStyle(border)}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, color: HALO.inkSoft, fontSize: 14 }}>Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ ...fieldInputStyle(border), resize: 'vertical' }}
                />
              </div>

              <div style={{ marginTop: 24 }}>
                <SectionHeading icon="grid" title={`Feature products (${selectedProductIds.length}/12)`} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginTop: 12, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
                  {products.map((p) => {
                    const checked = selectedProductIds.includes(p.id)
                    const atLimit = !checked && selectedProductIds.length >= 12
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={atLimit}
                        onClick={() =>
                          setSelectedProductIds((prev) =>
                            checked ? prev.filter((id) => id !== p.id) : prev.length >= 12 ? prev : [...prev, p.id]
                          )
                        }
                        style={{
                          position: 'relative', textAlign: 'left', padding: 0, borderRadius: 12, overflow: 'hidden', cursor: atLimit ? 'default' : 'pointer',
                          border: `2px solid ${checked ? accent : border}`, background: '#FFFFFF', opacity: atLimit ? 0.4 : 1,
                          boxShadow: checked ? '0 0 0 3px rgba(255,107,0,0.18)' : 'none', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ width: '100%', aspectRatio: '1 / 1', position: 'relative', background: '#F1EEE7' }}>
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#EDE7DA,#F7F5F1)' }} />
                          )}
                          {checked && (
                            <span style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: accent, color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>✓</span>
                          )}
                          {p.stock <= 0 && (
                            <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#ffb4b4', fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>Sold out</span>
                          )}
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ color: HALO.ink, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                          <div style={{ color: accent, fontSize: 12, fontWeight: 700, marginTop: 2 }}>{fmtPrice(p.price)}</div>
                        </div>
                      </button>
                    )
                  })}
                  {products.length === 0 && (
                    <span style={{ color: HALO.muted, fontSize: 13, gridColumn: '1 / -1' }}>Add products to your store to feature them in a stream.</span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FeatureToggle
                  icon="calendar"
                  title="Schedule for later"
                  description="Buyers who tap Notify me get a push the moment you go live."
                  checked={scheduleEnabled}
                  onChange={setScheduleEnabled}
                  border={border}
                  accent={accent}
                >
                  {scheduleEnabled && (
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: '#FFFFFF', color: HALO.ink, fontSize: 16 }}
                    />
                  )}
                </FeatureToggle>

                <FeatureToggle
                  icon="percent"
                  title="Live-only discount"
                  description="A limited-time price on featured products, live only -- reverts the moment the stream ends."
                  checked={offerEnabled}
                  onChange={setOfferEnabled}
                  border={border}
                  accent={accent}
                >
                  {offerEnabled && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="number"
                        min={5}
                        max={50}
                        value={offerPercent}
                        onChange={(e) => setOfferPercent(e.target.value)}
                        style={{ width: 80, padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: '#FFFFFF', color: HALO.ink, fontSize: 16 }}
                      />
                      <span style={{ color: HALO.inkSoft, fontSize: 13 }}>% off featured products</span>
                    </div>
                  )}
                </FeatureToggle>
              </div>

              <button
                onClick={startStream}
                disabled={connecting}
                style={{ marginTop: 24, width: '100%', background: accent, color: '#111', border: 'none', padding: '15px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15, cursor: connecting ? 'default' : 'pointer', opacity: connecting ? 0.6 : 1 }}
              >
                {connecting ? (scheduleEnabled ? 'Scheduling...' : 'Going live...') : scheduleEnabled ? 'Schedule Stream' : 'Go Live Now'}
              </button>
              <p style={{ color: HALO.muted, fontSize: 12, marginTop: 12, textAlign: 'center' }}>
                Your browser will ask for camera and microphone access when you go live. Buyers check out the same way they always do - nothing changes there.
              </p>
            </div>
          </div>
        )}

        {streams.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontFamily: HALO.fontSerif, fontStyle: 'italic', fontWeight: 500, fontSize: 20, marginBottom: 12, color: HALO.ink }}>Past streams</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {streams.filter((s) => s.status === 'ENDED').slice(0, 10).map((s) => (
                <div key={s.id} style={{ ...glassStyle('lens', { borderRadius: 12, padding: 12 }), display: 'flex', justifyContent: 'space-between', color: HALO.inkSoft, fontSize: 13 }}>
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

// ---------------------------------------------------------------------------
// Shared helpers for the redesigned Go Live setup flow (William, 2026-07-20).
// GBP formatting follows the same convention already established elsewhere
// in this dashboard (app/dashboard/analytics/page.tsx's own fmt()) rather
// than inventing a new one -- GBP is the platform's real base currency
// (lib/currency.ts's own fallback), not a guess.
// ---------------------------------------------------------------------------

function fmtPrice(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

function fieldInputStyle(border: string): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: '#FFFFFF',
    color: HALO.ink,
    // 16px minimum -- anything smaller makes iOS Safari auto-zoom the whole
    // page in on focus, which is what made this screen look like it was
    // "expanding" and cutting off the video/preview when tapped.
    fontSize: 16,
  }
}

function ghostBtnStyle(accent: string, border: string): React.CSSProperties {
  return {
    background: 'transparent',
    color: accent,
    border: `1px solid ${border}`,
    padding: '8px 18px',
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 12.5,
    cursor: 'pointer',
  }
}

type IconName = 'camera' | 'mic' | 'eye' | 'info' | 'grid' | 'calendar' | 'percent'

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'camera':
      return <svg {...common}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" /><circle cx="12" cy="13" r="4" /></svg>
    case 'mic':
      return <svg {...common}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2" /><path d="M12 19v3" /></svg>
    case 'eye':
      return <svg {...common}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></svg>
    case 'info':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
    case 'grid':
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
    case 'calendar':
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    case 'percent':
      return <svg {...common}><path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
    default:
      return null
  }
}

function SectionHeading({ icon, title }: { icon: IconName; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,107,0,0.12)', color: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={14} />
      </span>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: HALO.ink }}>{title}</span>
    </div>
  )
}

function DeviceSelect({
  icon,
  value,
  devices,
  fallbackLabel,
  border,
  onChange,
}: {
  icon: IconName
  value: string
  devices: MediaDeviceInfo[]
  fallbackLabel: string
  border: string
  onChange: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: `1px solid ${border}`, borderRadius: 8, padding: '8px 10px' }}>
      <span style={{ color: HALO.muted, flexShrink: 0 }}><Icon name={icon} size={14} /></span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, background: 'transparent', color: HALO.ink, border: 'none', fontSize: 16, outline: 'none' }}
      >
        {devices.length === 0 && <option value="">{fallbackLabel} unavailable</option>}
        {devices.map((d, i) => (
          <option key={d.deviceId || i} value={d.deviceId} style={{ background: '#FFFFFF' }}>
            {d.label || `${fallbackLabel} ${i + 1}`}
          </option>
        ))}
      </select>
    </div>
  )
}

function FeatureToggle({
  icon,
  title,
  description,
  checked,
  onChange,
  border,
  accent,
  children,
}: {
  icon: IconName
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  border: string
  accent: string
  children?: React.ReactNode
}) {
  return (
    <div style={{ border: `1px solid ${checked ? accent : border}`, borderRadius: 12, padding: 14, background: checked ? 'rgba(255,107,0,0.06)' : 'transparent', transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(26,26,29,0.05)', color: HALO.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <Icon name={icon} size={15} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: HALO.ink, fontSize: 14, fontWeight: 600 }}>{title}</div>
          <div style={{ color: HALO.muted, fontSize: 12, marginTop: 2, lineHeight: 1.4 }}>{description}</div>
        </div>
        {/* Pill switch -- a real checkbox underneath for accessibility/keyboard
            support, visually rendered as the toggle track+thumb. */}
        <label style={{ position: 'relative', width: 40, height: 22, flexShrink: 0, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'pointer' }}
          />
          <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: checked ? accent : '#333', transition: 'background 0.15s' }} />
          <span style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
        </label>
      </div>
      {children}
    </div>
  )
}

function ViewerCountBadge({ count, border, dark }: { count: number; border: string; dark?: boolean }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: dark ? 'rgba(255,255,255,0.08)' : 'transparent', border: dark ? 'none' : `1px solid ${border}`, borderRadius: 999, padding: '4px 10px', color: dark ? '#fff' : HALO.inkSoft, fontSize: 12 }}>
      <Icon name="eye" size={13} />
      {count}
    </span>
  )
}

const CONN_QUALITY_META: Record<ConnectionQuality, { label: string; color: string }> = {
  [ConnectionQuality.Excellent]: { label: 'Excellent connection', color: '#3ddc84' },
  [ConnectionQuality.Good]: { label: 'Good connection', color: '#e8c34a' },
  [ConnectionQuality.Poor]: { label: 'Weak connection', color: '#ff5a52' },
  [ConnectionQuality.Lost]: { label: 'Connection lost', color: '#ff5a52' },
  [ConnectionQuality.Unknown]: { label: 'Checking connection…', color: '#666' },
}

function ConnQualityBadge({ quality, dark }: { quality: ConnectionQuality; dark?: boolean }) {
  const meta = CONN_QUALITY_META[quality] ?? CONN_QUALITY_META[ConnectionQuality.Unknown]
  return (
    <span
      title={meta.label}
      style={{ display: 'flex', alignItems: 'center', gap: 5, background: dark ? 'rgba(255,255,255,0.08)' : 'transparent', border: dark ? 'none' : `1px solid ${HALO.border}`, borderRadius: 999, padding: '4px 10px', color: dark ? '#fff' : HALO.inkSoft, fontSize: 12 }}
    >
      <span style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 10 }}>
        {[4, 7, 10].map((h, i) => (
          <span key={i} style={{ width: 3, height: h, borderRadius: 1, background: i < (quality === 'excellent' ? 3 : quality === 'good' ? 2 : quality === 'poor' || quality === 'lost' ? 1 : 0) ? meta.color : (dark ? '#3a3a3a' : 'rgba(26,26,29,0.15)') }} />
        ))}
      </span>
      {meta.label}
    </span>
  )
}
