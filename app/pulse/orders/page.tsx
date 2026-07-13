'use client'

import { useState, useCallback } from 'react'
import {
  PulseShell,
  PulseHeader,
  PulseFooter,
  PulseLoading,
  ErrorBanner,
  TokenGate,
  ListCard,
  EmptyState,
  StatusBadge,
  FilterBar,
  FilterInput,
  FilterSelect,
  FilterButton,
  PageNav,
  ResultsMeta,
  usePulseAuth,
  usePulseData,
  PULSE,
} from '@/components/pulse/PulseKit'
import { formatMoney, fmtDateTime } from '@/lib/pulseFormat'

type OrderItem = {
  id: string
  quantity: number
  price: number
  commission: number | null
  product: { id: string; title: string; images: string[] } | null
}

type Order = {
  id: string
  status: string
  subtotal: number
  platformFee: number
  sellerEarnings: number
  currency: string
  customerEmail: string
  customerName: string | null
  stripePaymentId: string | null
  shippingAddress: Record<string, string> | null
  createdAt: string
  seller: { id: string; storeName: string } | null
  items: OrderItem[]
  shipment: { status: string; trackingNumber: string | null; trackingUrl: string | null; carrier: string | null } | null
}

type OrdersResponse = { orders: Order[]; total: number; page: number; pageSize: number; totalPages: number }

export default function PulseOrdersPage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (status !== 'ALL') params.set('status', status)
  params.set('page', String(page))
  params.set('pageSize', '20')

  const { data, loading, error } = usePulseData<OrdersResponse>(`/api/admin/orders?${params.toString()}`, token, { onUnauthorized: lock })

  const runFilters = useCallback(() => setPage(1), [])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell activeNav="orders">
        <PulseHeader title="Orders" subtitle="Every order, searchable" />
        <PulseLoading label="Loading orders..." />
      </PulseShell>
    )
  }

  return (
    <PulseShell activeNav="orders">
      <PulseHeader title="Orders" subtitle="Every order, searchable" live updatedAt={data?.orders ? new Date().toISOString() : null} />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <FilterBar>
        <FilterInput
          placeholder="Search buyer, order ID, payment ID, seller..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          {['ALL', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'DISPUTED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </FilterSelect>
        <FilterButton onClick={runFilters}>Search</FilterButton>
      </FilterBar>

      {data && <ResultsMeta total={data.total} noun="order" page={data.page} totalPages={data.totalPages} />}
      {data && data.orders.length === 0 && <EmptyState>No orders match these filters.</EmptyState>}

      {data && data.orders.map((o) => {
        const currency = o.currency?.toUpperCase() || 'GBP'
        return (
          <ListCard key={o.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: PULSE.text, fontFamily: "'Space Grotesk', sans-serif" }}>{formatMoney(o.subtotal, currency)}</span>
              <StatusBadge status={o.status} />
            </div>
            <div style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: PULSE.accent, marginBottom: 4 }}>#{o.id}</div>
            <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>{o.customerName || 'Not provided'} &middot; {o.customerEmail || 'No email on record'}</div>
            <div style={{ fontSize: 12, color: PULSE.muted, marginBottom: 2 }}>Seller: {o.seller?.storeName || 'Unknown seller'}</div>
            <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>
              {o.items.length === 0 ? 'No items on record' : o.items.map((it) => `${it.quantity}x ${it.product?.title || 'Deleted product'}`).join(', ')}
            </div>
            <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>
              Platform fee {formatMoney(o.platformFee, currency)} &middot; seller earns {formatMoney(o.sellerEarnings, currency)}
            </div>
            {o.shippingAddress && (o.shippingAddress.city || o.shippingAddress.country) && (
              <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>
                Ships to {[o.shippingAddress.city, o.shippingAddress.country].filter(Boolean).join(', ')}
              </div>
            )}
            {o.shipment && (
              <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>
                {o.shipment.status} &middot; {o.shipment.carrier || 'Carrier TBC'} &middot; {o.shipment.trackingNumber || 'No tracking number yet'}
              </div>
            )}
            <div style={{ fontSize: 11.5, color: PULSE.mutedDark, marginTop: 4 }}>
              {fmtDateTime(o.createdAt)} &middot; {o.stripePaymentId || 'No payment ID on record'}
            </div>
          </ListCard>
        )
      })}

      {data && <PageNav page={page} totalPages={data.totalPages} onPage={setPage} />}
      <PulseFooter />
    </PulseShell>
  )
}
