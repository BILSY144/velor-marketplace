import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import { C, F, flagUrl } from '../theme'
import { COUNTRIES, countryName } from '../data'
import { Dim } from '../ui'
import { Chrome } from '../components/Chrome'

// Buyer passport — plate 14, exact: VELOR · BUYER PASSPORT orange kicker,
// the big Fraunces "0 / 190" counter, progress hairline, the grid of dashed
// circular stamps (dimmed flag + country name, waiting to be earned; tap
// dives into the country), and the "Next stamps" card with Open the Atlas.
// All counts are real — 0 stamps until real deliveries confirm, no EN ROUTE
// chips until real orders exist.
const WAITING = ['MA', 'CN', 'JP', 'TR', 'IN', 'PE', 'MX', 'IT', 'GH', 'KR', 'ET', 'VN']

export default function PassportScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const stamps = 0

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kick}>VELOR · BUYER PASSPORT</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
            <Text style={s.big}>{stamps}</Text>
            <Text style={s.of}>/ {COUNTRIES.length}</Text>
          </View>
          <Dim style={{ marginTop: 8, lineHeight: 18 }}>
            Every country you buy from stamps this page — each stamp lands the day its parcel's
            delivery is confirmed. Your first arrives with your first order.
          </Dim>
          <View style={s.hair}>
            <View style={[s.hairFill, { width: `${Math.max(0.5, (stamps / COUNTRIES.length) * 100)}%` }]} />
          </View>
        </View>

        {/* Stamp grid */}
        <View style={s.grid}>
          {WAITING.map((cc) => (
            <Pressable key={cc} style={s.stamp} onPress={() => nav.navigate('Country', { cc })}>
              <Image source={{ uri: flagUrl(cc) }} style={s.stampFlag} />
              <Text style={s.stampNm} numberOfLines={1}>
                {countryName(cc).toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Next stamps */}
        <View style={s.next}>
          <Text style={s.nextT}>Next stamps</Text>
          <Text style={s.nextS}>
            {COUNTRIES.length} countries are opening their channels. Every one is a stamp waiting
            to happen.
          </Text>
          <Pressable style={s.ghost} onPress={() => nav.navigate('Tabs', { screen: 'Atlas' })}>
            <Text style={s.ghostTx}>Open the Atlas</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Chrome back="You" onBack={() => nav.goBack()} />
    </View>
  )
}

const s = StyleSheet.create({
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.accent },
  big: { fontFamily: F.serifLight, fontSize: 44, color: C.text },
  of: { fontFamily: F.serifLight, fontSize: 22, color: C.mut },
  hair: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 18,
    overflow: 'hidden',
  },
  hairFill: { height: 2, backgroundColor: C.accent },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 26,
    rowGap: 18,
  },
  stamp: {
    width: '30.5%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stampFlag: { width: 34, height: 24, borderRadius: 4, opacity: 0.45 },
  stampNm: {
    fontFamily: F.display,
    fontSize: 8.5,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.35)',
    maxWidth: '80%',
  },
  next: {
    marginHorizontal: 20,
    marginTop: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    padding: 18,
  },
  nextT: { fontFamily: F.bodySemi, fontSize: 13.5, color: C.text },
  nextS: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: C.mut, marginTop: 6 },
  ghost: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostTx: { fontFamily: F.displayMed, fontSize: 13, color: C.text },
})
