'use client';

// Stripe Connect payout setup -- STRIPE-rail sellers only. Rebuilt in the
// Seller Studio design (2026-07-21). A PAYONEER-rail seller can never use
// this page: the rail is resolved live from their country server-side and
// they are redirected to /dashboard/payoneer before anything renders.
// Behaviour is otherwise unchanged from the previous version: connect /
// resume onboarding / disconnect against /api/stripe/connect*.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  STUDIO, StudioPageHead, StudioButton, StudioChip, StudioNotice,
  cardStyle, cardHeadStyle, pageStyle,
} from '@/lib/studio';

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
      // Rail guard: sellers in countries Stripe does not support are paid
      // via Payoneer -- same escrow and hold rules, different rail. They
      // must never see Stripe setup screens.
      const railRes = await fetch('/api/payoneer/onboard');
      if (railRes.ok) {
        const rail = await railRes.json();
        if (rail?.rail === 'PAYONEER') {
          router.replace('/dashboard/payoneer');
          return;
        }
      }
    } catch { /* fall through to Stripe status */ }
    await fetchStatus();
  }

  async function fetchStatus() {
    try {
      const r = await fetch('/api/stripe/connect/account');
      const d = await r.json();
      setStatus(d);
    } catch { /* leave null */ }
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

  const stepStyle: React.CSSProperties = { display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' };
  const stepNum: React.CSSProperties = {
    width: 24, height: 24, borderRadius: '50%', background: STUDIO.accentSoft, color: STUDIO.accent,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700,
  };

  return (
    <div style={{ ...pageStyle(), maxWidth: 760 }}>
      <StudioPageHead
        kicker="Money"
        title="Payout setup"
        sub={<>Your payout rail is <b>Stripe Connect</b> — resolved from your country, automatically.</>}
      />

      {error && <StudioNotice tone="red">{error}</StudioNotice>}

      {loading ? (
        <div style={{ color: STUDIO.muted, fontSize: 13 }}>Loading…</div>
      ) : (
        <>
          {isConnected && (
            <div style={cardStyle({ marginBottom: 14 })}>
              <div style={cardHeadStyle()}>
                <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Stripe Connect account</h3>
                <StudioChip tone="good">Fully active</StudioChip>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '14px 18px' }}>
                {[
                  { label: 'Charges', ok: status?.chargesEnabled },
                  { label: 'Payouts', ok: status?.payoutsEnabled },
                  { label: 'Details submitted', ok: status?.detailsSubmitted },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${STUDIO.borderSoft}`,
                    borderRadius: 8, padding: '10px 12px', fontSize: 12.8,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.ok ? STUDIO.green : STUDIO.red, flexShrink: 0 }} />
                    {item.label}
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 18px 16px' }}>
                <StudioButton variant="ghost" onClick={handleDisconnect}>Disconnect</StudioButton>
              </div>
            </div>
          )}

          {status?.needsAccount && (
            <div style={cardStyle({ marginBottom: 14, padding: '20px 22px' })}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Connect with Stripe</h3>
              <p style={{ color: STUDIO.muted, fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
                You keep every sale minus your tier&apos;s commission (10% Starter, 4% Pro). Payouts are
                processed by Stripe — Velor never sees your bank details.
              </p>
              <StudioButton onClick={handleConnect} disabled={connecting}>
                {connecting ? 'Redirecting…' : 'Connect with Stripe'}
              </StudioButton>
            </div>
          )}

          {isIncomplete && (
            <div style={cardStyle({ marginBottom: 14, padding: '20px 22px', borderColor: STUDIO.accentLine })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Setup incomplete</h3>
                <StudioChip tone="escrow">Action needed</StudioChip>
              </div>
              <p style={{ color: STUDIO.muted, fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
                Your Stripe account needs a few more details before payouts can be enabled.
              </p>
              <div style={{ display: 'flex', gap: 9 }}>
                <StudioButton onClick={handleCompleteSetup} disabled={connecting}>
                  {connecting ? 'Redirecting…' : 'Complete setup'}
                </StudioButton>
                <StudioButton variant="ghost" onClick={handleDisconnect}>Disconnect</StudioButton>
              </div>
            </div>
          )}

          <div style={cardStyle({ padding: '20px 22px' })}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>How payouts work</h3>
            {[
              'A customer purchases your product.',
              "Velor deducts your tier's commission (10% Starter, 4% Pro).",
              'Funds are held safely in escrow until delivery is confirmed.',
              'Your share is released to your Stripe account — within 15 days for new sellers, 72 hours once trusted. An open return or dispute pauses release.',
            ].map((text, i) => (
              <div key={i} style={stepStyle}>
                <div style={stepNum}>{i + 1}</div>
                <span style={{ fontSize: 13, color: STUDIO.ink2, paddingTop: 3, lineHeight: 1.55 }}>{text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
