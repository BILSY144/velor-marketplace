import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useQuery } from '@tanstack/react-query'
import { useRoute, useNavigation } from '@react-navigation/native'
import { C, F, flagUrl, pexels } from '../theme'
import { countryName, HINTS, IMAGERY, STORIES, filmsFor } from '../data'
import { fetchProductsByOrigin } from '../api'
import { Kicker, Display, Body, Dim, Serif, Btn, Pill, Empty } from '../ui'
import { useCart } from '../store'

export default function CountryScreen() {
  const insets = useSafeAreaInsets()
  const route = useRoute<any>()
  const nav = useNavigation<any>()
  const cc: string = route.params?.cc ?? 'JP'
  const name = countryName(cc)
  const imgs = IMAGERY[cc] ?? []
  const story = STORIES[cc]
  const crafts = HINTS[cc] ?? []
  const films = filmsFor(cc)
  const add = useCart((s) => s.add)

  const products = useQuery({
    queryKey: ['products', cc],
    queryFn: () => fetchProductsByOrigin(cc),
  })

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Cover — a real, visually-verified photo for this country, or an
          honest gradient when none passed verification. */}
      <View style={s.cover}>
        {imgs[0] ? (
          <Image source={{ uri: pexels(imgs[0].i) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.surf2 }]} />
        )}
        <View style={s.coverShade} />
        <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={() => nav.goBack()}>
          <Body style={{ fontFamily: F.display, fontSize: 13 }}>{'←'}</Body>
        </Pressable>
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image source={{ uri: flagUrl(cc) }} style={{ width: 24, height: 17, borderRadius: 3 }} />
            <Kicker>{name.toUpperCase()} · CHANNEL</Kicker>
          </View>
          <Display style={{ marginTop: 6, fontSize: 32 }}>{name}.</Display>
        </View>
      </View>

      {story ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Body style={{ color: '#d8d7d3', lineHeight: 21 }}>{story}</Body>
        </View>
      ) : null}

      {crafts.length ? (
        <View style={{ paddingTop: 22 }}>
          <Kicker style={{ paddingHorizontal: 20 }}>SIGNATURE CRAFTS</Kicker>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 11 }}>
            {crafts.map((cr) => (
              <Pill key={cr} label={cr} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {films.length ? (
        <View style={{ paddingTop: 24 }}>
          <Kicker style={{ paddingHorizontal: 20 }}>FROM {name.toUpperCase()} — PREVIEW FILMS</Kicker>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 12 }}>
            {films.map((f) => (
              <Pressable key={f.src} style={s.filmCard} onPress={() => nav.navigate('Tabs', { screen: 'Live' })}>
                <Image source={{ uri: f.poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                <View style={{ position: 'absolute', left: 9, bottom: 9, right: 9 }}>
                  <Body style={{ fontFamily: F.bodySemi, fontSize: 11.5 }} numberOfLines={1}>{f.title}</Body>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={{ paddingTop: 26 }}>
        <Kicker style={{ paddingHorizontal: 20 }}>LIVE LISTINGS — REAL SELLERS ONLY</Kicker>
        {products.isLoading ? (
          <Dim style={{ paddingHorizontal: 20, paddingTop: 12 }}>Checking the live catalogue…</Dim>
        ) : products.isError ? (
          <Dim style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            Could not reach the catalogue. Pull to refresh, or try again shortly.
          </Dim>
        ) : products.data && products.data.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 12 }}>
            {products.data.map((p) => (
              <View key={p.id} style={s.prodCard}>
                {p.images?.[0] ? (
                  <Image source={{ uri: p.images[0] }} style={s.prodImg} contentFit="cover" />
                ) : (
                  <View style={[s.prodImg, { backgroundColor: C.surf2 }]} />
                )}
                <Body style={{ fontFamily: F.bodySemi, fontSize: 12, marginTop: 8 }} numberOfLines={1}>
                  {p.name ?? p.title}
                </Body>
                <Dim style={{ fontSize: 11 }}>
                  {'£'}{(p.discountedPrice ?? p.price).toFixed(2)}
                  {p.sellerName ? ` · ${p.sellerName}` : ''}
                </Dim>
                <Pressable style={s.addBtn} onPress={() => add(p)}>
                  <Body style={{ fontFamily: F.display, fontSize: 10, color: '#0b0b0e' }}>ADD TO BASKET</Body>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View>
            <Empty
              title={`Nobody sells from ${name} yet.`}
              sub="Velor never fakes a catalogue. The first verified seller opens this channel — and keeps the founding seat permanently."
            />
            <View style={{ paddingHorizontal: 20 }}>
              <Btn
                label="Open this channel — apply to sell"
                onPress={() => Linking.openURL(`https://velorcommerce.store/apply?country=${cc}`)}
              />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  cover: { height: 300, backgroundColor: C.surf },
  coverShade: {
    position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  back: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filmCard: {
    width: 128,
    aspectRatio: 9 / 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.surf2,
  },
  prodCard: { width: 150 },
  prodImg: { width: 150, height: 150, borderRadius: 16 },
  addBtn: {
    marginTop: 8,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
})
