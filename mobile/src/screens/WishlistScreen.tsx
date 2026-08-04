import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { F, useTheme, Palette } from '../theme'
import { fmt, useI18nTick } from '../i18n'
import { useSession, useCart } from '../store'
import { fetchWishlist, removeFromWishlist } from '../api'
import { Chrome } from '../components/Chrome'

// WISHLIST — website /account/wishlist parity: every saved product, with
// Add to basket and Remove per item, honest empty state, sign-in gate.
export default function WishlistScreen() {
  useI18nTick()
  const t = useTheme()
  const s = styles(t)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const user = useSession((st) => st.user)
  const add = useCart((st) => st.add)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['wishlistPage'],
    queryFn: fetchWishlist,
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchOnMount: 'always',
  })
  const items = data ?? []

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={t.accent} colors={[t.accent]} />}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kick}>SAVED FOR LATER</Text>
          <Text style={s.h1}>Wishlist.</Text>

          {!user ? (
            <Pressable style={s.signCard} onPress={() => nav.navigate('SignIn')}>
              <Ionicons name="heart-outline" size={20} color={t.accent} />
              <View style={{ flex: 1 }}>
                <Text style={s.signT}>Sign in to see your wishlist</Text>
                <Text style={s.signS}>Hearts you tap on any listing land here, on every device.</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={t.accent} />
            </Pressable>
          ) : isLoading ? (
            <Text style={s.dim}>Fetching your saved pieces…</Text>
          ) : items.length === 0 ? (
            <View style={s.card}>
              <Ionicons name="heart-outline" size={20} color={t.mut} />
              <Text style={s.emptyT}>Nothing saved yet</Text>
              <Text style={s.emptyS}>Tap the heart on any listing and it lands here.</Text>
              <Pressable style={s.browseBtn} onPress={() => nav.navigate('Tabs', { screen: 'Shop' })}>
                <Text style={s.browseTx}>Browse the marketplace</Text>
              </Pressable>
            </View>
          ) : (
            items.map((w) => {
              const p = w.product
              const price = p.discountedPrice ?? p.price
              return (
                <View key={w.id} style={s.row}>
                  <Pressable onPress={() => nav.navigate('Pdp', { product: p })}>
                    {p.images?.[0] ? (
                      <Image source={{ uri: p.images[0] }} style={s.thumb} contentFit="cover" />
                    ) : (
                      <View style={[s.thumb, { backgroundColor: t.surf2 }]} />
                    )}
                  </Pressable>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.name} numberOfLines={1}>{p.name ?? p.title}</Text>
                    <Text style={s.meta}>
                      {fmt(price)}
                      {p.sellerName ? ` · ${p.sellerName}` : ''}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 9 }}>
                      <Pressable style={s.addBtn} onPress={() => add(p)}>
                        <Text style={s.addTx}>ADD TO BASKET</Text>
                      </Pressable>
                      <Pressable
                        style={s.rmBtn}
                        onPress={async () => {
                          await removeFromWishlist(w.productId)
                          refetch()
                        }}
                      >
                        <Text style={s.rmTx}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
      <Chrome back="Back" onBack={() => nav.goBack()} />
    </View>
  )
}

const styles = (t: Palette) =>
  StyleSheet.create({
    kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: t.mut },
    h1: { fontFamily: F.serifLight, fontSize: 32, color: t.text, marginTop: 8 },
    dim: { fontFamily: F.body, fontSize: 13, color: t.mut, paddingVertical: 24 },
    signCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 20,
      backgroundColor: t.accentSoft,
      borderWidth: 1,
      borderColor: t.accent,
      borderRadius: 14,
      padding: 13,
    },
    signT: { fontFamily: F.bodySemi, fontSize: 13.5, color: t.text },
    signS: { fontFamily: F.body, fontSize: 11, color: t.mut, marginTop: 2 },
    card: {
      marginTop: 20,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 18,
      padding: 18,
      alignItems: 'flex-start',
      gap: 4,
    },
    emptyT: { fontFamily: F.bodySemi, fontSize: 13.5, color: t.text, marginTop: 6 },
    emptyS: { fontFamily: F.body, fontSize: 12, color: t.mut },
    browseBtn: {
      marginTop: 12,
      backgroundColor: t.accent,
      borderRadius: 11,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    browseTx: { fontFamily: F.bodySemi, fontSize: 12, color: '#fff' },
    row: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 16,
      padding: 12,
    },
    thumb: { width: 84, height: 84, borderRadius: 12 },
    name: { fontFamily: F.bodySemi, fontSize: 13, color: t.text },
    meta: { fontFamily: F.body, fontSize: 11.5, color: t.mut, marginTop: 3 },
    addBtn: { backgroundColor: t.accent, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 12 },
    addTx: { fontFamily: F.display, fontSize: 9.5, letterSpacing: 0.6, color: '#fff' },
    rmBtn: {
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 9,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    rmTx: { fontFamily: F.body, fontSize: 11, color: t.mut },
  })
