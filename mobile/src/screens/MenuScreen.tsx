import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { FILMS } from '../data'
import { useCart } from '../store'

// The hamburger menu — redesigned beyond the mockup's flat list at
// William's call (2026-07-15: "menu page still looks the same… no redesign
// or uplift"). Editorial and layered: two feature cards (the Atlas globe
// mark and Velor Live with a real preview-film still), a glass grid for
// Search/Basket/Orders/Passport (live basket count), a YOU pill row, the
// orange SELL band with Founding seats / Dashboard / Apply chips, and a
// footer with language/currency and legal. Everything routes to a real
// screen — no dead rows.
export default function MenuScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0))

  const go = (fn: () => void) => () => {
    nav.goBack()
    setTimeout(fn, 60)
  }

  const film = FILMS[0]

  return (
    <View style={s.overlay}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={s.menuK}>MENU</Text>
          <View style={{ flex: 1 }} />
          <Pressable style={s.x} onPress={() => nav.goBack()}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* SHOP — feature cards */}
        <Text style={s.k}>SHOP</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Pressable
            style={s.feature}
            onPress={go(() => nav.navigate('Tabs', { screen: 'Atlas' }))}
          >
            <View style={s.atlasRing}>
              <Ionicons name="earth" size={30} color={C.accent} />
            </View>
            <View style={{ position: 'absolute', left: 14, bottom: 14, right: 14 }}>
              <Text style={s.featT}>The Atlas</Text>
              <Text style={s.featS}>Spin the world</Text>
            </View>
          </Pressable>
          <Pressable
            style={s.feature}
            onPress={go(() => nav.navigate('Tabs', { screen: 'Live' }))}
          >
            {film ? (
              <Image source={{ uri: film.poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            ) : null}
            <LinearGradient
              colors={['rgba(6,6,9,0.15)', 'rgba(6,6,9,0.85)']}
              locations={[0.35, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.livePill}>
              <Text style={s.livePillV}>V</Text>
              <Text style={s.livePillTx}> LIVE</Text>
            </View>
            <View style={{ position: 'absolute', left: 14, bottom: 14, right: 14 }}>
              <Text style={s.featT}>Velor Live</Text>
              <Text style={s.featS}>Watch it made, buy it live</Text>
            </View>
          </Pressable>
        </View>

        {/* SHOP — glass grid */}
        <View style={s.grid}>
          {(
            [
              ['search-outline', 'Search', 'A place, a craft, a thing', () => nav.navigate('Tabs', { screen: 'Search' }), 0],
              ['bag-outline', 'Basket', count ? `${count} in your basket` : 'Many makers, one payment', () => nav.navigate('Tabs', { screen: 'Basket' }), count],
              ['cube-outline', 'Orders', 'Tracking & protection', () => nav.navigate('Orders'), 0],
              ['bookmark-outline', 'Passport', 'Your countries, stamped', () => nav.navigate('Passport'), 0],
            ] as [string, string, string, () => void, number][]
          ).map(([icon, t, sub, fn, badge]) => (
            <Pressable key={t} style={s.cell} onPress={go(fn)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={icon as any} size={17} color={C.text} />
                <View style={{ flex: 1 }} />
                {badge ? (
                  <View style={s.badge}>
                    <Text style={s.badgeTx}>{badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={s.cellT}>{t}</Text>
              <Text style={s.cellS} numberOfLines={1}>
                {sub}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* YOU — pill row */}
        <Text style={s.k}>YOU</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {(
            [
              ['notifications-outline', 'Bell', () => nav.navigate('Bell')],
              ['sparkles-outline', 'Ask Velor', () => nav.navigate('Assist')],
              ['person-outline', 'Account', () => nav.navigate('Tabs', { screen: 'You' })],
            ] as [string, string, () => void][]
          ).map(([icon, t, fn]) => (
            <Pressable key={t} style={s.pill} onPress={go(fn)}>
              <Ionicons name={icon as any} size={15} color={C.text} />
              <Text style={s.pillTx}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {/* SELL — the band */}
        <Text style={s.k}>SELL</Text>
        <Pressable style={s.sell} onPress={go(() => nav.navigate('Sell'))}>
          <Text style={s.sellK}>SELL ON VELOR</Text>
          <Text style={s.sellT}>Your country's{'\n'}shopping channel.</Text>
          <Text style={s.sellS}>
            One founding seat per country — Pro free for life for whoever opens it.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {(
              [
                ['Founding seats', () => nav.navigate('Seats')],
                ['Dashboard', () => nav.navigate('Dash')],
                ['Apply', () => nav.navigate('Apply', {})],
              ] as [string, () => void][]
            ).map(([t, fn]) => (
              <Pressable key={t} style={s.sellChip} onPress={go(fn)}>
                <Text style={s.sellChipTx}>{t}</Text>
                <Ionicons name="arrow-forward" size={11} color={C.accent} />
              </Pressable>
            ))}
          </View>
        </Pressable>

        {/* Footer */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 26 }}>
          <Pressable style={s.foot} onPress={go(() => nav.navigate('LangCur'))}>
            <Ionicons name="globe-outline" size={13} color={C.mut} />
            <Text style={s.footTx}>English · GBP</Text>
          </Pressable>
          <Pressable style={s.foot} onPress={go(() => nav.navigate('Legal', { doc: 'terms' }))}>
            <Ionicons name="shield-checkmark-outline" size={13} color={C.mut} />
            <Text style={s.footTx}>Privacy & legal</Text>
          </Pressable>
        </View>
        <Text style={s.build}>Velor — the world's shopping channel</Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(6,6,9,0.985)' },
  menuK: { fontFamily: F.display, fontSize: 10, letterSpacing: 3, color: C.mut },
  x: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  k: {
    fontFamily: F.display,
    fontSize: 9,
    letterSpacing: 2.3,
    color: C.accent,
    marginTop: 28,
  },
  feature: {
    flex: 1,
    height: 170,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.surf,
    borderWidth: 1,
    borderColor: C.line,
  },
  atlasRing: {
    position: 'absolute',
    top: 18,
    left: 14,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,107,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featT: { fontFamily: F.serifLight, fontSize: 19, color: C.text },
  featS: { fontFamily: F.body, fontSize: 10.5, color: '#b9b9c2', marginTop: 2 },
  livePill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  livePillV: { fontFamily: F.display, fontSize: 9, color: C.accent },
  livePillTx: { fontFamily: F.display, fontSize: 9, letterSpacing: 1, color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  cell: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 14,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeTx: { fontFamily: F.display, fontSize: 10, color: '#0b0b0e' },
  cellT: { fontFamily: F.serifLight, fontSize: 17, color: C.text, marginTop: 12 },
  cellS: { fontFamily: F.body, fontSize: 10.5, color: C.dim, marginTop: 2 },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingVertical: 13,
  },
  pillTx: { fontFamily: F.displayMed, fontSize: 11.5, color: C.text },
  sell: {
    marginTop: 10,
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(255,107,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.25)',
  },
  sellK: { fontFamily: F.display, fontSize: 8.5, letterSpacing: 2, color: C.accent },
  sellT: { fontFamily: F.serifLight, fontSize: 24, lineHeight: 28, color: C.text, marginTop: 8 },
  sellS: { fontFamily: F.body, fontSize: 11, lineHeight: 16, color: C.mut, marginTop: 8 },
  sellChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.4)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  sellChipTx: { fontFamily: F.displayMed, fontSize: 11.5, color: C.text },
  foot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingVertical: 12,
  },
  footTx: { fontFamily: F.body, fontSize: 11.5, color: C.mut },
  build: {
    fontFamily: F.body,
    fontSize: 10,
    color: C.dim,
    textAlign: 'center',
    marginTop: 22,
  },
})
