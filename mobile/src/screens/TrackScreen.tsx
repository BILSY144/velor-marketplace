import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, Linking } from 'react-native'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import Ionicons from '@expo/vector-icons/Ionicons'
import { F, useTheme, Palette } from '../theme'
import { useI18nTick } from '../i18n'
import { useSession } from '../store'
import { fetchOrderTracking } from '../api'
import { Chrome } from '../components/Chrome'

// TRACK — per-order tracking timeline, website parity with
// /orders/[orderId]/track: carrier, status, tracking number, external
// carrier link, and the reverse-chronological shipment event timeline with
// an honest "no events yet" state.
export default function TrackScreen() {
  useI18nTick()
  const t = useTheme()
  const s = styles(t)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const orderId: string = route.params?.orderId
  const user = useSession((st) => st.user)

  const { data, isLoading } = useQuery({
    queryKey: ['track', orderId],
    queryFn: () => fetchOrderTracking(orderId, user?.email ?? ''),
    enabled: Boolean(orderId && user?.email),
    staleTime: 30_000,
  })

  const events = [...(data?.events ?? [])].reverse()

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kick}>ORDER #{(orderId ?? '').slice(0, 8).toUpperCase()}</Text>
          <Text style={s.h1}>Tracking.</Text>

          {isLoading ? (
            <Text style={s.dim}>Fetching the latest scan…</Text>
          ) : !data ? (
            <Text style={s.dim}>Could not load tracking for this order — try again shortly.</Text>
          ) : (
            <View>
              <View style={s.card}>
                <Row s={s} l="Status" r={(data.status ?? 'PENDING').replace(/_/g, ' ')} accent />
                {data.carrier ? <Row s={s} l="Carrier" r={data.carrier} /> : null}
                {data.trackingNumber ? <Row s={s} l="Tracking number" r={data.trackingNumber} /> : null}
                {data.trackingUrl ? (
                  <Pressable style={s.carrierBtn} onPress={() => Linking.openURL(data.trackingUrl!)}>
                    <Ionicons name="open-outline" size={14} color="#fff" />
                    <Text style={s.carrierTx}>Track on the carrier's site</Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={s.tlKick}>JOURNEY</Text>
              {events.length === 0 ? (
                <View style={s.card}>
                  <Text style={s.dimSmall}>
                    No tracking events yet. The first scan appears once the seller hands the parcel
                    to the carrier.
                  </Text>
                </View>
              ) : (
                events.map((e, i) => (
                  <View key={i} style={s.evRow}>
                    <View style={s.evRailCol}>
                      <View style={[s.evDot, i === 0 && { backgroundColor: t.accent, borderColor: t.accent }]} />
                      {i < events.length - 1 ? <View style={s.evLine} /> : null}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 18 }}>
                      <Text style={s.evTitle}>{e.description || e.status || 'Update'}</Text>
                      <Text style={s.evMeta}>
                        {[e.location, e.date ? new Date(e.date).toLocaleString('en-GB') : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <Chrome back="Orders" onBack={() => nav.goBack()} />
    </View>
  )
}

function Row({ s, l, r, accent }: { s: ReturnType<typeof styles>; l: string; r: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <Text style={s.rowL}>{l}</Text>
      <Text style={[s.rowR, accent && { color: s.accentColor.color }]}>{r}</Text>
    </View>
  )
}

const styles = (t: Palette) =>
  StyleSheet.create({
    kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: t.mut },
    h1: { fontFamily: F.serifLight, fontSize: 32, color: t.text, marginTop: 8 },
    dim: { fontFamily: F.body, fontSize: 13, color: t.mut, paddingVertical: 24 },
    dimSmall: { fontFamily: F.body, fontSize: 12, color: t.mut, lineHeight: 18 },
    card: {
      marginTop: 18,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 18,
      padding: 16,
    },
    rowL: { fontFamily: F.body, fontSize: 12.5, color: t.mut },
    rowR: { fontFamily: F.bodySemi, fontSize: 12.5, color: t.text },
    accentColor: { color: t.accent },
    carrierBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: 12,
      backgroundColor: t.accent,
      borderRadius: 11,
      paddingVertical: 10,
    },
    carrierTx: { fontFamily: F.bodySemi, fontSize: 12, color: '#fff' },
    tlKick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2, color: t.mut, marginTop: 26, marginBottom: 14 },
    evRow: { flexDirection: 'row', gap: 12 },
    evRailCol: { alignItems: 'center', width: 14 },
    evDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: t.surf2,
      borderWidth: 2,
      borderColor: t.line,
    },
    evLine: { flex: 1, width: 2, backgroundColor: t.line, marginTop: 2 },
    evTitle: { fontFamily: F.bodySemi, fontSize: 12.5, color: t.text, marginTop: -1 },
    evMeta: { fontFamily: F.body, fontSize: 11, color: t.mut, marginTop: 3 },
  })
