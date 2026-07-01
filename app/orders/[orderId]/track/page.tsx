'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface TrackingEvent {
  id: string; status: string; description: string; location: string | null; occurredAt: string;
}
interface Shipment {
  id: string; status: string; carrier: string | null; service: string | null;
  trackingNumber: string | null; trackingUrl: string | null;
  events: TrackingEvent[];
}
interface TrackingData {
  orderId: string; status: string; carrier: string | null; shipments: Shipment[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Processing',
  PAID: 'Order Confirmed',
  PROCESSING: 'Preparing Shipment',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  LABEL_PURCHASED: 'Label Created',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  FAILED: 'Delivery Issue',
  RETURNED: 'Returned',
}

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: 'var(--green)',
  IN_TRANSIT: 'var(--accent)',
  OUT_FOR_DELIVERY: 'var(--accent)',
  SHIPPED: 'var(--accent)',
  FAILED: 'var(--red)',
  RETURNED: 'var(--red)',
}

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId || !email) { setLoading(false); return }
    fetch('/api/orders/' + orderId + '/track?email=' + encodeURIComponent(email))
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Failed to load tracking data'))
      .finally(() => setLoading(false))
  }, [orderId, email])

  const surface = { background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '28px 32px' }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>
        Loading tracking information...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 20px', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
        <div style={{ ...surface }}>
          <p style={{ color: 'var(--red)', marginBottom: '20px' }}>{error}</p>
          <Link href="/orders" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>View all orders</Link>
        </div>
      </div>
    )
  }

  if (!data) return null

  const allEvents = data.shipments.flatMap(s => s.events)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())

  const latestShipment = data.shipments[0]

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px 80px', fontFamily: 'var(--font-body)' }}>
      <Link href="/orders" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '28px' }}>
        &larr; Back to Orders
      </Link>

      <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
        Track Your Order
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '32px' }}>
        Order {data.orderId.slice(0, 8).toUpperCase()}
      </p>

      {latestShipment && (
        <div style={{ ...surface, marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Carrier</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{latestShipment.carrier ?? 'Standard Carrier'}</div>
              {latestShipment.service && (
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{latestShipment.service}</div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-block', padding: '6px 14px', borderRadius: '20px',
                background: STATUS_COLORS[latestShipment.status] ? STATUS_COLORS[latestShipment.status] + '20' : 'var(--border)',
                color: STATUS_COLORS[latestShipment.status] ?? 'var(--muted)',
                fontSize: '13px', fontWeight: 700,
              }}>
                {STATUS_LABELS[latestShipment.status] ?? latestShipment.status}
              </div>
              {latestShipment.trackingNumber && (
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                  {latestShipment.trackingNumber}
                </div>
              )}
            </div>
          </div>
          {latestShipment.trackingUrl && (
            <a href={latestShipment.trackingUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-block', marginTop: '20px', padding: '10px 20px',
                background: 'var(--accent)', color: '#fff', borderRadius: '6px',
                fontWeight: 600, fontSize: '14px', textDecoration: 'none',
              }}>
              Track on {latestShipment.carrier ?? 'Carrier'} Website
            </a>
          )}
        </div>
      )}

      <div style={{ ...surface }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '24px' }}>
          Shipment Timeline
        </h2>
        {allEvents.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            No tracking events yet. Updates will appear here once your order is collected by the carrier.
          </p>
        ) : (
          <div style={{ position: 'relative' }}>
            {allEvents.map((evt, i) => (
              <div key={evt.id} style={{ display: 'flex', gap: '16px', paddingBottom: i < allEvents.length - 1 ? '24px' : '0', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'var(--accent)' : 'var(--border)',
                    border: '2px solid ' + (i === 0 ? 'var(--accent)' : 'var(--border)'),
                    marginTop: '3px',
                  }} />
                  {i < allEvents.length - 1 && (
                    <div style={{ width: '2px', flex: 1, background: 'var(--border)', marginTop: '4px' }} />
                  )}
                </div>
                <div style={{ paddingBottom: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: i === 0 ? 'var(--text)' : 'var(--muted)' }}>
                    {evt.description}
                  </div>
                  {evt.location && (
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{evt.location}</div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                    {new Date(evt.occurredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!email && (
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '20px', textAlign: 'center' }}>
          Bookmark this page to check back on your shipment status.
        </p>
      )}
    </div>
  )
}
