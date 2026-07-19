import React, { useState } from 'react'
import { View, ScrollView, TextInput, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { FILMS } from '../data'
import { Dim, Btn } from '../ui'
import { Chrome } from '../components/Chrome'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '../store'
import { fetchSubscription } from '../api'

// Go live — plate 32's setup stage as an honest PREVIEW. The stage shows a
// real preview film still (the plate's own note: "Preview uses a sample
// film"), broadcast title and pinned-listings controls are live, and the
// Go live button explains the gate. Live broadcasting is the FOUNDING
// seller's privilege — standing rule (2026-07-08): never pitch it as
// available to all sellers. The plate's LIVE/ended stages carry SIMULATED
// viewer counts; those are not rendered (no fake counts, ever).
export default function GoLiveScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const [title, setTitle] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const film = FILMS[1] ?? FILMS[0]
  const user = useSession((s) => s.user)
  const live = Boolean(user?.sellerId)
  const sub = useQuery({ queryKey: ['sub'], queryFn: fetchSubscription, enabled: live })
  const founding = live && Boolean((sub.data as any)?.foundingBadge)

  const gate = () => {
    setNote(
      founding
        ? 'Your founding privilege is confirmed — real broadcasting switches on with the live infrastructure at launch. Followers of your channel and country are notified the moment you go on air.'
        : "Live broadcasting is the founding seller's privilege — the first verified seller from each country broadcasts on Velor Live, free for life. No standard plan includes it."
    )
    setTimeout(() => setNote(null), 3800)
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        {/* Camera-check stage */}
        <View style={s.stage}>
          {film ? (
            <Image source={{ uri: film.poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
          ) : null}
          <View style={s.stageShade} />
          <View style={s.checkChip}>
            <View style={s.redDot} />
            <Text style={s.checkTx}>CAMERA CHECK</Text>
          </View>
          <Text style={s.stageNote}>
            Followers of your channel and country are notified the moment you go on air. Preview
            uses a sample film.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kickDim}>BROADCAST TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Morning firing — raku, from the kiln"
            placeholderTextColor={C.dim}
            style={s.titleIn}
          />

          <Text style={s.kickDim}>PINNED LISTINGS</Text>
          <Dim style={{ fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>
            Pin listings before you start — buyers tap them to buy while you're on air. Your real
            listings appear here once your channel is live.
          </Dim>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pressable style={s.pill} onPress={gate}>
              <Text style={s.pillTx}>+ Add</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 24 }}>
            <Btn label="Go live" onPress={gate} />
          </View>
          <Dim style={{ textAlign: 'center', marginTop: 10, fontSize: 11, lineHeight: 16 }}>
            Broadcasting on Velor Live is the founding seller's privilege, held for life. Your
            country's followers hear the opening bell.
          </Dim>

          {note ? (
            <View style={s.noteBub}>
              <Text style={s.noteTx}>{note}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}

const s = StyleSheet.create({
  stage: {
    height: 320,
    backgroundColor: '#000',
    justifyContent: 'flex-end',
  },
  stageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  checkChip: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  redDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
  checkTx: { fontFamily: F.display, fontSize: 9, letterSpacing: 1.2, color: C.accent },
  stageNote: {
    fontFamily: F.body,
    fontSize: 10.5,
    lineHeight: 15,
    color: '#b9b9c2',
    paddingHorizontal: 20,
    paddingBottom: 16,
    maxWidth: 300,
  },
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut, marginTop: 24 },
  titleIn: {
    fontFamily: F.bodySemi,
    fontSize: 15,
    color: C.text,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pillTx: { fontFamily: F.displayMed, fontSize: 12, color: C.text },
  noteBub: {
    marginTop: 16,
    backgroundColor: 'rgba(20,20,26,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.35)',
    borderRadius: 14,
    padding: 13,
  },
  noteTx: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: C.text, textAlign: 'center' },
})
