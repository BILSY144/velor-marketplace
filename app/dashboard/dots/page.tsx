'use client';

// Dots payout setup -- DOTS-rail sellers only (added 2026-07-23, replacing
// Payoneer as the default rail for non-Stripe countries -- see
// lib/payoutRail.ts and lib/dots.ts). Mirrors the Payoneer setup page's
// structure and rail guard: a STRIPE-rail seller who lands here is
// redirected to /dashboard/stripe-connect before anything renders; a
// legacy PAYONEER-rail seller (pre-2026-07-23, not yet self-healed) is
// redirected to /dashboard/payoneer instead. The rail comes live from
// /api/dots/onboard, which resolves it from the seller's country --
// lib/payoutRail.ts, the single source of truth.
//
// HONESTY: while Dots is not yet configured (no DOTS_API_KEY in Vercel --
// William has not created a Dots account yet), the button registers
// interest and says so plainly -- it never claims Dots payouts are live
// before they are.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  STUDIO, StudioPageHead, StudioButton, StudioChip, StudioNotice,
  cardStyle, cardHeadStyle, pageStyle,
} from '@/lib/studio';

export default function DotsSetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingMsg, setPendingMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dots/onboard')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        // Rail guard: a seller on any other rail must never see Dots setup
        // screens -- their payouts run elsewhere.
        if (d?.rail === 'STRIPE') {
          router.replace('/dashboard/stripe-connect');
          return;
        }
        if (d?.rail === 'PAYONEER') {
          router.replace('/dashboard/payoneer');
          return;
        }
        setStatus(d);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [router]);

  async function handleStart() {
    setBusy(true);
    setError('');
    setPendingMsg('');
    try {
      const r = await fetch('/api/dots/onboard', { method: 'POST' });
      const d = await r.json();
      if (r.ok && d.onboardingLink) {
        window.location.href = d.onboardingLink;
        return;
      }
      if (r.ok && d.pending) {
        setPendingMsg(d.message);
      } else {
        setError(d.error || 'Could not start payout setup. Try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setBusy(false);
  }

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
        sub={<>Your payout rail is <b>Dots</b> — resolved from your country, automatically.</>}
      />

      <StudioNotice tone="blue">
        <b>Same rules, different rail.</b> Stripe does not support seller payouts in your country, so
        Velor pays you through Dots instead. Delivery confirmation, hold windows and dispute freezes
        are identical for every seller — only the final transfer method differs.
      </StudioNotice>

      {error && <StudioNotice tone="red">{error}</StudioNotice>}
      {pendingMsg && <StudioNotice tone="orange">{pendingMsg}</StudioNotice>}

      {loading ? (
        <div style={{ color: STUDIO.muted, fontSize: 13 }}>Loading…</div>
      ) : (
        <>
          {status?.onboarded ? (
            <div style={cardStyle({ marginBottom: 14 })}>
              <div style={cardHeadStyle()}>
                <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Dots account</h3>
                <StudioChip tone="good">Linked</StudioChip>
              </div>
              <p style={{ color: STUDIO.muted, fontSize: 13, lineHeight: 1.6, margin: 0, padding: '14px 18px 18px' }}>
                Your earnings are released to your Dots account after each delivery is confirmed
                and the standard hold period passes.
              </p>
            </div>
          ) : (
            <div style={cardStyle({ marginBottom: 14, padding: '20px 22px' })}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Set up your payout account</h3>
              <p style={{ color: STUDIO.muted, fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
                You keep every sale minus your tier&apos;s commission. Setup takes a few minutes on
                Dots&apos; secure site — Velor never sees your bank details. You can sell and earn
                before setup completes: your earnings are held safely and paid out once your account
                is linked.
              </p>
              <StudioButton onClick={handleStart} disabled={busy}>
                {busy ? 'Working…' : status?.configured ? 'Connect payout account' : 'Notify me when ready'}
              </StudioButton>
              {!status?.configured && (
                <p style={{ color: STUDIO.faint, fontSize: 12, margin: '12px 0 0', lineHeight: 1.55 }}>
                  Payout setup for your country is opening soon — registering tells us to
                  prioritise it and to email you the moment it is live.
                </p>
              )}
            </div>
          )}

          <div style={cardStyle({ padding: '20px 22px' })}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>How payouts work</h3>
            {[
              'A customer purchases your product.',
              "Velor deducts your tier's commission (10% Starter, 4% Pro).",
              'Funds are held safely in escrow until delivery is confirmed.',
              'Your share is released to your Dots account — within 15 days for new sellers, 72 hours once trusted. An open return or dispute pauses release.',
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
