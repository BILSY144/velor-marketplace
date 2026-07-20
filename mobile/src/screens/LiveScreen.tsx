import React, { useCallback, useRef, useState } from 'react'
import { View, FlatList, Pressable, StyleSheet, useWindowDimensions, ViewToken } from 'react-native'
import { Text } from '../ui/T'
import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, flagUrl } from '../theme'
import { fmt, onI18n, useI18nTick } from '../i18n'
import { FILMS, countryName, Film } from '../data'
import { fetchProductsByOrigin, fetchLiveStreams } from '../api'
import { useCart, useFavs } from '../store'

// Velor Live — plate 03 + spec/live.txt, exact: back chip to Atlas, PREVIEW
// pill top-right, the honest preview note, step chevrons with the n/total
// counter, country chip into the dive, Fraunces 23 title, sub, the product
// strip (REAL listings only — go to PDP or Add), the ask row and the heart.
// Honesty divergences from the plate (standing rule): the mockup's sample
// chat bubbles (amira/seller) are not rendered — live chat begins with real
// broadcasts; the product strip only appears when a real listing exists for
// the film's country; no viewer counts anywhere (CAP/ASA rule).
//
// Real broadcasts banner (2026-07-20): a genuine seller who is live or
// scheduled now shows above the preview reel, tapping opens the real
// LiveRoom screen (real LiveKit video, chat, pin, live pricing) — separate
// from the preview films below, which stay exactly as they were.
export default function LiveScreen() {
  useI18nTick()
  const { height, width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const liveNow = useQuery({
    queryKey: ['liveStreamsNow'],
    queryFn: fetchLiveStreams,
    refetchInterval: 30000,
  })
  const realStreams = (liveNow.data ?? []).slice(0, 5)
  // The Atlas reel deep-links here with { start } — open the feed AT that
  // film (was silently ignored before the 2026-07-15 wiring scan caught it).
  const start: number = Math.min(FILMS.length - 1, Math.max(0, route.params?.start ?? 0))
  const [active, setActive] = useState(start)
  const listRef = useRef<FlatList<Film>>(null)

  React.useEffect(() => {
    const target = route.params?.start
    if (typeof target === 'number' && target >= 0 && target < FILMS.length) {
      setActive(target)
      // let the list mount, then jump without animation
      requestAnimationFrame(() =>
        listRef.current?.scrollToIndex({ index: target, animated: false })
      )
    }
  }, [route.params?.start])

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length) setActive(viewableItems[0].index ?? 0)
  })

  const step = useCallback(
    (d: number) => {
      const next = Math.min(FILMS.length - 1, Math.max(0, active + d))
      listRef.current?.scrollToIndex({ index: next, animated: true })
    },
    [active]
  )

  const renderItem = useCallback(
    ({ item, index }: { item: Film; index: number }) => (
      <FilmPage
        film={item}
        index={index}
        active={index === active}
        height={height}
        width={width}
        onStep={step}
      />
    ),
    [active, height, width, step]
  )

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        ref={listRef}
        style={{ flex: 1, backgroundColor: '#000' }}
        data={FILMS}
        keyExtractor={(f) => f.src}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onViewableItemsChanged={onViewable.current}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
      />
      {realStreams.length > 0 && (
        <View style={[ls.bannerWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
          {realStreams.map((st) => (
            <Pressable key={st.id} style={ls.banner} onPress={() => nav.navigate('LiveRoom', { room: st.roomName })}>
              {st.status === 'LIVE' ? <View style={ls.liveDot} /> : <Ionicons name="time-outline" size={12} color={C.text} />}
              <Text style={ls.bannerTx} numberOfLines={1}>
                {st.status === 'LIVE' ? `${st.sellerName} is live now` : `${st.sellerName} goes live soon`}
              </Text>
              <Ionicons name="chevron-forward" size={13} color={C.text} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const ls = StyleSheet.create({
  bannerWrap: { position: 'absolute', left: 14, right: 14, gap: 8 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,20,26,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.5)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerTx: { flex: 1, color: C.text, fontFamily: F.displayMed, fontSize: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
})

function FilmPage({
  film,
  index,
  active,
  height,
  width,
  onStep,
}: {
  film: Film
  index: number
  active: boolean
  height: number
  width: number
  onStep: (d: number) => void
}) {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const add = useCart((s) => s.add)
  const favIds = useFavs((s) => s.ids)
  const toggleFav = useFavs((s) => s.toggle)
  const isFav = favIds.includes(film.src)
  const [note, setNote] = useState<string | null>(null)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const player = useVideoPlayer(film.src, (p) => {
    p.loop = true
    p.muted = true
  })

  React.useEffect(() => {
    if (active) player.play()
    else player.pause()
  }, [active, player])

  // Real listing for this film's country — the strip renders only when one
  // exists. Fetch is shared with the country dive via the same query key.
  const products = useQuery({
    queryKey: ['products', film.c],
    queryFn: () => fetchProductsByOrigin(film.c),
    enabled: active,
  })
  const listing = products.data?.[0]

  const say = (msg: string) => {
    setNote(msg)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(null), 2200)
  }

  return (
    <View style={{ height, width, backgroundColor: '#000' }}>
      {active ? (
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      ) : (
        <Image source={{ uri: film.poster }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
      <View style={s.shadeTop} pointerEvents="none" />
      <View style={s.shadeBottom} pointerEvents="none" />

      {/* Top chrome — back chip left, PREVIEW pill right */}
      <View style={[s.topRow, { top: insets.top + 10 }]}>
        <Pressable style={s.backBtn} onPress={() => nav.navigate('Atlas')}>
          <Ionicons name="chevron-back" size={16} color={C.text} />
        </Pressable>
        <View style={s.prevPill}>
          <Text style={s.prevTx}>PREVIEW</Text>
        </View>
      </View>

      {/* Honest note + menu */}
      <View style={[s.noteRow, { top: insets.top + 58 }]}>
        <Text style={s.note}>
          Preview film — real broadcasts begin as sellers go on air. Every seller can go live, on
          any plan.
        </Text>
        <Pressable style={s.gbtn} onPress={() => nav.navigate('Menu')}>
          <Ionicons name="menu-outline" size={18} color={C.text} />
        </Pressable>
      </View>

      {/* Step chevrons + counter */}
      <View style={[s.steps, { top: height * 0.44 }]}>
        <Pressable style={s.stepBtn} onPress={() => onStep(-1)}>
          <Ionicons name="chevron-up" size={17} color={C.text} />
        </Pressable>
        <Text style={s.counter}>
          {index + 1}/{FILMS.length}
        </Text>
        <Pressable style={s.stepBtn} onPress={() => onStep(1)}>
          <Ionicons name="chevron-down" size={17} color={C.text} />
        </Pressable>
      </View>

      {/* Bottom block */}
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 }}>
        <Pressable style={s.cchip} onPress={() => nav.navigate('Country', { cc: film.c })}>
          <Image source={{ uri: flagUrl(film.c) }} style={{ width: 20, height: 14, borderRadius: 3 }} />
          <Text style={s.cchipTx}>{countryName(film.c)}</Text>
        </Pressable>
        <Text style={s.title}>{film.title}</Text>
        <Text style={s.sub}>{film.sub}</Text>

        {note ? (
          <View style={s.noteBub}>
            <Text style={s.noteBubTx}>{note}</Text>
          </View>
        ) : null}

        {/* Product strip — real listing only */}
        {listing ? (
          <Pressable
            style={s.strip}
            onPress={() => nav.navigate('Pdp', { product: listing, cc: film.c })}
          >
            {listing.images?.[0] ? (
              <Image source={{ uri: listing.images[0] }} style={s.stripImg} contentFit="cover" />
            ) : (
              <View style={[s.stripImg, { backgroundColor: C.surf2 }]} />
            )}
            <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.stripT} numberOfLines={1}>
                {listing.name ?? listing.title}
              </Text>
              <Text style={s.stripP}>
                {fmt(listing.discountedPrice ?? listing.price, 0)}
              </Text>
              <Image source={{ uri: flagUrl(film.c) }} style={{ width: 15, height: 11, borderRadius: 2 }} />
            </View>
            <Pressable
              style={s.addBtn}
              onPress={() => {
                add(listing)
                say('Added to your basket')
              }}
            >
              <Text style={s.addTx}>Add</Text>
            </Pressable>
          </Pressable>
        ) : null}

        {/* Ask row + heart */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <Pressable
            style={s.ask}
            onPress={() => say('Live chat opens when real broadcasts begin')}
          >
            <Text style={s.askTx}>Ask the maker anything…</Text>
          </Pressable>
          <Pressable style={s.hb} onPress={() => toggleFav(film.src)}>
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={19} color={isFav ? C.accent : C.text} />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  shadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  shadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,20,26,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  prevTx: { fontFamily: F.display, fontSize: 9, letterSpacing: 1.6, color: C.text },
  noteRow: {
    position: 'absolute',
    left: 16,
    right: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    zIndex: 5,
  },
  note: { flex: 1, fontFamily: F.body, fontSize: 10.5, lineHeight: 15, color: '#b9b9c2' },
  gbtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,20,26,0.6)',
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { position: 'absolute', right: 14, alignItems: 'center', gap: 8, zIndex: 5 },
  stepBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(20,20,26,0.55)',
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: { fontFamily: F.displayMed, fontSize: 9, color: '#b9b9c2' },
  cchip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,20,26,0.7)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  cchipTx: { fontFamily: F.displayMed, fontSize: 10.5, color: '#fff' },
  title: { fontFamily: F.serifLight, fontSize: 23, lineHeight: 28, color: C.text, marginTop: 10 },
  sub: { fontFamily: F.body, fontSize: 11.5, color: '#d6d6de', marginTop: 4 },
  noteBub: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20,20,26,0.85)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  noteBubTx: { fontFamily: F.body, fontSize: 11.5, color: C.text },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: 'rgba(15,15,19,0.88)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    padding: 8,
    paddingRight: 8,
  },
  stripImg: { width: 44, height: 44, borderRadius: 12 },
  stripT: { fontFamily: F.displayMed, fontSize: 12.5, color: C.text, flexShrink: 1 },
  stripP: { fontFamily: F.bodySemi, fontSize: 11.5, color: C.accent },
  addBtn: {
    backgroundColor: C.accent,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  addTx: { fontFamily: F.display, fontSize: 12.5, color: '#160a00' },
  ask: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  askTx: { fontFamily: F.body, fontSize: 12.5, color: '#8d8d97' },
  hb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(20,20,26,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
