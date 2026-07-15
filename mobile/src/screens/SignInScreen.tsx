import React, { useState } from 'react'
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { signInWithPassword } from '../api'
import { useSession } from '../store'
import { Dim, Btn } from '../ui'
import { Chrome } from '../components/Chrome'

// Seller sign-in — the same account as the website (NextAuth credentials),
// so an approved seller's dashboard, orders, payouts and listings go live
// in the app. Honest scope: this is the SELLER door; buyer passkey sign-in
// arrives with the 6 August launch. Claude never handles these credentials
// — the seller types their own, straight to the site over HTTPS.
export default function SignInScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const setSession = useSession((s) => s.set)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (busy) return
    if (!email.trim() || !password) {
      setError('Enter the email and password from your seller application.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const user = await signInWithPassword(email.trim().toLowerCase(), password)
      if (user) {
        setSession(user)
        nav.goBack()
      } else {
        setError('That email and password did not match. Passwords are case-sensitive.')
      }
    } catch {
      setError('Could not reach Velor — check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kick}>YOUR CHANNEL</Text>
          <Text style={s.h1}>Sign in.</Text>
          <Dim style={{ marginTop: 8, lineHeight: 18 }}>
            The same account as velorcommerce.store — your dashboard, orders, payouts and
            listings, live in the app.
          </Dim>

          <Text style={s.label}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={C.dim}
            style={s.input}
          />

          <Text style={s.label}>PASSWORD</Text>
          <View style={[s.input, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              autoCapitalize="none"
              autoComplete="current-password"
              placeholder="Your password"
              placeholderTextColor={C.dim}
              style={{ flex: 1, color: C.text, fontFamily: F.body, fontSize: 14, paddingVertical: 15 }}
            />
            <Pressable onPress={() => setShow(!show)} hitSlop={8}>
              <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.mut} />
            </Pressable>
          </View>

          {error ? <Text style={s.err}>{error}</Text> : null}

          <View style={{ marginTop: 22 }}>
            <Btn label={busy ? 'Signing in…' : 'Sign in'} onPress={submit} />
          </View>

          <View style={s.buyerNote}>
            <Ionicons name="finger-print-outline" size={15} color={C.mut} />
            <Dim style={{ flex: 1, fontSize: 11.5, lineHeight: 17 }}>
              Buying an account? Buyer sign-in arrives with launch on 6 August — passkeys, no
              password at all. This door is for approved sellers.
            </Dim>
          </View>

          <Pressable onPress={() => nav.navigate('Apply', {})} style={{ marginTop: 18 }}>
            <Dim style={{ textAlign: 'center', fontSize: 12 }}>
              Not a seller yet? <Text style={{ color: C.accent }}>Apply in five minutes →</Text>
            </Dim>
          </Pressable>
        </View>
      </ScrollView>
      <Chrome back="Back" onBack={() => nav.goBack()} />
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.accent },
  h1: { fontFamily: F.serifLight, fontSize: 30, color: C.text, marginTop: 8 },
  label: {
    fontFamily: F.display,
    fontSize: 10,
    letterSpacing: 1,
    color: C.mut,
    marginTop: 22,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: C.text,
    fontFamily: F.body,
    fontSize: 14,
  },
  err: {
    fontFamily: F.body,
    fontSize: 12,
    lineHeight: 17,
    color: C.red,
    marginTop: 14,
    textAlign: 'center',
  },
  buyerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 13,
  },
})
