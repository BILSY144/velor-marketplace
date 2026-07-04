'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PayoutRecord {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'processing';
  date: string;
  method: string;
}

const payoutHistory: PayoutRecord[] = [];

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

export default function PayoutsPage() {
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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Payouts
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
          Track your earnings and withdraw funds
        </p>
      </div>

      {/* Balance cards */}
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

      {/* Payout method */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Payout Method
          </h2>
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
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
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
