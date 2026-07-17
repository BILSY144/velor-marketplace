import React, { useRef, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, PanResponder } from 'react-native'
import { Text } from '../ui/T'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, pexels } from '../theme'
import { Kicker, Body, Dim, Btn } from '../ui'
import { Chrome } from '../components/Chrome'

const PERKS: [string, string][] = [
  ['Founding badge, permanent', 'On your store and every listing, forever.'],
  ['The full Pro tier, free for life', 'Unlimited listings, Go Live, your AI account manager — £49/mo at £0 while your subscription runs. 4% commission.'],
  ['The homepage showreel slot', 'Your film, on the front page of the world’s shopping channel.'],
  ['Your country’s page, alone', 'You open the channel and are credited as the seller who opened it.'],
]

// Real tier maths — TIER_CONFIG figures (Starter free/10%, Pro £49/4%,
// two-tier scheme since Enterprise retired 2026-07-15).
const TIERS = {
  starter: { label: 'Starter', fee: 0, rate: 0.1, foot: 'Free · 10%' },
  pro: { label: 'Pro', fee: 49, rate: 0.04, foot: '£49 · 4% · unlimited' },
} as const
type TierKey = keyof typeof TIERS

const keep = (t: TierKey, sales: number) =>
  Math.max(0, Math.round(sales * (1 - TIERS[t].rate) - TIERS[t].fee))

// The sell pitch — plate 23 + spec/sell.txt, exact: the sellhero photo cover
// (the mockup's own Pexels 31330206) melting into black, SELL ON VELOR
// kicker, Fraunces 34 hero, founding-seat perks, the "What you'd keep"
// calculator (drag the slider, TAP A TIER CARD to choose the plan the figure
// is computed on), then the plate's two CTAs — the seats map and Apply.
export default function SellScreen() {
  const nav = useNavigation<any>()
  const [sales, setSales] = useState(1000)
  const [tier, setTier] = useState<TierKey>('starter')

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero — sellhero cover */}
        <View style={s.hero}>
          <Image source={{ uri: pexels(31330206, 900) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          <LinearGradient
            colors={['rgba(8,8,11,0.35)', 'rgba(8,8,11,0.55)', '#08080b']}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 26 }}>
            <Kicker>SELL ON VELOR</Kicker>
            <Text style={s.h1}>Your country's{'\n'}shopping channel.</Text>
            <Text style={s.heroSub}>
              Broadcast live from the workshop and sell around the clock with listings. Buyers
              arrive 6 August.
            </Text>
          </View>
        </View>

        <Kicker style={{ paddingHorizontal: 20, marginTop: 26 }}>
          THE FOUNDING SEAT — ONE PER COUNTRY
        </Kicker>
        <View style={{ paddingHorizontal: 20, marginTop: 6 }}>
          {PERKS.map(([t, b], i) => (
            <View key={t} style={[s.perk, i === PERKS.length - 1 && { borderBottomWidth: 0 }]}>
              <Ionicons name="checkmark" size={16} color={C.accent} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontFamily: F.bodySemi, fontSize: 13.5 }}>{t}</Body>
                <Dim style={{ marginTop: 3, lineHeight: 17, fontSize: 11.5 }}>{b}</Dim>
              </View>
            </View>
          ))}
        </View>

        {/* What you'd keep — plate 23 calculator, tier cards are the choice */}
        <View style={s.calc}>
          <Body style={{ fontFamily: F.bodySemi, fontSize: 14 }}>What you'd keep</Body>
          <Dim style={{ fontSize: 11.5, marginTop: 3 }}>
            Drag your expected monthly sales — tap a plan to compare.
          </Dim>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
            <Text style={s.calcAmt}>{'£'}{keep(tier, sales).toLocaleString('en-GB')}</Text>
            <Dim style={{ fontSize: 12 }}>
              of £{sales.toLocaleString('en-GB')} · {TIERS[tier].label}
            </Dim>
          </View>
          <Slider value={sales} min={0} max={10000} step={100} onChange={setSales} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {(Object.keys(TIERS) as TierKey[]).map((k) => (
              <Pressable key={k} style={[s.tcard, tier === k && s.tcardOn]} onPress={() => setTier(k)}>
                <Text style={[s.tn, tier === k && { color: C.accent }]}>{TIERS[k].label}</Text>
                <Text style={s.tk}>{'£'}{keep(k, sales).toLocaleString('en-GB')}</Text>
                <Text style={s.tf}>{TIERS[k].foot}</Text>
              </Pressable>
            ))}
          </View>
          <Dim style={{ fontSize: 11.5, lineHeight: 17, marginTop: 14 }}>
            0% listing fees on every plan. Paid out after each delivery is confirmed. Every seller
            starts free — upgrade to Pro any time from your dashboard.
          </Dim>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 10 }}>
          <Btn label="See if your seat is open" onPress={() => nav.navigate('Seats')} />
          <Btn ghost label="Apply now" onPress={() => nav.navigate('Apply', {})} />
          <Dim style={{ textAlign: 'center', marginTop: 4, fontSize: 11 }}>
            Five minutes in-app. Only the Stripe-hosted identity check opens in your
            browser — decision within 24h of verification.
          </Dim>
        </View>
      </ScrollView>
      <Chrome back="You" onBack={() => nav.goBack()} />
    </View>
  )
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  const [w, setW] = useState(0)
  const wRef = useRef(0)
  const update = (x: number) => {
    const width = wRef.current
    if (!width) return
    const frac = Math.min(1, Math.max(0, x / width))
    const raw = min + frac * (max - min)
    onChange(Math.round(raw / step) * step)
  }
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
      onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    })
  ).current
  const frac = (value - min) / (max - min)
  return (
    <View
      style={s.track}
      onLayout={(e) => {
        setW(e.nativeEvent.layout.width)
        wRef.current = e.nativeEvent.layout.width
      }}
      {...pan.panHandlers}
    >
      <View style={s.rail} />
      <View style={[s.fill, { width: Math.max(0, frac * w) }]} />
      <View style={[s.thumb, { left: Math.max(0, frac * w - 11) }]} />
    </View>
  )
}

const s = StyleSheet.create({
  hero: { height: 430, backgroundColor: C.surf },
  h1: { fontFamily: F.serifLight, fontSize: 34, lineHeight: 38, color: C.text, marginTop: 10 },
  heroSub: { fontFamily: F.body, fontSize: 11.5, lineHeight: 18, color: '#d4d3cf', marginTop: 12, maxWidth: 280 },
  perk: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    paddingVertical: 14, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  calc: {
    marginHorizontal: 20, marginTop: 26,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: C.line,
    borderRadius: 24, padding: 18,
  },
  calcAmt: { fontFamily: F.display, fontSize: 27, color: C.text },
  track: { height: 34, justifyContent: 'center', marginTop: 12 },
  rail: {
    position: 'absolute', left: 0, right: 0, height: 5,
    borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  fill: {
    position: 'absolute', left: 0, height: 5,
    borderRadius: 3, backgroundColor: C.accent,
  },
  thumb: {
    position: 'absolute', width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.accent,
  },
  tcard: {
    flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 16,
    paddingVertical: 14, alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tcardOn: {
    borderColor: 'rgba(255,107,0,0.55)',
    backgroundColor: 'rgba(255,107,0,0.08)',
  },
  tn: { fontFamily: F.display, fontSize: 9.5, letterSpacing: 1, color: C.mut },
  tk: { fontFamily: F.display, fontSize: 15, color: C.text },
  tf: { fontFamily: F.body, fontSize: 9.5, color: C.mut },
})
