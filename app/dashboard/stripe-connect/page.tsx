'use client';
import { useState, useEffect } from 'react';
export default function StripeConnectPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const r = await fetch('/api/stripe/connect/account');
      const d = await r.json();
      setStatus(d);
    } catch {}
    setLoading(false);
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const r = await fetch('/api/stripe/connect', { method: 'POST' });
      const d = await r.json();
      if (d.onboardingUrl) window.location.href = d.onboardingUrl;
    } catch { setConnecting(false); }
  }

  async function handleCompleteSetup() {
    setConnecting(true);
    try {
      const r = await fetch('/api/stripe/connect');
      const d = await r.json();
      if (d.onboardingUrl) window.location.href = d.onboardingUrl;
    } catch { setConnecting(false); }
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
        Connect your Stripe account to receive 85% of every sale automatically.
      </p>

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
                You will earn 85% of every sale. Velor retains 15% as a platform fee. Payouts are processed by Stripe.
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
              { step: '2', text: 'Velor deducts a 15% platform fee' },
              { step: '3', text: 'You receive 85% directly to your Stripe account' },
              { step: '4', text: 'Stripe transfers funds on your chosen schedule' },
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
