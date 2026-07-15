import React, { useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { C, F } from '../theme'
import LEGAL from '../data/legal'
import { Kicker, Display, Body, Dim, Serif } from '../ui'

type DocKey = keyof typeof LEGAL

// The real, current legal documents — full text in-app, no browser needed.
export default function LegalScreen() {
  const route = useRoute<any>()
  const nav = useNavigation<any>()
  const docKey: DocKey = route.params?.doc ?? 'terms'
  const doc = LEGAL[docKey]
  const [open, setOpen] = useState<number | null>(0)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: 58, paddingBottom: 60 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Pressable onPress={() => nav.goBack()} style={s.back}>
          <Body style={{ fontFamily: F.display }}>{'←'}</Body>
        </Pressable>
        <Kicker style={{ marginTop: 16 }}>{doc.u.toUpperCase()}</Kicker>
        <Display style={{ marginTop: 6, fontSize: 26 }}>{doc.t}.</Display>
        <Dim style={{ marginTop: 8, lineHeight: 19 }}>{doc.syn}</Dim>
      </View>
      <View style={{ marginTop: 16 }}>
        {doc.secs.map(([h, b], i) => (
          <View key={i} style={s.sec}>
            <Pressable style={s.secHead} onPress={() => setOpen(open === i ? null : i)}>
              <Serif style={{ fontSize: 14.5, flex: 1 }}>{h}</Serif>
              <Body style={{ color: C.accent, fontFamily: F.display, fontSize: 14 }}>
                {open === i ? '−' : '+'}
              </Body>
            </Pressable>
            {open === i ? (
              <Body style={{ paddingHorizontal: 20, paddingBottom: 16, color: '#c9c8c4', fontSize: 12.5, lineHeight: 19 }}>
                {b}
              </Body>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sec: { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  secHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
})
