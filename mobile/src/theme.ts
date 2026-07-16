// Velor design tokens — lifted verbatim from the approved Atlas mockup
// (public/velor-app-mockup.html :root). Do not invent new colours here.
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

// Font families are registered in App.tsx via expo-font.
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
