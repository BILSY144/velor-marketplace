import React, { useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { Dim, Btn } from '../ui'
import { Chrome } from '../components/Chrome'
import { useSession } from '../store'
import { fmt, useI18nTick } from '../i18n'
import { fetchAnalytics, fetchStorefront, saveStorefront } from '../api'

// SELLER GROWTH (final Phase B surface). Two screens mirroring the last two
// /dashboard pages that had API wiring but no UI: Analytics (revenue,
// earnings, 30-day chart, top pieces, listing health) and Storefront
// (theme picker, applied live to the seller's public store page on the
// website). Same honesty rules as the rest of the studio: real numbers or
// a plain zero state, preview banner when signed out, nothing fabricated.

function Head({ kick, title, sub, live }: { kick: string; title: string; sub: string; live: boolean }) {
  return (
    <View>
      {live ? null : (
        <View style={s.pv}>
          <Ionicons name="eye-outline" size={13} color={C.accent} />
          <Text style={s.pvTx}>PREVIEW — live once your seller account is approved.</Text>
        </View>
      )}
      <Text style={s.kick}>{kick}</Text>
      <Text style={s.h1}>{title}</Text>
      <Dim style={{ marginTop: 8, lineHeight: 18 }}>{sub}</Dim>
    </View>
  )
}
function ApplyFooter({ live }: { live: boolean }) {
  const nav = useNavigation<any>()
  if (live) return null
  return (
    <View style={{ marginTop: 20 }}>
      <Btn label="Apply to sell — five minutes" onPress={() => nav.navigate('Apply', {})} />
    </View>
  )
}

// ------------------------------------------------------------- Analytics
export function AnalyticsScreen() {
  useI18nTick()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const live = Boolean(useSession((st) => st.user)?.sellerId)
  const q = useQuery({ queryKey: ['sellerAnalytics'], queryFn: fetchAnalytics, enabled: live, staleTime: 60_000 })
  const d = q.data
  const sum = d?.summary
  const daily: { date: string; revenue: number }[] = Array.isArray(d?.dailyRevenue) ? d.dailyRevenue : []
  const top: { id: string; name: string; image: string | null; revenue: number; units: number }[] = Array.isArray(d?.topProducts) ? d.topProducts : []
  const byStatus = d?.productsByStatus
  const maxDay = Math.max(1, ...daily.map((x) => x.revenue))
  const hasSales = (sum?.totalOrders ?? 0) > 0

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Head
            kick="SELLER STUDIO"
            title="Analytics."
            sub={`Your real numbers, straight from the ledger. Earnings shown after Velor's ${d?.commissionRate ? Math.round(d.commissionRate * 100) : 10}% commission.`}
            live={live}
          />

          {live && q.isLoading ? <Dim style={{ marginTop: 20 }}>Adding up your ledger…</Dim> : null}
          {live && !q.isLoading && !d ? (
            <View style={s.zero}>
              <Ionicons name="cloud-offline-outline" size={18} color={C.mut} />
              <Text style={s.zeroT}>Could not reach the ledger</Text>
              <Text style={s.zeroS}>Pull down to try again in a moment. Nothing is shown here unless it is real.</Text>
            </View>
          ) : null}

          {live && d ? (
            <>
              <View style={s.statGrid}>
                <Stat label="TOTAL REVENUE" value={fmt(sum?.totalRevenue ?? 0)} />
                <Stat label="YOUR EARNINGS" value={fmt(sum?.totalEarnings ?? 0)} />
                <Stat label="ORDERS" value={String(sum?.totalOrders ?? 0)} />
                <Stat label="AVG ORDER" value={fmt(sum?.avgOrderValue ?? 0)} />
                <Stat label="PENDING PAYOUT" value={fmt(sum?.pendingPayout ?? 0)} />
                <Stat label="LISTINGS" value={String(sum?.totalProducts ?? 0)} />
              </View>

              <Text style={s.sec}>LAST 30 DAYS</Text>
              {hasSales ? (
                <View style={s.chartCard}>
                  <View style={s.chartRow}>
                    {daily.map((day) => (
                      <View key={day.date} style={s.barSlot}>
                        <View
                          style={[
                            s.bar,
                            {
                              height: Math.max(2, Math.round((day.revenue / maxDay) * 92)),
                              backgroundColor: day.revenue > 0 ? C.accent : C.line,
                            },
                          ]}
                        />
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={s.axis}>{daily[0]?.date.slice(5)}</Text>
                    <Text style={s.axis}>today</Text>
                  </View>
                </View>
              ) : (
                <View style={s.zero}>
                  <Ionicons name="trending-up-outline" size={18} color={C.mut} />
                  <Text style={s.zeroT}>No sales yet</Text>
                  <Text style={s.zeroS}>The moment your first piece sells, this chart starts for real. No demo data, ever.</Text>
                </View>
              )}

              {top.length > 0 ? (
                <>
                  <Text style={s.sec}>TOP PIECES</Text>
                  {top.map((p, i) => (
                    <View key={p.id} style={s.topRow}>
                      <Text style={s.topRank}>{i + 1}</Text>
                      {p.image ? <Image source={{ uri: p.image }} style={s.topImg} contentFit="cover" /> : <View style={[s.topImg, { backgroundColor: C.surf2 }]} />}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.topName} numberOfLines={1}>{p.name}</Text>
                        <Text style={s.topSub}>{p.units} {p.units === 1 ? 'sold' : 'sold'} · {fmt(p.revenue)}</Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : null}

              {byStatus ? (
                <>
                  <Text style={s.sec}>LISTING HEALTH</Text>
                  <View style={s.statusCard}>
                    <StatusLine icon="checkmark-circle" color="#37C978" label="Live" n={byStatus.APPROVED ?? 0} />
                    <StatusLine icon="time-outline" color={C.accent} label="In review" n={byStatus.PENDING_REVIEW ?? 0} />
                    <StatusLine icon="close-circle-outline" color="#E05B5B" label="Rejected" n={byStatus.REJECTED ?? 0} />
                    <StatusLine icon="eye-off-outline" color={C.mut} label="Delisted" n={byStatus.DELISTED ?? 0} />
                  </View>
                </>
              ) : null}
            </>
          ) : null}

          {!live ? (
            <View style={s.zero}>
              <Ionicons name="analytics-outline" size={18} color={C.mut} />
              <Text style={s.zeroT}>Revenue, earnings, top pieces</Text>
              <Text style={s.zeroS}>Once you sell on Velor this page shows your real totals, a 30-day revenue chart, your best sellers and the health of every listing.</Text>
            </View>
          ) : null}
          <ApplyFooter live={live} />
        </View>
      </ScrollView>
      <Chrome back="Studio" onBack={() => nav.goBack()} />
    </View>
  )
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statL}>{label}</Text>
      <Text style={s.statV}>{value}</Text>
    </View>
  )
}
function StatusLine({ icon, color, label, n }: { icon: any; color: string; label: string; n: number }) {
  return (
    <View style={s.stLine}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={s.stLabel}>{label}</Text>
      <Text style={s.stN}>{n}</Text>
    </View>
  )
}

// ------------------------------------------------------------- Storefront
// Theme catalogue mirrored from the website's lib/store-themes.ts. The id is
// what the server validates; swatch colours match each theme's tokens so the
// picker previews honestly. The server enforces access rules — if it answers
// "locked" we say so instead of pretending.
const THEMES: { id: string; name: string; tagline: string; bg: string; accent: string; text: string }[] = [
  { id: 'classic', name: 'Classic', tagline: 'Velor dark with electric amber', bg: '#0D0D0D', accent: '#F5821F', text: '#FFFFFF' },
  { id: 'midnight', name: 'Midnight', tagline: 'Deep navy, cool and premium', bg: '#0A1020', accent: '#5B8CFF', text: '#EAF0FF' },
  { id: 'aurora', name: 'Aurora', tagline: 'Teal-green glow on charcoal', bg: '#0B1412', accent: '#00E6A8', text: '#EAFFF6' },
  { id: 'minimal', name: 'Minimal White', tagline: 'Clean light, black on white', bg: '#FFFFFF', accent: '#111111', text: '#141414' },
  { id: 'boutique', name: 'Boutique', tagline: 'Warm cream with an editorial serif', bg: '#FBF7F0', accent: '#B4712A', text: '#2A2118' },
  { id: 'noir', name: 'Noir', tagline: 'Pure black, stark white', bg: '#000000', accent: '#FFFFFF', text: '#FFFFFF' },
  { id: 'sunset', name: 'Sunset', tagline: 'Orange to pink, warm and bold', bg: '#160B12', accent: '#FF6B6B', text: '#FFEDF2' },
  { id: 'ocean', name: 'Ocean', tagline: 'Fresh blues, calm and trustworthy', bg: '#071A22', accent: '#22C3E6', text: '#E6FAFF' },
  { id: 'forest', name: 'Forest', tagline: 'Deep green, natural and grounded', bg: '#0C130D', accent: '#63C776', text: '#EDFFEF' },
  { id: 'royal', name: 'Royal', tagline: 'Rich purple with gold accents', bg: '#120A1E', accent: '#C9A227', text: '#F4EDFF' },
  { id: 'mono', name: 'Mono', tagline: 'Refined greyscale, all business', bg: '#101010', accent: '#D9D9D9', text: '#F2F2F2' },
  { id: 'candy', name: 'Candy', tagline: 'Playful pink, light and friendly', bg: '#FFF5F9', accent: '#F35D8E', text: '#33141F' },
  { id: 'steel', name: 'Steel', tagline: 'Cool slate, modern and sharp', bg: '#11151A', accent: '#7FA3C4', text: '#E8EEF4' },
  { id: 'sand', name: 'Sand', tagline: 'Soft beige, warm and inviting', bg: '#F6F0E6', accent: '#A9825A', text: '#2E2618' },
  { id: 'neon', name: 'Neon', tagline: 'Dark with electric magenta', bg: '#0B0712', accent: '#F031C8', text: '#F8EDFF' },
]

export function StorefrontScreen() {
  useI18nTick()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const live = Boolean(useSession((st) => st.user)?.sellerId)
  const q = useQuery({ queryKey: ['storefront'], queryFn: fetchStorefront, enabled: live, staleTime: 60_000 })
  const current: string = q.data?.theme ?? 'classic'
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Head
            kick="SELLER STUDIO"
            title="Storefront."
            sub="Pick the look of your public store page. The change goes live on velorcommerce.store the moment you apply it."
            live={live}
          />

          {err ? (
            <View style={s.errBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#E05B5B" />
              <Text style={s.errTx}>{err}</Text>
            </View>
          ) : null}

          <Text style={s.sec}>THEMES · {THEMES.length}</Text>
          {THEMES.map((th) => {
            const active = live && current === th.id
            return (
              <View key={th.id} style={[s.themeCard, active && { borderColor: C.accent }]}>
                <View style={[s.swatch, { backgroundColor: th.bg, borderColor: th.bg === '#FFFFFF' || th.bg === '#FBF7F0' || th.bg === '#FFF5F9' || th.bg === '#F6F0E6' ? C.line : th.bg }]}>
                  <View style={[s.swDot, { backgroundColor: th.accent }]} />
                  <View style={[s.swBar, { backgroundColor: th.text, opacity: 0.85 }]} />
                  <View style={[s.swBar, { backgroundColor: th.text, opacity: 0.4, width: 26 }]} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.thName}>{th.name}</Text>
                  <Text style={s.thTag} numberOfLines={1}>{th.tagline}</Text>
                </View>
                {active ? (
                  <View style={s.activePill}>
                    <Ionicons name="checkmark" size={12} color={C.accent} />
                    <Text style={s.activeTx}>LIVE</Text>
                  </View>
                ) : live ? (
                  <Pressable
                    style={[s.applyBtn, busyId === th.id && { opacity: 0.5 }]}
                    disabled={busyId !== null}
                    onPress={async () => {
                      setErr(null)
                      setBusyId(th.id)
                      const r = await saveStorefront({ themeId: th.id })
                      setBusyId(null)
                      if (r.ok) q.refetch()
                      else setErr(r.error === 'locked' ? 'This theme is locked for your plan right now.' : r.error ?? 'Could not apply the theme. Try again in a moment.')
                    }}
                  >
                    <Text style={s.applyTx}>{busyId === th.id ? 'Applying…' : 'Apply'}</Text>
                  </Pressable>
                ) : null}
              </View>
            )
          })}
          <ApplyFooter live={live} />
        </View>
      </ScrollView>
      <Chrome back="Studio" onBack={() => nav.goBack()} />
    </View>
  )
}

const s = StyleSheet.create({
  pv: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,107,0,0.10)', borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)', borderRadius: 12, padding: 11, marginBottom: 16 },
  pvTx: { fontFamily: F.displayMed, fontSize: 10, letterSpacing: 0.4, color: C.accent, flex: 1 },
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  h1: { fontFamily: F.serifLight, fontSize: 32, color: C.text, marginTop: 8 },
  sec: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2, color: C.mut, marginTop: 26, marginBottom: 4 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  stat: { width: '48%', flexGrow: 1, backgroundColor: C.surf, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 13 },
  statL: { fontFamily: F.displayMed, fontSize: 8.5, letterSpacing: 1.4, color: C.mut },
  statV: { fontFamily: F.serifLight, fontSize: 21, color: C.text, marginTop: 6 },
  chartCard: { marginTop: 12, backgroundColor: C.surf, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 96 },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 2 },
  axis: { fontFamily: F.body, fontSize: 9.5, color: C.mut },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12, backgroundColor: C.surf, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 11 },
  topRank: { fontFamily: F.serifLight, fontSize: 17, color: C.mut, width: 18, textAlign: 'center' },
  topImg: { width: 42, height: 42, borderRadius: 10 },
  topName: { fontFamily: F.bodySemi, fontSize: 12.5, color: C.text },
  topSub: { fontFamily: F.body, fontSize: 11, color: C.mut, marginTop: 3 },
  statusCard: { marginTop: 12, backgroundColor: C.surf, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, gap: 10 },
  stLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  stLabel: { fontFamily: F.body, fontSize: 12.5, color: C.text, flex: 1 },
  stN: { fontFamily: F.bodySemi, fontSize: 13, color: C.text },
  themeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, backgroundColor: C.surf, borderWidth: 1, borderColor: C.line, borderRadius: 15, padding: 12 },
  swatch: { width: 58, height: 44, borderRadius: 10, borderWidth: 1, padding: 7, justifyContent: 'space-between' },
  swDot: { width: 10, height: 10, borderRadius: 5 },
  swBar: { height: 3, width: 36, borderRadius: 2 },
  thName: { fontFamily: F.bodySemi, fontSize: 13, color: C.text },
  thTag: { fontFamily: F.body, fontSize: 11, color: C.mut, marginTop: 2 },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.accent, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 },
  activeTx: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 1, color: C.accent },
  applyBtn: { backgroundColor: C.accent, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 13 },
  applyTx: { fontFamily: F.bodySemi, fontSize: 11.5, color: '#fff' },
  errBox: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14, borderWidth: 1, borderColor: 'rgba(224,91,91,0.4)', backgroundColor: 'rgba(224,91,91,0.08)', borderRadius: 11, padding: 10 },
  errTx: { fontFamily: F.body, fontSize: 11.5, color: '#E05B5B', flex: 1 },
  zero: { marginTop: 18, backgroundColor: C.surf, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 18, alignItems: 'flex-start', gap: 4 },
  zeroT: { fontFamily: F.bodySemi, fontSize: 13, color: C.text, marginTop: 6 },
  zeroS: { fontFamily: F.body, fontSize: 11.5, color: C.mut, lineHeight: 17 },
})
