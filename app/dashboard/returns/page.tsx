'use client';
import { useEffect, useState } from 'react';

interface ReturnOrderItem {
  product: { id: string; title: string; images: string[] };
  quantity: number;
}

interface ReturnItem {
  id: string;
  orderId: string;
  buyerEmail: string;
  reason: string;
  status: string;
  notes: string | null;
  createdAt: string;
  order: {
    id: string;
    total: number;
    currency: string;
    items: ReturnOrderItem[];
  };
}

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  PENDING:    { bg: 'var(--accent)', fg: '#000' },
  PROCESSING: { bg: '#F59E0B',       fg: '#000' },
  APPROVED:   { bg: 'var(--green)',  fg: '#000' },
  REJECTED:   { bg: 'var(--red)',    fg: '#fff' },
};

export default function SellerReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/returns?role=seller')
      .then(r => r.json())
      .then(d => setReturns(d.returns ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function setStatus(id: string, status: string) {
    setUpdating(id);
    const res = await fetch('/api/returns/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setReturns(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
    setUpdating(null);
  }

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 880, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
        Return Requests
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, fontFamily: 'var(--font-body)' }}>
        {returns.length} {returns.length === 1 ? 'request' : 'requests'} from buyers on your orders.
      </p>

      {returns.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 15, fontFamily: 'var(--font-body)' }}>No return requests yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {returns.map(r => {
            const col = STATUS_COLOR[r.status] ?? { bg: 'var(--border)', fg: 'var(--text)' };
            const firstItem = r.order?.items?.[0];
            const img = firstItem?.product?.images?.[0];
            return (
              <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {img && (
                  <img src={img} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                      Order #{r.orderId.slice(-8).toUpperCase()}
                    </span>
                    <span style={{ background: col.bg, color: col.fg, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                      {r.status}
                    </span>
                  </div>
                  {firstItem?.product?.title && (
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {firstItem.product.title}
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>{r.buyerEmail}</p>
                  <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                    <span style={{ color: 'var(--muted)' }}>Reason: </span>{r.reason}
                  </p>
                  {r.notes && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Notes: {r.notes}</p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' - '}
                    {(r.order?.total ?? 0).toFixed(2)} {r.order?.currency ?? 'GBP'}
                  </p>
                </div>
                {r.status === 'PENDING' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setStatus(r.id, 'APPROVED')}
                      disabled={updating === r.id}
                      style={{ background: 'var(--green)', color: '#000', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setStatus(r.id, 'REJECTED')}
                      disabled={updating === r.id}
                      style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {r.status === 'APPROVED' && (
                  <button
                    onClick={() => setStatus(r.id, 'PROCESSING')}
                    disabled={updating === r.id}
                    style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)' }}
                  >
                    Processing
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
