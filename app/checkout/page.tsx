'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Currency config: symbol, rate from USD, name
const CURRENCIES: Record<string, { symbol: string; rate: number; name: string }> = {
  GBP: { symbol: '£', rate: 1,      name: 'British Pound'  },
  USD: { symbol: '$', rate: 1.27,   name: 'US Dollar'      },
  EUR: { symbol: '€', rate: 1.17,   name: 'Euro'           },
  CAD: { symbol: 'CA$', rate: 1.72, name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', rate: 1.93,  name: 'Australian Dollar'},
  JPY: { symbol: '¥', rate: 200,    name: 'Japanese Yen'   },
  SGD: { symbol: 'S$', rate: 1.71,  name: 'Singapore Dollar'},
  INR: { symbol: '₹', rate: 105,    name: 'Indian Rupee'   },
};

const COUNTRIES = [
  'United Kingdom','United States','Canada','Australia','Germany','France',
  'Japan','Singapore','India','Netherlands','Sweden','Norway','Denmark',
  'Spain','Italy','Portugal','Poland','Brazil','Mexico','South Korea',
  'New Zealand','Ireland','Belgium','Switzerland','Austria',
];

const SHIPPING_OPTIONS: Record<string, { label: string; days: string; price: number }[]> = {
  'United Kingdom': [
    { label: 'Standard Delivery', days: '3–5 business days', price: 0 },
    { label: 'Express Delivery', days: '1–2 business days', price: 4.99 },
  ],
  default: [
    { label: 'Standard International', days: '7–14 business days', price: 9.99 },
    { label: 'Express International', days: '3–5 business days', price: 24.99 },
  ],
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantName?: string;
}

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  state: string;
}

interface PaymentForm {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvc: string;
}

function formatCard(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
}
function formatExpiry(value: string) {
  const v = value.replace(/\D/g, '').slice(0, 4);
  return v.length >= 3 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [currency, setCurrency] = useState('GBP');
  const [selectedShipping, setSelectedShipping] = useState(0);
  const [items, setItems] = useState<CartItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Partial<ShippingForm & PaymentForm>>({});

  const [shipping, setShipping] = useState<ShippingForm>({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', postalCode: '', country: 'United Kingdom', state: '',
  });

  const [payment, setPayment] = useState<PaymentForm>({
    cardNumber: '', cardName: '', expiry: '', cvc: '',
  });

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('velor-cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed.state?.items || []);
      }
    } catch {}
    // Demo: prefill 2 sample items if cart is empty
    setItems(prev => prev.length > 0 ? prev : [
      { id: '1', name: 'Adjustable Dumbbell Set', price: 89.99, quantity: 1, image: 'https://placehold.co/80x80/1A1A1A/999999?text=DB', variantName: '20kg' },
      { id: '2', name: 'Resistance Bands Pack', price: 24.99, quantity: 2, image: 'https://placehold.co/80x80/1A1A1A/999999?text=RB', variantName: 'Medium' },
    ]);
  }, []);

  // Auto-select currency based on country
  useEffect(() => {
    const map: Record<string, string> = {
      'United Kingdom': 'GBP', 'United States': 'USD', 'Canada': 'CAD',
      'Australia': 'AUD', 'Germany': 'EUR', 'France': 'EUR', 'Netherlands': 'EUR',
      'Spain': 'EUR', 'Italy': 'EUR', 'Portugal': 'EUR', 'Belgium': 'EUR',
      'Austria': 'EUR', 'Japan': 'JPY', 'Singapore': 'SGD', 'India': 'INR',
    };
    const c = map[shipping.country];
    if (c) setCurrency(c);
  }, [shipping.country]);

  const cur = CURRENCIES[currency];
  const shippingOpts = SHIPPING_OPTIONS[shipping.country] || SHIPPING_OPTIONS.default;
  const shippingCost = shippingOpts[selectedShipping]?.price ?? 0;

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = (subtotal + shippingCost) * cur.rate;
  const fmt = (n: number) => `${cur.symbol}${(n * cur.rate).toFixed(currency === 'JPY' ? 0 : 2)}`;

  function updateShipping(field: keyof ShippingForm, value: string) {
    setShipping(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validateShipping(): boolean {
    const e: Partial<ShippingForm> = {};
    if (!shipping.firstName.trim()) e.firstName = 'Required';
    if (!shipping.lastName.trim()) e.lastName = 'Required';
    if (!shipping.email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email = 'Valid email required';
    if (!shipping.address.trim()) e.address = 'Required';
    if (!shipping.city.trim()) e.city = 'Required';
    if (!shipping.postalCode.trim()) e.postalCode = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validatePayment(): boolean {
    const e: Partial<PaymentForm> = {};
    if (payment.cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter 16-digit card number';
    if (!payment.cardName.trim()) e.cardName = 'Required';
    if (!payment.expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = 'MM/YY format';
    if (payment.cvc.length < 3) e.cvc = '3 or 4 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleShippingContinue() {
    if (validateShipping()) setStep(2);
  }

  async function handlePlaceOrder() {
    if (!validatePayment()) return;
    setProcessing(true);
    // Simulate payment processing — real Stripe integration wired in Task #142
    await new Promise(r => setTimeout(r, 2000));
    const orderNum = 'VM-' + Math.random().toString(36).slice(2, 9).toUpperCase();
    localStorage.setItem('velor-last-order', JSON.stringify({
      orderNumber: orderNum,
      items,
      shipping,
      total: total.toFixed(2),
      currency,
      shippingMethod: shippingOpts[selectedShipping].label,
      placedAt: new Date().toISOString(),
    }));
    try { localStorage.removeItem('velor-cart'); } catch {}
    router.push(`/checkout/confirmation?order=${orderNum}`);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #2A2A2A', background: '#0D0D0D',
    color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  };
  const errorStyle: React.CSSProperties = { color: '#FF1744', fontSize: 12, marginTop: 4 };
  const labelStyle: React.CSSProperties = { display: 'block', color: '#999999', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid #2A2A2A', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 800, color: '#FF6B00', textDecoration: 'none', letterSpacing: '-0.02em' }}>VELOR</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#999999', fontSize: 13 }}>Secure checkout</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#00E676"><path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0v2z"/></svg>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div style={{ borderBottom: '1px solid #2A2A2A', background: '#111111' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', gap: 0 }}>
          {(['Shipping Details', 'Payment'] as const).map((label, i) => {
            const idx = i + 1;
            const active = step === idx;
            const done = step > idx;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <div style={{ width: 32, height: 1, background: '#2A2A2A', margin: '0 8px' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: done ? 'pointer' : 'default' }} onClick={() => done ? setStep(idx as 1 | 2) : null}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: active ? '#FF6B00' : done ? '#00E676' : '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000000', flexShrink: 0 }}>
                    {done ? '✓' : idx}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#FFFFFF' : done ? '#00E676' : '#999999' }}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

        {/* Left — forms */}
        <div>
          {step === 1 && (
            <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Shipping Details</h2>
                {/* Currency switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#999999', fontSize: 12 }}>Currency:</span>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 12 }}>
                    {Object.entries(CURRENCIES).map(([code, { name }]) => (
                      <option key={code} value={code}>{code} — {name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input style={{ ...inputStyle, borderColor: errors.firstName ? '#FF1744' : '#2A2A2A' }} value={shipping.firstName} onChange={e => updateShipping('firstName', e.target.value)} placeholder="John" />
                  {errors.firstName && <p style={errorStyle}>{errors.firstName}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input style={{ ...inputStyle, borderColor: errors.lastName ? '#FF1744' : '#2A2A2A' }} value={shipping.lastName} onChange={e => updateShipping('lastName', e.target.value)} placeholder="Smith" />
                  {errors.lastName && <p style={errorStyle}>{errors.lastName}</p>}
                </div>
              </div>

              {/* Email + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input style={{ ...inputStyle, borderColor: errors.email ? '#FF1744' : '#2A2A2A' }} value={shipping.email} onChange={e => updateShipping('email', e.target.value)} placeholder="john@example.com" type="email" />
                  {errors.email && <p style={errorStyle}>{errors.email}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Phone (optional)</label>
                  <input style={inputStyle} value={shipping.phone} onChange={e => updateShipping('phone', e.target.value)} placeholder="+44 7700 000000" type="tel" />
                </div>
              </div>

              {/* Country */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Country</label>
                <select style={inputStyle} value={shipping.country} onChange={e => { updateShipping('country', e.target.value); setSelectedShipping(0); }}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Address */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Street Address</label>
                <input style={{ ...inputStyle, borderColor: errors.address ? '#FF1744' : '#2A2A2A' }} value={shipping.address} onChange={e => updateShipping('address', e.target.value)} placeholder="123 Main Street, Apt 4B" />
                {errors.address && <p style={errorStyle}>{errors.address}</p>}
              </div>

              {/* City + Postal + State */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input style={{ ...inputStyle, borderColor: errors.city ? '#FF1744' : '#2A2A2A' }} value={shipping.city} onChange={e => updateShipping('city', e.target.value)} placeholder="London" />
                  {errors.city && <p style={errorStyle}>{errors.city}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Postcode / ZIP</label>
                  <input style={{ ...inputStyle, borderColor: errors.postalCode ? '#FF1744' : '#2A2A2A' }} value={shipping.postalCode} onChange={e => updateShipping('postalCode', e.target.value)} placeholder="SW1A 1AA" />
                  {errors.postalCode && <p style={errorStyle}>{errors.postalCode}</p>}
                </div>
                <div>
                  <label style={labelStyle}>State / County</label>
                  <input style={inputStyle} value={shipping.state} onChange={e => updateShipping('state', e.target.value)} placeholder="England" />
                </div>
              </div>

              {/* Shipping options */}
              <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 24, marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px' }}>Shipping Method</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {shippingOpts.map((opt, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 8, border: `1px solid ${selectedShipping === idx ? '#FF6B00' : '#2A2A2A'}`, background: selectedShipping === idx ? '#FF6B0010' : 'transparent', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="radio" checked={selectedShipping === idx} onChange={() => setSelectedShipping(idx)} style={{ accentColor: '#FF6B00' }} />
                        <div>
                          <div style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                          <div style={{ color: '#999999', fontSize: 12, marginTop: 2 }}>{opt.days}</div>
                        </div>
                      </div>
                      <span style={{ color: opt.price === 0 ? '#00E676' : '#FFFFFF', fontWeight: 700, fontSize: 14 }}>
                        {opt.price === 0 ? 'FREE' : fmt(opt.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={handleShippingContinue} style={{ width: '100%', padding: '16px', background: '#FF6B00', color: '#000000', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.02em' }}>
                Continue to Payment
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Payment</h2>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#FF6B00', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Edit shipping</button>
              </div>

              {/* Shipping summary pill */}
              <div style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#999999' }}>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{shipping.firstName} {shipping.lastName}</span>
                {' · '}{shipping.address}, {shipping.city}, {shipping.postalCode}, {shipping.country}
              </div>

              {/* Card number */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Card Number</label>
                <input style={{ ...inputStyle, borderColor: errors.cardNumber ? '#FF1744' : '#2A2A2A', letterSpacing: '0.1em' }}
                  value={payment.cardNumber}
                  onChange={e => {
                    const v = formatCard(e.target.value);
                    setPayment(prev => ({ ...prev, cardNumber: v }));
                    if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: undefined }));
                  }}
                  placeholder="1234 5678 9012 3456" maxLength={19} />
                {errors.cardNumber && <p style={errorStyle}>{errors.cardNumber}</p>}
              </div>

              {/* Card name */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Name on Card</label>
                <input style={{ ...inputStyle, borderColor: errors.cardName ? '#FF1744' : '#2A2A2A' }}
                  value={payment.cardName}
                  onChange={e => { setPayment(prev => ({ ...prev, cardName: e.target.value })); if (errors.cardName) setErrors(prev => ({ ...prev, cardName: undefined })); }}
                  placeholder="JOHN SMITH" />
                {errors.cardName && <p style={errorStyle}>{errors.cardName}</p>}
              </div>

              {/* Expiry + CVC */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                <div>
                  <label style={labelStyle}>Expiry Date</label>
                  <input style={{ ...inputStyle, borderColor: errors.expiry ? '#FF1744' : '#2A2A2A' }}
                    value={payment.expiry}
                    onChange={e => { const v = formatExpiry(e.target.value); setPayment(prev => ({ ...prev, expiry: v })); if (errors.expiry) setErrors(prev => ({ ...prev, expiry: undefined })); }}
                    placeholder="MM/YY" maxLength={5} />
                  {errors.expiry && <p style={errorStyle}>{errors.expiry}</p>}
                </div>
                <div>
                  <label style={labelStyle}>CVC / CVV</label>
                  <input style={{ ...inputStyle, borderColor: errors.cvc ? '#FF1744' : '#2A2A2A' }}
                    value={payment.cvc}
                    onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,4); setPayment(prev => ({ ...prev, cvc: v })); if (errors.cvc) setErrors(prev => ({ ...prev, cvc: undefined })); }}
                    placeholder="123" maxLength={4} type="password" />
                  {errors.cvc && <p style={errorStyle}>{errors.cvc}</p>}
                </div>
              </div>

              {/* Trust strip */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 24, padding: '12px 0', borderTop: '1px solid #2A2A2A', borderBottom: '1px solid #2A2A2A' }}>
                {['256-bit SSL', 'PCI Compliant', 'Secure Payment'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#00E676"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    <span style={{ color: '#999999', fontSize: 12 }}>{t}</span>
                  </div>
                ))}
              </div>

              <button onClick={handlePlaceOrder} disabled={processing} style={{ width: '100%', padding: '18px', background: processing ? '#553300' : '#FF6B00', color: '#000000', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 800, cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {processing ? (
                  <>
                    <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #FF6B0044', borderTop: '2px solid #FF6B00', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    <span style={{ color: '#FF6B00' }}>Processing...</span>
                  </>
                ) : `Pay ${cur.symbol}${total.toFixed(currency === 'JPY' ? 0 : 2)} ${currency}`}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </div>

        {/* Right — order summary */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: '0 0 20px' }}>Order Summary</h3>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={item.image} alt={item.name} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid #2A2A2A' }} />
                    <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: '#FF6B00', color: '#000', fontSize: 11, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    {item.variantName && <div style={{ color: '#999999', fontSize: 12 }}>{item.variantName}</div>}
                  </div>
                  <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input style={{ ...inputStyle, flex: 1, padding: '9px 12px' }} placeholder="Promo code" />
              <button style={{ padding: '9px 16px', background: '#2A2A2A', color: '#FFFFFF', border: '1px solid #3A3A3A', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>Apply</button>
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: '#999999', fontSize: 14 }}>Subtotal</span>
                <span style={{ color: '#FFFFFF', fontSize: 14 }}>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: '#999999', fontSize: 14 }}>Shipping</span>
                <span style={{ color: shippingCost === 0 ? '#00E676' : '#FFFFFF', fontSize: 14, fontWeight: shippingCost === 0 ? 700 : 400 }}>
                  {shippingCost === 0 ? 'FREE' : fmt(shippingCost)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2A2A2A', paddingTop: 14, marginTop: 4 }}>
                <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>Total</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#FF6B00', fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>
                    {cur.symbol}{total.toFixed(currency === 'JPY' ? 0 : 2)}
                  </div>
                  <div style={{ color: '#999999', fontSize: 11 }}>{currency} · incl. tax</div>
                </div>
              </div>
            </div>

            {/* Guarantee strip */}
            <div style={{ marginTop: 20, padding: '14px 16px', background: '#0D0D0D', borderRadius: 8, border: '1px solid #2A2A2A' }}>
              {[
                { icon: '🔒', text: 'Secure 256-bit encryption' },
                { icon: '↩', text: '30-day hassle-free returns' },
                { icon: '⚡', text: 'Same-day dispatch on orders before 3pm' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ color: '#999999', fontSize: 12 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
