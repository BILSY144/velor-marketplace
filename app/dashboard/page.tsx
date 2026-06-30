'use client';

import { useState } from 'react';
import Link from 'next/link';

const stats = [
  { label: 'Total Revenue', value: '£0.00', sub: 'All time', color: 'var(--accent)' },
  { label: 'Orders', value: '0', sub: 'All time', color: 'var(--text)' },
  { label: 'Products', value: '0', sub: 'Listed', color: 'var(--text)' },
  { label: 'Pending Payout', value: '£0.00', sub: 'Available to withdraw', color: 'var(--green)' },
];

const recentOrders: { id: string; customer: string; product: string; amount: string; status: string; date: string }[] = [];

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    fulfilled: 'var(--green)',
    pending: 'var(--accent)',
    cancelled: 'var(--red)',
  };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: `${colours[status] ?? 'var(--muted)'}22`,
      color: colours[status] ?? 'var(--muted)',
      border: `1px solid ${colours[status] ?? 'var(--muted)'}44`,
    }}>
      {status}
    </span>
  );
}

export default function DashboardOverview() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0,
        }}>
          Overview
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
          Welcome back. Here is what is happening with your store.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px 24px',
          }}>
            <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 28, fontWeight: 800, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Recent Orders
          </h2>
          <Link href="/dashboard/orders" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--border)' }}>--</div>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>No orders yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>Orders will appear here once customers start buying</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Order', 'Customer', 'Product', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <tr key={order.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 24px', color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>{order.id}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--text)', fontSize: 13 }}>{order.customer}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--muted)', fontSize: 13 }}>{order.product}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{order.amount}</td>
                  <td style={{ padding: '14px 24px' }}><StatusBadge status={order.status} /></td>
                  <td style={{ padding: '14px 24px', color: 'var(--muted)', fontSize: 13 }}>{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Link href="/dashboard/products" style={{
          display: 'block',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '20px 24px',
          textDecoration: 'none',
          transition: 'border-color 0.15s',
        }}>
          <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Add Products
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>List your first products to start selling</div>
        </Link>
        <Link href="/dashboard/payouts" style={{
          display: 'block',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '20px 24px',
          textDecoration: 'none',
        }}>
          <div style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Set Up Payouts
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Connect your bank to receive earnings</div>
        </Link>
      </div>
    </div>
  );
}
