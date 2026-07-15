'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StripeConnectPage() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function init() {
    setLoading(true);
    try {
      // Sellers in countries Stripe does not support are paid via Payoneer
      // instead -- same escrow and hold rules, different rail.
      const railRes = await fetch('/api/payoneer/onboard');
      if (railRes.ok) {
        const rail = await railRes.json();
        if (rail?.rail === 'PAYONEER') {
          router.replace('/dashboard/payoneer');
          return;
        }
      }
    } catch {}
    await fetchStatus();
  }

  async function fetchStatus() {
    try {
      const r = await fetch('/api/stripe/connect/account');
      const d = await r.json();
      setStatus(d);
    } catch {}
    setLoading(false);
  }

  async function handleConnect() {
    setConnecting(true);
    setError('');
    try {
      const r = await fetch('/api/stripe/connect', { method: 'POST' });
      const d = await r.json();
      if (r.ok && d.onboardingUrl) {
        window.location.href = d.onboardingUrl;
        return;
      }
      setError(d.error || 'Could not start Stripe onboarding. Try again.');
    } catch {
      setError('Network error. Please try again.');
    }
    setConnecting(false);
  }

  async function handleCompleteSetup() {
    setConnecting(true);
    setError('');
    try {
      const r = await fetch('/api/stripe/connect');
      const d = await r.json();
      if (r.ok && d.onboardingUrl) {
        window.location.href = d.onboardingUrl;
        return;
      }
      if (d.needsAccount) {
        await handleConnect();
        return;
      }
      setError(d.error || 'Could not resume Stripe onboarding. Try again.');
    } catch {
      setError('Network error. Please try again.');
    }
    setConnecting(false);
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect your Stripe account? You will stop receiving payouts.')) return;
    await fetch('/api/stripe/connect/account', { method: 'DELETE' });
    await fetchStatus();
  }

  const isConnected = status?.chargesEnabled && status?.payoutsEnabled;
  const isIncomplete = status && !status.needsAccount && !isConnected;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#FFFFFF' }}>
        Payout Settings
      </h1>
      <p style={{ color: '#999999', fontSize: 15, marginBottom: 32 }}>
        Connect your Stripe account to receive your share of every sale automatically.
      </p>

      {error && (
        <div style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid #FF1744', borderRadius: 8, padding: '12px 16px', color: '#FF1744', fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#999999', fontSize: 14 }}>Loading...</div>
      ) : (
        <>
          {isConnected && (
            <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00E676' }} />
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16 }}>Connected</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Charges', ok: status?.chargesEnabled },
                  { label: 'Payouts', ok: status?.payoutsEnabled },
                  { label: 'Verified', ok: status?.detailsSubmitted },
                ].map(item => (
                  <div key={item.label} style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.ok ? '#00E676' : '#FF1744' }} />
                    <span style={{ fontSize: 13, color: '#FFFFFF' }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleDisconnect} style={{ marginTop: 20, background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 16px', color: '#999999', fontSize: 13, cursor: 'pointer' }}>
                Disconnect
              </button>
            </div>
          )}

          {status?.needsAccount && (
            <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Set Up Payouts</h3>
              <p style={{ color: '#999999', fontSize: 14, marginBottom: 20 }}>
                You keep every sale minus your tier&apos;s commission (10% Starter, 4% Pro). Payouts are processed by Stripe.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                style={{ background: '#FF6B00', border: 'none', borderRadius: 8, padding: '13px 24px', color: '#FFFFFF', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.7 : 1 }}
              >
                {connecting ? 'Redirecting...' : 'Connect with Stripe'}
              </button>
            </div>
          )}

          {isIncomplete && (
            <div style={{ background: '#1A1A1A', border: '1px solid #FF6B00', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#FF6B00' }}>Setup Incomplete</h3>
              <p style={{ color: '#999999', fontSize: 14, marginBottom: 20 }}>
                Your Stripe account needs a few more details before payouts can be enabled.
              </p>
              <button
                onClick={handleCompleteSetup}
                disabled={connecting}
                style={{ background: '#FF6B00', border: 'none', borderRadius: 8, padding: '13px 24px', color: '#FFFFFF', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.7 : 1 }}
              >
                {connecting ? 'Redirecting...' : 'Complete Setup'}
              </button>
              <button onClick={handleDisconnect} style={{ marginLeft: 12, background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, padding: '13px 16px', color: '#999999', fontSize: 13, cursor: 'pointer' }}>
                Disconnect
              </button>
            </div>
          )}

          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>How payouts work</h3>
            {[
              { step: '1', text: 'A customer purchases your product' },
              { step: '2', text: "Velor deducts your tier's commission (10% Starter, 4% Pro)" },
              { step: '3', text: 'Funds are held safely until the buyer confirms delivery' },
              { step: '4', text: 'Your share is released to your Stripe account -- within 15 days for new sellers, 72 hours once trusted' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>
                  {item.step}
                </div>
                <span style={{ fontSize: 14, color: '#999999', paddingTop: 4 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
