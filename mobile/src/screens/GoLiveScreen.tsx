import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Platform, Switch } from 'react-native'
import { Image } from 'expo-image'
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
import { Room, RoomEvent, Track, ConnectionQuality } from 'livekit-client'
import { C, F } from '../theme'
import { Dim, Btn, Kicker, Display } from '../ui'
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
import { fmt } from '../i18n'
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
  const [description, setDescription] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [offerEnabled, setOfferEnabled] = useState(false)
  const [offerPercent, setOfferPercent] = useState('15')

  const [connecting, setConnecting] = useState(false)
  const [starting, setStarting] = useState(false)
  const [liveKitCreds, setLiveKitCreds] = useState<{ wsUrl: string; token: string } | null>(null)

  // Live-updating preview of the exact card buyers will see pinned on
  // screen once this product is featured — mirrors the website setup
  // page's "How buyers will see it" panel (William: "highly advanced ...
  // every angle covered").
  const mockPinnedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductIds[0]) ?? null,
    [products, selectedProductIds]
  )

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
    if (checkMessageContent(`${title} ${description}`).blocked) { setError("Titles and descriptions can't include contact details, links, or social handles - everything stays on Velor, on stream too."); return }
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
        description: description.trim() || undefined,
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
      setDescription('')
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
  const offerPct = Number(offerPercent)
  const offerValid = Number.isFinite(offerPct) && offerPct >= 5 && offerPct <= 50
  const previewPrice = mockPinnedProduct?.price ?? 0
  const previewNowPrice = offerEnabled && offerValid ? previewPrice * (1 - offerPct / 100) : previewPrice

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingHorizontal: 20, paddingBottom: 60 }}>
        <Kicker>LIVE SHOPPING</Kicker>
        <Display style={{ marginTop: 4 }}>Go Live</Display>
        <Dim style={{ marginTop: 6, lineHeight: 18 }}>
          Every plan can broadcast — Starter included. Set up your stream below, then go live in one tap.
        </Dim>

        {/* Live buyer-facing preview -- mirrors the pinned card viewers */}
        {/* actually see, so a seller can check it before ever going live. */}
        <View style={s.card}>
          <SectionLabel icon="eye-outline" title="How buyers will see it" />
          <View style={s.previewStub}>
            <View style={s.previewTopRow}>
              <View style={s.previewAvatar}>
                <Text style={s.previewAvatarTx}>{storeName.slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text style={s.previewName} numberOfLines={1}>{storeName}</Text>
              <View style={s.previewLiveChip}>
                <View style={s.redDot} />
                <Text style={s.previewLiveTx}>LIVE</Text>
              </View>
            </View>
            {mockPinnedProduct ? (
              <View style={s.previewPin}>
                {mockPinnedProduct.images?.[0] ? (
                  <Image source={{ uri: mockPinnedProduct.images[0] }} style={s.previewPinImg} contentFit="cover" />
                ) : (
                  <View style={[s.previewPinImg, { backgroundColor: C.surf2 }]} />
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.previewKicker}>Now showing</Text>
                  <Text style={s.previewPinTitle} numberOfLines={1}>{mockPinnedProduct.title ?? mockPinnedProduct.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                    <Text style={s.previewPrice}>{fmt(previewNowPrice)}</Text>
                    {offerEnabled && offerValid && (
                      <Text style={s.previewWasPrice}>{fmt(previewPrice)}</Text>
                    )}
                  </View>
                </View>
                <View style={s.previewBuyBtn}>
                  <Text style={s.previewBuyTx}>Buy now</Text>
                </View>
              </View>
            ) : (
              <Dim style={{ fontSize: 11.5, marginTop: 10 }}>Feature a product below to preview its live card.</Dim>
            )}
            <Text style={s.previewCaption} numberOfLines={1}>{title || 'Your stream title appears here'}</Text>
          </View>
        </View>

        {/* Stream details */}
        <View style={s.card}>
          <SectionLabel icon="videocam-outline" title="Stream details" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
            <Text style={s.fieldLabel}>Title</Text>
            <Dim style={{ fontSize: 10.5 }}>{title.length}/80</Dim>
          </View>
          <TextInput
            value={title}
            onChangeText={(v) => setTitle(v.slice(0, 80))}
            placeholder="Morning firing — raku, from the kiln"
            placeholderTextColor={C.dim}
            style={s.titleIn}
          />
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What you're making, sourcing, or showing off today"
            placeholderTextColor={C.dim}
            multiline
            style={[s.titleIn, { minHeight: 68, textAlignVertical: 'top', paddingTop: 12 }]}
          />
        </View>

        {/* Feature products -- image-card grid */}
        <View style={s.card}>
          <SectionLabel icon="grid-outline" title={`Feature products (${selectedProductIds.length}/12)`} />
          <Dim style={{ fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>
            Buyers tap them to buy while you're on air.
          </Dim>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {products.map((p) => {
              const checked = selectedProductIds.includes(p.id)
              const soldOut = p.stock <= 0
              const atCap = !checked && selectedProductIds.length >= 12
              const disabled = soldOut || atCap
              return (
                <Pressable
                  key={p.id}
                  disabled={disabled}
                  style={[s.prodCard, checked && s.prodCardOn, disabled && { opacity: 0.4 }]}
                  onPress={() =>
                    setSelectedProductIds((prev) =>
                      checked ? prev.filter((id) => id !== p.id) : prev.length >= 12 ? prev : [...prev, p.id]
                    )
                  }
                >
                  {p.images?.[0] ? (
                    <Image source={{ uri: p.images[0] }} style={s.prodImg} contentFit="cover" />
                  ) : (
                    <View style={[s.prodImg, { backgroundColor: C.surf2 }]} />
                  )}
                  {checked && (
                    <View style={s.prodCheck}>
                      <Ionicons name="checkmark" size={12} color="#160a00" />
                    </View>
                  )}
                  {soldOut && (
                    <View style={s.prodSoldOut}>
                      <Text style={s.prodSoldOutTx}>Sold out</Text>
                    </View>
                  )}
                  <Text style={s.prodTitle} numberOfLines={1}>{p.title ?? p.name}</Text>
                  <Text style={s.prodPrice}>{fmt(p.price)}</Text>
                </Pressable>
              )
            })}
            {products.length === 0 && <Dim style={{ fontSize: 12 }}>Add products to your store to feature them.</Dim>}
          </View>
        </View>

        {/* Schedule + live offer -- native switches, not checkboxes */}
        <View style={s.card}>
          <FeatureRow
            icon="calendar-outline"
            title="Schedule for later"
            description="Pick a date and time instead of going live now."
            value={scheduleEnabled}
            onValueChange={(v) => {
              setScheduleEnabled(v)
              if (v && !scheduledFor) setScheduledFor(new Date(Date.now() + 60 * 60000))
            }}
          />
          {scheduleEnabled && (
            <Pressable style={s.dateBtn} onPress={() => setShowPicker(true)}>
              <Ionicons name="calendar-outline" size={16} color={C.text} />
              <Text style={{ color: C.text, fontSize: 13, marginLeft: 8 }}>
                {scheduledFor ? scheduledFor.toLocaleString() : 'Pick a date and time'}
              </Text>
            </Pressable>
          )}
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

          <View style={s.divider} />

          <FeatureRow
            icon="pricetag-outline"
            title="Live-only discount"
            description="Run a discount on featured products — reverts the moment you end."
            value={offerEnabled}
            onValueChange={setOfferEnabled}
          />
          {offerEnabled && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <TextInput
                value={offerPercent}
                onChangeText={setOfferPercent}
                keyboardType="number-pad"
                style={[s.titleIn, { width: 80, marginTop: 0, textAlign: 'center' }]}
              />
              <Dim style={{ fontSize: 12, flex: 1 }}>% off, between 5 and 50</Dim>
            </View>
          )}
        </View>

        {error ? <Text style={{ color: C.red, marginTop: 4, marginBottom: 12 }}>{error}</Text> : null}

        <View style={{ marginTop: 8 }}>
          <Btn
            label={connecting ? (scheduleEnabled ? 'Scheduling…' : 'Going live…') : scheduleEnabled ? 'Schedule Stream' : 'Go Live Now'}
            onPress={connecting ? undefined : goLiveNow}
          />
        </View>
        <Dim style={{ textAlign: 'center', marginTop: 10, fontSize: 11, lineHeight: 16 }}>
          Your device will ask for camera and microphone access when you go live.
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
  const [viewerCount, setViewerCount] = useState(0)
  const [connQuality, setConnQuality] = useState<ConnectionQuality>(ConnectionQuality.Unknown)
  const [micLevel, setMicLevel] = useState(0)

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
    const syncViewerCount = () => setViewerCount(room.remoteParticipants.size)
    room.on(RoomEvent.ParticipantConnected, onJoin)
    room.on(RoomEvent.ParticipantConnected, syncViewerCount)
    room.on(RoomEvent.ParticipantDisconnected, syncViewerCount)
    const onQuality = (quality: ConnectionQuality, participant: { isLocal: boolean }) => {
      if (participant.isLocal) setConnQuality(quality)
    }
    room.on(RoomEvent.ConnectionQualityChanged, onQuality)
    const onSpeakers = (speakers: { isLocal: boolean; audioLevel: number }[]) => {
      const me = speakers.find((p) => p.isLocal)
      setMicLevel(me ? me.audioLevel : 0)
    }
    room.on(RoomEvent.ActiveSpeakersChanged, onSpeakers)
    syncViewerCount()
    return () => {
      room.off(RoomEvent.DataReceived, onData)
      room.off(RoomEvent.ParticipantConnected, onJoin)
      room.off(RoomEvent.ParticipantConnected, syncViewerCount)
      room.off(RoomEvent.ParticipantDisconnected, syncViewerCount)
      room.off(RoomEvent.ConnectionQualityChanged, onQuality)
      room.off(RoomEvent.ActiveSpeakersChanged, onSpeakers)
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
        <View style={s.viewerChip}>
          <Ionicons name="eye-outline" size={11} color="#ddd" />
          <Text style={s.viewerChipTx}>{viewerCount}</Text>
        </View>
        <MicMeter level={micLevel} />
        <View style={{ flex: 1 }} />
        <ConnQualityChip quality={connQuality} />
        <Pressable style={[s.endBtn, { marginLeft: 8 }]} onPress={onEnd}>
          <Text style={{ color: '#fff', fontFamily: F.displayMed, fontSize: 11.5 }}>End</Text>
        </Pressable>
      </View>
      <Text style={{ position: 'absolute', top: insetsTop + 46, left: 14, right: 14, color: '#fff', fontSize: 12.5 }} numberOfLines={1}>{stream.title}</Text>

      {streamProducts.length > 0 && (
        <View style={{ position: 'absolute', left: 14, right: 14, bottom: 220 }}>
          <Dim style={{ fontSize: 11, marginBottom: 8, color: '#ddd' }}>Tap to pin "Now showing"</Dim>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {streamProducts.map((p) => {
              const isPinned = pinnedId === p.id
              return (
                <Pressable
                  key={p.id}
                  style={[s.pinChip, isPinned && { borderColor: C.accent, borderWidth: 1 }]}
                  onPress={() => togglePin(p.id)}
                >
                  {p.images?.[0] ? (
                    <Image source={{ uri: p.images[0] }} style={s.pinChipImg} contentFit="cover" />
                  ) : (
                    <View style={[s.pinChipImg, { backgroundColor: C.surf2 }]} />
                  )}
                  <Text style={[s.pillTx, isPinned && { color: C.accent }]} numberOfLines={1}>{p.title ?? p.name}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}

      {/* Fixed-height chat feed -- always the same size on screen, newest
          message pushes older ones up and off the top via the fade mask,
          never expands to cover the picture. */}
      <View style={s.chatFeed} pointerEvents="none">
        {chat.slice(-6).reverse().map((m) => (
          <View key={m.id} style={s.chatBubble}>
            <Text style={{ color: '#fff', fontSize: 12 }} numberOfLines={2}>
              <Text style={{ color: C.accent, fontFamily: F.bodySemi }}>{m.name}: </Text>
              {m.text}
            </Text>
          </View>
        ))}
      </View>

      <View style={s.composerRow}>
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

// A compact live mic-level meter -- 5 bars lit up to `level` (0..1), driven
// by the room's own ActiveSpeakersChanged event (genuine audio level, not
// a decorative animation).
function MicMeter({ level }: { level: number }) {
  const lit = Math.round(level * 5)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginLeft: 8, height: 12 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: 4 + i * 2,
            borderRadius: 1,
            backgroundColor: i < lit ? C.accent : 'rgba(255,255,255,0.25)',
          }}
        />
      ))}
    </View>
  )
}

const CONN_QUALITY_LABEL: Record<ConnectionQuality, string> = {
  [ConnectionQuality.Excellent]: 'Excellent',
  [ConnectionQuality.Good]: 'Good',
  [ConnectionQuality.Poor]: 'Weak',
  [ConnectionQuality.Lost]: 'Lost',
  [ConnectionQuality.Unknown]: '',
}

function ConnQualityChip({ quality }: { quality: ConnectionQuality }) {
  const label = CONN_QUALITY_LABEL[quality]
  if (!label) return null
  const color = quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost ? C.red : C.green
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ color: '#eee', fontSize: 10.5, fontFamily: F.displayMed }}>{label}</Text>
    </View>
  )
}

type IconName = React.ComponentProps<typeof Ionicons>['name']

function SectionLabel({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View style={s.sectionLabelRow}>
      <Ionicons name={icon} size={14} color={C.accent} />
      <Text style={s.sectionLabelTx}>{title}</Text>
    </View>
  )
}

function FeatureRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: IconName
  title: string
  description: string
  value: boolean
  onValueChange: (v: boolean) => void
}) {
  return (
    <View style={s.featureRow}>
      <View style={s.featureRowIcon}>
        <Ionicons name={icon} size={16} color={value ? C.accent : C.mut} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.featureRowTitle}>{title}</Text>
        <Dim style={{ fontSize: 11, marginTop: 2, lineHeight: 15 }}>{description}</Dim>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: C.accentSoft }}
        thumbColor={value ? C.accent : '#8a8a95'}
        ios_backgroundColor="rgba(255,255,255,0.15)"
      />
    </View>
  )
}

const s = StyleSheet.create({
  kickDim: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 2.2, color: C.mut, marginTop: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
  },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionLabelTx: { fontFamily: F.displayMed, fontSize: 12.5, color: C.text, letterSpacing: 0.2 },
  fieldLabel: { fontFamily: F.displayMed, fontSize: 10.5, color: C.mut, letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureRowTitle: { fontFamily: F.bodySemi, fontSize: 13.5, color: C.text },
  // Buyer-facing preview stub, mirrors the actual pinned card styling.
  previewStub: {
    marginTop: 12,
    backgroundColor: '#0a0a0d',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  previewTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarTx: { fontFamily: F.display, fontSize: 11, color: '#160a00' },
  previewName: { fontFamily: F.bodySemi, fontSize: 12.5, color: '#fff', flex: 1 },
  previewLiveChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewLiveTx: { fontFamily: F.display, fontSize: 9, letterSpacing: 1, color: C.accent },
  previewPin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 12,
    padding: 8,
  },
  previewPinImg: { width: 40, height: 40, borderRadius: 8 },
  previewKicker: { fontFamily: F.displayMed, fontSize: 9, letterSpacing: 0.5, color: C.accent, textTransform: 'uppercase' },
  previewPinTitle: { fontFamily: F.bodySemi, fontSize: 12.5, color: '#fff', marginTop: 1 },
  previewPrice: { fontFamily: F.displayMed, fontSize: 13, color: C.accent },
  previewWasPrice: { fontFamily: F.body, fontSize: 11, color: '#999', textDecorationLine: 'line-through' },
  previewBuyBtn: { backgroundColor: C.accent, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  previewBuyTx: { fontFamily: F.displayMed, fontSize: 11, color: '#160a00' },
  previewCaption: { fontFamily: F.bodySemi, fontSize: 12, color: '#ddd', marginTop: 10 },
  // Product picker image cards
  prodCard: {
    width: '31%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  prodCardOn: { borderColor: C.accent, backgroundColor: C.accentSoft },
  prodImg: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  prodCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodSoldOut: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  prodSoldOutTx: { fontFamily: F.displayMed, fontSize: 8.5, color: '#fff' },
  prodTitle: { fontFamily: F.bodySemi, fontSize: 11, color: C.text, marginTop: 6 },
  prodPrice: { fontFamily: F.displayMed, fontSize: 11, color: C.accent, marginTop: 2 },
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
  viewerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  viewerChipTx: { fontFamily: F.displayMed, fontSize: 10.5, color: '#ddd' },
  pinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    paddingLeft: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    maxWidth: 220,
  },
  pinChipImg: { width: 26, height: 26, borderRadius: 13 },
  // Fixed-height chat feed: never grows, newest bubble at the bottom,
  // fading upward -- mirrors the buyer viewer + website broadcaster.
  chatFeed: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 74,
    height: 120,
    overflow: 'hidden',
    flexDirection: 'column-reverse',
    gap: 6,
  },
  chatBubble: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  composerRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 20,
  },
  chatIn: {
    flex: 1,
    fontFamily: F.body,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  sendBtn: { backgroundColor: C.accent, borderRadius: 999, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
})
