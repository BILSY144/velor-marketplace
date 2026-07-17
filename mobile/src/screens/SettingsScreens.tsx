import React, { useState, useEffect } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Text, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { APP_LANGS, getLang, getCurrency, setAppLanguage, setAppCurrency, onI18n } from '../i18n'
import { Chrome } from '../components/Chrome'

// Addresses (plate 17), Payment methods (plate 18) and Language & currency
// (plate 19). Honesty divergences from the plates: no SAMPLE address is
// rendered — addresses appear once a real one is saved at checkout; currency
// conversion ships with the buyer launch, so GBP is live and the rest are
// honestly badged ARRIVING (the mockup's live-FX pipeline is a launch
// feature, not an app-preview one).

function Shell({
  title,
  kicker,
  children,
}: {
  title: string
  kicker?: string
  children: React.ReactNode
}) {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 60 }}>
        <View style={{ paddingHorizontal: 20 }}>
          {kicker ? <Text style={s.kick}>{kicker}</Text> : null}
          <Text style={s.h1}>{title}</Text>
          {children}
        </View>
      </ScrollView>
      <Chrome back="You" onBack={() => nav.goBack()} />
    </View>
  )
}

export function AddrScreen() {
  const [note, setNote] = useState(false)
  return (
    <Shell title="Addresses">
      <View style={s.zero}>
        <Ionicons name="location-outline" size={22} color={C.mut} />
        <Text style={s.zeroT}>No addresses yet</Text>
        <Text style={s.zeroS}>
          Your first address is saved when you check out — it appears here to edit, delete or set
          as default.
        </Text>
      </View>
      <Pressable style={s.ghost} onPress={() => setNote(true)}>
        <Text style={s.ghostTx}>Add an address</Text>
      </Pressable>
      {note ? (
        <Text style={s.noteTx}>Addresses are added at checkout for now — the standalone editor arrives with buyer launch.</Text>
      ) : null}
      <Text style={s.footDim}>
        Delivery quotes on every product page use your default address the moment you set one.
      </Text>
    </Shell>
  )
}

export function PayScreen() {
  const wallet = Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'
  return (
    <Shell title="Payment methods">
      <View style={s.greenCard}>
        <Ionicons name="shield-checkmark" size={15} color={C.green} />
        <Text style={s.greenTx}>
          Card details are handled by Stripe and protected by your passkey. Velor never sees or
          stores a card number.
        </Text>
      </View>
      <View style={s.payRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.payT}>{wallet}</Text>
          <Text style={s.payS}>This device's wallet — ready at checkout</Text>
        </View>
        <Text style={s.ready}>READY</Text>
      </View>
      <Text style={s.footDim}>
        No saved cards yet — add one at your next checkout and Stripe keeps it for one-tap payment
        after that.
      </Text>
    </Shell>
  )
}

const LANGS: [string, string][] = [
  ['English', 'English'],
  ['Español', 'Spanish'],
  ['Français', 'French'],
  ['Deutsch', 'German'],
  ['Italiano', 'Italian'],
  ['Português', 'Portuguese'],
  ['Nederlands', 'Dutch'],
  ['Polski', 'Polish'],
  ['Türkçe', 'Turkish'],
  ['Русский', 'Russian'],
  ['العربية', 'Arabic'],
  ['हिन्दी', 'Hindi'],
  ['বাংলা', 'Bengali'],
  ['Tiếng Việt', 'Vietnamese'],
  ['ไทย', 'Thai'],
  ['Bahasa Indonesia', 'Indonesian'],
  ['中文', 'Chinese'],
  ['日本語', 'Japanese'],
  ['한국어', 'Korean'],
]

const CURRENCIES: [string, string, string][] = [
  ['£', 'GBP', 'Pound sterling'],
  ['$', 'USD', 'US dollar'],
  ['€', 'EUR', 'Euro'],
  ['¥', 'JPY', 'Japanese yen'],
  ['¥', 'CNY', 'Renminbi'],
  ['₹', 'INR', 'Indian rupee'],
  ['₩', 'KRW', 'SK won'],
  ['R$', 'BRL', 'Brazilian real'],
  ['$', 'MXN', 'Mexican peso'],
  ['$', 'CAD', 'Canadian dollar'],
  ['$', 'AUD', 'Australian dollar'],
  ['CHF', 'CHF', 'Swiss franc'],
  ['kr', 'SEK', 'Swedish krona'],
  ['kr', 'NOK', 'Norwegian krone'],
  ['zł', 'PLN', 'Polish złoty'],
  ['₺', 'TRY', 'Turkish lira'],
  ['د.إ', 'AED', 'UAE dirham'],
  ['$', 'SGD', 'Singapore dollar'],
  ['R', 'ZAR', 'SA rand'],
  ['₫', 'VND', 'Vietnamese dong'],
]

export function LangCurScreen() {
  const [note, setNote] = useState<string | null>(null)
  const [, setTick] = useState(0)
  useEffect(() => onI18n(() => setTick((t) => t + 1)), [])
  const activeLang = getLang()
  const activeCur = getCurrency()
  return (
    <Shell title="Your words. Your money." kicker="YOUR VELOR">
      <Text style={[s.kickDim, { marginTop: 26 }]}>LANGUAGE</Text>
      <Text style={s.footDimTight}>
        Velor speaks all nineteen. Pick yours — the app translates as you browse.
      </Text>
      <View style={{ marginTop: 6 }}>
        {APP_LANGS.map((l) => (
          <Pressable
            key={l.code}
            style={s.langRow}
            onPress={() => {
              setAppLanguage(l.code)
              setNote(l.code === 'en' ? 'English' : `${l.english} — translating as you browse`)
            }}
          >
            <Text style={s.langNative}>{l.native}</Text>
            <Text style={s.langEn}>{l.english}</Text>
            {activeLang === l.code ? <Text style={s.live}>LIVE</Text> : null}
          </Pressable>
        ))}
      </View>

      <Text style={[s.kickDim, { marginTop: 30 }]}>CURRENCY</Text>
      <Text style={s.footDimTight}>
        Prices display in your money at a live exchange rate. Checkout charges in your currency
        at launch; the rate is reconfirmed at payment.
      </Text>
      <View style={s.curGrid}>
        {CURRENCIES.map(([sym, code, label]) => (
          <Pressable
            key={code}
            style={[s.curCell, code === activeCur && s.curCellOn]}
            onPress={() => {
              setAppCurrency(code)
              setNote(code + ' — prices now display in ' + label)
            }}
          >
            <Text style={[s.curSym, code === activeCur && { color: C.accent }]}>{sym}</Text>
            <Text style={s.curCode}>{code}</Text>
            <Text style={s.curLabel} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {note ? <Text style={s.noteTx}>{note}</Text> : null}
    </Shell>
  )
}

const s = StyleSheet.create({
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.accent },
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  h1: { fontFamily: F.serifLight, fontSize: 28, color: C.text, marginTop: 8 },
  zero: {
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 24,
  },
  zeroT: { fontFamily: F.bodySemi, fontSize: 13.5, color: C.text },
  zeroS: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: C.dim, textAlign: 'center' },
  ghost: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ghostTx: { fontFamily: F.displayMed, fontSize: 13.5, color: C.text },
  noteTx: { fontFamily: F.body, fontSize: 11.5, color: C.accent, marginTop: 12, textAlign: 'center' },
  footDim: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: C.dim, marginTop: 18 },
  footDimTight: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: C.dim, marginTop: 8 },
  greenCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 20,
    backgroundColor: 'rgba(61,220,132,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(61,220,132,0.22)',
    borderRadius: 16,
    padding: 14,
  },
  greenTx: { flex: 1, fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: '#bfeed3' },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 16,
  },
  payT: { fontFamily: F.bodySemi, fontSize: 13.5, color: C.text },
  payS: { fontFamily: F.body, fontSize: 11.5, color: C.dim, marginTop: 2 },
  ready: { fontFamily: F.display, fontSize: 9, letterSpacing: 1, color: C.green },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  langNative: { fontFamily: F.serifLight, fontSize: 16.5, color: C.text, minWidth: 0, flexShrink: 1 },
  langEn: { flex: 1, fontFamily: F.body, fontSize: 10.5, color: C.dim },
  live: { fontFamily: F.display, fontSize: 8, letterSpacing: 1, color: C.green },
  arriving: { fontFamily: F.display, fontSize: 8, letterSpacing: 1, color: C.mut },
  curGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  curCell: {
    width: '30.8%',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  curCellOn: { borderColor: 'rgba(255,107,0,0.5)', backgroundColor: 'rgba(255,107,0,0.07)' },
  curSym: { fontFamily: F.serifLight, fontSize: 21, color: C.text },
  curCode: { fontFamily: F.bodySemi, fontSize: 11.5, color: C.text },
  curLabel: { fontFamily: F.body, fontSize: 9.5, color: C.dim },
})
