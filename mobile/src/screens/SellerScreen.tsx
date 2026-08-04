import React from 'react'
import { View, FlatList, Pressable, StyleSheet } from 'react-native'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { F, flagUrl, useTheme, Palette } from '../theme'
import { fmt, useI18nTick } from '../i18n'
import { countryName } from '../data'
import { useSession, useCart } from '../store'
import {
  fetchShop,
  fetchFollowedSellers,
  followSeller,
  unfollowSeller,
  ShopProduct,
} from '../api'
import { Chrome } from '../components/Chrome'

// SELLER STOREFRONT — website /seller/[sellerId] parity: the maker's store
// as buyers see it. Store name, origin flag, live rating aggregate, follow
// button (auto-hidden while the server keeps social dormant, exactly like
// the site), and every live listing in a 2-column grid.
export default function SellerScreen() {
  useI18nTick()
  const t = useTheme()
  const s = styles(t)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const sellerId: string = route.params?.sellerId ?? ''
  const seedName: string | undefined = route.params?.sellerName
  const user = useSession((st) => st.user)
  const add = useCart((st) => st.add)

  const productsQ = useQuery({
    queryKey: ['sellerProducts', sellerId],
    queryFn: () => fetchShop({ sellerId, limit: 60 }),
    enabled: Boolean(sellerId),
    staleTime: 30_000,
  })
  const products = productsQ.data?.products ?? []
  const first = products[0]
  const storeName = seedName ?? first?.sellerName ?? 'Verified maker'
  const cc = first?.originCountry
  const rated = products.filter((p) => (p.reviewCount ?? 0) > 0 && (p.avgRating ?? p.rating))
  const avg =
    rated.length > 0
      ? rated.reduce((sum, p) => sum + (p.avgRating ?? p.rating ?? 0), 0) / rated.length
      : null
  const reviewTotal = products.reduce((n, p) => n + (p.reviewCount ?? 0), 0)

  const followsQ = useQuery({
    queryKey: ['follows'],
    queryFn: fetchFollowedSellers,
    enabled: Boolean(user),
    staleTime: 60_000,
  })
  const socialOn = followsQ.data?.enabled ?? false
  const following = followsQ.data?.sellerIds.includes(sellerId) ?? false
  const [followBusy, setFollowBusy] = React.useState(false)

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(p) => p.id}
        columnWrapperStyle={{ paddingHorizontal: 20, gap: 10 }}
        contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}
        renderItem={({ item: p }) => (
          <Pressable style={s.gridCard} onPress={() => nav.navigate('Pdp', { product: p })}>
            {p.images?.[0] ? (
              <Image source={{ uri: p.images[0] }} style={s.gridImg} contentFit="cover" transition={150} />
            ) : (
              <View style={[s.gridImg, { backgroundColor: t.surf2 }]} />
            )}
            <Text style={s.gName} numberOfLines={1}>
              {p.name ?? p.title}
            </Text>
            <Text style={s.gPrice}>{fmt(p.discountedPrice ?? p.price)}</Text>
            <Pressable style={s.addBtn} onPress={() => add(p)}>
              <Text style={s.addTx}>ADD TO BASKET</Text>
            </Pressable>
          </Pressable>
        )}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <Text style={s.kick}>MAKER STOREFRONT</Text>
            <Text style={s.h1}>{storeName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10, flexWrap: 'wrap' }}>
              {cc ? (
                <View style={s.metaChip}>
                  <Image source={{ uri: flagUrl(cc, 40) }} style={{ width: 18, height: 13, borderRadius: 2 }} />
                  <Text style={s.metaTx}>{countryName(cc)}</Text>
                </View>
              ) : null}
              {avg ? (
                <View style={s.metaChip}>
                  <Ionicons name="star" size={11} color={t.accent} />
                  <Text style={s.metaTx}>
                    {avg.toFixed(1)} · {reviewTotal} {reviewTotal === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
              ) : null}
              <View style={s.metaChip}>
                <Ionicons name="cube-outline" size={11} color={t.mut} />
                <Text style={s.metaTx}>
                  {products.length} {products.length === 1 ? 'listing' : 'listings'}
                </Text>
              </View>
            </View>

            {user && socialOn ? (
              <Pressable
                style={[s.followBtn, following && s.followingBtn, followBusy && { opacity: 0.6 }]}
                disabled={followBusy}
                onPress={async () => {
                  setFollowBusy(true)
                  if (following) await unfollowSeller(sellerId)
                  else await followSeller(sellerId)
                  await followsQ.refetch()
                  setFollowBusy(false)
                }}
              >
                <Ionicons name={following ? 'checkmark' : 'add'} size={14} color={following ? t.accent : '#fff'} />
                <Text style={[s.followTx, following && { color: t.accent }]}>
                  {following ? 'Following' : 'Follow this maker'}
                </Text>
              </Pressable>
            ) : null}

            {user ? (
              <Pressable
                style={s.msgBtn}
                onPress={() => nav.navigate('Messages', { sellerId, sellerName: storeName })}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={t.accent} />
                <Text style={s.msgTx}>Message this maker</Text>
              </Pressable>
            ) : null}

            <Text style={s.listKick}>
              {productsQ.isLoading ? 'OPENING THE STORE…' : `LIVE LISTINGS · ${products.length}`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          productsQ.isLoading ? null : (
            <View style={s.emptyCard}>
              <Text style={s.emptyT}>Nothing listed right now</Text>
              <Text style={s.emptyS}>This maker's next pieces will appear here the moment they go live.</Text>
            </View>
          )
        }
      />
      <Chrome back="Back" onBack={() => nav.goBack()} />
    </View>
  )
}

const styles = (t: Palette) =>
  StyleSheet.create({
    kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: t.mut },
    h1: { fontFamily: F.serifLight, fontSize: 30, color: t.text, marginTop: 8 },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 9,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    metaTx: { fontFamily: F.body, fontSize: 11, color: t.text },
    followBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 14,
      backgroundColor: t.accent,
      borderRadius: 11,
      paddingVertical: 10,
    },
    followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.accent },
    followTx: { fontFamily: F.bodySemi, fontSize: 12.5, color: '#fff' },
    msgBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: 10,
      borderWidth: 1,
      borderColor: t.accent,
      borderRadius: 11,
      paddingVertical: 10,
    },
    msgTx: { fontFamily: F.bodySemi, fontSize: 12.5, color: t.accent },
    listKick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2, color: t.mut, marginTop: 24 },
    gridCard: { flex: 1, maxWidth: '48.6%', marginTop: 14 },
    gridImg: { width: '100%', aspectRatio: 1, borderRadius: 16 },
    gName: { fontFamily: F.bodySemi, fontSize: 12, color: t.text, marginTop: 8 },
    gPrice: { fontFamily: F.body, fontSize: 11.5, color: t.mut, marginTop: 2 },
    addBtn: {
      marginTop: 8,
      backgroundColor: t.accent,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: 'center',
    },
    addTx: { fontFamily: F.display, fontSize: 9.5, letterSpacing: 0.6, color: '#fff' },
    emptyCard: {
      marginHorizontal: 20,
      marginTop: 16,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 16,
      padding: 18,
    },
    emptyT: { fontFamily: F.bodySemi, fontSize: 13, color: t.text },
    emptyS: { fontFamily: F.body, fontSize: 11.5, color: t.mut, marginTop: 4 },
  })
