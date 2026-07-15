import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'

// The hamburger menu — the mockup's MENU_HTML, exact: near-black overlay,
// × top-right (44px circle), content from 120/28, orange tracked section
// kickers (Shop / You / Sell), rows as Fraunces 23 titles with 10.5 dim
// subs, "All countries" first. The mockup's blur backdrop is approximated
// with the same ink at higher opacity (expo-blur isn't in the dep set).
// Honesty divergence: the mockup's "Seller dashboard · Preview" row is not
// rendered — that screen doesn't exist in the app yet; it lands with the
// seller-side sweep rather than linking to nothing.
export default function MenuScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()

  const go = (fn: () => void) => () => {
    nav.goBack()
    setTimeout(fn, 60)
  }

  const sections: [string, [string, string, () => void][]][] = [
    [
      'Shop',
      [
        ['All countries', 'A–Z, all 190', () => nav.navigate('Tabs', { screen: 'Search' })],
        ['The Atlas', 'Spin the world', () => nav.navigate('Tabs', { screen: 'Atlas' })],
        ['Velor Live', 'Watch it made, buy it live', () => nav.navigate('Tabs', { screen: 'Live' })],
        ['Search', 'A place, a craft, a thing', () => nav.navigate('Tabs', { screen: 'Search' })],
        ['Basket', 'Many makers, one payment', () => nav.navigate('Tabs', { screen: 'Basket' })],
        ['Orders', 'Tracking & protection', () => nav.navigate('Orders')],
        ['Passport', 'Your countries, stamped', () => nav.navigate('Passport')],
      ],
    ],
    [
      'You',
      [
        ['Notifications', 'The opening bell', () => nav.navigate('Bell')],
        ['Ask Velor', 'Your guide, any language', () => nav.navigate('Assist')],
        ['Account', 'Passkeys, addresses, help', () => nav.navigate('Tabs', { screen: 'You' })],
      ],
    ],
    [
      'Sell',
      [
        ['Sell on Velor', 'Your country’s channel', () => nav.navigate('Sell')],
        ['Founding seats', 'One per country', () => nav.navigate('Seats')],
        ['Apply', 'Five minutes, one form', () => nav.navigate('Apply', {})],
      ],
    ],
  ]

  return (
    <View style={s.overlay}>
      <Pressable style={[s.x, { top: insets.top + 14 }]} onPress={() => nav.goBack()}>
        <Ionicons name="close" size={22} color="#fff" />
      </Pressable>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 76,
          paddingHorizontal: 28,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map(([title, rows], si) => (
          <View key={title} style={si > 0 ? { marginTop: 26 } : undefined}>
            <Text style={s.k}>{title.toUpperCase()}</Text>
            {rows.map(([t, sub, fn]) => (
              <Pressable key={t} style={s.row} onPress={go(fn)}>
                <Text style={s.mt}>{t}</Text>
                <Text style={s.ms}>{sub}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(6,6,9,0.985)' },
  x: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  k: {
    fontFamily: F.display,
    fontSize: 9,
    letterSpacing: 2.3,
    color: C.accent,
    marginBottom: 6,
  },
  row: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mt: { fontFamily: F.serifLight, fontSize: 23, letterSpacing: -0.3, color: C.text },
  ms: { fontFamily: F.body, fontSize: 10.5, color: C.dim, marginTop: 3 },
})
