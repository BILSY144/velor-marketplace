'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface ShippingForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state?: string
  postcode: string
  country: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  variantName?: string
  sellerId?: string
}

interface StoredOrder {
  orderNumber: string
  paymentIntentId?: string
  items: CartItem[]
  shipping: ShippingForm
  shippingMethod: string
  shippingCost: number
  subtotal: number
  total: number
  currency: string
  placedAt: string
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

function getDeliveryDate(method: string): string {
  const now = new Date()
  const days = method === 'express' ? 2 : 5
  let count = 0
  const d = new Date(now)
  while (count < days) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<StoredOrder | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const param = searchParams.get('order')
    if (param) {
      try { setOrder(JSON.parse(decodeURIComponent(param))); return } catch {}
    }
    const stored = localStorage.getItem('velor-last-order')
    if (stored) {
      try { setOrder(JSON.parse(stored)) } catch {}
    }
  }, [searchParams])

  // Persist order to DB on mount — fire-and-forget, idempotent
  useEffect(() => {
    if (!order || saved || !order.paymentIntentId) return
    setSaved(true)

    const buyerName = `${order.shipping.firstName ?? ''} ${order.shipping.lastName ?? ''}`.trim()

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: order.paymentIntentId,
        buyerEmail: order.shipping.email,
        buyerName,
        total: order.total,
        currency: order.currency ?? 'GBP',
        shippingAddress: {
          name: buyerName,
          line1: order.shipping.address ?? '',
          city: order.shipping.city ?? '',
          state: order.shipping.state ?? '',
          postcode: order.shipping.postcode ?? '',
          country: order.shipping.country ?? '',
        },
        items: (order.items ?? []).map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      }),
    }).catch(() => {}) // Non-blocking — confirmation UI never depends on this
  }, [order, saved])

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D0D' }}>
        <p style={{ color: '#999999', fontFamily: 'Inter, sans-serif' }}>Loading your order...</p>
      </div>
    )
  }

  const deliveryDate = getDeliveryDate(order.shippingMethod)
  const currency = order.currency ?? 'GBP'

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #2A2A2A', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 20, color: '#FF6B00', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          VELOR
        </a>
        <span style={{ color: '#2A2A2A' }}>|</span>
        <span style={{ color: '#999999', fontSize: 14 }}>Order Confirmation</span>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(0,230,118,0.12)', border: '2px solid #00E676',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>
            Order Confirmed!
          </h1>
          <p style={{ color: '#999999', fontSize: 15, margin: 0 }}>
            Thank you. Your order is on its way.
          </p>
        </div>

        {/* Order number */}
        <div style={{
          background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12,
          padding: '20px 24px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 11, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Order Number</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, margin: 0, color: '#FF6B00' }}>
              {order.orderNumber}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Est. Delivery</p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#00E676' }}>{deliveryDate}</p>
          </div>
        </div>

        {/* Items */}
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A' }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999999', margin: 0 }}>
              Items Ordered
            </p>
          </div>
          {(order.items ?? []).map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
              borderBottom: i < order.items.length - 1 ? '1px solid #2A2A2A' : 'none',
            }}>
              {item.image && (
                <img src={item.image} alt={item.name} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', background: '#111111', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                {item.variantName && <p style={{ fontSize: 12, color: '#999999', margin: 0 }}>{item.variantName}</p>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{formatCurrency(item.price, currency)}</p>
                <p style={{ fontSize: 11, color: '#999999', margin: 0 }}>Qty: {item.quantity}</p>
              </div>
            </div>
          ))}

          {/* Totals */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #2A2A2A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#999999' }}>Subtotal</span>
              <span style={{ fontSize: 13 }}>{formatCurrency(order.subtotal, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#999999' }}>Delivery</span>
              <span style={{ fontSize: 13, color: '#00E676' }}>
                {order.shippingCost === 0 ? 'FREE' : formatCurrency(order.shippingCost, currency)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #2A2A2A' }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 800 }}>Total</span>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 800, color: '#FF6B00' }}>
                {formatCurrency(order.total, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        {order.shipping && (
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999999', margin: '0 0 10px' }}>
              Delivering To
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>
              {order.shipping.firstName} {order.shipping.lastName}
            </p>
            <p style={{ fontSize: 13, color: '#999999', margin: '0 0 2px' }}>{order.shipping.address}</p>
            <p style={{ fontSize: 13, color: '#999999', margin: '0 0 2px' }}>{order.shipping.city}, {order.shipping.postcode}</p>
            <p style={{ fontSize: 13, color: '#999999', margin: 0 }}>{order.shipping.country}</p>
          </div>
        )}

        {/* What happens next */}
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: '20px 24px', marginBottom: 36 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999999', margin: '0 0 16px' }}>
            What Happens Next
          </p>
          {[
            { step: '1', title: 'Order Confirmed', desc: 'Your payment has been processed successfully.' },
            { step: '2', title: 'Processing', desc: 'We are preparing your items for dispatch.' },
            { step: '3', title: 'Dispatched', desc: "You'll receive a tracking number once your order ships." },
            { step: '4', title: 'Delivered', desc: `Expected by ${deliveryDate}.` },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,107,0,0.12)', border: '1px solid #FF6B00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 800, color: '#FF6B00',
              }}>
                {step}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>{title}</p>
                <p style={{ fontSize: 12, color: '#999999', margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a
            href="/orders"
            style={{
              flex: '1 1 200px', padding: '14px 24px', borderRadius: 8,
              background: '#FF6B00', color: '#FFFFFF', textAlign: 'center',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', display: 'block',
            }}
          >
            View My Orders
          </a>
          <a
            href="/shop"
            style={{
              flex: '1 1 200px', padding: '14px 24px', borderRadius: 8,
              background: 'transparent', border: '1px solid #2A2A2A', color: '#FFFFFF',
              textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'block',
            }}
          >
            Continue Shopping
          </a>
        </div>

        {/* Help */}
        <p style={{ textAlign: 'center', color: '#999999', fontSize: 12, marginTop: 28 }}>
          Questions? Email{' '}
          <a href="mailto:customerservice@velorcommerce.store" style={{ color: '#FF6B00', textDecoration: 'none' }}>
            customerservice@velorcommerce.store
          </a>
        </p>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999999', fontFamily: 'Inter, sans-serif' }}>Loading...</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}
