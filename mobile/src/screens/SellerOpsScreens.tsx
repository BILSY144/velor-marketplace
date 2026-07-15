import React, { useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { Dim, Btn } from '../ui'
import { Chrome } from '../components/Chrome'

// Seller orders (plate 28), API access (plate 29) and Payouts (plate 31) —
// the plates' exact structure as honest PREVIEWS, same pattern as the
// dashboard: the mockup fills these with Studio Kaede's sample orders,
// keys and payout history; the app renders the same layout with real zero
// states and the preview banner. They become live the day seller sign-in
// ships. All reached from the Dash preview.

function PreviewBanner({ text }: { text: string }) {
  return (
    <View style={s.preview}>
      <Ionicons name="eye-outline" size={14} color={C.accent} />
      <Text style={s.previewTx}>{text}</Text>
    </View>
  )
}

export function SellerOrdersScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const [filter, setFilter] = useState('To ship')
  const filters = ['New', 'To ship', 'In transit', 'Delivered']

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <PreviewBanner text="PREVIEW — your live order desk, the day you're approved." />
          <Text style={s.kick}>YOUR CHANNEL</Text>
          <Text style={s.h1}>Orders.</Text>
          <Dim style={{ marginTop: 8, lineHeight: 18 }}>
            Every parcel, every stage. You ship with your own carrier — tracking goes straight to
            the buyer.
          </Dim>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
            {filters.map((f) => (
              <Pressable
                key={f}
                style={[s.pill, filter === f && s.pillOn]}
                onPress={() => setFilter(f)}
              >
                <Text style={[s.pillTx, filter === f && s.pillTxOn]}>{f} · 0</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.zero}>
            <Ionicons name="cube-outline" size={22} color={C.mut} />
            <Text style={s.zeroT}>No {filter.toLowerCase()} orders yet</Text>
            <Text style={s.zeroS}>
              Your first order lands here the moment a buyer pays — its money already held safely
              in escrow for you. Add tracking once collected and the buyer follows it live.
            </Text>
          </View>

          <View style={{ marginTop: 20 }}>
            <Btn label="Apply to sell — five minutes" onPress={() => nav.navigate('Apply', {})} />
          </View>
        </View>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}

export function ApiKeysScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const [note, setNote] = useState(false)

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <PreviewBanner text="PREVIEW — Pro-only. Keys are issued on your approved account." />
          <Text style={s.kick}>PRO TOOLS</Text>
          <Text style={s.h1}>API access.</Text>
          <Dim style={{ marginTop: 8, lineHeight: 18 }}>
            Wire your channel into your own tools — stock sync, order export, live-session
            alerts. Included with Pro.
          </Dim>

          <Text style={s.kickDim}>YOUR KEYS</Text>
          <View style={s.zero}>
            <Ionicons name="key-outline" size={20} color={C.mut} />
            <Text style={s.zeroT}>No keys yet</Text>
            <Text style={s.zeroS}>
              Your first key is created here once your Pro account is live — shown once, stored
              hashed.
            </Text>
          </View>

          <View style={{ marginTop: 14 }}>
            <Btn label="Create a new key" onPress={() => setNote(true)} />
          </View>
          {note ? (
            <Text style={s.noteTx}>Keys are issued on your approved Pro account — apply first.</Text>
          ) : null}

          <Text style={s.kickDim}>WHAT KEYS CAN DO</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {['Read orders', 'Update stock', 'Create listings', 'Live-session events', 'Payout reports'].map(
              (p) => (
                <View key={p} style={s.pill}>
                  <Text style={s.pillTx}>{p}</Text>
                </View>
              )
            )}
          </View>
          <Dim style={{ marginTop: 16, fontSize: 11.5, lineHeight: 17 }}>
            Keys are shown once and stored hashed. Revoke instantly from here if one leaks. Rate
            limit: 600 requests/min.
          </Dim>
        </View>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}

export function PayoutsScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <PreviewBanner text="PREVIEW — your earnings page, the day you're approved." />
          <Text style={s.h1}>Payouts</Text>

          <View style={s.escrowCard}>
            <Text style={s.kickDim2}>HELD IN ESCROW FOR YOU</Text>
            <Text style={s.big}>£0.00</Text>
            <Dim style={{ marginTop: 8, lineHeight: 17, fontSize: 11.5 }}>
              Released automatically after each order's delivery is confirmed and its protection
              window passes. No withdraw button — it's automatic, every time.
            </Dim>
          </View>

          <Text style={s.kickDim}>PAYOUT METHOD</Text>
          <View style={s.card}>
            <Text style={s.fd}>Connected at approval</Text>
            <Dim style={{ marginTop: 4, fontSize: 11.5, lineHeight: 17 }}>
              Stripe where supported, paid in GBP to your bank. Outside Stripe's coverage?
              Payoneer is on the way — earnings held safely meanwhile.
            </Dim>
          </View>

          <Text style={s.kickDim}>HISTORY</Text>
          <View style={s.zero}>
            <Ionicons name="trending-up-outline" size={20} color={C.mut} />
            <Text style={s.zeroT}>Nothing yet</Text>
            <Text style={s.zeroS}>
              Every release lands here the moment it happens — order by order, dated, in green.
            </Text>
          </View>

          <View style={{ marginTop: 20 }}>
            <Btn label="Apply to sell — five minutes" onPress={() => nav.navigate('Apply', {})} />
          </View>
        </View>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}

const s = StyleSheet.create({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
    borderRadius: 14,
    padding: 11,
    marginBottom: 20,
  },
  previewTx: { flex: 1, fontFamily: F.displayMed, fontSize: 9.5, letterSpacing: 0.6, color: C.accent, lineHeight: 14 },
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.accent },
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut, marginTop: 26 },
  kickDim2: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  h1: { fontFamily: F.serifLight, fontSize: 30, color: C.text, marginTop: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pillOn: { backgroundColor: C.accentSoft, borderWidth: 1, borderColor: 'rgba(255,107,0,0.4)' },
  pillTx: { fontFamily: F.displayMed, fontSize: 12, color: C.mut },
  pillTxOn: { color: C.accent },
  zero: {
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  zeroT: { fontFamily: F.bodySemi, fontSize: 13.5, color: C.text },
  zeroS: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: C.dim, textAlign: 'center' },
  noteTx: { fontFamily: F.body, fontSize: 11.5, color: C.accent, marginTop: 12, textAlign: 'center' },
  escrowCard: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    padding: 18,
  },
  big: { fontFamily: F.serifLight, fontSize: 38, color: C.text, marginTop: 10 },
  card: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 15,
  },
  fd: { fontFamily: F.bodySemi, fontSize: 13, color: C.text },
})
