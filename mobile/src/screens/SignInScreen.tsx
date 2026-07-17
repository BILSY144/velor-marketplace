import React, { useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { TextInput } from '../ui/TI'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { signInWithPassword, requestPasswordReset } from '../api'
import { useSession } from '../store'
import {
  biometricsAvailable,
  setFaceIdEnabled,
  unlockWithBiometrics,
  isFaceIdEnabled,
  saveCredentials,
} from '../biometrics'
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
  const [bioOffer, setBioOffer] = useState<string | null>(null)
  const [bioPreview, setBioPreview] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

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
        // Face ID already on? Refresh the keychain credentials so the
        // automatic sign-in always uses the latest password.
        if (await isFaceIdEnabled()) {
          await saveCredentials(email.trim().toLowerCase(), password)
          nav.goBack()
          return
        }
        // Offer Face ID / fingerprint before leaving — William's standing
        // requirement: biometric sign-in with password as the backup.
        const bio = await biometricsAvailable()
        if (bio.available) {
          setBioOffer(bio.label)
          setBioPreview(bio.passcodePreview)
        } else nav.goBack()
      } else {
        setError('That email and password did not match. Passwords are case-sensitive.')
      }
    } catch {
      setError('Could not reach Velor — check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function sendReset() {
    if (busy || !email.trim()) {
      setError('Enter your email above first — the reset link goes there.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await requestPasswordReset(email.trim().toLowerCase())
      setForgotSent(true)
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

          <Pressable onPress={() => setForgot(true)} style={{ marginTop: 14 }}>
            <Dim style={{ textAlign: 'center', fontSize: 12 }}>
              Forgot your password? <Text style={{ color: C.accent }}>Reset by email</Text>
            </Dim>
          </Pressable>

          {forgot ? (
            <View style={s.panel}>
              {forgotSent ? (
                <>
                  <Ionicons name="mail-unread-outline" size={18} color={C.green} />
                  <Text style={s.panelT}>Check your email</Text>
                  <Dim style={{ fontSize: 11.5, lineHeight: 17, textAlign: 'center' }}>
                    If an account exists for {email.trim() || 'that address'}, a reset link is on
                    its way — it works for one hour. Set the new password, then sign in here.
                  </Dim>
                </>
              ) : (
                <>
                  <Text style={s.panelT}>Reset by email</Text>
                  <Dim style={{ fontSize: 11.5, lineHeight: 17, textAlign: 'center' }}>
                    We email a one-hour reset link to the address above — verified by the link
                    itself, nothing changes until you click it.
                  </Dim>
                  <Pressable style={s.panelBtn} onPress={sendReset}>
                    <Text style={s.panelBtnTx}>{busy ? 'Sending…' : 'Email me the link'}</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : null}

          {/* Face ID enable offer — after a successful password sign-in */}
          {bioOffer ? (
            <View style={s.bioCard}>
              <Ionicons name="scan-circle-outline" size={22} color={C.accent} />
              <Text style={s.panelT}>Sign in with {bioOffer} next time?</Text>
              <Dim style={{ fontSize: 11.5, lineHeight: 17, textAlign: 'center' }}>
                {bioOffer} opens the app AND signs you in — no more passwords. Your credentials
                live in this phone's encrypted keychain, used only after your {bioOffer} passes,
                and are wiped the moment you turn this off or sign out.
                {bioPreview
                  ? ' Note: in this Expo Go preview, Apple shows your phone PASSCODE instead of the face prompt — true Face ID switches on in the full app build.'
                  : ''}
              </Dim>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Pressable
                  style={[s.panelBtn, { flex: 1 }]}
                  onPress={async () => {
                    // Prove the face right now — enabling is only real if the
                    // biometric actually fires and passes. Credentials go
                    // into the hardware keychain so Face ID alone signs in
                    // from here on — no more passwords.
                    const ok = await unlockWithBiometrics()
                    if (ok) {
                      await setFaceIdEnabled(true)
                      await saveCredentials(email.trim().toLowerCase(), password)
                      nav.goBack()
                    }
                  }}
                >
                  <Text style={s.panelBtnTx}>Enable {bioOffer}</Text>
                </Pressable>
                <Pressable
                  style={[s.panelBtn, s.panelGhost, { flex: 1 }]}
                  onPress={() => nav.goBack()}
                >
                  <Text style={[s.panelBtnTx, { color: C.text }]}>Not now</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

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
  panel: {
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 16,
  },
  panelT: { fontFamily: F.bodySemi, fontSize: 13.5, color: C.text },
  panelBtn: {
    marginTop: 10,
    backgroundColor: C.accent,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  panelGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  panelBtnTx: { fontFamily: F.displayMed, fontSize: 12.5, color: '#160a00' },
  bioCard: {
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: 'rgba(255,107,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.35)',
    borderRadius: 18,
    padding: 16,
  },
})
