import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { F, useTheme, Palette } from '../theme'
import { Chrome } from '../components/Chrome'

// Orders — plate 10's TRACKING / "On the way." header and order-card
// language, with the honest reality underneath: no orders exist until buyer
// launch, so instead of the plate's sample parcels the card explains
// exactly what will appear — the PAID → SHIPPED → DELIVERED rail is drawn
// as the plate draws it, just unfilled.
export default function OrdersScreen() {
  const t = useTheme()
  const s = styles(t)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kickDim}>TRACKING</Text>
          <Text style={s.h1}>On the way.</Text>

          {/* The order card, waiting */}
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={s.thumb}>
                <Ionicons name="bag-outline" size={18} color={t.mut} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.on}>Your first parcel</Text>
                <Text style={s.os}>lands here when buying opens · 6 September</Text>
              </View>
              <Text style={s.prot}>PROTECTED</Text>
            </View>
            <View style={s.rail}>
              <View style={s.railLine} />
              {['PAID', 'SHIPPED', 'DELIVERED'].map((l, i) => (
                <View key={l} style={[s.railStop, i === 0 && { alignItems: 'flex-start' }, i === 2 && { alignItems: 'flex-end' }]}>
                  <View style={s.dot} />
                  <Text style={s.railTx}>{l}</Text>
                </View>
              ))}
            </View>
            <View style={s.hr} />
            <Text style={s.foot}>
              Live tracking from the seller's own carrier, every step of the way.
            </Text>
          </View>

          {/* Protection explainers */}
          {(
            [
              ['shield-checkmark-outline', 'Escrow, per parcel', "Each seller's share of your payment is held separately and released only when that parcel's delivery is confirmed."],
              ['alert-circle-outline', 'Disputes with teeth', 'Damaged, wrong, or missing? Open a dispute with photos and the funds freeze instantly until it is resolved.'],
              ['finger-print-outline', 'Sign-in with passkeys', 'No passwords. Your face or fingerprint signs you in when buying opens.'],
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

const styles = (t: Palette) => StyleSheet.create({
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: t.mut },
  h1: { fontFamily: F.serifLight, fontSize: 32, color: t.text, marginTop: 8 },
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
