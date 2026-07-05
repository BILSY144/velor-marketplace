'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type StreamCard = {
  id: string
  title: string
  roomName: string
  status: string
  sellerName: string
  currency: string
  products: { id: string; title: string; price: number; images: string[] }[]
}

export default function LiveHubPage() {
  const [streams, setStreams] = useState<StreamCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/live')
        const data = await res.json()
        if (active && res.ok) setStreams(data.streams || [])
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 15000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  const dark = '#111111'
  const panel = '#1A1A1A'
  const border = '#2A2A2A'
  const accent = '#FF6B00'

  return (
    <div style={{ minHeight: '100vh', background: dark, color: '#fff', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 13, letterSpacing: 1, color: accent, marginBottom: 8, textTransform: 'uppercase' }}>Velor Live</div>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Live Shopping</h1>
        <p style={{ color: '#aaa', marginBottom: 32 }}>Watch Velor&apos;s Enterprise sellers sell live, from anywhere in the world.</p>

        {loading ? (
          <p style={{ color: '#666' }}>Loading streams...</p>
        ) : streams.length === 0 ? (
          <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 16, padding: 48, textAlign: 'center', color: '#aaa' }}>
            No one is live right now. Check back soon.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {streams.map((s) => (
              <Link key={s.id} href={`/live/${s.roomName}`} style={{ textDecoration: 'none', color: '#fff' }}>
                <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '16/9', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {s.status === 'LIVE' && (
                      <span style={{ position: 'absolute', top: 10, left: 10, background: '#ff3b3b', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>LIVE</span>
                    )}
                    {s.products[0]?.images?.[0] ? (
                      <img src={s.products[0].images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                    ) : (
                      <span style={{ color: '#555' }}>Live Shopping</span>
                    )}
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 13, color: accent, marginBottom: 4 }}>{s.sellerName}</div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{s.status === 'LIVE' ? 'Watching now' : 'Starting soon'}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
