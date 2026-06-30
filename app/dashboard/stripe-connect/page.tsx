'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type ConnectStatus = 'idle' | 'loading' | 'pending' | 'active' | 'error';

interface AccountInfo {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  defaultCurrency: string;
  country: string;
}

const COMMISSION_RATE = 15; // Velor takes 15% platform fee

export default function StripeConnectPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConnectStatus>('idle');
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  // Read callback params from URL
  useEffect(() => {
    const urlAccountId = searchParams.get('accountId');
    const urlStatus = searchParams.get('status');
    const urlError = searchParams.get('error');
    const refresh = searchParams.get('refresh');

    if (urlError) {
      setError(urlError === 'missing_params' ? 'Onboarding link expired. Please try again.' :
               urlError === 'account_not_found' ? 'Could not verify your account. Please contact support.' :
               'Something went wrong. Please try again.');
      setStatus('error');
    } else if (urlAccountId && urlStatus === 'active') {
      setStatus('active');
      fetchAccountInfo(urlAccountId);
    } else if (urlAccountId && urlStatus === 'pending') {
      setStatus('pending');
    } else if (refresh) {
      setStatus('idle');
    }
  }, [searchParams]);

  async function fetchAccountInfo(accountId: string) {
    try {
      const res = await fetch(`/api/stripe/connect?accountId=${accountId}`);
      if (res.ok) {
        const data = await res.json();
        setAccountInfo(data);
      }
    } catch {}
  }

  async function handleStartOnboarding() {
    setStarting(true);
    setError('');
    try {
      // Use a demo sellerId for now — in production this comes from the authenticated seller session
      const sellerId = 'seller_' + Math.random().toString(36).slice(2, 10);
      const email = 'seller@example.com'; // Replace with authenticated user email

      const res = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, email, businessName: 'My Store' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start onboarding.');
        setStarting(false);
        return;
      }

      // Redirect to Stripe onboarding
      window.location.href = data.onboardingUrl;

    } catch {
      setError('Network error. Please try again.');
      setStarting(false);
    }
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 680, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Link href="/dashboard" style={{ color: '#999999', fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ color: '#3A3A3A' }}>/</span>
          <span style={{ color: '#FFFFFF', fontSize: 13 }}>Stripe Connect</span>
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
          Payments & Payouts
        </h1>
        <p style={{ color: '#999999', fontSize: 14, marginTop: 6 }}>Connect your bank account to receive payouts from your sales.</p>
      </div>

      {/* Commission info strip */}
      <div style={{ background: '#FF6B0010', border: '1px solid #FF6B0030', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#FF6B00', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Platform Commission</div>
          <div style={{ color: '#999999', fontSize: 13 }}>Velor keeps {COMMISSION_RATE}% of each sale. You receive {100 - COMMISSION_RATE}%.</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>{100 - COMMISSION_RATE}%</div>
          <div style={{ color: '#999999', fontSize: 11 }}>to you</div>
        </div>
      </div>

      {/* Active state */}
      {status === 'active' && accountInfo && (
        <div>
          <div style={{ background: '#00E67610', border: '1px solid #00E67640', borderRadius: 10, padding: '20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#00E67622', border: '1px solid #00E676', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{ color: '#00E676', fontSize: 14, fontWeight: 700 }}>Stripe account connected</div>
                <div style={{ color: '#999999', fontSize: 12 }}>You are ready to receive payouts</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Charges enabled', value: accountInfo.chargesEnabled ? 'Yes' : 'No', ok: accountInfo.chargesEnabled },
                { label: 'Payouts enabled', value: accountInfo.payoutsEnabled ? 'Yes' : 'No', ok: accountInfo.payoutsEnabled },
                { label: 'Currency', value: accountInfo.defaultCurrency.toUpperCase(), ok: true },
                { label: 'Country', value: accountInfo.country.toUpperCase(), ok: true },
              ].map(({ label, value, ok }) => (
                <div key={label} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ color: '#999999', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                  <div style={{ color: ok ? '#00E676' : '#FF1744', fontSize: 14, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '18px 20px' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>How payouts work</h3>
            {[
              { step: '1', text: 'Buyer completes checkout — Stripe charges the full amount' },
              { step: '2', text: `Velor retains ${COMMISSION_RATE}% platform fee automatically` },
              { step: '3', text: `Your ${100 - COMMISSION_RATE}% is transferred to your connected account within 2 business days` },
              { step: '4', text: 'Stripe pays out to your bank account on your chosen schedule (daily, weekly, or manual)' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FF6B0022', border: '1px solid #FF6B0050', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#FF6B00', fontFamily: 'Space Grotesk, sans-serif' }}>{step}</div>
                <div style={{ color: '#CCCCCC', fontSize: 13, paddingTop: 2 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending state */}
      {status === 'pending' && (
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '32px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FF6B0022', border: '1px solid #FF6B0050', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px' }}>Verification in progress</h2>
          <p style={{ color: '#999999', fontSize: 14, margin: '0 0 20px' }}>Stripe is reviewing your details. This usually takes a few minutes.</p>
          <button
            onClick={handleStartOnboarding}
            disabled={starting}
            style={{ padding: '10px 24px', background: 'transparent', color: '#FF6B00', border: '1px solid #FF6B00', borderRadius: 8, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 600 }}
          >
            Continue onboarding
          </button>
        </div>
      )}

      {/* Idle / not connected state */}
      {(status === 'idle' || status === 'error') && (
        <div>
          {error && (
            <div style={{ background: '#FF174415', border: '1px solid #FF174440', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#FF1744', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '24px 24px 0' }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px' }}>Connect your bank account</h2>
              <p style={{ color: '#999999', fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
                Velor uses Stripe to handle payments securely. Connect your account to start receiving payouts from your sales in 150+ currencies across 46 countries.
              </p>
            </div>

            {/* Feature grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#2A2A2A', borderTop: '1px solid #2A2A2A' }}>
              {[
                { icon: '🌍', title: 'Global payouts', desc: 'Receive funds in your local currency' },
                { icon: '⚡', title: 'Fast transfers', desc: '2-business-day payout cycle' },
                { icon: '🔒', title: 'Bank-level security', desc: 'Stripe handles PCI compliance' },
                { icon: '📊', title: 'Full dashboard', desc: 'Track all earnings in Stripe' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ background: '#1A1A1A', padding: '16px 20px' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                  <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{title}</div>
                  <div style={{ color: '#999999', fontSize: 12 }}>{desc}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '20px 24px' }}>
              <button
                onClick={handleStartOnboarding}
                disabled={starting}
                style={{
                  width: '100%', padding: '14px', background: starting ? '#2A2A2A' : '#FF6B00',
                  color: starting ? '#666' : '#000000', border: 'none', borderRadius: 8,
                  cursor: starting ? 'not-allowed' : 'pointer', fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 15, fontWeight: 700, transition: 'opacity 0.15s',
                }}
              >
                {starting ? 'Redirecting to Stripe...' : 'Connect with Stripe'}
              </button>
              <p style={{ color: '#666', fontSize: 11, textAlign: 'center', marginTop: 10 }}>
                You will be redirected to Stripe to complete identity verification. This takes about 5 minutes.
              </p>
            </div>
          </div>

          <div style={{ background: '#111111', borderRadius: 8, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ color: '#666', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              Velor never stores your bank details. All payment information is handled directly by Stripe, a PCI DSS Level 1 certified payment processor trusted by millions of businesses worldwide.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
