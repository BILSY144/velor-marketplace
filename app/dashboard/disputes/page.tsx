'use client';
import { useEffect, useState } from 'react';

interface DisputeOrderItem {
  product: { id: string; title: string; images: string[] };
  quantity: number;
}

interface DisputeItem {
  id: string;
  orderId: string;
  raisedBy: string;
  reason: string;
  evidence: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  order: {
    id: string;
    total: number;
    currency: string;
    items: DisputeOrderItem[];
  };
}

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  OPEN:      { bg: 'var(--accent)', fg: '#000' },
  IN_REVIEW: { bg: '#F59E0B',       fg: '#000' },
  RESOLVED:  { bg: 'var(--green)',  fg: '#000' },
};

export default function SellerDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/disputes?role=seller')
      .then(r => r.json())
      .then(d => setDisputes(d.disputes ?? []))
      .finally(() => setLoading(false));
  }, []);

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
        Disputes
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, fontFamily: 'var(--font-body)' }}>
        {disputes.length} {disputes.length === 1 ? 'dispute' : 'disputes'} on your orders. Contact support to resolve open disputes.
      </p>

      {disputes.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 15, fontFamily: 'var(--font-body)' }}>No disputes on your orders.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {disputes.map(d => {
            const col = STATUS_COLOR[d.status] ?? { bg: 'var(--border)', fg: 'var(--text)' };
            const firstItem = d.order?.items?.[0];
            const img = firstItem?.product?.images?.[0];
            return (
              <div key={d.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {img && (
                  <img src={img} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                      Order #{d.orderId.slice(-8).toUpperCase()}
                    </span>
                    <span style={{ background: col.bg, color: col.fg, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                      {d.status}
                    </span>
                  </div>
                  {firstItem?.product?.title && (
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {firstItem.product.title}
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Raised by: {d.raisedBy}</p>
                  <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                    <span style={{ color: 'var(--muted)' }}>Reason: </span>{d.reason}
                  </p>
                  {d.evidence && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Evidence: {d.evidence}</p>
                  )}
                  {d.resolution && (
                    <p style={{ fontSize: 12, color: 'var(--green)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Resolution: {d.resolution}</p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                    {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' - '}
                    {(d.order?.total ?? 0).toFixed(2)} {d.order?.currency ?? 'GBP'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
