'use client'

import { useState, useCallback } from 'react'
import {
  PulseShell,
  PulseHeader,
  PulseFooter,
  PulseLoading,
  ErrorBanner,
  TokenGate,
  ListCard,
  EmptyState,
  Badge,
  MiniBar,
  FilterBar,
  FilterInput,
  FilterSelect,
  FilterButton,
  PageNav,
  ResultsMeta,
  usePulseAuth,
  usePulseData,
  PULSE,
} from '@/components/pulse/PulseKit'
import { timeAgo } from '@/lib/pulseFormat'

type AgentLog = {
  id: string
  agentName: string
  action: string
  details: unknown
  status: string
  createdAt: string
}

type AgentNameCount = { agentName: string; count: number }
type StatusCount = { status: string; count: number }

type AgentsResponse = {
  logs: AgentLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  agentNames: AgentNameCount[]
  last24hByStatus: StatusCount[]
  last24hByAgent: AgentNameCount[]
}

// Same colour convention as StatusBadge in PulseKit, but AgentLog.status is
// free-text ('success', 'warning', 'error', 'failed', ...) rather than one of
// the fixed order/application statuses STATUS_COLOR knows about, so it needs
// its own small heuristic instead of reusing STATUS_COLOR directly.
function statusColor(status: string): string {
  const s = (status || '').toLowerCase()
  if (s.includes('fail') || s.includes('error')) return PULSE.red
  if (s === 'success' || s === 'ok') return PULSE.green
  return PULSE.amber
}

// Renders AgentLog.details defensively -- it's a Json? column and different
// agents have written it as either a real JSON object or a JSON-stringified
// string, so this never assumes a shape. Plain function (not a try/catch
// wrapped around JSX) so a weird value can never crash the page render.
function detailsPreview(details: unknown): string | null {
  if (details === null || details === undefined) return null
  try {
    if (typeof details === 'string') {
      const trimmed = details.trim()
      return trimmed.length ? trimmed : null
    }
    const json = JSON.stringify(details)
    return json && json !== '{}' && json !== 'null' ? json : null
  } catch {
    return null
  }
}

const detailsStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'ui-monospace, monospace',
  color: PULSE.mutedDark,
  marginTop: 6,
  background: PULSE.surface,
  border: `1px solid ${PULSE.border}`,
  borderRadius: 8,
  padding: '6px 8px',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  wordBreak: 'break-word',
}

export default function PulseAgentsPage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const [agentName, setAgentName] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (agentName) params.set('agentName', agentName)
  if (status) params.set('status', status)
  if (q) params.set('q', q)
  params.set('page', String(page))
  params.set('pageSize', '30')

  const { data, loading, error } = usePulseData<AgentsResponse>(`/api/admin/pulse-agents?${params.toString()}`, token, { onUnauthorized: lock })

  const runFilters = useCallback(() => setPage(1), [])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell>
        <PulseHeader title="Agent Activity" subtitle="Automation log" />
        <PulseLoading label="Loading agent activity..." />
      </PulseShell>
    )
  }

  const last24hByAgent = data?.last24hByAgent || []
  const maxLast24h = Math.max(1, ...last24hByAgent.map((a) => a.count))

  return (
    <PulseShell>
      <PulseHeader title="Agent Activity" subtitle="Automation log" live updatedAt={data ? new Date().toISOString() : null} />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {data && (
        <div
          style={{
            background: PULSE.surface,
            border: `1px solid ${PULSE.border}`,
            borderRadius: 14,
            padding: '13px 14px',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, color: PULSE.muted, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 10 }}>
            Last 24 hours
          </div>

          {last24hByAgent.length === 0 ? (
            <EmptyState>No agent runs in the last 24 hours.</EmptyState>
          ) : (
            last24hByAgent.map((a) => (
              <MiniBar key={a.agentName} label={a.agentName} value={a.count} max={maxLast24h} color={PULSE.accent} />
            ))
          )}

          {data.last24hByStatus.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {data.last24hByStatus.map((s) => (
                <Badge key={s.status} color={statusColor(s.status)}>
                  {s.status}: {s.count}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <FilterBar>
        <FilterSelect value={agentName} onChange={(e) => { setAgentName(e.target.value); setPage(1) }}>
          <option value="">All agents</option>
          {data?.agentNames.map((a) => (
            <option key={a.agentName} value={a.agentName}>
              {a.agentName} ({a.count})
            </option>
          ))}
        </FilterSelect>
        <FilterInput
          placeholder="Status..."
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterInput
          placeholder="Search action..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runFilters() }}
        />
        <FilterButton onClick={runFilters}>Search</FilterButton>
      </FilterBar>

      {data && <ResultsMeta total={data.total} noun="log" page={data.page} totalPages={data.totalPages} />}
      {data && data.logs.length === 0 && <EmptyState>No agent activity matches these filters.</EmptyState>}

      {data && data.logs.map((log) => {
        const preview = detailsPreview(log.details)
        return (
          <ListCard key={log.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: PULSE.text, fontFamily: "'Space Grotesk', sans-serif" }}>{log.agentName}</span>
              <Badge color={statusColor(log.status)}>{log.status}</Badge>
            </div>
            <div style={{ fontSize: 13, color: PULSE.text, marginBottom: 2 }}>{log.action}</div>
            <div style={{ fontSize: 11.5, color: PULSE.mutedDark }}>{timeAgo(log.createdAt)}</div>
            {preview && <div style={detailsStyle}>{preview}</div>}
          </ListCard>
        )
      })}

      {data && <PageNav page={page} totalPages={data.totalPages} onPage={setPage} />}
      <PulseFooter />
    </PulseShell>
  )
}
