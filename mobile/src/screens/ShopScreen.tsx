import React from 'react'
import { View, FlatList, Pressable, StyleSheet } from 'react-native'
import { Text } from '../ui/T'
import { TextInput } from '../ui/TI'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import Ionicons from '@expo/vector-icons/Ionicons'
import { F, useTheme, pexels, flagUrl, Palette } from '../theme'
import { fmt, useI18nTick } from '../i18n'
import { fetchShop, ShopProduct } from '../api'
import { CATEGORIES } from '../categories'
import { COUNTRIES } from '../data'
import { countryName } from '../data'

// SHOP — the website's /shop page, replicated (2026-08-04). Same structure
// as velorcommerce.store/shop after William's same-day web change: serif
// "All Goods" title with the live item count, the CATEGORY PHOTO RAIL (the
// only category filter UI — the text pill row was removed on the site today,
// so it does not exist here either; tapping the active tile again clears the
// filter, same as the site), the search bar with live country/category/
// product hits, then every listing in a two-column grid of website-style
// cards. All data comes live from the same /api/shop/products route the
// website queries — no local catalogue, no fabricated listings.

export default function ShopScreen() {
  useI18nTick()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const [category, setCategory] = React.useState<string>(route.params?.category ?? '')
  const [input, setInput] = React.useState('')
  const [search, setSearch] = React.useState('')

  // Home's "See all" hands a category through the tab params.
  React.useEffect(() => {
    if (route.params?.category !== undefined) setCategory(route.params.category)
  }, [route.params?.category])

  // Debounced live search — 300ms, same feel as the website's live results.
  React.useEffect(() => {
    const h = setTimeout(() => setSearch(input.trim()), 300)
    return () => clearTimeout(h)
  }, [input])

  const { data, isLoading } = useQuery({
    queryKey: ['shop', category, search],
    queryFn: () => fetchShop({ category: category || undefined, search: search || undefined, limit: 60 }),
    staleTime: 30_000,
  })

  // Country hits for the live search dropdown — same behaviour as the
  // website's search: a country name match opens that country's channel.
  const countryHits = React.useMemo(() => {
    const q = search.toLowerCase()
    if (q.length < 2) return []
    return COUNTRIES.filter((c) => c.n.toLowerCase().includes(q)).slice(0, 3)
  }, [search])

  const s = styles(t)
  const products = data?.products ?? []

  const header = (
    <View>
      <Text style={[s.brand, { paddingTop: insets.top + 14 }]}>VELOR</Text>
      <View style={s.titleRow}>
        <Text style={s.h1}>{category || 'All Goods'}</Text>
        {data ? <Text style={s.count}>{data.total} items</Text> : null}
      </View>

      {/* Category photo rail — the shop's only category filter (site parity) */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c.slug}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 4 }}
        renderItem={({ item: c }) => {
          const active = category === c.name
          return (
            <Pressable
              style={[s.tile, active && { borderColor: t.accent, borderWidth: 2 }]}
              onPress={() => setCategory(active ? '' : c.name)}
            >
              {c.image ? (
                <Image source={{ uri: pexels(c.image.id, 340) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: t.surf2 }]} />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(8,8,11,0.92)']}
                locations={[0.35, 1]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={s.tileTx} numberOfLines={2}>
                {c.name}
              </Text>
            </Pressable>
          )
        }}
      />

      {/* Search bar — website styling: flat field + orange Search block */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={t.dim} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Search goods, country or seller..."
            placeholderTextColor={t.dim}
            style={s.searchInput}
            autoCorrect={false}
          />
          {input ? (
            <Pressable onPress={() => setInput('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={t.mut} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Live country hits — tapping opens the country channel */}
      {countryHits.length ? (
        <View style={s.hits}>
          {countryHits.map((c) => (
            <Pressable key={c.c} style={s.hitRow} onPress={() => nav.navigate('Country', { cc: c.c })}>
              <Image source={{ uri: flagUrl(c.c, 40) }} style={{ width: 22, height: 16, borderRadius: 2.5 }} />
              <Text style={s.hitTx}>{c.n}</Text>
              <Text style={s.hitSub}>Country channel</Text>
              <Ionicons name="arrow-forward" size={14} color={t.accent} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {isLoading ? <Text style={s.loading}>Searching the world…</Text> : null}
      {!isLoading && products.length === 0 ? (
        <View style={{ paddingHorizontal: 24, paddingVertical: 30 }}>
          <Text style={s.emptyT}>Nothing here — yet.</Text>
          <Text style={s.emptyS}>
            {search
              ? "Try a country's name, a category, or a craft — weaving, ceramics, leather…"
              : 'Verified makers are joining now. The first listings in this category will appear right here.'}
          </Text>
        </View>
      ) : null}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
        columnWrapperStyle={{ paddingHorizontal: 16, gap: 10 }}
        contentContainerStyle={{ paddingBottom: 30, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <GridCard p={item} t={t} onPress={() => nav.navigate('Pdp', { product: item })} />
        )}
      />
    </View>
  )
}

function GridCard({ p, t, onPress }: { p: ShopProduct; t: Palette; onPress: () => void }) {
  const s = styles(t)
  const price = p.discountedPrice ?? p.price
  return (
    <Pressable style={s.gcard} onPress={onPress}>
      <View style={s.gimgWrap}>
        {p.images?.[0] ? (
          <Image source={{ uri: p.images[0] }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: t.surf2 }]} />
        )}
        {p.percentOff ? (
          <View style={s.offBadge}>
            <Text style={s.offTx}>-{p.percentOff}%</Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 10 }}>
        <Text style={s.gcat} numberOfLines={1}>
          {(p.originCountry ? countryName(p.originCountry) + ' · ' : '') + (p.category ?? '').toUpperCase()}
        </Text>
        <Text style={s.gtitle} numberOfLines={2}>
          {p.name ?? p.title ?? 'Listing'}
        </Text>
        <View style={s.gfoot}>
          <Text style={s.gprice}>{fmt(price)}</Text>
          <Text style={s.gseller} numberOfLines={1}>
            {p.sellerName ?? ''}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = (t: Palette) =>
  StyleSheet.create({
    brand: { fontFamily: F.display, fontSize: 20, letterSpacing: -0.5, color: t.accent, paddingHorizontal: 16 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    h1: { fontFamily: F.serif, fontSize: 28, color: t.text, flexShrink: 1 },
    count: { fontFamily: F.body, fontSize: 13, color: t.mut },
    tile: {
      width: 104,
      height: 128,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: t.surf2,
      borderWidth: 1,
      borderColor: t.line,
    },
    tileTx: {
      position: 'absolute',
      left: 8,
      right: 8,
      bottom: 8,
      fontFamily: F.bodySemi,
      fontSize: 11,
      lineHeight: 14,
      color: '#fff',
    },
    searchRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      paddingHorizontal: 13,
    },
    searchInput: { flex: 1, color: t.text, fontFamily: F.body, fontSize: 14, paddingVertical: 13 },
    hits: {
      marginHorizontal: 16,
      marginTop: 6,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 12,
      backgroundColor: t.surf,
      overflow: 'hidden',
    },
    hitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: t.line,
    },
    hitTx: { fontFamily: F.bodySemi, fontSize: 13.5, color: t.text },
    hitSub: { flex: 1, fontFamily: F.body, fontSize: 11, color: t.mut },
    loading: { fontFamily: F.body, fontSize: 13, color: t.mut, padding: 24, textAlign: 'center' },
    emptyT: { fontFamily: F.serif, fontSize: 20, color: t.text },
    emptyS: { fontFamily: F.body, fontSize: 12.5, lineHeight: 18, color: t.mut, marginTop: 8 },
    gcard: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
    },
    gimgWrap: { aspectRatio: 1, backgroundColor: t.surf2 },
    offBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: t.accent,
      borderRadius: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    offTx: { fontFamily: F.displayMed, fontSize: 10.5, color: '#fff' },
    gcat: { fontFamily: F.bodySemi, fontSize: 9, letterSpacing: 0.8, color: t.mut },
    gtitle: { fontFamily: F.serif, fontSize: 14.5, lineHeight: 19, color: t.text, marginTop: 4, minHeight: 38 },
    gfoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 },
    gprice: { fontFamily: F.display, fontSize: 15.5, color: t.text },
    gseller: { fontFamily: F.body, fontSize: 10.5, color: t.mut, flexShrink: 1 },
  })
