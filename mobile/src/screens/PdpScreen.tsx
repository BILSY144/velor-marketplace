import React, { useRef, useState } from 'react'
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRoute, useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, flagUrl, pexels } from '../theme'
import { fmt, onI18n } from '../i18n'
import { countryName, IMAGERY } from '../data'
import type { ShopProduct } from '../api'
import { useCart, useFavs } from '../store'
import { Chrome } from '../components/Chrome'
import { Kicker, Body, Dim, Btn } from '../ui'

// Product page — plate 04 + spec/pdp.txt, top to bottom: gallery with dots,
// "{COUNTRY} × {CRAFT}" kicker, Fraunces 31 title, Fraunces 30 price with the
// green delivery row, maker card, THE MAKING, escrow block, pills, buyer
// reviews, MORE FROM {COUNTRY} craft rail, sticky qty + Add bar.
// Honesty divergences from the plate (standing rule): no SAMPLE reviews —
// the real rating renders only when verified buyers have left one; the
// delivery row promises a live checkout quote, not an invented estimate;
// FOUNDING badge only when the seller really holds the founding seat (no
// such field in the API yet, so it is not shown).
export default function PdpScreen() {
  const route = useRoute<any>()
  const nav = useNavigation<any>()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const product: ShopProduct = route.params?.product
  const cc: string = product?.originCountry ?? route.params?.cc ?? ''
  const name = cc ? countryName(cc) : ''
  const crafts = IMAGERY[cc] ?? []

  const add = useCart((s) => s.add)
  const favIds = useFavs((s) => s.ids)
  const toggleFav = useFavs((s) => s.toggle)

  const [qty, setQty] = useState(1)
  const [slide, setSlide] = useState(0)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!product) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Dim>This listing is no longer available.</Dim>
      </View>
    )
  }

  const title = product.name ?? product.title ?? 'Listing'
  const price = product.discountedPrice ?? product.price
  const images = product.images?.length ? product.images : []
  const isFav = favIds.includes(product.id)
  const craftPill = product.specialities?.[0] ?? product.category ?? ''
  const kicker = [name.toUpperCase(), craftPill ? craftPill.toUpperCase() : null]
    .filter(Boolean)
    .join(' × ')

  const onSlide = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width)
    if (i !== slide) setSlide(i)
  }

  const onAdd = () => {
    add(product, qty)
    setAdded(true)
    if (addedTimer.current) clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setAdded(false), 1600)
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 118 }}>
        {/* Gallery — swipeable, dots below, fading into the page like the plate */}
        <View style={{ height: 470, backgroundColor: C.surf }}>
          {images.length ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onSlide}
            >
              {images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={{ width, height: 470 }} contentFit="cover" transition={250} />
              ))}
            </ScrollView>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: C.surf2 }]} />
          )}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(8,8,11,0.25)', 'rgba(8,8,11,0)', 'rgba(8,8,11,0.55)', '#08080b']}
            locations={[0, 0.3, 0.82, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Heart — spec's gbtn fav() */}
          <Pressable
            style={[s.favBtn, { top: insets.top + 58 }]}
            onPress={() => toggleFav(product.id)}
          >
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? C.accent : C.text} />
          </Pressable>
          {images.length > 1 ? (
            <View style={s.dots}>
              {images.map((_, i) => (
                <View key={i} style={[s.dot, i === slide && s.dotOn]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          {kicker ? <Text style={s.kick}>{kicker}</Text> : null}
          <Text style={s.title}>{title}</Text>

          {/* Price + delivery row */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <Text style={s.price}>{fmt(price)}</Text>
            <Text style={s.deliver}>
              Delivery quoted live at checkout · ships from {name || 'origin'}
            </Text>
          </View>

          {/* Maker card */}
          <View style={s.maker}>
            {cc ? <Image source={{ uri: flagUrl(cc) }} style={s.makerFlag} /> : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.makerName} numberOfLines={1}>
                {product.sellerName ?? 'Verified seller'}
              </Text>
              <Text style={s.makerLoc} numberOfLines={1}>
                {name ? `${name} · opened this channel` : 'Verified on Velor'}
              </Text>
            </View>
          </View>

          {/* THE MAKING */}
          {product.description ? (
            <View style={{ marginTop: 26 }}>
              <Text style={s.dimKick}>THE MAKING</Text>
              <Text style={s.making}>{product.description}</Text>
            </View>
          ) : null}

          {/* Escrow — Your money is protected */}
          <View style={s.escrow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={16} color={C.green} />
              <Text style={s.escrowT}>Your money is protected</Text>
            </View>
            <Text style={s.escrowP}>
              You pay Velor, not the seller. Held in escrow, released only after your delivery is
              confirmed. Anything wrong — open a dispute and the funds freeze immediately.
            </Text>
          </View>

          {/* Speciality pills */}
          {product.specialities?.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
              {product.specialities.map((sp) => (
                <View key={sp} style={s.pill}>
                  <Text style={s.pillTx}>{sp}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Buyer reviews — real ones only, plate's own honesty line kept */}
          <View style={{ marginTop: 28 }}>
            <Text style={s.dimKick}>BUYER REVIEWS</Text>
            {product.reviewCount && product.avgRating ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Ionicons
                      key={i}
                      name={i <= Math.round(product.avgRating!) ? 'star' : 'star-outline'}
                      size={13}
                      color={C.accent}
                    />
                  ))}
                </View>
                <Body style={{ fontSize: 12.5 }}>
                  {product.avgRating.toFixed(1)} · {product.reviewCount} verified{' '}
                  {product.reviewCount === 1 ? 'review' : 'reviews'}
                </Body>
              </View>
            ) : (
              <Text style={s.revEmpty}>
                Real reviews appear here once verified buyers receive real orders — nothing on
                Velor carries a rating it has not earned.
              </Text>
            )}
          </View>
        </View>

        {/* MORE FROM {COUNTRY} — craft rail, same tiles as the country dive */}
        {crafts.length ? (
          <View style={{ paddingTop: 30 }}>
            <Kicker style={{ paddingHorizontal: 20, color: C.mut }}>
              MORE FROM {name.toUpperCase()}
            </Kicker>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 12 }}
            >
              {crafts.map((im) => (
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

      {/* Sticky bar — qty stepper + Add · £ */}
      <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={s.stepper}>
          <Pressable style={s.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
            <Text style={s.stepTx}>−</Text>
          </Pressable>
          <Text style={s.stepN}>{qty}</Text>
          <Pressable style={s.stepBtn} onPress={() => setQty((q) => Math.min(99, q + 1))}>
            <Text style={s.stepTx}>+</Text>
          </Pressable>
        </View>
        <Btn
          label={added ? 'Added to basket ✓' : `Add · £${(price * qty).toFixed(2)}`}
          onPress={onAdd}
          style={{ flex: 1 }}
        />
      </View>

      <Chrome back={name || 'Back'} onBack={() => nav.goBack()} />
    </View>
  )
}

const s = StyleSheet.create({
  favBtn: {
    position: 'absolute',
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,20,26,0.72)',
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { backgroundColor: '#fff', width: 16 },
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.accent },
  title: { fontFamily: F.serifLight, fontSize: 31, lineHeight: 37, color: C.text, marginTop: 8 },
  price: { fontFamily: F.serifLight, fontSize: 30, color: C.text },
  deliver: { fontFamily: F.body, fontSize: 12, color: C.green, flexShrink: 1 },
  maker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 14,
  },
  makerFlag: { width: 44, height: 32, borderRadius: 8 },
  makerName: { fontFamily: F.serif, fontSize: 15, color: C.text },
  makerLoc: { fontFamily: F.body, fontSize: 11, color: C.mut, marginTop: 2 },
  dimKick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  making: { fontFamily: F.serifLight, fontSize: 16, lineHeight: 24, color: '#d4d3cf', marginTop: 10 },
  escrow: {
    marginTop: 24,
    backgroundColor: 'rgba(61,220,132,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(61,220,132,0.22)',
    borderRadius: 18,
    padding: 14,
  },
  escrowT: { fontFamily: F.displayMed, fontSize: 13.5, color: C.text },
  escrowP: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: C.mut, marginTop: 8 },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pillTx: { fontFamily: F.displayMed, fontSize: 12, color: C.text },
  revEmpty: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: C.dim, marginTop: 10 },
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
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(10,10,13,0.97)',
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingHorizontal: 6,
    height: 48,
  },
  stepBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepTx: { fontFamily: F.body, fontSize: 18, color: C.text },
  stepN: { fontFamily: F.display, fontSize: 16, color: C.text, minWidth: 18, textAlign: 'center' },
})
