'use client'

import { useCallback, useEffect, useState } from 'react'

// Seller drop manager: put up to three live listings into the next
// weekly "Fresh from the Workshop" drop. Reached at /dashboard/drops.

interface DropInfo { id: string; title: string; scheduledAt: string; live: boolean }
interface Item { id?: string; productId?: string; title: string; image: string | null; id2?: string }

export default function DashboardDropsPage() {
  const [drop, setDrop] = useState<DropInfo | null>(null)
  const [mine, setMine] = useState<{ productId: string; title: string; image: string | null }[]>([])
  const [products, setProducts] = useState<{ id: string; title: string; image: string | null }[]>([])
  const [maxItems, setMaxItems] = useState(3)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const r = await fetch('/api/dashboard/drops')
    if (!r.ok) return
    const j = await r.json()
    setDrop(j.drop); setMine(j.mine); setProducts(j.products); setMaxItems(j.maxItems)
  }, [])
  useEffect(() => { load() }, [load])

  async function change(method: string, productId: string) {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/dashboard/drops', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) })
      const j = await r.json()
      if (!r.ok) setErr(j.error || 'Something went wrong')
      await load()
    } finally { setBusy(false) }
  }

  const inDrop = new Set(mine.map(m => m.productId))
  const when = drop ? new Date(drop.scheduledAt).toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : ''

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontSize: 22, margin: '0 0 4px 0', fontFamily: 'var(--font-display)' }}>The weekly drop</h1>
      <p style={{ margin: '0 0 18px 0', fontSize: 14, color: 'var(--muted)' }}>
        {drop ? (drop.live ? 'The drop is LIVE right now.' : 'Next drop: ' + when + '.') : 'Loading...'} Add up to {maxItems} of your live listings -- every drop is a guaranteed audience.
      </p>
      {err && <p style={{ color: 'var(--red, #ef4444)', fontSize: 13 }}>{err}</p>}

      <h2 style={{ fontSize: 15, margin: '18px 0 8px 0' }}>In this drop ({mine.length}/{maxItems})</h2>
      {mine.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Nothing yet -- pick from your listings below.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {mine.map(m => (
          <div key={m.productId} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
            {m.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.image} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8 }} />
            )}
            <div style={{ fontSize: 13, fontWeight: 600, margin: '8px 0' }}>{m.title}</div>
            <button disabled={busy} onClick={() => change('DELETE', m.productId)}
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>Remove</button>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 15, margin: '24px 0 8px 0' }}>Your live listings</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {products.filter(p => !inDrop.has(p.id)).map(p => (
          <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8 }} />
            )}
            <div style={{ fontSize: 13, fontWeight: 600, margin: '8px 0' }}>{p.title}</div>
            <button disabled={busy || mine.length >= maxItems} onClick={() => change('POST', p.id)}
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 999, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: mine.length >= maxItems ? 0.5 : 1 }}>Add to drop</button>
          </div>
        ))}
      </div>
    </div>
  )
}
