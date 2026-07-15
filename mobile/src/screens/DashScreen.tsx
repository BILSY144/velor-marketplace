import React, { useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'
import { Kicker, Dim, Btn } from '../ui'
import { Chrome } from '../components/Chrome'

// Seller dashboard — plate 27's structure, as an honest PREVIEW. The mockup
// fills this screen with a sample store ("Studio Kaede", fake revenue,
// SAMPLE DATA chart); the app renders the same sections with real zero
// states and a clear preview banner instead — no invented numbers anywhere.
// The STARTER/PRO toggle is live and switches what each plan actually gets
// (10-listing cap vs unlimited, AI account manager and API access Pro-only,
// Go Live on every plan). This becomes the real dashboard the moment seller
// sign-in ships; the layout is already the plate's.
type Tier = 'STARTER' | 'PRO'

export default function DashScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const [tier, setTier] = useState<Tier>('STARTER')
  const [note, setNote] = useState<string | null>(null)
  const pro = tier === 'PRO'

  const say = (m: string) => {
    setNote(m)
    setTimeout(() => setNote(null), 2400)
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 60 }}>
        <View style={{ paddingHorizontal: 20 }}>
          {/* Preview banner */}
          <View style={s.preview}>
            <Ionicons name="eye-outline" size={14} color={C.accent} />
            <Text style={s.previewTx}>
              PREVIEW — this is your dashboard the day you're approved. Toggle the plan to compare.
            </Text>
          </View>

          <Text style={s.kickDim}>YOUR CHANNEL</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Text style={s.h1}>Your store</Text>
            <Text style={s.tbadge}>{pro ? 'PRO · 4%' : 'STARTER · 10%'}</Text>
          </View>
          <Dim style={{ fontSize: 11.5, marginTop: 4 }}>
            Founding sellers carry the badge here — with Pro free for life.
          </Dim>

          {/* Tier toggle */}
          <View style={s.seg}>
            {(['STARTER', 'PRO'] as Tier[]).map((t) => (
              <Pressable
                key={t}
                style={[s.segBtn, tier === t && s.segOn]}
                onPress={() => setTier(t)}
              >
                <Text style={[s.segTx, tier === t && s.segTxOn]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {/* Stat tiles */}
          <View style={s.statRow}>
            {[
              ['0', 'Views · 7d'],
              ['0', 'To ship'],
              ['£0', 'In escrow'],
              ['£0', 'Paid out'],
            ].map(([k, l]) => (
              <View key={l} style={s.stat}>
                <Text style={s.dk}>{k}</Text>
                <Text style={s.dl}>{l}</Text>
              </View>
            ))}
          </View>

          {/* Revenue */}
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={s.kickDim}>REVENUE · 30D</Text>
                <Text style={s.rev}>£0</Text>
              </View>
              <View style={s.rangeSeg}>
                {['7D', '30D', '90D'].map((r, i) => (
                  <View key={r} style={[s.rangeBtn, i === 1 && s.rangeOn]}>
                    <Text style={[s.rangeTx, i === 1 && { color: '#0b0b0e' }]}>{r}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.chartZero}>
              <View style={s.chartBase} />
              <Dim style={{ fontSize: 11, textAlign: 'center' }}>
                Your first sale draws this line.
              </Dim>
            </View>
          </View>

          {/* AI account manager — Pro-only */}
          <View style={[s.card, !pro && { opacity: 0.55 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={s.aiIcon}>
                <Ionicons name="sparkles" size={16} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fd}>Your AI account manager</Text>
                <Text style={s.smdim}>
                  {pro
                    ? 'Watching your channel around the clock'
                    : 'Pro-only · upgrade any time from here'}
                </Text>
              </View>
              {!pro ? <Ionicons name="lock-closed" size={14} color={C.mut} /> : null}
            </View>
            {pro ? (
              <View style={{ marginTop: 12, gap: 8 }}>
                <Text style={s.aitip}>
                  She reads your real views, orders and holds — her first tips appear with your
                  first listings.
                </Text>
                <Pressable style={s.lineBtn} onPress={() => nav.navigate('Assist')}>
                  <Text style={s.lineBtnTx}>Ask her anything</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {/* Order pipeline */}
          <Text style={[s.kickDim, { marginTop: 24 }]}>ORDER PIPELINE</Text>
          <View style={s.pipeRow}>
            {['New', 'To ship', 'In transit', 'Delivered'].map((l) => (
              <View key={l} style={s.pc}>
                <Text style={s.pcN}>0</Text>
                <Text style={s.smdim}>{l}</Text>
              </View>
            ))}
          </View>
          <Dim style={{ fontSize: 11.5, marginTop: 10 }}>
            Escrow releases automatically after each delivery is confirmed — you'll see it here.
          </Dim>

          {/* Go live — every plan */}
          <Pressable style={s.golive} onPress={() => say('Go Live opens with your approved account')}>
            <View style={s.liveDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.fd}>Go live on your channel</Text>
              <Text style={s.smdim}>Every plan can broadcast — Starter included</Text>
            </View>
            <Ionicons name="videocam-outline" size={18} color={C.text} />
          </Pressable>

          {/* To do */}
          <Text style={[s.kickDim, { marginTop: 24 }]}>TO DO</Text>
          <View style={s.card2}>
            <Text style={s.fd}>Nothing yet</Text>
            <Text style={s.smdim}>
              Your first order, certificate request or payout lands here the moment it happens.
            </Text>
          </View>

          {/* Listings */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24 }}>
            <Text style={[s.kickDim, { flex: 1, marginTop: 0 }]}>
              LISTINGS · {pro ? 'UNLIMITED' : 'UP TO 10'}
            </Text>
            <Pressable onPress={() => say('Listing creation opens with your approved account')}>
              <Text style={s.newTx}>+ New</Text>
            </Pressable>
          </View>
          <View style={s.card2}>
            <Text style={s.fd}>No listings yet</Text>
            <Text style={s.smdim}>
              {pro
                ? 'List as much as you make — unlimited on Pro.'
                : 'Starter carries up to 10 live listings — Pro is unlimited.'}
            </Text>
          </View>

          {/* API access — Pro-only */}
          <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }, !pro && { opacity: 0.55 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.fd}>API access</Text>
              <Text style={s.smdim}>
                {pro ? 'Wire your channel into your own tools' : 'Pro-only — included the day you upgrade'}
              </Text>
            </View>
            {pro ? (
              <Pressable style={s.lineBtn} onPress={() => say('Keys are issued on your approved account')}>
                <Text style={s.lineBtnTx}>Keys</Text>
              </Pressable>
            ) : (
              <Ionicons name="lock-closed" size={14} color={C.mut} />
            )}
          </View>

          {note ? (
            <View style={s.noteBub}>
              <Text style={s.noteTx}>{note}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 26, gap: 10 }}>
            <Btn label="Apply to sell — five minutes" onPress={() => nav.navigate('Apply', {})} />
            <Btn ghost label="See the founding seats" onPress={() => nav.navigate('Seats')} />
          </View>
        </View>
      </ScrollView>
      <Chrome back="Menu" onBack={() => nav.goBack()} />
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
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut },
  h1: { fontFamily: F.serifLight, fontSize: 26, color: C.text },
  tbadge: {
    fontFamily: F.display,
    fontSize: 9,
    letterSpacing: 1,
    color: C.accent,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.45)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  seg: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    padding: 4,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  segOn: { backgroundColor: C.accent },
  segTx: { fontFamily: F.display, fontSize: 10.5, letterSpacing: 1, color: C.mut },
  segTxOn: { color: '#0b0b0e' },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  dk: { fontFamily: F.display, fontSize: 18, color: C.text },
  dl: { fontFamily: F.body, fontSize: 9.5, color: C.mut },
  card: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    padding: 16,
  },
  card2: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 14,
    gap: 3,
  },
  rev: { fontFamily: F.serifLight, fontSize: 24, color: C.text, marginTop: 6 },
  rangeSeg: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, padding: 3 },
  rangeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  rangeOn: { backgroundColor: C.text },
  rangeTx: { fontFamily: F.display, fontSize: 9.5, color: C.mut },
  chartZero: {
    marginTop: 16,
    height: 90,
    justifyContent: 'center',
    gap: 10,
  },
  chartBase: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  aiIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fd: { fontFamily: F.bodySemi, fontSize: 13.5, color: C.text },
  smdim: { fontFamily: F.body, fontSize: 11.5, lineHeight: 16, color: C.dim, marginTop: 2 },
  aitip: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: '#d8d7d3' },
  lineBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  lineBtnTx: { fontFamily: F.displayMed, fontSize: 12, color: C.text },
  pipeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pc: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  pcN: { fontFamily: F.serifLight, fontSize: 19, color: C.text },
  golive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    backgroundColor: 'rgba(255,107,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.35)',
    borderRadius: 18,
    padding: 16,
  },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.red },
  newTx: { fontFamily: F.displayMed, fontSize: 12, color: C.accent },
  noteBub: {
    marginTop: 14,
    backgroundColor: 'rgba(20,20,26,0.9)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 12,
  },
  noteTx: { fontFamily: F.body, fontSize: 11.5, color: C.text, textAlign: 'center' },
})
