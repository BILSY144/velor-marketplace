'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SellerAgreementGate({ children }: { children: React.ReactNode }) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const val = localStorage.getItem('velor-seller-agreement-accepted');
    setAccepted(!!val);
  }, []);

  if (accepted === null) return null;

  if (accepted) return <>{children}</>;

  function handleAccept() {
    if (!checked) return;
    localStorage.setItem('velor-seller-agreement-accepted', new Date().toISOString());
    setAccepted(true);
  }

  return (
    <>
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true">
        {children}
      </div>

      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,13,13,0.92)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          background: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          overflow: 'hidden',
        }}>

          <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid #2A2A2A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#FF6B00',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                fontSize: '14px',
                color: '#FFFFFF',
                flexShrink: 0,
              }}>V</div>
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                color: '#FF6B00',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}>Velor Marketplace</span>
            </div>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 800,
              fontSize: '26px',
              color: '#FFFFFF',
              marginBottom: '8px',
            }}>
              Before you start selling
            </h2>
            <p style={{ color: '#999999', fontSize: '15px', lineHeight: 1.6 }}>
              Please read and accept the Velor Seller Agreement to access your dashboard.
            </p>
          </div>

          <div style={{
            height: '300px',
            overflowY: 'auto',
            padding: '24px 32px',
            borderBottom: '1px solid #2A2A2A',
          }}>
            <p style={{
              color: '#999999',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              Key Terms Summary
            </p>

            <GateRule title="Commission & Fees">
              Velor charges commission on every completed sale, based on your subscription tier: 10% on Starter (free), 4% on Pro (£49/month), applied to the total price including VAT. No listing fees, ever.
            </GateRule>
            <GateRule title="Permitted Categories Only">
              You may list products in any of Velor's current marketplace categories: Electronics, Fashion, Home & Garden, Beauty & Health, Sports & Outdoors, Jewellery & Watches, Toys & Games, Baby & Kids, Pet Supplies, Automotive, Books & Education, Art, Crafts & Handmade, Musical Instruments, Office & Stationery, Travel & Luggage, Specialty & Gourmet Foods, and Fitness & Gym. No age-restricted products.
            </GateRule>
            <GateRule title="Prohibited Items — Strict Policy">
              Prohibited: clothing, shoes, supplements, counterfeit goods, products without UK CE/UKCA marking, weapons, adult content, or any item illegal in the UK. Violations result in immediate removal and may cause permanent account suspension.
            </GateRule>
            <GateRule title="30-Day Returns Obligation">
              You must honour Velor&apos;s 30-day returns policy on all listings. Buyers have statutory rights under the Consumer Contracts Regulations 2013. You are responsible for return costs unless the buyer is at fault.
            </GateRule>
            <GateRule title="UK Legal Compliance — Your Responsibility">
              You are solely responsible for VAT registration (threshold: £90,000/year), Consumer Rights Act 2015, General Product Safety Regulations 2005, and UK GDPR compliance. Velor does not collect tax on your behalf.
            </GateRule>
            <GateRule title="Prohibited Conduct">
              No off-platform transactions to avoid commission, no fake reviews, no use of buyer data for marketing, no impersonation. Violations result in immediate suspension.
            </GateRule>
            <GateRule title="Account Suspension">
              Velor may suspend or terminate your account for breach of this Agreement, excessive complaints, or chargebacks exceeding 2% of orders in any 30-day period.
            </GateRule>
            <GateRule title="Governing Law">
              This Agreement is governed by the laws of England and Wales.
            </GateRule>
          </div>

          <div style={{ padding: '24px 32px 32px' }}>
            <Link
              href="/seller-agreement"
              target="_blank"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#FF6B00',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                marginBottom: '20px',
              }}
            >
              Read the full Seller Agreement &#8599;
            </Link>

            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              marginBottom: '20px',
            }}>
              <div
                onClick={() => setChecked(c => !c)}
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') setChecked(c => !c); }}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: checked ? '2px solid #FF6B00' : '2px solid #444444',
                  background: checked ? '#FF6B00' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {checked && (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l3.5 3.5L11 1" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ color: '#CCCCCC', fontSize: '14px', lineHeight: 1.5 }}>
                I have read and agree to the <strong style={{ color: '#FFFFFF' }}>Velor Seller Agreement</strong>
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!checked}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                border: 'none',
                background: checked ? '#FF6B00' : '#2A2A2A',
                color: checked ? '#FFFFFF' : '#666666',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '16px',
                cursor: checked ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s, color 0.15s',
                letterSpacing: '0.5px',
              }}
            >
              Accept &amp; Continue
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

function GateRule({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{title}</p>
      <p style={{ color: '#999999', fontSize: '13px', lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}
