import React, { useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Switch } from 'react-native'
import { Text } from '../ui/T'
import { TextInput } from '../ui/TI'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { Dim, Btn } from '../ui'
import { Chrome } from '../components/Chrome'
import { useSession } from '../store'
import { fmt, useI18nTick } from '../i18n'
import {
  fetchSellerQuestions, answerQuestion,
  fetchDiscountCodes, createDiscountCode, toggleDiscountCode, deleteDiscountCode,
  fetchSellerReturns, updateReturn,
  fetchSellerFollowers,
  fetchSupportTickets, openSupportTicket,
  fetchShippingSettings, saveShippingSettings,
} from '../api'

// SELLER TOOLS (2026-08-04, Phase B website parity). Each screen mirrors the
// matching /dashboard/* page: Q&A inbox, discount-code manager, returns
// queue, followers list, support tickets, shipping settings. Preview banner
// + "apply to sell" when signed out, honest zero states, no fabricated data.

function Head({ kick, title, sub, live }: { kick: string; title: string; sub: string; live: boolean }) {
  return (
    <View>
      {live ? null : <PreviewBanner text="PREVIEW — live once your seller account is approved." />}
      <Text style={s.kick}>{kick}</Text>
      <Text style={s.h1}>{title}</Text>
      <Dim style={{ marginTop: 8, lineHeight: 18 }}>{sub}</Dim>
    </View>
  )
}
function PreviewBanner({ text }: { text: string }) {
  return (
    <View style={s.pv}>
      <Ionicons name="eye-outline" size={13} color={C.accent} />
      <Text style={s.pvTx}>{text}</Text>
    </View>
  )
}
function ApplyFooter({ live }: { live: boolean }) {
  const nav = useNavigation<any>()
  if (live) return null
  return (
    <View style={{ marginTop: 20 }}>
      <Btn label="Apply to sell — five minutes" onPress={() => nav.navigate('Apply', {})} />
    </View>
  )
}

// ---------------------------------------------------------------- Q&A inbox
export function SellerQuestionsScreen() {
  useI18nTick()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const live = Boolean(useSession((st) => st.user)?.sellerId)
  const q = useQuery({ queryKey: ['sellerQuestions'], queryFn: fetchSellerQuestions, enabled: live })
  const items = q.data ?? []
  const pending = items.filter((x) => !x.answer)
  const answered = items.filter((x) => x.answer)
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Head kick="YOUR CHANNEL" title="Questions." sub="Buyers ask about your pieces here. Answers are public — no contact details (the platform is the channel)." live={live} />
          {pending.length > 0 ? <Text style={s.sec}>NEEDS AN ANSWER · {pending.length}</Text> : null}
          {pending.map((qq) => <QCard key={qq.id} q={qq} onDone={() => q.refetch()} />)}
          {answered.length > 0 ? <Text style={s.sec}>ANSWERED</Text> : null}
          {answered.map((qq) => (
            <View key={qq.id} style={s.card}>
              <Text style={s.qName}>{qq.product?.title ?? 'Listing'}</Text>
              <Text style={s.qQ}>Q · {qq.question}</Text>
              <Text style={s.qA}>A · {qq.answer}</Text>
            </View>
          ))}
          {live && items.length === 0 && !q.isLoading ? (
            <View style={s.zero}>
              <Ionicons name="help-circle-outline" size={20} color={C.mut} />
              <Text style={s.zeroT}>No questions yet</Text>
              <Text style={s.zeroS}>When a buyer asks about a listing, it appears here for you to answer.</Text>
            </View>
          ) : null}
          <ApplyFooter live={live} />
        </View>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}
function QCard({ q, onDone }: { q: any; onDone: () => void }) {
  const [ans, setAns] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {q.product?.images?.[0] ? <Image source={{ uri: q.product.images[0] }} style={s.qThumb} contentFit="cover" /> : null}
        <Text style={s.qName} numberOfLines={1}>{q.product?.title ?? 'Listing'}</Text>
      </View>
      <Text style={s.qQ}>Q · {q.question}</Text>
      <TextInput style={s.qIn} value={ans} onChangeText={setAns} placeholder="Write your answer…" placeholderTextColor={C.dim} multiline />
      {note ? <Dim style={{ fontSize: 11, color: '#e05545', marginTop: 4 }}>{note}</Dim> : null}
      <Pressable
        style={[s.qBtn, (busy || !ans.trim()) && { opacity: 0.5 }]}
        disabled={busy || !ans.trim()}
        onPress={async () => { setBusy(true); setNote(null); const r = await answerQuestion(q.id, ans.trim()); setBusy(false); if (r.ok) onDone(); else setNote(r.error ?? 'Could not post.') }}
      >
        <Text style={s.qBtnTx}>{busy ? 'Posting…' : 'Post answer'}</Text>
      </Pressable>
    </View>
  )
}

// ------------------------------------------------------------ Discount codes
export function DiscountsScreen() {
  useI18nTick()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const live = Boolean(useSession((st) => st.user)?.sellerId)
  const q = useQuery({ queryKey: ['discountCodes'], queryFn: fetchDiscountCodes, enabled: live })
  const codes = q.data ?? []
  const [code, setCode] = useState('')
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE')
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Head kick="YOUR CHANNEL" title="Discounts." sub="Codes you create apply themselves at checkout for your buyers — no code to type, it just comes off." live={live} />
          {live ? (
            <View style={s.card}>
              <Text style={s.sec2}>NEW CODE</Text>
              <TextInput style={s.qIn} value={code} onChangeText={setCode} placeholder="Code (e.g. WELCOME10)" placeholderTextColor={C.dim} autoCapitalize="characters" />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {(['PERCENTAGE', 'FIXED'] as const).map((k) => (
                  <Pressable key={k} onPress={() => setType(k)} style={[s.typeChip, type === k && s.typeChipOn]}>
                    <Text style={[s.typeTx, type === k && { color: C.accent }]}>{k === 'PERCENTAGE' ? '% off' : '£ off'}</Text>
                  </Pressable>
                ))}
                <TextInput style={[s.qIn, { flex: 1, marginTop: 0 }]} value={value} onChangeText={setValue} placeholder={type === 'PERCENTAGE' ? '10' : '5.00'} placeholderTextColor={C.dim} keyboardType="decimal-pad" />
              </View>
              {note ? <Dim style={{ fontSize: 11, color: '#e05545', marginTop: 6 }}>{note}</Dim> : null}
              <Pressable
                style={[s.qBtn, (busy || !code.trim() || !value.trim()) && { opacity: 0.5 }]}
                disabled={busy || !code.trim() || !value.trim()}
                onPress={async () => {
                  setBusy(true); setNote(null)
                  const r = await createDiscountCode({ code: code.trim().toUpperCase(), type, value: Number(value) })
                  setBusy(false)
                  if (r.ok) { setCode(''); setValue(''); q.refetch() } else setNote(r.error ?? 'Could not create.')
                }}
              >
                <Text style={s.qBtnTx}>{busy ? 'Creating…' : 'Create code'}</Text>
              </Pressable>
            </View>
          ) : null}
          {codes.length > 0 ? <Text style={s.sec}>YOUR CODES</Text> : null}
          {codes.map((c) => (
            <View key={c.id} style={s.codeRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.codeTx}>{c.code}</Text>
                <Text style={s.codeSub}>{c.type === 'PERCENTAGE' ? `${c.value}% off` : `${fmt(c.value)} off`}{c.usageCount != null ? ` · used ${c.usageCount}${c.usageLimit ? `/${c.usageLimit}` : ''}` : ''}</Text>
              </View>
              <Switch value={c.active !== false} onValueChange={(v) => { void toggleDiscountCode(c.id, v).then(() => q.refetch()) }} trackColor={{ true: C.accent }} />
              <Pressable hitSlop={8} onPress={() => deleteDiscountCode(c.id).then(() => q.refetch())}>
                <Ionicons name="trash-outline" size={17} color={C.mut} />
              </Pressable>
            </View>
          ))}
          {live && codes.length === 0 && !q.isLoading ? (
            <View style={s.zero}><Ionicons name="pricetag-outline" size={20} color={C.mut} /><Text style={s.zeroT}>No codes yet</Text><Text style={s.zeroS}>Create one above — it applies automatically for buyers of your pieces.</Text></View>
          ) : null}
          <ApplyFooter live={live} />
        </View>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}

// ------------------------------------------------------------- Returns queue
export function ReturnsScreen() {
  useI18nTick()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const live = Boolean(useSession((st) => st.user)?.sellerId)
  const q = useQuery({ queryKey: ['sellerReturns'], queryFn: fetchSellerReturns, enabled: live })
  const rs = q.data ?? []
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Head kick="YOUR CHANNEL" title="Returns." sub="Return requests from your buyers. Approving one refunds them from the held escrow automatically." live={live} />
          {rs.map((r) => <ReturnCard key={r.id} r={r} onDone={() => q.refetch()} />)}
          {live && rs.length === 0 && !q.isLoading ? (
            <View style={s.zero}><Ionicons name="refresh-outline" size={20} color={C.mut} /><Text style={s.zeroT}>No return requests</Text><Text style={s.zeroS}>If a buyer requests a return, it appears here for you to approve or decline.</Text></View>
          ) : null}
          <ApplyFooter live={live} />
        </View>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}
function ReturnCard({ r, onDone }: { r: any; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const st = (r.status ?? 'PENDING').toUpperCase()
  const act = async (status: string) => { setBusy(true); await updateReturn(r.id, status); setBusy(false); onDone() }
  return (
    <View style={s.card}>
      <Text style={s.qName}>{r.order?.items?.map((i: any) => i.title).filter(Boolean).join(' · ') || 'Order'}</Text>
      <Text style={s.qQ}>{r.reason}</Text>
      <Text style={s.codeSub}>{new Date(r.createdAt).toLocaleDateString('en-GB')} · {st}</Text>
      {st === 'PENDING' ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Pressable style={[s.qBtn, { flex: 1.4 }, busy && { opacity: 0.5 }]} disabled={busy} onPress={() => act('APPROVED')}>
            <Text style={s.qBtnTx}>{busy ? '…' : 'Approve & refund'}</Text>
          </Pressable>
          <Pressable style={[s.trkCancel, { flex: 1 }]} disabled={busy} onPress={() => act('REJECTED')}>
            <Text style={s.trkCancelTx}>Decline</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

// ---------------------------------------------------------------- Followers
export function FollowersScreen() {
  useI18nTick()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const live = Boolean(useSession((st) => st.user)?.sellerId)
  const q = useQuery({ queryKey: ['sellerFollowers'], queryFn: fetchSellerFollowers, enabled: live })
  const fs = q.data ?? []
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Head kick="YOUR CHANNEL" title="Followers." sub="Buyers following your channel get your journal posts and go-live alerts." live={live} />
          {fs.map((f) => (
            <View key={f.id} style={s.folRow}>
              <View style={s.folAv}><Text style={s.folAvTx}>{(f.name ?? 'V')[0].toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.codeTx}>{f.name ?? 'Velor member'}</Text>
                <Text style={s.codeSub}>Following since {new Date(f.since).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</Text>
              </View>
            </View>
          ))}
          {live && fs.length === 0 && !q.isLoading ? (
            <View style={s.zero}><Ionicons name="people-outline" size={20} color={C.mut} /><Text style={s.zeroT}>No followers yet</Text><Text style={s.zeroS}>Post to your journal and go live — buyers follow makers they love.</Text></View>
          ) : null}
          <ApplyFooter live={live} />
        </View>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}

// ------------------------------------------------------------------ Support
export function SupportScreen() {
  useI18nTick()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const live = Boolean(useSession((st) => st.user)?.sellerId)
  const q = useQuery({ queryKey: ['supportTickets'], queryFn: fetchSupportTickets, enabled: live })
  const ts = q.data ?? []
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Head kick="YOUR CHANNEL" title="Support." sub="Open a ticket with the Velor team — we reply to your dashboard and email." live={live} />
          {live ? (
            <View style={s.card}>
              <TextInput style={s.qIn} value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor={C.dim} />
              <TextInput style={[s.qIn, { minHeight: 90, textAlignVertical: 'top', marginTop: 8 }]} value={message} onChangeText={setMessage} placeholder="How can we help?" placeholderTextColor={C.dim} multiline />
              {note ? <Dim style={{ fontSize: 11, color: note.startsWith('Sent') ? C.green : '#e05545', marginTop: 6 }}>{note}</Dim> : null}
              <Pressable
                style={[s.qBtn, (busy || !subject.trim() || !message.trim()) && { opacity: 0.5 }]}
                disabled={busy || !subject.trim() || !message.trim()}
                onPress={async () => { setBusy(true); setNote(null); const r = await openSupportTicket(subject.trim(), message.trim()); setBusy(false); if (r.ok) { setSubject(''); setMessage(''); setNote('Sent — we will be in touch.'); q.refetch() } else setNote(r.error ?? 'Could not send.') }}
              >
                <Text style={s.qBtnTx}>{busy ? 'Sending…' : 'Open ticket'}</Text>
              </Pressable>
            </View>
          ) : null}
          {ts.length > 0 ? <Text style={s.sec}>YOUR TICKETS</Text> : null}
          {ts.map((t) => (
            <View key={t.id} style={s.card}>
              <Text style={s.qName}>{t.subject}</Text>
              {t.message ? <Text style={s.qQ}>{t.message}</Text> : null}
              <Text style={s.codeSub}>{new Date(t.createdAt).toLocaleDateString('en-GB')}{t.status ? ` · ${t.status}` : ''}</Text>
            </View>
          ))}
          <ApplyFooter live={live} />
        </View>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}

// ------------------------------------------------------- Shipping settings
export function ShippingSettingsScreen() {
  useI18nTick()
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const live = Boolean(useSession((st) => st.user)?.sellerId)
  const q = useQuery({ queryKey: ['shippingSettings'], queryFn: fetchShippingSettings, enabled: live })
  const [freeShip, setFreeShip] = useState(true)
  const [flat, setFlat] = useState('')
  const [handling, setHandling] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  React.useEffect(() => {
    const d = q.data
    if (d) {
      const intl = d.internationalFlatRateGBP ?? d.shippingProfile?.internationalFlatRateGBP
      setFreeShip(intl == null || Number(intl) === 0)
      if (intl != null) setFlat(String(intl))
      const h = d.handlingFeeGBP ?? d.shippingProfile?.handlingFeeGBP
      if (h != null) setHandling(String(h))
    }
  }, [q.data])
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Head kick="YOUR CHANNEL" title="Shipping." sub="You self-ship with your own carrier. Buyers pay free unless you set a flat international rate." live={live} />
          {live ? (
            <View style={s.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={s.codeTx}>Free delivery</Text>
                  <Text style={s.codeSub}>Buyers pay nothing for shipping.</Text>
                </View>
                <Switch value={freeShip} onValueChange={setFreeShip} trackColor={{ true: C.accent }} />
              </View>
              {!freeShip ? (
                <TextInput style={[s.qIn, { marginTop: 10 }]} value={flat} onChangeText={setFlat} placeholder="International flat rate £ (e.g. 6.50)" placeholderTextColor={C.dim} keyboardType="decimal-pad" />
              ) : null}
              <TextInput style={[s.qIn, { marginTop: 8 }]} value={handling} onChangeText={setHandling} placeholder="Handling fee £ (optional, e.g. 1.00)" placeholderTextColor={C.dim} keyboardType="decimal-pad" />
              {note ? <Dim style={{ fontSize: 11, color: note.startsWith('Saved') ? C.green : '#e05545', marginTop: 6 }}>{note}</Dim> : null}
              <Pressable
                style={[s.qBtn, busy && { opacity: 0.5 }]}
                disabled={busy}
                onPress={async () => {
                  setBusy(true); setNote(null)
                  const r = await saveShippingSettings({
                    internationalFlatRateGBP: freeShip ? 0 : Number(flat) || 0,
                    handlingFeeGBP: Number(handling) || 0,
                  })
                  setBusy(false)
                  setNote(r.ok ? 'Saved.' : (r.error ?? 'Could not save.'))
                }}
              >
                <Text style={s.qBtnTx}>{busy ? 'Saving…' : 'Save shipping'}</Text>
              </Pressable>
            </View>
          ) : null}
          <ApplyFooter live={live} />
        </View>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}

const s = StyleSheet.create({
  pv: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,107,0,0.10)', borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)', borderRadius: 12, padding: 11, marginBottom: 16 },
  pvTx: { fontFamily: F.displayMed, fontSize: 10, letterSpacing: 0.4, color: C.accent, flex: 1 },
  kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  h1: { fontFamily: F.serifLight, fontSize: 32, color: C.text, marginTop: 8 },
  sec: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2, color: C.mut, marginTop: 26, marginBottom: 4 },
  sec2: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2, color: C.mut, marginBottom: 10 },
  card: { marginTop: 14, backgroundColor: C.surf, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 15 },
  qThumb: { width: 30, height: 30, borderRadius: 7 },
  qName: { fontFamily: F.bodySemi, fontSize: 12.5, color: C.text },
  qQ: { fontFamily: F.body, fontSize: 12.5, color: C.text, marginTop: 8, lineHeight: 18 },
  qA: { fontFamily: F.body, fontSize: 12.5, color: C.mut, marginTop: 6, lineHeight: 18 },
  qIn: { borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 11, marginTop: 10, fontFamily: F.body, fontSize: 12.5, color: C.text },
  qBtn: { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  qBtnTx: { fontFamily: F.bodySemi, fontSize: 12, color: '#fff' },
  trkCancel: { borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  trkCancelTx: { fontFamily: F.body, fontSize: 12, color: C.mut },
  typeChip: { borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' },
  typeChipOn: { borderColor: C.accent, backgroundColor: 'rgba(255,107,0,0.12)' },
  typeTx: { fontFamily: F.bodySemi, fontSize: 12, color: C.text },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, backgroundColor: C.surf, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 13 },
  codeTx: { fontFamily: F.bodySemi, fontSize: 13, color: C.text },
  codeSub: { fontFamily: F.body, fontSize: 11, color: C.mut, marginTop: 3 },
  folRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, backgroundColor: C.surf, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 12 },
  folAv: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surf2, alignItems: 'center', justifyContent: 'center' },
  folAvTx: { fontFamily: F.bodySemi, fontSize: 15, color: C.mut },
  zero: { marginTop: 18, backgroundColor: C.surf, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 18, alignItems: 'flex-start', gap: 4 },
  zeroT: { fontFamily: F.bodySemi, fontSize: 13, color: C.text, marginTop: 6 },
  zeroS: { fontFamily: F.body, fontSize: 11.5, color: C.mut, lineHeight: 17 },
})
