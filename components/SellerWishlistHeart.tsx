'use client'

// Small client-side wishlist heart for use inside otherwise-server-rendered
// listing grids (William, 2026-07-26: "add the wishlist heart to all
// listing boxes that link to wishlist" -- "repeat that on all pages for the
// heart"). Extracted into its own component because the seller storefront
// page (app/seller/[sellerId]/page.tsx) is a server component (reads
// straight from Prisma) and can't hold its own useState/useSession -- this
// is the one small client island it renders per product card. Same
// fetch/toggle contract as /shop's ShopPageClient.tsx, just self-contained
// per-button instead of sharing one parent's wishlist-ids Set, since the
// server component has no client state to share it through.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function SellerWishlistHeart({ productId }: { productId: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [inWishlist, setInWishlist] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    fetch('/api/wishlist')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        if (cancelled) return
        const ids = new Set<string>(data.items.map((i: { product: { id: string } }) => i.product.id))
        setInWishlist(ids.has(productId))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session, productId])

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=/shop/${productId}`)
      return
    }
    setPending(true)
    try {
      await fetch('/api/wishlist', {
        method: inWishlist ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      setInWishlist(!inWishlist)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
      style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'rgba(13,13,13,0.78)',
        border: 'none',
        cursor: pending ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '15px',
        color: inWishlist ? 'var(--red)' : 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(4px)',
        transition: 'color 0.15s',
        zIndex: 1,
        lineHeight: 1,
      }}
    >
      {inWishlist ? '♥' : '♡'}
    </button>
  )
}
