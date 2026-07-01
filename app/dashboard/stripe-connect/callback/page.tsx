'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setFailed(true);
      setErrorMessage(searchParams.get('error_description') || 'Stripe authorization was denied.');
      return;
    }

    if (!code) {
      setFailed(true);
      setErrorMessage('No authorization code received from Stripe.');
      return;
    }

    const exchange = async () => {
      try {
        const res = await fetch('/api/stripe/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'OAuth exchange failed');
        }
        router.replace('/dashboard/stripe-connect');
      } catch (err) {
        setFailed(true);
        setErrorMessage(err instanceof Error ? err.message : 'Connection failed. Please try again.');
      }
    };

    exchange();
  }, [searchParams, router]);

  if (failed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '24px' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,23,68,0.1)', border: '2px solid rgba(255,23,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ fontSize: '28px', color: '#FF1744', lineHeight: '1' }}>&#10005;</span>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px' }}>
            Connection failed
          </h1>
          <p style={{ color: '#999999', fontSize: '15px', margin: '0 0 28px', lineHeight: 1.6 }}>{errorMessage}</p>
          <a
            href="/dashboard/stripe-connect"
            style={{ display: 'inline-block', padding: '12px 28px', background: '#FF6B00', color: '#FFFFFF', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <style>{'@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
        <div style={{ width: '48px', height: '48px', border: '3px solid #2A2A2A', borderTop: '3px solid #FF6B00', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#999999', fontSize: '15px', margin: '0 0 8px' }}>Connecting your Stripe account...</p>
        <p style={{ color: '#666666', fontSize: '13px', margin: 0 }}>You will be redirected automatically.</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999999', fontFamily: 'Inter, sans-serif', fontSize: '15px' }}>Loading...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
