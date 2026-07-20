import React, { useEffect, useRef, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native'
import { TextInput } from '../ui/TI'
import { Text } from '../ui/T'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import DateTimePicker from '@react-native-community/datetimepicker'
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
import { Chrome } from '../components/Chrome'
import {
  fetchSellerLive,
  fetchSellerProducts,
  createLiveStream,
  startScheduledLiveStream,
  endLiveStream,
  SellerLiveStream,
  SellerProduct,
} from '../api'
import { checkMessageContent } from '../messageFilter'
import { encodeLiveData, decodeLiveData, LiveDataMsg } from '../liveData'

// Go live — real broadcasting (2026-07-20). Every plan can go live, Starter
// included. This connects a genuine LiveKit room: camera + mic publish,
// live chat and a pinnable "now showing" product over the data channel,
// scheduling, and an optional live-only discount. Requires a custom
// dev-client / EAS build -- LiveKit's native module is not present in
// Expo Go (see the note at the top of App.tsx).
export default function GoLiveScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()

  const [loading, setLoading] = useState(true)
  const [canGoLive, setCanGoLive] = useState(false)
  const [liveKitReady, setLiveKitReady] = useState(true)
  const [storeName, setStoreName] = useState('Seller')
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [activeStream, setActiveStream] = useState<SellerLiveStream | null>(null)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [offerEnabled, setOfferEnabled] = useState(false)
  const [offerPercent, setOfferPercent] = useState('15')

  const [connecting, setConnecting] = useState(false)
  const [starting, setStarting] = useState(false)
  const [liveKitCreds, setLiveKitCreds] = useState<{ wsUrl: string; token: string } | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [live, prods] = await Promise.all([fetchSellerLive(), fetchSellerProducts()])
        setCanGoLive(!!live.canGoLive)
        setLiveKitReady(live.liveKitReady)
        setStoreName(live.storeName || 'Seller')
        setProducts(prods)
        const active = live.streams.find((s) => s.status === 'LIVE' || s.status === 'SCHEDULED')
        if (active) {
          setActiveStream(active)
          if (active.status === 'LIVE') {
            // The app was killed or restarted mid-broadcast -- the stream is
            // still LIVE server-side but this session has no LiveKit
            // credentials to actually render/publish it. The start route
            // reissues a fresh broadcaster token for an already-LIVE stream
            // without touching its status, so use it to reconnect.
            try {
              const result = await startScheduledLiveStream(active.id)
              if (result.token && result.wsUrl) setLiveKitCreds({ token: result.token, wsUrl: result.wsUrl })
            } catch {
              // Reconnect failed -- fall through to the SCHEDULED/LIVE
              // branches below, which show an End option either way.
            }
          }
        }
      } catch {
        setError('Could not load Live Shopping.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function goLiveNow() {
    setError('')
    if (!title.trim()) { setError('Give your stream a title.'); return }
    if (scheduleEnabled && !scheduledFor) { setError('Pick a date and time to schedule for.'); return }
    let liveOfferPercent: number | null = null
    if (offerEnabled) {
      const n = Number(offerPercent)
      if (!Number.isFinite(n) || n < 5 || n > 50) { setError('Live offer must be between 5 and 50 percent.'); return }
      if (selectedProductIds.length === 0) { setError('A live offer needs at least one featured product.'); return }
      liveOfferPercent = n
    }
    setConnecting(true)
    try {
      const result = await createLiveStream({
        title,
        productIds: selectedProductIds,
        scheduledFor: scheduleEnabled && scheduledFor ? scheduledFor.toISOString() : null,
        liveOfferPercent,
      })
      setActiveStream(result.stream)
      if (result.stream.status === 'LIVE' && result.token && result.wsUrl) {
        setLiveKitCreds({ token: result.token, wsUrl: result.wsUrl })
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not start stream.')
    } finally {
      setConnecting(false)
    }
  }

  async function goLiveFromSchedule() {
    if (!activeStream) return
    setError('')
    setStarting(true)
    try {
      const result = await startScheduledLiveStream(activeStream.id)
      setActiveStream(result.stream)
      if (result.token && result.wsUrl) setLiveKitCreds({ token: result.token, wsUrl: result.wsUrl })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not go live.')
    } finally {
      setStarting(false)
    }
  }

  async function cancelOrEnd() {
    if (!activeStream) return
    try {
      await endLiveStream(activeStream.id)
    } catch {
      setError('Could not end the stream cleanly.')
    } finally {
      setActiveStream(null)
      setLiveKitCreds(null)
      setTitle('')
      setSelectedProductIds([])
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.text }}>Loading Live Shopping…</Text>
      </View>
    )
  }

  if (!canGoLive) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: C.text, fontFamily: F.serifLight, fontSize: 22, marginBottom: 10 }}>Go Live Shopping</Text>
        <Dim style={{ textAlign: 'center' }}>Live Shopping is included with every Velor seller plan.</Dim>
        <Chrome back="Dashboard" onBack={() => nav.goBack()} />
      </View>
    )
  }

  if (!liveKitReady) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: C.text, fontSize: 18, marginBottom: 10 }}>Live Shopping is almost ready</Text>
        <Dim style={{ textAlign: 'center' }}>We're finishing the broadcast infrastructure. Check back shortly.</Dim>
        <Chrome back="Dashboard" onBack={() => nav.goBack()} />
      </View>
    )
  }

  // A LIVE stream with LiveKit credentials in hand -- actually broadcasting.
  // Room objects and their client-side listeners/publishData calls do not
  // survive a JSON round-trip, so a fresh Room is built here from the
  // wsUrl+token pair rather than trying to derive one from a track or
  // participant later (Participant carries no back-reference to its Room).
  if (activeStream && activeStream.status === 'LIVE' && liveKitCreds) {
    return (
      <BroadcastRoom
        wsUrl={liveKitCreds.wsUrl}
        token={liveKitCreds.token}
        stream={activeStream}
        streamProducts={products.filter((p) => activeStream.productIds.includes(p.id))}
        storeName={storeName}
        onEnd={cancelOrEnd}
        insetsTop={insets.top}
      />
    )
  }

  // A SCHEDULED stream waiting for the seller to go live, or reconnecting.
  if (activeStream && activeStream.status === 'SCHEDULED') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: insets.top + 58 }}>
        <Text style={{ color: C.accent, fontFamily: F.displayMed, fontSize: 11, letterSpacing: 1.4, marginBottom: 10 }}>SCHEDULED</Text>
        <Text style={{ color: C.text, fontFamily: F.serifLight, fontSize: 24, marginBottom: 10 }}>{activeStream.title}</Text>
        {activeStream.scheduledFor && (
          <Dim style={{ marginBottom: 24, lineHeight: 18 }}>
            Goes live {new Date(activeStream.scheduledFor).toLocaleDateString()} at{' '}
            {new Date(activeStream.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
            Buyers who tapped Notify me will get a push the moment you go live.
          </Dim>
        )}
        {error ? <Text style={{ color: C.red, marginBottom: 14 }}>{error}</Text> : null}
        <Btn label={starting ? 'Going live…' : 'Go Live Now'} onPress={starting ? undefined : goLiveFromSchedule} />
        <Pressable onPress={cancelOrEnd} style={{ marginTop: 14, alignItems: 'center' }}>
          <Dim>Cancel</Dim>
        </Pressable>
        <Chrome back="Dashboard" onBack={() => nav.goBack()} />
      </View>
    )
  }

  // No active stream -- the setup form.
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingHorizontal: 20, paddingBottom: 60 }}>
        <Text style={s.kickDim}>BROADCAST TITLE</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Morning firing — raku, from the kiln"
          placeholderTextColor={C.dim}
          style={s.titleIn}
        />

        <Text style={s.kickDim}>FEATURE PRODUCTS</Text>
        <Dim style={{ fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>
          Buyers tap them to buy while you're on air. Tap to select, up to 12.
        </Dim>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {products.map((p) => {
            const checked = selectedProductIds.includes(p.id)
            return (
              <Pressable
                key={p.id}
                style={[s.pill, checked && { backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent }]}
                onPress={() =>
                  setSelectedProductIds((prev) =>
                    checked ? prev.filter((id) => id !== p.id) : prev.length >= 12 ? prev : [...prev, p.id]
                  )
                }
              >
                <Text style={[s.pillTx, checked && { color: C.accent }]} numberOfLines={1}>
                  {p.title ?? p.name}
                </Text>
              </Pressable>
            )
          })}
          {products.length === 0 && <Dim style={{ fontSize: 12 }}>Add products to your store to feature them.</Dim>}
        </View>

        <Text style={s.kickDim}>SCHEDULE</Text>
        <Pressable
          style={[s.toggleRow]}
          onPress={() => {
            setScheduleEnabled((v) => !v)
            if (!scheduleEnabled && !scheduledFor) {
              const d = new Date(Date.now() + 60 * 60000)
              setScheduledFor(d)
            }
          }}
        >
          <Ionicons name={scheduleEnabled ? 'checkbox' : 'square-outline'} size={19} color={scheduleEnabled ? C.accent : C.mut} />
          <Text style={{ color: C.text, fontSize: 13.5, marginLeft: 8 }}>Schedule for later instead of going live now</Text>
        </Pressable>
        {scheduleEnabled && (
          <>
            <Pressable style={s.dateBtn} onPress={() => setShowPicker(true)}>
              <Ionicons name="calendar-outline" size={16} color={C.text} />
              <Text style={{ color: C.text, fontSize: 13, marginLeft: 8 }}>
                {scheduledFor ? scheduledFor.toLocaleString() : 'Pick a date and time'}
              </Text>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={scheduledFor ?? new Date(Date.now() + 60 * 60000)}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date(Date.now() + 5 * 60000)}
                onChange={(_event, date) => {
                  if (Platform.OS === 'android') setShowPicker(false)
                  if (date) setScheduledFor(date)
                }}
              />
            )}
          </>
        )}

        <Text style={s.kickDim}>LIVE-ONLY OFFER</Text>
        <Pressable style={s.toggleRow} onPress={() => setOfferEnabled((v) => !v)}>
          <Ionicons name={offerEnabled ? 'checkbox' : 'square-outline'} size={19} color={offerEnabled ? C.accent : C.mut} />
          <Text style={{ color: C.text, fontSize: 13.5, marginLeft: 8 }}>Run a discount on featured products, live only</Text>
        </Pressable>
        {offerEnabled && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <TextInput
              value={offerPercent}
              onChangeText={setOfferPercent}
              keyboardType="number-pad"
              style={[s.titleIn, { width: 80, marginTop: 0, textAlign: 'center' }]}
            />
            <Dim style={{ fontSize: 12, flex: 1 }}>% off — the price reverts the moment the stream ends</Dim>
          </View>
        )}

        {error ? <Text style={{ color: C.red, marginTop: 16 }}>{error}</Text> : null}

        <View style={{ marginTop: 24 }}>
          <Btn
            label={connecting ? (scheduleEnabled ? 'Scheduling…' : 'Going live…') : scheduleEnabled ? 'Schedule Stream' : 'Go live'}
            onPress={connecting ? undefined : goLiveNow}
          />
        </View>
        <Dim style={{ textAlign: 'center', marginTop: 10, fontSize: 11, lineHeight: 16 }}>
          Every plan can broadcast — Starter included. Your browser or device will ask for camera and microphone access.
        </Dim>
      </ScrollView>
      <Chrome back="Dashboard" onBack={() => nav.goBack()} />
    </View>
  )
}

// Builds its own Room and hands it to <LiveKitRoom room={room}> — the
// documented way to bring a pre-constructed Room instance (mirrors
// @livekit/components-react's LiveKitRoomProps.room). Keeping our own
// reference means chat/pin can call room.localParticipant.publishData(...)
// and room.on(RoomEvent.DataReceived, ...) directly, without needing to
// pull a Room back out of a track or participant (Participant does not
// expose one) or guess at a useRoomContext()/useDataChannel() hook name.
function BroadcastRoom(props: {
  wsUrl: string
  token: string
  stream: SellerLiveStream
  streamProducts: SellerProduct[]
  storeName: string
  onEnd: () => void
  insetsTop: number
}) {
  const roomRef = useRef<Room | null>(null)
  if (!roomRef.current) roomRef.current = new Room()
  const room = roomRef.current

  return (
    <LiveKitRoom
      room={room}
      serverUrl={props.wsUrl}
      token={props.token}
      connect
      audio
      video
      options={{ videoCaptureDefaults: { facingMode: 'user' } }}
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      <BroadcastView
        room={room}
        stream={props.stream}
        streamProducts={props.streamProducts}
        storeName={props.storeName}
        onEnd={props.onEnd}
        insetsTop={props.insetsTop}
      />
    </LiveKitRoom>
  )
}

function BroadcastView({
  room,
  stream,
  streamProducts,
  storeName,
  onEnd,
  insetsTop,
}: {
  room: Room
  stream: SellerLiveStream
  streamProducts: SellerProduct[]
  storeName: string
  onEnd: () => void
  insetsTop: number
}) {
  const cameraTracks = useTracks([Track.Source.Camera])
  const localTrack = cameraTracks.find((t) => isTrackReference(t) && t.participant.isLocal)

  const pinnedIdRef = useRef<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [chat, setChat] = useState<{ id: string; name: string; text: string }[]>([])
  const [chatDraft, setChatDraft] = useState('')
  const [chatError, setChatError] = useState('')

  useEffect(() => {
    AudioSession.startAudioSession()
    return () => { AudioSession.stopAudioSession() }
  }, [])

  useEffect(() => {
    const onData = (payload: Uint8Array) => {
      const msg = decodeLiveData(payload)
      if (msg?.t === 'chat') {
        if (checkMessageContent(msg.text).blocked) return
        setChat((prev) => [...prev.slice(-119), { id: `${Date.now()}-${Math.random()}`, name: msg.name, text: msg.text }])
      }
    }
    room.on(RoomEvent.DataReceived, onData)
    // Re-broadcast the current pin so a viewer who joins mid-stream still
    // sees whatever is currently featured.
    const onJoin = () => publishPin(pinnedIdRef.current)
    room.on(RoomEvent.ParticipantConnected, onJoin)
    return () => {
      room.off(RoomEvent.DataReceived, onData)
      room.off(RoomEvent.ParticipantConnected, onJoin)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])

  function publishPin(productId: string | null) {
    const msg: LiveDataMsg = { t: 'pin', productId }
    room.localParticipant.publishData(encodeLiveData(msg), { reliable: true })
  }

  function togglePin(id: string) {
    const next = pinnedId === id ? null : id
    setPinnedId(next)
    pinnedIdRef.current = next
    publishPin(next)
  }

  function sendChat() {
    setChatError('')
    const text = chatDraft.trim()
    if (!text) return
    const check = checkMessageContent(text)
    if (check.blocked) { setChatError(check.reason ?? "That message can't be sent."); return }
    const name = `${storeName} (seller)`
    const msg: LiveDataMsg = { t: 'chat', name, text }
    room.localParticipant.publishData(encodeLiveData(msg), { reliable: true })
    setChat((prev) => [...prev.slice(-119), { id: `${Date.now()}-${Math.random()}`, name, text }])
    setChatDraft('')
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {localTrack && isTrackReference(localTrack) ? (
        <VideoTrack trackRef={localTrack} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      )}

      <View style={{ position: 'absolute', top: insetsTop + 14, left: 14, right: 14, flexDirection: 'row', alignItems: 'center' }}>
        <View style={s.liveChip}>
          <View style={s.redDot} />
          <Text style={s.checkTx}>LIVE</Text>
        </View>
        <Text style={{ color: '#fff', marginLeft: 10, fontSize: 12.5, flex: 1 }} numberOfLines={1}>{stream.title}</Text>
        <Pressable style={s.endBtn} onPress={onEnd}>
          <Text style={{ color: '#fff', fontFamily: F.displayMed, fontSize: 11.5 }}>End</Text>
        </Pressable>
      </View>

      {streamProducts.length > 0 && (
        <View style={{ position: 'absolute', left: 14, right: 14, bottom: 220 }}>
          <Dim style={{ fontSize: 11, marginBottom: 8, color: '#ddd' }}>Tap to pin "Now showing"</Dim>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {streamProducts.map((p) => {
              const isPinned = pinnedId === p.id
              return (
                <Pressable
                  key={p.id}
                  style={[s.pill, { backgroundColor: 'rgba(0,0,0,0.55)' }, isPinned && { borderColor: C.accent, borderWidth: 1 }]}
                  onPress={() => togglePin(p.id)}
                >
                  <Text style={[s.pillTx, isPinned && { color: C.accent }]} numberOfLines={1}>{p.title ?? p.name}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}

      <View style={s.chatPanel}>
        {chat.slice(-4).map((m) => (
          <Text key={m.id} style={{ color: '#fff', fontSize: 12, marginBottom: 3 }} numberOfLines={1}>
            <Text style={{ color: C.accent, fontFamily: F.bodySemi }}>{m.name}: </Text>
            {m.text}
          </Text>
        ))}
        {chatError ? <Text style={{ color: C.red, fontSize: 11, marginBottom: 4 }}>{chatError}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={chatDraft}
            onChangeText={setChatDraft}
            onSubmitEditing={sendChat}
            placeholder="Reply to viewers…"
            placeholderTextColor="#999"
            style={s.chatIn}
          />
          <Pressable style={s.sendBtn} onPress={sendChat}>
            <Ionicons name="send" size={15} color="#160a00" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut, marginTop: 24 },
  titleIn: {
    fontFamily: F.bodySemi,
    fontSize: 15,
    color: C.text,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    maxWidth: 200,
  },
  pillTx: { fontFamily: F.displayMed, fontSize: 12, color: C.text },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: 'flex-start',
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
  endBtn: { backgroundColor: '#ff3b3b', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  chatPanel: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 26,
    backgroundColor: 'rgba(10,10,13,0.72)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  chatIn: {
    flex: 1,
    fontFamily: F.body,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  sendBtn: { backgroundColor: C.accent, borderRadius: 999, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
})
