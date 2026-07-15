import React from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { C, F } from '../theme'
import { Kicker, Display, Body, Dim, Empty } from '../ui'

// Honest pre-launch state: no fake orders, ever. Sign-in and live order
// tracking arrive with buyer launch on 6 August.
export default function OrdersScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 60 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Pressable onPress={() => nav.goBack()} style={s.back}>
          <Body style={{ fontFamily: F.display }}>{'←'}</Body>
        </Pressable>
        <Kicker style={{ marginTop: 16 }}>ORDERS</Kicker>
        <Display style={{ marginTop: 6, fontSize: 26 }}>Tracking & protection.</Display>
      </View>
      <Empty
        title="No orders yet — buyers arrive 6 August."
        sub="When you buy, every parcel lands here: live tracking from the seller's own carrier, your money held in escrow until delivery is confirmed, and a dispute button that freezes funds instantly if something is wrong."
      />
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        {[
          ['Escrow, per parcel', 'Each seller’s share of your payment is held separately and released only when that parcel’s delivery is confirmed.'],
          ['Disputes with teeth', 'Damaged, wrong, or missing? Open a dispute with photos and the funds freeze until it’s resolved — usually within 48 hours.'],
          ['Sign-in with passkeys', 'No passwords. Your face or fingerprint signs you in when buying opens.'],
        ].map(([t, b]) => (
          <View key={t} style={s.card}>
            <Body style={{ fontFamily: F.bodySemi, fontSize: 13.5 }}>{t}</Body>
            <Dim style={{ marginTop: 5, lineHeight: 18 }}>{b}</Dim>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  back: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.line,
    borderRadius: 16, padding: 15,
  },
})
