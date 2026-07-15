import React, { useMemo } from 'react'
import { View, SectionList, Pressable, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { WebView } from 'react-native-webview'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { C, F, flagUrl } from '../theme'
import { countriesByRegion, FILMS, HINTS } from '../data'
import { fetchLattice } from '../api'
import { globeHtml } from '../globeHtml'
import { Kicker, Display, Body, Dim, Serif } from '../ui'

export default function AtlasScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const sections = useMemo(countriesByRegion, [])
  const html = useMemo(globeHtml, [])
  const lattice = useQuery({ queryKey: ['lattice'], queryFn: fetchLattice })
  const tradingByCode = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of lattice.data?.countries ?? []) m[c.code] = c.products
    return m
  }, [lattice.data])

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: C.bg }}
      sections={sections}
      keyExtractor={(item) => item.c}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View>
          <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 12 }}>
            <Kicker>THE ATLAS</Kicker>
            <Display style={{ marginTop: 6 }}>Shop the world.</Display>
          </View>

          {/* The globe — drag to spin, tap a light to dive into that country */}
          <View style={s.globeWrap}>
            <WebView
              source={{ html }}
              style={s.globe}
              containerStyle={{ backgroundColor: C.bg }}
              scrollEnabled={false}
              overScrollMode="never"
              setSupportMultipleWindows={false}
              originWhitelist={['*']}
              onMessage={(e) => {
                const cc = e.nativeEvent.data
                if (cc && cc.length === 2) nav.navigate('Country', { cc })
              }}
            />
          </View>
          <Dim style={{ textAlign: 'center', fontSize: 10.5, marginTop: 2 }}>
            Drag to spin · tap a light to dive in
          </Dim>

          <View style={s.statRow}>
            <Stat value={String(lattice.data?.totalCountries ?? 190)} label="COUNTRIES" />
            <Stat
              value={lattice.isLoading ? '—' : String(lattice.data?.trading ?? 0)}
              label="TRADING NOW"
            />
            <Stat value="6 AUG" label="BUYERS ARRIVE" />
          </View>

          <Kicker style={{ paddingHorizontal: 20, marginTop: 22 }}>
            SHOPPING THE WORLD — PREVIEW FILMS
          </Kicker>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 12 }}
          >
            {FILMS.slice(0, 12).map((f, i) => (
              <Pressable key={f.src} style={s.filmCard} onPress={() => nav.navigate('Live', { start: i })}>
                <Image source={{ uri: f.poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                <View style={s.filmShade} />
                <View style={s.previewTag}>
                  <Body style={s.previewTx}>PREVIEW</Body>
                </View>
                <View style={{ position: 'absolute', left: 9, right: 9, bottom: 9 }}>
                  <Body style={{ fontFamily: F.bodySemi, fontSize: 11.5 }} numberOfLines={1}>
                    {f.title}
                  </Body>
                  <Dim style={{ fontSize: 10 }} numberOfLines={1}>
                    {f.sub}
                  </Dim>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={{ paddingHorizontal: 20, paddingTop: 26, paddingBottom: 6 }}>
          <Kicker style={{ color: C.mut }}>
            {section.title.toUpperCase()} · {section.data.length}
          </Kicker>
        </View>
      )}
      renderItem={({ item }) => {
        const products = tradingByCode[item.c] ?? 0
        const crafts = (HINTS[item.c] ?? []).slice(0, 2).join(' · ')
        return (
          <Pressable style={s.row} onPress={() => nav.navigate('Country', { cc: item.c })}>
            <Image source={{ uri: flagUrl(item.c) }} style={s.flag} contentFit="cover" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Serif style={{ fontSize: 15.5 }}>{item.n}</Serif>
              {crafts ? (
                <Dim style={{ fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                  {crafts}
                </Dim>
              ) : null}
            </View>
            {products > 0 ? (
              <View style={s.tradingTag}>
                <Body style={{ fontFamily: F.displayMed, fontSize: 9.5, color: C.green }}>
                  {products} LIVE
                </Body>
              </View>
            ) : (
              <View style={s.openTag}>
                <Body style={{ fontFamily: F.displayMed, fontSize: 9, color: C.accent }}>
                  OPENING
                </Body>
              </View>
            )}
          </Pressable>
        )
      }}
      ListFooterComponent={<View style={{ height: 40 }} />}
    />
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Serif style={{ fontSize: 22, color: C.accent }}>{value}</Serif>
      <Body style={s.statLabel}>{label}</Body>
    </View>
  )
}

const s = StyleSheet.create({
  globeWrap: {
    height: 390,
    marginTop: 6,
    overflow: 'hidden',
  },
  globe: { flex: 1, backgroundColor: C.bg },
  statRow: {
    flexDirection: 'row',
    marginTop: 18,
    marginHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statLabel: {
    fontFamily: F.display,
    fontSize: 8.5,
    letterSpacing: 1.2,
    color: C.mut,
    marginTop: 4,
  },
  filmCard: {
    width: 128,
    aspectRatio: 9 / 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.surf2,
  },
  filmShade: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  previewTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  previewTx: { fontFamily: F.display, fontSize: 8, letterSpacing: 1, color: C.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  flag: { width: 26, height: 19, borderRadius: 4 },
  tradingTag: {
    borderWidth: 1,
    borderColor: 'rgba(61,220,132,0.4)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  openTag: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,107,0,0.5)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
})
