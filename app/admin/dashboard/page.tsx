'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProspectEntry {
  name?: string
  platform?: string
  storeUrl?: string
  status?: string
}

interface OutreachEntry {
  prospect?: ProspectEntry
  emailType: string
  sentAt: string
  subject?: string
}

interface PathEntry {
  path: string
  views: number
}

interface PlatformEntry {
  platform: string
  count: number
}

interface DashboardData {
  prospects: {
    total: number
    byStatus: Record<string, number>
    byPlatform: PlatformEntry[]
  }
  outreach: {
    last7d: number
    last30d: number
    dailyLast7d: Record<string, number>
    recent: OutreachEntry[]
  }
  traffic: {
    last7d: number
    last30d: number
    dailyLast7d: Record<string, number>
    topPaths: PathEntry[]
  }
  platform: {
    totalSellers: number
    pendingSellers: number
    totalOrders: number
  }
  generatedAt: string
}

const STATUS_COLORS: Record<string, string> = {
  prospected: '#555',
  contacted: '#3b82f6',
  followed_up: '#f59e0b',
  replied: '#10b981',
  applied: '#8b5cf6',
  dropped: '#ef4444',
}

const STATUS_ORDER = ['prospected', 'contacted', 'followed_up', 'replied', 'applied', 'dropped']

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [needsToken, setNeedsToken] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    const role = (session?.user as { role?: string })?.role
    if (role !== 'ADMIN') {
      router.push('/')
      return
    }
    const stored = typeof window !== 'undefined' ? localStorage.getItem('velor_admin_secret') || '' : ''
    if (!stored) {
      setLoading(false)
      setNeedsToken(true)
      return
    }
    fetchData(stored)
  }, [status, session, router])

  async function fetchData(tok: string) {
    setLoading(true)
    setError('')
    setNeedsToken(false)
    try {
      const res = await fetch('/api/admin/dashboard-data?token=' + encodeURIComponent(tok))
      const d = await res.json()
      if (d.error === 'Unauthorized') {
        localStorage.removeItem('velor_admin_secret')
        setNeedsToken(true)
        setError('Invalid secret â please re-enter.')
        return
      }
      if (d.error) { setError(d.error); return }
      setData(d)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function handleConnect() {
    if (!tokenInput.trim()) return
    localStorage.setItem('velor_admin_secret', tokenInput.trim())
    fetchData(tokenInput.trim())
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#0A0A0A', color: '#fff', fontFamily: 'Inter, sans-serif' },
    header: { borderBottom: '1px solid #1E1E1E', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111' },
    h1: { fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', margin: 0 },
    main: { maxWidth: '1200px', margin: '0 auto', padding: '24px 28px' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' },
    card: { background: '#111', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '18px 20px' },
    label: { fontSize: '11px', color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' },
    val: { fontSize: '32px', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 },
    sub: { fontSize: '11px', color: '#555', marginTop: '4px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' },
    sectionTitle: { fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '14px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px', padding: '0 0 10px', borderBottom: '1px solid #1E1E1E' },
    td: { padding: '10px 0', fontSize: '13px', borderBottom: '1px solid #141414', verticalAlign: 'top' as const, color: '#ccc' },
    refreshBtn: { padding: '7px 16px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
    backLink: { fontSize: '13px', color: '#555', textDecoration: 'none' },
  }

  if (status === 'loading' || loading) {
    return (
      <div style={s.page}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555', fontSize: '14px' }}>
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (needsToken) {
    return (
      <div style={s.page}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '40px 36px', width: '360px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Admin Dashboard</div>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>Enter your ADMIN_SECRET to load live data.</div>
            {error && <div style={{ background: '#1a0000', border: '1px solid #500', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#f87171', marginBottom: '14px' }}>{error}</div>}
            <input
              type="password"
              placeholder="ADMIN_SECRET"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              style={{ width: '100%', padding: '10px 14px', background: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#fff', fontSize: '13px', marginBottom: '14px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
            <button onClick={handleConnect} style={{ ...s.refreshBtn, width: '100%', padding: '11px' }}>Connect</button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px' }}>
          <div style={{ color: '#f87171', fontSize: '14px' }}>Error: {error}</div>
          <button onClick={() => { const t = localStorage.getItem('velor_admin_secret') || ''; if (t) fetchData(t) }} style={s.refreshBtn}>Retry</button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const maxStatus = Math.max(1, ...STATUS_ORDER.map(s => data.prospects.byStatus[s] || 0))
  const maxPath = Math.max(1, ...data.traffic.topPaths.map(p => p.views))
  const ts = new Date(data.generatedAt)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" style={s.backLink}>Back</Link>
          <div style={s.h1}>Velor Operations</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#555' }}>
            {ts.toLocaleDateString('en-GB')} {ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            style={s.refreshBtn}
            onClick={() => { const t = localStorage.getItem('velor_admin_secret') || ''; if (t) fetchData(t) }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={s.main}>
        {/* KPI Cards */}
        <div style={s.grid4}>
          <div style={s.card}>
            <div style={s.label}>Prospects Found</div>
            <div style={{ ...s.val, color: '#3b82f6' }}>{data.prospects.total}</div>
            <div style={s.sub}>all time by scout agent</div>
          </div>
          <div style={s.card}>
            <div style={s.label}>Emails Sent (7d)</div>
            <div style={{ ...s.val, color: '#10b981' }}>{data.outreach.last7d}</div>
            <div style={s.sub}>{data.outreach.last30d} last 30 days</div>
          </div>
          <div style={s.card}>
            <div style={s.label}>Page Views (7d)</div>
            <div style={{ ...s.val, color: '#8b5cf6' }}>{data.traffic.last7d}</div>
            <div style={s.sub}>{data.traffic.last30d} last 30 days</div>
          </div>
          <div style={s.card}>
            <div style={s.label}>Active Sellers</div>
            <div style={{ ...s.val, color: '#FF6B00' }}>{data.platform.totalSellers}</div>
            <div style={s.sub}>{data.platform.totalOrders} orders placed</div>
          </div>
        </div>

        {/* Prospect Funnel + Top Sources */}
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.sectionTitle}>Prospect Funnel</div>
            {STATUS_ORDER.map(st => {
              const count = data.prospects.byStatus[st] || 0
              const pct = Math.round((count / maxStatus) * 100)
              const color = STATUS_COLORS[st] || '#555'
              return (
                <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #141414' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '13px', color: '#ccc', textTransform: 'capitalize' }}>{st.replace('_', ' ')}</div>
                  <div style={{ width: '80px', height: '5px', background: '#1E1E1E', borderRadius: '3px' }}>
                    <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, minWidth: '28px', textAlign: 'right' }}>{count}</div>
                </div>
              )
            })}
          </div>

          <div style={s.card}>
            <div style={s.sectionTitle}>Top Scouting Sources</div>
            {data.prospects.byPlatform.slice(0, 7).map(p => {
              const maxP = Math.max(1, ...data.prospects.byPlatform.map(x => x.count))
              const pct = Math.round((p.count / maxP) * 100)
              return (
                <div key={p.platform} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #141414' }}>
                  <div style={{ flex: 1, fontSize: '13px', color: '#ccc' }}>{p.platform}</div>
                  <div style={{ width: '80px', height: '5px', background: '#1E1E1E', borderRadius: '3px' }}>
                    <div style={{ width: pct + '%', height: '100%', background: '#FF6B00', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, minWidth: '28px', textAlign: 'right' }}>{p.count}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Pages */}
        <div style={{ ...s.card, marginBottom: '24px' }}>
          <div style={s.sectionTitle}>Top Pages (30 days)</div>
          {data.traffic.topPaths.length === 0
            ? <div style={{ color: '#555', fontSize: '13px' }}>No page view data yet.</div>
            : data.traffic.topPaths.map(p => (
              <div key={p.path} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
                <div style={{ flex: 1, fontSize: '12px', color: '#888', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.path}</div>
                <div style={{ width: '120px', height: '5px', background: '#1E1E1E', borderRadius: '3px' }}>
                  <div style={{ width: Math.round((p.views / maxPath) * 100) + '%', height: '100%', background: '#3b82f6', borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, minWidth: '32px', textAlign: 'right', color: '#ccc' }}>{p.views}</div>
              </div>
            ))
          }
        </div>

        {/* Recent Outreach */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Recent Outreach</div>
          {data.outreach.recent.length === 0
            ? <div style={{ color: '#555', fontSize: '13px' }}>No outreach logged yet. Agents run every 6 hours.</div>
            : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Seller</th>
                    <th style={s.th}>Platform</th>
                    <th style={s.th}>Email Type</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {data.outreach.recent.map((o, i) => {
                    const st = o.prospect?.status || ''
                    const color = STATUS_COLORS[st] || '#555'
                    const dt = new Date(o.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    return (
                      <tr key={i}>
                        <td style={s.td}>
                          <a href={o.prospect?.storeUrl || '#'} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>
                            {o.prospect?.name || '-'}
                          </a>
                        </td>
                        <td style={{ ...s.td, color: '666' }}>{o.prospect?.platform || '-'}</td>
                        <td style={s.td}>{o.emailType}</td>
                        <td style={s.td}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, background: color + '22', color, textTransform: 'capitalize', border: '1px solid ' + color + '44' }}>
                            {st.replace('_', ' ') || 'unknown'}
                          </span>
                        </td>
                        <td style={{ ...s.td, color: '#555' }}>{dt}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    </div>
  )
}
