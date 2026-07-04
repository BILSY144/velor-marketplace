// Velor storefront themes. See docs/STOREFRONT_THEMES.md.
// One free default ("classic"); the rest are premium.
// Pro & Enterprise get every theme; Starter unlocks all with a one-time purchase.

export type StoreTheme = {
  id: string
  name: string
  tagline: string
  premium: boolean
  tokens: {
    bg: string
    surface: string
    border: string
    accent: string
    accentText: string
    text: string
    muted: string
    fontDisplay: string
    fontBody: string
    radius: string
    heroBg: string
  }
}

const DISPLAY = "'Space Grotesk', system-ui, sans-serif"
const BODY = "'Inter', system-ui, sans-serif"
const SERIF = "'Georgia', 'Times New Roman', serif"

export const STORE_THEMES: StoreTheme[] = [
  {
    id: 'classic', name: 'Classic', tagline: 'Velor dark with electric amber', premium: false,
    tokens: { bg: '#0D0D0D', surface: '#1A1A1A', border: '#2A2A2A', accent: '#F5821F', accentText: '#000000', text: '#FFFFFF', muted: '#B4B4B4', fontDisplay: DISPLAY, fontBody: BODY, radius: '16px', heroBg: 'radial-gradient(900px 420px at 80% -10%, rgba(245,130,31,0.18), transparent 60%), #0D0D0D' },
  },
  {
    id: 'midnight', name: 'Midnight', tagline: 'Deep navy, cool and premium', premium: true,
    tokens: { bg: '#0A1020', surface: '#121A2E', border: '#22304C', accent: '#5B8CFF', accentText: '#04122E', text: '#EAF0FF', muted: '#93A4C6', fontDisplay: DISPLAY, fontBody: BODY, radius: '16px', heroBg: 'radial-gradient(900px 420px at 20% -10%, rgba(91,140,255,0.22), transparent 60%), #0A1020' },
  },
  {
    id: 'aurora', name: 'Aurora', tagline: 'Teal-green glow on charcoal', premium: true,
    tokens: { bg: '#0B1412', surface: '#12201C', border: '#1F332C', accent: '#00E6A8', accentText: '#04231A', text: '#EAFFF6', muted: '#8FBDAF', fontDisplay: DISPLAY, fontBody: BODY, radius: '18px', heroBg: 'radial-gradient(900px 420px at 80% -10%, rgba(0,230,168,0.2), transparent 60%), #0B1412' },
  },
  {
    id: 'minimal', name: 'Minimal White', tagline: 'Clean light, black on white', premium: true,
    tokens: { bg: '#FFFFFF', surface: '#F6F6F7', border: '#E6E6E8', accent: '#111111', accentText: '#FFFFFF', text: '#141414', muted: '#6B6B6F', fontDisplay: DISPLAY, fontBody: BODY, radius: '14px', heroBg: 'linear-gradient(180deg, #FAFAFB, #FFFFFF)' },
  },
  {
    id: 'boutique', name: 'Boutique', tagline: 'Warm cream with an editorial serif', premium: true,
    tokens: { bg: '#FBF7F0', surface: '#FFFFFF', border: '#EAE0D2', accent: '#B4712A', accentText: '#FFFFFF', text: '#2A2118', muted: '#8A7B67', fontDisplay: SERIF, fontBody: BODY, radius: '10px', heroBg: 'linear-gradient(180deg, #F5ECDD, #FBF7F0)' },
  },
  {
    id: 'noir', name: 'Noir', tagline: 'Pure black, stark white', premium: true,
    tokens: { bg: '#000000', surface: '#0E0E0E', border: '#242424', accent: '#FFFFFF', accentText: '#000000', text: '#FFFFFF', muted: '#9A9A9A', fontDisplay: DISPLAY, fontBody: BODY, radius: '2px', heroBg: '#000000' },
  },
  {
    id: 'sunset', name: 'Sunset', tagline: 'Orange to pink, warm and bold', premium: true,
    tokens: { bg: '#160B12', surface: '#241320', border: '#3A2030', accent: '#FF6B6B', accentText: '#2A0812', text: '#FFEDF2', muted: '#C79AAC', fontDisplay: DISPLAY, fontBody: BODY, radius: '18px', heroBg: 'linear-gradient(120deg, rgba(255,107,107,0.28), rgba(255,159,64,0.18)), #160B12' },
  },
  {
    id: 'ocean', name: 'Ocean', tagline: 'Fresh blues, calm and trustworthy', premium: true,
    tokens: { bg: '#071A22', surface: '#0E2A36', border: '#1B4150', accent: '#22C3E6', accentText: '#03212B', text: '#E6FAFF', muted: '#8DBAC6', fontDisplay: DISPLAY, fontBody: BODY, radius: '16px', heroBg: 'radial-gradient(900px 420px at 30% -10%, rgba(34,195,230,0.22), transparent 60%), #071A22' },
  },
  {
    id: 'forest', name: 'Forest', tagline: 'Deep green, natural and grounded', premium: true,
    tokens: { bg: '#0C1710', surface: '#14241A', border: '#20362A', accent: '#5FCB6B', accentText: '#06210F', text: '#EAF6EC', muted: '#95B79E', fontDisplay: DISPLAY, fontBody: BODY, radius: '14px', heroBg: 'radial-gradient(900px 420px at 80% -10%, rgba(95,203,107,0.18), transparent 60%), #0C1710' },
  },
  {
    id: 'royal', name: 'Royal', tagline: 'Rich purple with gold accents', premium: true,
    tokens: { bg: '#120A1E', surface: '#1E1330', border: '#33244A', accent: '#E9C46A', accentText: '#2A1B05', text: '#F3ECFF', muted: '#B49FD0', fontDisplay: DISPLAY, fontBody: BODY, radius: '16px', heroBg: 'radial-gradient(900px 420px at 20% -10%, rgba(233,196,106,0.16), transparent 60%), #120A1E' },
  },
  {
    id: 'mono', name: 'Mono', tagline: 'Refined greyscale, all business', premium: true,
    tokens: { bg: '#141414', surface: '#1E1E1E', border: '#333333', accent: '#D6D6D6', accentText: '#141414', text: '#F2F2F2', muted: '#9C9C9C', fontDisplay: DISPLAY, fontBody: BODY, radius: '10px', heroBg: 'linear-gradient(180deg, #1B1B1B, #141414)' },
  },
  {
    id: 'candy', name: 'Candy', tagline: 'Playful pink, light and friendly', premium: true,
    tokens: { bg: '#FFF5FA', surface: '#FFFFFF', border: '#FADDE9', accent: '#FF4D8D', accentText: '#FFFFFF', text: '#3A1226', muted: '#9C6A82', fontDisplay: DISPLAY, fontBody: BODY, radius: '20px', heroBg: 'linear-gradient(180deg, #FFE7F1, #FFF5FA)' },
  },
  {
    id: 'steel', name: 'Steel', tagline: 'Cool slate, modern and sharp', premium: true,
    tokens: { bg: '#0F141A', surface: '#18202A', border: '#28323F', accent: '#7DA2C6', accentText: '#08131F', text: '#EAF1F8', muted: '#94A4B6', fontDisplay: DISPLAY, fontBody: BODY, radius: '12px', heroBg: 'radial-gradient(900px 420px at 70% -10%, rgba(125,162,198,0.16), transparent 60%), #0F141A' },
  },
  {
    id: 'sand', name: 'Sand', tagline: 'Soft beige, warm and inviting', premium: true,
    tokens: { bg: '#F7F2E9', surface: '#FFFFFF', border: '#E7DCC8', accent: '#C9803A', accentText: '#FFFFFF', text: '#2E2419', muted: '#8A7A62', fontDisplay: DISPLAY, fontBody: BODY, radius: '14px', heroBg: 'linear-gradient(180deg, #EFE6D3, #F7F2E9)' },
  },
  {
    id: 'neon', name: 'Neon', tagline: 'Dark with electric magenta', premium: true,
    tokens: { bg: '#0A0A12', surface: '#14141F', border: '#282840', accent: '#FF2FB0', accentText: '#12001F', text: '#F4EEFF', muted: '#A69AC6', fontDisplay: DISPLAY, fontBody: BODY, radius: '16px', heroBg: 'radial-gradient(900px 420px at 80% -10%, rgba(255,47,176,0.22), transparent 60%), #0A0A12' },
  },
]

export const DEFAULT_THEME = 'classic'

// TEMPORARY: while the owner previews all designs, every theme is open to everyone.
// Flip to false to re-lock premium themes behind Pro/Enterprise or the £9.99 unlock.
export const PREVIEW_OPEN = true

export function getTheme(id?: string | null): StoreTheme {
  return STORE_THEMES.find((t) => t.id === id) || STORE_THEMES[0]
}

// Pro/Enterprise get every theme; Starter gets free themes, and all themes once unlocked.
export function canUseTheme(tier: string | undefined, unlocked: boolean | undefined, themeId: string): boolean {
  const theme = STORE_THEMES.find((t) => t.id === themeId)
  if (!theme) return false
  if (PREVIEW_OPEN) return true
  if (!theme.premium) return true
  if (tier === 'PRO' || tier === 'ENTERPRISE') return true
  return unlocked === true
}

export function hasAllThemes(tier: string | undefined, unlocked: boolean | undefined): boolean {
  return tier === 'PRO' || tier === 'ENTERPRISE' || unlocked === true
}
