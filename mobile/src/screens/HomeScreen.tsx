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
import { CULTURE_REELS, CultureReel, ReelTile } from '../data/reels'
import { SearchBar } from '../components/SearchBar'

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

  // The website homepage's full culture-reel wall (William: "there is 20
  // tiles per reel and 24 reels... isnt this suppose to have everything the
  // website has"). Every reel, every seat, same order, same rule as the
  // site: real listings claim the front seats of their category's reel,
  // capped at the reel's own seat count; the curated cultural example tiles
  // fill whatever seats real listings haven't claimed yet.
  const reels = React.useMemo(() => {
    const byCat = new Map<string, ShopProduct[]>()
    for (const p of data?.products ?? []) {
      const cat = (p.category ?? 'Home Craft & Décor').toLowerCase()
      const arr = byCat.get(cat) ?? []
      arr.push(p)
      byCat.set(cat, arr)
    }
    return CULTURE_REELS.map((reel) => {
      const real = (byCat.get(reel.title.toLowerCase()) ?? []).slice(0, reel.tiles.length || Infinity)
      const stock = reel.tiles.slice(0, Math.max(0, reel.tiles.length - real.length))
      return { reel, real, stock, comingSoonEmpty: Boolean(reel.comingSoon) && real.length === 0 }
    })
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
            source={require('../../assets/velor-logo-2026.png')}
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

        {/* Site-wide search entry (website header parity) */}
        <SearchBar topMargin={14} />

        {isLoading ? (
          <Text style={s.loading}>Opening the marketplace…</Text>
        ) : (
          reels.map(({ reel, real, stock, comingSoonEmpty }) => (
            <View key={reel.title} style={{ marginTop: 26 }}>
              <View style={s.railHead}>
                <Text style={s.railTitle}>{reel.title}</Text>
                <Pressable onPress={() => nav.navigate('Tabs', { screen: 'Shop', params: { category: reel.title } })}>
                  <Text style={s.railAll}>See all →</Text>
                </Pressable>
              </View>
              {reel.line ? <Text style={s.railLine}>{reel.line}</Text> : null}
              {comingSoonEmpty ? (
                // The site's honesty note (Artisan Pet Goods): no verified
                // photography yet, so no reel — a real note instead of
                // fabricated tiles. LAW #1.
                <View style={s.soonCard}>
                  <Text style={s.soonT}>Coming soon — honestly.</Text>
                  <Text style={s.soonS}>
                    We only show real, verified photography on Velor — and we don't have enough of it for this
                    category yet to fill it honestly. The moment a seller lists here, this becomes a real reel.
                  </Text>
                  <Pressable onPress={() => nav.navigate('Apply', {})}>
                    <Text style={s.soonBtn}>Sell in this category →</Text>
                  </Pressable>
                </View>
              ) : (
                <FlatList
                  horizontal
                  data={[...real.map((p) => ({ kind: 'p' as const, p })), ...stock.map((tile, i) => ({ kind: 't' as const, tile, i }))]}
                  keyExtractor={(item) => (item.kind === 'p' ? item.p.id : `${reel.title}-${item.tile.name}-${item.i}`)}
                  showsHorizontalScrollIndicator={false}
                  initialNumToRender={4}
                  windowSize={3}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingTop: 12 }}
                  renderItem={({ item }) =>
                    item.kind === 'p' ? (
                      <ProductCard p={item.p} t={t} onPress={() => nav.navigate('Pdp', { product: item.p })} />
                    ) : (
                      <CultureTileCard tile={item.tile} t={t} onPress={() => nav.navigate('Seats')} />
                    )
                  }
                />
              )}
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

// Culture tile — the website's curated example seat: real cultural
// photography, the craft's name, its country flag, and the "Your goods
// here" sash so it can never be mistaken for a listing. Tiles without an
// image (Artisan Pet Goods' plain ID-card seats) render the muted card
// background — an honest empty seat, never a broken image. Film seats are
// labelled PREVIEW FILM with no country claim, exactly like the site.
// Tapping any seat opens the founding-seats story (site: links /founding).
function CultureTileCard({ tile, t, onPress }: { tile: ReelTile; t: Palette; onPress: () => void }) {
  const s = styles(t)
  const isFilm = Boolean(tile.video)
  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.cardImgWrap}>
        {tile.img ? (
          <Image source={{ uri: tile.img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: t.surf2 }]} />
        )}
        <View style={s.sash}>
          <Text style={s.sashTx}>{isFilm ? 'Preview film' : 'Your goods here'}</Text>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {tile.code && !isFilm ? (
            <Image source={{ uri: flagUrl(tile.code, 40) }} style={{ width: 15, height: 11, borderRadius: 2 }} />
          ) : null}
          <Text style={s.cardCat} numberOfLines={1}>
            {isFilm ? 'PREVIEW FILM' : tile.code ? countryName(tile.code).toUpperCase() : 'OPEN SEAT'}
          </Text>
        </View>
        <Text style={s.cardTitle} numberOfLines={2}>
          {tile.name}
        </Text>
        <View style={s.cardFoot}>
          <Text style={[s.cardSeller, { color: t.accent }]}>Start selling →</Text>
        </View>
      </View>
    </Pressable>
  )
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
    railLine: { fontFamily: F.body, fontSize: 12, color: t.mut, paddingHorizontal: 16, marginTop: 3 },
    soonCard: {
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 14,
      padding: 16,
    },
    soonT: { fontFamily: F.bodySemi, fontSize: 13.5, color: t.text },
    soonS: { fontFamily: F.body, fontSize: 12, color: t.mut, lineHeight: 17, marginTop: 5 },
    soonBtn: { fontFamily: F.bodySemi, fontSize: 12.5, color: t.accent, marginTop: 10 },
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
