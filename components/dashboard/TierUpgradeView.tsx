'use client'

// 2026-07-31 (William's decision, via Claude session): the old two-tile
// "Starter vs Pro" plan picker is RETIRED along with the self-serve Pro
// purchase (see app/api/seller/subscription/route.ts). Velor now runs a
// single flat 10% commission for every seller -- there is nothing left to
// shop for, so this is now a plain status view, not a storefront.
//
// Two distinct things can both be true of a seller and must not be
// conflated (see lib/founding.ts):
//   - commissionRate < 10 (tier === 'PRO'): the ORIGINAL founding-perk
//     bundle (4% + unlimited listings + AI account manager + full API
//     access + custom storefront + priority placement). Frozen 2026-07-31 --
//     exactly one seller still has this, grandfathered, never purchasable.
//   - foundingBadge === true with commissionRate === 10: the REVISED,
//     ongoing founding programme for anyone first-from-their-country going
//     forward -- badge + priority search placement ONLY, no commission
//     change. This is the common case from here on.
// A seller can have either, both (the grandfathered one), or neither.
//
// Kept as the default export of this same file (rather than renamed) so the
// three /dashboard/upgrade* pages didn't need new imports.

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SubscriptionStatus {
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE' // ENTERPRISE only ever appears as a legacy status value
  commissionRate: number
  monthlyFee: number | null
  foundingBadge: boolean
  listingLimit: number | null
  currentListings: number
  listingsRemaining: number | null
  listingLimitReached: boolean
  subscriptionStatus: string | null
  currentPeriodEnd: string | null
  hasActiveSubscription: boolean
}

const GRANDFATHERED_BENEFITS = [
  '4% commission (vs the standard 10%)',
  'Unlimited active listings',
  'Go Live video shopping',
  'Dedicated AI account manager',
  'Full API access & integrations',
  'Free custom storefront',
  'Priority placement in search',
  'Priority support',
]

const BADGE_BENEFITS = [
  'Permanent "Founding Seller" badge on your storefront and listings',
  'Priority placement in search and your country’s category page',
]

export default function TierUpgradeView() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [notSeller, setNotSeller] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    fetch('/api/seller/subscription')
      .then(async (r) => {
        if (r.status === 404) {
          setNotSeller(true)
          return null
        }
        if (!r.ok) throw new Error('Failed to load subscription')
        return r.json()
      })
      .then((data) => {
        if (data) setStatus(data)
      })
      .catch(() => setToast({ type: 'error', msg: 'Could not load your plan. Please refresh.' }))
      .finally(() => setLoading(false))
  }, [])

  const shellStyle: React.CSSProperties = {
    height: 'calc(100dvh - 64px)',
    width: '100%',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  if (loading) {
    return (
      <div style={{ ...shellStyle, alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading your plan…</p>
      </div>
    )
  }

  if (notSeller) {
    return (
      <div style={shellStyle}>
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>Your plan</p>
          <Link href="/dashboard" style={{ fontSize: '13px', color: 'var(--muted)' }}>← Dashboard</Link>
        </header>
        <main style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>Become a seller to see your rate</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '420px', margin: 0 }}>
            You need an approved seller account before Velor has a commission rate to show you.
          </p>
          <Link
            href="/sell"
            style={{ marginTop: '8px', padding: '12px 28px', background: 'var(--accent)', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}
          >
            Apply to sell
          </Link>
        </main>
      </div>
    )
  }

  const hasLowerCommission = status?.tier === 'PRO'
  const hasBadge = !!status?.foundingBadge
  const isHighlighted = hasLowerCommission || hasBadge

  return (
    <div style={shellStyle}>
      {toast && (
        <div
          style={{
            position: 'fixed', top: '16px', right: '16px', zIndex: 1200,
            padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff',
            background: toast.type === 'success' ? 'var(--green)' : 'var(--red)',
          }}
        >
          {toast.msg}
        </div>
      )}

      <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.02em' }}>Your plan</p>
        <Link href="/dashboard" style={{ fontSize: '13px', color: 'var(--muted)' }}>← Dashboard</Link>
      </header>

      <main style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: '560px', width: '100%' }}>
          <div
            style={{
              borderRadius: '20px', padding: '36px 38px', color: '#fff', position: 'relative', overflow: 'hidden',
              background: isHighlighted
                ? 'linear-gradient(160deg, #7c3aed 0%, #3b1177 100%)'
                : 'linear-gradient(160deg, #26262c 0%, #101012 100%)',
            }}
          >
            {hasBadge && (
              <div style={{ display: 'inline-block', marginBottom: '14px', background: 'rgba(0,0,0,0.3)', padding: '5px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Founding seller
              </div>
            )}
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '6px' }}>Your commission rate</div>
            <div style={{ fontSize: '52px', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {status?.commissionRate ?? 10}%
            </div>
            <p style={{ marginTop: '14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', maxWidth: '420px', lineHeight: 1.6 }}>
              {hasLowerCommission
                ? 'A rate already promised to you and honoured for as long as you keep selling — no card, no charge, nothing to cancel.'
                : hasBadge
                ? 'Being first from your country doesn’t change your commission — every seller is on the same flat 10%. What it does give you is below.'
                : "Velor charges a single flat 10% commission on every completed sale — there's no paid plan, no upsell, and nothing to subscribe to. It's the same rate for every seller."}
            </p>
          </div>

          {hasLowerCommission && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '12px' }}>
                What your rate includes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {GRANDFATHERED_BENEFITS.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13px', color: 'var(--text)' }}>
                    <span style={{ color: 'var(--accent)', flex: '0 0 auto', fontWeight: 700 }}>✔</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasLowerCommission && hasBadge && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '12px' }}>
                What your founding badge includes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {BADGE_BENEFITS.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13px', color: 'var(--text)' }}>
                    <span style={{ color: 'var(--accent)', flex: '0 0 auto', fontWeight: 700 }}>✔</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isHighlighted && (
            <div style={{ marginTop: '24px', padding: '16px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
                The first verified seller from each country keeps a permanent badge and priority placement — see{' '}
                <Link href="/founding" style={{ color: 'var(--accent)' }}>open countries</Link>. It doesn&apos;t change
                commission for anyone — every seller is on the same flat 10%.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
