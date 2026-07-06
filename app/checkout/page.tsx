'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const CURRENCIES: Record<string, string> = {
  GB: 'GBP', US: 'USD', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', AT: 'EUR', SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF',
  AU: 'AUD', CA: 'CAD', JP: 'JPY', SG: 'SGD', AE: 'AED', CN: 'CNY',
}

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' }, { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' }, { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' }, { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' }, { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' }, { code: 'AE', name: 'UAE' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'IN', name: 'India' },
]

interface CartItem {
  productId: string; name: string; price: number; quantity: number;
  image: string; sellerId?: string;
}
interface ShippingRate {
  rateId: string; carrier: string; service: string;
  amount: number; currency: string; estimatedDays: number | null;
  isDDP: boolean;
}
interface LandedCost {
  dutyAmountGBP: number; vatAmountGBP: number; totalTaxGBP: number;
  belowDeMinimis: boolean; deMinimisGBP: number; isDomestic: boolean;
}
interface AppliedAutoDiscount {
  discountId: string
  code: string
  amountGBP: number
  description: string
}
interface AutoDiscountResult {
  totalDiscountGBP: number
  applied: AppliedAutoDiscount[]
}
interface ConfirmedBreakdown {
  currency: string
  productSubtotal: number
  shippingCost: number
  dutiesAmount: number
  discountAmount: number
  discountCodes: string[]
  total: number
}

function useCartItems(): { items: CartItem[]; removeItem: (productId: string) => void } {
  const [items, setItems] = useState<CartItem[]>([])
  useEffect(() => {
    try {
      const stored = localStorage.getItem('velor-cart')
      const parsed = stored ? JSON.parse(stored) : { state: { items: [] } }
      setItems(parsed?.state?.items ?? [])
    } catch { setItems([]) }
  }, [])
  const removeItem = (productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId)
      try { localStorage.setItem('velor-cart', JSON.stringify({ state: { items: next } })) } catch {}
      return next
    })
  }
  return { items, removeItem }
}

function CheckoutForm({ clientSecret, total, currency, onSuccess }: {
  clientSecret: string; total: number; currency: string; onSuccess: () => void;
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [err, setErr] = useState('')

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setErr('')
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/checkout/confirmation' },
    })
    if (error) setErr(error.message ?? 'Payment failed')
    setPaying(false)
  }

  const fmt = (val: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(val)

  return (
    <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PaymentElement />
      {err && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px' }}>
          {err}
        </div>
      )}
      <button type="submit" disabled={!stripe || paying} style={{
        padding: '14px', background: paying ? 'var(--border)' : 'var(--accent)',
        color: '#fff', border: 'none', borderRadius: '8px',
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '16px',
        cursor: paying ? 'not-allowed' : 'pointer', width: '100%',
      }}>
        {paying ? 'Processing...' : 'Pay ' + fmt(total) + ' (DDP — No Surprise Charges)'}
      </button>
      <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Duties and taxes are included in your total. Velor is a global marketplace, so this was reconfirmed at today's exchange rate right before you paid — you will not be charged anything extra on delivery.
      </p>
    </form>
  )
}

export default function CheckoutPage() {
  const { items, removeItem } = useCartItems()
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  const [address, setAddress] = useState({ name: '', email: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'GB' })
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [landedCost, setLandedCost] = useState<LandedCost | null>(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [rateError, setRateError] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [creatingIntent, setCreatingIntent] = useState(false)
  const [paymentSetupError, setPaymentSetupError] = useState('')
  const { displayCurrency: currency, convert } = useCurrencyDisplay()
  const fmtRaw = (val: number, fromCurrency: string = 'GBP') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(convert(val, fromCurrency))
  const fmtDisplay = (val: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(val)
  const fmtConfirmed = (val: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: (confirmed && confirmed.currency) || currency }).format(val)
  const [confirmed, setConfirmed] = useState<ConfirmedBreakdown | null>(null)

  // Discounts are automatic — the seller applies them to the listing, the
  // buyer sees them on the listing/product page, and the exact same amount
  // is looked up again here from lib/discount.ts. There is nothing for the
  // buyer to type. Only ever discounts the product subtotal, never shipping
  // or duties/taxes.
  const [autoDiscount, setAutoDiscount] = useState<AutoDiscountResult | null>(null)
  const [autoDiscountLoading, setAutoDiscountLoading] = useState(false)

  const [itemCurrencies, setItemCurrencies] = useState<Record<string, string>>({})

  useEffect(() => {
    const missing = Array.from(new Set(items.map((i) => i.productId))).filter((id) => !(id in itemCurrencies))
    if (missing.length === 0) return
    let cancelled = false
    Promise.all(missing.map((id) =>
      fetch(`/api/shop/products/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    )).then((results) => {
      if (cancelled) return
      setItemCurrencies((prev) => {
        const next = { ...prev }
        results.forEach((data, idx) => {
          next[missing[idx]] = data?.seller?.currency || 'GBP'
        })
        return next
      })
    })
    return () => { cancelled = true }
  }, [items, itemCurrencies])

  const productSubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const productSubtotalConverted = items.reduce((s, i) => s + convert(i.price * i.quantity, itemCurrencies[i.productId] || 'GBP'), 0)
  const shippingCost = Number(selectedRate?.amount) || 0
  const dutiesAmount = landedCost?.totalTaxGBP ?? 0
  const discountAmount = autoDiscount?.totalDiscountGBP ?? 0
  const total = Math.max(0, productSubtotal - discountAmount) + shippingCost + dutiesAmount

  useEffect(() => {
    if (items.length === 0) return
    const sellerId = items[0]?.sellerId
    if (!sellerId) return
    setAutoDiscountLoading(true)
    fetch('/api/discount/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      }),
    })
      .then(res => res.json())
      .then(data => setAutoDiscount(data))
      .catch(() => setAutoDiscount(null))
      .finally(() => setAutoDiscountLoading(false))
  }, [items])

  function setAddr(k: keyof typeof address, v: string) {
    setAddress(a => ({ ...a, [k]: v }))
    if (k === 'country') {
      setRates([])
      setSelectedRate(null)
      setLandedCost(null)
    }
  }

  async function fetchRatesAndDuties() {
    setLoadingRates(true)
    setRateError('')
    try {
      const [rateRes, dutyRes] = await Promise.all([
        fetch('/api/shipping/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems: items.map(i => ({ productId: i.productId, sellerId: i.sellerId, quantity: i.quantity })),
            shippingAddress: { street1: address.line1, city: address.city, zip: address.postalCode, country: address.country },
          }),
        }),
        fetch('/api/shipping/landed-cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
            destinationCountry: address.country,
            originCountry: 'GB',
            shippingCostGBP: 0,
          }),
        }),
      ])
      const [rateData, dutyData] = await Promise.all([rateRes.json(), dutyRes.json()])
      if (rateData.rates) { setRates(rateData.rates); if (rateData.rates[0]) setSelectedRate(rateData.rates[0]) }
      if (dutyData.totalTaxGBP !== undefined) setLandedCost(dutyData)
    } catch {
      setRateError('Could not fetch shipping rates. Please try again.')
    } finally {
      setLoadingRates(false)
    }
  }

  async function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetchRatesAndDuties()
  }

  async function proceedToPayment() {
    if (!selectedRate) return
    setCreatingIntent(true)
    setPaymentSetupError('')
    try {
      const res = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          currency,
          shippingAmount: selectedRate?.amount ?? 0,
          shippingCurrency: selectedRate?.currency ?? 'GBP',
          dutiesAmountGBP: landedCost?.totalTaxGBP ?? 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPaymentSetupError(data.error || 'Could not set up payment. Please try again.')
        return
      }
      if (data.clientSecret) {
        if (data.breakdown) setConfirmed(data.breakdown)
        const piId = (data.clientSecret as string).split('_secret_')[0]
        localStorage.setItem('velor-last-order', JSON.stringify({
          orderNumber: 'VLR-' + Date.now(),
          paymentIntentId: piId,
          items,
          shipping: {
            firstName: address.name.split(' ')[0] ?? address.name,
            lastName: address.name.split(' ').slice(1).join(' ') ?? '',
            email: address.email,
            phone: '',
            address: [address.line1, address.line2].filter(Boolean).join(', '),
            city: address.city,
            postcode: address.postalCode,
            country: address.country,
          },
          shippingMethod: selectedRate?.service ?? '',
          shippingCost: data.breakdown ? data.breakdown.shippingCost : shippingCost,
          subtotal: data.breakdown ? data.breakdown.productSubtotal : productSubtotal,
          discountCodes: data.breakdown ? data.breakdown.discountCodes : (autoDiscount?.applied.map(a => a.code) ?? []),
          discountAmount: data.breakdown ? data.breakdown.discountAmount : discountAmount,
          total: data.breakdown ? data.breakdown.total : total,
          currency: data.breakdown ? data.breakdown.currency : currency,
          placedAt: new Date().toISOString(),
          sellerId: items[0]?.sellerId ?? null,
          rateId: selectedRate?.rateId ?? null,
        }))
        setClientSecret(data.clientSecret)
        setStep('payment')
      }
    } finally {
      setCreatingIntent(false)
    }
  }

  const fmt = (val: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(val)
  const surface = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px' }
  const inputStyle = {
    width: '100%', padding: '10px 12px', background: 'var(--bg)',
    border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)',
    fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 600 as const, color: 'var(--muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px',
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>
        Your cart is empty.
      </div>
    )
  }

  const confirmedCodes = confirmed?.discountCodes ?? []
  const displayedCodes = confirmedCodes.length > 0 ? confirmedCodes : (autoDiscount?.applied.map(a => a.code) ?? [])

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px 80px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '40px' }}>
        Checkout
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'flex-start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {step === 'shipping' && (
            <>
              <div style={surface}>
                <div style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
                  Velor is a global marketplace — prices convert live using current exchange rates, and we reconfirm your exact total right before you pay. No surprise charges, ever.
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
                  Shipping Address
                </h2>
                <form onSubmit={handleShippingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input style={inputStyle} value={address.name} onChange={e => setAddr('name', e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Email *</label>
                      <input style={inputStyle} type="email" value={address.email} onChange={e => setAddr('email', e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Address Line 1 *</label>
                    <input style={inputStyle} value={address.line1} onChange={e => setAddr('line1', e.target.value)} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Address Line 2</label>
                    <input style={inputStyle} value={address.line2} onChange={e => setAddr('line2', e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>City *</label>
                      <input style={inputStyle} value={address.city} onChange={e => setAddr('city', e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>State / County</label>
                      <input style={inputStyle} value={address.state} onChange={e => setAddr('state', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Postcode / ZIP *</label>
                      <input style={inputStyle} value={address.postalCode} onChange={e => setAddr('postalCode', e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Country *</label>
                      <select style={{ ...inputStyle, cursor: 'pointer' }} value={address.country} onChange={e => setAddr('country', e.target.value)}>
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {rateError && (
                    <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px' }}>
                      {rateError}
                    </div>
                  )}
                  <button type="submit" disabled={loadingRates} style={{
                    padding: '12px', background: loadingRates ? 'var(--border)' : 'var(--accent)',
                    color: '#fff', border: 'none', borderRadius: '6px',
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px',
                    cursor: loadingRates ? 'not-allowed' : 'pointer',
                  }}>
                    {loadingRates ? 'Fetching Rates...' : 'Get Shipping Rates'}
                  </button>
                </form>
              </div>

              {rates.length > 0 && (
                <div style={surface}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
                    Shipping Options
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {rates.map(rate => (
                      <label key={rate.rateId} style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                        border: '1px solid ' + (selectedRate?.rateId === rate.rateId ? 'var(--accent)' : 'var(--border)'),
                        borderRadius: '8px', cursor: 'pointer',
                        background: selectedRate?.rateId === rate.rateId ? 'rgba(255,107,0,0.05)' : 'var(--bg)',
                      }}>
                        <input type="radio" name="rate" checked={selectedRate?.rateId === rate.rateId} onChange={() => setSelectedRate(rate)} style={{ accentColor: 'var(--accent)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                            {rate.carrier} — {rate.service}
                            {rate.isDDP && (
                              <span style={{ marginLeft: '8px', padding: '2px 8px', background: 'rgba(0,230,118,0.15)', color: 'var(--green)', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                DDP
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                            {rate.estimatedDays ? rate.estimatedDays + ' business days' : 'Estimated delivery varies'}
                          </div>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                          {fmtRaw(rate.amount, rate.currency || 'GBP')}
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentSetupError && (
                    <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px' }}>
                      {paymentSetupError}
                    </div>
                  )}

                  {selectedRate && (
                    <>
                      <button
                        onClick={proceedToPayment}
                        disabled={creatingIntent}
                        style={{
                          marginTop: '20px', padding: '13px', width: '100%',
                          background: creatingIntent ? 'var(--border)' : 'var(--accent)',
                          color: '#fff', border: 'none', borderRadius: '8px',
                          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px',
                          cursor: creatingIntent ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {creatingIntent ? 'Setting Up Payment...' : 'Continue to Payment'}
                      </button>
                      <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '8px', lineHeight: 1.4 }}>
                        Your total will be reconfirmed at today's exchange rate on the next screen — exactly what you see is exactly what you pay.
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {step === 'payment' && clientSecret && (
            <div style={surface}>
              <button onClick={() => setStep('shipping')} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                &larr; Back to shipping
              </button>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>Payment</h2>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#FF6B00', colorBackground: '#0D0D0D', colorText: '#FFFFFF', colorDanger: '#FF1744', fontFamily: 'Inter, sans-serif', borderRadius: '6px' } } }}>
                <CheckoutForm clientSecret={clientSecret} total={confirmed ? confirmed.total : total} currency={confirmed ? confirmed.currency : currency} onSuccess={() => {}} />
              </Elements>
            </div>
          )}
        </div>

        {/* RIGHT — Order Summary */}
        <div style={{ ...surface, position: 'sticky', top: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Order Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {items.map(item => (
              <div key={item.productId} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', background: 'var(--bg)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Qty {item.quantity}</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{confirmed && productSubtotal > 0 ? fmtConfirmed((item.price * item.quantity / productSubtotal) * (confirmed.productSubtotal + confirmed.discountAmount)) : fmtRaw(item.price * item.quantity, itemCurrencies[item.productId] || 'GBP')}</div>
                {step === 'shipping' && !confirmed && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name} from cart`}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '18px', cursor: 'pointer', padding: '4px 0 4px 8px', lineHeight: 1 }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {step === 'shipping' && autoDiscountLoading && (
            <div style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--muted)' }}>Checking for available discounts...</div>
          )}
          {step === 'shipping' && !autoDiscountLoading && autoDiscount && autoDiscount.totalDiscountGBP > 0 && (
            <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'rgba(0,230,118,0.08)', border: '1px solid var(--green)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)' }}>
                Discount applied automatically — {fmtRaw(autoDiscount.totalDiscountGBP)} off
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                No code needed — this was already reflected in the product price you saw.
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal</span>
              <span style={{ color: 'var(--text)' }}>{confirmed ? fmtConfirmed(confirmed.productSubtotal + confirmed.discountAmount) : fmtDisplay(productSubtotalConverted)}</span>
            </div>
            {(confirmed ? confirmed.discountAmount > 0 : discountAmount > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--green)' }}>Discount{displayedCodes.length > 0 ? ` (${displayedCodes.join(', ')})` : ''}</span>
                <span style={{ color: 'var(--green)' }}>-{confirmed ? fmtConfirmed(confirmed.discountAmount) : fmtRaw(discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Shipping</span>
              <span style={{ color: 'var(--text)' }}>{selectedRate ? (confirmed ? fmtConfirmed(confirmed.shippingCost) : fmtRaw(shippingCost)) : '—'}</span>
            </div>
            {landedCost && !landedCost.isDomestic && dutiesAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>
                  Duties and Taxes (DDP)
                  {landedCost.belowDeMinimis && <span style={{ color: 'var(--green)', fontSize: '11px', marginLeft: '4px' }}>below threshold</span>}
                </span>
                <span style={{ color: 'var(--text)' }}>{confirmed ? fmtConfirmed(confirmed.dutiesAmount) : fmtRaw(dutiesAmount)}</span>
              </div>
            )}
            {landedCost?.isDomestic && (
              <div style={{ fontSize: '12px', color: 'var(--green)', textAlign: 'right' }}>Domestic — no import duties</div>
            )}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700 }}>
              <span style={{ color: 'var(--text)' }}>Total</span>
              <span style={{ color: 'var(--accent)' }}>{confirmed ? fmtConfirmed(confirmed.total) : fmtRaw(total)}</span>
            </div>
            <div style={{ fontSize: '11px', color: confirmed ? 'var(--green)' : 'var(--muted)', textAlign: 'right', marginTop: '4px' }}>
              {confirmed ? 'Reconfirmed just now — exactly what you pay, no surprise charges' : 'Estimated — reconfirmed live the moment you continue to payment'}
            </div>
          </div>
          {dutiesAmount > 0 && (
            <div style={{ marginTop: '14px', padding: '10px 12px', background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', marginBottom: '2px' }}>
                Delivered Duty Paid (DDP)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>
                All import duties and taxes are included in your total. Nothing to pay at the door.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
