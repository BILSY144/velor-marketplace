import React from 'react'
import { View } from 'react-native'
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

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: C.bg }} />
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
            <Stack.Screen name="Menu" component={MenuScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Bell" component={BellScreen} />
            <Stack.Screen name="Craft" component={CraftScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
