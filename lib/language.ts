'use client'

// The 19 languages Velor speaks — the same list as the mobile app's
// Language & currency screen and lib/outreachI18n. The site UI ships
// English-first; the stored preference is what full site translation
// will honour at launch, and Velor's assistant and seller channels
// already speak all nineteen today. Do not list a language here that
// outreachI18n cannot actually speak.
export type SupportedLanguage = {
  code: string
  native: string
  english: string
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'es', native: 'Español', english: 'Spanish' },
  { code: 'fr', native: 'Français', english: 'French' },
  { code: 'de', native: 'Deutsch', english: 'German' },
  { code: 'it', native: 'Italiano', english: 'Italian' },
  { code: 'pt', native: 'Português', english: 'Portuguese' },
  { code: 'nl', native: 'Nederlands', english: 'Dutch' },
  { code: 'pl', native: 'Polski', english: 'Polish' },
  { code: 'tr', native: 'Türkçe', english: 'Turkish' },
  { code: 'ru', native: 'Русский', english: 'Russian' },
  { code: 'ar', native: 'العربية', english: 'Arabic' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'vi', native: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'th', native: 'ไทย', english: 'Thai' },
  { code: 'id', native: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'zh', native: '中文', english: 'Chinese' },
  { code: 'ja', native: '日本語', english: 'Japanese' },
  { code: 'ko', native: '한국어', english: 'Korean' },
]

const KEY = 'velor_language'

export function getStoredLanguage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(KEY)
    return v && SUPPORTED_LANGUAGES.some((l) => l.code === v) ? v : null
  } catch {
    return null
  }
}

export function getDisplayLanguage(): string {
  return getStoredLanguage() ?? 'en'
}

export function setStoredLanguage(code: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, code)
  } catch {}
  window.dispatchEvent(new CustomEvent('velor-language-changed', { detail: code }))
}
