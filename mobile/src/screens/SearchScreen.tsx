import React, { useMemo, useState } from 'react'
import { View, TextInput, FlatList, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import { C, F, flagUrl } from '../theme'
import { COUNTRIES, HINTS } from '../data'
import { Kicker, Display, Body, Dim, Serif, Empty } from '../ui'

type Hit = { cc: string; name: string; craft?: string }

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const [q, setQ] = useState('')

  const hits: Hit[] = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) return []
    const out: Hit[] = []
    for (const c of COUNTRIES) {
      if (c.n.toLowerCase().includes(ql)) out.push({ cc: c.c, name: c.n })
    }
    for (const c of COUNTRIES) {
      for (const craft of HINTS[c.c] ?? []) {
        if (craft.toLowerCase().includes(ql)) {
          out.push({ cc: c.c, name: c.n, craft })
          if (out.length > 60) return out
        }
      }
    }
    return out
  }, [q])

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Kicker>SEARCH</Kicker>
        <Display style={{ marginTop: 6, fontSize: 26 }}>A place, a craft, a thing.</Display>
      </View>
      <View style={s.bar}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Try Japan, kilim, indigo, silver…"
          placeholderTextColor={C.dim}
          style={s.input}
          autoCorrect={false}
        />
      </View>
      {!q.trim() ? (
        <Empty
          title="190 channels, still opening."
          sub="Search any country, or a craft it is known for — every result leads into that country's dive."
        />
      ) : hits.length === 0 ? (
        <Empty title="Nothing by that name." sub="Try the country's English name, or a craft — weaving, ceramics, leather…" />
      ) : (
        <FlatList
          data={hits}
          keyExtractor={(h, i) => h.cc + (h.craft ?? '') + i}
          renderItem={({ item }) => (
            <Pressable style={s.row} onPress={() => nav.navigate('Country', { cc: item.cc })}>
              <Image source={{ uri: flagUrl(item.cc) }} style={{ width: 24, height: 17, borderRadius: 3 }} />
              <View style={{ flex: 1 }}>
                <Serif style={{ fontSize: 14.5 }}>{item.craft ?? item.name}</Serif>
                <Dim style={{ fontSize: 11 }}>{item.craft ? item.name : 'Country channel'}</Dim>
              </View>
              <Body style={{ color: C.accent, fontFamily: F.display, fontSize: 12 }}>{'→'}</Body>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  bar: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  input: {
    color: C.text,
    fontFamily: F.body,
    fontSize: 14.5,
    paddingVertical: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
})
