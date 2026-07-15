import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useRoute, useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, pexels } from '../theme'
import { countryName, HINTS, IMAGERY, STORIES, filmsFor } from '../data'
import { fetchProductsByOrigin } from '../api'
import { Chrome } from '../components/Chrome'
import { Kicker, Body, Dim, Btn, Empty } from '../ui'
import { useCart } from '../store'

// Country dive — built from plate 02 + spec/country.txt:
// kenburns cover fading into bg, YOU HAVE ARRIVED IN kicker, Fraunces 52
// name, "Channel seat open" meta, THE ORIGIN story in Fraunces 19, the
// SIGNATURE CRAFTS reel (IMAGERY tiles, Fraunces 14 titles + orange arrow),
// preview films, then real listings / founding CTA (honest zero state).
export default function CountryScreen() {
  const route = useRoute<any>()
  const nav = useNavigation<any>()
  const cc: string = route.params?.cc ?? 'JP'
  const name = countryName(cc)
  const imgs = IMAGERY[cc] ?? []
  const story = STORIES[cc]
  const nCats = (HINTS[cc] ?? []).length
  const films = filmsFor(cc)
  const add = useCart((s) => s.add)

  const products = useQuery({
    queryKey: ['products', cc],
    queryFn: () => fetchProductsByOrigin(cc),
  })
  const trading = (products.data?.length ?? 0) > 0

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={s.cover}>
          {imgs[0] ? (
            <Image source={{ uri: pexels(imgs[0].i) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          ) : null}
          <LinearGradient
            colors={['rgba(8,8,11,0.25)', 'rgba(8,8,11,0.55)', '#08080b']}
            locations={[0, 0.62, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 26 }}>
            <Text style={s.arrived}>YOU HAVE ARRIVED IN</Text>
            <Text style={s.name}>{name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 }}>
              <View style={[s.dot, trading && { backgroundColor: C.green }]} />
              <Text style={[s.meta, trading && { color: C.green }]}>
                {trading ? 'Channel open — live listings below' : 'Channel seat open'}
              </Text>
            </View>
          </View>
        </View>

        {story ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Kicker style={{ color: C.mut }}>THE ORIGIN</Kicker>
            <Text style={s.story}>{story}</Text>
          </View>
        ) : null}

        {imgs.length ? (
          <View style={{ paddingTop: 26 }}>
            <Kicker style={{ paddingHorizontal: 20, color: C.mut }}>SIGNATURE CRAFTS</Kicker>
            <Dim style={{ paddingHorizontal: 20, marginTop: 5, fontSize: 11.5 }}>
              {nCats} categories {name} is known for — scroll the reel.
            </Dim>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 11, paddingTop: 13 }}>
              {imgs.map((im) => (
                <Pressable key={im.n} style={s.craftTile} onPress={() => nav.navigate('Craft', { cc, craft: im.n, img: im.i })}>
                  <Image source={{ uri: pexels(im.i, 500) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} locations={[0.55, 1]} style={StyleSheet.absoluteFill} />
                  <View style={s.craftFoot}>
                    <Text style={s.craftName} numberOfLines={2}>{im.n}</Text>
                    <View style={s.craftGo}>
                      <Ionicons name="arrow-forward" size={15} color="#160a00" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {films.length ? (
          <View style={{ paddingTop: 28 }}>
            <Kicker style={{ paddingHorizontal: 20, color: C.mut }}>SHOPPING {name.toUpperCase()}</Kicker>
            <Dim style={{ paddingHorizontal: 20, marginTop: 5, fontSize: 11.5 }}>
              Preview films — real broadcasts begin as {name}'s seller goes on air.
            </Dim>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 11, paddingTop: 13 }}>
              {films.map((f) => (
                <Pressable key={f.src} style={s.filmCard} onPress={() => nav.navigate('Tabs', { screen: 'Live' })}>
                  <Image source={{ uri: f.poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  <View style={s.pv}><Text style={s.pvTx}>Preview</Text></View>
                  <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10 }}>
                    <Text style={s.filmTitle} numberOfLines={2}>{f.title}</Text>
                    <Text style={s.filmSub} numberOfLines={1}>{f.sub}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ paddingTop: 28 }}>
          <Kicker style={{ paddingHorizontal: 20, color: C.mut }}>
            {trading ? `LISTINGS · ${products.data!.length} · LIVE` : 'LIVE LISTINGS'}
          </Kicker>
          {products.isLoading ? (
            <Dim style={{ paddingHorizontal: 20, paddingTop: 12 }}>Checking the live catalogue…</Dim>
          ) : products.isError ? (
            <Dim style={{ paddingHorizontal: 20, paddingTop: 12 }}>
              Could not reach the catalogue — try again shortly.
            </Dim>
          ) : trading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 12 }}>
              {products.data!.map((p) => (
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
                <Btn label="Open this channel — apply to sell" onPress={() => nav.navigate('Apply', { cc })} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <Chrome back="Atlas" onBack={() => nav.goBack()} />
    </View>
  )
}

const s = StyleSheet.create({
  cover: { height: 430, backgroundColor: C.surf },
  arrived: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.accent },
  name: { fontFamily: F.serifLight, fontSize: 52, lineHeight: 58, color: C.text, marginTop: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  meta: { fontFamily: F.displayMed, fontSize: 12, color: C.accent },
  story: { fontFamily: F.serifLight, fontSize: 19, lineHeight: 28, color: '#d9d8d4', marginTop: 12 },
  craftTile: {
    width: 150,
    aspectRatio: 3 / 4,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: C.surf2,
  },
  craftFoot: {
    position: 'absolute',
    left: 12,
    right: 10,
    bottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  craftName: { flex: 1, fontFamily: F.serif, fontSize: 14, lineHeight: 17, color: C.text },
  craftGo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filmCard: {
    width: 138,
    aspectRatio: 9 / 14,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: C.surf2,
  },
  pv: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pvTx: { fontFamily: F.displayMed, fontSize: 7, letterSpacing: 0.6, color: '#e4e4ea' },
  filmTitle: { fontFamily: F.serifItalic, fontSize: 14, lineHeight: 17, color: C.accent },
  filmSub: { fontFamily: F.body, fontSize: 9.5, color: '#f0efec', marginTop: 2 },
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
