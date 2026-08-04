import React, { useEffect, useMemo, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { Text } from '../ui/T'
import { TextInput } from '../ui/TI'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useStripe } from '@stripe/stripe-react-native'
import { F, flagUrl, useTheme, Palette } from '../theme'
import { fmt, getCurrency, useI18nTick } from '../i18n'
import { useCart, useSession, cartLinePrice } from '../store'
import { createPaymentIntent, confirmOrders, fetchShippingRates, validateDiscounts, SellerRateGroup, PaymentBreakdown, CheckoutAddress } from '../api'

// CHECKOUT — REAL, website-parity (2026-08-04). This is the same machinery
// the website's /checkout uses end to end:
//   POST /api/stripe/payment-intent  (server-priced: the server re-reads
//   every product/variant price, seller-set shipping — FREE unless the
//   seller set a rate — and the UK-only deemed-supplier VAT lane; nothing
//   the app sends is trusted for pricing)
//   → Stripe PaymentSheet (native; card details go to Stripe, never Velor)
//   → POST /api/orders (confirmation accelerator; the Stripe webhook is the
//   reliable path and both are idempotent per (paymentIntent, seller)).
// Escrow model unchanged: charged once by Velor, held per seller-parcel,
// released on confirmed delivery. The old "buying opens…" date gate is
// retired — the platform's checkout is live, so the app's is too.

const QUICK_COUNTRIES = ['GB', 'US', 'DE', 'FR', 'AU', 'CA'] as const

export default function CheckoutScreen() {
  useI18nTick()
  const t = useTheme()
  const s = styles(t)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const { items, total, clear } = useCart()
  const user = useSession((st) => st.user)
  const { initPaymentSheet, presentPaymentSheet } = useStripe()

  const [name, setName] = useState(user?.name ?? '')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [postcode, setPostcode] = useState('')
  const [country, setCountry] = useState('GB')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null>(null)
  const [paid, setPaid] = useState(false)

  const groups = useMemo(() => {
    const m = new Map<string, { cc?: string; count: number }>()
    for (const i of items) {
      const k = i.product.sellerName ?? 'Verified seller'
      const g = m.get(k) ?? { cc: i.product.originCountry, count: 0 }
      g.count += i.qty
      m.set(k, g)
    }
    return [...m.entries()]
  }, [items])

  const nItems = items.reduce((n, i) => n + i.qty, 0)
  const formOk = name.trim() && line1.trim() && city.trim() && postcode.trim() && country.trim().length === 2

  // --- Live delivery rates + auto-applied discounts (website parity) -------
  // Rates fetch on their own once the address is complete (debounced 800ms,
  // like the site), one group per seller; the buyer can pick between rates
  // when a seller offers more than one. Discounts apply THEMSELVES -- the
  // site has no code entry anywhere; sellers create codes that auto-attach.
  const [rateGroups, setRateGroups] = useState<SellerRateGroup[]>([])
  const [chosenRates, setChosenRates] = useState<Record<string, string>>({})
  const [ratesNote, setRatesNote] = useState<string | null>(null)
  const [autoDiscountGBP, setAutoDiscountGBP] = useState(0)
  const [autoDiscountLabels, setAutoDiscountLabels] = useState<string[]>([])

  useEffect(() => {
    if (!formOk || items.length === 0) return
    const h = setTimeout(async () => {
      try {
        setRatesNote(null)
        const gs = await fetchShippingRates({
          cartItems: items.map((i) => ({
            productId: i.product.id,
            variantId: i.variant?.id ?? null,
            sellerId: i.product.sellerId ?? '',
            quantity: i.qty,
            price: cartLinePrice(i),
          })),
          shippingAddress: { street1: line1.trim(), city: city.trim(), zip: postcode.trim(), country: country.trim().toUpperCase() },
        })
        setRateGroups(gs)
        setChosenRates((prev) => {
          const next: Record<string, string> = {}
          for (const g of gs) next[g.sellerId] = prev[g.sellerId] && g.rates.some((r) => r.rateId === prev[g.sellerId]) ? prev[g.sellerId] : g.rates[0]?.rateId ?? ''
          return next
        })
      } catch {
        setRatesNote('Could not fetch delivery rates for this address yet.')
      }
    }, 800)
    return () => clearTimeout(h)
  }, [formOk, line1, city, postcode, country, items])

  useEffect(() => {
    if (items.length === 0) { setAutoDiscountGBP(0); setAutoDiscountLabels([]); return }
    let alive = true
    ;(async () => {
      const bySeller = new Map<string, { productId: string; quantity: number; price: number }[]>()
      for (const i of items) {
        const sid = i.product.sellerId ?? ''
        if (!sid) continue
        const arr = bySeller.get(sid) ?? []
        arr.push({ productId: i.product.id, quantity: i.qty, price: cartLinePrice(i) })
        bySeller.set(sid, arr)
      }
      let total = 0
      const labels: string[] = []
      for (const [sid, its] of bySeller) {
        const r = await validateDiscounts(sid, its)
        total += r.totalDiscountGBP
        for (const a of r.applied) if (a.code || a.label) labels.push(a.code ?? a.label ?? '')
      }
      if (alive) { setAutoDiscountGBP(total); setAutoDiscountLabels(labels) }
    })()
    return () => { alive = false }
  }, [items])

  const pay = async () => {
    if (busy) return
    setError(null)
    if (!user) {
      nav.navigate('SignIn')
      return
    }
    if (!formOk) {
      setError('Fill in your name and delivery address first — every field except line 2.')
      return
    }
    setBusy(true)
    try {
      const shippingAddress: CheckoutAddress = {
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        postcode: postcode.trim(),
        country: country.trim().toUpperCase(),
      }
      // Step 1 — delivery rates per seller (the server refuses to price a
      // cart without a chosen rate for EVERY seller; website parity, and
      // exactly the error William hit on 2026-08-04). The website's default
      // is the first returned rate per seller — same here.
      let sellerShipping: { sellerId: string; rateId: string }[]
      try {
        const groups = await fetchShippingRates({
          cartItems: items.map((i) => ({
            productId: i.product.id,
            variantId: i.variant?.id ?? null,
            sellerId: i.product.sellerId ?? '',
            quantity: i.qty,
            price: cartLinePrice(i),
          })),
          shippingAddress: {
            street1: shippingAddress.line1,
            city: shippingAddress.city,
            zip: shippingAddress.postcode,
            country: shippingAddress.country,
          },
        })
        sellerShipping = groups.map((g) => ({
          sellerId: g.sellerId,
          rateId:
            (chosenRates[g.sellerId] && g.rates?.some((r) => r.rateId === chosenRates[g.sellerId])
              ? chosenRates[g.sellerId]
              : g.rates?.[0]?.rateId) ?? '',
        }))
        if (sellerShipping.length === 0 || sellerShipping.some((sh) => !sh.rateId)) {
          setError('Could not get delivery rates for this address — check the address and try again.')
          return
        }
      } catch {
        setError('Could not get delivery rates — check your connection and try again.')
        return
      }

      const r = await createPaymentIntent({
        items: items.map((i) => ({
          productId: i.product.id,
          variantId: i.variant?.id ?? null,
          quantity: i.qty,
        })),
        currency: getCurrency(),
        buyerName: name.trim(),
        shippingAddress,
        sellerShipping,
      })
      if (!r.clientSecret) {
        setError(r.error ?? 'Could not start checkout — try again.')
        return
      }
      setBreakdown(r.breakdown ?? null)

      const init = await initPaymentSheet({
        paymentIntentClientSecret: r.clientSecret,
        merchantDisplayName: 'Velor',
        defaultBillingDetails: { name: name.trim() },
        returnURL: 'velor://stripe-redirect',
      })
      if (init.error) {
        setError(init.error.message)
        return
      }
      const sheet = await presentPaymentSheet()
      if (sheet.error) {
        if (sheet.error.code !== 'Canceled') setError(sheet.error.message)
        return
      }
      // Paid. Tell the server to build the orders now (webhook is the backstop).
      const piId = r.clientSecret.split('_secret')[0]
      await confirmOrders(piId).catch(() => {})
      clear()
      setPaid(true)
    } catch {
      setError('Could not reach Velor — check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (paid) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View style={s.paidRing}>
          <Ionicons name="checkmark" size={40} color={t.green} />
        </View>
        <Text style={s.paidT}>Order placed.</Text>
        <Text style={s.paidS}>
          Charged once, by Velor — held in escrow until each parcel's delivery is confirmed.
          Your confirmation email is on its way.
        </Text>
        <Pressable style={s.payBtn2} onPress={() => nav.navigate('Orders')}>
          <Text style={s.payBtnTx}>Track your order</Text>
        </Pressable>
        <Pressable style={{ marginTop: 14 }} onPress={() => nav.navigate('Tabs', { screen: 'Home' })}>
          <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: t.accent }}>Back to the marketplace</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.h1}>Checkout</Text>

          {!user ? (
            <Pressable style={s.signCard} onPress={() => nav.navigate('SignIn')}>
              <Ionicons name="person-circle-outline" size={22} color={t.accent} />
              <View style={{ flex: 1 }}>
                <Text style={s.signT}>Sign in to pay</Text>
                <Text style={s.signS}>Your order history and buyer protection hang off your account.</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={t.accent} />
            </Pressable>
          ) : null}

          {/* Director test shortcut (2026-08-04): Appetize free sessions die
              at 3 minutes, which is not enough to hand-type an address. A
              long-press here fills the company address in one gesture. Gated
              hard to William's own signed-in account -- invisible and inert
              for every real buyer. */}
          <Pressable
            onLongPress={() => {
              if (user?.email !== 'willsinclair144@gmail.com') return
              setName('William Sinclair')
              setLine1('49 Station Road')
              setLine2('')
              setCity('Polegate')
              setPostcode('BN26 6EA')
              setCountry('GB')
            }}
            delayLongPress={600}
          >
            <Text style={s.label}>DELIVER TO</Text>
          </Pressable>
          <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={t.dim} style={s.in} />
          <TextInput value={line1} onChangeText={setLine1} placeholder="Address line 1" placeholderTextColor={t.dim} style={s.in} />
          <TextInput value={line2} onChangeText={setLine2} placeholder="Address line 2 (optional)" placeholderTextColor={t.dim} style={s.in} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={t.dim} style={[s.in, { flex: 1.4 }]} />
            <TextInput value={postcode} onChangeText={setPostcode} placeholder="Postcode" placeholderTextColor={t.dim} style={[s.in, { flex: 1 }]} autoCapitalize="characters" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {QUICK_COUNTRIES.map((cc) => (
              <Pressable key={cc} style={[s.ccChip, country === cc && s.ccChipOn]} onPress={() => setCountry(cc)}>
                <Image source={{ uri: flagUrl(cc, 40) }} style={{ width: 18, height: 13, borderRadius: 2 }} />
                <Text style={[s.ccTx, country === cc && { color: '#fff' }]}>{cc}</Text>
              </Pressable>
            ))}
            <TextInput
              value={country}
              onChangeText={(v) => setCountry(v.toUpperCase().slice(0, 2))}
              placeholder="CC"
              placeholderTextColor={t.dim}
              style={s.ccIn}
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>

          <Text style={s.label}>
            DELIVERY · {groups.length} PARCEL{groups.length === 1 ? '' : 'S'}
          </Text>
          <View style={s.card}>
            {groups.map(([seller, g], i) => {
              const live = rateGroups.find((rg) => (rg.sellerName ?? rg.sellerId) === seller || rg.sellerId === (items.find((it) => (it.product.sellerName ?? '') === seller)?.product.sellerId ?? ''))
              return (
                <View key={seller} style={[i > 0 && s.parcelDiv, { paddingVertical: 10 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {g.cc ? (
                      <Image source={{ uri: flagUrl(g.cc, 40) }} style={{ width: 22, height: 16, borderRadius: 3 }} />
                    ) : null}
                    <Text style={s.parcelTx} numberOfLines={2}>
                      {seller} · self-shipped, tracked by their own carrier
                    </Text>
                  </View>
                  {live && live.rates.length > 0 ? (
                    live.rates.map((r) => {
                      const on = chosenRates[live.sellerId] === r.rateId
                      const free = (r.amountGBP ?? r.amount ?? 0) === 0
                      return (
                        <Pressable
                          key={r.rateId}
                          style={[s.rateRow, on && s.rateRowOn]}
                          onPress={() => setChosenRates((p) => ({ ...p, [live.sellerId]: r.rateId }))}
                        >
                          <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={15} color={on ? t.accent : t.mut} />
                          <Text style={s.rateTx} numberOfLines={1}>
                            {[r.carrier, r.service].filter(Boolean).join(' · ') || 'Delivery'}
                          </Text>
                          <Text style={[s.rateP, free && { color: t.green }]}>
                            {free ? 'FREE' : fmt(r.amountGBP ?? r.amount ?? 0)}
                          </Text>
                        </Pressable>
                      )
                    })
                  ) : (
                    <Text style={s.rateHint}>
                      {formOk ? (ratesNote ?? 'Fetching delivery options…') : 'Rates appear once the address is filled in.'}
                    </Text>
                  )}
                </View>
              )
            })}
            {groups.length === 0 ? (
              <Text style={{ fontFamily: F.body, fontSize: 12, color: t.mut }}>Your basket is empty — nothing to deliver yet.</Text>
            ) : null}
          </View>

          <Text style={s.label}>SUMMARY</Text>
          <View style={[s.card, { gap: 9 }]}>
            <Row s={s} t={t} l={`Items (${nItems})`} r={breakdown ? money(breakdown.productSubtotal, breakdown.currency) : fmt(total())} />
            <Row s={s} t={t} l="Delivery (FREE unless seller-priced)" r={breakdown ? money(breakdown.shippingCost, breakdown.currency) : 'at payment'} dimR={!breakdown} />
            {!breakdown && autoDiscountGBP > 0 ? (
              <Row s={s} t={t} l={`Discount applied automatically${autoDiscountLabels.length ? ` (${autoDiscountLabels.join(', ')})` : ''}`} r={'-' + fmt(autoDiscountGBP)} />
            ) : null}
            <Row s={s} t={t} l="UK VAT (where due)" r={breakdown ? money(breakdown.dutiesAmount, breakdown.currency) : 'at payment'} dimR={!breakdown} />
            {breakdown && breakdown.discountAmount > 0 ? (
              <Row s={s} t={t} l="Discount" r={'-' + money(breakdown.discountAmount, breakdown.currency)} />
            ) : null}
            <View style={s.hr} />
            <View style={s.rowLine}>
              <Text style={s.totL}>Total</Text>
              <Text style={s.totR}>
                {breakdown
                  ? money(breakdown.total, breakdown.currency) +
                    (getCurrency() !== breakdown.currency ? `  ·  ≈ ${fmt(breakdown.total)}` : '')
                  : `${fmt(total())} + delivery`}
              </Text>
            </View>
          </View>

          <View style={s.escrow}>
            <Ionicons name="shield-checkmark" size={15} color={t.green} />
            <Text style={s.escrowTx}>
              Charged once, by Velor. Held in escrow until each parcel is delivered. Anything
              wrong — the funds freeze. Card details go to Stripe, never to the app.
            </Text>
          </View>

          {error ? (
            <View style={s.errBub}>
              <Text style={s.errTx}>{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[s.dock, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={[s.payBtn, (busy || items.length === 0) && { opacity: 0.6 }]} onPress={pay} disabled={busy || items.length === 0}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.payBtnTx}>{user ? `Pay securely · ${fmt(total())} + delivery` : 'Sign in to pay'}</Text>
          )}
        </Pressable>
      </View>

      <Pressable style={[s.backChip, { top: insets.top + 8 }]} onPress={() => nav.goBack()}>
        <Ionicons name="chevron-back" size={14} color={t.text} />
        <Text style={s.backTx}>Basket</Text>
      </Pressable>
    </View>
  )
}

function money(v: number, cur: string): string {
  const sym: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', JPY: '¥', AUD: 'A$', CAD: 'C$' }
  return (sym[cur] ?? cur + ' ') + v.toFixed(cur === 'JPY' ? 0 : 2)
}

function Row({ l, r, dimR, s, t }: { l: string; r: string; dimR?: boolean; s: ReturnType<typeof styles>; t: Palette }) {
  return (
    <View style={s.rowLine}>
      <Text style={s.rowL}>{l}</Text>
      <Text style={[s.rowR, dimR && { color: t.mut }]}>{r}</Text>
    </View>
  )
}

const styles = (t: Palette) =>
  StyleSheet.create({
    h1: { fontFamily: F.serifLight, fontSize: 30, color: t.text },
    label: {
      fontFamily: F.display,
      fontSize: 10,
      letterSpacing: 1,
      color: t.mut,
      marginTop: 22,
      marginBottom: 8,
    },
    in: {
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      color: t.text,
      fontFamily: F.body,
      fontSize: 13.5,
      marginTop: 10,
    },
    ccChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surf,
    },
    ccChipOn: { backgroundColor: t.accent, borderColor: t.accent },
    ccTx: { fontFamily: F.displayMed, fontSize: 11.5, color: t.text },
    ccIn: {
      width: 52,
      textAlign: 'center',
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 999,
      paddingVertical: 8,
      color: t.text,
      fontFamily: F.displayMed,
      fontSize: 11.5,
    },
    signCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 16,
      backgroundColor: t.accentSoft,
      borderWidth: 1,
      borderColor: t.accent,
      borderRadius: 14,
      padding: 13,
    },
    signT: { fontFamily: F.bodySemi, fontSize: 13.5, color: t.text },
    signS: { fontFamily: F.body, fontSize: 11, color: t.mut, marginTop: 2 },
    card: {
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 16,
      padding: 14,
    },
    parcelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    parcelDiv: { borderTopWidth: 1, borderColor: t.line },
    parcelTx: { flex: 1, fontFamily: F.body, fontSize: 13, lineHeight: 18, color: t.text },
    parcelP: { fontFamily: F.body, fontSize: 12, color: t.mut },
    rateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 8,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 11,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },
    rateRowOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    rateTx: { flex: 1, fontFamily: F.body, fontSize: 12, color: t.text },
    rateP: { fontFamily: F.bodySemi, fontSize: 12, color: t.text },
    rateHint: { fontFamily: F.body, fontSize: 11, color: t.mut, marginTop: 8 },
    rowLine: { flexDirection: 'row', alignItems: 'baseline' },
    rowL: { flex: 1, fontFamily: F.body, fontSize: 13, color: t.mut },
    rowR: { fontFamily: F.body, fontSize: 13, color: t.text },
    hr: { height: 1, backgroundColor: t.line },
    totL: { flex: 1, fontFamily: F.bodySemi, fontSize: 13, color: t.text },
    totR: { fontFamily: F.bodySemi, fontSize: 13, color: t.text },
    escrow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginTop: 18,
      backgroundColor: 'rgba(46,204,113,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(46,204,113,0.3)',
      borderRadius: 16,
      padding: 13,
    },
    escrowTx: { flex: 1, fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: t.text },
    errBub: {
      marginTop: 14,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.red,
      borderRadius: 14,
      padding: 13,
    },
    errTx: { fontFamily: F.body, fontSize: 11.5, lineHeight: 17, color: t.red, textAlign: 'center' },
    dock: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 16,
      backgroundColor: t.surf,
      borderTopWidth: 1,
      borderColor: t.line,
    },
    payBtn: { backgroundColor: t.accent, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
    payBtn2: { backgroundColor: t.accent, borderRadius: 16, paddingVertical: 15, alignItems: 'center', alignSelf: 'stretch', marginTop: 26 },
    payBtnTx: { fontFamily: F.display, fontSize: 14, color: '#fff' },
    paidRing: {
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 2,
      borderColor: t.green,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    paidT: { fontFamily: F.serif, fontSize: 26, color: t.text },
    paidS: { fontFamily: F.body, fontSize: 12.5, lineHeight: 19, color: t.mut, textAlign: 'center', marginTop: 10 },
    backChip: {
      position: 'absolute',
      left: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    backTx: { fontFamily: F.displayMed, fontSize: 12, color: t.text },
  })
