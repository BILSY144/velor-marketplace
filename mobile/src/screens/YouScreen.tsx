import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { useFavs, useFollows } from '../store'
import { Chrome } from '../components/Chrome'

// You — plate 16 + spec/account.txt, exact: YOU kicker, Fraunces 30 name,
// passkey line, the Passport card with the big orange stamp count, ACCOUNT
// rows (Orders & tracking / Favourites & follows / Addresses / Payment
// methods / Language & currency / Ask Velor / Privacy & legal), then the
// SELL ON VELOR card. Honesty divergences: no fake signed-in name until
// passkey sign-in exists (launch); every sub-line reflects real state — no
// sample parcels, no sample address.
export default function YouScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const favs = useFavs((s) => s.ids)
  const follows = useFollows((s) => s.ids)

  const favSub =
    favs.length || follows.length
      ? [
          favs.length ? `${favs.length} favourite${favs.length === 1 ? '' : 's'}` : null,
          follows.length ? `following ${follows.length}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : 'Follow a country to hear its bell'

  const rows: { title: string; sub: string; onPress: () => void }[] = [
    {
      title: 'Orders & tracking',
      sub: 'Escrow-protected — your parcels land here at launch',
      onPress: () => nav.navigate('Orders'),
    },
    {
      title: 'Favourites & follows',
      sub: favSub,
      onPress: () => nav.navigate('Bell'),
    },
    {
      title: 'Addresses',
      sub: 'Saved at checkout — delivery quotes use your default',
      onPress: () => nav.navigate('Addr'),
    },
    {
      title: 'Payment methods',
      sub: 'Handled by Stripe — Velor never sees a card number',
      onPress: () => nav.navigate('Pay'),
    },
    {
      title: 'Language & currency',
      sub: 'English · GBP',
      onPress: () => nav.navigate('LangCur'),
    },
    {
      title: 'Ask Velor',
      sub: 'Your guide, in any language',
      onPress: () => nav.navigate('Assist'),
    },
    {
      title: 'Privacy & legal',
      sub: 'Terms, privacy, buyer protection',
      onPress: () => nav.navigate('Legal', { doc: 'terms' }),
    },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 60 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kickDim}>YOU</Text>
          <Text style={s.h1}>Your Velor.</Text>
          <Text style={s.passkey}>Passkey sign-in arrives with buyer launch — browse without an account</Text>

          {/* Passport card */}
          <Pressable style={s.passcard} onPress={() => nav.navigate('Passport')}>
            <View style={s.passIcon}>
              <Ionicons name="earth" size={22} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.passT}>Your Passport</Text>
              <Text style={s.passS}>Buy from a country — its stamp lands on delivery</Text>
            </View>
            <Text style={s.passN}>0</Text>
          </Pressable>

          <Text style={[s.kickDim, { marginTop: 28 }]}>ACCOUNT</Text>
        </View>

        <View style={{ marginTop: 4 }}>
          {rows.map((r) => (
            <Pressable key={r.title} style={s.row} onPress={r.onPress}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.rowT}>{r.title}</Text>
                <Text style={s.rowS} numberOfLines={1}>
                  {r.sub}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.dim} />
            </Pressable>
          ))}
        </View>

        {/* SELL ON VELOR card */}
        <View style={s.sell}>
          <Text style={s.sellK}>SELL ON VELOR</Text>
          <Text style={s.sellT}>Open your country's channel.</Text>
          <Text style={s.sellS}>
            One founding seat per country — the badge and the full Pro tier, free for life.
          </Text>
          <Pressable style={s.sellBtn} onPress={() => nav.navigate('Sell')}>
            <Text style={s.sellBtnTx}>See what you'd earn</Text>
          </Pressable>
        </View>

        <Text style={s.build}>Velor — the world's shopping channel · app preview build</Text>
      </ScrollView>
      <Chrome />
    </View>
  )
}

const s = StyleSheet.create({
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  h1: { fontFamily: F.serifLight, fontSize: 30, color: C.text, marginTop: 8 },
  passkey: { fontFamily: F.body, fontSize: 11.5, color: C.dim, marginTop: 6 },
  passcard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    backgroundColor: 'rgba(255,107,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.35)',
    borderRadius: 18,
    padding: 14,
  },
  passIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passT: { fontFamily: F.bodySemi, fontSize: 14, color: C.text },
  passS: { fontFamily: F.body, fontSize: 11.5, color: C.dim, marginTop: 2 },
  passN: { fontFamily: F.display, fontSize: 26, color: C.accent },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rowT: { fontFamily: F.bodySemi, fontSize: 13.5, color: C.text },
  rowS: { fontFamily: F.body, fontSize: 11.5, color: C.dim, marginTop: 3 },
  sell: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(255,107,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.18)',
  },
  sellK: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.accent },
  sellT: { fontFamily: F.serifLight, fontSize: 22, color: C.text, marginTop: 10 },
  sellS: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: C.mut, marginTop: 8 },
  sellBtn: {
    marginTop: 16,
    backgroundColor: C.accent,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  sellBtnTx: { fontFamily: F.displayMed, fontSize: 13, color: '#160a00' },
  build: {
    fontFamily: F.body,
    fontSize: 10.5,
    color: C.dim,
    textAlign: 'center',
    marginTop: 30,
  },
})
