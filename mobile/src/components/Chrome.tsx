import React from 'react'
import { View, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { C, F } from '../theme'

// The mockup's chrome: back chip (labelled) top-left, search/menu/bell
// top-right. Shared by Atlas, Country dive and Craft pages.
export function Chrome({ back, onBack }: { back?: string; onBack?: () => void }) {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  return (
    <View style={[s.row, { top: insets.top + 8 }]} pointerEvents="box-none">
      {back ? (
        <Pressable style={s.backChip} onPress={onBack ?? (() => nav.goBack())}>
          <Ionicons name="chevron-back" size={14} color={C.text} />
          <Text style={s.backTx}>{back}</Text>
        </Pressable>
      ) : (
        <View />
      )}
      <View style={{ flexDirection: 'row', gap: 9 }}>
        <Pressable style={s.gbtn} onPress={() => nav.navigate('Tabs', { screen: 'Search' })}>
          <Ionicons name="search-outline" size={17} color={C.text} />
        </Pressable>
        <Pressable style={s.gbtn} onPress={() => nav.navigate('Menu')}>
          <Ionicons name="menu-outline" size={19} color={C.text} />
        </Pressable>
        <Pressable style={s.gbtn} onPress={() => nav.navigate('Bell')}>
          <Ionicons name="notifications-outline" size={17} color={C.text} />
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20,20,26,0.72)',
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 15,
    height: 38,
  },
  backTx: { fontFamily: F.displayMed, fontSize: 12, color: C.text },
  gbtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,20,26,0.72)',
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
