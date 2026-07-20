import React, { useEffect, useRef, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Animated, Share } from 'react-native'
import { Text } from '../ui/T'
import { TextInput } from '../ui/TI'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
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
  // TikTok LIVE parity, same shared model the website viewer page now uses
  // (William, 2026-07-20): a real LiveKit-reported viewer count -- other
  // remote participants in this same room, not invented -- and a local
  // tap-to-like counter with a floating heart, the same "no server-side
  // like field on LiveStream" caveat as the web version: this is in-the-
  // moment feedback for this viewer only, never presented as a shared total.
  const [viewerCount, setViewerCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [hearts, setHearts] = useState<{ id: string; anim: Animated.Value; x: number }[]>([])
  const lastTapRef = useRef(0)

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
    const syncViewerCount = () => setViewerCount(room.remoteParticipants.size)
    room.on(RoomEvent.DataReceived, onData)
    room.on(RoomEvent.ParticipantConnected, syncViewerCount)
    room.on(RoomEvent.ParticipantDisconnected, syncViewerCount)
    syncViewerCount()
    return () => {
      room.off(RoomEvent.DataReceived, onData)
      room.off(RoomEvent.ParticipantConnected, syncViewerCount)
      room.off(RoomEvent.ParticipantDisconnected, syncViewerCount)
    }
  }, [room])

  function sendHeart() {
    setLikeCount((c) => c + 1)
    const id = `${Date.now()}-${Math.random()}`
    const anim = new Animated.Value(0)
    const x = Math.random() * 30 - 15
    setHearts((prev) => [...prev.slice(-13), { id, anim, x }])
    Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }).start(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id))
    })
  }

  // Double-tap-on-video-to-like -- RN has no native onDoubleClick, so a
  // single Pressable on the video layer measures the gap between taps.
  function onVideoTap() {
    const now = Date.now()
    if (now - lastTapRef.current < 300) sendHeart()
    lastTapRef.current = now
  }

  async function shareStream() {
    try {
      await Share.share({
        message: `Watch ${data.stream.seller.storeName} live on Velor: https://velorcommerce.store/live/${data.stream.roomName}`,
      })
    } catch {
      // user dismissed the native share sheet -- not an error
    }
  }

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
        <Pressable onPress={onVideoTap} style={StyleSheet.absoluteFill}>
          <VideoTrack trackRef={remoteTrack} style={StyleSheet.absoluteFill} />
        </Pressable>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
          <Dim>Connecting to the broadcast…</Dim>
        </View>
      )}

      <LinearGradient colors={['rgba(0,0,0,0.75)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insetsTop + 90 }} pointerEvents="none" />

      {/* Identity chip -- avatar (real storeLogo when the seller has set
          one, initial-letter fallback otherwise) + name + LIVE, matching
          the website viewer's top-left exactly. Back arrow moved next to it
          rather than the old dedicated circle button, viewer count now real
          (LiveKit remoteParticipants), Report kept as its own icon -- RN has
          no equivalent to the web's "..." overflow affordance worth adding
          just for one action. */}
      <View style={{ position: 'absolute', top: insetsTop + 14, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', zIndex: 3 }}>
        <Pressable style={s.gbtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={18} color={C.text} />
        </Pressable>
        {data.stream.seller.storeLogo ? (
          <Image source={{ uri: data.stream.seller.storeLogo }} style={s.avatar} contentFit="cover" />
        ) : (
          <View style={s.avatarFallback}>
            <Text style={{ color: '#111', fontFamily: F.display, fontSize: 13 }}>{(data.stream.seller.storeName || 'V').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ marginLeft: 8, flex: 1, minWidth: 0 }}>
          <Text style={{ color: '#fff', fontSize: 13.5, fontFamily: F.bodySemi }} numberOfLines={1}>{data.stream.seller.storeName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={s.redDot} />
            <Text style={s.checkTx}>LIVE</Text>
          </View>
        </View>
        <View style={s.viewerPill}>
          <Ionicons name="eye-outline" size={12} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 11.5, fontFamily: F.bodySemi, marginLeft: 3 }}>{viewerCount}</Text>
        </View>
        <Pressable style={s.gbtn} onPress={onReport}>
          <Ionicons name="flag-outline" size={16} color={C.text} />
        </Pressable>
      </View>

      {data.liveOffer && (
        <View style={{ position: 'absolute', top: insetsTop + 62, left: 14, zIndex: 3 }}>
          <View style={s.offerBadge}>
            <Text style={{ color: '#160a00', fontFamily: F.displayMed, fontSize: 11 }}>
              Live price: {data.liveOffer.percent}% off featured items
            </Text>
          </View>
        </View>
      )}

      {note ? (
        <View style={{ position: 'absolute', top: insetsTop + 98, left: 14, zIndex: 3 }}>
          <View style={s.noteBub}><Text style={{ color: C.text, fontSize: 12 }}>{note}</Text></View>
        </View>
      ) : null}

      {/* Right action rail -- like (tap or double-tap-on-video, floating
          heart burst) and share, the same TikTok-parity pair the website
          viewer got; no bag icon here since the pinned/tray strip below is
          already always visible on this smaller screen, unlike the site's
          collapsible desktop-width version. Positioned by a fixed offset
          below the header rather than anchored to the bottom stack, so it
          never collides with the pinned card + tray, which vary in height
          with how many products a seller has featured. */}
      <View style={{ position: 'absolute', right: 10, top: insetsTop + 110, zIndex: 3, alignItems: 'center', gap: 20 }}>
        <View style={{ alignItems: 'center' }}>
          <Pressable style={s.railBtn} onPress={sendHeart}>
            <View style={s.railCircle}>
              <Ionicons name={likeCount > 0 ? 'heart' : 'heart-outline'} size={20} color={likeCount > 0 ? C.accent : '#fff'} />
            </View>
            <Text style={s.railTx}>{likeCount}</Text>
          </Pressable>
          {hearts.map((h) => (
            <Animated.View
              key={h.id}
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: 34,
                left: 15 + h.x,
                opacity: h.anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                transform: [
                  { translateY: h.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -190] }) },
                  { scale: h.anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.6, 1, 1.05] }) },
                ],
              }}
            >
              <Ionicons name="heart" size={20} color={C.accent} />
            </Animated.View>
          ))}
        </View>
        <Pressable style={s.railBtn} onPress={shareStream}>
          <View style={s.railCircle}>
            <Ionicons name="share-social-outline" size={19} color="#fff" />
          </View>
          <Text style={s.railTx}>Share</Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.9)']}
        locations={[0, 0.35, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 340 }}
        pointerEvents="none"
      />

      {/* Now-showing card + tray -- directly above the composer (William:
          "it needs to be just above the text box because the card will
          take up the screen"), not floating high above the chat feed
          where it used to sit. */}
      <View style={{ position: 'absolute', left: 14, right: 14, bottom: 78 }}>
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
          <View key={m.id} style={s.chatBubble}>
            <Text style={{ color: '#fff', fontSize: 12 }} numberOfLines={1}>
              <Text style={{ color: C.accent, fontFamily: F.bodySemi }}>{m.name}: </Text>
              {m.text}
            </Text>
          </View>
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
  // Matches the accent color rather than C.red -- this dot is the LIVE
  // pulse indicator (same one the website viewer pulses in accent orange),
  // not an alert/error state, so it should read as "on air", not "warning".
  redDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  checkTx: { fontFamily: F.display, fontSize: 9, letterSpacing: 1.2, color: C.accent },
  offerBadge: { backgroundColor: C.accent, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  noteBub: { backgroundColor: 'rgba(20,20,26,0.9)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)' },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  viewerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  railBtn: { alignItems: 'center', gap: 3 },
  railCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  railTx: { color: '#fff', fontSize: 10.5, fontFamily: F.bodySemi, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 3 },
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
  // Sits above the now-showing card/tray reserved at the bottom (see the
  // render below) rather than overlapping it.
  chatPanel: { position: 'absolute', left: 14, right: 14, bottom: 210, maxHeight: 100 },
  chatBubble: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 5,
  },
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
