'use client'

// Follow button (Velor Social stage 3, 2026-07-29 -- OSA pack SIGNED, all
// five documents, VELOR_SOCIAL_ENABLED flipped by William same day).
// Renders nothing while the feature is disabled (the /api/social routes
// 403) or while state is unknown, so it is safe on any surface. Privacy
// per the DPIA: a user sees only their OWN follow state -- no public
// follower lists, no counts here.

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

export default function FollowSellerButton({ sellerId, compact = false }: { sellerId: string; compact?: boolean }) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  // null = unknown/disabled (render nothing yet), boolean = known state
  const [following, setFollowing] = useState<boolean | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await fetch('/api/social/follows')
        if (r.status === 403) return // Velor Social not enabled -- stay hidden
        if (r.status === 401) {
          // Signed out: feature is live; show a Follow button that routes
          // through sign-in.
          if (!cancelled) { setEnabled(true); setFollowing(false) }
          return
        }
        if (!r.ok) return
        const data = await r.json()
        if (!cancelled) {
          setEnabled(true)
          setFollowing(Array.isArray(data.follows) && data.follows.some((f: { sellerId: string }) => f.sellerId === sellerId))
        }
      } catch {
        // network hiccup -- stay hidden rather than showing a dead button
      }
    }
    void load()
    return () => { cancelled = true }
  }, [sellerId])

  if (!enabled || following === null) return null

  async function toggle() {
    if (busy) return
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=${encodeURIComponent(pathname || '/')}`)
      return
    }
    setBusy(true)
    const was = following
    setFollowing(!was) // optimistic
    try {
      const r = await fetch('/api/social/follows', {
        method: was ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId }),
      })
      if (!r.ok) setFollowing(was) // rollback
    } catch {
      setFollowing(was)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-pressed={!!following}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        minHeight: compact ? '36px' : '40px',
        padding: compact ? '6px 14px' : '8px 20px',
        borderRadius: '999px',
        fontSize: compact ? '12.5px' : '13.5px',
        fontWeight: 700,
        cursor: busy ? 'wait' : 'pointer',
        border: following ? '1px solid var(--border)' : '1px solid var(--accent)',
        background: following ? 'transparent' : 'var(--accent)',
        color: following ? 'var(--text)' : '#fff',
        transition: 'background 0.15s ease',
      }}
    >
      {following ? '✓ Following' : '+ Follow'}
    </button>
  )
}
