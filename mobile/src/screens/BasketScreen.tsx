import React, { useMemo } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F, flagUrl } from '../theme'
import { fmt, onI18n } from '../i18n'
import { useCart, CartItem } from '../store'
import { countryName } from '../data'
import { Dim, Btn, Empty } from '../ui'
import { Chrome } from '../components/Chrome'

// Basket — plate 07, exact structure: "N makers. One payment." Fraunces 32,
// the green escrow banner, items GROUPED BY SELLER (flag + store name +
// "ships from …", item rows with qty steppers), the summary card and the
// sticky "Checkout · £" button. Honesty divergence: the plate's shipping
// option rows carry sample rates — real per-seller rates are quoted at
// checkout from each seller's real dispatch address, so the basket says
// exactly that instead of inventing a figure.
export default function BasketScreen() {
  const nav = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { items, setQty, remove, total } = useCart()

  const groups = useMemo(() => {
    const map = new Map<string, { seller: string; cc?: string; items: CartItem[] }>()
    for (const it of items) {
      const key = it.product.sellerName ?? 'Verified seller'
      const g = map.get(key) ?? { seller: key, cc: it.product.originCountry, items: [] }
      g.items.push(it)
      map.set(key, g)
    }
    return [...map.values()]
  }, [items])

  const n = groups.length
  const title =
    n === 0
      ? 'Your basket.'
      : n === 1
        ? 'One maker.\nOne payment.'
        : `${['Two', 'Three', 'Four', 'Five'][n - 2] ?? n} makers.\nOne payment.`

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: items.length ? 140 : 40 }}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kickDim}>YOUR BASKET</Text>
          <Text style={s.h1}>{title}</Text>
          {items.length ? (
            <View style={s.escrow}>
              <Ionicons name="shield-checkmark" size={15} color={C.green} />
              <Text style={s.escrowTx}>
                Held in escrow until each parcel's delivery is confirmed.
              </Text>
            </View>
          ) : null}
        </View>

        {items.length === 0 ? (
          <Empty
            title="Empty — the world is not."
            sub="Everything in here is a real listing from a verified seller. Dive into a country to start."
          />
        ) : (
          <>
            {groups.map((g) => (
              <View key={g.seller} style={s.sellerCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  {g.cc ? (
                    <Image source={{ uri: flagUrl(g.cc, 40) }} style={{ width: 24, height: 17, borderRadius: 3 }} />
                  ) : null}
                  <Text style={s.snm} numberOfLines={1}>
                    {g.seller}
                  </Text>
                  <View style={{ flex: 1 }} />
                  {g.cc ? <Text style={s.sfrom}>ships from {countryName(g.cc)}</Text> : null}
                </View>

                {g.items.map((item) => (
                  <View key={item.product.id} style={s.itemRow}>
                    <Pressable onPress={() => nav.navigate('Pdp', { product: item.product, cc: g.cc })}>
                      {item.product.images?.[0] ? (
                        <Image source={{ uri: item.product.images[0] }} style={s.img} contentFit="cover" />
                      ) : (
                        <View style={[s.img, { backgroundColor: C.surf2 }]} />
                      )}
                    </Pressable>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.it} numberOfLines={2}>
                        {item.product.name ?? item.product.title}
                      </Text>
                      <Text style={s.pr}>
                        {fmt(item.product.discountedPrice ?? item.product.price)}
                      </Text>
                    </View>
                    <View style={s.qtyRow}>
                      <Pressable
                        style={s.qbtn}
                        onPress={() =>
                          item.qty === 1 ? remove(item.product.id) : setQty(item.product.id, item.qty - 1)
                        }
                      >
                        <Text style={s.qtx}>{item.qty === 1 ? '×' : '−'}</Text>
                      </Pressable>
                      <Text style={s.qn}>{item.qty}</Text>
                      <Pressable style={s.qbtn} onPress={() => setQty(item.product.id, item.qty + 1)}>
                        <Text style={s.qtx}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}

                <View style={s.shipNote}>
                  <Ionicons name="radio-button-on" size={14} color={C.accent} />
                  <Text style={s.shipTx}>
                    Delivery quoted at checkout — from this maker's real dispatch address.
                  </Text>
                </View>
              </View>
            ))}

            {/* Summary */}
            <View style={s.summary}>
              <Row l="Items" r={fmt(total())} />
              <Row l={`Delivery · ${n} parcel${n === 1 ? '' : 's'}`} r="at checkout" dimR />
              <Row l="Import duty · est." r="at checkout" dimR />
              <View style={s.hr} />
              <View style={s.rowLine}>
                <Text style={s.totL}>Total</Text>
                <Text style={s.totR}>{fmt(total())} + delivery</Text>
              </View>
            </View>
            <Dim style={{ paddingHorizontal: 20, marginTop: 14, fontSize: 11.5, lineHeight: 17 }}>
              {n} seller{n === 1 ? '' : 's'}, {n} parcel{n === 1 ? '' : 's'}, {n} tracking number
              {n === 1 ? '' : 's'} — one charge. Each seller only ever sees their own order.
            </Dim>
          </>
        )}
      </ScrollView>

      {items.length > 0 && (
        <View style={[s.dock, { paddingBottom: insets.bottom + 12 }]}>
          <Btn label={`Checkout · ${fmt(total())} + delivery`} onPress={() => nav.navigate('Checkout')} />
        </View>
      )}
      <Chrome />
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
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  h1: { fontFamily: F.serifLight, fontSize: 32, lineHeight: 37, color: C.text, marginTop: 8 },
  escrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    backgroundColor: 'rgba(61,220,132,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(61,220,132,0.25)',
    borderRadius: 16,
    padding: 13,
  },
  escrowTx: { flex: 1, fontFamily: F.body, fontSize: 11.5, lineHeight: 16, color: '#bfeed3' },
  sellerCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    padding: 14,
  },
  snm: { fontFamily: F.displayMed, fontSize: 13, color: C.text, flexShrink: 1 },
  sfrom: { fontFamily: F.body, fontSize: 11, color: C.dim },
  itemRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 14 },
  img: { width: 60, height: 60, borderRadius: 12 },
  it: { fontFamily: F.bodySemi, fontSize: 13, lineHeight: 17, color: C.text },
  pr: { fontFamily: F.display, fontSize: 13, color: C.text, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qbtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtx: { fontFamily: F.body, fontSize: 15, color: C.text },
  qn: { fontFamily: F.display, fontSize: 15, color: C.text, minWidth: 14, textAlign: 'center' },
  shipNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 14,
    backgroundColor: 'rgba(255,107,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
    borderRadius: 13,
    padding: 11,
  },
  shipTx: { flex: 1, fontFamily: F.body, fontSize: 10.5, lineHeight: 15, color: '#d6d6de' },
  summary: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 16,
    gap: 9,
  },
  rowLine: { flexDirection: 'row', alignItems: 'baseline' },
  rowL: { flex: 1, fontFamily: F.body, fontSize: 13, color: C.mut },
  rowR: { fontFamily: F.body, fontSize: 13, color: C.text },
  hr: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 3 },
  totL: { flex: 1, fontFamily: F.display, fontSize: 17, color: C.text },
  totR: { fontFamily: F.display, fontSize: 15, color: C.text },
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
