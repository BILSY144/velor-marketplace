'use client';

import { useEffect, useState } from 'react';

interface AccountStatus {
  connected: boolean;
  accountId?: string;
  displayName?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  country?: string;
  email?: string;
}

function ConnectedView({
  status,
  onDisconnect,
  disconnecting,
}: {
  status: AccountStatus;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  return (
    <div>
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '20px', color: '#00E676', lineHeight: '1' }}>&#10003;</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>Connected</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#999999' }}>{status.displayName || status.accountId}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(0,230,118,0.1)', borderRadius: '20px', border: '1px solid rgba(0,230,118,0.2)' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E676' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#00E676' }}>Active</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Account ID', value: status.accountId || '-', color: undefined },
            { label: 'Charges', value: status.chargesEnabled ? 'Enabled' : 'Not enabled', color: status.chargesEnabled ? '#00E676' : '#FF1744' },
            { label: 'Payouts', value: status.payoutsEnabled ? 'Enabled' : 'Pending', color: status.payoutsEnabled ? '#00E676' : '#FF6B00' },
          ].map(item => (
            <div key={item.label} style={{ background: '#0D0D0D', borderRadius: '8px', padding: '12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: item.color || '#FFFFFF', wordBreak: 'break-all' }}>{item.value}</p>
            </div>
          ))}
        </div>
        {!status.detailsSubmitted && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(255,107,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,107,0,0.2)' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#FF6B00' }}>
              Your Stripe account setup is incomplete. Visit your Stripe dashboard to finish providing business details and enable payouts.
            </p>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: '12px 24px', background: '#FF6B00', color: '#FFFFFF', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Open Stripe Dashboard
        </a>
        <button
          onClick={onDisconnect}
          disabled={disconnecting}
          style={{ padding: '12px 24px', background: 'transparent', color: '#999999', border: '1px solid #2A2A2A', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: disconnecting ? 'not-allowed' : 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}
        >
          {disconnecting ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    </div>
  );
}

function DisconnectedView({ oauthUrl }: { oauthUrl: string }) {
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '48px 32px', textAlign: 'center', marginBottom: '24px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#141414', border: '2px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2zm1 17h-2v-2h2v2zm0-4h-2V7h2v8z" fill="#444444"/>
        </svg>
      </div>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px' }}>
        No Stripe account connected
      </h2>
      <p style={{ color: '#999999', fontSize: '14px', margin: '0 0 28px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        Connect your Stripe account to start accepting payments and receiving payouts for your products on Velor Marketplace.
      </p>
      {oauthUrl ? (
        <a
          href={oauthUrl}
          style={{ display: 'inline-block', padding: '14px 36px', background: '#FF6B00', color: '#FFFFFF', borderRadius: '8px', textDecoration: 'none', fontSize: '15px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.02em' }}
        >
          Connect with Stripe
        </a>
      ) : (
        <div style={{ padding: '14px 32px', background: '#2A2A2A', color: '#666666', borderRadius: '8px', display: 'inline-block', fontSize: '14px' }}>
          Stripe Connect not configured — add STRIPE_CLIENT_ID to environment variables
        </div>
      )}
    </div>
  );
}

export default function StripeConnectPage() {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const [accountRes, urlRes] = await Promise.all([
          fetch('/api/stripe/connect/account'),
          fetch('/api/stripe/connect'),
        ]);
        const [accountData, urlData] = await Promise.all([
          accountRes.json(),
          urlRes.json(),
        ]);
        setStatus(accountData);
        if (urlData.url) setOauthUrl(urlData.url);
      } catch {
        setError('Failed to load connection status');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Stripe account? You will stop receiving payouts until you reconnect.')) return;
    setDisconnecting(true);
    try {
      await fetch('/api/stripe/connect/account', { method: 'DELETE' });
      setStatus({ connected: false });
    } catch {
      setError('Failed to disconnect. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', color: '#999999', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '720px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px' }}>
          Stripe Connect
        </h1>
        <p style={{ color: '#999999', fontSize: '15px', margin: 0, lineHeight: 1.6 }}>
          Connect your Stripe account to receive payouts for your sales on Velor Marketplace.
        </p>
      </div>
      {error && (
        <div style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#FF1744', fontSize: '14px' }}>
          {error}
        </div>
      )}
      {status?.connected ? (
        <ConnectedView status={status} onDisconnect={handleDisconnect} disconnecting={disconnecting} />
      ) : (
        <DisconnectedView oauthUrl={oauthUrl} />
      )}
      <div style={{ marginTop: '40px', padding: '24px', background: '#1A1A1A', borderRadius: '12px', border: '1px solid #2A2A2A' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 20px' }}>
          How payouts work
        </h2>
        {[
          { step: '1', title: 'Customer places an order', desc: 'Stripe collects payment from the buyer at checkout.' },
          { step: '2', title: 'Platform fee deducted', desc: 'Velor retains a 15% commission on every sale.' },
          { step: '3', title: 'You receive the rest', desc: '85% of the sale amount is transferred to your Stripe account automatically.' },
          { step: '4', title: 'Stripe pays out to your bank', desc: 'Stripe deposits funds to your linked bank account on your chosen schedule.' },
        ].map(item => (
          <div key={item.step} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B00' }}>{item.step}</span>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>{item.title}</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#999999', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
