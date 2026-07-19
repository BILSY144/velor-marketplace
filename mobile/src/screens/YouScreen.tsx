import React from 'react'
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Text } from '../ui/T'
import { TextInput } from '../ui/TI'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { useFavs, useFollows, useSession } from '../store'
import {
  signInWithPassword,
  signOutRemote,
  requestPasswordReset,
  fetchSellerPayouts,
  fetchSellerOrders,
  fetchSellerProducts,
  fetchSubscription,
} from '../api'
import {
  biometricsAvailable,
  isFaceIdEnabled,
  setFaceIdEnabled,
  unlockWithBiometrics,
  clearCredentials,
  saveCredentials,
} from '../biometrics'
import { Dim } from '../ui'
import { Chrome } from '../components/Chrome'

// You — the app's front door and identity hub, in three honest states:
//
// SIGNED OUT — the door. One inline sign-in for EVERY velorcommerce.store
// account (William, 2026-07-19: one login, buyer AND seller access). No
// invented registration path: buyer accounts are created with a first
// order (email activation), sellers apply through /apply.
//
// SIGNED IN, BUYER — the full buyer hub (passport, orders, favourites,
// addresses, payments, language, Ask Velor, legal, Face ID) plus a small
// "Become a seller" pill. Nothing seller-facing beyond that pill.
//
// SIGNED IN, SELLER — everything the buyer gets, unchanged, PLUS the
// channel layer on top: live channel card (real escrow, tier and pipeline
// from the dashboard endpoints) and the studio rows into Dashboard, New
// listing, Orders, Payouts, Go live and API keys. Layered, never a mode
// toggle — an approved seller keeps full buyer access (William's standing
// requirement, 2026-07-19).
//
// Honesty rules kept: no fake numbers (loading shows an em dash), the
// founding live-broadcast perk is never pitched as available to all, and
// every sub-line reflects real state.

// ---------------------------------------------------------------------------
// The member card — one account, both sides of the counter. Signed out it
// is the promise; signed in it is yours, with the access chips you hold.
// ---------------------------------------------------------------------------
function MemberCard({
  name,
  email,
  seller,
  founding,
}: {
  name?: string | null
  email?: string | null
  seller: boolean
  founding: boolean
}) {
  return (
    <LinearGradient
      colors={['#1b1b22', '#101014', '#0b0b0e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={mc.card}
    >
      {/* Accent thread along the top edge — the channel's on-air line */}
      <LinearGradient
        colors={['rgba(255,107,0,0)', C.accent, 'rgba(255,107,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={mc.thread}
      />
      <View style={mc.topRow}>
        <Text style={mc.wordmark}>VELOR</Text>
        <View style={mc.oneAcct}>
          <View style={mc.liveDot} />
          <Text style={mc.oneAcctTx}>ONE ACCOUNT</Text>
        </View>
      </View>

      <Text style={mc.holder} numberOfLines={1}>
        {name || 'Your name here'}
      </Text>
      <Text style={mc.holderSub} numberOfLines={1}>
        {email || 'Buy from 190 countries. Sell to all of them.'}
      </Text>

      <View style={mc.chipRow}>
        <View style={[mc.chip, mc.chipOn]}>
          <Ionicons name="bag-outline" size={11} color={C.text} />
          <Text style={mc.chipTx}>BUYER</Text>
        </View>
        <View style={[mc.chip, seller ? mc.chipSeller : null]}>
          <Ionicons
            name="storefront-outline"
            size={11}
            color={seller ? C.accent : C.dim}
          />
          <Text style={[mc.chipTx, seller ? { color: C.accent } : { color: C.dim }]}>
            SELLER
          </Text>
        </View>
        {founding ? (
          <View style={[mc.chip, mc.chipSeller]}>
            <Ionicons name="ribbon-outline" size={11} color={C.accent} />
            <Text style={[mc.chipTx, { color: C.accent }]}>FOUNDING</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <Text style={mc.brand}>THE WORLD'S SHOPPING CHANNEL</Text>
      </View>
    </LinearGradient>
  )
}

const mc = StyleSheet.create({
  card: {
    marginTop: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.28)',
    padding: 18,
    overflow: 'hidden',
  },
  thread: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { fontFamily: F.display, fontSize: 15, letterSpacing: 5, color: C.text },
  oneAcct: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  oneAcctTx: { fontFamily: F.displayMed, fontSize: 8.5, letterSpacing: 2, color: C.accent },
  holder: { fontFamily: F.serifLight, fontSize: 23, color: C.text, marginTop: 22 },
  holderSub: { fontFamily: F.body, fontSize: 11, color: C.mut, marginTop: 4 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: 'rgba(255,255,255,0.06)' },
  chipSeller: { borderColor: 'rgba(255,107,0,0.45)', backgroundColor: 'rgba(255,107,0,0.1)' },
  chipTx: { fontFamily: F.displayMed, fontSize: 8.5, letterSpacing: 1.4, color: C.text },
  brand: { fontFamily: F.displayMed, fontSize: 6.5, letterSpacing: 1.2, color: C.dim },
})

// ---------------------------------------------------------------------------
// A labelled input with a focus ring — the door's form language.
// ---------------------------------------------------------------------------
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  autoComplete,
  show,
  onToggleShow,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder: string
  secure?: boolean
  keyboardType?: 'email-address'
  autoComplete?: 'email' | 'current-password'
  show?: boolean
  onToggleShow?: () => void
}) {
  const [focus, setFocus] = React.useState(false)
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={[fd.label, focus && { color: C.accent }]}>{label}</Text>
      <View style={[fd.box, focus && fd.boxFocus]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          secureTextEntry={secure && !show}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          placeholderTextColor={C.dim}
          style={fd.input}
        />
        {onToggleShow ? (
          <Pressable onPress={onToggleShow} hitSlop={10}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.mut} />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const fd = StyleSheet.create({
  label: {
    fontFamily: F.display,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: C.mut,
    marginBottom: 8,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  boxFocus: { borderColor: 'rgba(255,107,0,0.55)', backgroundColor: 'rgba(255,107,0,0.05)' },
  input: {
    flex: 1,
    color: C.text,
    fontFamily: F.body,
    fontSize: 14.5,
    paddingVertical: 15,
  },
})

// ---------------------------------------------------------------------------
// SIGNED OUT — the door. Inline, cinematic, one login for both sides.
// ---------------------------------------------------------------------------
function Door() {
  const nav = useNavigation<any>()
  const setSession = useSession((s) => s.set)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [show, setShow] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [bioOffer, setBioOffer] = React.useState<string | null>(null)
  const [bioPreview, setBioPreview] = React.useState(false)
  const [pendingCreds, setPendingCreds] = React.useState<{ e: string; p: string } | null>(null)
  const [forgot, setForgot] = React.useState(false)
  const [forgotSent, setForgotSent] = React.useState(false)

  async function submit() {
    if (busy) return
    if (!email.trim() || !password) {
      setError('Enter your email and password — the same ones as velorcommerce.store.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const e = email.trim().toLowerCase()
      const user = await signInWithPassword(e, password)
      if (user) {
        // Face ID already armed? Refresh the keychain silently and finish.
        if (await isFaceIdEnabled()) {
          await saveCredentials(e, password)
          setSession(user)
          return
        }
        const bio = await biometricsAvailable()
        if (bio.available) {
          // Hold the session reveal until the Face ID question is answered,
          // so the offer isn't unmounted by the state switch.
          setPendingCreds({ e, p: password })
          setBioOffer(bio.label)
          setBioPreview(bio.passcodePreview)
          setSession(user)
        } else {
          setSession(user)
        }
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
    if (busy) return
    if (!email.trim()) {
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
    <View style={{ paddingHorizontal: 20 }}>
      <Text style={dr.kick}>YOU</Text>
      <Text style={dr.h1}>Step inside.</Text>
      <Dim style={{ marginTop: 10, lineHeight: 19 }}>
        One sign-in for both sides of the counter — shop the world, or sell to it. The same
        account as velorcommerce.store.
      </Dim>

      <MemberCard seller={false} founding={false} />

      <Field
        label="EMAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        label="PASSWORD"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secure
        autoComplete="current-password"
        show={show}
        onToggleShow={() => setShow(!show)}
      />

      {error ? <Text style={dr.err}>{error}</Text> : null}

      <Pressable style={[dr.cta, busy && { opacity: 0.7 }]} onPress={submit}>
        <Text style={dr.ctaTx}>{busy ? 'Signing in…' : 'Sign in'}</Text>
        <Ionicons name="arrow-forward" size={16} color="#160a00" />
      </Pressable>

      <Pressable onPress={() => setForgot(true)} style={{ marginTop: 14, minHeight: 30 }}>
        <Dim style={{ textAlign: 'center', fontSize: 12 }}>
          Forgot your password? <Text style={{ color: C.accent }}>Reset by email</Text>
        </Dim>
      </Pressable>

      {forgot ? (
        <View style={dr.panel}>
          {forgotSent ? (
            <>
              <Ionicons name="mail-unread-outline" size={18} color={C.green} />
              <Text style={dr.panelT}>Check your email</Text>
              <Dim style={{ fontSize: 11.5, lineHeight: 17, textAlign: 'center' }}>
                If an account exists for {email.trim() || 'that address'}, a reset link is on its
                way — it works for one hour. Set the new password, then sign in here.
              </Dim>
            </>
          ) : (
            <>
              <Text style={dr.panelT}>Reset by email</Text>
              <Dim style={{ fontSize: 11.5, lineHeight: 17, textAlign: 'center' }}>
                We email a one-hour reset link to the address above — verified by the link
                itself, nothing changes until you click it.
              </Dim>
              <Pressable style={dr.panelBtn} onPress={sendReset}>
                <Text style={dr.panelBtnTx}>{busy ? 'Sending…' : 'Email me the link'}</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      {/* What the one account opens — both doors, plainly */}
      <View style={dr.doors}>
        <View style={dr.door}>
          <Ionicons name="bag-outline" size={17} color={C.text} />
          <Text style={dr.doorT}>Buying</Text>
          <Text style={dr.doorS}>
            190 countries, escrow-protected — money moves only when your parcel lands
          </Text>
        </View>
        <View style={[dr.door, dr.doorSell]}>
          <Ionicons name="storefront-outline" size={17} color={C.accent} />
          <Text style={dr.doorT}>Selling</Text>
          <Text style={dr.doorS}>
            Your dashboard, listings and payouts — your country's channel, in your pocket
          </Text>
        </View>
      </View>

      <View style={dr.newRow}>
        <Ionicons name="sparkles-outline" size={15} color={C.mut} />
        <Dim style={{ flex: 1, fontSize: 11.5, lineHeight: 17 }}>
          New to Velor? A buyer account is created with your first order — the activation link
          arrives by email. Sellers apply in five minutes.
        </Dim>
      </View>

      <Pressable
        onPress={() => nav.navigate('Apply', {})}
        style={{ marginTop: 16, minHeight: 30 }}
      >
        <Dim style={{ textAlign: 'center', fontSize: 12 }}>
          Want to sell? <Text style={{ color: C.accent }}>Apply to open your channel →</Text>
        </Dim>
      </Pressable>

      {/* Face ID enable offer — shown right after a successful sign-in */}
      {bioOffer && pendingCreds ? (
        <View style={dr.bioCard}>
          <Ionicons name="scan-circle-outline" size={22} color={C.accent} />
          <Text style={dr.panelT}>Sign in with {bioOffer} next time?</Text>
          <Dim style={{ fontSize: 11.5, lineHeight: 17, textAlign: 'center' }}>
            {bioOffer} opens the app AND signs you in — no more passwords. Your credentials live
            in this phone's encrypted keychain, used only after your {bioOffer} passes, and are
            wiped the moment you turn this off or sign out.
            {bioPreview
              ? ' Note: in this Expo Go preview, Apple shows your phone PASSCODE instead of the face prompt — true Face ID switches on in the full app build.'
              : ''}
          </Dim>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable
              style={[dr.panelBtn, { flex: 1 }]}
              onPress={async () => {
                const ok = await unlockWithBiometrics()
                if (ok) {
                  await setFaceIdEnabled(true)
                  await saveCredentials(pendingCreds.e, pendingCreds.p)
                }
                setBioOffer(null)
                setPendingCreds(null)
              }}
            >
              <Text style={dr.panelBtnTx}>Enable {bioOffer}</Text>
            </Pressable>
            <Pressable
              style={[dr.panelBtn, dr.panelGhost, { flex: 1 }]}
              onPress={() => {
                setBioOffer(null)
                setPendingCreds(null)
              }}
            >
              <Text style={[dr.panelBtnTx, { color: C.text }]}>Not now</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const dr = StyleSheet.create({
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  h1: { fontFamily: F.serifLight, fontSize: 34, color: C.text, marginTop: 8 },
  err: {
    fontFamily: F.body,
    fontSize: 12,
    lineHeight: 17,
    color: C.red,
    marginTop: 14,
    textAlign: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    backgroundColor: C.accent,
    borderRadius: 999,
    paddingVertical: 16,
  },
  ctaTx: { fontFamily: F.display, fontSize: 14, color: '#160a00' },
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
  doors: { flexDirection: 'row', gap: 10, marginTop: 26 },
  door: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 14,
  },
  doorSell: {
    backgroundColor: 'rgba(255,107,0,0.06)',
    borderColor: 'rgba(255,107,0,0.22)',
  },
  doorT: { fontFamily: F.bodySemi, fontSize: 13, color: C.text, marginTop: 8 },
  doorS: { fontFamily: F.body, fontSize: 10.5, lineHeight: 15, color: C.mut, marginTop: 4 },
  newRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 13,
  },
  bioCard: {
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    backgroundColor: 'rgba(255,107,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.35)',
    borderRadius: 18,
    padding: 16,
  },
})

// ---------------------------------------------------------------------------
// SELLER LAYER — the channel card and the studio rows. Real numbers only;
// anything still loading shows an em dash, never an invented figure.
// ---------------------------------------------------------------------------
function SellerChannel() {
  const nav = useNavigation<any>()
  const sub = useQuery({ queryKey: ['sub'], queryFn: fetchSubscription })
  const payouts = useQuery({ queryKey: ['sellerPayouts'], queryFn: fetchSellerPayouts })
  const orders = useQuery({ queryKey: ['sellerOrders'], queryFn: fetchSellerOrders })
  const products = useQuery({ queryKey: ['sellerProducts'], queryFn: fetchSellerProducts })

  const tier = (sub.data?.tier as string) ?? null
  const founding = Boolean((sub.data as any)?.foundingBadge)
  const listingLimit = (sub.data as any)?.listingLimit as number | null | undefined

  const money = (n?: number) =>
    n === undefined ? '—' : `£${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`

  const os = orders.data
  const nToShip = os ? os.filter((o) => o.status === 'PENDING' || o.status === 'PAID' || o.status === 'PROCESSING').length : undefined
  const nTransit = os ? os.filter((o) => o.status === 'SHIPPED').length : undefined
  const nListings = products.data?.length

  const tierLabel = !tier
    ? '—'
    : founding
      ? 'PRO · FOUNDING — free for life'
      : tier === 'PRO'
        ? 'PRO'
        : 'STARTER'

  const ordersSub =
    nToShip === undefined
      ? 'Your pipeline, order by order'
      : nToShip === 0 && (nTransit ?? 0) === 0
        ? 'No open orders — your pipeline is clear'
        : `${nToShip} to ship · ${nTransit ?? 0} in transit`

  const listingsSub =
    nListings === undefined
      ? 'List a new product on your channel'
      : listingLimit
        ? `${nListings} of ${listingLimit} listings used — add another`
        : `${nListings} live listing${nListings === 1 ? '' : 's'} — add another`

  const pro = founding || tier === 'PRO'

  const studio: {
    icon: keyof typeof Ionicons.glyphMap
    title: string
    sub: string
    route: string
    locked?: boolean
  }[] = [
    {
      icon: 'stats-chart-outline',
      title: 'Dashboard',
      sub: 'Escrow, pipeline, listings — the whole channel at a glance',
      route: 'Dash',
    },
    {
      icon: 'add-circle-outline',
      title: 'New listing',
      sub: listingsSub,
      route: 'NewListing',
    },
    {
      icon: 'cube-outline',
      title: 'Orders',
      sub: ordersSub,
      route: 'SellerOrders',
    },
    {
      icon: 'wallet-outline',
      title: 'Payouts',
      sub: payouts.data
        ? `£${payouts.data.pendingEscrow.toLocaleString('en-GB', { maximumFractionDigits: 0 })} in escrow · ${payouts.data.holdLabel}`
        : 'Escrow releases after delivery is confirmed',
      route: 'Payouts',
    },
    {
      icon: 'videocam-outline',
      title: 'Go live',
      sub: founding
        ? 'Your founding privilege — broadcast on your country’s channel'
        : 'Founding-seller privilege — not part of any standard plan',
      route: 'GoLive',
      locked: !founding,
    },
    {
      icon: 'key-outline',
      title: 'API keys',
      sub: pro ? 'Connect your own tools to your store' : 'Pro tool — upgrade to unlock',
      route: 'ApiKeys',
      locked: !pro,
    },
  ]

  return (
    <>
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={sc.kick}>YOUR CHANNEL</Text>

        {/* Channel status card */}
        <Pressable style={sc.card} onPress={() => nav.navigate('Dash')}>
          <View style={sc.cardTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View style={sc.liveDot} />
              <Text style={sc.onAir}>ON AIR</Text>
            </View>
            <View style={[sc.tierPill, founding && sc.tierPillFounding]}>
              <Text style={[sc.tierTx, founding && { color: C.accent }]}>{tierLabel}</Text>
            </View>
          </View>

          <View style={sc.statRow}>
            <View style={{ flex: 1 }}>
              <Text style={sc.statN}>{money(payouts.data?.pendingEscrow)}</Text>
              <Text style={sc.statL}>IN ESCROW</Text>
            </View>
            <View style={sc.statDiv} />
            <View style={{ flex: 1 }}>
              <Text style={sc.statN}>{money(payouts.data?.lifetimePaidOut)}</Text>
              <Text style={sc.statL}>PAID OUT</Text>
            </View>
            <View style={sc.statDiv} />
            <View style={{ flex: 1 }}>
              <Text style={sc.statN}>{nListings === undefined ? '—' : nListings}</Text>
              <Text style={sc.statL}>LISTINGS</Text>
            </View>
          </View>

          <View style={sc.cardFoot}>
            <Text style={sc.cardFootTx}>Open the dashboard</Text>
            <Ionicons name="arrow-forward" size={13} color={C.accent} />
          </View>
        </Pressable>

        <Text style={[sc.kick, { marginTop: 24, color: C.mut }]}>SELLER STUDIO</Text>
      </View>

      <View style={{ marginTop: 4 }}>
        {studio.map((r) => (
          <Pressable key={r.title} style={sc.row} onPress={() => nav.navigate(r.route)}>
            <View style={[sc.rowIcon, r.locked && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name={r.icon} size={17} color={r.locked ? C.mut : C.accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={sc.rowT}>{r.title}</Text>
              <Text style={sc.rowS} numberOfLines={1}>
                {r.sub}
              </Text>
            </View>
            <Ionicons
              name={r.locked ? 'lock-closed' : 'chevron-forward'}
              size={r.locked ? 14 : 16}
              color={C.dim}
            />
          </Pressable>
        ))}
      </View>
    </>
  )
}

const sc = StyleSheet.create({
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.accent, marginTop: 28 },
  card: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
    backgroundColor: 'rgba(255,107,0,0.06)',
    padding: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  onAir: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2, color: C.accent },
  tierPill: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tierPillFounding: {
    borderColor: 'rgba(255,107,0,0.5)',
    backgroundColor: 'rgba(255,107,0,0.1)',
  },
  tierTx: { fontFamily: F.displayMed, fontSize: 8.5, letterSpacing: 1.2, color: C.text },
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  statDiv: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 12 },
  statN: { fontFamily: F.display, fontSize: 19, color: C.text },
  statL: { fontFamily: F.displayMed, fontSize: 7.5, letterSpacing: 1.4, color: C.mut, marginTop: 4 },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,0,0.16)',
  },
  cardFootTx: { fontFamily: F.displayMed, fontSize: 11.5, color: C.accent },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,107,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowT: { fontFamily: F.bodySemi, fontSize: 13.5, color: C.text },
  rowS: { fontFamily: F.body, fontSize: 11.5, color: C.dim, marginTop: 3 },
})

// ---------------------------------------------------------------------------
// The screen.
// ---------------------------------------------------------------------------
export default function YouScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const favs = useFavs((s) => s.ids)
  const follows = useFollows((s) => s.ids)
  const user = useSession((s) => s.user)
  const ready = useSession((s) => s.ready)
  const setSession = useSession((s) => s.set)
  const isSeller = Boolean(user?.sellerId)
  // Same query key as SellerChannel/DashScreen — react-query dedupes, so the
  // member card's FOUNDING chip rides on the one subscription fetch.
  const subQ = useQuery({ queryKey: ['sub'], queryFn: fetchSubscription, enabled: isSeller })
  const founding = isSeller && Boolean((subQ.data as any)?.foundingBadge)
  const [bio, setBio] = React.useState<{ available: boolean; label: string; passcodePreview: boolean }>({
    available: false,
    label: 'Face ID',
    passcodePreview: false,
  })
  const [bioOn, setBioOn] = React.useState(false)

  React.useEffect(() => {
    biometricsAvailable().then(setBio)
    isFaceIdEnabled().then(setBioOn)
  }, [])

  const toggleBio = async () => {
    if (bioOn) {
      // Turning protection OFF requires the face that owns it — and wipes
      // the keychain credentials with it.
      const ok = await unlockWithBiometrics()
      if (!ok) return
      await setFaceIdEnabled(false)
      await clearCredentials()
      setBioOn(false)
    } else {
      const ok = await unlockWithBiometrics()
      if (!ok) return
      await setFaceIdEnabled(true)
      setBioOn(true)
    }
  }

  const signOut = () => {
    Promise.all([setFaceIdEnabled(false), clearCredentials()]).finally(() => {
      setBioOn(false)
      signOutRemote().finally(() => setSession(null))
    })
  }

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
      sub: 'Escrow-protected — your parcels land here',
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

  // Session still restoring on a cold start — hold the door for a beat so
  // a signed-in seller never sees the sign-in form flash past.
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={s.kickDim}>YOU</Text>
        <Dim style={{ marginTop: 10 }}>Opening your Velor…</Dim>
        <Chrome />
      </View>
    )
  }

  // -------------------------------------------------------------- signed out
  if (!user) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <Door />
          <Text style={s.build}>Velor — the world's shopping channel · app preview build</Text>
        </ScrollView>
        <Chrome />
      </KeyboardAvoidingView>
    )
  }

  // --------------------------------------------------------------- signed in
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 60 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kickDim}>YOU</Text>
          <Text style={s.h1}>{user.name ? user.name.split(' ')[0] : 'Your Velor.'}</Text>
          <View style={s.idRow}>
            <Text style={s.passkey}>Signed in · {user.email}</Text>
            <Pressable onPress={signOut} hitSlop={6}>
              <Text style={[s.passkey, { color: C.accent }]}>Sign out</Text>
            </Pressable>
          </View>

          <MemberCard
            name={user.name}
            email={user.email}
            seller={isSeller}
            founding={founding}
          />

          {/* Buyer only: the small door to the other side of the counter */}
          {!isSeller ? (
            <Pressable style={s.becomePill} onPress={() => nav.navigate('Sell')}>
              <Ionicons name="storefront-outline" size={13} color={C.accent} />
              <Text style={s.becomeTx}>Become a seller</Text>
              <Ionicons name="arrow-forward" size={12} color={C.accent} />
            </Pressable>
          ) : null}
        </View>

        {/* Seller layer — everything the buyer gets stays below, untouched */}
        {isSeller ? <SellerChannel /> : null}

        <View style={{ paddingHorizontal: 20 }}>
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

          {/* Face ID lock — visible, flippable, guarded by the face itself */}
          {bio.available ? (
            <Pressable style={s.bioRow} onPress={toggleBio}>
              <Ionicons name="scan-circle-outline" size={20} color={bioOn ? C.accent : C.mut} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowT}>{bio.label} lock</Text>
                <Text style={s.rowS}>
                  {bioOn
                    ? `On — ${bio.label} opens the app and signs you in`
                    : `Off — tap to require ${bio.label} when the app opens`}
                  {bio.passcodePreview ? ' · passcode stands in for Face ID in this preview' : ''}
                </Text>
              </View>
              <View style={[s.pillState, bioOn && s.pillStateOn]}>
                <Text style={[s.pillStateTx, bioOn && { color: C.accent }]}>
                  {bioOn ? 'ON' : 'OFF'}
                </Text>
              </View>
            </Pressable>
          ) : null}

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

        <Text style={s.build}>Velor — the world's shopping channel · app preview build</Text>
      </ScrollView>
      <Chrome />
    </View>
  )
}

const s = StyleSheet.create({
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  h1: { fontFamily: F.serifLight, fontSize: 30, color: C.text, marginTop: 8 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  passkey: { fontFamily: F.body, fontSize: 11.5, color: C.dim, marginTop: 6 },
  becomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.4)',
    backgroundColor: 'rgba(255,107,0,0.08)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  becomeTx: { fontFamily: F.displayMed, fontSize: 11.5, color: C.accent },
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
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 14,
  },
  pillState: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  pillStateOn: { borderColor: 'rgba(255,107,0,0.5)', backgroundColor: 'rgba(255,107,0,0.1)' },
  pillStateTx: { fontFamily: F.display, fontSize: 9.5, letterSpacing: 1, color: C.mut },
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
  build: {
    fontFamily: F.body,
    fontSize: 10.5,
    color: C.dim,
    textAlign: 'center',
    marginTop: 30,
  },
})
