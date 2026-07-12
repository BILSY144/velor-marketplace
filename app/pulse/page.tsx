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
      applications: {
        id: string
        businessName: string
        contactName: string
        contactEmail: string
        website: string | null
        storeDescription: string | null
        productCategories: string[]
        country: string
        status: string
        verificationStatus: string
        rejectionReason: string | null
        reviewedBy: string | null
        verifiedAt: string | null
        verificationNotes: string | null
        createdAt: string
        reviewedAt: string | null
        updatedAt: string
        daysPending: number
      }[]
      applicationsByCountry: { country: string; count: number }[]
      pendingSignups: {
        id: string
        storeName: string
        contactName: string
        contactEmail: string
        country: string
        tier: string
        createdAt: string
        updatedAt: string
      }[]
      pendingSignupsByCountry: { country: string; count: number }[]
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
  pipeline: {
    prospectsTotal: number
    byStatus: { status: string; count: number }[]
    qualified: number
    disqualified: number
    unscreened: number
    outreachSent7d: number
    outreachSent30d: number
  }
  sellerBreakdown: {
    byCountry: { country: string; count: number }[]
    byTier: { tier: string; count: number }[]
  }
  agents: {
    recent: { agentName: string; action: string; status: string; createdAt: string }[]
    last24hByStatus: { status: string; count: number }[]
  }
  support: {
    openTickets: number
    openPriorityTickets: number
    openDisputes: number
    pendingReturns: number
  }
  reviews: {
    averageRating: number | null
    totalReviews: number
    last7d: number
  }
  payouts: {
    pendingCount: number
    pendingGBP: number
    fxNote: string
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
      fetch('/api/admin/pulse-data', { headers: { Authorization: 'Bearer ' + token } })
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
            type="text" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-1p-ignore data-lpignore="true"
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

      <Section title="PENDING SELLER SIGN-UPS">
        <div style={styles.smallMuted}>
          Sellers with approved:false right now &mdash; includes brand-new signups awaiting approval AND any
          previously-approved seller later suspended or rejected, since Velor doesn't store those as separate states.
        </div>
        <div style={styles.subheading}>By country</div>
        {data.signups.sellers.pendingSignupsByCountry.length === 0 ? (
          <div style={styles.smallMuted}>None right now.</div>
        ) : (
          data.signups.sellers.pendingSignupsByCountry.map((c) => (
            <StatRow key={c.country} label={c.country} value={c.count} small />
          ))
        )}
        <div style={styles.subheading}>Each seller</div>
        {data.signups.sellers.pendingSignups.length === 0 ? (
          <div style={styles.smallMuted}>No pending seller sign-ups.</div>
        ) : (
          data.signups.sellers.pendingSignups.map((s) => {
            const createdMs = new Date(s.createdAt).getTime()
            const updatedMs = new Date(s.updatedAt).getTime()
            const fmt = (d: Date) =>
              d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            const fmtSpan = (hrs: number) =>
              hrs < 24 ? hrs.toFixed(1) + 'h' : Math.floor(hrs / 24) + 'd ' + Math.round(hrs % 24) + 'h'
            const waitingHrs = (Date.now() - createdMs) / (1000 * 60 * 60)
            return (
              <div key={s.id} style={styles.appCard}>
                <div style={styles.appCardTop}>
                  <span style={styles.appName}>{s.storeName}</span>
                  <span style={{ ...styles.appBadge, color: '#f2c94c' }}>{s.tier}</span>
                </div>
                <div style={styles.appMeta}>{s.country}</div>
                <div style={styles.appMeta}>
                  {s.contactName} &middot; {s.contactEmail}
                </div>
                <div style={styles.smallMuted}>
                  Signed up {fmt(new Date(s.createdAt))} &middot; waiting {fmtSpan(waitingHrs)}
                  {updatedMs !== createdMs && <> &middot; last updated {fmt(new Date(s.updatedAt))}</>}
                </div>
              </div>
            )
          })
        )}
      </Section>

      <Section title="SELLER APPLICATIONS">
        <div style={styles.subheading}>Applicants by country (all time)</div>
        {data.signups.sellers.applicationsByCountry.length === 0 ? (
          <div style={styles.smallMuted}>No applications yet.</div>
        ) : (
          data.signups.sellers.applicationsByCountry.map((c) => (
            <StatRow key={c.country} label={c.country} value={c.count} small />
          ))
        )}
        <div style={styles.subheading}>Most recent applications</div>
        {data.signups.sellers.applications.length === 0 ? (
          <div style={styles.smallMuted}>No applications yet.</div>
        ) : (
          data.signups.sellers.applications.map((a) => {
            const createdMs = new Date(a.createdAt).getTime()
            const fmt = (d: Date) =>
              d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            const fmtSpan = (hrs: number) =>
              hrs < 24 ? hrs.toFixed(1) + 'h' : Math.floor(hrs / 24) + 'd ' + Math.round(hrs % 24) + 'h'
            let badgeLabel = ''
            let badgeColor = '#4dd88a'
            let timescaleLabel = ''
            if (a.status === 'APPROVED') {
              badgeLabel = 'SUCCESS'
              badgeColor = '#4dd88a'
              const decidedMs = a.reviewedAt ? new Date(a.reviewedAt).getTime() : null
              timescaleLabel = decidedMs ? 'Approved in ' + fmtSpan((decidedMs - createdMs) / (1000 * 60 * 60)) : 'Approved'
            } else if (a.status === 'REJECTED') {
              badgeLabel = 'REJECTED'
              badgeColor = '#ff4d4d'
              const decidedMs = a.reviewedAt ? new Date(a.reviewedAt).getTime() : null
              timescaleLabel = decidedMs ? 'Decided in ' + fmtSpan((decidedMs - createdMs) / (1000 * 60 * 60)) : 'Rejected'
            } else {
              const hoursPending = (Date.now() - createdMs) / (1000 * 60 * 60)
              const overdue = hoursPending > 24
              const escalated = !overdue && hoursPending > 12
              badgeLabel = overdue ? 'OVERDUE' : escalated ? 'ESCALATED' : 'PENDING'
              badgeColor = overdue ? '#ff4d4d' : escalated ? '#ff7a1a' : '#f2c94c'
              timescaleLabel = fmtSpan(hoursPending) + ' pending (24h SLA)'
            }
            return (
              <div key={a.id} style={styles.appCard}>
                <div style={styles.appCardTop}>
                  <span style={styles.appName}>{a.businessName}</span>
                  <span style={{ ...styles.appBadge, color: badgeColor }}>{badgeLabel}</span>
                </div>
                <div style={styles.appMeta}>
                  {a.country} &middot; {a.verificationStatus.replace(/_/g, ' ')}
                </div>
                <div style={styles.appMeta}>
                  {a.contactName} &middot; {a.contactEmail}
                </div>
                <div style={styles.smallMuted}>
                  Submitted {fmt(new Date(a.createdAt))} &middot; {timescaleLabel}
                </div>
                {a.website && <div style={styles.appMeta}>{a.website}</div>}
                {a.productCategories && a.productCategories.length > 0 && (
                  <div style={styles.smallMuted}>{a.productCategories.join(', ')}</div>
                )}
                {a.storeDescription && <div style={styles.smallMuted}>{a.storeDescription}</div>}
                {a.rejectionReason && <div style={styles.rejectionBox}>{a.rejectionReason}</div>}
              </div>
            )
          })
        )}
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

      <Section title="SELLER PIPELINE">
        <StatRow label="Total prospects" value={data.pipeline.prospectsTotal} highlight />
        <StatRow label="Qualified" value={data.pipeline.qualified} />
        <StatRow label="Disqualified" value={data.pipeline.disqualified} />
        <StatRow label="Not yet screened" value={data.pipeline.unscreened} />
        <StatRow label="Outreach sent (7d)" value={data.pipeline.outreachSent7d} />
        <StatRow label="Outreach sent (30d)" value={data.pipeline.outreachSent30d} />
        <div style={styles.subheading}>By status</div>
        {data.pipeline.byStatus.map((s) => (
          <StatRow key={s.status} label={s.status} value={s.count} small />
        ))}
      </Section>

      <Section title="SELLERS BY COUNTRY & TIER">
        <div style={styles.subheading}>Top countries</div>
        {data.sellerBreakdown.byCountry.map((c) => (
          <StatRow key={c.country} label={c.country} value={c.count} small />
        ))}
        <div style={styles.subheading}>By tier</div>
        {data.sellerBreakdown.byTier.map((t) => (
          <StatRow key={t.tier} label={t.tier} value={t.count} small />
        ))}
      </Section>

      <Section title="AGENT ACTIVITY">
        <div style={styles.subheading}>Last 24h by status</div>
        {data.agents.last24hByStatus.map((s) => (
          <StatRow key={s.status} label={s.status} value={s.count} small />
        ))}
        <div style={styles.subheading}>Most recent</div>
        {data.agents.recent.map((a, i) => (
          <div key={i} style={styles.appMeta}>
            {a.agentName} &mdash; {a.action} ({a.status}) &middot;{' '}
            {new Date(a.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
        ))}
      </Section>

      <Section title="SUPPORT & TRUST">
        <StatRow label="Open support tickets" value={data.support.openTickets} highlight />
        <StatRow label="Priority open tickets" value={data.support.openPriorityTickets} />
        <StatRow label="Open disputes" value={data.support.openDisputes} />
        <StatRow label="Pending returns" value={data.support.pendingReturns} />
      </Section>

      <Section title="REVIEWS">
        <StatRow label="Average rating" value={data.reviews.averageRating ?? 'No reviews yet'} highlight />
        <StatRow label="Total reviews" value={data.reviews.totalReviews} />
        <StatRow label="New last 7 days" value={data.reviews.last7d} />
      </Section>

      <Section title="PAYOUTS">
        <StatRow label="Pending payouts" value={data.payouts.pendingCount} highlight />
        <StatRow label="Pending amount" value={data.payouts.pendingGBP.toFixed(2) + ' GBP'} highlight />
        <div style={styles.smallMuted}>{data.payouts.fxNote}</div>
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
  appCard: {
    background: '#1e1e1e',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 8,
  },
  appCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#f2f2f2',
  },
  appBadge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  appMeta: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 2,
  },
  rejectionBox: {
    fontSize: 12,
    color: '#ffb27a',
    background: '#3a1a00',
    borderRadius: 6,
    padding: '6px 8px',
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
