'use client'

import { useEffect, useState, useCallback } from 'react'

type Application = {
  id: string
  businessName: string
  contactName: string
  contactEmail: string
  website: string | null
  storeDescription: string | null
  productCategories: string[]
  sampleImages: string[]
  country: string | null
  status: string
  verificationStatus: string
  rejectionReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  verifiedAt: string | null
  verificationNotes: string | null
  prospectId: string | null
  createdAt: string
  updatedAt: string
}

type ApplicationsResponse = {
  applications: Application[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function ApplicationsPage() {
  const [token, setToken] = useState('')
  const [needsToken, setNeedsToken] = useState(false)
  const [data, setData] = useState<ApplicationsResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [country, setCountry] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const saved = localStorage.getItem('velor_admin_secret')
    if (saved) {
      setToken(saved)
    } else {
      setNeedsToken(true)
      setLoading(false)
    }
  }, [])

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (country) params.set('country', country)
    params.set('page', String(page))
    params.set('pageSize', '25')

    fetch('/api/admin/applications?' + params.toString(), {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((r) => {
        if (r.status === 401) {
          localStorage.removeItem('velor_admin_secret')
          setNeedsToken(true)
          setToken('')
          return null
        }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        setData(d)
        setLoading(false)
        setError('')
      })
      .catch(() => {
        setError('Could not reach the server.')
        setLoading(false)
      })
  }, [token, q, status, country, page])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  function handleUnlock() {
    const el = document.getElementById('applications-token-input') as HTMLInputElement | null
    const input = el && el.value ? el.value.trim() : ''
    if (!input) return
    localStorage.setItem('velor_admin_secret', input)
    setToken(input)
    setNeedsToken(false)
    setLoading(true)
  }

  function runFilters() {
    setPage(1)
  }

  if (needsToken) {
    return (
      <div style={styles.page}>
        <div style={styles.unlockBox}>
          <div style={styles.logo}>VELOR PULSE</div>
          <p style={styles.unlockText}>Enter your admin token to unlock the dashboard.</p>
          <input
            id="applications-token-input"
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

  if (loading && !data) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingText}>Loading applications...</div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.logo}>VELOR PULSE</div>
          <div style={styles.subLogo}>All seller applications</div>
        </div>
        <a href="/pulse" style={styles.backLink}>&larr; Dashboard</a>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.filterBar}>
        <input
          style={styles.filterInput}
          placeholder="Search name, contact, email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <input
          style={styles.filterInput}
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <input
          style={styles.filterInput}
          placeholder="Status (e.g. PENDING, APPROVED, REJECTED)"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <button style={styles.filterButton} onClick={runFilters}>Search</button>
      </div>

      {data && (
        <div style={styles.resultsMeta}>
          {data.total} application{data.total === 1 ? '' : 's'} &middot; page {data.page} of {data.totalPages}
        </div>
      )}

      {data && data.applications.length === 0 && (
        <div style={styles.smallMuted}>No applications match these filters.</div>
      )}

      {data && data.applications.map((a) => {
        const fmt = (d: string | null) =>
          d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
        return (
          <div key={a.id} style={styles.appCard}>
            <div style={styles.appCardTop}>
              <span style={styles.appName}>{a.businessName}</span>
              <span style={styles.appBadge}>{a.status}</span>
            </div>
            <div style={styles.appMeta}>{a.country || 'Unknown country'} &middot; verification: {a.verificationStatus.replace(/_/g, ' ')}</div>
            <div style={styles.appMeta}>{a.contactName} &middot; {a.contactEmail}</div>
            {a.website && (
              <div style={styles.appMeta}>
                <a href={a.website} target="_blank" rel="noreferrer" style={styles.link}>{a.website}</a>
              </div>
            )}
            {a.storeDescription && <div style={styles.appDescription}>{a.storeDescription}</div>}
            {a.productCategories.length > 0 && (
              <div style={styles.smallMuted}>Categories: {a.productCategories.join(', ')}</div>
            )}
            <div style={styles.smallMuted}>{a.sampleImages.length} sample image{a.sampleImages.length === 1 ? '' : 's'}</div>
            {a.rejectionReason && (
              <div style={styles.rejectionBox}>Rejected: {a.rejectionReason}</div>
            )}
            <div style={styles.smallMuted}>
              Submitted {fmt(a.createdAt)}
              {a.reviewedAt && <> &middot; reviewed {fmt(a.reviewedAt)}{a.reviewedBy ? ' by ' + a.reviewedBy : ''}</>}
              {a.verifiedAt && <> &middot; verified {fmt(a.verifiedAt)}</>}
            </div>
            {a.verificationNotes && <div style={styles.smallMuted}>Verification notes: {a.verificationNotes}</div>}
            {a.prospectId && <div style={styles.smallMuted}>Prospect: {a.prospectId}</div>}
          </div>
        )
      })}

      {data && data.totalPages > 1 && (
        <div style={styles.pageNav}>
          <button
            style={styles.pageButton}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span style={styles.smallMuted}>Page {page} of {data.totalPages}</span>
          <button
            style={styles.pageButton}
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      <div style={styles.footer}>Auto-refreshes every 30 seconds. Private dashboard, not linked from the public site.</div>
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
  subLogo: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  backLink: {
    fontSize: 13,
    color: '#ccc',
    textDecoration: 'none',
  },
  errorBanner: {
    background: '#3a1a00',
    color: '#ffb27a',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterInput: {
    flex: '1 1 160px',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#171717',
    color: '#f2f2f2',
    fontSize: 13,
    boxSizing: 'border-box',
  },
  filterButton: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#ff7a1a',
    color: '#0d0d0d',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  resultsMeta: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
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
    color: '#ff7a1a',
  },
  appMeta: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 2,
  },
  appDescription: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
    marginBottom: 4,
  },
  link: {
    color: '#ff9d4d',
  },
  rejectionBox: {
    fontSize: 12,
    color: '#ffb27a',
    background: '#3a1a00',
    borderRadius: 6,
    padding: '6px 8px',
    marginTop: 4,
  },
  pageNav: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  pageButton: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#171717',
    color: '#f2f2f2',
    fontSize: 13,
    cursor: 'pointer',
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
