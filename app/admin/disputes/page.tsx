'use client';
import { useEffect, useState } from 'react';

interface AdminDisputeItem {
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
    items: Array<{ product: { id: string; title: string }; quantity: number }>;
  };
}

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  OPEN:      { bg: 'var(--accent)', fg: '#000' },
  IN_REVIEW: { bg: '#F59E0B',       fg: '#000' },
  RESOLVED:  { bg: 'var(--green)',  fg: '#000' },
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<AdminDisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [resText, setResText] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/disputes?role=admin')
      .then(r => r.json())
      .then(d => setDisputes(d.disputes ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function updateDispute(id: string, status: string) {
    setUpdating(id);
    const resolution = resText[id] ?? '';
    const res = await fetch('/api/disputes/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(resolution && { resolution }) }),
    });
    if (res.ok) {
      setDisputes(prev => prev.map(d =>
        d.id === id ? { ...d, status, resolution: resolution || d.resolution } : d
      ));
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

  const openCount = disputes.filter(d => d.status === 'OPEN').length;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          Disputes
        </h1>
        {openCount > 0 && (
          <span style={{ background: 'var(--accent)', color: '#000', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, fontFamily: 'var(--font-body)' }}>
            {openCount} open
          </span>
        )}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, fontFamily: 'var(--font-body)' }}>
        {disputes.length} total disputes across the platform.
      </p>

      {disputes.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 15, fontFamily: 'var(--font-body)' }}>No disputes on the platform.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {disputes.map(d => {
            const col = STATUS_COLOR[d.status] ?? { bg: 'var(--border)', fg: 'var(--text)' };
            const firstProduct = d.order?.items?.[0]?.product;
            return (
              <div key={d.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
                      #{d.orderId.slice(-8).toUpperCase()}
                    </span>
                    <span style={{ background: col.bg, color: col.fg, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                      {d.status}
                    </span>
                  </div>
                  {firstProduct?.title && (
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
                      {firstProduct.title}
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
                    Raised by: {d.raisedBy}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
                    <span style={{ color: 'var(--muted)' }}>Reason: </span>{d.reason}
                  </p>
                  {d.evidence && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
                      Evidence: {d.evidence}
                    </p>
                  )}
                  {d.resolution && (
                    <p style={{ fontSize: 12, color: 'var(--green)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
                      Resolution: {d.resolution}
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                    {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' - '}
                    {(d.order?.total ?? 0).toFixed(2)} {d.order?.currency ?? 'GBP'}
                  </p>
                </div>

                {d.status !== 'RESOLVED' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <textarea
                      placeholder="Resolution notes (optional)..."
                      value={resText[d.id] ?? ''}
                      onChange={e => setResText(prev => ({ ...prev, [d.id]: e.target.value }))}
                      rows={2}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-body)', resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' as const }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      {d.status === 'OPEN' && (
                        <button
                          onClick={() => updateDispute(d.id, 'IN_REVIEW')}
                          disabled={updating === d.id}
                          style={{ background: '#F59E0B', color: '#000', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                        >
                          Mark In Review
                        </button>
                      )}
                      <button
                        onClick={() => updateDispute(d.id, 'RESOLVED')}
                        disabled={updating === d.id}
                        style={{ background: 'var(--green)', color: '#000', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
