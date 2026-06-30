'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantName?: string;
}

interface OrderData {
  orderNumber: string;
  items: OrderItem[];
  shipping: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  total: string;
  currency: string;
  shippingMethod: string;
  placedAt: string;
}

function getDeliveryEstimate(country: string, shippingMethod: string): string {
  const now = new Date();
  let days = 5;
  if (shippingMethod.includes('Express') && country === 'United Kingdom') days = 2;
  else if (country === 'United Kingdom') days = 4;
  else if (shippingMethod.includes('Express')) days = 5;
  else days = 12;

  // Skip weekends
  let count = 0;
  const d = new Date(now);
  while (count < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
  }
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£', USD: '$', EUR: '€', CAD: 'CA$', AUD: 'A$', JPY: '¥', SGD: 'S$', INR: '₹',
};

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const orderNum = searchParams.get('order') || '';
  const [order, setOrder] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('velor-last-order');
      if (stored) setOrder(JSON.parse(stored));
    } catch {}
  }, []);

  function copyOrderNumber() {
    navigator.clipboard.writeText(orderNum).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const sym = order ? (CURRENCY_SYMBOLS[order.currency] || '£') : '£';
  const estimate = order ? getDeliveryEstimate(order.shipping.country, order.shippingMethod) : '';

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid #2A2A2A', padding: '0 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 800, color: '#FF6B00', textDecoration: 'none', letterSpacing: '-0.02em' }}>VELOR</Link>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>

        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* Animated checkmark */}
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#00E67622', border: '2px solid #00E676', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Order Confirmed
          </h1>
          <p style={{ color: '#999999', fontSize: 16, margin: '0 0 20px' }}>
            Thank you{order ? `, ${order.shipping.firstName}` : ''}! Your order has been placed and is being prepared.
          </p>

          {/* Order number chip */}
          <button onClick={copyOrderNumber} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
            <span style={{ color: '#999999', fontSize: 13 }}>Order</span>
            <span style={{ color: '#FF6B00', fontSize: 15, fontWeight: 700, letterSpacing: '0.05em' }}>{orderNum || 'VM-XXXXXXX'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={copied ? '#00E676' : '#999999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {copied
                ? <polyline points="20 6 9 17 4 12"/>
                : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>
              }
            </svg>
            <span style={{ color: copied ? '#00E676' : '#999999', fontSize: 12 }}>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Delivery estimate banner */}
        {order && (
          <div style={{ background: '#00E67610', border: '1px solid #00E67640', borderRadius: 10, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <div>
                <div style={{ color: '#00E676', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estimated Delivery</div>
                <div style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>{estimate}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#999999', fontSize: 12 }}>{order.shippingMethod}</div>
              <div style={{ color: '#00E676', fontSize: 13, fontWeight: 600, marginTop: 2 }}>Tracking sent to email</div>
            </div>
          </div>
        )}

        {/* Two-col: items + delivery info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Items */}
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '20px' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Items Ordered</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(order?.items || []).map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={item.image} alt={item.name} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #2A2A2A' }} />
                    <span style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, background: '#FF6B00', color: '#000', fontSize: 10, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    {item.variantName && <div style={{ color: '#999999', fontSize: 11 }}>{item.variantName}</div>}
                  </div>
                  <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{sym}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {!order && (
                <p style={{ color: '#999999', fontSize: 13, textAlign: 'center', margin: '8px 0' }}>No order data found</p>
              )}
            </div>
            {order && (
              <div style={{ borderTop: '1px solid #2A2A2A', marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#999999', fontSize: 13 }}>Total paid</span>
                <span style={{ color: '#FF6B00', fontSize: 16, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>{sym}{order.total} {order.currency}</span>
              </div>
            )}
          </div>

          {/* Delivery details */}
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '20px' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Delivery Details</h3>
            {order ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#999999', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ship to</div>
                  <div style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 1.6 }}>
                    {order.shipping.firstName} {order.shipping.lastName}<br />
                    {order.shipping.address}<br />
                    {order.shipping.city}, {order.shipping.postalCode}<br />
                    {order.shipping.country}
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#999999', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Confirmation sent to</div>
                  <div style={{ color: '#FF6B00', fontSize: 13, fontWeight: 600 }}>{order.shipping.email}</div>
                </div>
                <div>
                  <div style={{ color: '#999999', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Placed at</div>
                  <div style={{ color: '#FFFFFF', fontSize: 13 }}>{new Date(order.placedAt).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </>
            ) : (
              <p style={{ color: '#999999', fontSize: 13 }}>Order details unavailable</p>
            )}
          </div>
        </div>

        {/* What happens next */}
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '20px 24px', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>What Happens Next</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            {[
              { step: '1', icon: '✓', label: 'Order confirmed', desc: 'Just now', done: true },
              { step: '2', icon: '📦', label: 'Processing', desc: 'Within 1 hour', done: false },
              { step: '3', icon: '🚚', label: 'Dispatched', desc: 'Same day if before 3pm', done: false },
              { step: '4', icon: '🏠', label: 'Delivered', desc: estimate, done: false },
            ].map(({ step, icon, label, desc, done }) => (
              <div key={step} style={{ textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: done ? '#00E67622' : '#2A2A2A', border: `1px solid ${done ? '#00E676' : '#3A3A3A'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 16 }}>
                  {done ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <span>{icon}</span>}
                </div>
                <div style={{ color: done ? '#00E676' : '#FFFFFF', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div style={{ color: '#999999', fontSize: 11, lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: '#FF6B00', color: '#000000', borderRadius: 8, textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>
            Continue Shopping
          </Link>
          <Link href="/dashboard" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: 'transparent', color: '#FFFFFF', border: '1px solid #2A2A2A', borderRadius: 8, textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 600, textAlign: 'center' }}>
            Track My Order
          </Link>
        </div>

        {/* Help strip */}
        <div style={{ marginTop: 24, padding: '16px', background: '#111111', borderRadius: 8, textAlign: 'center' }}>
          <span style={{ color: '#999999', fontSize: 13 }}>Need help? </span>
          <Link href="/contact" style={{ color: '#FF6B00', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Contact our support team</Link>
          <span style={{ color: '#999999', fontSize: 13 }}> — we typically respond within 2 hours.</span>
        </div>
      </div>
    </div>
  );
}
