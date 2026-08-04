import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { F, useTheme, Palette } from '../theme'
import { fmt, useI18nTick } from '../i18n'
import { useSession } from '../store'
import { fetchMyOrders, confirmDelivery, BuyerOrder } from '../api'
import { Chrome } from '../components/Chrome'

// ORDERS — REAL buyer orders (2026-08-04 website-parity pass): the same
// /api/account/orders the website's /orders page reads, scoped server-side
// to the signed-in buyer's email. Signed out, or signed in with no orders
// yet, shows the honest empty state with the PAID → SHIPPED → DELIVERED
// rail unfilled — never a sample parcel.

const RAIL_STOPS = ['PAID', 'SHIPPED', 'DELIVERED'] as const
const STATUS_INDEX: Record<string, number> = {
  PAID: 0,
  PROCESSING: 0,
  SHIPPED: 1,
  IN_TRANSIT: 1,
  DELIVERED: 2,
  COMPLETED: 2,
}

export default function OrdersScreen() {
  useI18nTick()
  const t = useTheme()
  const s = styles(t)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const user = useSession((st) => st.user)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['myOrders'],
    queryFn: fetchMyOrders,
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchOnMount: 'always',
  })
  const orders = data ?? []

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={t.accent} colors={[t.accent]} />}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kickDim}>TRACKING</Text>
          <Text style={s.h1}>On the way.</Text>

          {!user ? (
            <Pressable style={s.signCard} onPress={() => nav.navigate('SignIn')}>
              <Ionicons name="person-circle-outline" size={22} color={t.accent} />
              <View style={{ flex: 1 }}>
                <Text style={s.signT}>Sign in to see your orders</Text>
                <Text style={s.signS}>Every parcel you've paid for, live-tracked.</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={t.accent} />
            </Pressable>
          ) : isLoading ? (
            <Text style={s.loading}>Fetching your parcels…</Text>
          ) : orders.length === 0 ? (
            <EmptyCard s={s} t={t} />
          ) : (
            orders.map((o) => (
              <OrderCard key={o.id} o={o} s={s} t={t} onChanged={() => refetch()} nav={nav} />
            ))
          )}

          {/* Protection explainers — unchanged, always true */}
          {(
            [
              ['shield-checkmark-outline', 'Escrow, per parcel', "Each seller's share of your payment is held separately and released only when that parcel's delivery is confirmed."],
              ['alert-circle-outline', 'Disputes with teeth', 'Damaged, wrong, or missing? Open a dispute with photos and the funds freeze instantly until it is resolved.'],
            ] as [string, string, string][]
          ).map(([icon, ti, b]) => (
            <View key={ti} style={s.exp}>
              <Ionicons name={icon as any} size={17} color={t.accent} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.expT}>{ti}</Text>
                <Text style={{ fontFamily: F.body, color: t.mut, marginTop: 4, lineHeight: 17, fontSize: 11.5 }}>{b}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <Chrome back="Back" onBack={() => nav.goBack()} />
    </View>
  )
}

function OrderCard({
  o,
  s,
  t,
  onChanged,
  nav,
}: {
  o: BuyerOrder
  s: ReturnType<typeof styles>
  t: Palette
  onChanged: () => void
  nav: any
}) {
  const stop = STATUS_INDEX[o.status?.toUpperCase?.() ?? ''] ?? 0
  const first = o.items?.[0]
  const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
  const [confirming, setConfirming] = React.useState(false)
  const shipped = ['SHIPPED', 'IN_TRANSIT'].includes(o.status?.toUpperCase?.() ?? '')
  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={s.thumb}>
          {first?.image ? (
            <Image source={{ uri: first.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Ionicons name="bag-outline" size={18} color={t.mut} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.on} numberOfLines={1}>
            {first?.title ?? 'Order'}
            {o.items && o.items.length > 1 ? ` +${o.items.length - 1} more` : ''}
          </Text>
          <Text style={s.os}>
            {date} · {fmt(o.total)}
            {o.trackingNumber ? ` · ${o.trackingNumber}` : ''}
          </Text>
        </View>
        <Text style={s.prot}>PROTECTED</Text>
      </View>
      <View style={s.rail}>
        <View style={s.railLine} />
        {RAIL_STOPS.map((l, i) => (
          <View key={l} style={[s.railStop, i === 0 && { alignItems: 'flex-start' }, i === 2 && { alignItems: 'flex-end' }]}>
            <View style={[s.dot, i <= stop && { backgroundColor: t.accent, borderColor: t.accent }]} />
            <Text style={[s.railTx, i <= stop && { color: t.text }]}>{l}</Text>
          </View>
        ))}
      </View>

      {/* Website /orders parity: per-order tracking page link, and the
          escrow-releasing "I have received this order" button on SHIPPED. */}
      <View style={{ flexDirection: 'row', gap: 9, marginTop: 16 }}>
        <Pressable style={s.actGhost} onPress={() => nav.navigate('Track', { orderId: o.id })}>
          <Text style={s.actGhostTx}>Track order</Text>
        </Pressable>
        {shipped ? (
          <Pressable
            style={[s.actSolid, confirming && { opacity: 0.6 }]}
            disabled={confirming}
            onPress={async () => {
              setConfirming(true)
              const r = await confirmDelivery(o.id)
              setConfirming(false)
              if (r.ok) onChanged()
            }}
          >
            <Text style={s.actSolidTx}>{confirming ? 'Confirming…' : 'I have received this order'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

function EmptyCard({ s, t }: { s: ReturnType<typeof styles>; t: Palette }) {
  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={s.thumb}>
          <Ionicons name="bag-outline" size={18} color={t.mut} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.on}>No parcels yet</Text>
          <Text style={s.os}>Your first order lands here the moment you place it.</Text>
        </View>
      </View>
      <View style={s.rail}>
        <View style={s.railLine} />
        {RAIL_STOPS.map((l, i) => (
          <View key={l} style={[s.railStop, i === 0 && { alignItems: 'flex-start' }, i === 2 && { alignItems: 'flex-end' }]}>
            <View style={s.dot} />
            <Text style={s.railTx}>{l}</Text>
          </View>
        ))}
      </View>
      <View style={s.hr} />
      <Text style={s.foot}>Live tracking from the seller's own carrier, every step of the way.</Text>
    </View>
  )
}

const styles = (t: Palette) =>
  StyleSheet.create({
    kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: t.mut },
    h1: { fontFamily: F.serifLight, fontSize: 32, color: t.text, marginTop: 8 },
    loading: { fontFamily: F.body, fontSize: 13, color: t.mut, paddingVertical: 24 },
    signCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 20,
      backgroundColor: t.accentSoft,
      borderWidth: 1,
      borderColor: t.accent,
      borderRadius: 14,
      padding: 13,
    },
    signT: { fontFamily: F.bodySemi, fontSize: 13.5, color: t.text },
    signS: { fontFamily: F.body, fontSize: 11, color: t.mut, marginTop: 2 },
    card: {
      marginTop: 20,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 20,
      padding: 16,
    },
    thumb: {
      width: 54,
      height: 54,
      borderRadius: 12,
      backgroundColor: t.surf2,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    on: { fontFamily: F.bodySemi, fontSize: 12.5, color: t.text },
    os: { fontFamily: F.body, fontSize: 11, color: t.mut, marginTop: 2 },
    prot: {
      fontFamily: F.display,
      fontSize: 8.5,
      letterSpacing: 1,
      color: t.green,
      borderWidth: 1,
      borderColor: 'rgba(46,204,113,0.45)',
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 4,
      overflow: 'hidden',
    },
    rail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 22,
      position: 'relative',
    },
    railLine: {
      position: 'absolute',
      left: 5,
      right: 5,
      top: 5,
      height: 2,
      backgroundColor: t.line,
    },
    railStop: { alignItems: 'center', gap: 8 },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: t.surf2,
      borderWidth: 2,
      borderColor: t.line,
    },
    railTx: { fontFamily: F.display, fontSize: 9, letterSpacing: 0.8, color: t.mut },
    actGhost: {
      flex: 1,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 11,
      paddingVertical: 10,
      alignItems: 'center',
    },
    actGhostTx: { fontFamily: F.bodySemi, fontSize: 12, color: t.text },
    actSolid: {
      flex: 1.4,
      backgroundColor: t.accent,
      borderRadius: 11,
      paddingVertical: 10,
      alignItems: 'center',
    },
    actSolidTx: { fontFamily: F.bodySemi, fontSize: 12, color: '#fff' },
    hr: { height: 1, backgroundColor: t.line, marginTop: 18 },
    foot: { fontFamily: F.body, fontSize: 11, color: t.dim, marginTop: 12 },
    exp: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
      marginTop: 14,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 16,
      padding: 15,
    },
    expT: { fontFamily: F.bodySemi, fontSize: 13.5, color: t.text },
  })
