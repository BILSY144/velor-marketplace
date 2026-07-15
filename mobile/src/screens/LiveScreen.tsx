import React, { useCallback, useRef, useState } from 'react'
import { View, FlatList, StyleSheet, useWindowDimensions, ViewToken } from 'react-native'
import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, F, flagUrl } from '../theme'
import { FILMS, countryName, Film } from '../data'
import { Kicker, Body, Dim, Serif } from '../ui'

// Vertical, swipeable, country-first feed — the app twin of the mockup's
// Velor Live. Every card is honestly badged PREVIEW until real sellers
// broadcast; no fake viewer counts anywhere (CAP/ASA rule).
export default function LiveScreen() {
  const { height, width } = useWindowDimensions()
  const [active, setActive] = useState(0)

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length) setActive(viewableItems[0].index ?? 0)
  })

  const renderItem = useCallback(
    ({ item, index }: { item: Film; index: number }) => (
      <FilmPage film={item} active={index === active} height={height} width={width} />
    ),
    [active, height, width]
  )

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: '#000' }}
      data={FILMS}
      keyExtractor={(f) => f.src}
      renderItem={renderItem}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={height}
      decelerationRate="fast"
      getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
      viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
      onViewableItemsChanged={onViewable.current}
      windowSize={3}
      maxToRenderPerBatch={2}
      initialNumToRender={1}
    />
  )
}

function FilmPage({
  film,
  active,
  height,
  width,
}: {
  film: Film
  active: boolean
  height: number
  width: number
}) {
  const insets = useSafeAreaInsets()
  const player = useVideoPlayer(film.src, (p) => {
    p.loop = true
    p.muted = true
  })

  React.useEffect(() => {
    if (active) player.play()
    else player.pause()
  }, [active, player])

  return (
    <View style={{ height, width, backgroundColor: '#000' }}>
      {active ? (
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      ) : (
        <Image source={{ uri: film.poster }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
      <View style={s.shadeTop} />
      <View style={s.shadeBottom} />
      <View style={[s.chipRow, { top: insets.top + 12 }]}>
        <View style={s.chip}>
          <Body style={s.chipTx}>PREVIEW — REAL BROADCASTS OPEN WITH SELLERS</Body>
        </View>
      </View>
      <View style={{ position: 'absolute', left: 18, right: 18, bottom: insets.bottom + 96 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={{ uri: flagUrl(film.c) }} style={{ width: 22, height: 16, borderRadius: 3 }} />
          <Kicker>{countryName(film.c).toUpperCase()}</Kicker>
        </View>
        <Serif style={{ fontSize: 24, marginTop: 8 }}>{film.title}</Serif>
        <Dim style={{ marginTop: 4 }}>{film.sub}</Dim>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  shadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  shadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 230,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  chipRow: { position: 'absolute', left: 18 },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  chipTx: { fontFamily: F.display, fontSize: 8.5, letterSpacing: 1, color: C.accent },
})
