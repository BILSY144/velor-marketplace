'use client'

import { useEffect, useState } from 'react'

// The countdown theatre for /drops -- large golden numerals, a living
// moment rather than boxes (standing design directive, 2026-07-29).

export default function DropStage({ scheduledAt, liveHours }: { scheduledAt: string; liveHours: number }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (now === null) return <div style={{ minHeight: 92 }} />
  const start = new Date(scheduledAt).getTime()
  const end = start + liveHours * 3600 * 1000
  const gold = "var(--gold, #D4AF37)"
  if (now >= start && now < end) {
    const hLeft = Math.max(0, Math.floor((end - now) / 3600000))
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <span className="vd-pulse" style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 999, background: gold }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: gold, letterSpacing: '0.02em' }}>THE DOORS ARE OPEN</span>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>about {hLeft}h left in this drop</span>
      </div>
    )
  }
  const ms = Math.max(0, start - now)
  const d = Math.floor(ms / 86400000)
  const hh = Math.floor((ms % 86400000) / 3600000)
  const mm = Math.floor((ms % 3600000) / 60000)
  const ss = Math.floor((ms % 60000) / 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  const unit = (v: string, l: string) => (
    <span key={l} style={{ textAlign: 'center' }}>
      <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 54, fontWeight: 800, color: 'var(--gold, #D4AF37)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
      <span style={{ display: 'block', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 6 }}>{l}</span>
    </span>
  )
  const sep = (k: string) => <span key={k} style={{ fontSize: 40, color: 'var(--muted)', lineHeight: 1, paddingBottom: 18 }}>:</span>
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
      {unit(String(d), 'days')}{sep('a')}{unit(pad(hh), 'hours')}{sep('b')}{unit(pad(mm), 'minutes')}{sep('c')}{unit(pad(ss), 'seconds')}
    </div>
  )
}
