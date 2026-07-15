import React, { useMemo } from 'react'
import { View, FlatList, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import { C, F } from '../theme'
import { useCart } from '../store'
import { Kicker, Display, Body, Dim, Serif, Btn, Empty } from '../ui'

export default function BasketScreen() {
  const nav = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { items, setQty, remove, total } = useCart()
  const sellers = useMemo(
    () => new Set(items.map((i) => i.product.sellerName ?? 'seller')).size,
    [items]
  )

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Kicker>BASKET</Kicker>
        <Display style={{ marginTop: 6, fontSize: 26 }}>
          {items.length
            ? sellers > 1
              ? `${sellers} makers, one payment.`
              : 'Nearly yours.'
            : 'Your basket.'}
        </Display>
      </View>

      {items.length === 0 ? (
        <Empty
          title="Empty — the world is not."
          sub="Everything in here is a real listing from a verified seller. Dive into a country to start."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.product.id}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 200 }}
          renderItem={({ item }) => (
            <View style={s.row}>
              {item.product.images?.[0] ? (
                <Image source={{ uri: item.product.images[0] }} style={s.img} contentFit="cover" />
              ) : (
                <View style={[s.img, { backgroundColor: C.surf2 }]} />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Body style={{ fontFamily: F.bodySemi }} numberOfLines={1}>
                  {item.product.name ?? item.product.title}
                </Body>
                <Dim style={{ fontSize: 11 }}>
                  {item.product.sellerName ?? ''}
                </Dim>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
                  <Qty label="−" onPress={() => setQty(item.product.id, item.qty - 1)} />
                  <Body style={{ fontFamily: F.displayMed }}>{item.qty}</Body>
                  <Qty label="+" onPress={() => setQty(item.product.id, item.qty + 1)} />
                  <Pressable onPress={() => remove(item.product.id)}>
                    <Dim style={{ fontSize: 11, color: C.red }}>Remove</Dim>
                  </Pressable>
                </View>
              </View>
              <Serif style={{ fontSize: 16 }}>
                {'£'}{((item.product.discountedPrice ?? item.product.price) * item.qty).toFixed(2)}
              </Serif>
            </View>
          )}
        />
      )}

      {items.length > 0 && (
        <View style={s.dock}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Dim>Total (before delivery)</Dim>
            <Serif style={{ fontSize: 20 }}>{'£'}{total().toFixed(2)}</Serif>
          </View>
          <Dim style={{ fontSize: 11, lineHeight: 16, marginBottom: 12 }}>
            Each seller's share is held separately in escrow and released only when
            that parcel's delivery is confirmed. Delivery is quoted per seller at
            checkout, from their real dispatch address.
          </Dim>
          <Btn label="Checkout" onPress={() => nav.navigate('Checkout')} />
        </View>
      )}
    </View>
  )
}

function Qty({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.qty}>
      <Body style={{ fontFamily: F.display, fontSize: 14 }}>{label}</Body>
    </Pressable>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  img: { width: 64, height: 64, borderRadius: 14 },
  qty: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: 'rgba(8,8,11,0.97)',
    borderTopWidth: 1,
    borderColor: C.line,
  },
})
