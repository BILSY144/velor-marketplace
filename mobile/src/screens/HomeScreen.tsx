import React from 'react'
import { View, ScrollView, FlatList, Pressable, StyleSheet, Image as RNImage, RefreshControl } from 'react-native'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import Ionicons from '@expo/vector-icons/Ionicons'
import { F, useTheme, useThemeStore, pexels, flagUrl, Palette } from '../theme'
import { fmt, useI18nTick } from '../i18n'
import { fetchShop, ShopProduct } from '../api'
import { CATEGORIES } from '../categories'
import { countryName } from '../data'

// HOME — the website homepage, replicated (2026-08-04, William: "redesign
// the app to kind of replicate the website... with the website's data and
// functionalities"). Top to bottom, matching velorcommerce.store:
//   header (logo · bell / wishlist-hearts / theme toggle),
//   the orange value-slogan bar,
//   per-category rails of REAL listings from /api/shop/products — the same
//   live data the website's homepage rails render — padded with the same
//   "Your goods here" open-slot cards the website shows on category rails
//   with spare seats (honest placeholders, clearly not listings; each opens
//   the Sell door exactly like the website's link to /apply).
// No fabricated products anywhere: every priced card is a real APPROVED
// listing served by the production API.

const SLOGANS = ['Never factory-made', 'Real cultural goods', 'Every piece tells a story', 'Made by hand, always']

export default function HomeScreen() {
  useI18nTick()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const toggleTheme = useThemeStore((s) => s.toggle)

  // LIVE DATA (William, 2026-08-04: "the app has to have real time data"):
  // straight from the production API every time -- 30s freshness window,
  // refetch on remount, and pull-to-refresh below for an instant update.
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['home-shop'],
    queryFn: () => fetchShop({ limit: 100 }),
    staleTime: 30_000,
    refetchOnMount: 'always',
  })

  // Group real listings by category, in the canonical category order —
  // exactly how the website's homepage builds its rails.
  const rails = React.useMemo(() => {
    const byCat = new Map<string, ShopProduct[]>()
    for (const p of data?.products ?? []) {
      const cat = p.category ?? 'Home Craft & Décor'
      const arr = byCat.get(cat) ?? []
      arr.push(p)
      byCat.set(cat, arr)
    }
    // Categories with real listings first (site behaviour), then a couple of
    // open-slot-only rails so the page reads as a marketplace, not a void.
    const withGoods = CATEGORIES.filter((c) => byCat.get(c.name)?.length)
    const empties = CATEGORIES.filter((c) => !byCat.get(c.name)?.length && c.image).slice(0, 4)
    return [...withGoods, ...empties].map((c) => ({ def: c, products: byCat.get(c.name) ?? [] }))
  }, [data])

  const s = styles(t)

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={t.accent} colors={[t.accent]} />}
      >
        {/* Header — logo left, bell / hearts / theme right (website header) */}
        <View style={[s.header, { paddingTop: insets.top + 10 }]}>
          <RNImage
            source={require('../../assets/splash.png')}
            style={{ width: 108, height: 36 }}
            resizeMode="contain"
          />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable style={s.hbtn} onPress={() => nav.navigate('LangCur')}>
              <Ionicons name="globe-outline" size={18} color={t.text} />
            </Pressable>
            <Pressable style={s.hbtn} onPress={() => nav.navigate('Bell')}>
              <Ionicons name="notifications-outline" size={18} color="#D4AF37" />
            </Pressable>
            <Pressable style={s.hbtn} onPress={toggleTheme}>
              <Ionicons name={t.light ? 'moon-outline' : 'sunny-outline'} size={18} color={t.text} />
            </Pressable>
            <Pressable style={s.hbtn} onPress={() => nav.navigate('Menu')}>
              <Ionicons name="menu-outline" size={20} color={t.text} />
            </Pressable>
          </View>
        </View>

        {/* Orange value-slogan bar — the website's three-slogan strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ backgroundColor: t.accent }}
          contentContainerStyle={s.slogans}
        >
          {SLOGANS.map((sl, i) => (
            <Text key={sl} style={[s.sloganTx, i % 2 === 1 && { fontFamily: F.serifItalic }]}>
              {sl}
            </Text>
          ))}
        </ScrollView>

        {isLoading ? (
          <Text style={s.loading}>Opening the marketplace…</Text>
        ) : (
          rails.map(({ def, products }) => (
            <View key={def.slug} style={{ marginTop: 26 }}>
              <View style={s.railHead}>
                <Text style={s.railTitle}>{def.name}</Text>
                <Pressable onPress={() => nav.navigate('Tabs', { screen: 'Shop', params: { category: def.name } })}>
                  <Text style={s.railAll}>See all →</Text>
                </Pressable>
              </View>
              <FlatList
                horizontal
                data={[...products.slice(0, 8), ...openSlots(def, Math.max(0, 4 - products.length))]}
                keyExtractor={(item, i) => ('id' in item ? item.id : `slot-${def.slug}-${i}`)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingTop: 12 }}
                renderItem={({ item }) =>
                  'id' in item ? (
                    <ProductCard p={item} t={t} onPress={() => nav.navigate('Pdp', { product: item })} />
                  ) : (
                    <SlotCard imgId={item.imgId} t={t} onPress={() => nav.navigate('Sell')} />
                  )
                }
              />
            </View>
          ))
        )}

        {/* Value strip — the website's trust bar, honest items only */}
        <View style={s.trust}>
          {[
            { icon: 'shield-checkmark-outline' as const, tx: 'Every seller verified' },
            { icon: 'lock-closed-outline' as const, tx: 'Money held in escrow until delivery' },
            { icon: 'earth-outline' as const, tx: 'Real people. Real culture.' },
          ].map((it) => (
            <View key={it.tx} style={s.trustRow}>
              <Ionicons name={it.icon} size={15} color={t.accent} />
              <Text style={s.trustTx}>{it.tx}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

function openSlots(def: { image: { id: number } | null }, n: number): { imgId: number | null }[] {
  return Array.from({ length: n }, () => ({ imgId: def.image?.id ?? null }))
}

// Product card — the website's shop card: image, category kicker, serif
// title, price + seller line. Real listings only.
export function ProductCard({ p, t, onPress }: { p: ShopProduct; t: Palette; onPress: () => void }) {
  const s = styles(t)
  const price = p.discountedPrice ?? p.price
  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.cardImgWrap}>
        {p.images?.[0] ? (
          <Image source={{ uri: p.images[0] }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: t.surf2 }]} />
        )}
        {p.originCountry ? (
          <View style={s.cardFlag}>
            <Image source={{ uri: flagUrl(p.originCountry, 40) }} style={{ width: 18, height: 13, borderRadius: 2 }} />
          </View>
        ) : null}
      </View>
      <View style={{ padding: 10 }}>
        {p.category ? (
          <Text style={s.cardCat} numberOfLines={1}>
            {(p.originCountry ? countryName(p.originCountry) + ' · ' : '') + p.category.toUpperCase()}
          </Text>
        ) : null}
        <Text style={s.cardTitle} numberOfLines={2}>
          {p.name ?? p.title ?? 'Listing'}
        </Text>
        <View style={s.cardFoot}>
          <Text style={s.cardPrice}>{fmt(price)}</Text>
          <Text style={s.cardSeller} numberOfLines={1}>
            {p.sellerName ?? ''}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

// "Your goods here" open-slot card — the website's orange-sash placeholder,
// unambiguously not a listing (no price, no seller). Opens the Sell door.
function SlotCard({ imgId, t, onPress }: { imgId: number | null; t: Palette; onPress: () => void }) {
  const s = styles(t)
  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.cardImgWrap}>
        {imgId ? (
          <Image source={{ uri: pexels(imgId, 400) }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: t.surf2 }]} />
        )}
        <View style={s.sash}>
          <Text style={s.sashTx}>Your goods here</Text>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={s.cardCat}>OPEN SEAT</Text>
        <Text style={s.cardTitle} numberOfLines={2}>
          A verified maker's piece belongs here
        </Text>
        <View style={s.cardFoot}>
          <Text style={[s.cardSeller, { color: t.accent }]}>Start selling →</Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = (t: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: t.surf,
    },
    hbtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surf2,
    },
    slogans: { paddingHorizontal: 16, paddingVertical: 9, gap: 26, alignItems: 'center' },
    sloganTx: { fontFamily: F.serif, fontSize: 14.5, color: '#fff' },
    loading: { fontFamily: F.body, fontSize: 13, color: t.mut, padding: 24, textAlign: 'center' },
    railHead: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    railTitle: { fontFamily: F.serif, fontSize: 21, color: t.text },
    railAll: { fontFamily: F.bodySemi, fontSize: 12, color: t.accent },
    card: {
      width: 168,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
    },
    cardImgWrap: { height: 150, backgroundColor: t.surf2 },
    cardFlag: {
      position: 'absolute',
      top: 8,
      left: 8,
      padding: 3,
      borderRadius: 4,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    cardCat: { fontFamily: F.bodySemi, fontSize: 9, letterSpacing: 0.8, color: t.mut },
    cardTitle: { fontFamily: F.serif, fontSize: 14, lineHeight: 18, color: t.text, marginTop: 4, minHeight: 36 },
    cardFoot: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      gap: 8,
    },
    cardPrice: { fontFamily: F.display, fontSize: 15, color: t.text },
    cardSeller: { fontFamily: F.body, fontSize: 10.5, color: t.mut, flexShrink: 1 },
    sash: {
      position: 'absolute',
      left: -40,
      right: -40,
      top: '42%',
      backgroundColor: t.accent,
      paddingVertical: 7,
      transform: [{ rotate: '-18deg' }],
      alignItems: 'center',
    },
    sashTx: { fontFamily: F.displayMed, fontSize: 12, letterSpacing: 1, color: '#fff' },
    trust: {
      marginTop: 34,
      marginHorizontal: 16,
      borderTopWidth: 1,
      borderColor: t.line,
      paddingTop: 18,
      gap: 12,
    },
    trustRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    trustTx: { fontFamily: F.body, fontSize: 12.5, color: t.mut },
  })
