// Shared formatting helpers for Velor Pulse (the private mobile ops
// dashboard, app/pulse/*). Plain functions, no React -- kept separate from
// components/pulse/PulseKit.tsx so both server-safe utility code and client
// components can import from here without dragging 'use client' in.

export function formatMoney(amount: number, currency = 'GBP'): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency.toUpperCase() }).format(amount)
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`
  }
}

// Compact form for KPI tiles where space is tight: 1234 -> "1.2k", 1560000 -> "1.6M".
export function compactNumber(n: number): string {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + 'M'
  if (abs >= 1_000) return sign + (abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1) + 'k'
  return String(n)
}

export function pct(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(decimals) + '%'
}

// "3m ago" / "2h ago" / "5d ago" / "3w ago" -- relative to now at call time.
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// "3.4h" or "2d 5h" -- used for SLA/wait-time displays (applications, tickets).
export function fmtSpan(hrs: number): string {
  if (hrs < 24) return hrs.toFixed(1) + 'h'
  return Math.floor(hrs / 24) + 'd ' + Math.round(hrs % 24) + 'h'
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

// Percentage change from `prev` to `current`, formatted with a sign, e.g.
// "+12.4%" or "-3.1%". Returns null when prev is 0 (undefined growth rate).
export function deltaPct(current: number, prev: number): { text: string; good: boolean } | null {
  if (!prev) return null
  const change = ((current - prev) / prev) * 100
  const sign = change >= 0 ? '+' : ''
  return { text: `${sign}${change.toFixed(1)}%`, good: change >= 0 }
}
