import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Pressable, StyleSheet, ScrollView, Animated, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { WebView } from 'react-native-webview'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { FILMS } from '../data'
import { globeHtml } from '../globeHtml'
import { Kicker, Display, Body, Dim } from '../ui'

// The Atlas — full-bleed interactive globe, exactly like the mockup.
// The globe owns every gesture (nothing here scrolls vertically); the
// film reel sits at the bottom, and the round button flips the globe
// between the realistic earth and the dark ink view.
export default function AtlasScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const html = useMemo(globeHtml, [])
  const web = useRef<WebView>(null)
  const [mode, setMode] = useState<'real' | 'ink'>('real')

  function toggleMode() {
    const next = mode === 'real' ? 'ink' : 'real'
    setMode(next)
    web.current?.injectJavaScript(`setMode('${next}');true;`)
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <WebView
        ref={web}
        source={{ html }}
        style={[StyleSheet.absoluteFill as any, { backgroundColor: C.bg }]}
        containerStyle={{ backgroundColor: C.bg }}
        scrollEnabled={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        originWhitelist={['*']}
        onMessage={(e) => {
          const cc = e.nativeEvent.data
          if (cc && cc.length === 2) nav.navigate('Country', { cc })
        }}
      />

      {/* Chrome — search / menu / bell, like the mockup */}
      <View style={{ position: 'absolute', top: insets.top + 8, right: 14, flexDirection: 'row', gap: 9, zIndex: 6 }}>
        <Pressable style={s.gbtn} onPress={() => nav.navigate('Search')}>
          <Ionicons name="search-outline" size={17} color={C.text} />
        </Pressable>
        <Pressable style={s.gbtn} onPress={() => nav.navigate('Menu')}>
          <Ionicons name="menu-outline" size={19} color={C.text} />
        </Pressable>
        <Pressable style={s.gbtn} onPress={() => nav.navigate('Bell')}>
          <Ionicons name="notifications-outline" size={17} color={C.text} />
        </Pressable>
      </View>

      {/* Hero — exactly the mockup: centered "Shop <rotating word>" */}
      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 78, left: 0, right: 0, alignItems: 'center' }}>
        <HeroLine />
      </View>

      {/* Hint — centered over the lower globe, like the mockup */}
      <View pointerEvents="none" style={{ position: 'absolute', top: '54%', left: 0, right: 0 }}>
        <Text style={s.hint}>Drag anywhere · tap a light to dive in</Text>
      </View>

      {/* Globe view toggle — realistic earth vs dark ink */}
      <Pressable style={[s.mode, { bottom: 232 }]} onPress={toggleMode}>
        <Ionicons
          name={mode === 'real' ? 'moon-outline' : 'earth-outline'}
          size={19}
          color={C.text}
        />
      </Pressable>

      {/* Bottom reel — preview films, swipes horizontally only */}
      <View style={s.reelWrap}>
        <Kicker style={{ paddingHorizontal: 20 }}>SHOPPING THE WORLD — PREVIEW FILMS</Kicker>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingTop: 10 }}
        >
          {FILMS.slice(0, 14).map((f, i) => (
            <Pressable key={f.src} style={s.filmCard} onPress={() => nav.navigate('Live', { start: i })}>
              <Image source={{ uri: f.poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              <View style={s.filmShade} />
              <View style={s.previewTag}>
                <Body style={s.previewTx}>PREVIEW</Body>
              </View>
              <View style={{ position: 'absolute', left: 8, right: 8, bottom: 8 }}>
                <Body style={{ fontFamily: F.bodySemi, fontSize: 10.5 }} numberOfLines={1}>
                  {f.title}
                </Body>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const HERO_WORDS = ['the world', 'Japan', 'Morocco', 'Peru', 'Mexico', 'Ghana', 'Italy', 'Nepal', 'Turkey', 'the world']

function HeroLine() {
  const [i, setI] = useState(0)
  const fade = useRef(new Animated.Value(1)).current
  const shift = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const t = setInterval(() => {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(shift, { toValue: 8, duration: 450, useNativeDriver: true }),
      ]).start(() => {
        setI((n) => (n + 1) % HERO_WORDS.length)
        shift.setValue(-8)
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(shift, { toValue: 0, duration: 450, useNativeDriver: true }),
        ]).start()
      })
    }, 2400)
    return () => clearInterval(t)
  }, [fade, shift])
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={s.heroBase}>Shop </Text>
      <Animated.Text style={[s.heroWord, { opacity: fade, transform: [{ translateY: shift }] }]}>
        {HERO_WORDS[i]}
      </Animated.Text>
    </View>
  )
}

const s = StyleSheet.create({
  heroBase: { fontFamily: F.serifLight, fontSize: 31, letterSpacing: -0.5, color: C.text },
  heroWord: { fontFamily: F.serifItalic, fontSize: 31, letterSpacing: -0.5, color: C.accent },
  hint: {
    textAlign: 'center',
    fontFamily: F.display,
    fontSize: 11,
    letterSpacing: 0.4,
    color: C.dim,
  },
  gbtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,20,26,0.85)',
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mode: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20,20,26,0.85)',
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  reelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    paddingBottom: 6,
  },
  filmCard: {
    width: 108,
    aspectRatio: 9 / 13,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.surf2,
  },
  filmShade: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  previewTag: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  previewTx: { fontFamily: F.display, fontSize: 7.5, letterSpacing: 1, color: C.text },
})
