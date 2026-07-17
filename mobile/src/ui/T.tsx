// Translating Text (2026-07-17). RN 0.81's Text is a plain function
// component -- the old Text.render patch silently no-opped, which is why
// picking a language changed nothing on-device. Every screen now imports
// Text from here instead of 'react-native' (one-line import change per
// file, zero JSX changes); string children run through the same cached
// /api/translate engine as the website. Re-render on language change /
// batch arrival comes from App.tsx's root onI18n tick.
import React from 'react'
import { Text as RNText, TextProps } from 'react-native'
import { T as tr } from '../i18n'

function tx(c: React.ReactNode): React.ReactNode {
  if (typeof c === 'string') return tr(c)
  if (Array.isArray(c)) return c.map(tx)
  return c
}

export function Text(props: TextProps) {
  const { children, ...rest } = props
  return <RNText {...rest}>{tx(children)}</RNText>
}
