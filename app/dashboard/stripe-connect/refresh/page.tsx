'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function StripeConnectRefresh() {
  const router = useRouter();
  useEffect(() => {
    fetch('/api/stripe/connect')
      .then(r => r.json())
      .then(d => {
        if (d.onboardingUrl) window.location.href = d.onboardingUrl;
        else router.replace('/dashboard/stripe-connect');
      })
      .catch(() => router.replace('/dashboard/stripe-connect'));
  }, [router]);
  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#999999', fontSize: 15 }}>Refreshing your onboarding link...</p>
    </div>
  );
}
