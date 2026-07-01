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

interface ReturnOrder {
  id: string;
  buyerEmail: string;
  buyerName: string;
  total: number;
  currency: string;
  items: OrderItem[];
}

interface ReturnRequest {
  id: string;
  orderId: string;
  buyerEmail: string;
  reason: string;
  status: string;
  notes?: string;
  createdAt: string;
  order: ReturnOrder;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--accent)',
  PROCESSING: '#F59E0B',
  APPROVED: 'var(--green)',
  REJECTED: 'var(--red)',
};

export default function SellerReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/returns?role=seller')
      .then((r) => r.json())
      .then((d) => { setReturns(d.returns ?? []); setLoading(false); });
  }, []);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/returns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setReturns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    }
  }

  const pending = returns.filter((r) => r.status === 'PENDING').length;

  return (
    <div style={{ padding: '32px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Return Requests
          {pending > 0 && (
            <span style={{ marginLeft: 12, background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
              {pending} pending
            </span>
          )}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Manage buyer return requests for your orders.</p>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading...</p>}
      {!loading && returns.length === 0 && (
        <p style={{ color: 'var(--muted)' }}>No return requests yet.</p>
      )}

      {returns.map((ret) => (
        <div key={ret.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Return #{ret.id.slice(-8)}</span>
              <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{ret.order.buyerEmail}</p>
            </div>
            <span style={{ background: STATUS_COLORS[ret.status] ?? 'var(--muted)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {ret.status}
            </span>
          </div>

          <p style={{ color: 'var(--text)', fontSize: 14, marginBottom: 12 }}>
            <strong>Reason:</strong> {ret.reason}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {ret.order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111', borderRadius: 6, padding: '6px 10px' }}>
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                )}
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{item.name}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>x{item.quantity}</span>
              </div>
            ))}
          </div>

          {ret.status === 'PENDING' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStatus(ret.id, 'APPROVED')}
                style={{ background: 'var(--green)', color: '#000', fontWeight: 700, fontSize: 13, padding: '8px 18px', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                Approve
              </button>
              <button
                onClick={() => setStatus(ret.id, 'REJECTED')}
                style={{ background: 'var(--red)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '8px 18px', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                Reject
              </button>
            </div>
          )}
          {ret.status === 'APPROVED' && (
            <button
              onClick={() => setStatus(ret.id, 'PROCESSING')}
              style={{ background: '#F59E0B', color: '#000', fontWeight: 700, fontSize: 13, padding: '8px 18px', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Mark Processing
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
