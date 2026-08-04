// Velor design tokens.
//
// 2026-08-04 (William: "redesign the app to kind of replicate the website"):
// the app now carries the WEBSITE's two palettes, lifted verbatim from
// app/globals.css :root (dark) and html[data-theme='light'] (light), with
// light as the default exactly like velorcommerce.store. Buyer screens read
// the active palette through useTheme(); the legacy static `C` export keeps
// the original dark Atlas values so not-yet-redesigned screens (seller ops,
// live room) render unchanged until their own pass.
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

export type Palette = {
  bg: string
  surf: string // --surface
  surf2: string // --surface-2
  line: string // --border
  accent: string
  accentSoft: string
  text: string
  mut: string // --muted
  dim: string
  green: string
  red: string
  amber: string
  /** true when the palette is the light one (drives StatusBar style etc.) */
  light: boolean
}

// html[data-theme='light'] in app/globals.css — the website's default look.
export const LIGHT: Palette = {
  bg: '#f7f5f1',
  surf: '#ffffff',
  surf2: '#f1efe9',
  line: '#e3ded3',
  accent: '#FF6B00',
  accentSoft: 'rgba(255,107,0,0.12)',
  text: '#1a1a1d',
  mut: '#6b6b76',
  dim: '#9a9aa4',
  green: '#2ecc71',
  red: '#e24b4a',
  amber: '#EF9F27',
  light: true,
}

// :root in app/globals.css — the website's dark mode.
export const DARK: Palette = {
  bg: '#0d0d0f',
  surf: '#16161a',
  surf2: '#1d1d22',
  line: '#2a2a31',
  accent: '#FF6B00',
  accentSoft: 'rgba(255,107,0,0.14)',
  text: '#f4f4f2',
  mut: '#9c9ca7',
  dim: '#5a5a64',
  green: '#2ecc71',
  red: '#e24b4a',
  amber: '#EF9F27',
  light: false,
}

type ThemeState = {
  mode: 'light' | 'dark'
  set: (m: 'light' | 'dark') => void
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  // Light is the website's default; the stored choice restores on boot below.
  mode: 'light',
  set: (mode) => {
    SecureStore.setItemAsync('velor_theme', mode).catch(() => {})
    set({ mode })
  },
  toggle: () =>
    set((s) => {
      const mode = s.mode === 'light' ? 'dark' : 'light'
      SecureStore.setItemAsync('velor_theme', mode).catch(() => {})
      return { mode }
    }),
}))

// Restore the stored choice once at module load (same pattern as i18n prefs).
SecureStore.getItemAsync('velor_theme')
  .then((m) => {
    if (m === 'dark' || m === 'light') useThemeStore.setState({ mode: m })
  })
  .catch(() => {})

/** Active palette for themed (website-replica) screens. */
export function useTheme(): Palette {
  const mode = useThemeStore((s) => s.mode)
  return mode === 'light' ? LIGHT : DARK
}

/** Non-hook accessor for module-level or imperative code. */
export function palette(): Palette {
  return useThemeStore.getState().mode === 'light' ? LIGHT : DARK
}

// ---------------------------------------------------------------------------
// LEGACY static tokens — the original dark Atlas mockup values. Screens not
// yet redesigned to the website look still import these; do not delete until
// every screen has moved to useTheme().
export const C = {
  bg: '#08080b',
  ink: '#0d0d10',
  surf: '#141419',
  surf2: '#1b1b22',
  line: 'rgba(255,255,255,0.08)',
  accent: '#FF6B00',
  accentSoft: 'rgba(255,107,0,0.14)',
  text: '#f4f3f1',
  mut: '#8a8a95',
  dim: '#5a5a64',
  green: '#3ddc84',
  red: '#ff5a52',
} as const

// Font families are registered in App.tsx via expo-font. Same three families
// as the website: Space Grotesk (display), Inter (body), Fraunces (serif).
export const F = {
  display: 'SpaceGrotesk_700Bold', // --fd
  displayMed: 'SpaceGrotesk_600SemiBold',
  body: 'Inter_400Regular', // --fb
  bodyMed: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  serif: 'Fraunces_600SemiBold', // --fs
  serifLight: 'Fraunces_400Regular',
  serifItalic: 'Fraunces_500Medium_Italic',
} as const

export const flagUrl = (cc: string, w: 40 | 80 | 160 = 80) =>
  `https://flagcdn.com/w${w}/${cc.toLowerCase()}.png`

export const pexels = (id: number, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`
