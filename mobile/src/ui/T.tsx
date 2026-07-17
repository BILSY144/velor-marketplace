// Translating Text (2026-07-17). RN 0.81's Text is a plain function
// component -- the old Text.render patch silently no-opped, which is why
// picking a language changed nothing on-device. Every screen imports Text
// from here instead of 'react-native' (one-line import change per file,
// zero JSX changes); string children run through the same cached
// /api/translate engine as the website.
//
// v3 (same day, William: "app still doesnt convert, stays in english"):
// each Text now subscribes to onI18n ITSELF instead of trusting App.tsx's
// root tick to propagate through react-navigation's internals -- if any
// layer between the root and a screen bails out of re-rendering, the root
// tick never reaches the visible strings and the whole app stays English,
// which is exactly the symptom reported. A per-Text subscription cannot be
// blocked by anything above it.
import React from 'react'
import { Text as RNText, TextProps } from 'react-native'
import { T as tr, onI18n } from '../i18n'

function tx(c: React.ReactNode): React.ReactNode {
  if (typeof c === 'string') return tr(c)
  if (Array.isArray(c)) return c.map(tx)
  return c
}

export function Text(props: TextProps) {
  const [, tick] = React.useState(0)
  React.useEffect(() => onI18n(() => tick((t) => t + 1)), [])
  const { children, ...rest } = props
  return <RNText {...rest}>{tx(children)}</RNText>
}
