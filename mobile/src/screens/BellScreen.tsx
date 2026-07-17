import React, { useEffect, useRef, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Animated, Easing } from 'react-native'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, flagUrl } from '../theme'
import { countryName } from '../data'
import { useFollows } from '../store'
import { enableNotifications } from '../push'
import { Dim } from '../ui'
import { Chrome } from '../components/Chrome'

// The opening bell — plate 15. YOUR BELLS holds what is genuinely yours
// (your real follows; real order bells arrive with buyer launch), then the
// plate's own SAMPLE-labelled explainer cards, and RING IT plays the REAL
// bell: the mockup's 4-second double-strike cast-bell synthesis, rendered
// to audio (assets/bell.m4a — same partials, same detuned shimmer, same
// strike noise) with a swing animation. William's call 2026-07-15: "bell
// notifications need a real bell noise."
//
// HARD RULE after the 2026-07-15 black-screen bug (expo-audio 57.x on the
// SDK 54 runtime crashed useAudioPlayer at render): NO native audio call
// happens at render time. The player is created lazily on the first RING,
// inside try/catch — if audio ever breaks again, the bell still swings and
// the page still renders.
const BELL = require('../../assets/bell.m4a')

export default function BellScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const follows = useFollows((s) => s.ids)
  const toggleFollow = useFollows((s) => s.toggle)
  const playerRef = useRef<AudioPlayer | null>(null)
  const swing = useRef(new Animated.Value(0)).current
  const [rung, setRung] = useState(false)
  const [pushState, setPushState] = useState<string | null>(null)

  async function turnOnPush() {
    setPushState('Asking your phone…')
    const res = await enableNotifications()
    setPushState(
      res.ok
        ? 'On — this phone is registered. Bells arrive with the store release of the app.'
        : res.reason === 'denied'
          ? 'Notifications are off in your phone settings — enable them for Velor and try again.'
          : 'Permission saved. Delivery to this phone switches on with the store release of the app — Expo Go cannot receive pushes.'
    )
  }

  useEffect(
    () => () => {
      try {
        playerRef.current?.release()
      } catch {}
    },
    []
  )

  const ring = () => {
    try {
      if (!playerRef.current) {
        // Audible even with the iPhone mute switch on — it's a preview the
        // user explicitly asked to hear.
        setAudioModeAsync({ playsInSilentMode: true }).catch(() => {})
        playerRef.current = createAudioPlayer(BELL)
      }
      playerRef.current.seekTo(0)
      playerRef.current.play()
    } catch {}
    setRung(true)
    swing.setValue(0)
    Animated.sequence([
      Animated.timing(swing, { toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(swing, { toValue: -0.8, duration: 240, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(swing, { toValue: 0.5, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(swing, { toValue: -0.25, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(swing, { toValue: 0, duration: 340, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start()
  }

  const rotate = swing.interpolate({ inputRange: [-1, 1], outputRange: ['-24deg', '24deg'] })

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.h1}>The opening bell</Text>

          {/* Push door — the chime on your phone */}
          <Pressable style={s.pushCard} onPress={turnOnPush}>
            <Ionicons name="notifications-circle-outline" size={22} color={C.accent} />
            <View style={{ flex: 1 }}>
              <Text style={s.nt}>Ring on this phone</Text>
              <Text style={s.ns}>
                {pushState ??
                  'Turn on notifications — opening bells and order updates arrive with the real bell chime.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={C.dim} />
          </Pressable>

          <Text style={[s.kickDim, { marginTop: 22 }]}>YOUR BELLS</Text>

          {follows.length ? (
            follows.map((cc) => (
              <View key={cc} style={s.card}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Image source={{ uri: flagUrl(cc) }} style={s.cardFlag} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.nt}>Following {countryName(cc)}</Text>
                    <Text style={s.ns}>
                      The bell rings the moment its channel opens — its founding seller's first
                      listings, live.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <Pressable style={s.nbLine} onPress={() => nav.navigate('Country', { cc })}>
                        <Text style={s.nbLineTx}>Visit {countryName(cc)}</Text>
                      </Pressable>
                      <Pressable style={s.nbLine} onPress={() => toggleFollow(cc)}>
                        <Text style={s.nbLineTx}>Unfollow</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={s.card}>
              <Text style={s.nt}>Quiet, for now</Text>
              <Text style={s.ns}>
                Follow a country and its opening bell lands here. Order something and every step
                of the parcel rings in too — orders switch on with buyer launch, 6 August.
              </Text>
            </View>
          )}

          {/* What the bell sounds like */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 28 }}>
            <Text style={[s.kickDim, { flex: 1 }]}>WHAT THE BELL SOUNDS LIKE · SAMPLE</Text>
            <Pressable style={s.ringBtn} onPress={ring}>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Ionicons name="notifications" size={13} color={C.accent} />
              </Animated.View>
              <Text style={s.ringTx}>{rung ? 'RING IT AGAIN' : 'RING IT'}</Text>
            </Pressable>
          </View>

          {/* Sample cards — the plate's own explainers, SAMPLE-labelled */}
          <View style={[s.card, s.cardHot]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Image source={{ uri: flagUrl('JP') }} style={s.cardFlag} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={s.nt}>Japan just opened</Text>
                  <Text style={s.sample}>SAMPLE</Text>
                </View>
                <Text style={s.ns}>Japan's founding seller goes live with their first listings.</Text>
                <Pressable style={s.nbSolid} onPress={() => nav.navigate('Country', { cc: 'JP' })}>
                  <Text style={s.nbSolidTx}>Visit the channel</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Image source={{ uri: flagUrl('CN') }} style={s.cardFlag} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={s.nt}>Live in 15 minutes</Text>
                  <Text style={s.sample}>SAMPLE</Text>
                </View>
                <Text style={s.ns}>A maker goes on air — throwing the tea set, from the wheel.</Text>
                <Pressable style={s.nbLineSelf} onPress={() => nav.navigate('Tabs', { screen: 'Live' })}>
                  <Text style={s.nbLineTx}>See the live feed</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={[s.cardFlag, s.parcelIcon]}>
                <Ionicons name="bag-outline" size={16} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={s.nt}>Out for delivery</Text>
                  <Text style={s.sample}>SAMPLE</Text>
                </View>
                <Text style={s.ns}>Your parcel arrives today. The stamp is ready.</Text>
              </View>
            </View>
          </View>

          <Dim style={{ textAlign: 'center', marginTop: 22, fontSize: 11.5, lineHeight: 17, paddingHorizontal: 10 }}>
            Quiet by default — Velor only speaks when something is genuinely yours: an order, a
            follow, an opening bell.
          </Dim>
        </View>
      </ScrollView>
      <Chrome back="Back" onBack={() => nav.goBack()} />
    </View>
  )
}

const s = StyleSheet.create({
  h1: { fontFamily: F.serifLight, fontSize: 30, color: C.text },
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  card: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 15,
  },
  pushCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    backgroundColor: 'rgba(255,107,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.35)',
    borderRadius: 18,
    padding: 14,
  },
  cardHot: { borderColor: 'rgba(255,107,0,0.45)' },
  cardFlag: { width: 38, height: 27, borderRadius: 6 },
  parcelIcon: {
    backgroundColor: 'rgba(61,220,132,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    width: 38,
    borderRadius: 10,
  },
  nt: { fontFamily: F.bodySemi, fontSize: 13, color: C.text },
  ns: { fontFamily: F.body, fontSize: 11.5, lineHeight: 16, color: C.mut, marginTop: 3 },
  sample: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 0.8, color: C.mut },
  nbLine: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nbLineSelf: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nbLineTx: { fontFamily: F.displayMed, fontSize: 12, color: C.text },
  nbSolid: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: C.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  nbSolidTx: { fontFamily: F.displayMed, fontSize: 12, color: '#160a00' },
  ringBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,107,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.4)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  ringTx: { fontFamily: F.display, fontSize: 10.5, letterSpacing: 0.5, color: C.accent },
})
