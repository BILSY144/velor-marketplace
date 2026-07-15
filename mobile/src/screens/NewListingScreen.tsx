import React, { useMemo, useState } from 'react'
import { View, ScrollView, TextInput, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { Dim, Btn } from '../ui'
import { Chrome } from '../components/Chrome'

// New listing — plate 30, fully interactive as a PREVIEW: real photo picker
// (tap a thumb to make it the cover), title, price/stock/parcel, the
// "you'd keep" line computed from the REAL tier maths, description and
// story fields, the regulated-materials gate, and the live READY TO PUBLISH
// checklist that reacts to what you've actually filled in. Publishing
// itself is gated to an approved seller account — the button says so.
export default function NewListingScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const [photos, setPhotos] = useState<string[]>([])
  const [cover, setCover] = useState(0)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [parcel, setParcel] = useState('')
  const [desc, setDesc] = useState('')
  const [story, setStory] = useState('')
  const [regulated, setRegulated] = useState<null | boolean>(null)
  const [note, setNote] = useState<string | null>(null)

  async function addPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)])
  }

  const priceN = parseFloat(price) || 0
  const keepStarter = Math.max(0, priceN * 0.9)
  const keepPro = Math.max(0, priceN * 0.96)

  const checks: [string, boolean][] = useMemo(
    () => [
      [`Photos · ${photos.length}`, photos.length >= 3],
      ['Title', title.trim().length > 2],
      ['Price', priceN > 0],
      ['Description', desc.trim().length > 10],
      ['Story', story.trim().length > 10],
      ['Parcel size', parcel.trim().length > 2],
      ['Materials declared', regulated !== null],
    ],
    [photos.length, title, priceN, desc, story, parcel, regulated]
  )
  const ready = checks.every(([, ok]) => ok)

  const publish = () => {
    setNote(
      ready
        ? 'Ready — publishing goes live with your approved seller account. Apply in five minutes and this listing form is the real one.'
        : 'Not ready yet — clear the amber pills below first. Listings without 3 real photos are auto-rejected.'
    )
    setTimeout(() => setNote(null), 3800)
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kick}>YOUR CHANNEL · NEW LISTING</Text>
          <Text style={s.h1}>List a piece.</Text>

          {/* Photos — cover + thumbs */}
          <Pressable style={s.cover} onPress={photos.length ? undefined : addPhotos}>
            {photos[cover] ? (
              <Image source={{ uri: photos[cover] }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={s.coverEmpty}>
                <Ionicons name="camera-outline" size={26} color={C.mut} />
                <Text style={s.coverB}>Add photo</Text>
              </View>
            )}
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {photos.map((uri, i) => (
              <Pressable key={`${uri}-${i}`} onPress={() => setCover(i)} style={[s.th, i === cover && s.thOn]}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              </Pressable>
            ))}
            <Pressable style={s.addTh} onPress={addPhotos}>
              <Ionicons name="add" size={20} color={C.mut} />
            </Pressable>
          </View>
          <Dim style={{ fontSize: 11.5, marginTop: 8 }}>
            {photos.length} photo{photos.length === 1 ? '' : 's'} · 3 minimum — listings without
            them are auto-rejected. Tap a photo to make it the cover.
          </Dim>

          {/* Title */}
          <Text style={s.kickDim}>TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Kuro raku tea bowl, wood-fired"
            placeholderTextColor={C.dim}
            style={s.titleIn}
          />

          {/* Price / stock / parcel */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
            <StatIn label="PRICE £" value={price} onChange={setPrice} keyboard="decimal-pad" ph="68" />
            <StatIn label="STOCK" value={stock} onChange={setStock} keyboard="number-pad" ph="3" />
            <StatIn label="PARCEL" value={parcel} onChange={setParcel} ph="1.2kg · 20×20×15" />
          </View>
          <Dim style={{ fontSize: 11.5, marginTop: 8 }}>
            Parcel weight and size power real delivery quotes at checkout.
          </Dim>
          {priceN > 0 ? (
            <Text style={s.keep}>
              You'd keep{' '}
              <Text style={{ color: C.accent }}>£{keepStarter.toFixed(2)}</Text> on Starter (10%) ·{' '}
              <Text style={{ color: C.accent }}>£{keepPro.toFixed(2)}</Text> on Pro (4%). Shipping
              is paid on top and passes to you in full.
            </Text>
          ) : null}

          {/* Description */}
          <Text style={s.kickDim}>WHAT IS IT · CATEGORY & MATERIALS</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            multiline
            placeholder="A raku chawan — tea ceremony bowl. Stoneware clay, natural ash glaze, food-safe."
            placeholderTextColor={C.dim}
            style={s.area}
          />
          <Dim style={{ fontSize: 11.5, marginTop: 6 }}>
            Your words, no lists to pick from — this places the piece in search, craft pages and
            your country's dive.
          </Dim>

          {/* Story */}
          <Text style={s.kickDim}>THE STORY · BUYERS READ THIS</Text>
          <TextInput
            value={story}
            onChangeText={setStory}
            multiline
            placeholder="Each bowl is thrown on a kick wheel, raku-fired in the wood kiln behind the studio…"
            placeholderTextColor={C.dim}
            style={s.area}
          />

          {/* Regulated materials */}
          <View style={s.regRow}>
            <Text style={s.fd}>Regulated materials?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([false, true] as boolean[]).map((v) => (
                <Pressable
                  key={String(v)}
                  style={[s.pill, regulated === v && s.pillOn]}
                  onPress={() => setRegulated(v)}
                >
                  <Text style={[s.pillTx, regulated === v && s.pillTxOn]}>{v ? 'Yes' : 'No'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Dim style={{ fontSize: 11.5, marginTop: 6 }}>
            Wildlife, plant, wood, leather, shell or antique parts need certificates before
            listing{regulated ? ' — you will be asked to upload one before this can go live.' : '.'}
          </Dim>

          {/* Ready to publish */}
          <Text style={s.kickDim}>READY TO PUBLISH</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {checks.map(([label, ok]) => (
              <View key={label} style={[s.okpill, !ok && s.waitpill]}>
                <Ionicons name={ok ? 'checkmark' : 'ellipse-outline'} size={11} color={ok ? C.green : C.mut} />
                <Text style={[s.okTx, !ok && { color: C.mut }]}>{label}</Text>
              </View>
            ))}
          </View>

          {note ? (
            <View style={s.noteBub}>
              <Text style={s.noteTx}>{note}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[s.dock, { paddingBottom: insets.bottom + 12 }]}>
        <Btn label={ready ? 'Publish listing' : 'Publish listing — checklist first'} onPress={publish} />
      </View>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}

function StatIn({
  label,
  value,
  onChange,
  ph,
  keyboard,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  ph: string
  keyboard?: 'decimal-pad' | 'number-pad'
}) {
  return (
    <View style={s.stat}>
      <Text style={s.sl}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={ph}
        placeholderTextColor={C.dim}
        keyboardType={keyboard}
        style={s.sv}
      />
    </View>
  )
}

const s = StyleSheet.create({
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.accent },
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut, marginTop: 24 },
  h1: { fontFamily: F.serifLight, fontSize: 30, color: C.text, marginTop: 8 },
  cover: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.surf,
    marginTop: 18,
  },
  coverEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  coverB: { fontFamily: F.displayMed, fontSize: 11, color: '#fff' },
  th: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.surf2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thOn: { borderColor: C.accent },
  addTh: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleIn: {
    fontFamily: F.serifLight,
    fontSize: 22,
    color: C.text,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  sl: { fontFamily: F.display, fontSize: 8.5, letterSpacing: 1, color: C.mut },
  sv: { fontFamily: F.serifLight, fontSize: 17, color: C.accent, padding: 0 },
  keep: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: C.mut, marginTop: 10 },
  area: {
    fontFamily: F.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#d8d7d3',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  regRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  fd: { fontFamily: F.bodySemi, fontSize: 13, color: C.text },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pillOn: { backgroundColor: C.accentSoft, borderWidth: 1, borderColor: 'rgba(255,107,0,0.4)' },
  pillTx: { fontFamily: F.displayMed, fontSize: 12, color: C.mut },
  pillTxOn: { color: C.accent },
  okpill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(61,220,132,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(61,220,132,0.3)',
  },
  waitpill: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: C.line,
  },
  okTx: { fontFamily: F.displayMed, fontSize: 10.5, color: C.green },
  noteBub: {
    marginTop: 16,
    backgroundColor: 'rgba(20,20,26,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.35)',
    borderRadius: 14,
    padding: 13,
  },
  noteTx: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: C.text, textAlign: 'center' },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(8,8,11,0.97)',
    borderTopWidth: 1,
    borderColor: C.line,
  },
})
