import React from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { Kicker, Display, Body, Dim, Empty } from '../ui'

// The Opening Bell — notifications. Honest zero state until follows and
// real orders exist; the explainers show what will ring the bell.
export default function BellScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 60 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Pressable onPress={() => nav.goBack()} style={s.back}>
          <Body style={{ fontFamily: F.display }}>{'←'}</Body>
        </Pressable>
        <Kicker style={{ marginTop: 16 }}>NOTIFICATIONS</Kicker>
        <Display style={{ marginTop: 6, fontSize: 26 }}>The opening bell.</Display>
      </View>
      <View style={{ alignItems: 'center', marginTop: 26 }}>
        <View style={s.bell}>
          <Ionicons name="notifications-outline" size={30} color={C.accent} />
        </View>
      </View>
      <Empty
        title="Quiet, for now."
        sub="Follow a country and the bell rings the moment its channel opens. Order something and every step of the parcel lands here. Follows and orders switch on with buyer launch — 6 August."
      />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  back: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  bell: {
    width: 76, height: 76, borderRadius: 24,
    borderWidth: 1.5, borderColor: 'rgba(255,107,0,0.4)',
    backgroundColor: 'rgba(255,107,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
})
