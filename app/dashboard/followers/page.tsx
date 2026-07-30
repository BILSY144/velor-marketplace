'use client';

import { useEffect, useState } from 'react';
import { useSellerTier, PlanBadge } from '@/lib/dashboard-theme';
import { HALO } from '@/lib/halo';

// Real Followers list (William, 2026-08-01: "when clicking followers it
// should take me to a page what lists all my followers or at least show
// the followers and name of followers" -- the sidebar link previously
// pointed at Analytics instead). Backed by the Follow model via
// /api/dashboard/followers; names come back already masked ("First L.")
// by the same privacy rule used for buyer names in messages and reviews.
interface FollowerEntry {
  id: string;
  name: string;
  since: string;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DashboardFollowersPage() {
  const { tier, theme } = useSellerTier();
  const isElevated = tier !== 'STARTER';

  const [followers, setFollowers] = useState<FollowerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/followers')
      .then((r) => r.json())
      .then((d) => { setFollowers(d.followers ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '32px', maxWidth: 720, position: 'relative', zIndex: 1 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: HALO.fontDisplay, fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HALO.accent, marginBottom: 4 }}>Fulfil</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: HALO.fontSerif, fontStyle: 'italic', fontWeight: 500, fontSize: 30, color: HALO.ink, margin: 0 }}>
            Followers
            {!loading && followers.length > 0 && (
              <span style={{ marginLeft: 12, fontFamily: HALO.fontDisplay, background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20, verticalAlign: 'middle' }}>
                {followers.length}
              </span>
            )}
          </h1>
          <PlanBadge tier={tier} />
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
          Buyers who follow your store get notified when you post a new journal entry, go live, or add a product. Names are shown the same privacy-safe way as everywhere else on Velor.
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
      ) : followers.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          No one is following your store yet. Once a buyer follows you, they&rsquo;ll show up here.
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {followers.map((f, i) => (
            <div
              key={f.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                borderBottom: i < followers.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: isElevated ? theme.rowHoverBg : 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                {initials(f.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{f.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Following since {formatDate(f.since)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
