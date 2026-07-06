'use client'

import { useCallback, useEffect, useState } from 'react'

export interface CartItem {
  // Unique line-item key. Defaults to productId when the product has no
  // variant selection. MUST be variant-specific (e.g. `${productId}-${variantId}`)
  // for products with colour/size options, otherwise two different variants
  // of the same product collapse into one line and removing one removes both.
  id?: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  sellerId?: string
  sellerName?: string
  color?: string
  size?: string
  variantName?: string
}

const CART_KEY = 'velor-cart'
export const CART_EVENT = 'cart-updated'

function lineKey(i: Pick<CartItem, 'id' | 'productId'>): string {
  return i.id || i.productId
}

function safeParse(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (parsed && parsed.state && Array.isArray(parsed.state.items)) return parsed.state.items
    return []
  } catch {
    return []
  }
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  return safeParse(localStorage.getItem(CART_KEY))
}

export function setCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_KEY, JSON.stringify({ state: { items } }))
  } catch {}
  window.dispatchEvent(new Event(CART_EVENT))
}

export function addToCart(item: CartItem): CartItem[] {
  const items = getCart()
  const key = lineKey(item)
  const existingIndex = items.findIndex((i) => lineKey(i) === key)
  let next: CartItem[]
  if (existingIndex >= 0) {
    next = items.map((i, idx) =>
      idx === existingIndex ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
    )
  } else {
    next = [...items, { ...item, quantity: item.quantity || 1 }]
  }
  setCart(next)
  return next
}

export function removeFromCart(lineId: string): CartItem[] {
  const next = getCart().filter((i) => lineKey(i) !== lineId)
  setCart(next)
  return next
}

export function updateQuantity(lineId: string, delta: number): CartItem[] {
  const next = getCart().map((i) =>
    lineKey(i) === lineId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
  )
  setCart(next)
  return next
}

export function clearCart(): void {
  setCart([])
}

export function getCartCount(items?: CartItem[]): number {
  const list = items || getCart()
  return list.reduce((s, i) => s + (i.quantity || 1), 0)
}

export function getLineKey(item: Pick<CartItem, 'id' | 'productId'>): string {
  return lineKey(item)
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const refresh = useCallback(() => {
    setItems(getCart())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener(CART_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(CART_EVENT, refresh)
    }
  }, [refresh])

  const addItem = useCallback((item: CartItem) => {
    setItems(addToCart(item))
  }, [])

  const removeItem = useCallback((lineId: string) => {
    setItems(removeFromCart(lineId))
  }, [])

  const changeQuantity = useCallback((lineId: string, delta: number) => {
    setItems(updateQuantity(lineId, delta))
  }, [])

  const clear = useCallback(() => {
    setItems([])
    clearCart()
  }, [])

  return {
    items,
    addItem,
    removeItem,
    updateQuantity: changeQuantity,
    clearCart: clear,
    count: getCartCount(items),
  }
}
