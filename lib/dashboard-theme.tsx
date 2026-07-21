'use client'

import { useEffect, useState } from 'react'
import { normalizeSellerTier } from '@/lib/tier'

// Enterprise was retired 2026-07-15. The type intentionally only has two
// members now — every API route normalizes any legacy 'ENTERPRISE' seller
// row to 'PRO' (see lib/tier.ts) before it ever reaches this file, so a
// three-value type here would just invite dead branches again.
export type SellerTier = 'STARTER' | 'PRO'

export interface TierTheme {
  tier: SellerTier
  label: string
  badgeColor: string
  badgeBg: string
  badgeBorder: string
  cardBorder: string
  cardBg: string
  cardGlow: string
  headingAccent: string
  sectionGradient: string
  statValueColor: string
  chartLine: string
  rowHoverBg: string
}

// Single source of truth for how Starter / Pro dashboard pages look. Both
// tiers now render on the Halo glass base (2026-07-21 -- see tierCardStyle
// below); Pro layers in a blue accent treatment on top of that same glass.
// (Enterprise used to layer in a separate gold "premium" treatment here; it
// was retired 2026-07-15 and folded into Pro.)
// Import this everywhere instead of re-deriving colours per page.
export const DASHBOARD_TIER_THEME: Record<SellerTier, TierTheme> = {
  STARTER: {
    tier: 'STARTER',
    label: 'Starter',
    badgeColor: '#999999',
    badgeBg: 'rgba(153,153,153,0.12)',
    badgeBorder: 'rgba(153,153,153,0.35)',
    cardBorder: 'var(--border)',
    cardBg: 'rgba(255,255,255,0.62)',
    cardGlow: '0 14px 34px rgba(90,60,20,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
    headingAccent: 'var(--text)',
    sectionGradient: 'none',
    statValueColor: 'var(--text)',
    chartLine: '#FF6B00',
    rowHoverBg: 'rgba(255,255,255,0.35)',
  },
  PRO: {
    tier: 'PRO',
    label: 'Pro',
    badgeColor: '#4FC3F7',
    badgeBg: 'rgba(79,195,247,0.12)',
    badgeBorder: 'rgba(79,195,247,0.45)',
    cardBorder: 'rgba(79,195,247,0.25)',
    cardBg: 'linear-gradient(160deg, rgba(157,209,255,0.24), rgba(255,255,255,0.62) 55%)',
    cardGlow: '0 18px 40px rgba(29,95,147,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
    headingAccent: '#1D5F93',
    sectionGradient: 'linear-gradient(135deg, rgba(79,195,247,0.09), transparent 60%)',
    statValueColor: '#1D5F93',
    chartLine: '#4FC3F7',
    rowHoverBg: 'rgba(79,195,247,0.06)',
  },
}

// Fetches the seller's tier once (from the existing /api/seller/me route)
// and hands back the matching theme tokens. Every dashboard page can call
// this single hook instead of duplicating fetch + tier-mapping logic.
export function useSellerTier(): { tier: SellerTier; theme: TierTheme; founding: boolean; loading: boolean } {
  const [tier, setTier] = useState<SellerTier>('STARTER')
  const [founding, setFounding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/seller/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // /api/seller/me already normalizes ENTERPRISE -> PRO server-side;
        // normalize again here defensively so this hook can never end up
        // trying to look up a theme key that doesn't exist.
        if (!cancelled && d?.tier) {
          setTier(normalizeSellerTier(d.tier) as SellerTier)
        }
        // Founding badge (lib/founding.ts) -- drives the gold FoundingChip
        // beside the plan pill. Absent field (older cached responses) reads
        // as false, never undefined.
        if (!cancelled) setFounding(Boolean(d?.foundingBadge))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { tier, theme: DASHBOARD_TIER_THEME[tier], founding, loading }
}

// Small reusable "Pro" plan pill for page headers. Starter renders nothing
// -- Starter is the baseline, unbadged experience. Accepts any string (not
// just SellerTier) so callers passing a raw, not-yet-normalized tier value
// (e.g. a legacy 'ENTERPRISE' row) still render correctly instead of
// crashing on a missing theme-table key. Pass founding (from useSellerTier)
// to render the gold Founding Seller hallmark chip beside the pill -- the
// honour renders ALONGSIDE the plan, never instead of it.
export function PlanBadge({ tier, founding }: { tier: string; founding?: boolean }) {
  const normalized = normalizeSellerTier(tier)
  const t = DASHBOARD_TIER_THEME[normalized]
  const pill = normalized === 'STARTER' ? null : (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: t.badgeColor,
        background: t.badgeBg,
        border: `1px solid ${t.badgeBorder}`,
        whiteSpace: 'nowrap',
      }}
    >
      {t.label}
    </span>
  )
  if (!founding) return pill
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {pill}
      <FoundingChip />
    </span>
  )
}

// The compact Founding Seller hallmark -- gold, deliberately distinct from
// the everyday orange accent and the blue Pro pill, because it is an honour
// rather than a plan. The full Hallmark seal (laurel ring, country arc,
// No. 001) belongs on the public storefront profile; this chip is the
// dashboard / card-sized form of the same mark.
export function FoundingChip() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 11px 4px 7px',
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#8A6116',
        background: '#FBF1DC',
        border: '1px solid rgba(185,138,47,0.55)',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r="6" fill="none" stroke="#8A6116" strokeWidth="1.3" />
        <text x="7" y="9.6" textAnchor="middle" fontSize="7" fontWeight="800" fill="#8A6116">1</text>
      </svg>
      Founding Seller
    </span>
  )
}

// A card wrapper that automatically picks up the right border for the
// seller's tier. 2026-07-21 (second pass): moved from the Halo glass base
// onto the SELLER STUDIO card (William-approved Shopify-style: solid white,
// crisp border, subtle shadow, radius 12 -- see lib/studio.tsx). Tier
// distinction survives as Pro's soft blue border. Every page that imports
// this picks the new look up automatically, no per-page changes required.
export function tierCardStyle(theme: TierTheme, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: '#FFFFFF',
    border: `1px solid ${theme.tier === 'PRO' ? 'rgba(29,95,147,0.28)' : '#E3E3E6'}`,
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(26,26,29,0.04)',
    ...extra,
  }
}
