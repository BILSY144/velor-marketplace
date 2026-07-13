'use client'
import { addToCart as addToSharedCart } from '@/lib/cart'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Room, RoomEvent, Track } from 'livekit-client'
import type { RemoteTrack } from 'livekit-client'

type ProductInfo = { id: string; title: string; price: number; images: string[]; stock: number }
type StreamInfo = {
  id: string
  title: string
  description: string | null
  status: string
  seller: { id: string; storeName: string; currency: string }
}

export default function LiveViewerPage() {
  const params = useParams<{ room: string }>()
  const room = params.room as string
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const roomRef = useRef<Room | null>(null)
  const [stream, setStream] = useState<StreamInfo | null>(null)
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [status, setStatus] = useState<'loading' | 'connecting' | 'connected' | 'ended' | 'notfound' | 'error'>('loading')
  const [reported, setReported] = useState(false)
  const [addedId, setAddedId] = useState<string | null>(null)

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
  }, [room])

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

  async function reportStream() {
    if (reported) return
    setReported(true)
    // Reporting now requires a signed-in session (see the route) -- reset
    // the button rather than showing a false "Reported - thank you" if the
    // request actually failed (not signed in, network error, etc.).
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

  if (status === 'notfound') {
    return <div style={{ minHeight: '60vh', background: dark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Stream not found.</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: dark, color: '#fff', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)', gap: 24 }}>
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
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: accent, marginBottom: 4 }}>{stream?.seller?.storeName}</div>
            <h1 style={{ fontSize: 22, marginBottom: 8 }}>{stream?.title}</h1>
            {stream?.description && <p style={{ color: '#aaa', lineHeight: 1.6 }}>{stream.description}</p>}
            <button onClick={reportStream} style={{ marginTop: 16, background: 'transparent', border: `1px solid ${border}`, color: '#888', fontSize: 12, padding: '6px 14px', borderRadius: 999, cursor: reported ? 'default' : 'pointer' }}>
              {reported ? 'Reported - thank you' : 'Report this stream'}
            </button>
          </div>
        </div>
        <div>
          <h2 style={{ fontSize: 15, color: '#ccc', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Featured products</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {products.map((p) => (
              <div key={p.id} style={{ background: panel, border: `1px solid ${border}`, borderRadius: 12, padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                {p.images[0] && <img src={p.images[0]} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: accent, fontWeight: 600 }}>{stream?.seller?.currency === 'GBP' ? '£' : (stream?.seller?.currency || '') + ' '}{p.price.toFixed(2)}</div>
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
            {products.length === 0 && <p style={{ color: '#666', fontSize: 13 }}>No products pinned yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
