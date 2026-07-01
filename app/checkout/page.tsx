'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#FFFFFF',
      fontFamily: 'Inter, sans-serif',
      fontSize: '15px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#555555' },
    },
    invalid: { color: '#FF1744' },
  },
};

const CURRENCY_MAP: Record<string, { code: string; symbol: string }> = {
  GB: { code: 'GBP', symbol: '£' },
  US: { code: 'USD', symbol: '$' },
  CA: { code: 'CAD', symbol: 'CA$' },
  AU: { code: 'AUD', symbol: 'A$' },
  NZ: { code: 'NZD', symbol: 'NZ$' },
  EU: { code: 'EUR', symbol: '€' },
  DE: { code: 'EUR', symbol: '€' },
  FR: { code: 'EUR', symbol: '€' },
  ES: { code: 'EUR', symbol: '€' },
  IT: { code: 'EUR', symbol: '€' },
  NL: { code: 'EUR', symbol: '€' },
  CH: { code: 'CHF', symbol: 'CHF' },
  SE: { code: 'SEK', symbol: 'kr' },
  NO: { code: 'NOK', symbol: 'kr' },
  DK: { code: 'DKK', symbol: 'kr' },
  JP: { code: 'JPY', symbol: '¥' },
  SG: { code: 'SGD', symbol: 'S$' },
  HK: { code: 'HKD', symbol: 'HK$' },
  AE: { code: 'AED', symbol: 'AED' },
  IN: { code: 'INR', symbol: '₹' },
  BR: { code: 'BRL', symbol: 'R$' },
  MX: { code: 'MXN', symbol: 'MX$' },
  ZA: { code: 'ZAR', symbol: 'R' },
};

const COUNTRY_CODES: Record<string, string> = {
  'United Kingdom': 'GB',
  'United States': 'US',
  'Canada': 'CA',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Germany': 'DE',
  'France': 'FR',
  'Spain': 'ES',
  'Italy': 'IT',
  'Netherlands': 'NL',
  'Switzerland': 'CH',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Japan': 'JP',
  'Singapore': 'SG',
  'Hong Kong': 'HK',
  'UAE': 'AE',
  'India': 'IN',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'South Africa': 'ZA',
  'Ireland': 'IE',
  'Belgium': 'BE',
  'Portugal': 'PT',
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantName?: string;
  sellerId?: string;
}

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
}

interface FormErrors {
  [key: string]: string;
}

interface DiscountResult {
  valid: boolean;
  discountId?: string;
  code?: string;
  type?: 'PERCENTAGE' | 'FIXED';
  value?: number;
  discountAmount?: number;
  description?: string;
  error?: string;
}

function CheckoutContent() {
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [shipping, setShipping] = useState<ShippingForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
  });

  const [cardName, setCardName] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  // Discount code state
  const [discountInput, setDiscountInput] = useState('');
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('velor-cart');
      if (stored) setCartItems(JSON.parse(stored));
    } catch {}
  }, []);

  const countryCode = COUNTRY_CODES[shipping.country] ?? 'GB';
  const currency = CURRENCY_MAP[countryCode] ?? CURRENCY_MAP['GB'];
  const isUK = countryCode === 'GB';

  const shippingCost = isUK
    ? shippingMethod === 'express' ? 4.99 : 0
    : shippingMethod === 'express' ? 14.99 : 7.99;

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = discountResult?.valid ? (discountResult.discountAmount ?? 0) : 0;
  const total = Math.max(0, subtotal + shippingCost - discountAmount);

  const handleApplyDiscount = useCallback(async () => {
    if (!discountInput.trim()) return;
    setApplyingDiscount(true);
    setDiscountResult(null);
    try {
      const sellerId = cartItems.find(i => i.sellerId)?.sellerId;
      const res = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountInput.trim().toUpperCase(),
          subtotal,
          sellerId: sellerId ?? null,
        }),
      });
      const data: DiscountResult = await res.json();
      setDiscountResult(data);
    } catch {
      setDiscountResult({ valid: false, error: 'Could not apply discount code. Please try again.' });
    } finally {
      setApplyingDiscount(false);
    }
  }, [discountInput, subtotal, cartItems]);

  const handleRemoveDiscount = () => {
    setDiscountResult(null);
    setDiscountInput('');
  };

  const validateShipping = useCallback(() => {
    const e: FormErrors = {};
    if (!shipping.firstName.trim()) e.firstName = 'Required';
    if (!shipping.lastName.trim()) e.lastName = 'Required';
    if (!shipping.email.trim() || !/^[^@]+@[^@]+.[^@]+$/.test(shipping.email)) e.email = 'Valid email required';
    if (!shipping.address.trim()) e.address = 'Required';
    if (!shipping.city.trim()) e.city = 'Required';
    if (!shipping.postcode.trim()) e.postcode = 'Required';
    return e;
  }, [shipping]);

  const handleShippingNext = () => {
    const e = validateShipping();
    setErrors(e);
    if (Object.keys(e).length === 0) setStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    if (!cardName.trim()) {
      setErrors({ cardName: 'Name on card is required' });
      return;
    }

    setProcessing(true);
    setErrors({});

    try {
      const sellerId = cartItems.find(i => i.sellerId)?.sellerId;
      // Create PaymentIntent
      const piRes = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          currency: 'gbp',
          ...(sellerId ? { sellerId } : {}),
          ...(discountResult?.valid && discountResult.code ? {
            discountCode: discountResult.code,
            discountAmount,
          } : {}),
          items: cartItems.map(i => ({ id: i.id, name: i.name, qty: i.quantity })),
        }),
      });

      if (!piRes.ok) {
        const err = await piRes.json();
        throw new Error(err.error || 'Failed to create payment');
      }

      const { clientSecret } = await piRes.json();

      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardName,
            email: shipping.email,
            address: {
              line1: shipping.address,
              city: shipping.city,
              postal_code: shipping.postcode,
              country: countryCode,
            },
          },
        },
      });

      if (error) throw new Error(error.message ?? 'Payment failed');

      // Order succeeded — save and redirect
      const orderNumber = 'VM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const orderData = {
        orderNumber,
        paymentIntentId: paymentIntent?.id,
        items: cartItems,
        shipping,
        shippingMethod,
        shippingCost,
        subtotal,
        discountCode: discountResult?.valid ? discountResult.code : null,
        discountAmount,
        total,
        currency: currency.code,
        placedAt: new Date().toISOString(),
      };

      localStorage.setItem('velor-last-order', JSON.stringify(orderData));
      localStorage.removeItem('velor-cart');

      window.location.href = '/checkout/confirmation';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      setErrors({ submit: msg });
      setProcessing(false);
    }
  };

  const field = (
    label: string,
    key: keyof ShippingForm,
    placeholder: string,
    type = 'text',
    half = false
  ) => (
    <div style={{ flex: half ? '1 1 calc(50% - 6px)' : '1 1 100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <input
        type={type}
        value={shipping[key]}
        onChange={e => setShipping(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{
          background: '#0D0D0D',
          border: `1px solid ${errors[key] ? '#FF1744' : '#2A2A2A'}`,
          borderRadius: 8,
          padding: '10px 12px',
          color: '#FFFFFF',
          fontSize: 14,
          outline: 'none',
        }}
      />
      {errors[key] && <span style={{ fontSize: 11, color: '#FF1744' }}>{errors[key]}</span>}
    </div>
  );

  const token = currency.symbol;

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>
      {/* Header strip */}
      <div style={{ borderBottom: '1px solid #2A2A2A', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ color: '#FF6B00', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 20, textDecoration: 'none' }}>
          VELOR
        </a>
        <span style={{ color: '#2A2A2A' }}>|</span>
        <span style={{ color: '#999999', fontSize: 14 }}>Secure Checkout</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* Left — form */}
        <div style={{ flex: '1 1 480px' }}>
          {/* Steps */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {(['shipping', 'payment'] as const).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <div style={{ width: 32, height: 1, background: '#2A2A2A' }} />}
                <div
                  onClick={() => s === 'shipping' && step === 'payment' && setStep('shipping')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: s === 'shipping' && step === 'payment' ? 'pointer' : 'default',
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step === s ? '#FF6B00' : '#1A1A1A',
                    border: `1px solid ${step === s ? '#FF6B00' : '#2A2A2A'}`,
                    fontSize: 11, fontWeight: 700, color: step === s ? '#FFFFFF' : '#999999',
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: step === s ? '#FFFFFF' : '#999999', textTransform: 'capitalize' }}>
                    {s}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {step === 'shipping' && (
            <div>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                Delivery Details
              </h2>

              {/* Country */}
              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Country</label>
                <select
                  value={shipping.country}
                  onChange={e => setShipping(p => ({ ...p, country: e.target.value }))}
                  style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 12px', color: '#FFFFFF', fontSize: 14 }}
                >
                  {Object.keys(COUNTRY_CODES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                {field('First Name', 'firstName', 'Jane', 'text', true)}
                {field('Last Name', 'lastName', 'Smith', 'text', true)}
              </div>
              <div style={{ marginBottom: 12 }}>{field('Email', 'email', 'jane@example.com', 'email')}</div>
              <div style={{ marginBottom: 12 }}>{field('Phone', 'phone', '+44 7700 000000', 'tel')}</div>
              <div style={{ marginBottom: 12 }}>{field('Address', 'address', '123 High Street')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                {field('City', 'city', 'London', 'text', true)}
                {field(isUK ? 'Postcode' : 'ZIP / Postal Code', 'postcode', isUK ? 'SW1A 1AA' : '', 'text', true)}
              </div>

              {/* Shipping method */}
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Shipping Method</h3>
              {[
                { id: 'standard', label: isUK ? 'Standard (3-5 days)' : 'Standard (7-14 days)', price: isUK ? 0 : 7.99 },
                { id: 'express', label: isUK ? 'Express (1-2 days)' : 'Express (3-5 days)', price: isUK ? 4.99 : 14.99 },
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setShippingMethod(opt.id as 'standard' | 'express')}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', marginBottom: 8, borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${shippingMethod === opt.id ? '#FF6B00' : '#2A2A2A'}`,
                    background: shippingMethod === opt.id ? 'rgba(255,107,0,0.08)' : '#1A1A1A',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: `2px solid ${shippingMethod === opt.id ? '#FF6B00' : '#2A2A2A'}`,
                      background: shippingMethod === opt.id ? '#FF6B00' : 'transparent',
                    }} />
                    <span style={{ fontSize: 14, color: '#FFFFFF' }}>{opt.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: opt.price === 0 ? '#00E676' : '#FFFFFF' }}>
                    {opt.price === 0 ? 'FREE' : `${token}${opt.price.toFixed(2)}`}
                  </span>
                </div>
              ))}

              <button
                onClick={handleShippingNext}
                style={{
                  width: '100%', padding: '14px', marginTop: 24,
                  background: '#FF6B00', border: 'none', borderRadius: 8,
                  color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                Payment
              </h2>

              {/* Card name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Name on Card
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  placeholder="Jane Smith"
                  style={{
                    width: '100%', background: '#0D0D0D',
                    border: `1px solid ${errors.cardName ? '#FF1744' : '#2A2A2A'}`,
                    borderRadius: 8, padding: '10px 12px',
                    color: '#FFFFFF', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {errors.cardName && <span style={{ fontSize: 11, color: '#FF1744' }}>{errors.cardName}</span>}
              </div>

              {/* Stripe Card Element */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Card Details
                </label>
                <div style={{
                  background: '#0D0D0D', border: '1px solid #2A2A2A',
                  borderRadius: 8, padding: '12px',
                }}>
                  <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
              </div>

              {errors.submit && (
                <div style={{ padding: '12px', background: 'rgba(255,23,68,0.1)', border: '1px solid #FF1744', borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#FF1744' }}>
                  {errors.submit}
                </div>
              )}

              {/* Trust row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                  {
                    svg: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    ),
                    text: '256-bit SSL',
                  },
                  {
                    svg: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                    ),
                    text: '30-Day Returns',
                  },
                  {
                    svg: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    ),
                    text: 'Instant Confirmation',
                  },
                ].map(({ svg, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#999999' }}>
                    {svg}
                    {text}
                  </div>
                ))}
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing || !stripe}
                style={{
                  width: '100%', padding: '15px',
                  background: processing ? '#333333' : '#FF6B00',
                  border: 'none', borderRadius: 8,
                  color: '#FFFFFF', fontSize: 16, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                  transition: 'background 0.2s',
                }}
              >
                {processing ? 'Processing...' : `Pay ${token}${total.toFixed(2)}`}
              </button>

              <button
                onClick={() => setStep('shipping')}
                style={{
                  width: '100%', marginTop: 10, padding: '12px',
                  background: 'transparent', border: '1px solid #2A2A2A',
                  borderRadius: 8, color: '#999999', fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Back to Shipping
              </button>
            </div>
          )}
        </div>

        {/* Right — order summary */}
        <div style={{ flex: '0 0 340px', minWidth: 280 }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 24, position: 'sticky', top: 24 }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              Order Summary
            </h3>

            {cartItems.length === 0 ? (
              <p style={{ color: '#999999', fontSize: 14 }}>Your cart is empty.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  {cartItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', background: '#0D0D0D' }}
                        />
                        <span style={{
                          position: 'absolute', top: -6, right: -6,
                          background: '#FF6B00', color: '#FFFFFF',
                          width: 18, height: 18, borderRadius: '50%',
                          fontSize: 10, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {item.quantity}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </p>
                        {item.variantName && (
                          <p style={{ fontSize: 11, color: '#999999', margin: '2px 0 0' }}>{item.variantName}</p>
                        )}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {token}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Discount code input */}
                <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 16, marginBottom: 4 }}>
                  {discountResult?.valid ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 8 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#00E676', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                          {discountResult.code}
                        </span>
                        <span style={{ fontSize: 11, color: '#00E676', marginLeft: 8 }}>{discountResult.description}</span>
                      </div>
                      <button
                        onClick={handleRemoveDiscount}
                        style={{ background: 'none', border: 'none', color: '#999999', fontSize: 12, cursor: 'pointer', padding: '2px 4px' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={discountInput}
                        onChange={e => setDiscountInput(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleApplyDiscount()}
                        placeholder="Discount code"
                        style={{
                          flex: 1, background: '#0D0D0D', border: '1px solid #2A2A2A',
                          borderRadius: 8, padding: '9px 12px', color: '#FFFFFF', fontSize: 13,
                          outline: 'none', fontFamily: 'monospace', letterSpacing: '0.05em',
                        }}
                      />
                      <button
                        onClick={handleApplyDiscount}
                        disabled={applyingDiscount || !discountInput.trim()}
                        style={{
                          padding: '9px 14px', background: 'transparent',
                          border: '1px solid #FF6B00', borderRadius: 8,
                          color: '#FF6B00', fontSize: 13, fontWeight: 700,
                          cursor: applyingDiscount || !discountInput.trim() ? 'not-allowed' : 'pointer',
                          opacity: applyingDiscount || !discountInput.trim() ? 0.5 : 1,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {applyingDiscount ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {discountResult && !discountResult.valid && (
                    <p style={{ fontSize: 11, color: '#FF1744', margin: '6px 0 0' }}>{discountResult.error}</p>
                  )}
                </div>

                <div style={{ paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#999999' }}>
                    <span>Subtotal</span>
                    <span>{token}{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#00E676' }}>
                      <span>Discount</span>
                      <span>-{token}{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14, color: '#999999' }}>
                    <span>Shipping</span>
                    <span style={{ color: shippingCost === 0 ? '#00E676' : '#FFFFFF' }}>
                      {shippingCost === 0 ? 'FREE' : `${token}${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: '#FF6B00' }}>{token}{total.toFixed(2)}</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#999999', marginTop: 6 }}>
                    Displayed in {currency.code} — charged in GBP
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  );
}
