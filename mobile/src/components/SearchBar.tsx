import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Text } from '../ui/T'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { F, useTheme } from '../theme'

// Site-wide search entry (2026-08-04, William: "i cannot [find] a search
// bar anywhere which each page should have"). The website shows its search
// field in the global header on every page; this is the app's equivalent -
// a themed bar rendered near the top of each main screen. Tapping it jumps
// to the Shop tab, whose live search input (300ms debounced, country/
// category/listing hits) is the single real search engine, and asks it to
// focus the input so the keyboard is up when the user lands.
export function SearchBar({ topMargin = 0 }: { topMargin?: number }) {
  const t = useTheme()
  const nav = useNavigation<any>()
  return (
    <Pressable
      style={[
        st.bar,
        { backgroundColor: t.surf, borderColor: t.line, marginTop: topMargin },
      ]}
      onPress={() => nav.navigate('Tabs', { screen: 'Shop', params: { focusSearch: Date.now() } })}
    >
      <Ionicons name="search-outline" size={16} color={t.dim} />
      <Text style={[st.tx, { color: t.dim, fontFamily: F.body }]}>
        Search goods, country or seller...
      </Text>
      <View style={{ flex: 1 }} />
    </Pressable>
  )
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  tx: { fontSize: 12.5 },
})
