'use client';

import { useEffect, useState } from 'react';

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

const STATUS_OPTIONS = ['OPEN', 'IN_REVIEW', 'RESOLVED'];

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'var(--accent)',
  IN_REVIEW: '#F59E0B',
  RESOLVED: 'var(--green)',
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resText, setResText] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/disputes?role=admin')
      .then((r) => r.json())
      .then((d) => { setDisputes(d.disputes ?? []); setLoading(false); });
  }, []);

  async function updateDispute(id: string, status: string) {
    const res = await fetch(`/api/disputes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution: resText[id] ?? '' }),
    });
    if (res.ok) {
      const { dispute } = await res.json() as { dispute: Dispute };
      setDisputes((prev) => prev.map((d) => (d.id === id ? dispute : d)));
    }
  }

  const open = disputes.filter((d) => d.status === 'OPEN').length;

  return (
    <div style={{ padding: '32px', maxWidth: 960 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Dispute Management
          {open > 0 && (
            <span style={{ marginLeft: 12, background: 'var(--red)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
              {open} open
            </span>
          )}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Review and resolve buyer disputes across the platform.</p>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading...</p>}
      {!loading && disputes.length === 0 && (
        <p style={{ color: 'var(--muted)' }}>No disputes on the platform.</p>
      )}

      {disputes.map((dispute) => (
        <div key={dispute.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 22, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Dispute #{dispute.id.slice(-8)} | Order #{dispute.orderId.slice(-8)}</span>
              <p style={{ margin: '4px 0 2px', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Raised by: {dispute.raisedBy}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Buyer: {dispute.order.buyerEmail}</p>
            </div>
            <span style={{ background: STATUS_COLORS[dispute.status] ?? 'var(--muted)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {dispute.status}
            </span>
          </div>

          <p style={{ color: 'var(--text)', fontSize: 14, marginBottom: 8 }}>
            <strong>Reason:</strong> {dispute.reason}
          </p>
          {dispute.evidence && (
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10, fontStyle: 'italic' }}>
              Evidence: {dispute.evidence}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
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

          <div style={{ marginBottom: 12 }}>
            <textarea
              value={resText[dispute.id] ?? dispute.resolution ?? ''}
              onChange={(e) => setResText((prev) => ({ ...prev, [dispute.id]: e.target.value }))}
              placeholder="Add resolution notes..."
              rows={2}
              style={{ width: '100%', background: '#111', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '8px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.filter((s) => s !== dispute.status).map((s) => (
              <button
                key={s}
                onClick={() => updateDispute(dispute.id, s)}
                style={{
                  background: STATUS_COLORS[s] ?? 'var(--muted)',
                  color: s === 'IN_REVIEW' ? '#000' : '#fff',
                  fontWeight: 700, fontSize: 12, padding: '7px 16px',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.3px',
                }}
              >
                Mark {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
