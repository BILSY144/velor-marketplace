import React from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { C, F } from '../theme'
import { Kicker, Display, Body, Dim, Serif } from '../ui'

export default function YouScreen() {
  const nav = useNavigation<any>()

  const rows: { title: string; sub: string; onPress: () => void }[] = [
    {
      title: 'Ask Velor',
      sub: 'Your guide, any language — the same brain as the website',
      onPress: () => nav.navigate('Assist'),
    },
    {
      title: 'Orders & tracking',
      sub: 'Escrow-protected from day one — live orders land here at launch',
      onPress: () => nav.navigate('Orders'),
    },
    {
      title: 'Passport',
      sub: 'Stamp a country every time you buy from it',
      onPress: () => nav.navigate('Passport'),
    },
    {
      title: 'Sell on Velor',
      sub: 'Your country’s channel. One founding seat per country, all still open',
      onPress: () => nav.navigate('Sell'),
    },
    {
      title: 'Terms of service',
      sub: 'The full, current terms — read them right here',
      onPress: () => nav.navigate('Legal', { doc: 'terms' }),
    },
    {
      title: 'Privacy',
      sub: 'What we hold, and what we never see',
      onPress: () => nav.navigate('Legal', { doc: 'privacy' }),
    },
    {
      title: 'Help & buyer protection',
      sub: 'Escrow, disputes, returns — how you are covered',
      onPress: () => nav.navigate('Legal', { doc: 'help' }),
    },
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: 64, paddingBottom: 60 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Kicker>YOU</Kicker>
        <Display style={{ marginTop: 6, fontSize: 26 }}>Your Velor.</Display>
        <Dim style={{ marginTop: 8 }}>
          No account needed to browse. Sign-in with passkeys arrives with buyer launch.
        </Dim>
      </View>
      <View style={{ marginTop: 18 }}>
        {rows.map((r) => (
          <Pressable key={r.title} style={s.row} onPress={r.onPress}>
            <View style={{ flex: 1 }}>
              <Serif style={{ fontSize: 15.5 }}>{r.title}</Serif>
              <Dim style={{ fontSize: 11.5, marginTop: 3 }}>{r.sub}</Dim>
            </View>
            <Body style={{ color: C.accent, fontFamily: F.display }}>{'→'}</Body>
          </Pressable>
        ))}
      </View>
      <Dim style={{ textAlign: 'center', marginTop: 30, fontSize: 10.5 }}>
        Velor — the world's shopping channel · app preview build
      </Dim>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
})
