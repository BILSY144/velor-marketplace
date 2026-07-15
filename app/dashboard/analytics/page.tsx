'use client'

import { useEffect, useState } from 'react'
import { DASHBOARD_TIER_THEME, PlanBadge, tierCardStyle, type SellerTier } from '@/lib/dashboard-theme'

interface AnalyticsData {
    tier: string
    commissionRate: number
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
    trend?: {
      windowDays: number
      revenueChangePct: number | null
      ordersChangePct: number | null
    }
    topOpportunity?: {
      productId: string
      name: string
      message: string
    } | null
    previousPeriod?: {
      label: string
      revenue: number
      orders: number
      earnings: number
    }
    canExport?: boolean
}

function fmt(amount: number): string {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

function fmtPct(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A'
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
}

function RevenueChart({ data, lineColor }: { data: { date: string; revenue: number }[]; lineColor: string }) {
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
                        No revenue yet, your chart will appear once orders come in.
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
                <path d={areaD} fill={lineColor} fillOpacity="0.12" />
                <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {pts
                      .filter((p) => p.revenue > 0)
                      .map((p, i) => (
                                  <circle key={i} cx={p.x} cy={p.y} r="3" fill={lineColor} />
                                ))}
          </svg>
        )
}

function exportCsv(data: AnalyticsData) {
    const lines: string[] = []
        lines.push('Velor Analytics Export')
    lines.push(`Tier,${data.tier}`)
    lines.push('')
    lines.push('Summary')
    lines.push('Metric,Value')
    lines.push(`Total Revenue,${data.summary.totalRevenue.toFixed(2)}`)
    lines.push(`Your Earnings,${data.summary.totalEarnings.toFixed(2)}`)
    lines.push(`Total Orders,${data.summary.totalOrders}`)
    lines.push(`Avg Order Value,${data.summary.avgOrderValue.toFixed(2)}`)
  lines.push(`Pending Payout,${data.summary.pendingPayout.toFixed(2)}`)
    if (data.previousPeriod) {
          lines.push('')
          lines.push(`Previous Period (${data.previousPeriod.label})`)
          lines.push('Metric,Value')
          lines.push(`Revenue,${data.previousPeriod.revenue.toFixed(2)}`)
          lines.push(`Orders,${data.previousPeriod.orders}`)
          lines.push(`Earnings,${data.previousPeriod.earnings.toFixed(2)}`)
    }
    lines.push('')
    lines.push('Daily Revenue (Last 30 Days)')
    lines.push('Date,Revenue')
    for (const d of data.dailyRevenue) {
          lines.push(`${d.date},${d.revenue.toFixed(2)}`)
    }
    lines.push('')
    lines.push('Top Products')
    lines.push('Name,Units Sold,Revenue')
    for (const p of data.topProducts) {
          lines.push(`"${p.name.replace(/"/g, '""')}",${p.units},${p.revenue.toFixed(2)}`)
    }

  const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `velor-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

// Simple client-side 30-day forward projection from the last 30 days of
// revenue. Enterprise-only bonus widget — no backend change required.
function forecastNext30(dailyRevenue: { date: string; revenue: number }[]) {
    const withSales = dailyRevenue.filter((d) => d.revenue > 0)
    if (withSales.length < 3) return null
    const avgDaily = dailyRevenue.reduce((s, d) => s + d.revenue, 0) / dailyRevenue.length
    const half = Math.floor(dailyRevenue.length / 2)
    const firstHalfAvg = dailyRevenue.slice(0, half).reduce((s, d) => s + d.revenue, 0) / Math.max(half, 1)
    const secondHalfAvg = dailyRevenue.slice(half).reduce((s, d) => s + d.revenue, 0) / Math.max(dailyRevenue.length - half, 1)
    const momentum = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0
    const projected = avgDaily * 30 * (1 + Math.max(-0.5, Math.min(1, momentum)))
    return { projected: Math.max(0, projected), momentum }
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
    const tier = (data.tier as SellerTier) in DASHBOARD_TIER_THEME ? (data.tier as SellerTier) : 'STARTER'
    const theme = DASHBOARD_TIER_THEME[tier]
    const isPro = data.tier === 'PRO' || data.tier === 'ENTERPRISE'
    const isEnterprise = data.tier === 'PRO' || data.tier === 'ENTERPRISE'
    const tCard = (extra?: React.CSSProperties) => tierCardStyle(theme, { padding: '24px', ...extra })
    const forecast = isEnterprise ? forecastNext30(dailyRevenue) : null

  const statCards = [
    { label: 'Total Revenue', value: fmt(summary.totalRevenue), sub: 'Gross all time' },
    {
            label: 'Your Earnings',
            value: fmt(summary.totalEarnings),
            sub: `${Math.round((1 - data.commissionRate) * 100)}% after platform fee`,
    },
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
              <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                                          <PlanBadge tier={tier} />
                                </div>
                                <p style={{ color: 'var(--muted)', marginTop: '6px', fontSize: '14px' }}>
                                            Track your store performance
                                </p>
                      </div>
                {isEnterprise && data.canExport && (
                    <button
                                  onClick={() => exportCsv(data)}
                                  style={{
                                                  background: 'linear-gradient(90deg, #FFD54A, #FF6B00)',
                                                  color: '#111111',
                                                  border: 'none',
                                                  borderRadius: '8px',
                                                  padding: '10px 18px',
                                                  fontSize: '13px',
                                                  fontWeight: 800,
                    cursor: 'pointer',
                                  }}
                                >
                                Export Report (CSV)
                    </button>
                      )}
              </div>

          {/* Stat cards get a coloured top accent for Pro/Enterprise */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {statCards.map((s, i) => (
              <div key={s.label} style={tCard({ position: 'relative', overflow: 'hidden', padding: '20px 22px' })}>
                {isEnterprise && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #FFD54A, #FF6B00)' }} />}
                {isPro && !isEnterprise && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#4FC3F7' }} />}
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.accent ? theme.statValueColor : 'var(--text)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {isEnterprise && forecast && (
                  <div style={tCard({ marginBottom: '24px', position: 'relative', overflow: 'hidden' })}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #FFD54A, #FF6B00)' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#FFD54A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Pro Forecast
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Projected next 30 days, based on your recent momentum</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#FFD54A' }}>
                          {fmt(forecast.projected)}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: forecast.momentum >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {forecast.momentum >= 0 ? '↑' : '↓'} {Math.abs(forecast.momentum * 100).toFixed(0)}% momentum
                        </span>
                      </div>
                  </div>
          )}

          {isPro && data.trend && (
                  <div style={{ ...tCard(), marginBottom: '24px' }}>
                              <h2
                                            style={{
                                                            fontFamily: 'var(--font-display)',
                                                            fontSize: '18px',
                                                            fontWeight: 700,
                                                            color: 'var(--text)',
                                                            margin: '0 0 20px 0',
                                            }}
                                          >
                                          Growth Insights
                              </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: data.topOpportunity ? '20px' : 0 }}>
                                        <div>
                                                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                                                      Revenue vs Prior {data.trend.windowDays} Days
                                                      </div>
                                                      <div style={{ fontSize: '20px', fontWeight: 800, color: (data.trend.revenueChangePct ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                                        {fmtPct(data.trend.revenueChangePct)}
                                                      </div>
                                        </div>
                                        <div>
                                                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                                                      Orders vs Prior {data.trend.windowDays} Days
                                                      </div>
                                                      <div style={{ fontSize: '20px', fontWeight: 800, color: (data.trend.ordersChangePct ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                                        {fmtPct(data.trend.ordersChangePct)}
                                                      </div>
                                        </div>
                            </div>
                    {data.topOpportunity && (
                                <div style={{ padding: '14px', background: 'var(--bg)', border: `1px solid ${theme.cardBorder}`, borderRadius: '8px' }}>
                                              <div style={{ fontSize: '12px', fontWeight: 700, color: theme.headingAccent, marginBottom: '4px' }}>
                                                              Top Opportunity
                                              </div>
                                              <div style={{ fontSize: '13px', color: 'var(--text)' }}>{data.topOpportunity.message}</div>
                                </div>
                            )}
                  </div>
              )}

          {isEnterprise && data.previousPeriod && (
                  <div style={{ ...tCard(), marginBottom: '24px' }}>
                              <h2
                                            style={{
                                                            fontFamily: 'var(--font-display)',
                                                            fontSize: '18px',
                                                            fontWeight: 700,
                                                            color: 'var(--text)',
                                                            margin: '0 0 20px 0',
                                            }}
                                          >
                                          Period Comparison
                              </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                        <div>
                                                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                                                      Revenue ({data.previousPeriod.label})
                                                      </div>
                                                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{fmt(data.previousPeriod.revenue)}</div>
                                        </div>
                                        <div>
                                                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                                                      Orders ({data.previousPeriod.label})
                                                      </div>
                                                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{data.previousPeriod.orders}</div>
                                        </div>
                                        <div>
                                                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                                                      Earnings ({data.previousPeriod.label})
                                                      </div>
                                                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{fmt(data.previousPeriod.earnings)}</div>
                                        </div>
                            </div>
                  </div>
              )}

                <div style={{ ...tCard(), marginBottom: '24px' }}>
                          <h2
                                      style={{
                                                    fontFamily: 'var(--font-display)',
                                                    fontSize: '18px',
                                                    fontWeight: 700,
                                                    color: 'var(--text)',
                                                    margin: '0 0 24px 0',
                                      }}
                                    >
                                    Revenue, Last 30 Days
                          </h2>
                        <RevenueChart data={dailyRevenue} lineColor={theme.chartLine} />
                </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={tCard()}>
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
                      <div style={{ color: 'var(--muted)', fontSize: '13px' }}>No sales yet.</div>
                    ) : (
                      topProducts.map((p, i) => (
                                      <div
                                                        key={p.id}
                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '12px',
                                                                            padding: '10px 0',
                                                                            borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                                                        }}
                                                      >
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
                                                      <div style={{ fontSize: '14px', fontWeight: 700, color: theme.headingAccent === 'var(--text)' ? 'var(--accent)' : theme.headingAccent, flexShrink: 0 }}>
                                                        {fmt(p.revenue)}
                                                      </div>
                                      </div>
                                    ))
                    )}
                      </div>

                        <div style={tCard()}>
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
