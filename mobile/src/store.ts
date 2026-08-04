import { create } from 'zustand'
import * as FileSystem from 'expo-file-system/legacy'
import type { ShopProduct } from './api'

// Cart lines carry the picked VARIANT (2026-08-04 website-parity checkout):
// the server prices each line by (productId, variantId) in
// /api/stripe/payment-intent, so a priced variant ("Oval 2 Pets") charges
// its own price -- the exact class of bug the website fixed on 2026-08-01.
export type CartVariant = { id: string; name: string; price: number } | null

export type CartItem = { product: ShopProduct; qty: number; variant?: CartVariant }

const lineKey = (productId: string, variant?: CartVariant) =>
  productId + '::' + (variant?.id ?? '')

export const cartLinePrice = (i: CartItem) =>
  i.variant?.price ?? i.product.discountedPrice ?? i.product.price

type CartState = {
  items: CartItem[]
  add: (p: ShopProduct, qty?: number, variant?: CartVariant) => void
  remove: (id: string, variantId?: string | null) => void
  setQty: (id: string, qty: number, variantId?: string | null) => void
  clear: () => void
  count: () => number
  total: () => number
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (p, qty = 1, variant = null) =>
    set((s) => {
      const key = lineKey(p.id, variant)
      const existing = s.items.find((i) => lineKey(i.product.id, i.variant ?? null) === key)
      if (existing)
        return {
          items: s.items.map((i) =>
            lineKey(i.product.id, i.variant ?? null) === key ? { ...i, qty: i.qty + qty } : i
          ),
        }
      return { items: [...s.items, { product: p, qty, variant }] }
    }),
  remove: (id, variantId = null) =>
    set((s) => ({
      items: s.items.filter(
        (i) => !(i.product.id === id && (i.variant?.id ?? null) === variantId)
      ),
    })),
  setQty: (id, qty, variantId = null) =>
    set((s) => ({
      items: s.items
        .map((i) =>
          i.product.id === id && (i.variant?.id ?? null) === variantId
            ? { ...i, qty: Math.max(0, qty) }
            : i
        )
        .filter((i) => i.qty > 0),
    })),
  clear: () => set({ items: [] }),
  count: () => get().items.reduce((n, i) => n + i.qty, 0),
  total: () => get().items.reduce((n, i) => n + cartLinePrice(i) * i.qty, 0),
}))

// Favourites — the mockup's FAVS model (heart on Live cards and the product
// page). Session-local for now, same as the mockup's in-memory session.
type FavState = {
  ids: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
}

export const useFavs = create<FavState>((set, get) => ({
  ids: [],
  toggle: (id) =>
    set((s) => ({
      ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
    })),
  has: (id) => get().ids.includes(id),
}))

// Country follows — session-local, shared between the country dive, You and
// the bell (mockup FOLLOWS model).
type FollowState = {
  ids: string[]
  toggle: (cc: string) => void
}

export const useFollows = create<FollowState>((set) => ({
  ids: [],
  toggle: (cc) =>
    set((s) => ({
      ids: s.ids.includes(cc) ? s.ids.filter((x) => x !== cc) : [...s.ids, cc],
    })),
}))

// Seller session — restored from the site's cookie-backed NextAuth session
// on app start (see App.tsx), set on sign-in, cleared on sign-out.
import type { SessionUser } from './api'

type SessionState = {
  user: SessionUser | null
  ready: boolean
  set: (u: SessionUser | null) => void
  markReady: () => void
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  ready: false,
  set: (user) => set({ user, ready: true }),
  markReady: () => set({ ready: true }),
}))


// ---- Cart persistence (2026-08-04, website parity: the site's cart lives in
// localStorage and survives closing the tab; the app basket previously
// evaporated on restart). Whole-cart JSON snapshot on every change, restored
// once at module load. Best-effort: a failed disk write never breaks the UI.
const CART_FILE = (FileSystem.documentDirectory ?? '') + 'velor-cart.json'
let cartHydrated = false
async function hydrateCart() {
  if (cartHydrated) return
  cartHydrated = true
  try {
    const raw = await FileSystem.readAsStringAsync(CART_FILE)
    const saved = JSON.parse(raw)
    if (Array.isArray(saved) && saved.length) {
      useCart.setState({ items: saved })
    }
  } catch {}
  useCart.subscribe((st) => {
    FileSystem.writeAsStringAsync(CART_FILE, JSON.stringify(st.items)).catch(() => {})
  })
}
void hydrateCart()
