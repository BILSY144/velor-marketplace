import React, { useMemo, useState } from 'react'
import {
  View,
  SectionList,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, flagUrl, pexels } from '../theme'
import { COUNTRIES, HINTS, IMAGERY, countriesByRegion, Country } from '../data'
import { fetchLattice } from '../api'
import { Kicker, Dim } from '../ui'
import { Chrome } from '../components/Chrome'

// The founding seats — plate 24 + spec/seats.txt: THE FOUNDING MAP kicker,
// "One seat per country." Fraunces 30, search, the SEATS / TAKEN / 24H
// DECISION stat row (TAKEN is live from /api/lattice — a country counts as
// taken once someone really sells from it, never faked), WHAT THE SEAT
// CARRIES, the CRAFT POWERHOUSES rail, then every region's countries as
// seat rows with their real craft hints. Every row lands on Apply with the
// country pre-picked.
const CARRIES: [string, string][] = [
  ['Founding badge', 'Permanent, on your store and every listing.'],
  ['Pro free for life', 'Unlimited listings, Go Live, your AI account manager — 4% commission.'],
  ['Homepage showreel', 'Your film on the front page of the channel.'],
  ['Opening credit', 'Named as the seller who opened your country’s page.'],
]

const POWERHOUSES = ['JP', 'CN', 'IN', 'MA', 'TR', 'PE', 'MX', 'IT']

export default function SeatsScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const [q, setQ] = useState('')

  const lattice = useQuery({ queryKey: ['lattice'], queryFn: fetchLattice })
  const tradingSet = useMemo(
    () =>
      new Set(
        (lattice.data?.countries ?? []).filter((c) => c.products > 0).map((c) => c.code)
      ),
    [lattice.data]
  )
  const taken = tradingSet.size

  const sections = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return countriesByRegion()
      .map((r) => ({
        title: r.title,
        data: ql
          ? r.data.filter(
              (c) =>
                c.n.toLowerCase().includes(ql) ||
                (HINTS[c.c] ?? []).some((h) => h.toLowerCase().includes(ql))
            )
          : r.data,
      }))
      .filter((r) => r.data.length)
  }, [q])

  const header = (
    <View>
      <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 58 }}>
        <Kicker>THE FOUNDING MAP</Kicker>
        <Text style={s.h1}>One seat per country.</Text>
        <Dim style={{ marginTop: 8, lineHeight: 18 }}>
          The first verified seller from a country opens its channel and keeps the seat
          permanently.{taken === 0 ? ` All ${COUNTRIES.length} are still open.` : ''}
        </Dim>
        <View style={s.bar}>
          <Ionicons name="search-outline" size={16} color={C.dim} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Your country, or a craft…"
            placeholderTextColor={C.dim}
            style={s.input}
            autoCorrect={false}
          />
        </View>
        {/* Stat row */}
        <View style={s.stats}>
          <View style={s.stat}>
            <Text style={s.sv}>{COUNTRIES.length}</Text>
            <Text style={s.sl}>SEATS</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.sv}>{lattice.isLoading ? '—' : taken}</Text>
            <Text style={s.sl}>TAKEN</Text>
          </View>
          <View style={[s.stat, { borderRightWidth: 0 }]}>
            <Text style={s.sv}>24H</Text>
            <Text style={s.sl}>DECISION</Text>
          </View>
        </View>

        <Text style={s.kickDim}>WHAT THE SEAT CARRIES</Text>
        <View style={s.carries}>
          {CARRIES.map(([t, b], i) => (
            <View key={t} style={[s.carry, i === CARRIES.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.st}>{t}</Text>
              <Text style={s.ss}>{b}</Text>
            </View>
          ))}
        </View>

        <Text style={s.kickDim}>CRAFT POWERHOUSES — EVERY ONE STILL OPEN</Text>
      </View>
      <View style={{ marginTop: 12 }}>
        <PowerRail nav={nav} tradingSet={tradingSet} />
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SectionList
        sections={sections}
        keyExtractor={(c) => c.c}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={7}
        renderSectionHeader={({ section }) => (
          <Kicker style={{ paddingHorizontal: 20, paddingTop: 26, color: C.mut }}>
            {section.title.toUpperCase()} · {section.data.length}
          </Kicker>
        )}
        renderItem={({ item }) => (
          <SeatRow c={item} taken={tradingSet.has(item.c)} nav={nav} />
        )}
      />
      <Chrome back="Sell" onBack={() => nav.goBack()} />
    </View>
  )
}

function SeatRow({ c, taken, nav }: { c: Country; taken: boolean; nav: any }) {
  const img = IMAGERY[c.c]?.[0]?.i
  const hints = (HINTS[c.c] ?? []).slice(0, 2).join(' · ')
  return (
    <Pressable
      style={s.row}
      onPress={() => (taken ? nav.navigate('Country', { cc: c.c }) : nav.navigate('Apply', { cc: c.c }))}
    >
      {img ? (
        <Image source={{ uri: pexels(img, 200) }} style={s.rowImg} contentFit="cover" />
      ) : (
        <View style={[s.rowImg, { backgroundColor: C.surf2 }]} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Text style={s.rowN} numberOfLines={1}>
            {c.n}
          </Text>
          <Image source={{ uri: flagUrl(c.c, 40) }} style={{ width: 17, height: 12, borderRadius: 2 }} />
        </View>
        {hints ? (
          <Text style={s.rowK} numberOfLines={1}>
            {hints}
          </Text>
        ) : null}
      </View>
      <Text style={taken ? s.chipTaken : s.chipOpen}>{taken ? 'CHANNEL OPEN' : 'SEAT OPEN'}</Text>
    </Pressable>
  )
}

function PowerRail({ nav, tradingSet }: { nav: any; tradingSet: Set<string> }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
    >
      {POWERHOUSES.map((cc) => {
          const c = COUNTRIES.find((x) => x.c === cc)
          if (!c) return null
          const img = IMAGERY[cc]?.[0]?.i
          const hints = (HINTS[cc] ?? []).slice(0, 2).join(' · ')
          const taken = tradingSet.has(cc)
          return (
            <Pressable
              key={cc}
              style={s.power}
              onPress={() => nav.navigate('Apply', { cc })}
            >
              {img ? (
                <Image source={{ uri: pexels(img, 400) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              ) : null}
              <View style={s.powerShade} />
              <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.powerN}>{c.n}</Text>
                  <Image source={{ uri: flagUrl(cc, 40) }} style={{ width: 16, height: 11, borderRadius: 2 }} />
                </View>
                {hints ? (
                  <Text style={s.powerK} numberOfLines={1}>
                    {hints}
                  </Text>
                ) : null}
                <Text style={[s.chipOpen, { marginTop: 6, alignSelf: 'flex-start' }]}>
                  {taken ? 'CHANNEL OPEN' : 'SEAT OPEN'}
                </Text>
              </View>
            </Pressable>
          )
        })}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  h1: { fontFamily: F.serifLight, fontSize: 30, color: C.text, marginTop: 8 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 15,
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: C.text, fontFamily: F.body, fontSize: 14.5, paddingVertical: 14 },
  stats: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sv: { fontFamily: F.serifLight, fontSize: 26, color: C.accent },
  sl: { fontFamily: F.display, fontSize: 8.5, letterSpacing: 1, color: C.mut },
  kickDim: {
    fontFamily: F.displayMed,
    fontSize: 9,
    letterSpacing: 2.2,
    color: C.mut,
    marginTop: 26,
  },
  carries: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  carry: { paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  st: { fontFamily: F.display, fontSize: 12.5, color: C.text },
  ss: { fontFamily: F.body, fontSize: 10.5, color: C.mut, marginTop: 2 },
  power: {
    width: 168,
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: C.surf2,
  },
  powerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  powerN: { fontFamily: F.displayMed, fontSize: 13, color: C.text },
  powerK: { fontFamily: F.body, fontSize: 10, color: '#c9c9d2', marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  rowImg: { width: 52, height: 52, borderRadius: 12 },
  rowN: { fontFamily: F.displayMed, fontSize: 13, color: C.text, flexShrink: 1 },
  rowK: { fontFamily: F.body, fontSize: 10.5, color: C.mut, marginTop: 2 },
  chipOpen: { fontFamily: F.display, fontSize: 8, letterSpacing: 1, color: C.accent },
  chipTaken: { fontFamily: F.display, fontSize: 8, letterSpacing: 1, color: C.green },
})
