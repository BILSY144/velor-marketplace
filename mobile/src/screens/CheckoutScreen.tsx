import React, { useMemo } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import { C, F } from '../theme'
import { useCart } from '../store'
import { Kicker, Display, Body, Dim, Serif, Btn } from '../ui'

// Checkout, mockup-style: per-seller parcels, real delivery quoted from
// each seller's dispatch address, everything escrowed per seller. Payment
// itself opens with buyers on 6 August — no fake orders before then.
export default function CheckoutScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const { items, total } = useCart()

  const bySeller = useMemo(() => {
    const m = new Map<string, typeof items>()
    for (const i of items) {
      const k = i.product.sellerName ?? 'Seller'
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(i)
    }
    return [...m.entries()]
  }, [items])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 60 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Pressable onPress={() => nav.goBack()} style={s.back}>
          <Body style={{ fontFamily: F.display }}>{'←'}</Body>
        </Pressable>
        <Kicker style={{ marginTop: 16 }}>CHECKOUT</Kicker>
        <Display style={{ marginTop: 6, fontSize: 26 }}>
          {bySeller.length > 1 ? `${bySeller.length} makers, one payment.` : 'Nearly yours.'}
        </Display>
      </View>

      <Kicker style={s.kick}>DELIVERY ADDRESS</Kicker>
      <View style={s.card}>
        <Body style={{ fontFamily: F.bodySemi }}>Add your address at payment</Body>
        <Dim style={{ marginTop: 4, fontSize: 11.5 }}>
          Your address sets each seller's real carrier quote — every parcel is priced
          from that seller's own dispatch address to your door.
        </Dim>
      </View>

      {bySeller.map(([seller, its]) => (
        <View key={seller}>
          <Kicker style={s.kick}>{seller.toUpperCase()} — SHIPS THEIR OWN PARCEL</Kicker>
          <View style={s.card}>
            {its.map((i) => (
              <View key={i.product.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                {i.product.images?.[0] ? (
                  <Image source={{ uri: i.product.images[0] }} style={{ width: 40, height: 40, borderRadius: 10 }} contentFit="cover" />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.surf2 }} />
                )}
                <Body style={{ flex: 1, fontSize: 12.5 }} numberOfLines={1}>
                  {i.product.name ?? i.product.title} × {i.qty}
                </Body>
                <Serif style={{ fontSize: 14 }}>
                  {'£'}{((i.product.discountedPrice ?? i.product.price) * i.qty).toFixed(2)}
                </Serif>
              </View>
            ))}
            <Dim style={{ fontSize: 11, marginTop: 6 }}>
              Delivery quoted live at payment · this seller's share is escrowed separately
              and released only when this parcel's delivery is confirmed.
            </Dim>
          </View>
        </View>
      ))}

      <Kicker style={s.kick}>TOTAL</Kicker>
      <View style={s.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Body>Items</Body>
          <Serif style={{ fontSize: 18 }}>{'£'}{total().toFixed(2)}</Serif>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Dim>Delivery & any duties</Dim>
          <Dim>quoted at payment</Dim>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <Btn
          label="Pay securely — opens 6 August"
          onPress={() =>
            Alert.alert(
              'Buying opens 6 August',
              'Velor never fakes an order. In-app payment (Stripe, escrow-protected) switches on the day buyers arrive.'
            )
          }
        />
        <Dim style={{ textAlign: 'center', marginTop: 10, fontSize: 11, lineHeight: 16 }}>
          Card details are handled by Stripe — Velor never sees them. Your money sits in
          escrow, per seller, until each delivery is confirmed.
        </Dim>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  back: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  kick: { paddingHorizontal: 20, marginTop: 24 },
  card: {
    marginHorizontal: 20, marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.line,
    borderRadius: 16, padding: 15,
  },
})
