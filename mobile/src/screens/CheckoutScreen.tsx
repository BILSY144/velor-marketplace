import React, { useMemo, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, flagUrl } from '../theme'
import { fmt, onI18n } from '../i18n'
import { useCart } from '../store'
import { Dim, Btn } from '../ui'
import { Chrome } from '../components/Chrome'

// Checkout — plate 08, exact structure: Fraunces "Checkout", DELIVER TO
// row, DELIVERY · N PARCELS card (one row per seller, flag + carrier line),
// SUMMARY card, the white wallet-pay button, "or pay by card · Stripe"
// divider, CARD field placeholders, the green escrow banner word-for-word,
// and the sticky "Pay securely · £" bar. Honesty divergences: no SAMPLE
// address (the deliver-to row says where the address really gets added);
// per-parcel prices read "quoted live" until the address exists; and every
// pay control carries the 6-August gate — Velor never fakes an order.
export default function CheckoutScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const { items, total } = useCart()
  const [note, setNote] = useState<string | null>(null)

  const groups = useMemo(() => {
    const m = new Map<string, { cc?: string; count: number }>()
    for (const i of items) {
      const k = i.product.sellerName ?? 'Verified seller'
      const g = m.get(k) ?? { cc: i.product.originCountry, count: 0 }
      g.count += i.qty
      m.set(k, g)
    }
    return [...m.entries()]
  }, [items])

  const nItems = items.reduce((n, i) => n + i.qty, 0)

  const gate = () => {
    setNote(
      'Buying opens 6 August. In-app payment — Stripe, wallet pay, escrow-protected — switches on the day buyers arrive. Velor never fakes an order.'
    )
    setTimeout(() => setNote(null), 3600)
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.h1}>Checkout</Text>

          <Text style={s.label}>DELIVER TO</Text>
          <Pressable style={s.inRow} onPress={gate}>
            <Text style={s.inTx}>Your delivery address — added at payment</Text>
            <Text style={s.change}>Why?</Text>
          </Pressable>

          <Text style={s.label}>
            DELIVERY · {groups.length} PARCEL{groups.length === 1 ? '' : 'S'}
          </Text>
          <View style={s.card}>
            {groups.map(([seller, g], i) => (
              <View key={seller} style={[s.parcelRow, i > 0 && s.parcelDiv]}>
                {g.cc ? (
                  <Image source={{ uri: flagUrl(g.cc, 40) }} style={{ width: 22, height: 16, borderRadius: 3 }} />
                ) : null}
                <Text style={s.parcelTx} numberOfLines={2}>
                  {seller} · tracked, their own carrier
                </Text>
                <Text style={s.parcelP}>quoted live</Text>
              </View>
            ))}
            {groups.length === 0 ? (
              <Dim style={{ fontSize: 12 }}>Your basket is empty — nothing to deliver yet.</Dim>
            ) : null}
          </View>

          <Text style={s.label}>SUMMARY</Text>
          <View style={[s.card, { gap: 9 }]}>
            <Row l={`Items (${nItems})`} r={fmt(total())} />
            <Row l="Delivery" r="at payment" dimR />
            <Row l="Import duty · est." r="at payment" dimR />
            <View style={s.hr} />
            <View style={s.rowLine}>
              <Text style={s.totL}>Total</Text>
              <Text style={s.totR}>{fmt(total())} + delivery</Text>
            </View>
          </View>

          {/* Wallet pay — white button */}
          <Pressable style={s.wht} onPress={gate}>
            <Ionicons name="wallet-outline" size={17} color="#000" />
            <Text style={s.whtTx}>Pay · opens 6 August</Text>
          </Pressable>

          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orTx}>or pay by card · Stripe</Text>
            <View style={s.orLine} />
          </View>

          <Text style={[s.label, { marginTop: 0 }]}>CARD</Text>
          <Pressable style={s.inRow} onPress={gate}>
            <Text style={s.ph}>Card number</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Pressable style={[s.inRow, { flex: 1 }]} onPress={gate}>
              <Text style={s.ph}>MM / YY</Text>
            </Pressable>
            <Pressable style={[s.inRow, { flex: 1 }]} onPress={gate}>
              <Text style={s.ph}>CVC</Text>
            </Pressable>
          </View>

          <View style={s.escrow}>
            <Ionicons name="shield-checkmark" size={15} color={C.green} />
            <Text style={s.escrowTx}>
              Charged once, by Velor. Held in escrow until each parcel is delivered. Anything
              wrong — the funds freeze.
            </Text>
          </View>

          {note ? (
            <View style={s.noteBub}>
              <Text style={s.noteTx}>{note}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[s.dock, { paddingBottom: insets.bottom + 12 }]}>
        <Btn label={`Pay securely · ${fmt(total())} + delivery`} onPress={gate} />
      </View>
      <Chrome back="Basket" onBack={() => nav.goBack()} />
    </View>
  )
}

function Row({ l, r, dimR }: { l: string; r: string; dimR?: boolean }) {
  return (
    <View style={s.rowLine}>
      <Text style={s.rowL}>{l}</Text>
      <Text style={[s.rowR, dimR && { color: C.mut }]}>{r}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  h1: { fontFamily: F.serifLight, fontSize: 30, color: C.text },
  label: {
    fontFamily: F.display,
    fontSize: 10,
    letterSpacing: 1,
    color: C.mut,
    marginTop: 22,
    marginBottom: 8,
  },
  inRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  inTx: { flex: 1, fontFamily: F.body, fontSize: 13.5, color: C.text },
  change: { fontFamily: F.bodySemi, fontSize: 12, color: C.accent },
  ph: { fontFamily: F.body, fontSize: 13, color: C.dim },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 14,
  },
  parcelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  parcelDiv: { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  parcelTx: { flex: 1, fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.text },
  parcelP: { fontFamily: F.body, fontSize: 12, color: C.mut },
  rowLine: { flexDirection: 'row', alignItems: 'baseline' },
  rowL: { flex: 1, fontFamily: F.body, fontSize: 13, color: C.mut },
  rowR: { fontFamily: F.body, fontSize: 13, color: C.text },
  hr: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  totL: { flex: 1, fontFamily: F.bodySemi, fontSize: 13, color: C.text },
  totR: { fontFamily: F.bodySemi, fontSize: 13, color: C.text },
  wht: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 16,
    marginTop: 24,
  },
  whtTx: { fontFamily: F.displayMed, fontSize: 14.5, color: '#000' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  orTx: { fontFamily: F.body, fontSize: 11, color: C.dim },
  escrow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 18,
    backgroundColor: 'rgba(61,220,132,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(61,220,132,0.25)',
    borderRadius: 16,
    padding: 13,
  },
  escrowTx: { flex: 1, fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: '#bfeed3' },
  noteBub: {
    marginTop: 14,
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
