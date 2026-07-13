'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SubscriptionStatus {
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE'
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

export type TierId = 'STARTER' | 'PRO' | 'ENTERPRISE'

interface TierDef {
  id: TierId
  name: string
  kicker: string
  pitch: string
  price: number
  commission: number
  listingLabel: string
  gradient: string
  glow: string
  badge: string | null
  features: string[]
  steps: string[]
}

const TIERS: Record<TierId, TierDef> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    kicker: 'Free forever',
    pitch: '"The easy way to test the water before you dive in."',
    price: 0,
    commission: 10,
    listingLabel: 'Up to 20 active listings',
    gradient: 'linear-gradient(160deg, #26262c 0%, #101012 100%)',
    glow: 'rgba(180,180,190,0.18)',
    badge: null,
    features: [
      '20 active product listings',
      'Full seller dashboard & analytics',
      'Buyer protection on every sale',
      'Order & inventory management',
      'Customer support access',
      'Standard search placement',
    ],
    steps: [
      'Confirm you want to stay on the free plan',
      'No card required — nothing to set up',
      'Start listing products in minutes',
    ],
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    kicker: 'Most popular',
    pitch: '"Built for sellers ready to grow — cheaper fees, better visibility."',
    price: 49,
    commission: 4,
    listingLabel: 'Up to 200 active listings',
    gradient: 'linear-gradient(160deg, #7c3aed 0%, #3b1177 100%)',
    glow: 'rgba(139,92,246,0.35)',
    badge: 'Most popular',
    features: [
      '200 active product listings',
      'Free custom storefront',
      'Priority placement in search',
      'Smart listing optimisation',
      'Advanced sales analytics',
      'Dedicated seller support',
    ],
    steps: [
      'Click "Upgrade to Pro" below',
      'Complete secure checkout via Stripe',
      'Your account upgrades instantly — no waiting',
    ],
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    kicker: 'High-volume sellers',
    pitch: '"For established brands ready to scale without limits."',
    price: 99,
    commission: 0,
    listingLabel: 'Unlimited active listings',
    gradient: 'linear-gradient(160deg, #f59e0b 0%, #7c2d12 100%)',
    glow: 'rgba(245,158,11,0.35)',
    badge: 'High-volume sellers',
    features: [
      'Unlimited active listings',
      'Everything included in Pro',
      'Go Live video shopping',
      'Dedicated account manager',
      'Full API access & integrations',
      'Free custom storefront',
      'Custom analytics & early access',
    ],
    steps: [
      'Click "Upgrade to Enterprise" below',
      'Complete secure checkout via Stripe',
      'Your account manager reaches out within 24h',
    ],
  },
}

function breakEvenVsStarter(price: number, commission: number): number | null {
  const delta = (10 - commission) / 100
  if (delta <= 0) return null
  return Math.ceil(price / delta)
}

function CompareModal({ onClose }: { onClose: () => void }) {
  const rows: [string, string, string, string][] = [
    ['Commission', '10%', '4%', '0%'],
    ['Monthly fee', 'Free', '£49/mo', '£99/mo'],
    ['Listings', '20', '200', 'Unlimited'],
    ['Custom storefront', '—', 'Free', 'Free'],
    ['Search placement', 'Standard', 'Priority', 'Priority'],
    ['Go Live video shopping', '—', '—', 'Yes'],
    ['Account manager', '—', '—', 'Dedicated'],
    ['API access', '—', '—', 'Full'],
  ]
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px',
          padding: '32px', maxWidth: '640px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>Compare plans</h2>
          <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>
            Close
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: 'var(--muted)', fontWeight: 600 }}>Feature</th>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: 'var(--text)', fontWeight: 700 }}>Starter</th>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: '#a78bfa', fontWeight: 700 }}>Pro</th>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: '#fbbf24', fontWeight: 700 }}>Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} style={{ borderBottom: '1px solid var(--border)' }}>
                {r.map((cell, i) => (
                  <td key={i} style={{ padding: '10px 6px', color: i === 0 ? 'var(--muted)' : 'var(--text)' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function TierUpgradeView({ tierId }: { tierId: TierId }) {
  const tier = TIERS[tierId]
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [notSeller, setNotSeller] = useState(false)
  const [showCompare, setShowCompare] = useState(false)

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

  async function handleUpgrade(action: 'upgrade_to_pro' | 'upgrade_to_enterprise') {
    setUpgrading(true)
    setToast(null)
    try {
      const res = await fetch('/api/seller/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ type: 'error', msg: data.error ?? 'Could not start checkout.' })
        setUpgrading(false)
        return
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setUpgrading(false)
        setToast({ type: 'error', msg: 'Checkout could not be started.' })
      }
    } catch {
      setUpgrading(false)
      setToast({ type: 'error', msg: 'Network error. Please try again.' })
    }
  }

  async function handleCancel() {
    setCancelling(true)
    setToast(null)
    try {
      const res = await fetch('/api/seller/subscription', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setToast({ type: 'error', msg: data.error ?? 'Could not cancel plan.' })
      } else {
        setToast({ type: 'success', msg: 'Your plan will move to Starter at the end of the billing period.' })
        setStatus((s) => (s ? { ...s, subscriptionStatus: 'cancelling' } : s))
      }
    } catch {
      setToast({ type: 'error', msg: 'Network error. Please try again.' })
    } finally {
      setCancelling(false)
    }
  }

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
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>Seller plans</p>
          <Link href="/dashboard" style={{ fontSize: '13px', color: 'var(--muted)' }}>← Dashboard</Link>
        </header>
        <main style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>Become a seller to unlock plans</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '420px', margin: 0 }}>
            You need an approved seller account before you can choose a plan and start listing on Velor.
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

  const isCurrent = status?.tier === tier.id
  const breakEven = tier.id !== 'STARTER' ? breakEvenVsStarter(tier.price, tier.commission) : null
  const canCancel = isCurrent && tier.id !== 'STARTER' && status?.hasActiveSubscription && status.subscriptionStatus !== 'cancelling'
  const otherTiers = (Object.keys(TIERS) as TierId[]).filter((id) => id !== tier.id)
  const headline = tier.id === 'STARTER' ? (isCurrent ? "You're on Starter" : 'Switch to Starter') : `Upgrade to ${tier.name}`

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
      {showCompare && <CompareModal onClose={() => setShowCompare(false)} />}

      <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.02em' }}>
          Seller plans <span style={{ color: 'var(--border)' }}>/</span> {tier.name}
        </p>
        {status && (
          <div style={{ fontSize: '12px', color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '999px', padding: '6px 14px' }}>
            Currently on <strong style={{ color: 'var(--text)' }}>{status.tier}</strong> · {status.commissionRate}% commission
          </div>
        )}
        <Link href="/dashboard" style={{ fontSize: '13px', color: 'var(--muted)' }}>← Dashboard</Link>
      </header>

      <main style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'row' }}>
        {/* Spotlight panel */}
        <div
          style={{
            flex: '0 0 38%', minWidth: '280px', height: '100%', background: tier.gradient,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '36px 34px', position: 'relative', overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute', width: '320px', height: '320px', borderRadius: '50%',
              background: tier.glow, filter: 'blur(60px)', top: '-100px', right: '-100px',
            }}
          />
          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.75)' }}>
              Velor seller plans
            </span>
            {tier.badge && (
              <div style={{ marginTop: '14px', display: 'inline-block', background: 'rgba(0,0,0,0.3)', padding: '5px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {tier.badge}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <h1 style={{ fontSize: '52px', fontWeight: 700, margin: '0 0 6px', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {tier.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '40px', fontWeight: 700 }}>{tier.price === 0 ? 'Free' : `£${tier.price}`}</span>
              {tier.price > 0 && <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px' }}>/ month</span>}
            </div>
            <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(0,0,0,0.28)', padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                {tier.commission}% commission
              </span>
              <span style={{ background: 'rgba(0,0,0,0.28)', padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                {tier.listingLabel}
              </span>
            </div>
          </div>

          <p style={{ position: 'relative', fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', margin: 0, maxWidth: '320px' }}>
            {tier.pitch}
          </p>
        </div>

        {/* Content panel */}
        <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 auto', padding: '26px 36px 14px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>{headline}</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              Everything included, plus exactly how activation works.
            </p>
          </div>

          <div style={{ flex: '1 1 auto', minHeight: 0, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '28px', padding: '10px 36px', overflowY: 'auto' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>
                What's included
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {tier.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13px', color: 'var(--text)' }}>
                    <span style={{ color: 'var(--accent)', flex: '0 0 auto', fontWeight: 700 }}>✔</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>
                How it works
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tier.steps.map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span
                      style={{
                        flex: '0 0 auto', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)',
                        color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--muted)', paddingTop: '1px' }}>{s}</span>
                  </div>
                ))}
              </div>

              {breakEven && !isCurrent && (
                <div style={{ marginTop: '18px', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                    Pays for itself vs Starter once you sell <strong style={{ color: 'var(--text)' }}>£{breakEven}+</strong> a month.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment / CTA bar */}
          <div style={{ flex: '0 0 auto', borderTop: '1px solid var(--border)', padding: '18px 36px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isCurrent ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 auto', padding: '13px 20px', borderRadius: '10px', textAlign: 'center', fontWeight: 600, fontSize: '14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {tier.id === 'PRO' && status?.foundingBadge ? '✔ Free for life — your founding-seller perk' : '✔ Your current plan'}
                  {tier.id === 'PRO' && status?.foundingBadge && (
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 400, marginTop: '2px' }}>
                      No card, no charge, nothing to cancel
                    </span>
                  )}
                  {!(tier.id === 'PRO' && status?.foundingBadge) && status?.currentPeriodEnd && (
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 400, marginTop: '2px' }}>
                      {status.subscriptionStatus === 'cancelling' ? 'Moves to Starter on ' : 'Renews '}
                      {new Date(status.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '12px', cursor: cancelling ? 'not-allowed' : 'pointer' }}
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel plan'}
                  </button>
                )}
              </div>
            ) : tier.id === 'PRO' ? (
              <button
                onClick={() => handleUpgrade('upgrade_to_pro')}
                disabled={upgrading}
                style={{
                  width: '100%', padding: '16px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '15px',
                  background: upgrading ? 'var(--border)' : 'var(--accent)', color: '#fff', cursor: upgrading ? 'not-allowed' : 'pointer',
                }}
              >
                {upgrading ? 'Redirecting to secure payment…' : `Upgrade to Pro — £49/mo`}
              </button>
            ) : tier.id === 'ENTERPRISE' ? (
              <button
                onClick={() => handleUpgrade('upgrade_to_enterprise')}
                disabled={upgrading}
                style={{
                  width: '100%', padding: '16px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '15px',
                  background: upgrading ? 'var(--border)' : 'var(--accent)', color: '#fff', cursor: upgrading ? 'not-allowed' : 'pointer',
                }}
              >
                {upgrading ? 'Redirecting to secure payment…' : `Upgrade to Enterprise — £99/mo`}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <p style={{ flex: '1 1 auto', fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                  You&apos;re on {status?.tier ?? 'a paid plan'}. Cancel it to move down to the free Starter plan.
                </p>
                {status?.hasActiveSubscription && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    style={{ padding: '11px 22px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, cursor: cancelling ? 'not-allowed' : 'pointer' }}
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel current plan'}
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '6px 14px', fontSize: '11px', color: 'var(--muted)' }}>
              <span>Secure payment via Stripe</span>
              <span>·</span>
              <span>Cancel anytime</span>
              <span>·</span>
              <button onClick={() => setShowCompare(true)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}>
                Compare all plans
              </button>
              <span>·</span>
              <span>Looking for something else?</span>
              {otherTiers.map((id) => (
                <Link key={id} href={`/dashboard/upgrade/${id.toLowerCase()}`} style={{ color: 'var(--accent)', fontSize: '11px', textDecoration: 'underline' }}>
                  {TIERS[id].name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
