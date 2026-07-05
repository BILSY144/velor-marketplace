'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSellerTier, PlanBadge, tierCardStyle } from '@/lib/dashboard-theme';

interface PayoutRecord {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'processing';
  date: string;
  method: string;
}

const payoutHistory: PayoutRecord[] = [];

const COMMISSION: Record<string, number> = { STARTER: 15, PRO: 8, ENTERPRISE: 5 };

function StatusBadge({ status }: { status: PayoutRecord['status'] }) {
  const map = {
    paid: { label: 'Paid', color: 'var(--green)' },
    pending: { label: 'Pending', color: 'var(--accent)' },
    processing: { label: 'Processing', color: 'var(--muted)' },
  };
  const { label, color } = map[status];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>
      {label}
    </span>
  );
}

function WalletIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2h-4a3 3 0 0 0 0 6h4v2a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V7Z" stroke={color} strokeWidth="1.6" />
      <path d="M15 11h4a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v0a1 1 0 0 1 1-1Z" fill={color} />
    </svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" />
      <path d="M12 7v5l3.5 2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TrendUpIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 16l6-6 4 4 8-9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 5h6v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BankIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10h16M4 20h16M6 10v7M10 10v7M14 10v7M18 10v7M12 3l9 5H3l9-5Z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Visual commission ladder — shows the seller exactly where their tier sits
// relative to the other two, and how much lower their rate is than Starter's.
function CommissionLadder({ tier, accentColor }: { tier: string; accentColor: string }) {
  const tiers: Array<{ key: string; label: string }> = [
    { key: 'STARTER', label: 'Starter' },
    { key: 'PRO', label: 'Pro' },
    { key: 'ENTERPRISE', label: 'Enterprise' },
  ];
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
      {tiers.map((t) => {
        const active = t.key === tier;
        const rate = COMMISSION[t.key];
        return (
          <div
            key={t.key}
            style={{
              flex: 1,
              padding: '14px 12px',
              borderRadius: 10,
              textAlign: 'center',
              background: active ? `${accentColor}18` : 'var(--bg)',
              border: active ? `1.5px solid ${accentColor}` : '1px solid var(--border)',
              transform: active ? 'translateY(-3px)' : 'none',
              transition: 'transform 0.15s',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: active ? accentColor : 'var(--muted)', marginBottom: 6 }}>
              {t.label}{active ? ' (you)' : ''}
            </div>
            <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 26, fontWeight: 800, color: active ? accentColor : 'var(--text)' }}>
              {rate}%
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>commission</div>
          </div>
        );
      })}
    </div>
  );
}

// Live, honest math — no fabricated sales figures. The seller enters a
// hypothetical monthly sales volume and instantly sees what they'd pay in
// commission at their tier vs. what Starter sellers pay at 15%.
function SavingsCalculator({ tier, accentColor, theme }: { tier: string; accentColor: string; theme: Parameters<typeof tierCardStyle>[0] }) {
  const [sales, setSales] = useState('1000');
  const parsed = Math.max(0, parseFloat(sales) || 0);
  const myRate = COMMISSION[tier] / 100;
  const starterRate = COMMISSION.STARTER / 100;
  const myCost = parsed * myRate;
  const starterCost = parsed * starterRate;
  const saved = starterCost - myCost;

  return (
    <div style={tierCardStyle(theme, { padding: 24, marginBottom: 24 })}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <TrendUpIcon color={accentColor} />
        <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Commission Savings Calculator
        </h2>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, marginBottom: 18 }}>
        See what your {COMMISSION[tier]}% rate saves you compared to the Starter 15% rate.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Monthly Sales (GBP)
          </label>
          <input
            type="number"
            min="0"
            step="50"
            value={sales}
            onChange={(e) => setSales(e.target.value)}
            style={{
              width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 15,
              fontWeight: 700, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Starter pays</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--muted)', textDecoration: 'line-through', textDecorationColor: 'rgba(255,23,68,0.5)' }}>
              £{starterCost.toFixed(2)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>You pay</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: accentColor }}>
              £{myCost.toFixed(2)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>You keep extra</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>
              +£{Math.max(0, saved).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayoutsPage() {
  const { tier, theme } = useSellerTier();
  const isEnterprise = tier === 'ENTERPRISE';
  const isElevated = tier !== 'STARTER';
  const accentColor = isEnterprise ? '#FFD54A' : isElevated ? '#4FC3F7' : 'var(--accent)';

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const availableBalance = 0;
  const pendingBalance = 0;
  const lifetimeEarnings = 0;

  function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setShowWithdraw(false); setSubmitted(false); setAmount(''); }, 2000);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              Payouts
            </h1>
            <PlanBadge tier={tier} />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
            Track your earnings and withdraw funds
          </p>
        </div>
      </div>

      {isElevated && (
        <div style={tierCardStyle(theme, { padding: '20px 22px', marginBottom: 24, position: 'relative', overflow: 'hidden' })}>
          {isEnterprise && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #FFD54A, #FF6B00)' }} />
          )}
          <div style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            {isEnterprise ? 'Our commission rate — lowest tier available' : 'Our commission rate — lower than Starter'}
          </div>
          <CommissionLadder tier={tier} accentColor={accentColor} />
        </div>
      )}

      {isElevated && <SavingsCalculator tier={tier} accentColor={accentColor} theme={theme} />}

      {/* Balance cards */}
      {isElevated ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={tierCardStyle(theme, { padding: '28px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' })}>
            {isEnterprise && (
              <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,213,74,0.18), transparent 70%)' }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <WalletIcon color={accentColor} />
              <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Available Balance
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 44, fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>
              £{availableBalance.toFixed(2)}
            </div>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={availableBalance === 0}
              style={{
                marginTop: 18, alignSelf: 'flex-start', background: availableBalance > 0 ? accentColor : 'var(--border)',
                color: availableBalance > 0 ? '#000' : 'var(--muted)',
                border: 'none', borderRadius: 8, padding: '11px 22px',
                fontSize: 13, fontWeight: 700, cursor: availableBalance > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              Withdraw Funds
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={tierCardStyle(theme, { padding: '18px 22px', flex: 1 })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <ClockIcon color="var(--accent)" />
                <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Pending
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>
                £{pendingBalance.toFixed(2)}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>Clears 7 days after delivery</div>
            </div>
            <div style={tierCardStyle(theme, { padding: '18px 22px', flex: 1 })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <TrendUpIcon color={accentColor} />
                <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Lifetime Earnings
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>
                £{lifetimeEarnings.toFixed(2)}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>All time total</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '24px' }}>
            <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Available Balance
            </div>
            <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 36, fontWeight: 800, color: 'var(--green)' }}>
              £{availableBalance.toFixed(2)}
            </div>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={availableBalance === 0}
              style={{
                marginTop: 16, background: availableBalance > 0 ? 'var(--accent)' : 'var(--border)',
                color: availableBalance > 0 ? '#000' : 'var(--muted)',
                border: 'none', borderRadius: 8, padding: '10px 20px',
                fontSize: 13, fontWeight: 700, cursor: availableBalance > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              Withdraw Funds
            </button>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '24px' }}>
            <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Pending Balance
            </div>
            <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>
              £{pendingBalance.toFixed(2)}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 16 }}>
              Clears 7 days after order delivery
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '24px' }}>
            <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Lifetime Earnings
            </div>
            <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 36, fontWeight: 800, color: 'var(--text)' }}>
              £{lifetimeEarnings.toFixed(2)}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 16 }}>
              All time total
            </div>
          </div>
        </div>
      )}

      {/* Payout method */}
      <div style={tierCardStyle(theme, { padding: 24, marginBottom: 24 })}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BankIcon color={isElevated ? accentColor : 'var(--text)'} />
            <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Payout Method
            </h2>
          </div>
          <Link href="/dashboard/stripe-connect" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
            Connect Bank Account
          </Link>
        </div>
        <div style={{ padding: '20px', background: 'var(--bg)', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>No payout method connected</div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>Connect a bank account via Stripe to receive payouts</div>
        </div>
      </div>

      {/* Payout history */}
      <div style={tierCardStyle(theme, { overflow: 'hidden' })}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Payout History
          </h2>
        </div>
        {payoutHistory.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>No payouts yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>Payouts will appear here once you start earning</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Reference', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 24px', color: 'var(--muted)', fontSize: 13, fontFamily: 'monospace' }}>{p.id}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--text)', fontSize: 13, fontWeight: 700 }}>£{p.amount.toFixed(2)}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--muted)', fontSize: 13 }}>{p.method}</td>
                  <td style={{ padding: '14px 24px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '14px 24px', color: 'var(--muted)', fontSize: 13 }}>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Withdraw modal */}
      {showWithdraw && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, width: 400, padding: 32 }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ color: 'var(--green)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Withdrawal Initiated</div>
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>Funds will arrive in 1-3 business days.</div>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginTop: 0, marginBottom: 24 }}>
                  Withdraw Funds
                </h2>
                <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Amount (GBP)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={availableBalance}
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                      style={{
                        width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '10px 14px', color: 'var(--text)', fontSize: 14,
                        outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                      Available: £{availableBalance.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" onClick={() => setShowWithdraw(false)} style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit" style={{ flex: 1, background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      Confirm
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
