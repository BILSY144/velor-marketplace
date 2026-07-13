'use client'

// Founding-seat / lattice coverage tracker for Pulse. Reuses the public
// GET /api/lattice endpoint directly -- the same live-computed-from-
// APPROVED-listings source the buyer-facing /origins and /founding pages
// use (see the 2026-07-13 checkpoint that built those). No separate admin
// route was needed: the data is already public, this page just gives
// William an operational read on it (how much of the 190-country map is
// actually open) instead of him having to browse the public site.

import { useEffect, useState } from 'react'
import {
  PulseShell,
  PulseHeader,
  PulseFooter,
  PulseLoading,
  TokenGate,
  KpiCard,
  MiniBar,
  RadialGauge,
  EmptyState,
  usePulseAuth,
  PULSE,
} from '@/components/pulse/PulseKit'

type LatticeResponse = {
  totalCountries: number
  trading: number
  countries: { code: string; name: string; products: number; specialities: string[] }[]
  specialities: Record<string, { countries: number; products: number }>
}

const REGION_BY_CODE: Record<string, string> = {
  DZ:'Africa',AO:'Africa',BJ:'Africa',BW:'Africa',BF:'Africa',BI:'Africa',CM:'Africa',CV:'Africa',CF:'Africa',TD:'Africa',KM:'Africa',CG:'Africa',CD:'Africa',DJ:'Africa',EG:'Africa',GQ:'Africa',ER:'Africa',SZ:'Africa',ET:'Africa',GA:'Africa',GM:'Africa',GH:'Africa',GN:'Africa',GW:'Africa',KE:'Africa',LS:'Africa',LR:'Africa',LY:'Africa',MG:'Africa',MW:'Africa',ML:'Africa',MR:'Africa',MU:'Africa',MA:'Africa',MZ:'Africa',NA:'Africa',NE:'Africa',NG:'Africa',RW:'Africa',SN:'Africa',SC:'Africa',SL:'Africa',SO:'Africa',ZA:'Africa',SS:'Africa',SD:'Africa',TZ:'Africa',TG:'Africa',TN:'Africa',UG:'Africa',ZM:'Africa',ZW:'Africa',
  AF:'Asia',AM:'Asia',AZ:'Asia',BH:'Asia',BD:'Asia',BT:'Asia',BN:'Asia',KH:'Asia',CN:'Asia',GE:'Asia',HK:'Asia',IN:'Asia',ID:'Asia',IR:'Asia',IQ:'Asia',IL:'Asia',JP:'Asia',JO:'Asia',KZ:'Asia',KW:'Asia',KG:'Asia',LA:'Asia',LB:'Asia',MO:'Asia',MY:'Asia',MV:'Asia',MN:'Asia',MM:'Asia',NP:'Asia',OM:'Asia',PK:'Asia',PH:'Asia',QA:'Asia',SA:'Asia',SG:'Asia',KR:'Asia',LK:'Asia',SY:'Asia',TW:'Asia',TJ:'Asia',TH:'Asia',TL:'Asia',TR:'Asia',TM:'Asia',AE:'Asia',UZ:'Asia',VN:'Asia',YE:'Asia',
  AL:'Europe',AD:'Europe',AT:'Europe',BY:'Europe',BE:'Europe',BA:'Europe',BG:'Europe',HR:'Europe',CY:'Europe',CZ:'Europe',DK:'Europe',EE:'Europe',FI:'Europe',FR:'Europe',DE:'Europe',GR:'Europe',HU:'Europe',IS:'Europe',IE:'Europe',IT:'Europe',LV:'Europe',LI:'Europe',LT:'Europe',LU:'Europe',MT:'Europe',MD:'Europe',MC:'Europe',ME:'Europe',NL:'Europe',MK:'Europe',NO:'Europe',PL:'Europe',PT:'Europe',RO:'Europe',RU:'Europe',SM:'Europe',RS:'Europe',SK:'Europe',SI:'Europe',ES:'Europe',SE:'Europe',CH:'Europe',UA:'Europe',GB:'Europe',VA:'Europe',
  AG:'The Americas',AR:'The Americas',BS:'The Americas',BB:'The Americas',BZ:'The Americas',BO:'The Americas',BR:'The Americas',CA:'The Americas',CL:'The Americas',CO:'The Americas',CR:'The Americas',CU:'The Americas',DM:'The Americas',DO:'The Americas',EC:'The Americas',SV:'The Americas',GD:'The Americas',GT:'The Americas',GY:'The Americas',HT:'The Americas',HN:'The Americas',JM:'The Americas',MX:'The Americas',NI:'The Americas',PA:'The Americas',PY:'The Americas',PE:'The Americas',KN:'The Americas',LC:'The Americas',VC:'The Americas',SR:'The Americas',TT:'The Americas',US:'The Americas',UY:'The Americas',VE:'The Americas',
  AU:'Oceania',FJ:'Oceania',KI:'Oceania',NZ:'Oceania',PG:'Oceania',WS:'Oceania',SB:'Oceania',TO:'Oceania',TV:'Oceania',VU:'Oceania',
}
const REGION_ORDER = ['Africa', 'Asia', 'Europe', 'The Americas', 'Oceania', 'Elsewhere']

export default function PulseOriginsPage() {
  const { needsToken, unlock } = usePulseAuth()
  const [lattice, setLattice] = useState<LatticeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/lattice')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setLattice(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (needsToken) return <TokenGate onUnlock={unlock} />
  if (loading || !lattice) {
    return (
      <PulseShell>
        <PulseHeader title="Origins" subtitle="Founding-seat coverage" />
        <PulseLoading label="Loading lattice..." />
      </PulseShell>
    )
  }

  const seatOpen = lattice.totalCountries - lattice.trading
  const coveragePct = (lattice.trading / lattice.totalCountries) * 100

  const byRegion = new Map<string, { total: number; trading: number }>()
  for (const code of Object.keys(REGION_BY_CODE)) {
    const region = REGION_BY_CODE[code]
    if (!byRegion.has(region)) byRegion.set(region, { total: 0, trading: 0 })
  }
  const tradingCodes = new Set(lattice.countries.map((c) => c.code))
  for (const code of Object.keys(REGION_BY_CODE)) {
    const region = REGION_BY_CODE[code]
    const entry = byRegion.get(region)!
    entry.total += 1
    if (tradingCodes.has(code)) entry.trading += 1
  }

  const topSpecialities = Object.entries(lattice.specialities)
    .sort((a, b) => b[1].countries - a[1].countries)
    .slice(0, 12)

  const topCountries = [...lattice.countries].sort((a, b) => b.products - a.products).slice(0, 15)

  return (
    <PulseShell>
      <PulseHeader title="Origins" subtitle="Founding-seat / lattice coverage" live />

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: PULSE.surface, border: `1px solid ${PULSE.border}`, borderRadius: 18, padding: '18px 20px', marginBottom: 14 }}>
        <RadialGauge value={lattice.trading} max={lattice.totalCountries} label={String(lattice.trading)} sublabel={`/ ${lattice.totalCountries}`} color={PULSE.amber} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PULSE.text, marginBottom: 4 }}>Countries trading</div>
          <div style={{ fontSize: 12, color: PULSE.muted, lineHeight: 1.5 }}>
            {seatOpen} founding seat{seatOpen === 1 ? '' : 's'} still open &middot; {coveragePct.toFixed(1)}% of the map is live
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <KpiCard label="Trading" value={lattice.trading} accent={PULSE.green} />
        <KpiCard label="Seat open" value={seatOpen} accent={PULSE.accent} />
        <KpiCard label="Specialities covered" value={Object.keys(lattice.specialities).length} accent={PULSE.purple} />
        <KpiCard label="Total countries" value={lattice.totalCountries} accent={PULSE.blue} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', marginBottom: 8 }}>Coverage by region</div>
      {REGION_ORDER.filter((r) => byRegion.has(r)).map((r) => {
        const v = byRegion.get(r)!
        return <MiniBar key={r} label={`${r} (${v.trading}/${v.total})`} value={v.trading} max={v.total} color={PULSE.amber} />
      })}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', margin: '20px 0 8px' }}>Top trading countries</div>
      {topCountries.length === 0 ? (
        <EmptyState>No countries trading yet.</EmptyState>
      ) : (
        topCountries.map((c) => <MiniBar key={c.code} label={c.name} value={c.products} max={topCountries[0].products} color={PULSE.green} formatValue={(v) => `${v} product${v === 1 ? '' : 's'}`} />)
      )}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: PULSE.muted, textTransform: 'uppercase', margin: '20px 0 8px' }}>Speciality coverage (by country count)</div>
      {topSpecialities.length === 0 ? (
        <EmptyState>No specialities represented yet.</EmptyState>
      ) : (
        topSpecialities.map(([term, v]) => (
          <MiniBar key={term} label={term} value={v.countries} max={topSpecialities[0][1].countries} color={PULSE.purple} formatValue={(n) => `${n} countr${n === 1 ? 'y' : 'ies'}`} />
        ))
      )}

      <PulseFooter note="Sourced live from GET /api/lattice, the same feed the public /origins pages use." />
    </PulseShell>
  )
}
