import React, { useMemo, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Alert, Modal, FlatList } from 'react-native'
import { TextInput } from '../ui/TI'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRoute, useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, flagUrl } from '../theme'
import { COUNTRIES, countryName } from '../data'
import { Kicker, Display, Body, Dim, Btn } from '../ui'

// Apply to sell — the mockup's apply page, in-app and editable. Photos come
// from the real device gallery (minimum 3, same rule the production review
// agent enforces; each has a delete button). Country is a real picker — all
// 190, searchable. No website/social field: William's call, 2026-07-15 —
// nothing on the application invites buyers off-platform. Submitting leads
// to the Verify step; the Stripe-hosted identity check itself is the only
// part that runs on the secure web page.
const STEPS: [string, string, string][] = [
  ['1', 'Apply', 'Five minutes, one form.'],
  ['2', 'Verify identity', 'Stripe-hosted — Velor never sees your documents, only pass or fail.'],
  ['3', 'Decision in 24h', 'From the moment verification completes.'],
]

export default function ApplyScreen() {
  const insets = useSafeAreaInsets()
  const route = useRoute<any>()
  const nav = useNavigation<any>()
  const [cc, setCc] = useState<string>(route.params?.cc ?? 'GB')
  const [store, setStore] = useState('')
  const [craft, setCraft] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [picking, setPicking] = useState(false)

  async function addPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)])
  }

  function removePhoto(index: number) {
    setPhotos((p) => p.filter((_, i) => i !== index))
  }

  function submit() {
    if (!store.trim() || !craft.trim() || photos.length < 3) {
      Alert.alert(
        'Not quite ready',
        !store.trim()
          ? 'Give your store a name.'
          : !craft.trim()
            ? 'Tell us what you make and plan to sell.'
            : `Add at least 3 photos of your work (you have ${photos.length}). Applications without them are declined.`
      )
      return
    }
    nav.navigate('Verify')
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 60 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Pressable onPress={() => nav.goBack()} style={s.back}>
          <Body style={{ fontFamily: F.display }}>{'←'}</Body>
        </Pressable>
        <Kicker style={{ marginTop: 16 }}>SELL ON VELOR</Kicker>
        <Display style={{ marginTop: 6, fontSize: 28 }}>Apply to sell.</Display>
        <Dim style={{ marginTop: 8 }}>Five minutes, one form. Free to apply — 0% listing fees on every plan.</Dim>
      </View>

      <View style={s.steps}>
        {STEPS.map(([n, t, b], i) => (
          <View key={n} style={[s.step, i === 2 && { borderBottomWidth: 0 }]}>
            <View style={[s.stepN, i === 0 && { borderColor: C.accent }]}>
              <Body style={{ fontFamily: F.display, fontSize: 11, color: i === 0 ? C.accent : C.mut }}>{n}</Body>
            </View>
            <View style={{ flex: 1 }}>
              <Body style={{ fontFamily: F.bodySemi, fontSize: 13 }}>{t}</Body>
              <Dim style={{ fontSize: 11.5, marginTop: 2 }}>{b}</Dim>
            </View>
          </View>
        ))}
      </View>

      <Kicker style={s.kick}>YOUR STORE</Kicker>
      <View style={s.fld}>
        <Dim style={s.label}>STORE NAME</Dim>
        <TextInput
          style={s.input}
          value={store}
          onChangeText={setStore}
          placeholder="e.g. Studio Kaede"
          placeholderTextColor={C.dim}
        />
      </View>
      <View style={s.fld}>
        <Dim style={s.label}>YOUR COUNTRY</Dim>
        <Pressable
          style={[s.input, { flexDirection: 'row', alignItems: 'center', gap: 9 }]}
          onPress={() => setPicking(true)}
        >
          <Image source={{ uri: flagUrl(cc) }} style={{ width: 22, height: 16, borderRadius: 3 }} />
          <Body style={{ flex: 1 }}>{countryName(cc)}</Body>
          <Body style={{ fontFamily: F.displayMed, fontSize: 10, color: C.accent }}>FOUNDING SEAT OPEN</Body>
          <Ionicons name="chevron-down" size={15} color={C.mut} />
        </Pressable>
      </View>
      <CountryPicker
        visible={picking}
        onClose={() => setPicking(false)}
        onPick={(code) => {
          setCc(code)
          setPicking(false)
        }}
      />

      <Kicker style={s.kick}>WHAT YOU MAKE</Kicker>
      <View style={s.fld}>
        <Dim style={s.label}>YOUR CRAFT & EVERYTHING YOU PLAN TO SELL</Dim>
        <TextInput
          style={[s.input, { minHeight: 110, textAlignVertical: 'top' }]}
          value={craft}
          onChangeText={setCraft}
          multiline
          placeholder="Write it all — your craft, your categories, every kind of product you plan to sell. No limits, no picking from a list."
          placeholderTextColor={C.dim}
        />
      </View>

      <Kicker style={s.kick}>SHOW YOUR WORK</Kicker>
      <View style={s.fld}>
        <Dim style={s.label}>PHOTOS OF YOUR WORK · MINIMUM 3</Dim>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {photos.map((uri, i) => (
            <View key={`${uri}-${i}`} style={s.photoWrap}>
              <Image source={{ uri }} style={s.photo} contentFit="cover" />
              <Pressable style={s.photoX} hitSlop={6} onPress={() => removePhoto(i)}>
                <Ionicons name="close" size={13} color="#fff" />
              </Pressable>
            </View>
          ))}
          <Pressable style={s.add} onPress={addPhotos}>
            <Ionicons name="add" size={22} color={C.mut} />
          </Pressable>
        </View>
        <Dim style={{ fontSize: 11, marginTop: 8 }}>
          {photos.length} added — tap a photo's × to remove it. Applications without at least 3 real photos of your work are declined.
        </Dim>
      </View>

      <Kicker style={s.kick}>SHIPPING & MATERIALS</Kicker>
      <View style={s.fld}>
        <Dim style={s.label}>SHIP-FROM ADDRESS</Dim>
        <View style={s.input}>
          <Dim>Where parcels leave from — sets your buyers' real delivery quotes. Collected at the next step.</Dim>
        </View>
      </View>
      <View style={s.fld}>
        <Dim style={s.label}>MATERIALS DECLARATION</Dim>
        <View style={s.input}>
          <Body style={{ fontSize: 12.5 }}>Any wildlife, plant, wood, leather, shell or antique materials?</Body>
          <Dim style={{ fontSize: 11.5, marginTop: 3 }}>Some need certificates before listing — we'll tell you which.</Dim>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <Btn label="Submit application" onPress={submit} />
        <Dim style={{ textAlign: 'center', marginTop: 9, fontSize: 11 }}>
          Submitting takes you straight to identity verification.
        </Dim>
      </View>
    </ScrollView>
  )
}

function CountryPicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean
  onClose: () => void
  onPick: (cc: string) => void
}) {
  const insets = useSafeAreaInsets()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    const all = [...COUNTRIES].sort((a, b) => a.n.localeCompare(b.n))
    return ql ? all.filter((c) => c.n.toLowerCase().includes(ql)) : all
  }, [q])
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 }}>
          <Text style={p.title}>Your country</Text>
          <Pressable onPress={onClose} hitSlop={8} style={p.close}>
            <Ionicons name="close" size={18} color={C.text} />
          </Pressable>
        </View>
        <View style={p.bar}>
          <Ionicons name="search-outline" size={16} color={C.dim} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search all 190…"
            placeholderTextColor={C.dim}
            style={p.input}
            autoCorrect={false}
          />
        </View>
        <FlatList
          data={list}
          keyExtractor={(c) => c.c}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => (
            <Pressable style={p.row} onPress={() => onPick(item.c)}>
              <Image source={{ uri: flagUrl(item.c, 40) }} style={{ width: 24, height: 17, borderRadius: 3 }} />
              <Body style={{ flex: 1, fontSize: 14 }}>{item.n}</Body>
              <Ionicons name="chevron-forward" size={14} color={C.dim} />
            </Pressable>
          )}
        />
      </View>
    </Modal>
  )
}

const p = StyleSheet.create({
  title: { flex: 1, fontFamily: F.serifLight, fontSize: 24, color: C.text },
  close: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 15,
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: C.text, fontFamily: F.body, fontSize: 14, paddingVertical: 13 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 13,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
})

const s = StyleSheet.create({
  back: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  steps: {
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  step: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    paddingVertical: 13, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  stepN: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: C.line,
    alignItems: 'center', justifyContent: 'center',
  },
  kick: { paddingHorizontal: 20, marginTop: 26 },
  fld: { paddingHorizontal: 20, paddingTop: 14 },
  label: {
    fontFamily: F.display, fontSize: 10, letterSpacing: 1,
    color: C.mut, marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15,
    paddingHorizontal: 16, paddingVertical: 14,
    color: C.text, fontFamily: F.body, fontSize: 14,
  },
  photoWrap: { width: 64, height: 64 },
  photo: { width: 64, height: 64, borderRadius: 14 },
  photoX: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  add: {
    width: 64, height: 64, borderRadius: 14,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line,
    alignItems: 'center', justifyContent: 'center',
  },
})
