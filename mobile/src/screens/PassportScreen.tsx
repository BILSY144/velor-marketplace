import React from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import { C, F, flagUrl } from '../theme'
import { Kicker, Display, Body, Dim, Serif, Empty } from '../ui'

const SUGGEST = ['JP', 'MA', 'PE', 'TR', 'IN', 'MX', 'GH', 'IT']

// Passport — stamp a country every time you buy from it. Honest zero state
// until buying opens; the suggestions row shows how stamps will look.
export default function PassportScreen() {
  const nav = useNavigation<any>()
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: 58, paddingBottom: 60 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Pressable onPress={() => nav.goBack()} style={s.back}>
          <Body style={{ fontFamily: F.display }}>{'←'}</Body>
        </Pressable>
        <Kicker style={{ marginTop: 16 }}>PASSPORT</Kicker>
        <Display style={{ marginTop: 6, fontSize: 26 }}>Your countries, stamped.</Display>
        <Dim style={{ marginTop: 8, lineHeight: 19 }}>
          Every country you buy from stamps your passport — tap a stamp later to see
          everything you own from that place. 190 possible stamps.
        </Dim>
      </View>
      <Empty title="0 of 190 — for now." sub="Your first stamp lands with your first order, when buying opens on 6 August." />
      <Kicker style={{ paddingHorizontal: 20 }}>WHERE WILL YOU START?</Kicker>
      <View style={s.grid}>
        {SUGGEST.map((cc) => (
          <Pressable key={cc} style={s.stamp} onPress={() => nav.navigate('Country', { cc })}>
            <Image source={{ uri: flagUrl(cc) }} style={{ width: 30, height: 21, borderRadius: 4, opacity: 0.55 }} />
            <Serif style={{ fontSize: 11, color: C.mut, marginTop: 7 }}>{cc}</Serif>
          </Pressable>
        ))}
      </View>
      <Dim style={{ textAlign: 'center', marginTop: 6, fontSize: 11 }}>
        Greyed stamps are waiting — tap one to dive into that country.
      </Dim>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  back: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8,
  },
  stamp: {
    width: 74, height: 74, borderRadius: 14,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
})
