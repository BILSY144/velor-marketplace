'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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

const TIERS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 0,
    commission: 15,
    listingLabel: 'Up to 20 active listings',
    color: 'from-slate-700 to-slate-900',
    borderColor: 'border-white/10',
    badge: null,
    features: [
      '20 active product listings',
      'Seller dashboard and analytics',
      'Buyer protection on every sale',
      'Order management tools',
      'Customer support access',
      'Standard search placement',
      '15% commission per sale',
    ],
    highlight: false,
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 49,
    commission: 8,
    listingLabel: 'Up to 200 active listings',
    color: 'from-violet-600 to-purple-800',
    borderColor: 'border-violet-500/60',
    badge: 'Most popular',
    features: [
      '200 active product listings',
      'Free custom storefront',
      'Priority placement in search',
      'AI-powered listing optimisation',
      'Pricing insights dashboard',
      'Advanced sales analytics',
      'Dedicated seller support',
      '8% commission per sale',
    ],
    highlight: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 199,
    commission: 5,
    listingLabel: 'Unlimited active listings',
    color: 'from-amber-700 to-orange-900',
    borderColor: 'border-amber-500/40',
    badge: 'High-volume sellers',
    features: [
      'Unlimited listings',
      'Everything in Pro',
      'Dedicated account manager',
      'API access and integrations',
      'Free custom storefront',
      'Custom analytics reports',
      'Fixed £199/mo, no hidden fees',
      'Early feature access',
      '5% commission per sale',
    ],
    highlight: false,
  },
];

const BREAK_EVEN_GMV = Math.ceil(49 / (0.15 - 0.08));

function UpgradeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/seller/subscription')
      .then(r => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
    if (searchParams.get('success') === 'true') {
      const plan = searchParams.get('plan');
      setToast({ type: 'success', msg: plan === 'enterprise' ? 'Welcome to Enterprise. Your commission rate is now 5%.' : 'Welcome to Pro. Your commission rate is now 8%.' });
    }
    if (searchParams.get('cancelled') === 'true') {
      setToast({ type: 'error', msg: 'Payment cancelled - you remain on your current plan.' });
    }
  }, [searchParams]);

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
    if (!confirm('Cancel Pro? You keep Pro access until your billing period ends.')) return;
    setCancelling(true);
    try {
      const r = await fetch('/api/seller/subscription', { method: 'DELETE' });
      const data = await r.json();
      if (r.ok) {
        setToast({ type: 'success', msg: 'Subscription set to cancel at period end.' });
        setStatus(s => s ? { ...s, subscriptionStatus: 'cancelling' } : s);
      } else {
        setToast({ type: 'error', msg: data.error || 'Something went wrong.' });
      }
    } catch {
      setToast({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setCancelling(false);
    }
  };

  const savingsAt = (gmv: number) => Math.round(gmv * 0.15 - (gmv * 0.08 + 49));

  return (
    <div className="min-h-screen bg-black text-white">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">

        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Seller plans</p>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-5">Scale with your business</h1>
          <p className="text-neutral-400 text-lg max-w-lg mx-auto">
            Start free with 20 listings. Get up to 200 listings from £49/month and drop your commission to 8%.
          </p>
        </div>

        {!loading && status && (
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 text-sm flex-wrap justify-center">
              <span className="text-neutral-400">Current plan:</span>
              <span className="font-semibold">{status.tier}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-300">{status.commissionRate}% commission</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-300">{status.currentListings} / {status.listingLimit ?? '∞'} listings</span>
              {status.listingLimitReached && (
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-medium">Limit reached</span>
              )}
            </div>
          </div>
        )}

        {!loading && status?.listingLimitReached && status.tier === 'STARTER' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-10 flex items-start gap-4">
            <div className="text-amber-400 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-300 text-sm">You have reached your 20-listing limit</p>
              <p className="text-amber-400/70 text-sm mt-0.5">Upgrade to Pro for 200 listings and 8% commission.</p>
            </div>
          </div>
        )}

        {!loading && status?.listingLimitReached && status.tier === 'PRO' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-10 flex items-start gap-4">
            <div className="text-amber-400 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-300 text-sm">You have reached your 200-listing limit</p>
              <p className="text-amber-400/70 text-sm mt-0.5">Upgrade to Enterprise for unlimited listings and 5% commission.</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {TIERS.map(tier => {
            const isCurrent = status?.tier === tier.id;
            return (
              <div key={tier.id} className={`relative rounded-2xl border overflow-hidden flex flex-col transition-transform ${tier.borderColor} ${tier.highlight ? 'shadow-2xl shadow-violet-900/40 md:-translate-y-2' : ''}`}>
                {tier.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 text-white rounded-full px-3 py-1">{tier.badge}</span>
                  </div>
                )}
                <div className={`bg-gradient-to-br ${tier.color} p-7 pb-9`}>
                  <h2 className="text-xl font-semibold mb-4">{tier.name}</h2>
                  <div className="mb-5">
                    {tier.price !== null ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-bold">{tier.price === 0 ? 'Free' : `£${tier.price}`}</span>
                        {tier.price > 0 && <span className="text-white/60 text-sm">/ month</span>}
                      </div>
                    ) : (
                      <span className="text-4xl font-bold">Custom</span>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-2 bg-black/25 rounded-xl px-4 py-2 mb-3">
                    <span className="text-3xl font-bold">{tier.commission}%</span>
                    <span className="text-white/70 text-xs leading-tight">commission<br />per sale</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="text-sm text-white/70">{tier.listingLabel}</span>
                  </div>
                </div>
                <div className="bg-[#0f0f0f] p-6 flex flex-col flex-1">
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={f.includes('commission') ? 'text-white font-medium' : 'text-neutral-400'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div>
                      <div className="w-full text-center py-3 rounded-xl border border-white/15 text-sm text-neutral-500 font-medium">Your current plan</div>
                      {tier.id === 'PRO' && status?.hasActiveSubscription && status.subscriptionStatus !== 'cancelling' && (
                        <button onClick={handleCancel} disabled={cancelling} className="w-full text-center py-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors mt-2">
                          {cancelling ? 'Cancelling...' : 'Cancel subscription'}
                        </button>
                      )}
                      {tier.id === 'PRO' && status?.currentPeriodEnd && (
                        <p className="text-center text-xs text-neutral-600 mt-1.5">
                          {status.subscriptionStatus === 'cancelling' ? 'Access until ' : 'Renews '}
                          {new Date(status.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ) : tier.id === 'PRO' ? (
                    <button onClick={() => handleUpgrade('upgrade_to_pro')} disabled={upgrading || loading} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-violet-900/30">
                      {upgrading ? 'Redirecting to checkout...' : 'Upgrade to Pro — £49/mo'}
                    </button>
                  ) : tier.id === 'ENTERPRISE' ? (
                    <button onClick={() => handleUpgrade('upgrade_to_enterprise')} disabled={upgrading || loading} className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-amber-900/30">
                      {upgrading ? 'Redirecting to checkout...' : 'Upgrade to Enterprise — £199/mo'}
                    </button>
                  ) : (
                    <div className="w-full text-center py-3 rounded-xl border border-white/10 text-sm text-neutral-600">Default plan</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-violet-950/60 to-purple-950/40 border border-violet-800/30 rounded-2xl p-8 mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-7">
            <div>
              <h3 className="text-lg font-semibold mb-1">Does Pro pay for itself?</h3>
              <p className="text-neutral-400 text-sm">Pro breaks even at <strong className="text-white">£{BREAK_EVEN_GMV}</strong> in monthly sales. Every pound above that saves you 7p vs Starter.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[500, 1000, 2500, 5000].map(gmv => {
              const saving = savingsAt(gmv);
              return (
                <div key={gmv} className="bg-black/40 rounded-xl p-4 text-center">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">£{gmv.toLocaleString()}/mo sales</p>
                  <p className={`text-2xl font-bold ${saving > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {saving > 0 ? '+' : ''}£{saving}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">{saving > 0 ? 'saved vs Starter' : 'extra cost'}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-white/10 rounded-2xl overflow-hidden mb-8">
          <div className="bg-white/5 px-6 py-4 border-b border-white/10">
            <h3 className="font-semibold text-sm">How Velor compares</h3>
            <p className="text-neutral-500 text-xs mt-0.5">Commission rates across major UK marketplaces</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-neutral-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Platform</th>
                  <th className="px-6 py-3 text-center">Commission</th>
                  <th className="px-6 py-3 text-center">Monthly fee</th>
                  <th className="px-6 py-3 text-center">Listings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { name: 'Etsy', commission: '6.5% + listing fee', fee: 'Free', limit: 'Unlimited', velor: false, highlight: false },
                  { name: 'eBay', commission: '12.9%', fee: 'Free', limit: 'Unlimited', velor: false, highlight: false },
                  { name: 'Amazon', commission: '8-15%', fee: '£25-39', limit: 'Unlimited', velor: false, highlight: false },
                  { name: 'Velor Starter', commission: '15%', fee: 'Free', limit: '20', velor: true, highlight: false },
                  { name: 'Velor Pro', commission: '8%', fee: '£49/mo', limit: '200', velor: true, highlight: true },
                  { name: 'Velor Enterprise', commission: '4-5%', fee: 'Custom', limit: 'Unlimited', velor: true, highlight: false },
                ].map(row => (
                  <tr key={row.name} className={row.highlight ? 'bg-violet-900/25 text-white' : row.velor ? 'bg-white/[0.02] text-neutral-300' : 'text-neutral-500'}>
                    <td className="px-6 py-4 font-medium">{row.highlight && <span className="text-violet-400 mr-1.5">★</span>}{row.name}</td>
                    <td className="px-6 py-4 text-center font-mono text-xs">{row.commission}</td>
                    <td className="px-6 py-4 text-center text-xs">{row.fee}</td>
                    <td className="px-6 py-4 text-center text-xs">{row.limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-700">
          All prices exclude VAT where applicable. Commission calculated on sale value excluding delivery.
          Pro subscriptions billed monthly. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <UpgradeContent />
    </Suspense>
  );
}
