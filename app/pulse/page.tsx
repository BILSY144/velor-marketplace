'use client'

// Velor Pulse -- the private mobile ops command centre. Rebuilt 2026-07-13
// as a bento-grid hub: a headline health gauge, an "attention needed" strip
// surfacing anything that actually requires a decision right now, KPI tiles
// with live sparklines, and a tappable card for every operational area of
// the business -- each one drills into its own dedicated detail page (see
// app/pulse/* siblings). Previously this was a single long flat stat list
// with two of thirteen sections linking anywhere else; every section here
// is now a doorway, not a dead end.
//
// Data: GET /api/admin/pulse-data (extended this session with sparkline
// series, a composite Pulse Score, and cross-cutting "attention" counts --
// see that route's comments for exactly how each figure is computed).
// Origins/lattice coverage additionally reads the public GET /api/lattice
// endpoint directly (no admin token needed for that one, same as the public
// /origins pages use).

import { useEffect, useState } from 'react'
import {
  PulseShell,
  PulseHeader,
  PulseFooter,
  PulseLoading,
  ErrorBanner,
  TokenGate,
  KpiCard,
  SectionCard,
  RadialGauge,
  usePulseAuth,
  usePulseData,
  PULSE,
} from '@/components/pulse/PulseKit'
import { formatMoney, compactNumber } from '@/lib/pulseFormat'

type PulseData = {
  generatedAt: string
  traffic: { lastHour: number; today: number; last7d: number; last30d: number }
  signups: {
    buyers: { today: number; last7d: number; last30d: number }
    sellers: {
      today: number
      last7d: number
      last30d: number
      totalSellers: number
      pendingApproval: number
      applications: { status: string }[]
    }
  }
  listings: { today: number; last7d: number; last30d: number; totalApproved: number; pendingReview: number }
  orders: { today: number; last7d: number; last30d: number; total: number; gmv30dGBP: number }
  pipeline: { prospectsTotal: number; qualified: number; outreachSent7d: number }
  agents: { recent: { agentName: string; action: string; status: string; createdAt: string }[] }
  support: { openTickets: number; openPriorityTickets: number; openDisputes: number; pendingReturns: number }
  reviews: { averageRating: number | null; totalReviews: number }
  payouts: { pendingCount: number; pendingGBP: number }
  sparklines: { trafficHourly24h: number[]; gmvDaily14dGBP: number[] }
  pulseScore: { total: number; breakdown: { orders: number; applications: number; support: number; catalogue: number } }
  attention: {
    overdueApplications: number
    openDisputes: number
    priorityOpenTickets: number
    pendingReturns: number
    lowStockCount: number
    pendingCertificates: number
  }
  liveNow: { streamsLive: number }
  app?: { installsTotal: number; installsToday: number; installs7d: number; activeToday: number }
}

type LatticeSummary = { trading: number; totalCountries: number }

export default function PulsePage() {
  const { token, needsToken, unlock, lock } = usePulseAuth()
  const { data, loading, error } = usePulseData<PulseData>('/api/admin/pulse-data', token, { onUnauthorized: lock })
  const [lattice, setLattice] = useState<LatticeSummary | null>(null)

  useEffect(() => {
    fetch('/api/lattice')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setLattice(d) })
      .catch(() => {})
  }, [])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading && !data) {
    return (
      <PulseShell activeNav="home">
        <PulseLoading />
      </PulseShell>
    )
  }
  if (!data) {
    return (
      <PulseShell activeNav="home">
        <ErrorBanner>{error || 'No data yet.'}</ErrorBanner>
      </PulseShell>
    )
  }

  const attentionItems: { label: string; count: number; href: string }[] = [
    { label: 'application' + (data.attention.overdueApplications === 1 ? '' : 's') + ' overdue (24h SLA)', count: data.attention.overdueApplications, href: '/pulse/applications' },
    { label: 'open dispute' + (data.attention.openDisputes === 1 ? '' : 's'), count: data.attention.openDisputes, href: '/pulse/support' },
    { label: 'priority ticket' + (data.attention.priorityOpenTickets === 1 ? '' : 's') + ' open', count: data.attention.priorityOpenTickets, href: '/pulse/support' },
    { label: 'pending return' + (data.attention.pendingReturns === 1 ? '' : 's'), count: data.attention.pendingReturns, href: '/pulse/support' },
    { label: 'product' + (data.attention.lowStockCount === 1 ? '' : 's') + ' low on stock', count: data.attention.lowStockCount, href: '/pulse/listings' },
    { label: 'certificate' + (data.attention.pendingCertificates === 1 ? '' : 's') + ' awaiting review', count: data.attention.pendingCertificates, href: '/pulse/compliance' },
  ].filter((a) => a.count > 0)

  const pendingApplicationsCount = data.signups.sellers.applications.filter((a) => a.status === 'PENDING').length
  const latestAgent = data.agents.recent[0]

  return (
    <PulseShell activeNav="home">
      <PulseHeader title="VELOR PULSE" subtitle="Live operations command centre" back={null} live updatedAt={data.generatedAt} />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* Pulse Score */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          background: PULSE.surface,
          border: `1px solid ${PULSE.border}`,
          borderRadius: 18,
          padding: '18px 20px',
          marginBottom: 14,
        }}
      >
        <RadialGauge
          value={data.pulseScore.total}
          label={String(data.pulseScore.total)}
          sublabel="/ 100"
          color={data.pulseScore.total >= 80 ? PULSE.green : data.pulseScore.total >= 55 ? PULSE.amber : PULSE.red}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PULSE.text, marginBottom: 6 }}>Business Pulse Score</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <ScoreLine label="Orders" value={data.pulseScore.breakdown.orders} />
            <ScoreLine label="Applications" value={data.pulseScore.breakdown.applications} />
            <ScoreLine label="Support" value={data.pulseScore.breakdown.support} />
            <ScoreLine label="Catalogue" value={data.pulseScore.breakdown.catalogue} />
          </div>
        </div>
      </div>

      {/* Attention needed */}
      {attentionItems.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.red, textTransform: 'uppercase', marginBottom: 8 }}>
            &#9888; Needs attention
          </div>
          {attentionItems.map((a) => (
            <SectionCard key={a.label} href={a.href} title={`${a.count} ${a.label}`} accent={PULSE.red} urgent value={a.count} />
          ))}
        </div>
      )}

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <KpiCard
          href="/pulse/revenue"
          label="GMV (30d)"
          value={formatMoney(data.orders.gmv30dGBP)}
          spark={data.sparklines.gmvDaily14dGBP}
          accent={PULSE.green}
        />
        <KpiCard href="/pulse/traffic" label="Traffic today" value={compactNumber(data.traffic.today)} spark={data.sparklines.trafficHourly24h} accent={PULSE.blue} />
        <KpiCard href="/pulse/orders" label="Orders today" value={data.orders.today} accent={PULSE.accent} delta={`${data.orders.last7d} this week`} deltaGood />
        <KpiCard href="/pulse/sellers" label="Sellers" value={data.signups.sellers.totalSellers} accent={PULSE.purple} delta={`${data.signups.sellers.pendingApproval} pending`} deltaGood={data.signups.sellers.pendingApproval === 0} />
        <KpiCard href="/pulse/live" label="Live now" value={data.liveNow.streamsLive} accent={PULSE.red} delta={data.liveNow.streamsLive > 0 ? 'Broadcasting' : 'Nothing live'} deltaGood={data.liveNow.streamsLive > 0} />
        <KpiCard href="/pulse/origins" label="Origins trading" value={lattice ? `${lattice.trading}/${lattice.totalCountries}` : '—'} accent={PULSE.amber} />
        <KpiCard href="/pulse/app" label="App installs" value={compactNumber(data.app?.installsTotal ?? 0)} accent={PULSE.green} delta={`${data.app?.activeToday ?? 0} active today`} deltaGood={(data.app?.activeToday ?? 0) > 0} />
      </div>

      {/* Every business area, one tap away */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', marginBottom: 8 }}>Business areas</div>

      <SectionCard
        href="/pulse/traffic"
        title="Traffic & Growth"
        preview={`${data.traffic.today} views today · ${data.traffic.last7d} this week`}
        value={data.traffic.lastHour}
        accent={PULSE.blue}
      />
      <SectionCard
        href="/pulse/revenue"
        title="Revenue"
        preview={`${data.orders.last30d} orders (30d) · take rate + top sellers`}
        value={formatMoney(data.orders.gmv30dGBP)}
        accent={PULSE.green}
      />
      <SectionCard href="/pulse/orders" title="Orders" preview={`${data.orders.total} all time · ${data.orders.today} today`} value={data.orders.today} accent={PULSE.accent} />
      <SectionCard
        href="/pulse/sellers"
        title="Sellers"
        preview={`${data.signups.sellers.totalSellers} total · ${data.signups.sellers.last7d} new this week`}
        value={data.signups.sellers.pendingApproval || undefined}
        accent={PULSE.purple}
        urgent={data.signups.sellers.pendingApproval > 0}
      />
      <SectionCard
        href="/pulse/applications"
        title="Seller Applications"
        preview={`${pendingApplicationsCount} pending review · 24h SLA`}
        value={pendingApplicationsCount || undefined}
        accent={PULSE.amber}
        urgent={data.attention.overdueApplications > 0}
      />
      <SectionCard
        href="/pulse/pipeline"
        title="Seller Pipeline"
        preview={`${data.pipeline.prospectsTotal} prospects · ${data.pipeline.qualified} qualified · ${data.pipeline.outreachSent7d} outreach (7d)`}
        accent={PULSE.purple}
      />
      <SectionCard
        href="/pulse/listings"
        title="Listings & Catalogue"
        preview={`${data.listings.totalApproved} live · ${data.listings.pendingReview} pending review`}
        value={data.attention.lowStockCount || undefined}
        accent={PULSE.accent2}
        urgent={data.attention.lowStockCount > 0}
      />
      <SectionCard
        href="/pulse/payouts"
        title="Payouts"
        preview={`${data.payouts.pendingCount} pending · Stripe + Payoneer`}
        value={formatMoney(data.payouts.pendingGBP)}
        accent={PULSE.green}
      />
      <SectionCard
        href="/pulse/support"
        title="Support & Trust"
        preview={`${data.support.openTickets} open tickets · ${data.support.openDisputes} disputes · ${data.support.pendingReturns} returns`}
        value={data.support.openTickets || undefined}
        accent={PULSE.red}
        urgent={data.support.openPriorityTickets > 0}
      />
      <SectionCard
        href="/pulse/reviews"
        title="Reviews"
        preview={`${data.reviews.totalReviews} total · avg ${data.reviews.averageRating ?? 'no ratings yet'}`}
        accent={PULSE.amber}
      />
      <SectionCard
        href="/pulse/agents"
        title="Agent Activity"
        preview={latestAgent ? `${latestAgent.agentName} · ${latestAgent.action} (${latestAgent.status})` : 'No recent activity'}
        accent={PULSE.blue}
      />
      <SectionCard
        href="/pulse/live"
        title="Velor Live"
        preview={data.liveNow.streamsLive > 0 ? `${data.liveNow.streamsLive} stream${data.liveNow.streamsLive === 1 ? '' : 's'} live right now` : 'Nothing broadcasting right now'}
        value={data.liveNow.streamsLive || undefined}
        accent={PULSE.red}
      />
      <SectionCard
        href="/pulse/origins"
        title="Origins & Founding Seats"
        preview={lattice ? `${lattice.trading} of ${lattice.totalCountries} countries trading` : 'Loading...'}
        accent={PULSE.amber}
      />
      <SectionCard
        href="/pulse/compliance"
        title="Compliance"
        preview={`${data.attention.pendingCertificates} certificate${data.attention.pendingCertificates === 1 ? '' : 's'} awaiting review`}
        value={data.attention.pendingCertificates || undefined}
        accent={PULSE.red}
        urgent={data.attention.pendingCertificates > 0}
      />

      <PulseFooter />
    </PulseShell>
  )
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? PULSE.green : value >= 55 ? PULSE.amber : PULSE.red
  return (
    <div style={{ fontSize: 11, color: PULSE.muted, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
      <span>{label}</span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  )
}
