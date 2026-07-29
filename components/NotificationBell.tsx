'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

// Web notification bell (Velor Social plan section 7: table + badge, 60s
// polling -- no websockets needed at this scale). Renders nothing for
// signed-out visitors.

interface Item { id: string; type: string; title: string; body: string | null; href: string | null; readAt: string | null; createdAt: string }

export default function NotificationBell() {
  const { status } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    let alive = true
    const load = async () => {
      try {
        const r = await fetch('/api/notifications')
        if (!r.ok) return
        const j = await r.json()
        if (alive) { setItems(j.items || []); setUnread(j.unread || 0) }
      } catch { /* polling -- silent */ }
    }
    load()
    const id = setInterval(load, 60000)
    return () => { alive = false; clearInterval(id) }
  }, [status])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (open && boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (status !== 'authenticated') return null

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      try { await fetch('/api/notifications', { method: 'POST' }); setUnread(0) } catch { /* silent */ }
    }
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <button onClick={toggle} title="Notifications" aria-label="Notifications"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', position: 'relative', padding: 0, fontSize: 17, lineHeight: 1 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16, borderRadius: 999, background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 320, maxHeight: 420, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.25)', zIndex: 200 }}>
          <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Notifications</div>
          {items.length === 0 && (
            <p style={{ margin: 0, padding: '18px 14px', fontSize: 13, color: 'var(--muted)' }}>Nothing yet. Follow makers and their new work lands here.</p>
          )}
          {items.map(n => (
            <Link key={n.id} href={n.href || '/workshop'} onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '10px 14px', textDecoration: 'none', color: 'var(--text)', borderBottom: '1px solid var(--border)', background: n.readAt ? 'transparent' : 'rgba(255,107,0,0.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{n.title}</div>
              {n.body && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
