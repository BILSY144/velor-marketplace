'use client';
import { useState, useEffect } from 'react';

export default function PayoneerSetupPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingMsg, setPendingMsg] = useState('');

  useEffect(() => {
    fetch('/api/payoneer/onboard')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleStart() {
    setBusy(true);
    setError('');
    setPendingMsg('');
    try {
      const r = await fetch('/api/payoneer/onboard', { method: 'POST' });
      const d = await r.json();
      if (r.ok && d.registrationLink) {
        window.location.href = d.registrationLink;
        return;
      }
      if (r.ok && d.pending) {
        setPendingMsg(d.message);
      } else {
        setError(d.error || 'Could not start Payoneer onboarding. Try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#FFFFFF' }}>
        Payout Settings
      </h1>
      <p style={{ color: '#999999', fontSize: 15, marginBottom: 32 }}>
        Stripe does not support payouts in your country, so Velor pays you via Payoneer instead. The payout rules are exactly the same as for every other seller.
      </p>

      {error && (
        <div style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid #FF1744', borderRadius: 8, padding: '12px 16px', color: '#FF1744', fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}
      {pendingMsg && (
        <div style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid #FF6B00', borderRadius: 8, padding: '12px 16px', color: '#FFFFFF', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          {pendingMsg}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#999999', fontSize: 14 }}>Loading...</div>
      ) : (
        <>
          {status?.onboarded ? (
            <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00E676' }} />
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16 }}>Payoneer linked</span>
              </div>
              <p style={{ color: '#999999', fontSize: 14, marginTop: 12, marginBottom: 0 }}>
                Your earnings are released to your Payoneer account after each delivery is confirmed and the standard hold period passes.
              </p>
            </div>
          ) : (
            <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Set Up Payoneer Payouts</h3>
              <p style={{ color: '#999999', fontSize: 14, marginBottom: 20 }}>
                You keep every sale minus your tier&apos;s commission. Setting up takes a few minutes on Payoneer&apos;s secure site -- Velor never sees your bank details. You can sell and earn before setup completes: your earnings are held safely and paid out once your account is linked.
              </p>
              <button
                onClick={handleStart}
                disabled={busy}
                style={{ background: '#FF6B00', border: 'none', borderRadius: 8, padding: '13px 24px', color: '#FFFFFF', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}
              >
                {busy ? 'Working...' : status?.configured ? 'Connect with Payoneer' : 'Notify me when ready'}
              </button>
              {!status?.configured && (
                <p style={{ color: '#666666', fontSize: 12, marginTop: 12, marginBottom: 0 }}>
                  Payoneer onboarding for your country is opening soon -- registering tells us to prioritise it and to email you the moment it is live.
                </p>
              )}
            </div>
          )}

          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>How payouts work</h3>
            {[
              { step: '1', text: 'A customer purchases your product' },
              { step: '2', text: "Velor deducts your tier's commission (10% Starter, 4% Pro, 0% Enterprise)" },
              { step: '3', text: 'Funds are held safely until the buyer confirms delivery' },
              { step: '4', text: 'Your share is released to your Payoneer account -- within 15 days for new sellers, 72 hours once trusted' },
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
