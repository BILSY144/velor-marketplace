import React, { useMemo, useState } from 'react'
import {
  View,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, flagUrl, pexels } from '../theme'
import { COUNTRIES, HINTS, IMAGERY, countriesByRegion, Country } from '../data'
import { Kicker, Dim, Serif, Empty } from '../ui'
import { Chrome } from '../components/Chrome'

// Search — plate 06 + spec/search.txt, exact: "Search the world." Fraunces 34,
// the "A place, a craft, a thing…" input, then every region as a horizontal
// rail of tall country photo cards (each country's lead IMAGERY photo, flag
// chip + name), ending on the dashed-globe "190 channels, still opening."
// Typing swaps the rails for results: countries, then crafts (IMAGERY matches
// open the craft page, culture-hint matches open the country dive).
type Hit = { cc: string; name: string; craft?: string; img?: number }

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const [q, setQ] = useState('')

  const regions = useMemo(() => countriesByRegion(), [])

  const hits: Hit[] = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) return []
    const out: Hit[] = []
    for (const c of COUNTRIES) {
      if (c.n.toLowerCase().includes(ql)) out.push({ cc: c.c, name: c.n })
    }
    for (const c of COUNTRIES) {
      for (const im of IMAGERY[c.c] ?? []) {
        if (im.n.toLowerCase().includes(ql)) {
          out.push({ cc: c.c, name: c.n, craft: im.n, img: im.i })
          if (out.length > 80) return out
        }
      }
    }
    for (const c of COUNTRIES) {
      for (const craft of HINTS[c.c] ?? []) {
        const already = out.some(
          (h) => h.cc === c.c && h.craft?.toLowerCase() === craft.toLowerCase()
        )
        if (!already && craft.toLowerCase().includes(ql)) {
          out.push({ cc: c.c, name: c.n, craft })
          if (out.length > 80) return out
        }
      }
    }
    return out
  }, [q])

  const header = (
    <View style={{ paddingTop: insets.top + 58 }}>
      <Text style={s.h1}>Search{'\n'}the world.</Text>
      <View style={s.bar}>
        <Ionicons name="search-outline" size={17} color={C.dim} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="A place, a craft, a thing…"
          placeholderTextColor={C.dim}
          style={s.input}
          autoCorrect={false}
        />
        {q ? (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={C.mut} />
          </Pressable>
        ) : null}
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {q.trim() ? (
        <ResultsList hits={hits} header={header} />
      ) : (
        <FlatList
          data={regions}
          keyExtractor={(r) => r.title}
          ListHeaderComponent={header}
          ListFooterComponent={<Footer />}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item: region }) => <RegionRail region={region} />}
          windowSize={5}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
        />
      )}
      <Chrome back="Atlas" onBack={() => nav.navigate('Atlas')} />
    </View>
  )
}

function ResultsList({ hits, header }: { hits: Hit[]; header: React.ReactElement }) {
  const nav = useNavigation<any>()
  const openHit = (h: Hit) => {
    if (h.craft && h.img) nav.navigate('Craft', { cc: h.cc, craft: h.craft, img: h.img })
    else nav.navigate('Country', { cc: h.cc })
  }
  return (
    <FlatList
      data={hits}
      keyExtractor={(h, i) => h.cc + (h.craft ?? '') + i}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Empty
          title="Nothing by that name."
          sub="Try the country's English name, or a craft — weaving, ceramics, leather…"
        />
      }
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <Pressable style={s.row} onPress={() => openHit(item)}>
          {item.img ? (
            <Image source={{ uri: pexels(item.img, 200) }} style={s.rowImg} contentFit="cover" />
          ) : (
            <View
              style={[
                s.rowImg,
                { alignItems: 'center', justifyContent: 'center', backgroundColor: C.surf2 },
              ]}
            >
              <Image source={{ uri: flagUrl(item.cc) }} style={{ width: 24, height: 17, borderRadius: 3 }} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Serif style={{ fontSize: 15 }} numberOfLines={1}>
              {item.craft ?? item.name}
            </Serif>
            <Dim style={{ fontSize: 11, marginTop: 2 }}>
              {item.craft ? item.name : 'Country channel'}
            </Dim>
          </View>
          <Ionicons name="arrow-forward" size={15} color={C.accent} />
        </Pressable>
      )}
    />
  )
}

function RegionRail({ region }: { region: { title: string; data: Country[] } }) {
  const nav = useNavigation<any>()
  return (
    <View style={{ paddingTop: 26 }}>
      <Kicker style={{ paddingHorizontal: 20, color: C.mut }}>
        {region.title.toUpperCase()} · {region.data.length}
      </Kicker>
      <FlatList
        horizontal
        data={region.data}
        keyExtractor={(c) => c.c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 12 }}
        initialNumToRender={4}
        windowSize={3}
        renderItem={({ item: c }) => {
          const img = IMAGERY[c.c]?.[0]?.i
          return (
            <Pressable style={s.tile} onPress={() => nav.navigate('Country', { cc: c.c })}>
              {img ? (
                <Image
                  source={{ uri: pexels(img, 500) }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
              ) : null}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.75)']}
                locations={[0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.tileRow}>
                <Image source={{ uri: flagUrl(c.c, 40) }} style={{ width: 18, height: 13, borderRadius: 2.5 }} />
                <Text style={s.tileName} numberOfLines={2}>
                  {c.n}
                </Text>
              </View>
            </Pressable>
          )
        }}
      />
    </View>
  )
}

function Footer() {
  return (
    <View style={s.foot}>
      <View style={s.footGlobe}>
        <Ionicons name="earth" size={30} color={C.accent} />
      </View>
      <Text style={s.footT}>{COUNTRIES.length} channels, still opening.</Text>
      <Dim style={{ textAlign: 'center', marginTop: 8, lineHeight: 18, paddingHorizontal: 40 }}>
        Tap a country to dive in — every craft it is known for lives on its page.
      </Dim>
    </View>
  )
}

const s = StyleSheet.create({
  h1: {
    fontFamily: F.serifLight,
    fontSize: 34,
    lineHeight: 40,
    color: C.text,
    paddingHorizontal: 20,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: C.text,
    fontFamily: F.body,
    fontSize: 15,
    paddingVertical: 16,
  },
  tile: {
    width: 132,
    height: 174,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.surf2,
  },
  tileRow: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileName: {
    flex: 1,
    fontFamily: F.displayMed,
    fontSize: 13,
    lineHeight: 16,
    color: C.text,
  },
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
  foot: { alignItems: 'center', paddingTop: 44, paddingBottom: 30 },
  footGlobe: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,107,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footT: { fontFamily: F.serifLight, fontSize: 22, color: C.text, textAlign: 'center' },
})
