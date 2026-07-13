'use client'

// Velor Pulse design system -- shared by every page under app/pulse/*.
// Built 2026-07-13 as the foundation for the Pulse rebuild: a bento-grid,
// glass-and-gradient dark UI with live sparklines/gauges, replacing the
// original flat stat-list design. Every detail page (traffic, revenue,
// sellers, listings, payouts, support, reviews, agents, live, origins,
// compliance, orders, applications, pipeline) imports from here so the whole
// dashboard reads as one coherent app instead of fifteen one-off pages.
//
// Auth model unchanged from the original Pulse: a single admin token
// (ADMIN_SECRET) is entered once, stored in localStorage under
// 'velor_admin_secret', and sent as an `Authorization: Bearer <token>`
// header on every API call. usePulseAuth + usePulseData below centralise
// that pattern (previously copy-pasted into every page) into two hooks.

import { useCallback, useEffect, useId, useState } from 'react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

export const PULSE = {
  bg: '#0a0a0c',
  bgGradient:
    'radial-gradient(circle at 12% -10%, rgba(255,122,26,0.12), transparent 42%), ' +
    'radial-gradient(circle at 110% 15%, rgba(77,195,255,0.08), transparent 38%), ' +
    'radial-gradient(circle at 50% 120%, rgba(177,139,255,0.06), transparent 45%), ' +
    '#0a0a0c',
  surface: '#141416',
  surface2: '#1b1b1e',
  surfaceRaised: '#1f1f23',
  border: '#26262b',
  borderLight: '#333338',
  text: '#f4f4f5',
  muted: '#93939c',
  mutedDark: '#5c5c64',
  accent: '#ff7a1a',
  accent2: '#ffb027',
  green: '#3ddc84',
  red: '#ff5470',
  blue: '#4dc3ff',
  amber: '#f2c94c',
  purple: '#b18bff',
} as const

export const STATUS_COLOR: Record<string, string> = {
  PENDING: PULSE.muted,
  PAID: PULSE.accent,
  PROCESSING: PULSE.blue,
  SHIPPED: PULSE.blue,
  DELIVERED: PULSE.green,
  CANCELLED: PULSE.red,
  REFUNDED: PULSE.red,
  DISPUTED: PULSE.red,
  APPROVED: PULSE.green,
  REJECTED: PULSE.red,
  OPEN: PULSE.amber,
  RESOLVED: PULSE.green,
  VERIFIED: PULSE.green,
  SUCCESS: PULSE.green,
  FAILED: PULSE.red,
  ERROR: PULSE.red,
}

// ---------------------------------------------------------------------------
// Global styles (pulse-dot animation, spinner, scrollbars, selection)
// ---------------------------------------------------------------------------

export function GlobalPulseStyle() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      @keyframes velor-pulse-dot { 0% { box-shadow: 0 0 0 0 rgba(255,122,26,0.55); } 70% { box-shadow: 0 0 0 8px rgba(255,122,26,0); } 100% { box-shadow: 0 0 0 0 rgba(255,122,26,0); } }
      @keyframes velor-spin { to { transform: rotate(360deg); } }
      @keyframes velor-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .velor-pulse-page ::selection { background: rgba(255,122,26,0.35); }
      .velor-pulse-page input::placeholder { color: ${PULSE.mutedDark}; }
      .velor-pulse-page a { -webkit-tap-highlight-color: transparent; }
      .velor-pulse-card { animation: velor-fade-up 0.25s ease both; }
    `,
      }}
    />
  )
}

export const pulseDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: PULSE.accent,
  animation: 'velor-pulse-dot 2s infinite',
  flex: '0 0 auto',
}

// ---------------------------------------------------------------------------
// Auth + data-fetching hooks
// ---------------------------------------------------------------------------

export function usePulseAuth() {
  const [token, setToken] = useState('')
  const [needsToken, setNeedsToken] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('velor_admin_secret') : null
    if (saved) setToken(saved)
    else setNeedsToken(true)
    setReady(true)
  }, [])

  const unlock = useCallback((value: string) => {
    const v = value.trim()
    if (!v) return
    localStorage.setItem('velor_admin_secret', v)
    setToken(v)
    setNeedsToken(false)
  }, [])

  const lock = useCallback(() => {
    localStorage.removeItem('velor_admin_secret')
    setToken('')
    setNeedsToken(true)
  }, [])

  return { token, needsToken, ready, unlock, lock }
}

export function usePulseData<T>(
  path: string | null,
  token: string,
  opts: { intervalMs?: number; onUnauthorized?: () => void } = {}
) {
  const { intervalMs = 30000, onUnauthorized } = opts
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !path) return
    let active = true
    setLoading(true)
    const load = () => {
      fetch(path, { headers: { Authorization: 'Bearer ' + token } })
        .then((r) => {
          if (r.status === 401) {
            if (active) onUnauthorized?.()
            return null
          }
          if (!r.ok) throw new Error('Request failed')
          return r.json()
        })
        .then((d) => {
          if (!active || !d) return
          setData(d)
          setLoading(false)
          setError('')
        })
        .catch(() => {
          if (active) {
            setError('Could not reach the server. Retrying...')
            setLoading(false)
          }
        })
    }
    load()
    const interval = intervalMs > 0 ? setInterval(load, intervalMs) : null
    return () => {
      active = false
      if (interval) clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, token, intervalMs])

  return { data, loading, error }
}

// ---------------------------------------------------------------------------
// Shell / chrome
// ---------------------------------------------------------------------------

const NAV_ITEMS: { key: string; href: string; label: string; icon: string }[] = [
  { key: 'home', href: '/pulse', label: 'Home', icon: '◈' },
  { key: 'orders', href: '/pulse/orders', label: 'Orders', icon: '▤' },
  { key: 'revenue', href: '/pulse/revenue', label: 'Revenue', icon: '£' },
  { key: 'sellers', href: '/pulse/sellers', label: 'Sellers', icon: '◈' },
  { key: 'applications', href: '/pulse/applications', label: 'Apps', icon: '✎' },
]

export function BottomNav({ active }: { active?: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(10,10,12,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${PULSE.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 4px calc(8px + env(safe-area-inset-bottom))',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.key
        return (
          <Link
            key={item.key}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              textDecoration: 'none',
              color: isActive ? PULSE.accent : PULSE.muted,
              minWidth: 48,
              minHeight: 44,
              justifyContent: 'center',
              padding: '4px 2px',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export function PulseShell({
  children,
  bottomNav = true,
  activeNav,
}: {
  children: React.ReactNode
  bottomNav?: boolean
  activeNav?: string
}) {
  return (
    <div
      className="velor-pulse-page"
      style={{
        minHeight: '100vh',
        background: PULSE.bgGradient,
        color: PULSE.text,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: `18px 16px ${bottomNav ? 88 : 40}px`,
      }}
    >
      <GlobalPulseStyle />
      {children}
      {bottomNav && <BottomNav active={activeNav} />}
    </div>
  )
}

export function PulseHeader({
  title,
  subtitle,
  back = '/pulse',
  live,
  updatedAt,
}: {
  title: string
  subtitle?: string
  back?: string | null
  live?: boolean
  updatedAt?: string | null
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {live && <span style={pulseDotStyle} />}
          <span
            style={{
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: 0.4,
              color: PULSE.accent,
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </span>
        </div>
        {subtitle && <div style={{ fontSize: 12, color: PULSE.muted, marginTop: 3 }}>{subtitle}</div>}
        {updatedAt && (
          <div style={{ fontSize: 10.5, color: PULSE.mutedDark, marginTop: 2 }}>
            Updated {new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      {back && (
        <Link
          href={back}
          style={{
            fontSize: 12.5,
            color: PULSE.muted,
            textDecoration: 'none',
            padding: '7px 12px',
            border: `1px solid ${PULSE.border}`,
            borderRadius: 9,
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          &larr; Back
        </Link>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Charts (hand-rolled SVG -- no chart library dependency)
// ---------------------------------------------------------------------------

export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = PULSE.accent,
  fill = true,
  strokeWidth = 2,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
  strokeWidth?: number
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '')
  if (!data || data.filter((n) => Number.isFinite(n)).length < 2) {
    return <div style={{ width, height }} />
  }
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const pad = 3
  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * (height - pad * 2) - pad
    return [x, y] as const
  })
  const linePath = points.map((p, i) => (i === 0 ? `M${p[0].toFixed(1)},${p[1].toFixed(1)}` : `L${p[0].toFixed(1)},${p[1].toFixed(1)}`)).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const last = points[points.length - 1]
  const gid = `pulse-spark-${rawId}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gid})`} stroke="none" />
        </>
      )}
      <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={color} />
    </svg>
  )
}

export function RadialGauge({
  value,
  max = 100,
  size = 100,
  stroke = 10,
  color = PULSE.accent,
  trackColor = PULSE.border,
  label,
  sublabel,
}: {
  value: number
  max?: number
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  label: string
  sublabel?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = max === 0 ? 0 : Math.max(0, Math.min(1, value / max))
  const dash = circumference * fraction
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.24} fontWeight={800} fill={PULSE.text} fontFamily="'Space Grotesk', sans-serif">
        {label}
      </text>
      {sublabel && (
        <text x="50%" y="66%" textAnchor="middle" fontSize={size * 0.085} fill={PULSE.muted}>
          {sublabel}
        </text>
      )}
    </svg>
  )
}

export function MiniBar({
  label,
  value,
  max,
  color = PULSE.accent,
  formatValue,
}: {
  label: React.ReactNode
  value: number
  max: number
  color?: string
  formatValue?: (v: number) => string
}) {
  const fraction = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: PULSE.muted, marginBottom: 4, gap: 8 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ color: PULSE.text, fontWeight: 600, flex: '0 0 auto' }}>{formatValue ? formatValue(value) : value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: PULSE.border, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: fraction + '%', background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

// A simple horizontal funnel: stages each render as a full-width bar scaled
// to the largest stage, with the conversion % to the next stage annotated.
export function FunnelChart({ stages, color = PULSE.accent }: { stages: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...stages.map((s) => s.value))
  return (
    <div>
      {stages.map((s, i) => {
        const next = stages[i + 1]
        const convRate = next && s.value > 0 ? (next.value / s.value) * 100 : null
        return (
          <div key={s.label} style={{ marginBottom: 14 }}>
            <MiniBar label={s.label} value={s.value} max={max} color={color} />
            {convRate !== null && (
              <div style={{ fontSize: 10.5, color: PULSE.mutedDark, marginTop: -4, marginLeft: 2 }}>
                &darr; {convRate.toFixed(0)}% continue to &ldquo;{next.label}&rdquo;
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export function KpiCard({
  href,
  label,
  value,
  delta,
  deltaGood = true,
  spark,
  sparkColor,
  accent = PULSE.accent,
}: {
  href?: string
  label: string
  value: string | number
  delta?: string | null
  deltaGood?: boolean
  spark?: number[]
  sparkColor?: string
  accent?: string
}) {
  const body = (
    <div
      className="velor-pulse-card"
      style={{
        background: PULSE.surface,
        border: `1px solid ${PULSE.border}`,
        borderRadius: 16,
        padding: '15px 15px 13px',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div style={{ fontSize: 10.5, color: PULSE.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7, fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: PULSE.text, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</div>
        {spark && spark.length > 1 && <Sparkline data={spark} width={58} height={26} color={sparkColor || accent} />}
      </div>
      {delta && <div style={{ fontSize: 11, marginTop: 7, color: deltaGood ? PULSE.green : PULSE.red, fontWeight: 700 }}>{delta}</div>}
    </div>
  )
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {body}
      </Link>
    )
  }
  return body
}

export function SectionCard({
  href,
  title,
  preview,
  value,
  accent = PULSE.accent,
  urgent,
}: {
  href: string
  title: string
  preview?: string
  value?: string | number
  accent?: string
  urgent?: boolean
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        className="velor-pulse-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: PULSE.surface,
          border: `1px solid ${urgent ? PULSE.red + '55' : PULSE.border}`,
          borderRadius: 14,
          padding: '13px 14px',
          marginBottom: 9,
        }}
      >
        <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: accent, flex: '0 0 auto' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 650, color: PULSE.text }}>{title}</div>
          {preview && (
            <div style={{ fontSize: 12, color: PULSE.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>
          )}
        </div>
        {value !== undefined && value !== null && (
          <div style={{ fontSize: 15, fontWeight: 800, color: urgent ? PULSE.red : accent, fontFamily: "'Space Grotesk', sans-serif", flex: '0 0 auto' }}>{value}</div>
        )}
        <div style={{ color: PULSE.mutedDark, fontSize: 20, flex: '0 0 auto', lineHeight: 1 }}>&rsaquo;</div>
      </div>
    </Link>
  )
}

export function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="velor-pulse-card"
      style={{ background: PULSE.surface2, border: `1px solid ${PULSE.border}`, borderRadius: 12, padding: '12px 13px', marginBottom: 9 }}
    >
      {children}
    </div>
  )
}

export function Badge({ children, color = PULSE.accent }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.5,
        color,
        background: color + '1a',
        padding: '3px 8px',
        borderRadius: 999,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge color={STATUS_COLOR[status?.toUpperCase()] || PULSE.muted}>{status}</Badge>
}

// ---------------------------------------------------------------------------
// States (loading / empty / error / token gate)
// ---------------------------------------------------------------------------

export function PulseLoading({ label = 'Loading live data...' }: { label?: string }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: `3px solid ${PULSE.border}`,
          borderTopColor: PULSE.accent,
          animation: 'velor-spin 0.8s linear infinite',
        }}
      />
      <div style={{ color: PULSE.muted, fontSize: 13 }}>{label}</div>
    </div>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12.5, color: PULSE.mutedDark, padding: '10px 2px' }}>{children}</div>
}

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,84,112,0.1)', color: '#ffb0bd', padding: '9px 13px', borderRadius: 10, fontSize: 13, marginBottom: 16, border: '1px solid rgba(255,84,112,0.25)' }}>
      {children}
    </div>
  )
}

export function TokenGate({ onUnlock, label = 'Enter your admin token to unlock the dashboard.' }: { onUnlock: (v: string) => void; label?: string }) {
  return (
    <div style={{ minHeight: '100vh', background: PULSE.bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <GlobalPulseStyle />
      <div style={{ maxWidth: 340, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          <span style={pulseDotStyle} />
          <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: 0.6, color: PULSE.accent, fontFamily: "'Space Grotesk', sans-serif" }}>VELOR PULSE</span>
        </div>
        <p style={{ fontSize: 13, color: PULSE.muted, margin: '16px 0 20px' }}>{label}</p>
        <input
          id="pulse-token-gate-input"
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
          style={{
            width: '100%',
            padding: '13px 14px',
            borderRadius: 10,
            border: `1px solid ${PULSE.border}`,
            background: PULSE.surface,
            color: PULSE.text,
            fontSize: 15,
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
          placeholder="Admin token"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onUnlock((e.target as HTMLInputElement).value)
          }}
        />
        <button
          style={{
            width: '100%',
            padding: '13px 14px',
            borderRadius: 10,
            border: 'none',
            background: `linear-gradient(135deg, ${PULSE.accent}, ${PULSE.accent2})`,
            color: '#160a00',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={() => {
            const el = document.getElementById('pulse-token-gate-input') as HTMLInputElement | null
            if (el) onUnlock(el.value)
          }}
        >
          Unlock
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter bar + pagination (used by every list/detail page)
// ---------------------------------------------------------------------------

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>{children}</div>
}

const controlStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 9,
  border: `1px solid ${PULSE.border}`,
  background: PULSE.surface,
  color: PULSE.text,
  fontSize: 13,
  boxSizing: 'border-box',
}

export function FilterInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...controlStyle, flex: '1 1 160px', ...(props.style || {}) }} />
}

export function FilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...controlStyle, flex: '1 1 130px', ...(props.style || {}) }} />
}

export function FilterButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        padding: '10px 16px',
        borderRadius: 9,
        border: 'none',
        background: `linear-gradient(135deg, ${PULSE.accent}, ${PULSE.accent2})`,
        color: '#160a00',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        ...(props.style || {}),
      }}
    />
  )
}

export function PageNav({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 18 }}>
      <button
        style={{ padding: '9px 15px', borderRadius: 9, border: `1px solid ${PULSE.border}`, background: PULSE.surface, color: PULSE.text, fontSize: 13, cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}
        disabled={page <= 1}
        onClick={() => onPage(Math.max(1, page - 1))}
      >
        Prev
      </button>
      <span style={{ fontSize: 12, color: PULSE.mutedDark }}>
        Page {page} of {totalPages}
      </span>
      <button
        style={{ padding: '9px 15px', borderRadius: 9, border: `1px solid ${PULSE.border}`, background: PULSE.surface, color: PULSE.text, fontSize: 13, cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}
        disabled={page >= totalPages}
        onClick={() => onPage(Math.min(totalPages, page + 1))}
      >
        Next
      </button>
    </div>
  )
}

export function ResultsMeta({ total, noun, page, totalPages }: { total: number; noun: string; page: number; totalPages: number }) {
  return (
    <div style={{ fontSize: 12, color: PULSE.mutedDark, marginBottom: 12 }}>
      {total} {noun}
      {total === 1 ? '' : 's'} &middot; page {page} of {totalPages}
    </div>
  )
}

export function PulseFooter({ note }: { note?: string }) {
  return (
    <div style={{ textAlign: 'center', fontSize: 10.5, color: PULSE.mutedDark, marginTop: 22 }}>
      {note || 'Auto-refreshes every 30 seconds. Private dashboard, not linked from the public site.'}
    </div>
  )
}
