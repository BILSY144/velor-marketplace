'use client'

import { useEffect, useRef, useState } from 'react'
import { Room, Track, createLocalTracks } from 'livekit-client'
import type { LocalTrack } from 'livekit-client'

type Product = { id: string; title: string; price: number; stock: number; status: string }
type Stream = {
  id: string
  title: string
  description: string | null
  roomName: string
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
  productIds: string[]
  createdAt: string
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

  async function startStream() {
    setError('')
    if (!title.trim()) { setError('Give your stream a title.'); return }
    setConnecting(true)
    try {
      const res = await fetch('/api/dashboard/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, productIds: selectedProductIds }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not start stream.'); setConnecting(false); return }

      setActiveStream(data.stream)

      const tracks: LocalTrack[] = await createLocalTracks({ audio: true, video: true })
      const room = new Room()
      await room.connect(data.wsUrl, data.token)
      for (const track of tracks) {
        await room.localParticipant.publishTrack(track)
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current)
        }
      }
      roomRef.current = room
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not go live - check camera/mic permissions.'
      setError(msg)
    } finally {
      setConnecting(false)
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

  return (
    <div style={{ minHeight: '100vh', background: dark, color: '#fff', padding: '32px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontSize: 13, letterSpacing: 1, color: accent, marginBottom: 8, textTransform: 'uppercase' }}>Enterprise - Live Shopping</div>
        <h1 style={{ fontSize: 30, marginBottom: 24 }}>Go Live</h1>

        {error && (
          <div style={{ background: '#3a1a1a', border: '1px solid #6b2a2a', color: '#ffb4b4', padding: 14, borderRadius: 10, marginBottom: 20 }}>{error}</div>
        )}

        {activeStream ? (
          <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: accent, display: 'inline-block' }} />
              <strong>LIVE</strong>
              <span style={{ color: '#aaa' }}>{activeStream.title}</span>
            </div>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', maxWidth: 480, borderRadius: 12, background: '#000' }} />
            <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <a href={`/live/${activeStream.roomName}`} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: 'underline' }}>
                View your public live page
              </a>
              <button onClick={endStream} style={{ marginLeft: 'auto', background: '#ff3b3b', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 999, fontWeight: 600, cursor: 'pointer' }}>
                End stream
              </button>
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

            <button
              onClick={startStream}
              disabled={connecting}
              style={{ background: accent, color: '#111', border: 'none', padding: '14px 32px', borderRadius: 999, fontWeight: 700, cursor: connecting ? 'default' : 'pointer', opacity: connecting ? 0.6 : 1 }}
            >
              {connecting ? 'Going live...' : 'Go Live Now'}
            </button>
            <p style={{ color: '#666', fontSize: 12, marginTop: 12 }}>
              Your browser will ask for camera and microphone access. Buyers check out the same way they always do - nothing changes there.
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
