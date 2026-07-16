import React from 'react'
import { View, Pressable, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { Serif, Body, Dim, Btn } from '../ui'

// The mockup's verify screen. The identity check itself is Stripe-hosted —
// that single step opens the secure Stripe page; everything else stays here.
export default function VerifyScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', paddingBottom: 60 }}>
      <Pressable onPress={() => nav.goBack()} style={[s.back, { top: insets.top + 8 }]}>
        <Body style={{ fontFamily: F.display }}>{'←'}</Body>
      </Pressable>
      <View style={{ alignItems: 'center', paddingHorizontal: 30 }}>
        <View style={s.idbox}>
          <Ionicons name="person-outline" size={34} color={C.accent} />
        </View>
        <Serif style={{ fontSize: 26, marginTop: 22 }}>One step left.</Serif>
        <Dim style={{ textAlign: 'center', marginTop: 10, maxWidth: 290, lineHeight: 19 }}>
          Verify your identity with your phone camera — hosted by Stripe. Velor never
          receives or stores your documents, only the result. Your 24-hour clock starts
          the moment it completes.
        </Dim>
      </View>
      <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
        <Btn
          label="Verify with Stripe"
          onPress={() => Linking.openURL('https://velorcommerce.store/apply')}
        />
        <Btn ghost label="Do it later" style={{ marginTop: 9 }} onPress={() => nav.navigate('Tabs')} />
        <Dim style={{ textAlign: 'center', marginTop: 12, fontSize: 10.5 }}>
          The secure identity check is the one step that opens in your browser —
          it finishes your application on velorcommerce.store.
        </Dim>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  back: {
    position: 'absolute', left: 16, zIndex: 5,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  idbox: {
    width: 86, height: 86, borderRadius: 26,
    borderWidth: 1.5, borderColor: 'rgba(255,107,0,0.4)',
    backgroundColor: 'rgba(255,107,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
})
