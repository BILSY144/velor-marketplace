import { create } from 'zustand'
import type { ShopProduct } from './api'

export type CartItem = { product: ShopProduct; qty: number }

type CartState = {
  items: CartItem[]
  add: (p: ShopProduct, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  count: () => number
  total: () => number
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (p, qty = 1) =>
    set((s) => {
      const existing = s.items.find((i) => i.product.id === p.id)
      if (existing)
        return {
          items: s.items.map((i) =>
            i.product.id === p.id ? { ...i, qty: i.qty + qty } : i
          ),
        }
      return { items: [...s.items, { product: p, qty }] }
    }),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.product.id !== id) })),
  setQty: (id, qty) =>
    set((s) => ({
      items: s.items
        .map((i) => (i.product.id === id ? { ...i, qty: Math.max(0, qty) } : i))
        .filter((i) => i.qty > 0),
    })),
  count: () => get().items.reduce((n, i) => n + i.qty, 0),
  total: () =>
    get().items.reduce(
      (n, i) => n + (i.product.discountedPrice ?? i.product.price) * i.qty,
      0
    ),
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
