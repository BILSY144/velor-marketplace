import React from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Text } from '../ui/T'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useRoute, useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, pexels } from '../theme'
import { fmt, onI18n, useI18nTick } from '../i18n'
import { countryName, IMAGERY } from '../data'
import { fetchProductsByOrigin } from '../api'
import { Chrome } from '../components/Chrome'
import { Kicker, Body, Dim, Btn, Empty } from '../ui'

// Craft page — plate 05 + spec/craft.txt: tall craft cover fading to bg,
// "COUNTRY × SIGNATURE CRAFT" kicker, Fraunces 36 title, LISTINGS section
// (REAL listings only — the mockup's SAMPLE rows are replaced by the honest
// zero state until real sellers list), then MORE FROM {COUNTRY} craft rail.
export default function CraftScreen() {
  useI18nTick()
  const route = useRoute<any>()
  const nav = useNavigation<any>()
  const cc: string = route.params?.cc ?? 'JP'
  const craft: string = route.params?.craft ?? ''
  const img: number | undefined = route.params?.img
  const name = countryName(cc)
  const others = (IMAGERY[cc] ?? []).filter((i) => i.n !== craft)

  const products = useQuery({
    queryKey: ['products', cc],
    queryFn: () => fetchProductsByOrigin(cc),
  })
  const kw = craft.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3)
  const matches = (products.data ?? []).filter((p) => {
    const t = `${p.name ?? p.title ?? ''}`.toLowerCase()
    return kw.some((w) => t.includes(w))
  })
  const shown = matches.length ? matches : []

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={s.cover}>
          {img ? (
            <Image source={{ uri: pexels(img) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          ) : null}
          <LinearGradient
            colors={['rgba(8,8,11,0.2)', 'rgba(8,8,11,0.6)', '#08080b']}
            locations={[0, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 24 }}>
            <Text style={s.kick}>{name.toUpperCase()} × SIGNATURE CRAFT</Text>
            <Text style={s.title}>{craft}</Text>
          </View>
        </View>

        <View style={{ paddingTop: 22 }}>
          <Kicker style={{ paddingHorizontal: 20, color: C.mut }}>
            {products.isLoading ? 'LISTINGS' : `LISTINGS · ${shown.length} · LIVE`}
          </Kicker>
          {products.isLoading ? (
            <Dim style={{ paddingHorizontal: 20, paddingTop: 12 }}>Checking the live catalogue…</Dim>
          ) : shown.length ? (
            shown.map((p) => (
              <Pressable
                key={p.id}
                style={s.listRow}
                onPress={() => nav.navigate('Pdp', { product: p, cc })}
              >
                {p.images?.[0] ? (
                  <Image source={{ uri: p.images[0] }} style={s.listImg} contentFit="cover" />
                ) : (
                  <View style={[s.listImg, { backgroundColor: C.surf2 }]} />
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Body style={{ fontFamily: F.bodySemi, fontSize: 13.5 }} numberOfLines={1}>
                    {p.name ?? p.title}
                  </Body>
                  <Dim style={{ fontSize: 11.5, marginTop: 2 }} numberOfLines={1}>
                    {p.sellerName ?? 'Verified seller'}
                  </Dim>
                  <Body style={{ fontFamily: F.bodySemi, fontSize: 14, marginTop: 4 }}>
                    {fmt(p.discountedPrice ?? p.price)}
                  </Body>
                </View>
                <Ionicons name="arrow-forward" size={16} color={C.mut} />
              </Pressable>
            ))
          ) : (
            <View>
              <Empty
                title={`No ${craft.toLowerCase()} from ${name} yet.`}
                sub={`The seller who opens ${name}'s channel takes this craft to the world first. Velor never fakes a listing.`}
              />
              <View style={{ paddingHorizontal: 20 }}>
                <Btn label="Be that seller — apply now" onPress={() => nav.navigate('Apply', { cc })} />
              </View>
            </View>
          )}
        </View>

        {others.length ? (
          <View style={{ paddingTop: 30 }}>
            <Kicker style={{ paddingHorizontal: 20, color: C.mut }}>MORE FROM {name.toUpperCase()}</Kicker>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 12 }}>
              {others.map((im) => (
                <Pressable
                  key={im.n}
                  style={s.moreTile}
                  onPress={() => nav.navigate('Craft', { cc, craft: im.n, img: im.i })}
                >
                  <Image source={{ uri: pexels(im.i, 500) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} locations={[0.55, 1]} style={StyleSheet.absoluteFill} />
                  <Text style={s.moreName} numberOfLines={2}>{im.n}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
      <Chrome back={name} onBack={() => nav.goBack()} />
    </View>
  )
}

const s = StyleSheet.create({
  cover: { height: 400, backgroundColor: C.surf },
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.accent },
  title: { fontFamily: F.serifLight, fontSize: 36, lineHeight: 42, color: C.text, marginTop: 8 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 12,
  },
  listImg: { width: 74, height: 74, borderRadius: 14 },
  moreTile: {
    width: 118,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.surf2,
  },
  moreName: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    fontFamily: F.displayMed,
    fontSize: 13,
    lineHeight: 16,
    color: C.text,
  },
})
