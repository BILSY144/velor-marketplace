import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

// Face ID / Touch ID / Android biometric gate for the seller session
// (William, 2026-07-15: "full Face ID sign in availability and password as
// a back up"). Design: the password signs in ONCE (NextAuth session cookie
// persists in the platform cookie jar); Face ID then guards access to the
// signed-in seller surfaces on every cold start. The password is NEVER
// stored anywhere — if the session expires or biometrics fail, the
// password sign-in screen is the fallback, exactly as asked.

const FLAG = 'velor.faceid.enabled'

export async function biometricsAvailable(): Promise<{ available: boolean; label: string }> {
  try {
    const [hw, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ])
    const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    return {
      available: hw && enrolled,
      label: face ? 'Face ID' : 'fingerprint',
    }
  } catch {
    return { available: false, label: 'Face ID' }
  }
}

export async function isFaceIdEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(FLAG)) === '1'
  } catch {
    return false
  }
}

export async function setFaceIdEnabled(on: boolean): Promise<void> {
  try {
    if (on) await SecureStore.setItemAsync(FLAG, '1')
    else await SecureStore.deleteItemAsync(FLAG)
  } catch {}
}

export async function unlockWithBiometrics(): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your Velor account',
      cancelLabel: 'Use password instead',
      disableDeviceFallback: false,
    })
    return res.success
  } catch {
    return false
  }
}

// -----------------------------------------------------------------------
// Automatic sign-in behind Face ID (William, 2026-07-15: "no more sign
// ins, as Face ID has already established I am the account holder").
// With the lock enabled, credentials live in the device's hardware-
// encrypted keychain (SecureStore) and are ONLY read in the unlock path,
// immediately after a successful biometric — so Face ID alone restores
// the account even when the session cookie has expired. Disabling Face
// ID, signing out, or the password fallback all WIPE them.
// -----------------------------------------------------------------------

const CRED_EMAIL = 'velor.auth.email'
const CRED_SECRET = 'velor.auth.secret'

export async function saveCredentials(email: string, secret: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(CRED_EMAIL, email)
    await SecureStore.setItemAsync(CRED_SECRET, secret)
  } catch {}
}

export async function loadCredentials(): Promise<{ email: string; secret: string } | null> {
  try {
    const [email, secret] = await Promise.all([
      SecureStore.getItemAsync(CRED_EMAIL),
      SecureStore.getItemAsync(CRED_SECRET),
    ])
    return email && secret ? { email, secret } : null
  } catch {
    return null
  }
}

export async function clearCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CRED_EMAIL)
    await SecureStore.deleteItemAsync(CRED_SECRET)
  } catch {}
}
