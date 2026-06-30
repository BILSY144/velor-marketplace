'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type ConnectStatus = 'idle' | 'loading' | 'pending' | 'active' | 'error';

interface AccountInfo {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  defaultCurrency: string;
  country: string;
}

const COMMISSION_RATE = 15;

function StripeConnectContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConnectStatus>('idle');
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const accountId = searchParams.get('accountId');
    if (accountId) {
      if (urlStatus === 'active') {
        fetchAccountStatus(accountId);
      } else if (urlStatus === 'pending') {
        setStatus('pending');
        setAccount(prev => prev ? prev : { accountId, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false, defaultCurrency: 'usd', country: '' });
      }
    }
  }, [searchParams]);

  async function fetchAccountStatus(accountId: string) {
    setStatus('loading');
    try {
      const r = await fetch(`/api/stripe/connect?accountId=${accountId}`);
      const d = await r.json();
      if (d.chargesEnabled) {
        setAccount(d);
        setStatus('active');
      } else {
        setStatus('pending');
      }
    } catch {
      setStatus('error');
      setError('Failed to load account status');
    }
  }

  async function handleConnect() {
    setStatus('loading');
    setError('');
    try {
      const r = await fetch('/api/stripe/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const d = await r.json();
      if (d.onboardingUrl) {
        window.location.href = d.onboardingUrl;
      } else {
        throw new Error('No onboarding URL returned');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }

  async function handleContinue() {
    if (!account?.accountId) return;
    setStatus('loading');
    try {
      const r = await fetch('/api/stripe/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: account.accountId }) });
      const d = await r.json();
      if (d.onboardingUrl) window.location.href = d.onboardingUrl;
    } catch {
      setStatus('error');
      setError('Failed to resume onboarding');
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '720px' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px' }}>
        Stripe Connect
      </h1>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#999999', margin: '0 0 32px' }}>
        Connect your Stripe account to receive payouts for your sales on Velor Marketplace.
      </p>

      {/* Commission Info */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px' }}>
          How Payouts Work
        </h2>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '16px', background: '#0D0D0D', borderRadius: '8px' }}>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 800, color: '#00E676', margin: '0 0 4px' }}>
              {100 - COMMISSION_RATE}%
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999999', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              You receive
            </p>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '16px', background: '#0D0D0D', borderRadius: '8px' }}>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 800, color: '#FF6B00', margin: '0 0 4px' }}>
              {COMMISSION_RATE}%
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999999', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform fee
            </p>
          </div>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#999999', margin: '16px 0 0' }}>
          Payouts are processed automatically after each successful sale. Funds arrive in your bank account within 2-7 business days.
        </p>
      </div>

      {/* Status: Active */}
      {status === 'active' && account && (
        <div style={{ background: '#1A1A1A', border: '1px solid #00E676', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00E676' }} />
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#00E676' }}>
              Account Connected
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Account ID', value: account.accountId.slice(0, 20) + '...' },
              { label: 'Country', value: account.country || 'N/A' },
              { label: 'Charges', value: account.chargesEnabled ? 'Enabled' : 'Disabled' },
              { label: 'Payouts', value: account.payoutsEnabled ? 'Enabled' : 'Disabled' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#0D0D0D', borderRadius: '8px', padding: '12px 16px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#999999', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#FFFFFF', margin: 0, fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status: Pending */}
      {status === 'pending' && (
        <div style={{ background: '#1A1A1A', border: '1px solid #FF6B00', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF6B00' }} />
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#FF6B00' }}>
              Verification Pending
            </span>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#999999', margin: '0 0 20px' }}>
            Your Stripe account is created but requires additional verification before you can receive payouts.
          </p>
          <button
            onClick={handleContinue}
            style={{ padding: '12px 24px', background: '#FF6B00', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
          >
            Continue Verification
          </button>
        </div>
      )}

      {/* Status: Idle or Error */}
      {(status === 'idle' || status === 'error') && (
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
          {error && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#FF1744', margin: '0 0 16px' }}>
              {error}
            </p>
          )}
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#999999', margin: '0 0 20px' }}>
            Connect your Stripe account to start receiving payouts. You will be redirected to Stripe to complete verification.
          </p>
          <button
            onClick={handleConnect}
            style={{ padding: '14px 32px', background: '#FF6B00', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
          >
            Connect with Stripe
          </button>
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#999999' }}>Connecting to Stripe...</p>
        </div>
      )}
    </div>
  );
}

export default function StripeConnectPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '32px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#999999' }}>Loading...</p>
      </div>
    }>
      <StripeConnectContent />
    </Suspense>
  );
}
