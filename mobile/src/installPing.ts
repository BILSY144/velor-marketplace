// Install & usage ping (2026-07-19). On every cold start the app reports
// itself to /api/app/install: the first ping registers this install (an
// anonymous random id -- NOT a device identifier; nothing personal leaves
// the phone), later pings bump lastSeenAt so Pulse can show honest daily
// and weekly active numbers. Country is derived server-side from the
// request, the same way the website's own analytics work. Covered by the
// Play Data safety declaration ("Device or other IDs"). Fire-and-forget:
// a failed ping never blocks or surfaces anything; it simply retries on
// the next cold start.
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { getLang, getCurrency } from './i18n'

const KEY = 'velor_install_id'

function randomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < 24; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function pingInstall(): Promise<void> {
  try {
    let id = await SecureStore.getItemAsync(KEY)
    if (!id) {
      id = randomId()
      await SecureStore.setItemAsync(KEY, id)
    }
    await fetch('https://velorcommerce.store/api/app/install', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        installId: id,
        platform: Platform.OS,
        osVersion: String(Platform.Version ?? ''),
        appVersion: Constants.expoConfig?.version ?? undefined,
        language: getLang(),
        currency: getCurrency(),
      }),
    })
  } catch {}
}
