'use client'

import { useEffect, useState } from 'react'

type PulseData = {
  generatedAt: string
  traffic: {
    lastHour: number
    today: number
    last7d: number
    last30d: number
    topPaths: { path: string; views: number }[]
    byCountry: { country: string; views: number }[]
  }
  signups: {
    buyers: { today: number; last7d: number; last30d: number }
    sellers: {
      today: number
      last7d: number
      last30d: number
      totalSellers: number
      pendingApproval: number
    }
  }
  listings: {
    today: number
    last7d: number
    last30d: number
    totalApproved: number
    pendingReview: number
  }
  orders: {
    today: number
    last7d: number
    last30d: number
    total: number
    byStatus: { status: string; count: number }[]
    gmv30dGBP: number
    gmvNote: string
  }
}

export default function PulsePage() {
  const [token, setToken] = useState('')
  const [needsToken, setNeedsToken] = useState(false)
  const [data, setData] = useState<PulseData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('velor_admin_secret')
    if (saved) {
      setToken(saved)
    } else {
      setNeedsToken(true)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true
    const load = () => {
      fetch('/api/admin/pulse-data?token=' + encodeURIComponent(token))
        .then((r) => {
          if (r.status === 401) {
            localStorage.removeItem('velor_admin_secret')
            if (active) {
              setNeedsToken(true)
              setToken('')
            }
            return null
          }
          return r.json()
        })
        .then((d) => {
          if (!active || !d) return
          setData(d)
          setLoading(false)
          setError('')
        })
        .catch(() => {
          if (active) setError('Could not reach the server. Retrying...')
        })
    }
    load()
    const interval = setInterval(load, 30000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [token])

  function handleUnlock() {
    const el = document.getElementById('pulse-token-input') as HTMLInputElement | null
    const input = el && el.value ? el.value.trim() : ''
    if (!input) return
    localStorage.setItem('velor_admin_secret', input)
    setToken(input)
    setNeedsToken(false)
    setLoading(true)
  }

  if (needsToken) {
    return (
      <div style={styles.page}>
        <div style={styles.unlockBox}>
          <div style={styles.logo}>VELOR PULSE</div>
          <p style={styles.unlockText}>Enter your admin token to unlock the dashboard.</p>
          <input
            id="pulse-token-input"
            type="password"
            style={styles.input}
            placeholder="Admin token"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUnlock()
            }}
          />
          <button style={styles.button} onClick={handleUnlock}>
            Unlock
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingText}>Loading live data...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingText}>{error || 'No data yet.'}</div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logo}>VELOR PULSE</div>
        <div style={styles.timestamp}>Updated {new Date(data.generatedAt).toLocaleTimeString()}</div>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <Section title="TRAFFIC">
        <StatRow label="Last hour" value={data.traffic.lastHour} />
        <StatRow label="Today" value={data.traffic.today} />
        <StatRow label="Last 7 days" value={data.traffic.last7d} />
        <StatRow label="Last 30 days" value={data.traffic.last30d} />
        <div style={styles.subheading}>Top countries (30d)</div>
        {data.traffic.byCountry.length === 0 && <div style={styles.smallMuted}>No country data yet</div>}
        {data.traffic.byCountry.map((c) => (
          <StatRow key={c.country} label={c.country} value={c.views} small />
        ))}
        <div style={styles.subheading}>Top pages (7d)</div>
        {data.traffic.topPaths.map((p) => (
          <StatRow key={p.path} label={p.path} value={p.views} small />
        ))}
      </Section>

      <Section title="BUYER SIGNUPS">
        <StatRow label="Today" value={data.signups.buyers.today} />
        <StatRow label="Last 7 days" value={data.signups.buyers.last7d} />
        <StatRow label="Last 30 days" value={data.signups.buyers.last30d} />
      </Section>

      <Section title="SELLER SIGNUPS">
        <StatRow label="Today" value={data.signups.sellers.today} />
        <StatRow label="Last 7 days" value={data.signups.sellers.last7d} />
        <StatRow label="Last 30 days" value={data.signups.sellers.last30d} />
        <StatRow label="Total sellers" value={data.signups.sellers.totalSellers} highlight />
        <StatRow label="Pending approval" value={data.signups.sellers.pendingApproval} highlight />
      </Section>

      <Section title="LISTINGS">
        <StatRow label="New today" value={data.listings.today} />
        <StatRow label="New last 7 days" value={data.listings.last7d} />
        <StatRow label="New last 30 days" value={data.listings.last30d} />
        <StatRow label="Total live listings" value={data.listings.totalApproved} highlight />
        <StatRow label="Pending review" value={data.listings.pendingReview} highlight />
      </Section>

      <Section title="ORDERS & REVENUE">
        <StatRow label="Orders today" value={data.orders.today} />
        <StatRow label="Orders last 7 days" value={data.orders.last7d} />
        <StatRow label="Orders last 30 days" value={data.orders.last30d} />
        <StatRow label="Orders all time" value={data.orders.total} />
        <StatRow label="GMV (30d)" value={data.orders.gmv30dGBP.toFixed(2) + ' GBP'} highlight />
        <div style={styles.smallMuted}>{data.orders.gmvNote}</div>
        <div style={styles.subheading}>By status</div>
        {data.orders.byStatus.map((s) => (
          <StatRow key={s.status} label={s.status} value={s.count} small />
        ))}
      </Section>

      <div style={styles.footer}>Auto-refreshes every 30 seconds. Private dashboard, not linked from the public site.</div>
    </div>
  )
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{props.title}</div>
      {props.children}
    </div>
  )
}

function StatRow(props: { label: string; value: number | string; small?: boolean; highlight?: boolean }) {
  const rowStyle = props.small ? styles.statRowSmall : styles.statRow
  const labelStyle = props.small ? styles.statLabelSmall : styles.statLabel
  const baseColor = props.small ? '#ccc' : '#f2f2f2'
  const valueStyle = {
    fontSize: props.small ? 12 : 15,
    fontWeight: 600,
    color: props.highlight ? '#ff7a1a' : baseColor,
  }
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{props.label}</span>
      <span style={valueStyle}>{props.value}</span>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    background: '#0d0d0d',
    color: '#f2f2f2',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px 16px 60px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#ff7a1a',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  errorBanner: {
    background: '#3a1a00',
    color: '#ffb27a',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  section: {
    background: '#171717',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#888',
    marginBottom: 10,
  },
  subheading: {
    fontSize: 11,
    color: '#666',
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #232323',
  },
  statRowSmall: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
  },
  statLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  statLabelSmall: {
    fontSize: 12,
    color: '#999',
  },
  smallMuted: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  unlockBox: {
    maxWidth: 340,
    margin: '80px auto 0',
    textAlign: 'center',
  },
  unlockText: {
    fontSize: 13,
    color: '#999',
    margin: '16px 0 20px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#171717',
    color: '#f2f2f2',
    fontSize: 15,
    marginBottom: 12,
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: 'none',
    background: '#ff7a1a',
    color: '#0d0d0d',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    color: '#888',
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#555',
    marginTop: 20,
  },
}
