import React from 'react'
import { View, Text, Image, Pressable, StyleSheet, Animated, AppState } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter'
import { Fraunces_400Regular, Fraunces_500Medium_Italic, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces'
import Ionicons from '@expo/vector-icons/Ionicons'

import { C, F } from './src/theme'
import { useCart } from './src/store'
import AtlasScreen from './src/screens/AtlasScreen'
import CountryScreen from './src/screens/CountryScreen'
import LiveScreen from './src/screens/LiveScreen'
import SearchScreen from './src/screens/SearchScreen'
import BasketScreen from './src/screens/BasketScreen'
import YouScreen from './src/screens/YouScreen'
import AssistScreen from './src/screens/AssistScreen'
import OrdersScreen from './src/screens/OrdersScreen'
import PassportScreen from './src/screens/PassportScreen'
import SellScreen from './src/screens/SellScreen'
import LegalScreen from './src/screens/LegalScreen'
import ApplyScreen from './src/screens/ApplyScreen'
import VerifyScreen from './src/screens/VerifyScreen'
import CheckoutScreen from './src/screens/CheckoutScreen'
import MenuScreen from './src/screens/MenuScreen'
import BellScreen from './src/screens/BellScreen'
import CraftScreen from './src/screens/CraftScreen'
import PdpScreen from './src/screens/PdpScreen'
import { AddrScreen, PayScreen, LangCurScreen } from './src/screens/SettingsScreens'
import SeatsScreen from './src/screens/SeatsScreen'
import DashScreen from './src/screens/DashScreen'
import { SellerOrdersScreen, ApiKeysScreen, PayoutsScreen } from './src/screens/SellerOpsScreens'
import NewListingScreen from './src/screens/NewListingScreen'
import GoLiveScreen from './src/screens/GoLiveScreen'
import SignInScreen from './src/screens/SignInScreen'
import { useSession } from './src/store'
import { getSession, signOutRemote, signInWithPassword } from './src/api'
import {
  isFaceIdEnabled,
  setFaceIdEnabled,
  unlockWithBiometrics,
  biometricsAvailable,
  loadCredentials,
  clearCredentials,
} from './src/biometrics'

const query = new QueryClient()
const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Atlas: 'globe-outline',
  Live: 'videocam-outline',
  Search: 'search-outline',
  Basket: 'bag-outline',
  You: 'person-outline',
  MenuTab: 'menu-outline',
}

function Tabs() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0))
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10,10,13,0.98)',
          borderTopColor: C.line,
        },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.mut,
        tabBarLabelStyle: { fontFamily: F.displayMed, fontSize: 9.5 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size - 2} color={color} />
        ),
        tabBarBadge: route.name === 'Basket' && count > 0 ? count : undefined,
        tabBarBadgeStyle: { backgroundColor: C.accent, color: '#0b0b0e', fontSize: 10 },
      })}
    >
      <Tab.Screen name="Atlas" component={AtlasScreen} />
      <Tab.Screen name="Live" component={LiveScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Basket" component={BasketScreen} />
      <Tab.Screen name="You" component={YouScreen} />
      <Tab.Screen
        name="MenuTab"
        component={YouScreen}
        options={{ tabBarLabel: 'Menu' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault()
            navigation.navigate('Menu')
          },
        })}
      />
    </Tab.Navigator>
  )
}

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: C.bg,
    card: C.ink,
    primary: C.accent,
    text: C.text,
    border: C.line,
  },
}

// The opening moment — plate 00. Continues seamlessly from the native
// splash (same logo image, same black), adds the mockup's "THE ATLAS ·
// ON AIR" status line with the pulsing live dot and TAP TO SKIP, then
// fades into the Atlas after ~2.4s (or on tap).
function SplashOverlay({ onDone }: { onDone: () => void }) {
  const fade = React.useRef(new Animated.Value(1)).current
  const pulse = React.useRef(new Animated.Value(1)).current
  const done = React.useRef(false)

  const dismiss = React.useCallback(() => {
    if (done.current) return
    done.current = true
    Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }).start(onDone)
  }, [fade, onDone])

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    ).start()
    const t = setTimeout(dismiss, 2400)
    return () => clearTimeout(t)
  }, [dismiss, pulse])

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 99 }]}>
      <Pressable style={sp.fill} onPress={dismiss}>
        <Image
          source={require('./assets/splash.png')}
          style={sp.logo}
          resizeMode="contain"
        />
        <View style={sp.idRow}>
          <Animated.View style={[sp.dot, { opacity: pulse }]} />
          <Text style={sp.idTx}>THE ATLAS · ON AIR</Text>
        </View>
        <Text style={sp.skip}>TAP TO SKIP</Text>
      </Pressable>
    </Animated.View>
  )
}

const sp = StyleSheet.create({
  // Pure black. The splash image is now TRANSPARENT (background stripped
  // from the PNG, 2026-07-15) so only ever one black exists behind the
  // logo — no box, no seams, whatever surface shows it.
  fill: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  logo: { width: '96%', height: 300 },
  idRow: {
    position: 'absolute',
    bottom: '24%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  idTx: { fontFamily: F.display, fontSize: 9.5, letterSpacing: 2.4, color: C.accent },
  skip: {
    position: 'absolute',
    bottom: 46,
    fontFamily: F.displayMed,
    fontSize: 10,
    letterSpacing: 1.4,
    color: '#45454e',
  },
})

// Face ID lock — guards a restored seller session on cold start. Auto-
// prompts once; "Use password instead" signs out to the password door
// (the standing backup — no password is ever stored on the device).
function BiometricLock({
  onUnlocked,
  onUsePassword,
}: {
  onUnlocked: () => Promise<void>
  onUsePassword: () => void
}) {
  const [label, setLabel] = React.useState('Face ID')
  const [busy, setBusy] = React.useState(false)
  const tried = React.useRef(false)

  const attempt = React.useCallback(async () => {
    if (busy) return
    const ok = await unlockWithBiometrics()
    if (ok) {
      // Face ID has established the account holder — finish the sign-in
      // silently (session cookie, or keychain credentials if it expired).
      setBusy(true)
      await onUnlocked()
    }
  }, [onUnlocked, busy])

  React.useEffect(() => {
    biometricsAvailable().then((b) => setLabel(b.label))
    if (!tried.current) {
      tried.current = true
      setTimeout(attempt, 350)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={[StyleSheet.absoluteFill, lk.fill]}>
      <Image source={require('./assets/splash.png')} style={lk.logo} resizeMode="contain" />
      <Text style={lk.title}>{busy ? 'Signing you in…' : 'Unlock your Velor account'}</Text>
      {!busy ? (
        <>
          <Pressable style={lk.btn} onPress={attempt}>
            <Text style={lk.btnTx}>Unlock with {label}</Text>
          </Pressable>
          <Pressable onPress={onUsePassword} style={{ marginTop: 16 }}>
            <Text style={lk.alt}>Use password instead</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  )
}

const lk = StyleSheet.create({
  fill: {
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 98,
  },
  logo: { width: '70%', height: 160 },
  title: { fontFamily: F.body, fontSize: 13.5, color: C.text, marginTop: 8 },
  btn: {
    marginTop: 22,
    backgroundColor: C.accent,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 34,
  },
  btnTx: { fontFamily: F.displayMed, fontSize: 13.5, color: '#160a00' },
  alt: { fontFamily: F.body, fontSize: 12, color: '#8a8a95' },
})

export default function App() {
  const [loaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Fraunces_400Regular,
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
  })
  const [splash, setSplash] = React.useState(true)
  const [locked, setLocked] = React.useState(false)
  const setSession = useSession((s) => s.set)
  const markReady = useSession((s) => s.markReady)

  // FACE ID GUARDS THE APP DOOR (William, 2026-07-15: "when I open the app
  // it should have Face ID to open the app"). The lock arms INSTANTLY from
  // the local SecureStore flag — no network wait — on every cold start, and
  // re-arms the moment the app goes to the background, so returning to the
  // app always demands a face. Session restore runs independently.
  React.useEffect(() => {
    isFaceIdEnabled().then((on) => {
      if (on) setLocked(true)
    })
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        isFaceIdEnabled().then((on) => {
          if (on) setLocked(true)
        })
      }
    })
    return () => sub.remove()
  }, [])

  // Restore the seller session from the platform cookie jar on cold start —
  // if the site's NextAuth cookie survived, the dashboard is live instantly.
  React.useEffect(() => {
    getSession()
      .then((u) => (u ? setSession(u) : markReady()))
      .catch(() => markReady())
  }, [setSession, markReady])

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={query}>
        <NavigationContainer theme={theme}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="Country" component={CountryScreen} />
            <Stack.Screen name="Assist" component={AssistScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="Passport" component={PassportScreen} />
            <Stack.Screen name="Sell" component={SellScreen} />
            <Stack.Screen name="Legal" component={LegalScreen} />
            <Stack.Screen name="Apply" component={ApplyScreen} />
            <Stack.Screen name="Verify" component={VerifyScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen
              name="Menu"
              component={MenuScreen}
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen name="Bell" component={BellScreen} />
            <Stack.Screen name="Craft" component={CraftScreen} />
            <Stack.Screen name="Pdp" component={PdpScreen} />
            <Stack.Screen name="Addr" component={AddrScreen} />
            <Stack.Screen name="Pay" component={PayScreen} />
            <Stack.Screen name="LangCur" component={LangCurScreen} />
            <Stack.Screen name="Seats" component={SeatsScreen} />
            <Stack.Screen name="Dash" component={DashScreen} />
            <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
            <Stack.Screen name="ApiKeys" component={ApiKeysScreen} />
            <Stack.Screen name="Payouts" component={PayoutsScreen} />
            <Stack.Screen name="NewListing" component={NewListingScreen} />
            <Stack.Screen name="GoLive" component={GoLiveScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
          </Stack.Navigator>
          {locked ? (
            <BiometricLock
              onUnlocked={async () => {
                // Face ID passed — make sure the account is signed in
                // without asking for anything: live session cookie first,
                // keychain credentials as the silent fallback.
                try {
                  let u = await getSession()
                  if (!u) {
                    const creds = await loadCredentials()
                    if (creds) {
                      u = await signInWithPassword(creds.email, creds.secret)
                      if (!u) await clearCredentials() // password changed server-side
                    }
                  }
                  if (u) setSession(u)
                } catch {}
                setLocked(false)
              }}
              onUsePassword={() => {
                // Password fallback: Face ID comes off, keychain wiped, the
                // session signs out, and the password door is the way in.
                Promise.all([setFaceIdEnabled(false), clearCredentials()]).finally(() => {
                  signOutRemote().finally(() => {
                    setSession(null)
                    setLocked(false)
                  })
                })
              }}
            />
          ) : null}
          {splash ? <SplashOverlay onDone={() => setSplash(false)} /> : null}
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
