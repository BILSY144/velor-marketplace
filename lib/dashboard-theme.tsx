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

// Single source of truth for how Starter / Pro dashboard pages look. Starter
// stays exactly as the original plain design. Pro layers in a blue accent
// treatment. (Enterprise used to layer in a separate gold "premium"
// treatment here; it was retired 2026-07-15 and folded into Pro.)
// Import this everywhere instead of re-deriving colours per page.
export const DASHBOARD_TIER_THEME: Record<SellerTier, TierTheme> = {
  STARTER: {
    tier: 'STARTER',
    label: 'Starter',
    badgeColor: '#999999',
    badgeBg: 'rgba(153,153,153,0.12)',
    badgeBorder: 'rgba(153,153,153,0.35)',
    cardBorder: 'var(--border)',
    cardBg: 'var(--surface)',
    cardGlow: 'none',
    headingAccent: 'var(--text)',
    sectionGradient: 'none',
    statValueColor: 'var(--text)',
    chartLine: '#FF6B00',
    rowHoverBg: 'transparent',
  },
  PRO: {
    tier: 'PRO',
    label: 'Pro',
    badgeColor: '#4FC3F7',
    badgeBg: 'rgba(79,195,247,0.12)',
    badgeBorder: 'rgba(79,195,247,0.45)',
    cardBorder: 'rgba(79,195,247,0.25)',
    cardBg: 'linear-gradient(180deg, rgba(79,195,247,0.05), var(--surface) 55%)',
    cardGlow: '0 8px 28px rgba(79,195,247,0.08)',
    headingAccent: '#4FC3F7',
    sectionGradient: 'linear-gradient(135deg, rgba(79,195,247,0.09), transparent 60%)',
    statValueColor: '#4FC3F7',
    chartLine: '#4FC3F7',
    rowHoverBg: 'rgba(79,195,247,0.04)',
  },
}

// Fetches the seller's tier once (from the existing /api/seller/me route)
// and hands back the matching theme tokens. Every dashboard page can call
// this single hook instead of duplicating fetch + tier-mapping logic.
export function useSellerTier(): { tier: SellerTier; theme: TierTheme; loading: boolean } {
  const [tier, setTier] = useState<SellerTier>('STARTER')
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
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { tier, theme: DASHBOARD_TIER_THEME[tier], loading }
}

// Small reusable "Pro" plan pill for page headers. Starter renders nothing
// — Starter is the baseline, unbadged experience. Accepts any string (not
// just SellerTier) so callers passing a raw, not-yet-normalized tier value
// (e.g. a legacy 'ENTERPRISE' row) still render correctly instead of
// crashing on a missing theme-table key.
export function PlanBadge({ tier }: { tier: string }) {
  const normalized = normalizeSellerTier(tier)
  if (normalized === 'STARTER') return null
  const t = DASHBOARD_TIER_THEME[normalized]
  return (
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
}

// A card wrapper that automatically picks up the right border/background/glow
// for the seller's tier. Starter renders an identical card to the original
// design (no visual change at all).
export function tierCardStyle(theme: TierTheme, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: 12,
    boxShadow: theme.cardGlow,
    ...extra,
  }
}
