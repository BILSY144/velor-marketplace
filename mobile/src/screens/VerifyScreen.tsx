import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { Serif, Body, Dim, Btn } from '../ui'

// Post-application confirmation. IDENTITY MODEL CHANGED 2026-07-21
// (William: identity works "like payouts" -- no photo-ID step). This screen
// used to send sellers to a Stripe-hosted camera check with a 24-hour
// clock; both are gone. Applications are rules-screened and decided within
// 2 hours; identity is confirmed by Stripe or Payoneer from personal
// details at payout setup, and no payout moves until their KYC passes.
// Route name stays "Verify" so existing navigation keeps working.
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
          <Ionicons name="checkmark-circle-outline" size={34} color={C.accent} />
        </View>
        <Serif style={{ fontSize: 26, marginTop: 22 }}>Application in.</Serif>
        <Dim style={{ textAlign: 'center', marginTop: 10, maxWidth: 300, lineHeight: 19 }}>
          You will have a decision within 2 hours — usually minutes. No documents to
          upload: your identity is confirmed by Stripe or Payoneer from your personal
          details when you set up payouts, and Velor never sees or stores them.
        </Dim>
      </View>
      <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
        <Btn label="Back to Velor" onPress={() => nav.navigate('Tabs')} />
        <Dim style={{ textAlign: 'center', marginTop: 12, fontSize: 10.5 }}>
          Watch your email — approval and your next steps arrive there.
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
