import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native'
import { Text } from '../ui/T'
import { TextInput } from '../ui/TI'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { F, useTheme, Palette } from '../theme'
import { useI18nTick } from '../i18n'
import { useSession } from '../store'
import { fetchMessages, sendMessage, RawMessage } from '../api'
import { Chrome } from '../components/Chrome'

// MESSAGES — website /messages parity: the buyer's inbox built from the
// same flat /api/messages?format=raw list, grouped into threads by the
// other party; reply composer per thread; deep-linkable with
// { sellerId, productId } to start a conversation from a listing.
// The platform-is-the-channel rule lives server-side (contact-detail
// filter) — its message is surfaced verbatim when a send is blocked.
export default function MessagesScreen() {
  useI18nTick()
  const t = useTheme()
  const s = styles(t)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const user = useSession((st) => st.user)
  const startSellerId: string | undefined = route.params?.sellerId
  const startSellerName: string | undefined = route.params?.sellerName
  const startProductId: string | undefined = route.params?.productId

  const msgsQ = useQuery({
    queryKey: ['messages'],
    queryFn: fetchMessages,
    enabled: Boolean(user),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnMount: 'always',
  })
  const msgs = msgsQ.data ?? []
  const myId = React.useMemo(() => {
    // My user id = the id that appears as sender AND receiver across threads;
    // derive from any message where the counterpart differs.
    for (const m of msgs) {
      if (m.sender.name && user?.name && m.sender.name === user.name) return m.senderId
    }
    // Fallback: the id most common across sender/receiver
    const count = new Map<string, number>()
    for (const m of msgs) {
      count.set(m.senderId, (count.get(m.senderId) ?? 0) + 1)
      count.set(m.receiverId, (count.get(m.receiverId) ?? 0) + 1)
    }
    let best = ''
    let n = 0
    for (const [id, c] of count) if (c > n) { best = id; n = c }
    return best
  }, [msgs, user?.name])

  type Thread = { otherId: string; otherName: string; otherImage?: string | null; last: RawMessage; all: RawMessage[] }
  const threads: Thread[] = React.useMemo(() => {
    const map = new Map<string, Thread>()
    for (const m of msgs) {
      const other = m.senderId === myId ? m.receiver : m.sender
      const th = map.get(other.id) ?? { otherId: other.id, otherName: other.name, otherImage: other.image, last: m, all: [] }
      th.all.push(m)
      if (new Date(m.createdAt) > new Date(th.last.createdAt)) th.last = m
      map.set(other.id, th)
    }
    return [...map.values()].sort((a, b) => +new Date(b.last.createdAt) - +new Date(a.last.createdAt))
  }, [msgs, myId])

  const [openId, setOpenId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState('')
  const [sendBusy, setSendBusy] = React.useState(false)
  const [sendNote, setSendNote] = React.useState<string | null>(null)
  const openThread = threads.find((th) => th.otherId === openId) ?? null
  const composeNew = Boolean(startSellerId) && !openThread && openId === '__new__'

  React.useEffect(() => {
    if (startSellerId) setOpenId('__new__')
  }, [startSellerId])

  const doSend = async () => {
    const content = draft.trim()
    if (!content || sendBusy) return
    setSendBusy(true)
    setSendNote(null)
    const r = openThread
      ? await sendMessage({ receiverId: openThread.otherId, content })
      : await sendMessage({ sellerId: startSellerId, productId: startProductId, content })
    setSendBusy(false)
    if (r.ok) {
      setDraft('')
      msgsQ.refetch()
      if (!openThread) setOpenId(null)
    } else {
      setSendNote(r.error ?? 'Could not send — try again.')
    }
  }

  // ---- Thread view ----
  if (user && (openThread || composeNew)) {
    const list = openThread ? [...openThread.all].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)) : []
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={[s.threadHead, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={() => { setOpenId(null); setSendNote(null) }} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={t.text} />
          </Pressable>
          <Text style={s.threadName} numberOfLines={1}>
            {openThread?.otherName ?? startSellerName ?? 'New message'}
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 20 }}>
          {composeNew ? (
            <Text style={s.dim}>
              Start the conversation — questions, customisation requests, anything about their work.
              Keep it on Velor: contact details are filtered to protect both sides.
            </Text>
          ) : null}
          {list.map((m) => {
            const mine = m.senderId === myId
            return (
              <View key={m.id} style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
                <Text style={[s.bubbleTx, mine && { color: '#fff' }]}>{m.content}</Text>
                <Text style={[s.bubbleAt, mine && { color: 'rgba(255,255,255,0.7)' }]}>
                  {new Date(m.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )
          })}
        </ScrollView>
        {sendNote ? <Text style={s.sendNote}>{sendNote}</Text> : null}
        <View style={[s.composer, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message…"
            placeholderTextColor={t.dim}
            style={s.composerInput}
            multiline
          />
          <Pressable style={[s.sendBtn, (sendBusy || !draft.trim()) && { opacity: 0.5 }]} disabled={sendBusy || !draft.trim()} onPress={doSend}>
            <Ionicons name="send" size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // ---- Inbox list ----
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: 50 }}
        refreshControl={<RefreshControl refreshing={msgsQ.isRefetching} onRefresh={() => msgsQ.refetch()} tintColor={t.accent} colors={[t.accent]} />}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.kick}>THE PLATFORM IS THE CHANNEL</Text>
          <Text style={s.h1}>Messages.</Text>

          {!user ? (
            <Pressable style={s.signCard} onPress={() => nav.navigate('SignIn')}>
              <Ionicons name="chatbubbles-outline" size={20} color={t.accent} />
              <View style={{ flex: 1 }}>
                <Text style={s.signT}>Sign in to message makers</Text>
                <Text style={s.signS}>Questions, customisation requests, order chat — all in one place.</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={t.accent} />
            </Pressable>
          ) : msgsQ.isLoading ? (
            <Text style={s.dim}>Opening your inbox…</Text>
          ) : threads.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="chatbubbles-outline" size={20} color={t.mut} />
              <Text style={s.emptyT}>No conversations yet</Text>
              <Text style={s.emptyS}>
                Message any maker from their listing — the conversation lands here.
              </Text>
            </View>
          ) : (
            threads.map((th) => {
              const unread = th.all.some((m) => m.receiverId === myId && !m.isRead)
              return (
                <Pressable key={th.otherId} style={s.row} onPress={() => setOpenId(th.otherId)}>
                  {th.otherImage ? (
                    <Image source={{ uri: th.otherImage }} style={s.avatar} contentFit="cover" />
                  ) : (
                    <View style={[s.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: t.surf2 }]}>
                      <Text style={s.avatarTx}>{th.otherName?.[0]?.toUpperCase() ?? 'V'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[s.rowName, unread && { color: t.accent }]} numberOfLines={1}>{th.otherName}</Text>
                    <Text style={s.rowLast} numberOfLines={1}>{th.last.content}</Text>
                  </View>
                  {unread ? <View style={s.unreadDot} /> : null}
                </Pressable>
              )
            })
          )}
        </View>
      </ScrollView>
      <Chrome back="Back" onBack={() => nav.goBack()} />
    </View>
  )
}

const styles = (t: Palette) =>
  StyleSheet.create({
    kick: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: t.mut },
    h1: { fontFamily: F.serifLight, fontSize: 32, color: t.text, marginTop: 8 },
    dim: { fontFamily: F.body, fontSize: 12.5, color: t.mut, lineHeight: 18, paddingVertical: 10 },
    signCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 20,
      backgroundColor: t.accentSoft,
      borderWidth: 1,
      borderColor: t.accent,
      borderRadius: 14,
      padding: 13,
    },
    signT: { fontFamily: F.bodySemi, fontSize: 13.5, color: t.text },
    signS: { fontFamily: F.body, fontSize: 11, color: t.mut, marginTop: 2 },
    emptyCard: {
      marginTop: 20,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 18,
      padding: 18,
      gap: 4,
    },
    emptyT: { fontFamily: F.bodySemi, fontSize: 13.5, color: t.text, marginTop: 6 },
    emptyS: { fontFamily: F.body, fontSize: 12, color: t.mut, lineHeight: 17 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 12,
      backgroundColor: t.surf,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 16,
      padding: 12,
    },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    avatarTx: { fontFamily: F.bodySemi, fontSize: 16, color: t.mut },
    rowName: { fontFamily: F.bodySemi, fontSize: 13, color: t.text },
    rowLast: { fontFamily: F.body, fontSize: 11.5, color: t.mut, marginTop: 2 },
    unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: t.accent },
    threadHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.line,
      backgroundColor: t.surf,
    },
    threadName: { fontFamily: F.bodySemi, fontSize: 15, color: t.text, flex: 1 },
    bubble: { maxWidth: '82%', borderRadius: 16, padding: 12, marginTop: 10 },
    bubbleMine: { alignSelf: 'flex-end', backgroundColor: t.accent, borderBottomRightRadius: 4 },
    bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: t.surf, borderWidth: 1, borderColor: t.line, borderBottomLeftRadius: 4 },
    bubbleTx: { fontFamily: F.body, fontSize: 13, color: t.text, lineHeight: 19 },
    bubbleAt: { fontFamily: F.body, fontSize: 9.5, color: t.mut, marginTop: 5 },
    sendNote: { fontFamily: F.body, fontSize: 11.5, color: '#e05545', paddingHorizontal: 20, paddingBottom: 6 },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 9,
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: t.line,
      backgroundColor: t.surf,
    },
    composerInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 9,
      maxHeight: 110,
      fontFamily: F.body,
      fontSize: 13,
      color: t.text,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
