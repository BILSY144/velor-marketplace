'use client'

import { useEffect, useState } from 'react'

export type SellerTier = 'STARTER' | 'PRO' | 'ENTERPRISE'

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

// Single source of truth for how Starter / Pro / Enterprise dashboard pages
// look. Starter stays exactly as the original plain design. Pro layers in a
// blue accent treatment. Enterprise layers in a gold "premium" treatment.
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
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    label: 'Enterprise',
    badgeColor: '#FFD54A',
    badgeBg: 'rgba(255,213,74,0.14)',
    badgeBorder: 'rgba(255,213,74,0.55)',
    cardBorder: 'rgba(255,213,74,0.32)',
    cardBg: 'linear-gradient(180deg, rgba(255,180,60,0.08), var(--surface) 55%)',
    cardGlow: '0 10px 34px rgba(255,180,60,0.14)',
    headingAccent: '#FFD54A',
    sectionGradient: 'linear-gradient(135deg, rgba(255,180,60,0.15), transparent 60%)',
    statValueColor: '#FFD54A',
    chartLine: '#FFD54A',
    rowHoverBg: 'rgba(255,213,74,0.05)',
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
        if (!cancelled && d?.tier && DASHBOARD_TIER_THEME[d.tier as SellerTier]) {
          setTier(d.tier as SellerTier)
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

// Small reusable "Pro" / "Enterprise" plan pill for page headers. Starter
// renders nothing — Starter is the baseline, unbadged experience.
export function PlanBadge({ tier }: { tier: SellerTier }) {
  if (tier === 'STARTER') return null
  const t = DASHBOARD_TIER_THEME[tier]
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
      {tier === 'ENTERPRISE' ? '★ ' : ''}
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
