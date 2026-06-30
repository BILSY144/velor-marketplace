'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface OrderData {
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingAddress?: {
    name: string;
    line1: string;
    city: string;
    country: string;
  };
}

function getDeliveryDate(): string {
  const date = new Date();
  let daysAdded = 0;
  while (daysAdded < 5) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) daysAdded++;
  }
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency.toUpperCase() }).format(amount);
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const deliveryDate = getDeliveryDate();

  useEffect(() => {
    const orderParam = searchParams.get('order');
    if (orderParam) {
      try {
        setOrder(JSON.parse(decodeURIComponent(orderParam)));
        return;
      } catch {}
    }
    const stored = localStorage.getItem('velor-last-order');
    if (stored) {
      try { setOrder(JSON.parse(stored)); } catch {}
    }
  }, [searchParams]);

  if (!order) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999999', fontFamily: 'Inter, sans-serif' }}>Loading order details...</p>
      </div>
    );
  }

  const currency = order.currency || 'usd';

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Success Icon */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: '#00E676', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
          Order Confirmed
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#999999', margin: 0 }}>
          Thank you! Your order <strong style={{ color: '#FF6B00' }}>#{order.orderNumber}</strong> is confirmed.
        </p>
      </div>

      {/* Delivery Estimate */}
      <div style={{
        background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px',
        padding: '20px 24px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="#00E676" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="5.5" cy="18.5" r="1.5" stroke="#00E676" strokeWidth="1.5"/>
            <circle cx="18.5" cy="18.5" r="1.5" stroke="#00E676" strokeWidth="1.5"/>
          </svg>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999999', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Estimated Delivery
            </p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 700, color: '#00E676', margin: 0 }}>
              {deliveryDate}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px' }}>
          Order Summary
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#FFFFFF', margin: '0 0 2px' }}>{item.name}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999999', margin: 0 }}>Qty: {item.quantity}</p>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#FFFFFF', margin: 0, fontWeight: 600 }}>
                {formatCurrency(item.price * item.quantity, currency)}
              </p>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #2A2A2A', marginTop: '16px', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#999999' }}>Shipping</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00E676' }}>Free</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Total</span>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#FF6B00' }}>
              {formatCurrency(order.total, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px' }}>
            Shipping To
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#999999', margin: 0, lineHeight: 1.6 }}>
            {order.shippingAddress.name}<br />
            {order.shippingAddress.line1}<br />
            {order.shippingAddress.city}<br />
            {order.shippingAddress.country}
          </p>
        </div>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <a
          href="/"
          style={{
            flex: 1, display: 'block', textAlign: 'center', padding: '14px',
            background: '#FF6B00', color: '#FFFFFF', borderRadius: '8px',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700,
            textDecoration: 'none'
          }}
        >
          Continue Shopping
        </a>
        <a
          href="/dashboard/orders"
          style={{
            flex: 1, display: 'block', textAlign: 'center', padding: '14px',
            background: 'transparent', color: '#FFFFFF', borderRadius: '8px',
            border: '1px solid #2A2A2A',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700,
            textDecoration: 'none'
          }}
        >
          View Orders
        </a>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D' }}>
      <Suspense fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#999999', fontFamily: 'Inter, sans-serif' }}>Loading...</p>
        </div>
      }>
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}
