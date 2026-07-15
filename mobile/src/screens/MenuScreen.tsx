import React from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { C, F } from '../theme'
import { Kicker, Body, Dim, Serif } from '../ui'

// The mockup's full-screen menu, as a screen. Every row is an in-app page.
const SECTIONS: [string, [string, string, () => any][]][] = []

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
        ['The Atlas', 'Spin the world', () => nav.navigate('Tabs', { screen: 'Atlas' })],
        ['Velor Live', 'Watch it made, buy it live', () => nav.navigate('Tabs', { screen: 'Live' })],
        ['Search', 'A place, a craft, a thing', () => nav.navigate('Tabs', { screen: 'Search' })],
        ['Basket', 'Makers, one payment', () => nav.navigate('Tabs', { screen: 'Basket' })],
        ['Orders', 'Tracking & protection', () => nav.navigate('Orders')],
        ['Passport', 'Your countries, stamped', () => nav.navigate('Passport')],
      ],
    ],
    [
      'You',
      [
        ['Notifications', 'The opening bell', () => nav.navigate('Bell')],
        ['Ask Velor', 'Your guide, any language', () => nav.navigate('Assist')],
        ['Account', 'Orders, passport, legal', () => nav.navigate('Tabs', { screen: 'You' })],
      ],
    ],
    [
      'Sell',
      [
        ['Sell on Velor', 'Your country’s channel', () => nav.navigate('Sell')],
        ['Apply', 'Five minutes, one form', () => nav.navigate('Apply', {})],
      ],
    ],
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 50 }}>
      <View style={{ paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => nav.goBack()} style={s.x}>
          <Body style={{ fontFamily: F.display, fontSize: 17 }}>{'×'}</Body>
        </Pressable>
      </View>
      {sections.map(([title, rows]) => (
        <View key={title}>
          <Kicker style={{ paddingHorizontal: 24, marginTop: 22 }}>{title.toUpperCase()}</Kicker>
          {rows.map(([t, sub, fn]) => (
            <Pressable key={t} style={s.row} onPress={go(fn)}>
              <Serif style={{ fontSize: 19 }}>{t}</Serif>
              <Dim style={{ fontSize: 11.5, marginTop: 2 }}>{sub}</Dim>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  x: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  row: {
    paddingHorizontal: 24, paddingVertical: 13,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
})
