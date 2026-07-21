'use client';

// ============================================================
// SELLER STUDIO Payouts (2026-07-21) -- rebuilt in the approved
// Studio design. Every figure live from /api/dashboard/payouts;
// Stripe account state read from the SAME live endpoint Payout
// Setup uses (never the stored stripeOnboarded flag -- the two
// pages must never disagree). Rail-aware end to end: the page
// explains and links only the payment system that is correct
// for the seller's country. There is no manual withdrawal step
// anywhere on this platform -- copy says so plainly.
// ============================================================

import { useState, useEffect } from 'react';
import { useSellerTier } from '@/lib/dashboard-theme';
import {
  STUDIO, StudioPageHead, StudioButton, StudioChip, StudioNotice, StudioKpi,
  cardStyle, cardHeadStyle, pageStyle, tableThStyle, tableTdStyle, inputStyle, ChipTone,
} from '@/lib/studio';
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay';

interface PayoutRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  method: string;
}

interface PayoutsSummary {
  payoutRail: 'STRIPE' | 'PAYONEER';
  stripeOnboarded: boolean;
  payoneerConfigured: boolean;
  payoneerLinked: boolean;
  pendingEscrow: number;
  pendingOrderCount: number;
  lifetimePaidOut: number;
  isTrusted: boolean;
  holdLabel: string;
  history: PayoutRecord[];
}

const COMMISSION: Record<string, number> = { STARTER: 10, PRO: 4 };

function statusTone(status: string): { label: string; tone: ChipTone } {
  // Payout.status is a free-form string in the schema; unknown values fall
  // back to a neutral chip instead of crashing.
  switch (status) {
    case 'paid': return { label: 'Paid', tone: 'good' };
    case 'pending': return { label: 'Pending', tone: 'escrow' };
    case 'processing': return { label: 'Processing', tone: 'blue' };
    default: return { label: status || 'Unknown', tone: 'neutral' };
  }
}

export default function PayoutsPage() {
  const { tier } = useSellerTier();
  const isPro = tier === 'PRO';

  const { displayCurrency, symbol, convert } = useCurrencyDisplay();
  function fmtMoney(gbpAmount: number): string {
    const converted = convert(gbpAmount, 'GBP');
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: displayCurrency }).format(converted);
    } catch {
      return `${symbol}${converted.toFixed(2)}`;
    }
  }

  const [data, setData] = useState<PayoutsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeLive, setStripeLive] = useState<{ accountExists: boolean; enabled: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboard/payouts')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setData(d);
        // Only STRIPE-rail sellers need the live Stripe account check; a
        // Payoneer-rail seller's Stripe state is irrelevant by definition.
        if (d.payoutRail === 'STRIPE') {
          fetch('/api/stripe/connect/account')
            .then((r) => (r.ok ? r.json() : null))
            .then((a) => {
              if (!cancelled && a) {
                setStripeLive({
                  accountExists: Boolean(a.connected),
                  enabled: Boolean(a.chargesEnabled && a.payoutsEnabled),
                });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const rail = data?.payoutRail ?? null;
  const railName = rail === 'PAYONEER' ? 'Payoneer' : 'Stripe Connect';
  const setupHref = rail === 'PAYONEER' ? '/dashboard/payoneer' : '/dashboard/stripe-connect';
  const pendingEscrow = data?.pendingEscrow ?? 0;
  const pendingOrderCount = data?.pendingOrderCount ?? 0;
  const lifetimePaidOut = data?.lifetimePaidOut ?? 0;
  const holdLabel = data?.holdLabel ?? '15 days';
  const payoutHistory = data?.history ?? [];

  // Method card state, rail-aware, live Stripe state winning over stored.
  let methodTitle = 'No payout method connected';
  let methodSub = 'Connect your account to receive your earnings.';
  let methodTone: ChipTone = 'neutral';
  let methodChip = 'Not connected';
  let methodAction = 'Set up';

  if (rail === 'STRIPE' && data) {
    const enabled = stripeLive ? stripeLive.enabled : data.stripeOnboarded;
    const started = stripeLive?.accountExists ?? data.stripeOnboarded;
    if (enabled) {
      methodTitle = 'Stripe Connect linked';
      methodSub = 'Your earnings release here automatically once each order clears its hold window.';
      methodTone = 'good'; methodChip = 'Active'; methodAction = 'Manage';
    } else if (started) {
      methodTitle = 'Stripe setup incomplete';
      methodSub = 'Your Stripe account exists but needs a few more details before payouts can be enabled.';
      methodTone = 'escrow'; methodChip = 'Action needed'; methodAction = 'Complete setup';
    }
  } else if (rail === 'PAYONEER' && data) {
    if (data.payoneerLinked) {
      methodTitle = 'Payoneer registration sent';
      methodSub = 'Complete verification on Payoneer’s site to start receiving payouts. Held earnings release automatically once you do.';
      methodTone = 'blue'; methodChip = 'In progress'; methodAction = 'Manage';
    } else if (data.payoneerConfigured) {
      methodTitle = 'Payoneer available for your country';
      methodSub = 'Set up takes a few minutes on Payoneer’s secure site.';
      methodTone = 'neutral'; methodChip = 'Not linked'; methodAction = 'Set up Payoneer';
    } else {
      methodTitle = 'Payoneer is being set up for your country';
      methodSub = 'Your earnings are held safely and released as soon as your Payoneer onboarding opens. We will email you the moment it is ready.';
      methodTone = 'escrow'; methodChip = 'Coming soon'; methodAction = 'View details';
    }
  }

  return (
    <div style={pageStyle()}>
      <StudioPageHead
        kicker="Money"
        title="Payouts"
        sub={
          rail
            ? <>Your payout rail is <b>{railName}</b> — resolved from your country, automatically. Payouts release on their own; there is no manual withdrawal step.</>
            : 'Track your earnings — payouts release automatically.'
        }
        actions={<StudioButton variant="ghost" href={setupHref}>Payout setup</StudioButton>}
      />

      {rail && (
        <StudioNotice tone="blue">
          <b>Why {railName}?</b> Velor pays sellers through Stripe Connect in the countries Stripe
          supports, and Payoneer everywhere else. Your country decides the rail — there is nothing to
          choose and no way to pick the wrong one. Escrow rules are identical on both rails: funds
          release after delivery is confirmed plus your hold window, and an open return or dispute
          pauses release.
        </StudioNotice>
      )}

      {/* balance row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 14 }}>
        <StudioKpi
          label="Held in escrow"
          value={loading ? '—' : fmtMoney(pendingEscrow)}
          delta={pendingOrderCount > 0
            ? `${pendingOrderCount} delivered order${pendingOrderCount === 1 ? '' : 's'} awaiting release — automatic, no action needed`
            : 'Releases automatically after delivery — no action needed'}
        />
        <StudioKpi
          label="Hold window"
          value={holdLabel}
          delta={data?.isTrusted ? 'After delivery — trusted seller rate' : 'After delivery — new seller rate'}
        />
        <StudioKpi
          label="Paid out · lifetime"
          value={loading ? '—' : fmtMoney(lifetimePaidOut)}
          delta={`via ${railName}`}
        />
      </div>

      {/* payout method */}
      <div style={cardStyle({ marginBottom: 14 })}>
        <div style={cardHeadStyle()}>
          <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Payout method</h3>
          <StudioChip tone={methodTone}>{methodChip}</StudioChip>
        </div>
        <div style={{ padding: '14px 18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <span aria-hidden style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: rail === 'PAYONEER' ? '#FF4800' : '#635BFF', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: STUDIO.fontDisplay, fontWeight: 700, fontSize: 14,
            }}>
              {rail === 'PAYONEER' ? 'P' : 'S'}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 600, fontSize: 13.5 }}>{methodTitle}</span>
              <span style={{ display: 'block', fontSize: 12, color: STUDIO.muted, lineHeight: 1.5, marginTop: 2 }}>{methodSub}</span>
            </span>
          </div>
          <StudioButton variant="ghost" href={setupHref}>{methodAction}</StudioButton>
        </div>
      </div>

      {/* commission + savings, Pro only (founding sellers are Pro) */}
      {isPro && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 14 }}>
          <div style={cardStyle()}>
            <div style={cardHeadStyle()}>
              <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Your commission rate</h3>
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '14px 18px 18px' }}>
              {(['STARTER', 'PRO'] as const).map((t) => {
                const active = t === tier;
                return (
                  <div key={t} style={{
                    flex: 1, padding: '14px 12px', borderRadius: 10, textAlign: 'center',
                    background: active ? STUDIO.accentSoft : STUDIO.bg,
                    border: active ? `1.5px solid ${STUDIO.accent}` : `1px solid ${STUDIO.border}`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: active ? STUDIO.accent : STUDIO.muted, marginBottom: 6 }}>
                      {t === 'STARTER' ? 'Starter' : 'Pro'}{active ? ' (you)' : ''}
                    </div>
                    <div style={{ fontFamily: STUDIO.fontDisplay, fontSize: 26, fontWeight: 700, color: active ? STUDIO.accent : STUDIO.ink }}>
                      {COMMISSION[t]}%
                    </div>
                    <div style={{ fontSize: 10.5, color: STUDIO.muted, marginTop: 2 }}>commission</div>
                  </div>
                );
              })}
            </div>
          </div>
          <SavingsCalculator tier={tier} />
        </div>
      )}

      {/* history */}
      <div style={cardStyle()}>
        <div style={cardHeadStyle()}>
          <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Payout history</h3>
        </div>
        {payoutHistory.length === 0 ? (
          <div style={{ padding: '34px 18px', textAlign: 'center', color: STUDIO.muted, fontSize: 13 }}>
            {loading ? 'Loading…' : 'No payouts yet — your first release will appear here.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableThStyle}>Reference</th>
                  <th style={tableThStyle}>Amount</th>
                  <th style={tableThStyle}>Method</th>
                  <th style={tableThStyle}>Status</th>
                  <th style={tableThStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((p, idx, arr) => {
                  const st = statusTone(p.status);
                  const td = idx === arr.length - 1 ? { ...tableTdStyle, borderBottom: 'none' } : tableTdStyle;
                  return (
                    <tr key={p.id}>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: STUDIO.muted }}>{p.id}</td>
                      <td style={{ ...td, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtMoney(p.amount)}</td>
                      <td style={td}>{p.method}</td>
                      <td style={td}><StudioChip tone={st.tone}>{st.label}</StudioChip></td>
                      <td style={{ ...td, color: STUDIO.muted, whiteSpace: 'nowrap' }}>{new Date(p.date).toLocaleDateString('en-GB')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Live, honest math — the seller enters a hypothetical monthly sales volume
// and sees their commission vs the Starter 10% rate. No fabricated figures.
function SavingsCalculator({ tier }: { tier: string }) {
  const [sales, setSales] = useState('1000');
  const parsed = Math.max(0, parseFloat(sales) || 0);
  const myRate = (COMMISSION[tier] ?? 10) / 100;
  const starterRate = COMMISSION.STARTER / 100;
  const myCost = parsed * myRate;
  const saved = parsed * starterRate - myCost;

  return (
    <div style={cardStyle()}>
      <div style={cardHeadStyle()}>
        <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Commission savings</h3>
      </div>
      <div style={{ padding: '14px 18px 18px' }}>
        <label style={{ display: 'block', color: STUDIO.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Monthly sales (GBP)
        </label>
        <input
          type="number"
          min="0"
          step="50"
          value={sales}
          onChange={(e) => setSales(e.target.value)}
          style={{ ...inputStyle, maxWidth: 180, fontWeight: 600 }}
        />
        <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: STUDIO.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Starter pays</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: STUDIO.muted, textDecoration: 'line-through' }}>£{(parsed * starterRate).toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: STUDIO.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>You pay</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: STUDIO.accent }}>£{myCost.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: STUDIO.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>You keep extra</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: STUDIO.green }}>+£{Math.max(0, saved).toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
