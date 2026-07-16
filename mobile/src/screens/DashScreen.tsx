import React, { useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { Kicker, Dim, Btn } from '../ui'
import { Chrome } from '../components/Chrome'
import { useSession } from '../store'
import {
  fetchSellerPayouts,
  fetchSellerOrders,
  fetchSellerProducts,
  fetchSubscription,
} from '../api'

// Seller dashboard — plate 27's structure, in TWO honest modes:
//
// SIGNED OUT: the PREVIEW — same sections, real zero states, a live
// STARTER/PRO toggle showing what each plan gets, and the sign-in door.
//
// SIGNED IN (approved seller, same account as the website): REAL data —
// escrow and paid-out from /api/dashboard/payouts, the order pipeline from
// /api/dashboard/orders, listings from /api/dashboard/products, tier and
// listing caps from /api/seller/subscription. Nothing invented: metrics
// with no backing endpoint yet (7-day views) show an em dash, not a number.
type Tier = 'STARTER' | 'PRO'

export default function DashScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const user = useSession((s) => s.user)
  const live = Boolean(user?.sellerId)
  const [previewTier, setPreviewTier] = useState<Tier>('STARTER')

  const sub = useQuery({ queryKey: ['sub'], queryFn: fetchSubscription, enabled: live })
  const payouts = useQuery({ queryKey: ['sellerPayouts'], queryFn: fetchSellerPayouts, enabled: live })
  const orders = useQuery({ queryKey: ['sellerOrders'], queryFn: fetchSellerOrders, enabled: live })
  const products = useQuery({ queryKey: ['sellerProducts'], queryFn: fetchSellerProducts, enabled: live })

  const tier: Tier = live ? ((sub.data?.tier as Tier) ?? 'STARTER') : previewTier
  const pro = tier === 'PRO'
  const founding = live && Boolean((sub.data as any)?.foundingBadge)

  const os = orders.data ?? []
  const nNew = os.filter((o) => o.status === 'PENDING' || o.status === 'PAID').length
  const nShip = os.filter((o) => o.status === 'PROCESSING').length
  const nTransit = os.filter((o) => o.status === 'SHIPPED').length
  const nDone = os.filter((o) => o.status === 'DELIVERED').length

  const money = (n?: number) =>
    n === undefined ? '—' : `£${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`

  const listings = products.data ?? []
  const listingCap = live
    ? ((sub.data as any)?.listingLimit as number | null | undefined)
    : pro
      ? null
      : 10

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 60 }}>
        <View style={{ paddingHorizontal: 20 }}>
          {/* Banner — preview + sign-in door, or live status */}
          {live ? (
            <View style={[s.preview, s.liveBanner]}>
              <View style={s.liveDotSm} />
              <Text style={[s.previewTx, { color: C.green }]}>
                LIVE — signed in as {user?.email ?? 'your seller account'}
              </Text>
            </View>
          ) : (
            <View style={s.preview}>
              <Ionicons name="eye-outline" size={14} color={C.accent} />
              <Text style={s.previewTx}>
                PREVIEW — this is your dashboard the day you're approved. Toggle the plan to
                compare.
              </Text>
              <Pressable style={s.signInChip} onPress={() => nav.navigate('SignIn')}>
                <Text style={s.signInTx}>Sign in</Text>
              </Pressable>
            </View>
          )}

          <Text style={s.kickDim}>YOUR CHANNEL</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <Text style={s.h1}>{live ? 'Your channel' : 'Your store'}</Text>
            {founding ? <Text style={s.fbadge}>FOUNDING</Text> : null}
            <Text style={s.tbadge}>{pro ? 'PRO · 4%' : 'STARTER · 10%'}</Text>
          </View>
          {!live ? (
            <Dim style={{ fontSize: 11.5, marginTop: 4 }}>
              Founding sellers carry the badge here — with Pro free for life.
            </Dim>
          ) : null}

          {/* Tier toggle — preview only; a real account shows its real tier */}
          {!live ? (
            <View style={s.seg}>
              {(['STARTER', 'PRO'] as Tier[]).map((t) => (
                <Pressable key={t} style={[s.segBtn, previewTier === t && s.segOn]} onPress={() => setPreviewTier(t)}>
                  <Text style={[s.segTx, previewTier === t && s.segTxOn]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Stat tiles */}
          <View style={s.statRow}>
            {(
              [
                [live ? '—' : '0', 'Views · 7d', null],
                [live ? String(nShip + nNew) : '0', 'To ship', () => nav.navigate('SellerOrders')],
                [live ? money(payouts.data?.pendingEscrow) : '£0', 'In escrow', () => nav.navigate('Payouts')],
                [live ? money(payouts.data?.lifetimePaidOut) : '£0', 'Paid out', () => nav.navigate('Payouts')],
              ] as [string, string, (() => void) | null][]
            ).map(([k, l, fn]) => (
              <Pressable key={l} style={s.stat} onPress={fn ?? undefined}>
                <Text style={s.dk}>{k}</Text>
                <Text style={s.dl}>{l}</Text>
              </Pressable>
            ))}
          </View>

          {/* Revenue */}
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={s.kickDim}>{live ? 'EARNED · ALL ORDERS' : 'REVENUE · 30D'}</Text>
                <Text style={s.rev}>
                  {live ? money(os.reduce((n, o) => n + o.totalPayout, 0)) : '£0'}
                </Text>
              </View>
            </View>
            {live && os.length ? (
              <Dim style={{ fontSize: 11.5, marginTop: 8 }}>
                {os.length} order{os.length === 1 ? '' : 's'} · your share after commission,
                escrow-protected until each delivery confirms.
              </Dim>
            ) : (
              <View style={s.chartZero}>
                <View style={s.chartBase} />
                <Dim style={{ fontSize: 11, textAlign: 'center' }}>Your first sale draws this line.</Dim>
              </View>
            )}
          </View>

          {/* AI account manager — Pro-only */}
          <View style={[s.card, !pro && { opacity: 0.55 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={s.aiIcon}>
                <Ionicons name="sparkles" size={16} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fd}>Your AI account manager</Text>
                <Text style={s.smdim}>
                  {pro ? 'Watching your channel around the clock' : 'Pro-only · upgrade any time from here'}
                </Text>
              </View>
              {!pro ? <Ionicons name="lock-closed" size={14} color={C.mut} /> : null}
            </View>
            {pro ? (
              <View style={{ marginTop: 12, gap: 8 }}>
                <Text style={s.aitip}>
                  {live
                    ? 'She reads your real views, orders and holds — ask her anything about your channel.'
                    : 'She reads your real views, orders and holds — her first tips appear with your first listings.'}
                </Text>
                <Pressable style={s.lineBtn} onPress={() => nav.navigate('Assist')}>
                  <Text style={s.lineBtnTx}>Ask her anything</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {/* Order pipeline */}
          <Text style={[s.kickDim, { marginTop: 24 }]}>ORDER PIPELINE</Text>
          <View style={s.pipeRow}>
            {(
              [
                ['New', nNew],
                ['To ship', nShip],
                ['In transit', nTransit],
                ['Delivered', nDone],
              ] as [string, number][]
            ).map(([l, n]) => (
              <Pressable key={l} style={s.pc} onPress={() => nav.navigate('SellerOrders')}>
                <Text style={[s.pcN, live && n > 0 && { color: C.accent }]}>{live ? n : 0}</Text>
                <Text style={s.smdim}>{l}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => nav.navigate('Payouts')}>
            <Dim style={{ fontSize: 11.5, marginTop: 10 }}>
              Escrow releases automatically after each delivery is confirmed —{' '}
              <Text style={{ color: C.accent }}>Payouts →</Text>
            </Dim>
          </Pressable>

          {/* Go live — every plan */}
          <Pressable style={s.golive} onPress={() => nav.navigate('GoLive')}>
            <View style={s.liveDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.fd}>Go live on your channel</Text>
              <Text style={s.smdim}>Every plan can broadcast — Starter included</Text>
            </View>
            <Ionicons name="videocam-outline" size={18} color={C.text} />
          </Pressable>

          {/* Listings */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24 }}>
            <Text style={[s.kickDim, { flex: 1, marginTop: 0 }]}>
              LISTINGS{live ? ` · ${listings.length}` : ''} ·{' '}
              {listingCap == null ? 'UNLIMITED' : `UP TO ${listingCap}`}
            </Text>
            <Pressable onPress={() => nav.navigate('NewListing')}>
              <Text style={s.newTx}>+ New</Text>
            </Pressable>
          </View>
          {live && listings.length ? (
            listings.slice(0, 8).map((p) => (
              <View key={p.id} style={s.listRow}>
                {p.images?.[0] ? (
                  <Image source={{ uri: p.images[0] }} style={s.listImg} contentFit="cover" />
                ) : (
                  <View style={[s.listImg, { backgroundColor: C.surf2 }]} />
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.lt} numberOfLines={1}>{p.name ?? p.title}</Text>
                  <Text style={[s.ls, p.status !== 'APPROVED' && { color: C.accent }]} numberOfLines={1}>
                    {p.status === 'APPROVED'
                      ? `Live · ${p.stock} in stock${p.sales ? ` · ${p.sales} sold` : ''}`
                      : p.status === 'PENDING'
                        ? 'In review'
                        : p.status}
                  </Text>
                </View>
                <Text style={s.lp}>{'£'}{p.price.toFixed(0)}</Text>
              </View>
            ))
          ) : (
            <View style={s.card2}>
              <Text style={s.fd}>No listings yet</Text>
              <Text style={s.smdim}>
                {pro
                  ? 'List as much as you make — unlimited on Pro.'
                  : 'Starter carries up to 10 live listings — Pro is unlimited.'}
              </Text>
            </View>
          )}

          {/* API access — Pro-only */}
          <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }, !pro && { opacity: 0.55 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.fd}>API access</Text>
              <Text style={s.smdim}>
                {pro ? 'Wire your channel into your own tools' : 'Pro-only — included the day you upgrade'}
              </Text>
            </View>
            {pro ? (
              <Pressable style={s.lineBtn} onPress={() => nav.navigate('ApiKeys')}>
                <Text style={s.lineBtnTx}>Keys</Text>
              </Pressable>
            ) : (
              <Ionicons name="lock-closed" size={14} color={C.mut} />
            )}
          </View>

          {!live ? (
            <View style={{ marginTop: 26, gap: 10 }}>
              <Btn label="Apply to sell — five minutes" onPress={() => nav.navigate('Apply', {})} />
              <Btn ghost label="See the founding seats" onPress={() => nav.navigate('Seats')} />
            </View>
          ) : null}
        </View>
      </ScrollView>
      <Chrome back="Menu" onBack={() => nav.goBack()} />
    </View>
  )
}

const s = StyleSheet.create({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
    borderRadius: 14,
    padding: 11,
    marginBottom: 20,
  },
  liveBanner: {
    backgroundColor: 'rgba(61,220,132,0.07)',
    borderColor: 'rgba(61,220,132,0.3)',
  },
  liveDotSm: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  previewTx: { flex: 1, fontFamily: F.displayMed, fontSize: 9.5, letterSpacing: 0.6, color: C.accent, lineHeight: 14 },
  signInChip: {
    backgroundColor: C.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  signInTx: { fontFamily: F.display, fontSize: 10, color: '#160a00' },
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  h1: { fontFamily: F.serifLight, fontSize: 26, color: C.text },
  fbadge: {
    fontFamily: F.display,
    fontSize: 8.5,
    letterSpacing: 1,
    color: C.accent,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  tbadge: {
    fontFamily: F.display,
    fontSize: 9,
    letterSpacing: 1,
    color: C.accent,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.45)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  seg: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    padding: 4,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  segOn: { backgroundColor: C.accent },
  segTx: { fontFamily: F.display, fontSize: 10.5, letterSpacing: 1, color: C.mut },
  segTxOn: { color: '#0b0b0e' },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  dk: { fontFamily: F.display, fontSize: 16, color: C.text },
  dl: { fontFamily: F.body, fontSize: 9.5, color: C.mut },
  card: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    padding: 16,
  },
  card2: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 14,
    gap: 3,
  },
  rev: { fontFamily: F.serifLight, fontSize: 24, color: C.text, marginTop: 6 },
  chartZero: { marginTop: 16, height: 90, justifyContent: 'center', gap: 10 },
  chartBase: {
    height: 1,
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  aiIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fd: { fontFamily: F.bodySemi, fontSize: 13.5, color: C.text },
  smdim: { fontFamily: F.body, fontSize: 11.5, lineHeight: 16, color: C.dim, marginTop: 2 },
  aitip: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: '#d8d7d3' },
  lineBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  lineBtnTx: { fontFamily: F.displayMed, fontSize: 12, color: C.text },
  pipeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pc: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  pcN: { fontFamily: F.serifLight, fontSize: 19, color: C.text },
  golive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    backgroundColor: 'rgba(255,107,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.35)',
    borderRadius: 18,
    padding: 16,
  },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.red },
  newTx: { fontFamily: F.displayMed, fontSize: 12, color: C.accent },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 10,
  },
  listImg: { width: 46, height: 46, borderRadius: 10 },
  lt: { fontFamily: F.bodySemi, fontSize: 12.5, color: C.text },
  ls: { fontFamily: F.body, fontSize: 10.5, color: C.mut, marginTop: 2 },
  lp: { fontFamily: F.display, fontSize: 12.5, color: C.text },
})
