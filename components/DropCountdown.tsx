'use client'

import { useEffect, useState } from 'react'

// Countdown to the weekly drop. Unlike the deleted /sell launch countdown
// (a one-off date), this counts to a real recurring event.

export default function DropCountdown({ scheduledAt, liveHours }: { scheduledAt: string; liveHours: number }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (now === null) return <div style={{ minHeight: 64 }} />
  const start = new Date(scheduledAt).getTime()
  const end = start + liveHours * 3600 * 1000
  if (now >= start && now < end) {
    const hLeft = Math.max(0, Math.floor((end - now) / 3600000))
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: 'var(--green, #22c55e)' }} />
        <span style={{ fontWeight: 700, fontSize: 18 }}>The drop is LIVE</span>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>ends in about {hLeft}h</span>
      </div>
    )
  }
  const ms = Math.max(0, start - now)
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const box = (v: number, l: string) => (
    <div key={l} style={{ textAlign: 'center', minWidth: 58, padding: '10px 8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{v}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
    </div>
  )
  return <div style={{ display: 'flex', gap: 8 }}>{box(d, 'Days')}{box(h, 'Hours')}{box(m, 'Mins')}{box(s, 'Secs')}</div>
}
