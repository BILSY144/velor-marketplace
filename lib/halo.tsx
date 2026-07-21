'use client'

// ============================================================
// HALO — the seller dashboard design system (2026-07-20).
// Light, orbital, glass. William's directive: "no more block
// looking designs... the best seller dashboard out there."
// Approved from the Halo mockup (wide desktop, website colours).
//
// Palette matches app/globals.css html[data-theme='light'] plus
// the brand accent/amber. The dashboard FORCES light mode (the
// old dashboard forced dark) — see app/dashboard/layout.tsx.
//
// House rules honoured here: inline CSS only (no Tailwind), no
// emojis, Fraunces for headings/figures, Space Grotesk for
// kickers/labels, Inter body.
// ============================================================

import React from 'react'

export const HALO = {
  paper: '#F7F5F1',
  surface: '#FFFFFF',
  ink: '#1A1A1D',
  inkSoft: '#6B6255',
  muted: '#6B6B76',
  border: '#E3DED3',
  accent: '#FF6B00',
  accentSoft: 'rgba(255,107,0,0.12)',
  amber: '#EF9F27',
  green: '#1FA05C',
  red: '#E24B4A',
  proBlue: '#1D5F93',
  fontDisplay: "'Space Grotesk', system-ui, sans-serif",
  fontSerif: "'Fraunces', 'Playfair Display', Georgia, serif",
  fontBody: "'Inter', system-ui, sans-serif",
}

export function formatGBP(n: number, penceAlways = false): string {
  const opts: Intl.NumberFormatOptions = { style: 'currency', currency: 'GBP' }
  if (!penceAlways && Math.abs(n) >= 1000) {
    opts.maximumFractionDigits = 0
    opts.minimumFractionDigits = 0
  }
  return new Intl.NumberFormat('en-GB', opts).format(n)
}

// Injected once by HaloBackdrop. Class names are prefixed halo- to
// stay clear of page-level styles.
const KEYFRAMES = `
@keyframes haloBreathe { from { transform: rotate(0deg) scale(1); } to { transform: rotate(6deg) scale(1.08); } }
@keyframes haloPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,107,0,0.45); } 50% { box-shadow: 0 0 0 6px rgba(255,107,0,0); } }
@keyframes haloSpin { to { transform: rotate(360deg); } }
.halo-hover-lift { transition: transform 0.3s cubic-bezier(.2,.9,.3,1.3); }
.halo-hover-lift:hover { transform: translateY(-4px); }
.halo-sat-hover { transition: transform 0.35s cubic-bezier(.2,.9,.3,1.3); }
.halo-sat-hover:hover { transform: scale(1.06); }
.halo-scroll-x { scrollbar-width: none; }
.halo-scroll-x::-webkit-scrollbar { display: none; }
`

const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.42 0 0 0 0 0.38 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")"

// The luminous backdrop behind every dashboard page: warm brand
// aurora over the site's light paper, with a film-grain veil.
export function HaloBackdrop() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: '-20%', zIndex: 0, pointerEvents: 'none',
          // In the approved preview the aurora only ever showed as a
          // background PEEK behind the Overview's dense hub/satellites.
          // Applied sitewide (every dashboard page, via the shared shell)
          // it was fully exposed on lighter pages -- Products, with one
          // row of content, showed the raw overlapping blobs across the
          // whole empty lower page, and two semi-transparent layers
          // (orange + amber) stacked over the near-white paper read as a
          // washed pink rather than the intended warm orange (William,
          // 2026-07-21: "the whole dashboard needs the preview colours
          // not the pink it is now"). Fix: orange stays dominant over
          // amber (amber trends pink faster when double-stacked), overall
          // strength is lower, and a mask fades the whole thing out by
          // ~60% down the VIEWPORT (this div is position:fixed, so that's
          // an absolute fade line, not tied to page scroll length) --
          // concentrated near the top chrome exactly like the approved
          // preview, clean paper underneath on any page.
          background: [
            'radial-gradient(36% 32% at 20% 22%, rgba(255,107,0,0.16), transparent 68%)',
            'radial-gradient(28% 28% at 80% 18%, rgba(239,159,39,0.12), transparent 68%)',
            'radial-gradient(32% 30% at 70% 60%, rgba(255,107,0,0.10), transparent 68%)',
            'radial-gradient(26% 24% at 22% 64%, rgba(239,159,39,0.08), transparent 68%)',
          ].join(', '),
          filter: 'blur(50px)',
          animation: 'haloBreathe 18s ease-in-out infinite alternate',
          maskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 65%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 65%)',
        }}
      />
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.35, pointerEvents: 'none', backgroundImage: GRAIN_URI }} />
    </>
  )
}

// Frosted glass base. shape='capsule' for pill strips, 'lens' for
// rounded panels, 'disc' for circles.
export function glassStyle(shape: 'capsule' | 'lens' | 'disc' = 'lens', extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.62)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    border: '1px solid rgba(255,255,255,0.95)',
    borderRadius: shape === 'capsule' ? 999 : shape === 'disc' ? '50%' : 34,
    boxShadow: '0 18px 44px rgba(90,60,20,0.14), inset 0 1px 0 rgba(255,255,255,1)',
    ...extra,
  }
}

export function HaloPlanPills({ tier, founding }: { tier: string; founding?: boolean }) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
    fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '5px 12px', fontFamily: HALO.fontDisplay, whiteSpace: 'nowrap',
  }
  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      {founding && (
        <span style={{ ...base, color: '#7A5A14', background: 'linear-gradient(120deg, #F6E3B4, #EFD189)', border: '1px solid #DDB95E', boxShadow: '0 2px 10px rgba(201,150,46,0.3)' }}>
          Founding No.001
        </span>
      )}
      {tier === 'PRO' && (
        <span style={{ ...base, color: HALO.proBlue, background: 'linear-gradient(120deg, #D9ECFF, #C4E1FC)', border: '1px solid #9CC8EF' }}>
          Pro
        </span>
      )}
      {tier === 'STARTER' && (
        <span style={{ ...base, color: HALO.muted, background: 'rgba(107,107,118,0.08)', border: '1px solid rgba(107,107,118,0.3)' }}>
          Starter
        </span>
      )}
    </span>
  )
}

export function HaloButton({
  children, variant = 'ink', onClick, href, style,
}: {
  children: React.ReactNode
  variant?: 'accent' | 'ink' | 'soft'
  onClick?: () => void
  href?: string
  style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    border: 'none', cursor: 'pointer', borderRadius: 999, padding: '11px 20px',
    fontFamily: HALO.fontDisplay, fontWeight: 800, fontSize: 13, letterSpacing: '0.03em',
    textDecoration: 'none', transition: 'transform 0.25s',
    ...(variant === 'accent' && {
      background: 'linear-gradient(120deg, #FF8A2B, #FF6B00)', color: '#FFF4E8',
      boxShadow: '0 10px 26px rgba(255,107,0,0.4)',
    }),
    ...(variant === 'ink' && {
      background: HALO.ink, color: '#FFF4E8', boxShadow: '0 8px 20px rgba(26,26,29,0.28)',
    }),
    ...(variant === 'soft' && {
      background: 'rgba(255,255,255,0.7)', color: HALO.ink, border: '1px solid rgba(26,26,29,0.14)', fontWeight: 700,
    }),
    ...style,
  }
  if (href) {
    return <a className="halo-hover-lift" href={href} style={base}>{children}</a>
  }
  return <button className="halo-hover-lift" onClick={onClick} style={base}>{children}</button>
}

// A circular stat satellite. Size lg 152, md 126, sm 106.
export function Satellite({
  label, value, sub, valueColor, tint, size = 'lg', actionLabel, actionHref, style,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  valueColor?: string
  tint?: string
  size?: 'lg' | 'md' | 'sm'
  actionLabel?: string
  actionHref?: string
  style?: React.CSSProperties
}) {
  const px = size === 'lg' ? 152 : size === 'md' ? 126 : 106
  return (
    <div
      className="halo-sat-hover"
      style={{
        ...glassStyle('disc'),
        width: px, height: px, position: 'relative', zIndex: 5,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 14, ...style,
      }}
    >
      {tint && (
        <div aria-hidden style={{ position: 'absolute', inset: -14, borderRadius: '50%', zIndex: -1, filter: 'blur(18px)', opacity: 0.75, background: tint }} />
      )}
      <div style={{ fontFamily: HALO.fontDisplay, fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: HALO.muted }}>
        {label}
      </div>
      <div style={{ fontFamily: HALO.fontSerif, fontWeight: 600, fontSize: size === 'sm' ? 21 : 25, marginTop: 3, letterSpacing: '-0.02em', color: valueColor || HALO.ink }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 9.5, color: HALO.muted, marginTop: 2, fontWeight: 600, lineHeight: 1.3 }}>{sub}</div>
      )}
      {actionLabel && actionHref && (
        <a href={actionHref} style={{ marginTop: 5, fontFamily: HALO.fontDisplay, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: HALO.accent, textDecoration: 'none' }}>
          {actionLabel}
        </a>
      )}
    </div>
  )
}

// Section heading in the Halo voice: italic Fraunces with an
// optional uppercase action link on the right.
export function BeltLabel({ title, actionLabel, actionHref }: { title: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 20px 14px' }}>
      <h2 style={{ fontFamily: HALO.fontSerif, fontStyle: 'italic', fontWeight: 500, fontSize: 21, color: HALO.ink, margin: 0 }}>{title}</h2>
      {actionLabel && actionHref && (
        <a href={actionHref} style={{ fontSize: 11, fontWeight: 800, color: HALO.accent, fontFamily: HALO.fontDisplay, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
          {actionLabel}
        </a>
      )}
    </div>
  )
}
