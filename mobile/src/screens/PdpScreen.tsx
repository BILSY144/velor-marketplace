import React, { useEffect, useRef, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { Text } from '../ui/T'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRoute, useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { F, flagUrl, pexels, useTheme, Palette } from '../theme'
import { fmt, onI18n, useI18nTick } from '../i18n'
import { countryName, COUNTRIES, IMAGERY } from '../data'
import { useQuery } from '@tanstack/react-query'
import type { ShopProduct, ProductDetail, Variant } from '../api'
import { fetchProductDetail, fetchQuestions, addToWishlist, removeFromWishlist, fetchWishlist, writeReview, markReviewHelpful, fetchDeliveryEstimate } from '../api'
import { TextInput } from '../ui/TI'
import { useCart, useFavs, useSession } from '../store'
import { Chrome } from '../components/Chrome'

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
  useI18nTick()
  const t = useTheme()
  const s = styles(t)
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
  const user = useSession((st) => st.user)

  // WEBSITE PARITY (2026-08-04): the route hands over the list-card product;
  // the FULL detail (priced variants, real reviews, maker story) loads from
  // the same /api/shop/products/[id] the website PDP uses. Variants price
  // their own Add — the exact class of bug the site fixed on 2026-08-01.
  const detailQ = useQuery({
    queryKey: ['pdp', product?.id],
    queryFn: () => fetchProductDetail(product.id),
    enabled: Boolean(product?.id),
    staleTime: 30_000,
  })
  const detail: ProductDetail | undefined = detailQ.data
  const variants: Variant[] = detail?.variants ?? []
  const [variantId, setVariantId] = useState<string | null>(null)
  useEffect(() => {
    if (variants.length && variantId === null) {
      const first = variants.find((v) => v.stock > 0) ?? variants[0]
      setVariantId(first.id)
    }
  }, [variants, variantId])
  const selVariant = variants.find((v) => v.id === variantId) ?? null

  const questionsQ = useQuery({
    queryKey: ['pdp-questions', product?.id],
    queryFn: () => fetchQuestions(product.id),
    enabled: Boolean(product?.id),
    staleTime: 60_000,
  })

  // Server wishlist for signed-in buyers (same /api/wishlist as the site);
  // the local heart stays as the signed-out fallback.
  const [serverFav, setServerFav] = useState<boolean | null>(null)
  useEffect(() => {
    if (!user || !product?.id) return
    fetchWishlist().then((items) => setServerFav(items.some((w) => w.productId === product.id))).catch(() => {})
  }, [user, product?.id])
  const heartOn = user ? Boolean(serverFav) : favIds.includes(product?.id ?? '')
  const onHeart = () => {
    if (!user) {
      toggleFav(product.id)
      return
    }
    const next = !serverFav
    setServerFav(next)
    ;(next ? addToWishlist(product.id) : removeFromWishlist(product.id)).catch(() => setServerFav(!next))
  }

  const [askText, setAskText] = useState('')
  const [askState, setAskState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle')
  const ask = async () => {
    if (!askText.trim() || askState === 'busy') return
    setAskState('busy')
    try {
      const res = await fetch('https://velorcommerce.store/api/questions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId: product.id, question: askText.trim() }),
      })
      setAskState(res.ok ? 'sent' : 'error')
      if (res.ok) setAskText('')
    } catch {
      setAskState('error')
    }
  }

  const [qty, setQty] = useState(1)
  const [slide, setSlide] = useState(0)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!product) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: F.body, fontSize: 13, color: t.mut }}>This listing is no longer available.</Text>
      </View>
    )
  }

  const title = product.name ?? product.title ?? 'Listing'
  const price = selVariant?.price ?? detail?.discountedPrice ?? detail?.price ?? product.discountedPrice ?? product.price
  const baseImages = (detail?.images?.length ? detail.images : product.images) ?? []
  const variantImages = selVariant?.images?.length ? selVariant.images : selVariant?.image ? [selVariant.image] : []
  const images = [...variantImages, ...baseImages.filter((u) => !variantImages.includes(u))]
  const craftPill = product.specialities?.[0] ?? product.category ?? ''
  const kicker = [name.toUpperCase(), craftPill ? craftPill.toUpperCase() : null]
    .filter(Boolean)
    .join(' × ')

  const onSlide = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width)
    if (i !== slide) setSlide(i)
  }

  const onAdd = () => {
    add(product, qty, selVariant ? { id: selVariant.id, name: selVariant.name, price: selVariant.price } : null)
    setAdded(true)
    if (addedTimer.current) clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setAdded(false), 1600)
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 118 }}>
        {/* Gallery — swipeable, dots below, fading into the page like the plate */}
        <View style={{ height: 470, backgroundColor: t.surf2 }}>
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
            <View style={[StyleSheet.absoluteFill, { backgroundColor: t.surf2 }]} />
          )}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(8,8,11,0.22)', 'rgba(8,8,11,0)', 'rgba(8,8,11,0)', t.bg]}
            locations={[0, 0.3, 0.82, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Heart — spec's gbtn fav() */}
          <Pressable
            style={[s.favBtn, { top: insets.top + 58 }]}
            onPress={onHeart}
          >
            <Ionicons name={heartOn ? 'heart' : 'heart-outline'} size={18} color={heartOn ? t.accent : '#ffffff'} />
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
            <DeliveryEstimate productId={product.id} origin={name || 'origin'} t={t} s={s} />
          </View>

          {/* Variant selector — priced options, the option's own price wins */}
          {variants.length ? (
            <View style={{ marginTop: 16 }}>
              <Text style={s.dimKick}>OPTIONS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {variants.map((v) => {
                  const on = v.id === variantId
                  const out = v.stock <= 0
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => !out && setVariantId(v.id)}
                      style={[s.vPill, on && s.vPillOn, out && { opacity: 0.4 }]}
                    >
                      <Text style={[s.vPillTx, on && { color: '#fff' }]} numberOfLines={1}>
                        {v.name}{out ? ' · out' : ''}
                      </Text>
                      <Text style={[s.vPillPrice, on && { color: '#fff' }]}>{fmt(v.price)}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ) : null}

          {/* Maker card — taps through to the storefront (website parity) */}
          <Pressable
            style={s.maker}
            onPress={() =>
              product.sellerId
                ? nav.navigate('Seller', { sellerId: product.sellerId, sellerName: product.sellerName })
                : undefined
            }
          >
            {cc ? <Image source={{ uri: flagUrl(cc) }} style={s.makerFlag} /> : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.makerName} numberOfLines={1}>
                {product.sellerName ?? 'Verified seller'}
              </Text>
              <Text style={s.makerLoc} numberOfLines={1}>
                {name ? `${name} · opened this channel` : 'Verified on Velor'}
              </Text>
            </View>
            {product.sellerId ? <Ionicons name="chevron-forward" size={15} color={t.mut} /> : null}
          </Pressable>

          {product.sellerId ? (
            <Pressable
              style={s.msgBtn}
              onPress={() =>
                user
                  ? nav.navigate('Messages', { sellerId: product.sellerId, sellerName: product.sellerName, productId: product.id })
                  : nav.navigate('SignIn')
              }
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={t.accent} />
              <Text style={s.msgBtnTx}>{user ? 'Message the maker' : 'Sign in to message the maker'}</Text>
            </Pressable>
          ) : null}

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
              <Ionicons name="shield-checkmark" size={16} color={t.green} />
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
                      color={t.accent}
                    />
                  ))}
                </View>
                <Text style={{ fontFamily: F.body, fontSize: 12.5, color: t.text }}>
                  {product.avgRating.toFixed(1)} · {product.reviewCount} verified{' '}
                  {product.reviewCount === 1 ? 'review' : 'reviews'}
                </Text>
              </View>
            ) : (
              <Text style={s.revEmpty}>
                Real reviews appear here once verified buyers receive real orders — nothing on
                Velor carries a rating it has not earned.
              </Text>
            )}
            {(detail?.reviews ?? []).slice(0, 3).map((r) => (
              <View key={r.id} style={s.revCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Ionicons key={i} name={i <= r.rating ? 'star' : 'star-outline'} size={11} color={t.accent} />
                    ))}
                  </View>
                  <Text style={s.revName}>{r.buyerName ?? 'Verified buyer'}</Text>
                </View>
                {r.comment ? <Text style={s.revBody}>{r.comment}</Text> : null}
                {user ? (
                  <Pressable
                    style={s.helpfulBtn}
                    onPress={async () => {
                      await markReviewHelpful(r.id)
                    }}
                  >
                    <Ionicons name="thumbs-up-outline" size={11} color={t.mut} />
                    <Text style={s.helpfulTx}>
                      Helpful{typeof r.helpfulCount === 'number' && r.helpfulCount > 0 ? ` · ${r.helpfulCount}` : ''}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}

            {/* Write a review — website parity: the server purchase-gates it
                and filters contact details; its message is surfaced verbatim. */}
            {user ? <WriteReview productId={product.id} t={t} s={s} onDone={() => detailQ.refetch()} /> : null}
          </View>

          {/* Questions & Answers — same /api/questions as the website PDP:
              answered pairs are public; signed-in buyers can ask. */}
          <View style={{ marginTop: 28 }}>
            <Text style={s.dimKick}>QUESTIONS &amp; ANSWERS</Text>
            {(questionsQ.data ?? []).filter((q) => q.answer).slice(0, 4).map((q) => (
              <View key={q.id} style={s.qaCard}>
                <Text style={s.qaQ}>Q · {q.question}</Text>
                <Text style={s.qaA}>A · {q.answer}</Text>
              </View>
            ))}
            {!(questionsQ.data ?? []).some((q) => q.answer) ? (
              <Text style={s.revEmpty}>No questions answered yet — ask the maker below.</Text>
            ) : null}
            {user ? (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  value={askText}
                  onChangeText={setAskText}
                  placeholder="Ask the maker a question…"
                  placeholderTextColor={t.dim}
                  style={s.qaInput}
                  multiline
                />
                <Pressable style={[s.qaBtn, askState === 'busy' && { opacity: 0.6 }]} onPress={ask}>
                  <Text style={s.qaBtnTx}>
                    {askState === 'sent' ? 'Sent — the maker will answer' : askState === 'busy' ? 'Sending…' : 'Ask the maker'}
                  </Text>
                </Pressable>
                {askState === 'error' ? (
                  <Text style={[s.revEmpty, { color: t.red }]}>Could not send — questions can't carry contact details.</Text>
                ) : null}
              </View>
            ) : (
              <Text style={s.revEmpty}>Sign in to ask the maker a question.</Text>
            )}
          </View>
        </View>

        {/* MORE FROM {COUNTRY} — craft rail, same tiles as the country dive */}
        {crafts.length ? (
          <View style={{ paddingTop: 30 }}>
            <Text style={[s.dimKick, { paddingHorizontal: 20 }]}>
              MORE FROM {name.toUpperCase()}
            </Text>
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
        <Pressable style={s.addBtn} onPress={onAdd}>
          <Text style={s.addBtnTx}>{added ? 'Added to basket ✓' : `Add · ${fmt(price * qty)}`}</Text>
        </Pressable>
      </View>

      <Chrome back={name || 'Back'} onBack={() => nav.goBack()} />
    </View>
  )
}


// --- Delivery estimate widget (website PDP parity: /api/shipping/estimate).
// The site offers the FULL world list in its "Deliver to" dropdown, so the
// app does too: six quick chips for the common lanes plus a searchable
// full-list picker behind the globe chip (every country, same as checkout).
const EST_COUNTRIES = ['GB', 'US', 'DE', 'FR', 'AU', 'CA']
function DeliveryEstimate({ productId, origin, t, s }: { productId: string; origin: string; t: any; s: any }) {
  const [cc, setCc] = React.useState('GB')
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const q = useQuery({
    queryKey: ['estimate', productId, cc],
    queryFn: () => fetchDeliveryEstimate(productId, cc),
    staleTime: 5 * 60_000,
  })
  const e = q.data
  const label = q.isLoading
    ? 'checking delivery…'
    : !e || !e.available
      ? 'delivery quoted at checkout'
      : e.isFree || e.amountGBP === 0
        ? 'FREE delivery'
        : `delivery ${fmt(e.amountGBP ?? 0)}${e.estimatedDays ? ` · ~${e.estimatedDays} days` : ''}`
  return (
    <View style={{ flexShrink: 1 }}>
      <Text style={s.deliver}>
        {label} · ships from {origin} · to {countryName(cc)}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        {EST_COUNTRIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCc(c)}
            style={[s.estChip, cc === c && { borderColor: t.accent, backgroundColor: t.accentSoft }]}
          >
            <Text style={[s.estChipTx, cc === c && { color: t.accent }]}>{c}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setOpen(!open)}
          style={[s.estChip, (open || !EST_COUNTRIES.includes(cc)) && { borderColor: t.accent, backgroundColor: t.accentSoft }]}
        >
          <Ionicons name="earth" size={11} color={open || !EST_COUNTRIES.includes(cc) ? t.accent : t.mut} />
          <Text style={[s.estChipTx, (open || !EST_COUNTRIES.includes(cc)) && { color: t.accent }]}>
            {!EST_COUNTRIES.includes(cc) ? cc : 'ALL'}
          </Text>
        </Pressable>
      </View>
      {open ? (
        <View style={{ marginTop: 8, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 8, backgroundColor: t.surf }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search all countries"
            placeholderTextColor={t.dim}
            style={{ borderWidth: 1, borderColor: t.line, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, fontFamily: F.body, fontSize: 12, color: t.text }}
          />
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {COUNTRIES.filter((x) => x.n.toLowerCase().includes(query.trim().toLowerCase()))
              .slice()
              .sort((a, b) => a.n.localeCompare(b.n))
              .map((x) => (
                <Pressable
                  key={x.c}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 4 }}
                  onPress={() => {
                    setCc(x.c)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  <Image source={{ uri: flagUrl(x.c, 40) }} style={{ width: 18, height: 13, borderRadius: 2 }} />
                  <Text style={{ fontFamily: F.body, fontSize: 12.5, color: cc === x.c ? t.accent : t.text }}>{x.n}</Text>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  )
}

// --- Write a review (server purchase-gates; error surfaced verbatim) ---
function WriteReview({ productId, t, s, onDone }: { productId: string; t: any; s: any; onDone: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [rating, setRating] = React.useState(0)
  const [comment, setComment] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [note, setNote] = React.useState<string | null>(null)
  if (!open) {
    return (
      <Pressable style={s.wrOpen} onPress={() => setOpen(true)}>
        <Ionicons name="create-outline" size={13} color={t.accent} />
        <Text style={s.wrOpenTx}>Write a review</Text>
      </Pressable>
    )
  }
  return (
    <View style={s.wrCard}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable key={i} onPress={() => setRating(i)} hitSlop={6}>
            <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={22} color={t.accent} />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="What was the piece like in person?"
        placeholderTextColor={t.dim}
        style={s.wrInput}
        multiline
      />
      {note ? <Text style={s.wrNote}>{note}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          style={[s.wrSubmit, (busy || rating === 0) && { opacity: 0.5 }]}
          disabled={busy || rating === 0}
          onPress={async () => {
            setBusy(true)
            setNote(null)
            const r = await writeReview(productId, rating, comment.trim())
            setBusy(false)
            if (r.ok) {
              setOpen(false)
              setRating(0)
              setComment('')
              onDone()
            } else {
              setNote(r.error ?? 'Could not post the review — try again.')
            }
          }}
        >
          <Text style={s.wrSubmitTx}>{busy ? 'Posting…' : 'Post review'}</Text>
        </Pressable>
        <Pressable style={s.wrCancel} onPress={() => setOpen(false)}>
          <Text style={s.wrCancelTx}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = (t: Palette) => StyleSheet.create({
  favBtn: {
    position: 'absolute',
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,20,26,0.55)',
    borderWidth: 1,
    borderColor: t.line,
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
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: t.accent },
  title: { fontFamily: F.serifLight, fontSize: 31, lineHeight: 37, color: t.text, marginTop: 8 },
  price: { fontFamily: F.serifLight, fontSize: 30, color: t.text },
  deliver: { fontFamily: F.body, fontSize: 12, color: t.green, flexShrink: 1 },
  estChip: {
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  estChipTx: { fontFamily: F.display, fontSize: 9, letterSpacing: 0.6, color: t.mut },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  helpfulTx: { fontFamily: F.body, fontSize: 10.5, color: t.mut },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
    borderWidth: 1,
    borderColor: t.accent,
    borderRadius: 12,
    paddingVertical: 10,
  },
  msgBtnTx: { fontFamily: F.bodySemi, fontSize: 12.5, color: t.accent },
  wrOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: t.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  wrOpenTx: { fontFamily: F.bodySemi, fontSize: 12, color: t.accent },
  wrCard: {
    marginTop: 12,
    backgroundColor: t.surf,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  wrInput: {
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    fontFamily: F.body,
    fontSize: 12.5,
    color: t.text,
    textAlignVertical: 'top' as const,
  },
  wrNote: { fontFamily: F.body, fontSize: 11, color: '#e05545' },
  wrSubmit: { backgroundColor: t.accent, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  wrSubmitTx: { fontFamily: F.bodySemi, fontSize: 12, color: '#fff' },
  wrCancel: { borderWidth: 1, borderColor: t.line, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  wrCancelTx: { fontFamily: F.body, fontSize: 12, color: t.mut },
  maker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    backgroundColor: t.surf,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 18,
    padding: 14,
  },
  makerFlag: { width: 44, height: 32, borderRadius: 8 },
  makerName: { fontFamily: F.serif, fontSize: 15, color: t.text },
  makerLoc: { fontFamily: F.body, fontSize: 11, color: t.mut, marginTop: 2 },
  dimKick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: t.mut },
  making: { fontFamily: F.serifLight, fontSize: 16, lineHeight: 24, color: t.text, marginTop: 10 },
  escrow: {
    marginTop: 24,
    backgroundColor: 'rgba(46,204,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.3)',
    borderRadius: 18,
    padding: 14,
  },
  escrowT: { fontFamily: F.displayMed, fontSize: 13.5, color: t.text },
  escrowP: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: t.mut, marginTop: 8 },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: t.surf2,
  },
  pillTx: { fontFamily: F.displayMed, fontSize: 12, color: t.text },
  revEmpty: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: t.dim, marginTop: 10 },
  revCard: {
    marginTop: 12,
    backgroundColor: t.surf,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 14,
    padding: 12,
  },
  revName: { fontFamily: F.bodySemi, fontSize: 11.5, color: t.mut },
  revBody: { fontFamily: F.body, fontSize: 12.5, lineHeight: 18, color: t.text, marginTop: 6 },
  qaCard: {
    marginTop: 12,
    backgroundColor: t.surf,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 14,
    padding: 12,
  },
  qaQ: { fontFamily: F.bodySemi, fontSize: 12.5, lineHeight: 18, color: t.text },
  qaA: { fontFamily: F.body, fontSize: 12.5, lineHeight: 18, color: t.mut, marginTop: 6 },
  qaInput: {
    backgroundColor: t.surf,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 12,
    padding: 12,
    minHeight: 64,
    color: t.text,
    fontFamily: F.body,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  qaBtn: {
    marginTop: 10,
    backgroundColor: t.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  qaBtnTx: { fontFamily: F.displayMed, fontSize: 12.5, color: '#fff' },
  vPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.line,
    backgroundColor: t.surf,
    maxWidth: 260,
  },
  vPillOn: { backgroundColor: t.accent, borderColor: t.accent },
  vPillTx: { fontFamily: F.bodySemi, fontSize: 12.5, color: t.text, flexShrink: 1 },
  vPillPrice: { fontFamily: F.display, fontSize: 12, color: t.mut },
  moreTile: {
    width: 118,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: t.surf2,
  },
  moreName: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    fontFamily: F.displayMed,
    fontSize: 13,
    lineHeight: 16,
    color: t.text,
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
    backgroundColor: t.surf,
    borderTopWidth: 1,
    borderTopColor: t.line,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: t.surf,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 999,
    paddingHorizontal: 6,
    height: 48,
  },
  stepBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepTx: { fontFamily: F.body, fontSize: 18, color: t.text },
  stepN: { fontFamily: F.display, fontSize: 16, color: t.text, minWidth: 18, textAlign: 'center' },
  addBtn: {
    flex: 1,
    backgroundColor: t.accent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addBtnTx: { fontFamily: F.display, fontSize: 14, color: '#fff' },
})
