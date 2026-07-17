import React, { useRef, useState } from 'react'
import { View, FlatList, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { TextInput } from '../ui/TI'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import { C, F } from '../theme'
import { askVelor, AssistMessage } from '../api'
import { Kicker, Body, Dim, Serif, Pill } from '../ui'

const AVATAR = 'https://velorcommerce.store/velor-assistant.png'

// Plate 22's starter pills, verbatim — including the Spanish one, since she
// really does answer in any language.
const STARTERS = [
  'A gift for a tea lover',
  'How is my money protected?',
  '¿Cómo funciona el escrow?',
]

const WELCOME =
  'I can help you find something specific, explain where a craft comes from, or walk you through how your money is protected. Any language you like.'

export default function AssistScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation<any>()
  const [msgs, setMsgs] = useState<AssistMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const list = useRef<FlatList>(null)

  async function send(text: string) {
    const t = text.trim()
    if (!t || busy) return
    const next: AssistMessage[] = [...msgs, { role: 'user', content: t }]
    setMsgs(next)
    setInput('')
    setBusy(true)
    try {
      const reply = await askVelor(next)
      setMsgs([...next, { role: 'assistant', content: reply }])
    } catch (e: any) {
      setMsgs([
        ...next,
        {
          role: 'assistant',
          content:
            e?.message?.includes('configured')
              ? 'I am not switched on in this environment yet — try me on velorcommerce.store.'
              : 'I could not reach Velor just now. Check your connection and try again.',
        },
      ])
    } finally {
      setBusy(false)
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => nav.goBack()} style={s.back}>
          <Body style={{ fontFamily: F.display }}>{'←'}</Body>
        </Pressable>
        <Image source={{ uri: AVATAR }} style={s.avatar} contentFit="cover" />
        <View>
          <Serif style={{ fontSize: 16 }}>Ask Velor</Serif>
          <Dim style={{ fontSize: 10.5 }}>The same guide as the website — any language, honest answers</Dim>
        </View>
      </View>

      <FlatList
        ref={list}
        data={msgs}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 20 }}
        ListEmptyComponent={
          <View>
            <View style={[s.bubble, s.bot]}>
              <Body style={{ fontSize: 13, lineHeight: 19 }}>{WELCOME}</Body>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {STARTERS.map((q) => (
                <Pill key={q} label={q} onPress={() => send(q)} />
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.bubble, item.role === 'user' ? s.user : s.bot]}>
            <Body style={{ fontSize: 13, lineHeight: 19 }}>{item.content}</Body>
          </View>
        )}
        ListFooterComponent={
          busy ? (
            <View style={[s.bubble, s.bot]}>
              <Dim>Velor is thinking…</Dim>
            </View>
          ) : null
        }
      />

      <View style={s.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything…"
          placeholderTextColor={C.dim}
          style={s.input}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
        />
        <Pressable onPress={() => send(input)} style={s.send}>
          <Body style={{ fontFamily: F.display, fontSize: 12, color: '#0b0b0e' }}>SEND</Body>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  bubble: { maxWidth: '84%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  user: { alignSelf: 'flex-end', backgroundColor: C.accentSoft },
  bot: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.06)' },
  inputRow: {
    flexDirection: 'row',
    gap: 9,
    padding: 14,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: C.text,
    fontFamily: F.body,
    fontSize: 13.5,
  },
  send: {
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
})
