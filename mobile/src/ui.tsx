import React from 'react'
import { TextProps, View, Pressable, StyleSheet, ViewStyle } from 'react-native'
import { Text } from './ui/T'
import { C, F } from './theme'

export function Kicker({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[s.kicker, style]}>
      {children}
    </Text>
  )
}

export function Display({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[s.display, style]}>
      {children}
    </Text>
  )
}

export function Serif({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[s.serif, style]}>
      {children}
    </Text>
  )
}

export function Body({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[s.body, style]}>
      {children}
    </Text>
  )
}

export function Dim({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[s.dim, style]}>
      {children}
    </Text>
  )
}

export function Pill({
  label,
  on,
  onPress,
  style,
}: {
  label: string
  on?: boolean
  onPress?: () => void
  style?: ViewStyle
}) {
  return (
    <Pressable onPress={onPress} style={[s.pill, on && s.pillOn, style]}>
      <Text style={[s.pillTx, on && s.pillTxOn]}>{label}</Text>
    </Pressable>
  )
}

export function Btn({
  label,
  onPress,
  ghost,
  style,
}: {
  label: string
  onPress?: () => void
  ghost?: boolean
  style?: ViewStyle
}) {
  return (
    <Pressable onPress={onPress} style={[s.btn, ghost && s.btnGhost, style]}>
      <Text style={[s.btnTx, ghost && s.btnTxGhost]}>{label}</Text>
    </Pressable>
  )
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={s.empty}>
      <Serif style={{ fontSize: 21, textAlign: 'center' }}>{title}</Serif>
      {sub ? (
        <Dim style={{ textAlign: 'center', marginTop: 8, lineHeight: 19 }}>{sub}</Dim>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  kicker: {
    fontFamily: F.display,
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.accent,
  },
  display: { fontFamily: F.serif, fontSize: 30, color: C.text, lineHeight: 34 },
  serif: { fontFamily: F.serif, fontSize: 20, color: C.text },
  body: { fontFamily: F.body, fontSize: 13.5, color: C.text, lineHeight: 20 },
  dim: { fontFamily: F.body, fontSize: 12.5, color: C.mut, lineHeight: 18 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pillOn: { backgroundColor: C.accentSoft, borderWidth: 1, borderColor: 'rgba(255,107,0,0.4)' },
  pillTx: { fontFamily: F.displayMed, fontSize: 12, color: C.mut },
  pillTxOn: { color: C.accent },
  btn: {
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.line,
  },
  btnTx: { fontFamily: F.display, fontSize: 14, color: '#0b0b0e' },
  btnTxGhost: { color: C.text },
  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 28,
  },
})
