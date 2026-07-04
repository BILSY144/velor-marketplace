'use client'

import { useEffect, useState } from 'react'

interface AnalyticsData {
  summary: {
    totalRevenue: number
    totalEarnings: number
    totalOrders: number
    avgOrderValue: number
    pendingPayout: number
    totalProducts: number
  }
  dailyRevenue: { date: string; revenue: number }[]
  topProducts: { id: string; name: string; image: string | null; revenue: number; units: number }[]
  productsByStatus: {
    APPROVED: number
    PENDING_REVIEW: number
    REJECTED: number
    DELISTED: number
  }
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const W = 680
  const H = 200
  const pad = { top: 20, right: 20, bottom: 36, left: 64 }
  const cw = W - pad.left - pad.right
  const ch = H - pad.top - pad.bottom

  const pts = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * cw,
    y: pad.top + (1 - d.revenue / maxRevenue) * ch,
    ...d,
  }))

  const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${pad.top + ch} L ${pts[0].x} ${pad.top + ch} Z`

  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    value: maxRevenue * f,
    y: pad.top + ch - f * ch,
  }))

  const xLabels = pts.filter((_, i) => i % 7 === 0 || i === pts.length - 1)

  const hasData = data.some((d) => d.revenue > 0)

  if (!hasData) {
    return (
      <div
        style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#444',
          fontSize: '14px',
        }}
      >
        No revenue yet — your chart will appear once orders come in.
      </div>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {yLabels.map((l, i) => (
        <g key={i}>
          <line x1={pad.left} y1={l.y} x2={W - pad.right} y2={l.y} stroke="#2A2A2A" strokeWidth="1" />
          <text x={pad.left - 8} y={l.y + 4} textAnchor="end" fill="#666" fontSize="10">
            {fmt(l.value).replace('.00', '')}
          </text>
        </g>
      ))}
      {xLabels.map((p, i) => (
        <text key={i} x={p.x} y={H - 6} textAnchor="middle" fill="#555" fontSize="9">
          {new Date(p.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </text>
      ))}
      <path d={areaD} fill="#FF6B00" fillOpacity="0.12" />
      <path d={pathD} fill="none" stroke="#FF6B00" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts
        .filter((p) => p.revenue > 0)
        .map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#FF6B00" />
        ))}
    </svg>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/analytics')
      .then((r) => {
        if (!r.ok) throw new Error('Request failed with status ' + r.status)
        return r.json()
      })
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setData(null)
        setLoading(false)
      })
  }, [])

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '24px',
  }

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            Analytics
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '6px', fontSize: '14px' }}>Loading...</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ ...card, height: '96px', opacity: 0.4 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ color: 'var(--muted)', padding: '40px 0' }}>Failed to load analytics.</div>
    )
  }

  const { summary, dailyRevenue, topProducts, productsByStatus } = data

  const statCards = [
    { label: 'Total Revenue', value: fmt(summary.totalRevenue), sub: 'Gross all time' },
    { label: 'Your Earnings', value: fmt(summary.totalEarnings), sub: '85% after platform fee' },
    { label: 'Total Orders', value: summary.totalOrders.toString(), sub: 'All time' },
    { label: 'Avg Order Value', value: fmt(summary.avgOrderValue), sub: 'Per order' },
    { label: 'Pending Payout', value: fmt(summary.pendingPayout), sub: 'Awaiting transfer', accent: true },
    {
      label: 'Listed Products',
      value: summary.totalProducts.toString(),
      sub: `${productsByStatus.APPROVED} live`,
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
          }}
        >
          Analytics
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '6px', fontSize: '14px' }}>
          Track your store performance
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {statCards.map((c, i) => (
          <div key={i} style={card}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '10px',
              }}
            >
              {c.label}
            </div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: (c as any).accent ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'var(--font-display)',
                lineHeight: 1,
              }}
            >
              {c.value}
            </div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 24px 0',
          }}
        >
          Revenue — Last 30 Days
        </h2>
        <RevenueChart data={dailyRevenue} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Top products */}
        <div style={card}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 20px 0',
            }}
          >
            Top Products
          </h2>
          {topProducts.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '14px', padding: '16px 0' }}>
              No sales yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topProducts.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: i === 0 ? 'var(--accent)' : 'var(--muted)',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  {p.image && (
                    <img
                      src={p.image}
                      alt=""
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.units} sold</div>
                  </div>
                  <div
                    style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}
                  >
                    {fmt(p.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product status */}
        <div style={card}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 20px 0',
            }}
          >
            Product Status
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Live', value: productsByStatus.APPROVED, color: 'var(--green)' },
              { label: 'Pending Review', value: productsByStatus.PENDING_REVIEW, color: 'var(--accent)' },
              { label: 'Rejected', value: productsByStatus.REJECTED, color: 'var(--red)' },
              { label: 'Delisted', value: productsByStatus.DELISTED, color: '#444' },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                    {item.value}
                  </span>
                </div>
                <div
                  style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: item.color,
                      borderRadius: '2px',
                      width:
                        summary.totalProducts > 0
                          ? `${(item.value / summary.totalProducts) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
