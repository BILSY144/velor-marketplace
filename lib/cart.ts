'use client'

import { useCallback, useEffect, useState } from 'react'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  sellerId?: string
  color?: string
  size?: string
  variantName?: string
}

const CART_KEY = 'velor-cart'
export const CART_EVENT = 'cart-updated'

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

function sameLine(a: CartItem, b: Pick<CartItem, 'productId' | 'color' | 'size' | 'variantName'>): boolean {
  return (
    a.productId === b.productId &&
    (a.color || '') === (b.color || '') &&
    (a.size || '') === (b.size || '') &&
    (a.variantName || '') === (b.variantName || '')
  )
}

export function addToCart(item: CartItem): CartItem[] {
  const items = getCart()
  const existingIndex = items.findIndex((i) => sameLine(i, item))
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

export function removeFromCart(productId: string): CartItem[] {
  const next = getCart().filter((i) => i.productId !== productId)
  setCart(next)
  return next
}

export function updateQuantity(productId: string, delta: number): CartItem[] {
  const next = getCart().map((i) =>
    i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
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

  const removeItem = useCallback((productId: string) => {
    setItems(removeFromCart(productId))
  }, [])

  const changeQuantity = useCallback((productId: string, delta: number) => {
    setItems(updateQuantity(productId, delta))
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
