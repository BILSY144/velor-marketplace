'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export default function StripeConnectReturn() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stripe/connect/account')
      .then(r => r.json())
      .then(d => { setStatus(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center' }}>
        {loading ? (
          <p style={{ color: '#999999' }}>Verifying your account...</p>
        ) : status?.chargesEnabled && status?.payoutsEnabled ? (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,230,118,0.1)', border: '2px solid #00E676', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>Payouts Active</h1>
            <p style={{ color: '#999999', fontSize: 15, marginBottom: 32 }}>Your Stripe account is connected. You will receive 85% of every sale automatically.</p>
            <Link href="/dashboard/stripe-connect" style={{ display: 'inline-block', background: '#FF6B00', color: '#FFFFFF', textDecoration: 'none', borderRadius: 8, padding: '12px 24px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15 }}>
              View Payout Settings
            </Link>
          </>
        ) : (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,107,0,0.1)', border: '2px solid #FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>Almost There</h1>
            <p style={{ color: '#999999', fontSize: 15, marginBottom: 32 }}>Your setup is in progress. A few more details may be needed before payouts are enabled.</p>
            <Link href="/dashboard/stripe-connect" style={{ display: 'inline-block', background: '#FF6B00', color: '#FFFFFF', textDecoration: 'none', borderRadius: 8, padding: '12px 24px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15 }}>
              Continue Setup
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
