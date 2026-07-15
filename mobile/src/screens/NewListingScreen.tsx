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
import { useSession } from '../store'
import { createListing } from '../api'

// New listing — plate 30, fully interactive as a PREVIEW: real photo picker
// (tap a thumb to make it the cover), title, price/stock/parcel, the
// "you'd keep" line computed from the REAL tier maths, description and
// story fields, the regulated-materials gate, and the live READY TO PUBLISH
// checklist that reacts to what you've actually filled in. Publishing
// itself is gated to an approved seller account — the button says so.
type Photo = { uri: string; dataUrl: string | null }

export default function NewListingScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const user = useSession((st) => st.user)
  const live = Boolean(user?.sellerId)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [cover, setCover] = useState(0)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [parcel, setParcel] = useState('')
  const [desc, setDesc] = useState('')
  const [story, setStory] = useState('')
  const [regulated, setRegulated] = useState<null | boolean>(null)
  const [certs, setCerts] = useState<string[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function addPhotos() {
    // base64 so a signed-in publish can send images as data URLs — the same
    // format the website's own Add Product form stores (no upload service
    // needed). quality 0.5 keeps each photo small enough for the API.
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.5,
      base64: true,
    })
    if (!res.canceled)
      setPhotos((p) => [
        ...p,
        ...res.assets.map((a) => ({
          uri: a.uri,
          dataUrl: a.base64 ? `data:image/jpeg;base64,${a.base64}` : null,
        })),
      ])
  }

  async function addCerts() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.9,
    })
    if (!res.canceled) setCerts((c) => [...c, ...res.assets.map((a) => a.uri)])
  }

  const priceN = parseFloat(price) || 0
  const keepStarter = Math.max(0, priceN * 0.9)
  const keepPro = Math.max(0, priceN * 0.96)

  const checks: [string, boolean][] = useMemo(() => {
    const base: [string, boolean][] = [
      [`Photos · ${photos.length}`, photos.length >= 3],
      ['Title', title.trim().length > 2],
      ['Price', priceN > 0],
      ['Description', desc.trim().length > 10],
      ['Story', story.trim().length > 10],
      ['Parcel size', parcel.trim().length > 2],
      ['Materials declared', regulated !== null],
    ]
    // The compliance gate: regulated materials cannot list without a
    // certificate — same rule the production admin approval enforces (409
    // without a valid certificate).
    if (regulated === true) base.push([`Certificate · ${certs.length}`, certs.length > 0])
    return base
  }, [photos.length, title, priceN, desc, story, parcel, regulated, certs.length])
  const ready = checks.every(([, ok]) => ok)

  async function publish() {
    if (!ready) {
      setNote('Not ready yet — clear the amber pills below first. Listings without 3 real photos are auto-rejected.')
      setTimeout(() => setNote(null), 3800)
      return
    }
    if (!live) {
      setNote('Ready — publishing goes live with your approved seller account. Sign in from the dashboard, or apply in five minutes.')
      setTimeout(() => setNote(null), 3800)
      return
    }
    if (busy) return
    setBusy(true)
    setNote('Publishing…')
    // Best-effort parcel parse: "1.2kg · 20×20×15" → grams + cm
    const kg = parcel.match(/([\d.]+)\s*kg/i)
    const g = parcel.match(/([\d.]+)\s*g\b/i)
    const dims = parcel.match(/(\d+)\s*[×x*]\s*(\d+)\s*[×x*]\s*(\d+)/)
    const res = await createListing({
      name: title.trim(),
      description: desc.trim(),
      price: priceN,
      stock: Math.max(1, parseInt(stock, 10) || 1),
      images: photos.map((p) => p.dataUrl).filter(Boolean),
      makerStory: story.trim(),
      materials: desc.trim(),
      isHandmade: true,
      containsRegulatedMaterial: regulated === true,
      rulesAccepted: true,
      weightGrams: kg ? Math.round(parseFloat(kg[1]) * 1000) : g ? Math.round(parseFloat(g[1])) : null,
      lengthCm: dims ? parseInt(dims[1], 10) : null,
      widthCm: dims ? parseInt(dims[2], 10) : null,
      heightCm: dims ? parseInt(dims[3], 10) : null,
    })
    setBusy(false)
    if (res.ok) {
      setNote(
        regulated
          ? 'Published — held for certificate verification, live the moment it clears.'
          : 'Published — your listing is in review and goes live on approval.'
      )
      setTimeout(() => {
        setNote(null)
        nav.goBack()
      }, 2600)
    } else {
      setNote(res.error ?? 'Could not publish — try again.')
      setTimeout(() => setNote(null), 5000)
    }
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
              <Image source={{ uri: photos[cover].uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={s.coverEmpty}>
                <Ionicons name="camera-outline" size={26} color={C.mut} />
                <Text style={s.coverB}>Add photo</Text>
              </View>
            )}
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {photos.map((p, i) => (
              <Pressable key={`${p.uri}-${i}`} onPress={() => setCover(i)} style={[s.th, i === cover && s.thOn]}>
                <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
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
            listing.
          </Dim>

          {/* Certificate upload — required the moment materials are regulated */}
          {regulated === true ? (
            <View style={s.certCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <Ionicons name="document-attach-outline" size={16} color={C.accent} />
                <Text style={s.certT}>Certificate required</Text>
              </View>
              <Dim style={{ fontSize: 11.5, lineHeight: 17, marginTop: 6 }}>
                Upload a clear photo or scan of the certificate that clears this item to ship —
                CITES for wildlife and protected woods, phytosanitary for plant material, export
                or provenance papers for antiques. Velor verifies it before the listing can go
                live; without one, regulated items cannot list.
              </Dim>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {certs.map((uri, i) => (
                  <View key={`${uri}-${i}`} style={s.certWrap}>
                    <Image source={{ uri }} style={s.certImg} contentFit="cover" />
                    <Pressable
                      style={s.certX}
                      hitSlop={6}
                      onPress={() => setCerts((c) => c.filter((_, x) => x !== i))}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                <Pressable style={s.certAdd} onPress={addCerts}>
                  <Ionicons name="add" size={18} color={C.accent} />
                  <Text style={s.certAddTx}>Upload</Text>
                </Pressable>
              </View>
              {certs.length ? (
                <Dim style={{ fontSize: 11, marginTop: 8 }}>
                  {certs.length} document{certs.length === 1 ? '' : 's'} attached — verified by
                  Velor before the listing goes live.
                </Dim>
              ) : null}
            </View>
          ) : null}

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
        <Btn
          label={busy ? 'Publishing…' : ready ? 'Publish listing' : 'Publish listing — checklist first'}
          onPress={publish}
        />
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
  certCard: {
    marginTop: 14,
    backgroundColor: 'rgba(255,107,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
    borderRadius: 18,
    padding: 14,
  },
  certT: { fontFamily: F.bodySemi, fontSize: 13, color: C.text },
  certWrap: { width: 64, height: 64 },
  certImg: { width: 64, height: 64, borderRadius: 12 },
  certX: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certAdd: {
    height: 64,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,107,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  certAddTx: { fontFamily: F.displayMed, fontSize: 10, color: C.accent },
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
