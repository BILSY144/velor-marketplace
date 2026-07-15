import React from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { C, F } from '../theme'
import { Kicker, Display, Body, Dim, Serif, Btn } from '../ui'

const PERKS: [string, string][] = [
  ['Founding badge, permanent', 'On your store and every listing, forever.'],
  ['The full Pro tier, free for life', 'Unlimited listings, Go Live, your AI account manager — £49/mo at £0 while your subscription runs. 4% commission.'],
  ['The homepage showreel slot', 'Your film, on the front page of the world’s shopping channel.'],
  ['Your country’s page, alone', 'You open the channel and are credited as the seller who opened it.'],
]

// The sell pitch, in-app. The application itself lives on the site (identity
// verification is Stripe-hosted web) — the Apply button hands off there.
export default function SellScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 60 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Pressable onPress={() => nav.goBack()} style={s.back}>
          <Body style={{ fontFamily: F.display }}>{'←'}</Body>
        </Pressable>
        <Kicker style={{ marginTop: 16 }}>SELL ON VELOR</Kicker>
        <Display style={{ marginTop: 6 }}>Your country's{'\n'}shopping channel.</Display>
        <Dim style={{ marginTop: 10, lineHeight: 19 }}>
          Broadcast live from the workshop and sell around the clock with listings.
          Buyers arrive 6 August. 0% listing fees on every plan.
        </Dim>
      </View>

      <Kicker style={{ paddingHorizontal: 20, marginTop: 26 }}>
        THE FOUNDING SEAT — ONE PER COUNTRY, ALL 190 STILL OPEN
      </Kicker>
      <View style={{ paddingHorizontal: 20, gap: 11, marginTop: 12 }}>
        {PERKS.map(([t, b]) => (
          <View key={t} style={s.perk}>
            <Serif style={{ fontSize: 14.5 }}>{t}</Serif>
            <Dim style={{ marginTop: 4, lineHeight: 18 }}>{b}</Dim>
          </View>
        ))}
      </View>

      <View style={s.tiers}>
        <View style={s.tier}>
          <Kicker>STARTER</Kicker>
          <Serif style={{ fontSize: 22, marginTop: 6 }}>Free</Serif>
          <Dim style={{ marginTop: 4, fontSize: 11.5 }}>10% commission · 10 listings · Go Live</Dim>
        </View>
        <View style={[s.tier, { borderColor: 'rgba(255,107,0,0.4)' }]}>
          <Kicker>PRO</Kicker>
          <Serif style={{ fontSize: 22, marginTop: 6, color: C.accent }}>£49/mo</Serif>
          <Dim style={{ marginTop: 4, fontSize: 11.5 }}>4% commission · unlimited · AI account manager · API</Dim>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Btn
          label="Apply to sell — five minutes"
          onPress={() => nav.navigate('Apply', {})}
        />
        <Dim style={{ textAlign: 'center', marginTop: 9, fontSize: 11 }}>
          Five minutes in-app. Only the Stripe-hosted identity check opens in your
          browser — decision within 24h of verification.
        </Dim>
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
  perk: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.line,
    borderRadius: 16, padding: 15,
  },
  tiers: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 22 },
  tier: {
    flex: 1, borderWidth: 1, borderColor: C.line,
    borderRadius: 18, padding: 15,
  },
})
