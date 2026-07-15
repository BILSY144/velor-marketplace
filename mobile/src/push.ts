import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { registerPushToken } from './api'

// Notifications with the bell chime (William, 2026-07-15: "notifications
// sent to user with chimes"). Honest scope, stated plainly:
// - Permission + token registration work TODAY and are stored server-side.
// - Remote delivery (a push arriving with the bell sound) activates with
//   the STORE BUILD — Expo Go has not supported remote push since SDK 53,
//   and iOS custom notification sounds ship inside the binary. The bell
//   asset (assets/bell.m4a) is the chime, already in the repo for that
//   build. Nothing here pretends to deliver what Expo Go cannot.
const PROJECT_ID = '3207e08b-8832-4dba-bc40-d690d70628d9'

export type PushResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'denied' | 'unavailable' }

export async function enableNotifications(): Promise<PushResult> {
  try {
    // Android: the opening-bell channel. The custom sound file applies in
    // the store build; Expo Go plays the default sound for this channel.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('opening-bell', {
        name: 'Opening bells & orders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'bell.m4a',
      }).catch(() => {})
    }

    const existing = await Notifications.getPermissionsAsync()
    let status = existing.status
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync()
      status = req.status
    }
    if (status !== 'granted') return { ok: false, reason: 'denied' }

    const tok = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })
    if (!tok?.data) return { ok: false, reason: 'unavailable' }
    await registerPushToken(tok.data, Platform.OS)
    return { ok: true, token: tok.data }
  } catch {
    // Expo Go post-SDK-53: remote push tokens are unavailable — permission
    // may still be granted; delivery starts with the store build.
    return { ok: false, reason: 'unavailable' }
  }
}
