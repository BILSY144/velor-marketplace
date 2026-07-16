'use client';

import { useEffect, useState } from 'react';
import { useSellerTier, PlanBadge, tierCardStyle } from '@/lib/dashboard-theme';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface DisputeOrder {
  id: string;
  buyerEmail: string;
  buyerName: string;
  total: number;
  currency: string;
  items: OrderItem[];
}

interface Dispute {
  id: string;
  orderId: string;
  raisedBy: string;
  reason: string;
  evidence?: string;
  status: string;
  resolution?: string;
  createdAt: string;
  order: DisputeOrder;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'var(--accent)',
  IN_REVIEW: '#F59E0B',
  RESOLVED: 'var(--green)',
};

export default function SellerDisputesPage() {
  const { tier, theme } = useSellerTier();
  const isPro = tier === 'PRO';
  const isElevated = tier !== 'STARTER';

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/disputes?role=seller')
      .then((r) => r.json())
      .then((d) => { setDisputes(d.disputes ?? []); setLoading(false); });
  }, []);

  const open = disputes.filter((d) => d.status === 'OPEN').length;

  return (
    <div style={{ padding: '32px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Disputes
            {open > 0 && (
              <span style={{ marginLeft: 12, background: 'var(--red)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
                {open} open
              </span>
            )}
          </h1>
          <PlanBadge tier={tier} />
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Buyer disputes raised against your orders. Contact Velor admin if you need to respond.</p>
      </div>

      {isPro && open > 0 && (
        <div style={tierCardStyle(theme, { padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 })}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#FFD54A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Priority Handling
          </span>
          <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>
            As a Pro seller, open disputes on your account are escalated to Velor admin for priority review.
          </span>
        </div>
      )}

      {loading && <p style={{ color: 'var(--muted)' }}>Loading...</p>}
      {!loading && disputes.length === 0 && (
        <p style={{ color: 'var(--muted)' }}>No disputes yet.</p>
      )}

      {disputes.map((dispute) => (
        <div key={dispute.id} style={tierCardStyle(theme, { padding: 20, marginBottom: 16, position: 'relative', overflow: 'hidden' })}>
          {isElevated && (
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
              background: isPro ? 'linear-gradient(180deg, #FFD54A, #FF6B00)' : '#4FC3F7',
            }} />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Dispute #{dispute.id.slice(-8)}</span>
              <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{dispute.raisedBy}</p>
            </div>
            <span style={{ background: STATUS_COLORS[dispute.status] ?? 'var(--muted)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {dispute.status}
            </span>
          </div>

          <p style={{ color: 'var(--text)', fontSize: 14, marginBottom: 8 }}>
            <strong>Reason:</strong> {dispute.reason}
          </p>
          {dispute.evidence && (
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
              <strong>Evidence:</strong> {dispute.evidence}
            </p>
          )}
          {dispute.resolution && (
            <p style={{ color: 'var(--green)', fontSize: 13, marginBottom: 8 }}>
              <strong>Resolution:</strong> {dispute.resolution}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {dispute.order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111', borderRadius: 6, padding: '6px 10px' }}>
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                )}
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{item.name}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>x{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
