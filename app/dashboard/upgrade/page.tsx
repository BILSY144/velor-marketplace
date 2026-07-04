'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SubscriptionStatus {
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
  commissionRate: number;
  monthlyFee: number | null;
  listingLimit: number | null;
  currentListings: number;
  listingsRemaining: number | null;
  listingLimitReached: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasActiveSubscription: boolean;
}

type TierId = 'STARTER' | 'PRO' | 'ENTERPRISE';

interface TierDef {
  id: TierId;
  name: string;
  price: number;
  commission: number;
  listingLabel: string;
  color: string;
  badge: string | null;
  features: string[];
}

const TIERS: Record<TierId, TierDef> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    price: 0,
    commission: 15,
    listingLabel: 'Up to 20 active listings',
    color: 'from-slate-700 to-slate-900',
    badge: null,
    features: [
      '20 active product listings',
      'Seller dashboard & analytics',
      'Buyer protection on every sale',
      'Order management tools',
      'Customer support access',
      'Standard search placement',
    ],
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 49,
    commission: 8,
    listingLabel: 'Up to 200 active listings',
    color: 'from-violet-600 to-purple-800',
    badge: 'Most popular',
    features: [
      '200 active product listings',
      'Free custom storefront',
      'Priority placement in search',
      'AI-powered listing optimisation',
      'Advanced sales analytics',
      'Dedicated seller support',
    ],
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 199,
    commission: 5,
    listingLabel: 'Unlimited active listings',
    color: 'from-amber-700 to-orange-900',
    badge: 'High-volume sellers',
    features: [
      'Unlimited active listings',
      'Everything in Pro',
      'Dedicated account manager',
      'Full API access & integrations',
      'Free custom storefront',
      'Custom analytics & early access',
    ],
  },
};

function breakEvenVsStarter(price: number, commission: number): number | null {
  const delta = (15 - commission) / 100;
  if (delta <= 0) return null;
  return Math.ceil(price / delta);
}

function CompareModal({ onClose }: { onClose: () => void }) {
  const rows: { name: string; commission: string; fee: string; limit: string; velor: boolean; highlight?: boolean }[] = [
    { name: 'Etsy', commission: '6.5% + listing fee', fee: 'Free', limit: 'Unlimited', velor: false },
    { name: 'eBay', commission: '12.9%', fee: 'Free', limit: 'Unlimited', velor: false },
    { name: 'Amazon', commission: '8-15%', fee: '£25-39', limit: 'Unlimited', velor: false },
    { name: 'Velor Starter', commission: '15%', fee: 'Free', limit: '20', velor: true },
    { name: 'Velor Pro', commission: '8%', fee: '£49/mo', limit: '200', velor: true, highlight: true },
    { name: 'Velor Enterprise', commission: '5%', fee: '£199/mo', limit: 'Unlimited', velor: true },
  ];
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-6" onClick={onClose}>
      <div
        className="bg-[#0f0f0f] border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-sm">How Velor compares</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white text-sm">✕</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-neutral-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-3 text-left">Platform</th>
              <th className="px-6 py-3 text-center">Commission</th>
              <th className="px-6 py-3 text-center">Fee</th>
              <th className="px-6 py-3 text-center">Listings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr
                key={row.name}
                className={row.highlight ? 'bg-violet-900/25 text-white' : row.velor ? 'bg-white/[0.02] text-neutral-300' : 'text-neutral-500'}
              >
                <td className="px-6 py-3 font-medium">{row.name}</td>
                <td className="px-6 py-3 text-center font-mono text-xs">{row.commission}</td>
                <td className="px-6 py-3 text-center text-xs">{row.fee}</td>
                <td className="px-6 py-3 text-center text-xs">{row.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-6 py-4 text-xs text-neutral-700">
          All prices exclude VAT where applicable. Commission calculated on sale value excluding delivery.
        </p>
      </div>
    </div>
  );
}

function UpgradeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [notSeller, setNotSeller] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const intentParam = searchParams.get('intent');
  const intentTier: TierId | null =
    intentParam && ['starter', 'pro', 'enterprise'].includes(intentParam) ? (intentParam.toUpperCase() as TierId) : null;

  useEffect(() => {
    fetch('/api/seller/subscription')
      .then((r) => {
        if (r.status === 404) {
          setNotSeller(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setStatus(data);
      })
      .finally(() => setLoading(false));
    if (searchParams.get('success') === 'true') {
      const plan = searchParams.get('plan');
      setToast({
        type: 'success',
        msg: plan === 'enterprise' ? 'Welcome to Enterprise. Your commission rate is now 5%.' : 'Welcome to Pro. Your commission rate is now 8%.',
      });
    }
    if (searchParams.get('cancelled') === 'true') {
      setToast({ type: 'error', msg: 'Payment cancelled - you remain on your current plan.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleUpgrade = async (action = 'upgrade_to_pro') => {
    setUpgrading(true);
    try {
      const r = await fetch('/api/seller/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await r.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setToast({ type: 'error', msg: data.error || 'Something went wrong. Try again.' });
        setUpgrading(false);
      }
    } catch {
      setToast({ type: 'error', msg: 'Network error. Please try again.' });
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You keep access until your billing period ends, then move to Starter.')) return;
    setCancelling(true);
    try {
      const r = await fetch('/api/seller/subscription', { method: 'DELETE' });
      const data = await r.json();
      if (r.ok) {
        setToast({ type: 'success', msg: 'Subscription set to cancel at period end.' });
        setStatus((s) => (s ? { ...s, subscriptionStatus: 'cancelling' } : s));
      } else {
        setToast({ type: 'error', msg: data.error || 'Something went wrong.' });
      }
    } catch {
      setToast({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setCancelling(false);
    }
  };

  const shellClass = 'h-[calc(100dvh-64px)] w-full bg-black text-white flex flex-col overflow-hidden';

  if (loading) {
    return (
      <div className={`${shellClass} items-center justify-center`}>
        <p className="text-neutral-500 text-sm">Loading your plan…</p>
      </div>
    );
  }

  if (notSeller) {
    return (
      <div className={shellClass}>
        <header className="flex-none flex items-center justify-between px-8 py-4 border-b border-white/10">
          <p className="font-semibold text-sm text-neutral-400">Seller plans</p>
          <Link href="/dashboard" className="text-xs text-neutral-500 hover:text-white transition-colors">
            ← Dashboard
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <p className="text-lg font-semibold mb-2">You don&apos;t have a seller account yet</p>
            <p className="text-neutral-500 text-sm mb-6">
              Create your free store in a couple of minutes, then come back here to choose a plan.
            </p>
            <Link
              href="/sell"
              className="inline-block bg-white text-black font-semibold text-sm px-6 py-3 rounded-xl hover:bg-neutral-200 transition-colors"
            >
              Become a seller
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tier = TIERS[intentTier ?? status?.tier ?? 'PRO'];
  const isCurrent = status?.tier === tier.id;
  const breakEven = tier.id !== 'STARTER' ? breakEvenVsStarter(tier.price, tier.commission) : null;
  const canCancel = isCurrent && tier.id !== 'STARTER' && status?.hasActiveSubscription && status.subscriptionStatus !== 'cancelling';
  const cardAccent =
    tier.id === 'PRO' ? 'border-violet-500/60' : tier.id === 'ENTERPRISE' ? 'border-amber-500/40' : 'border-white/10';

  return (
    <div className={shellClass}>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {showCompare && <CompareModal onClose={() => setShowCompare(false)} />}

      {/* Header */}
      <header className="flex-none flex items-center justify-between px-8 py-4 border-b border-white/10">
        <p className="font-semibold text-sm text-neutral-400">Seller plans · {tier.name}</p>
        {status && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
            <span className="font-semibold text-white">{status.tier}</span>
            <span>·</span>
            <span>{status.commissionRate}% commission</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              {status.currentListings} / {status.listingLimit ?? '∞'} listings
            </span>
          </div>
        )}
        <Link href="/dashboard" className="text-xs text-neutral-500 hover:text-white transition-colors">
          ← Dashboard
        </Link>
      </header>

      {/* Single-tier focus card */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-6 py-4">
        <div className={`w-full max-w-2xl h-full max-h-full rounded-3xl border overflow-hidden flex flex-col ${cardAccent}`}>
          <div className={`flex-none bg-gradient-to-br ${tier.color} px-8 py-6 relative`}>
            {tier.badge && (
              <span className="absolute top-5 right-6 text-xs font-semibold uppercase tracking-wider bg-white/20 rounded-full px-3 py-1">
                {tier.badge}
              </span>
            )}
            <h1 className="text-3xl font-semibold mb-3">{tier.name}</h1>
            <div className="flex flex-wrap items-baseline gap-3 mb-3">
              <span className="text-4xl font-bold">{tier.price === 0 ? 'Free' : `£${tier.price}`}</span>
              {tier.price > 0 && <span className="text-white/60 text-sm">/ month</span>}
              <span className="inline-flex items-center gap-1.5 bg-black/25 rounded-lg px-3 py-1 text-sm font-bold">
                {tier.commission}% commission
              </span>
            </div>
            <p className="text-white/70 text-sm">{tier.listingLabel}</p>
          </div>

          <div className="flex-1 min-h-0 bg-[#0f0f0f] px-8 py-6 flex flex-col justify-between overflow-y-auto">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {tier.features.map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm text-neutral-300">
                  <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>

            <div className="mt-6">
              {isCurrent ? (
                <div>
                  <div className="w-full text-center py-3.5 rounded-xl border border-white/15 text-sm text-neutral-400 font-medium">
                    Your current plan
                  </div>
                  {canCancel && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="w-full text-center py-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors mt-2"
                    >
                      {cancelling ? 'Cancelling…' : 'Cancel subscription'}
                    </button>
                  )}
                  {status?.currentPeriodEnd && tier.id !== 'STARTER' && (
                    <p className="text-center text-xs text-neutral-600 mt-1.5">
                      {status.subscriptionStatus === 'cancelling' ? 'Access until ' : 'Renews '}
                      {new Date(status.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              ) : tier.id === 'PRO' ? (
                <button
                  onClick={() => handleUpgrade('upgrade_to_pro')}
                  disabled={upgrading}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-violet-900/30"
                >
                  {upgrading ? 'Redirecting to checkout…' : `Upgrade to Pro — £${tier.price}/mo`}
                </button>
              ) : tier.id === 'ENTERPRISE' ? (
                <button
                  onClick={() => handleUpgrade('upgrade_to_enterprise')}
                  disabled={upgrading}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-amber-900/30"
                >
                  {upgrading ? 'Redirecting to checkout…' : `Upgrade to Enterprise — £${tier.price}/mo`}
                </button>
              ) : (
                <div>
                  <p className="text-center text-xs text-neutral-500 mb-3">
                    You&apos;re on {status?.tier === 'PRO' ? 'Pro' : 'Enterprise'}. Cancel to move to Starter at the end of your billing period.
                  </p>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full text-center py-3.5 rounded-xl border border-white/15 text-sm font-semibold hover:bg-white/5 transition-colors"
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel and move to Starter'}
                  </button>
                </div>
              )}

              {breakEven && !isCurrent && (
                <p className="text-center text-xs text-neutral-600 mt-3">
                  Pays for itself vs Starter once you sell £{breakEven.toLocaleString()}+ a month
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-none flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 py-3 border-t border-white/10 text-xs text-neutral-600">
        <span>Secure payment via Stripe</span>
        <span>·</span>
        <span>Cancel anytime</span>
        <span>·</span>
        <button onClick={() => setShowCompare(true)} className="underline hover:text-neutral-400 transition-colors">
          Compare all plans
        </button>
        <span>·</span>
        <span>
          Looking for a different plan?{' '}
          {(['STARTER', 'PRO', 'ENTERPRISE'] as TierId[])
            .filter((id) => id !== tier.id)
            .map((id, i, arr) => (
              <span key={id}>
                <Link href={`/dashboard/upgrade?intent=${id.toLowerCase()}`} className="underline hover:text-neutral-400 transition-colors">
                  {TIERS[id].name}
                </Link>
                {i < arr.length - 1 ? ' · ' : ''}
              </span>
            ))}
        </span>
      </footer>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="h-[calc(100dvh-64px)] w-full bg-black" />}>
      <UpgradeContent />
    </Suspense>
  );
}
