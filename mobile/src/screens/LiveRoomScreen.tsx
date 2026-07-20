import React, { useEffect, useRef, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Text } from '../ui/T'
import { TextInput } from '../ui/TI'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  AudioSession,
  LiveKitRoom,
  useTracks,
  VideoTrack,
  isTrackReference,
} from '@livekit/react-native'
import { Room, RoomEvent, Track } from 'livekit-client'
import { C, F } from '../theme'
import { Dim, Btn } from '../ui'
import { fmt } from '../i18n'
import {
  fetchLiveRoom,
  fetchLiveViewerToken,
  notifyMeForLive,
  reportLiveStream,
  LiveRoomData,
  LiveRoomProduct,
} from '../api'
import { useCart } from '../store'
import { checkMessageContent } from '../messageFilter'
import { decodeLiveData, encodeLiveData, LiveDataMsg } from '../liveData'
import { enableNotifications } from '../push'

// Watch a real live stream (2026-07-20) -- scheduled countdown + notify me,
// or a real connected LiveKit room with chat, a pinned "now showing"
// product, and live-only pricing. Room name comes in via route params, e.g.
// nav.navigate('LiveRoom', { room: 'seller-abc-xyz' }).
export default function LiveRoomScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const room: string = route.params?.room

  const [status, setStatus] = useState<'loading' | 'scheduled' | 'live' | 'ended' | 'notfound' | 'error'>('loading')
  const [data, setData] = useState<LiveRoomData | null>(null)
  const [creds, setCreds] = useState<{ wsUrl: string; token: string } | null>(null)
  const [notifyState, setNotifyState] = useState<'idle' | 'saved' | 'signin' | 'busy'>('idle')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!room) { setStatus('notfound'); return }
      try {
        const result = await fetchLiveRoom(room)
        if (cancelled) return
        setData(result)
        if (result.stream.status === 'SCHEDULED') { setStatus('scheduled'); return }
        if (result.stream.status === 'ENDED' || result.stream.status === 'CANCELLED') { setStatus('ended'); return }
        // LIVE — get a viewer token and connect.
        const tok = await fetchLiveViewerToken(room)
        if (cancelled) return
        setCreds(tok)
        setStatus('live')
      } catch {
        if (!cancelled) setStatus('notfound')
      }
    }
    load()
    return () => { cancelled = true }
  }, [room])

  async function notifyMe() {
    setNotifyState('busy')
    const bySession = await notifyMeForLive(room)
    if (bySession.ok) { setNotifyState('saved'); return }
    if (bySession.status === 401) {
      // Not signed in -- fall back to a device push token so the seller can
      // still notify this device without an account.
      const push = await enableNotifications()
      if (push.ok) {
        const byToken = await notifyMeForLive(room, push.token)
        setNotifyState(byToken.ok ? 'saved' : 'signin')
        return
      }
      setNotifyState('signin')
      return
    }
    setNotifyState('signin')
  }

  async function reportStream() {
    await reportLiveStream(room)
  }

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.text }}>Loading…</Text>
      </View>
    )
  }

  if (status === 'notfound') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: C.text, fontSize: 16, marginBottom: 10 }}>Stream not found</Text>
        <Pressable onPress={() => nav.goBack()}><Dim>Go back</Dim></Pressable>
      </View>
    )
  }

  if (status === 'ended') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: C.text, fontSize: 16, marginBottom: 10 }}>This stream has ended</Text>
        <Pressable onPress={() => nav.goBack()}><Dim>Go back</Dim></Pressable>
      </View>
    )
  }

  if (status === 'scheduled' && data) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: insets.top + 40 }}>
        <Pressable onPress={() => nav.goBack()} style={{ marginBottom: 20 }}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <Text style={{ color: C.accent, fontFamily: F.displayMed, fontSize: 11, letterSpacing: 1.4 }}>SCHEDULED</Text>
        <Text style={{ color: C.text, fontFamily: F.serifLight, fontSize: 26, marginTop: 8 }}>{data.stream.title}</Text>
        <Dim style={{ marginTop: 6 }}>{data.stream.seller.storeName}</Dim>
        {data.stream.scheduledFor && (
          <Dim style={{ marginTop: 16, lineHeight: 18 }}>
            Goes live {new Date(data.stream.scheduledFor).toLocaleDateString()} at{' '}
            {new Date(data.stream.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Dim>
        )}
        <View style={{ marginTop: 28 }}>
          {notifyState === 'saved' ? (
            <Dim>You'll be notified when this stream starts.</Dim>
          ) : notifyState === 'signin' ? (
            <Pressable onPress={() => nav.navigate('SignIn')}>
              <Text style={{ color: C.accent, fontFamily: F.displayMed }}>Sign in to be notified →</Text>
            </Pressable>
          ) : (
            <Btn label={notifyState === 'busy' ? 'Saving…' : 'Notify me when it starts'} onPress={notifyState === 'busy' ? undefined : notifyMe} />
          )}
        </View>
      </View>
    )
  }

  if (status === 'live' && data && creds) {
    return (
      <ViewerRoom
        wsUrl={creds.wsUrl}
        token={creds.token}
        data={data}
        onReport={reportStream}
        insetsTop={insets.top}
        onBack={() => nav.goBack()}
      />
    )
  }

  return null
}

// Builds its own Room and hands it to <LiveKitRoom room={room}> (the
// documented pre-constructed-instance prop) so chat/pin can call
// room.localParticipant.publishData(...) / room.on(RoomEvent.DataReceived)
// directly -- Participant carries no back-reference to its Room, so there
// is no way to recover one from a track after the fact.
function ViewerRoom(props: {
  wsUrl: string
  token: string
  data: LiveRoomData
  onReport: () => void
  insetsTop: number
  onBack: () => void
}) {
  const roomRef = useRef<Room | null>(null)
  if (!roomRef.current) roomRef.current = new Room()
  const room = roomRef.current

  return (
    <LiveKitRoom room={room} serverUrl={props.wsUrl} token={props.token} connect audio={false} video={false} style={{ flex: 1, backgroundColor: '#000' }}>
      <ViewerView room={room} data={props.data} onReport={props.onReport} insetsTop={props.insetsTop} onBack={props.onBack} />
    </LiveKitRoom>
  )
}

function ViewerView({
  room,
  data,
  onReport,
  insetsTop,
  onBack,
}: {
  room: Room
  data: LiveRoomData
  onReport: () => void
  insetsTop: number
  onBack: () => void
}) {
  const cameraTracks = useTracks([Track.Source.Camera])
  const remoteTrack = cameraTracks.find((t) => isTrackReference(t) && !t.participant.isLocal)
  const add = useCart((s) => s.add)

  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [chat, setChat] = useState<{ id: string; name: string; text: string }[]>([])
  const [chatDraft, setChatDraft] = useState('')
  const [chatError, setChatError] = useState('')
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    AudioSession.startAudioSession()
    return () => { AudioSession.stopAudioSession() }
  }, [])

  useEffect(() => {
    const onData = (payload: Uint8Array) => {
      const msg = decodeLiveData(payload)
      if (!msg) return
      if (msg.t === 'chat') {
        if (checkMessageContent(msg.text).blocked) return
        setChat((prev) => [...prev.slice(-119), { id: `${Date.now()}-${Math.random()}`, name: msg.name, text: msg.text }])
      } else if (msg.t === 'pin' || msg.t === 'state') {
        setPinnedId(msg.productId)
      }
    }
    room.on(RoomEvent.DataReceived, onData)
    return () => { room.off(RoomEvent.DataReceived, onData) }
  }, [room])

  function offerApplies(p: LiveRoomProduct) {
    return !!data.liveOffer && (data.liveOffer.productIds.length === 0 || data.liveOffer.productIds.includes(p.id))
  }
  function offerPrice(p: LiveRoomProduct) {
    if (!data.liveOffer || !offerApplies(p)) return null
    return Math.round(p.price * (1 - data.liveOffer.percent / 100) * 100) / 100
  }

  function say(msg: string) {
    setNote(msg)
    setTimeout(() => setNote(null), 2200)
  }

  function buyNow(p: LiveRoomProduct) {
    const discounted = offerPrice(p)
    add(
      {
        id: p.id,
        title: p.title,
        name: p.title,
        price: p.price,
        images: p.images,
        discountedPrice: discounted,
      } as any,
      1
    )
    say('Added to your basket')
  }

  function sendChat() {
    setChatError('')
    const text = chatDraft.trim()
    if (!text) return
    const check = checkMessageContent(text)
    if (check.blocked) { setChatError(check.reason ?? "That message can't be sent."); return }
    const name = 'You'
    const msg: LiveDataMsg = { t: 'chat', name, text }
    room.localParticipant.publishData(encodeLiveData(msg), { reliable: true })
    setChat((prev) => [...prev.slice(-119), { id: `${Date.now()}-${Math.random()}`, name, text }])
    setChatDraft('')
  }

  const pinned = data.products.find((p) => p.id === pinnedId) ?? null
  const trayProducts = data.products.filter((p) => p.id !== pinnedId)

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {remoteTrack && isTrackReference(remoteTrack) ? (
        <VideoTrack trackRef={remoteTrack} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
          <Dim>Connecting to the broadcast…</Dim>
        </View>
      )}

      <View style={{ position: 'absolute', top: insetsTop + 14, left: 14, right: 14, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable style={s.gbtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={18} color={C.text} />
        </Pressable>
        <View style={s.liveChip}>
          <View style={s.redDot} />
          <Text style={s.checkTx}>LIVE</Text>
        </View>
        <Text style={{ color: '#fff', marginLeft: 10, fontSize: 12.5, flex: 1 }} numberOfLines={1}>
          {data.stream.seller.storeName}
        </Text>
        <Pressable style={s.gbtn} onPress={onReport}>
          <Ionicons name="flag-outline" size={16} color={C.text} />
        </Pressable>
      </View>

      {data.liveOffer && (
        <View style={{ position: 'absolute', top: insetsTop + 60, left: 14 }}>
          <View style={s.offerBadge}>
            <Text style={{ color: '#160a00', fontFamily: F.displayMed, fontSize: 11 }}>
              Live price: {data.liveOffer.percent}% off featured items
            </Text>
          </View>
        </View>
      )}

      {note ? (
        <View style={{ position: 'absolute', top: insetsTop + 96, left: 14 }}>
          <View style={s.noteBub}><Text style={{ color: C.text, fontSize: 12 }}>{note}</Text></View>
        </View>
      ) : null}

      <View style={{ position: 'absolute', left: 14, right: 14, bottom: 210 }}>
        {pinned && (
          <View style={s.pinnedCard}>
            {pinned.images?.[0] ? (
              <Image source={{ uri: pinned.images[0] }} style={s.pinnedImg} contentFit="cover" />
            ) : (
              <View style={[s.pinnedImg, { backgroundColor: C.surf2 }]} />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Dim style={{ fontSize: 10 }}>NOW SHOWING</Dim>
              <Text style={{ color: '#fff', fontFamily: F.displayMed, fontSize: 13 }} numberOfLines={1}>{pinned.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {offerPrice(pinned) != null && (
                  <Text style={{ color: '#999', fontSize: 11, textDecorationLine: 'line-through' }}>{fmt(pinned.price, 0)}</Text>
                )}
                <Text style={{ color: C.accent, fontFamily: F.bodySemi, fontSize: 12.5 }}>
                  {fmt(offerPrice(pinned) ?? pinned.price, 0)}
                </Text>
              </View>
            </View>
            <Pressable style={s.addBtn} onPress={() => buyNow(pinned)}>
              <Text style={{ fontFamily: F.display, fontSize: 12, color: '#160a00' }}>Buy now</Text>
            </Pressable>
          </View>
        )}
        {trayProducts.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {trayProducts.map((p) => (
                <View key={p.id} style={s.trayCard}>
                  {p.images?.[0] ? (
                    <Image source={{ uri: p.images[0] }} style={s.trayImg} contentFit="cover" />
                  ) : (
                    <View style={[s.trayImg, { backgroundColor: C.surf2 }]} />
                  )}
                  <Text style={{ color: '#fff', fontSize: 10.5, marginTop: 4 }} numberOfLines={1}>{p.title}</Text>
                  <Text style={{ color: C.accent, fontSize: 10.5, fontFamily: F.bodySemi }}>{fmt(offerPrice(p) ?? p.price, 0)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <View style={s.chatPanel} pointerEvents="none">
        {chat.slice(-4).map((m) => (
          <Text key={m.id} style={{ color: '#fff', fontSize: 12, marginBottom: 3 }} numberOfLines={1}>
            <Text style={{ color: C.accent, fontFamily: F.bodySemi }}>{m.name}: </Text>
            {m.text}
          </Text>
        ))}
        {chatError ? <Text style={{ color: C.red, fontSize: 11, marginBottom: 4 }}>{chatError}</Text> : null}
      </View>

      <View style={s.chatInputRow}>
        <TextInput
          value={chatDraft}
          onChangeText={setChatDraft}
          onSubmitEditing={sendChat}
          placeholder="Say something…"
          placeholderTextColor="#999"
          style={s.chatIn}
        />
        <Pressable style={s.sendBtn} onPress={sendChat}>
          <Ionicons name="send" size={15} color="#160a00" />
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  gbtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20,20,26,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  redDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
  checkTx: { fontFamily: F.display, fontSize: 9, letterSpacing: 1.2, color: C.accent },
  offerBadge: { backgroundColor: C.accent, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  noteBub: { backgroundColor: 'rgba(20,20,26,0.9)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  pinnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15,15,19,0.88)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 8,
  },
  pinnedImg: { width: 46, height: 46, borderRadius: 12 },
  addBtn: { backgroundColor: C.accent, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  trayCard: { width: 84 },
  trayImg: { width: 84, height: 84, borderRadius: 12 },
  chatPanel: { position: 'absolute', left: 14, right: 14, bottom: 76, maxHeight: 100 },
  chatInputRow: { position: 'absolute', left: 14, right: 14, bottom: 26, flexDirection: 'row', gap: 8 },
  chatIn: {
    flex: 1,
    fontFamily: F.body,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  sendBtn: { backgroundColor: C.accent, borderRadius: 999, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
})
