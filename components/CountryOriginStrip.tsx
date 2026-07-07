'use client'

// A horizontal strip of every country's flag, shown directly under the
// header on every public page. Buyers press the mouse (or touch) and drag
// to "spin" through flags -- releasing lets it glide to a stop with
// momentum, like flicking a reel -- then click a flag to browse products
// whose Origin Country matches it (?origin=<ISO2> on /shop). A plain click
// (no drag) always still works since we only treat it as a drag once the
// pointer has moved a few pixels.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'

const DRAG_THRESHOLD_PX = 6
const FRICTION = 0.94
const MIN_VELOCITY = 0.05

export default function CountryOriginStrip() {
  const router = useRouter()
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Mutable drag/momentum state that doesn't need to trigger re-renders.
  const drag = useRef({
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
    lastX: 0,
    lastT: 0,
    velocity: 0,
  })
  const rafId = useRef<number | null>(null)

  const stopMomentum = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
  }, [])

  const runMomentum = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const step = () => {
      drag.current.velocity *= FRICTION
      if (Math.abs(drag.current.velocity) < MIN_VELOCITY) {
        rafId.current = null
        return
      }
      track.scrollLeft -= drag.current.velocity
      rafId.current = requestAnimationFrame(step)
    }
    rafId.current = requestAnimationFrame(step)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const track = trackRef.current
    if (!track) return
    stopMomentum()
    setIsDragging(true)
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: track.scrollLeft,
      moved: false,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
    }
    track.setPointerCapture(e.pointerId)
  }, [stopMomentum])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const track = trackRef.current
    if (!track || drag.current.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) drag.current.moved = true
    track.scrollLeft = drag.current.startScrollLeft - dx

    const now = performance.now()
    const dt = now - drag.current.lastT
    if (dt > 0) {
      const instVelocity = (e.clientX - drag.current.lastX) / dt * 16.7
      drag.current.velocity = drag.current.velocity * 0.7 + instVelocity * 0.3
    }
    drag.current.lastX = e.clientX
    drag.current.lastT = now
  }, [])

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (drag.current.pointerId !== e.pointerId) return
    setIsDragging(false)
    drag.current.pointerId = -1
    if (Math.abs(drag.current.velocity) > MIN_VELOCITY) runMomentum()
  }, [runMomentum])

  useEffect(() => stopMomentum, [stopMomentum])

  const handleFlagClick = (code: string) => {
    // Takes buyers straight to products whose Origin Country matches the
    // flag they picked. The /shop search bar still works on top of this
    // filter, so a buyer can narrow further by keyword within that country's
    // listings. NOTE (2026-07-07): every live product currently has
    // originCountry unset, so this filter shows zero results until sellers'
    // products get a real origin country recorded -- see William re: backfill plan.
    router.push(`/shop?origin=${code}`)
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="velor-origin-strip"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflowX: 'auto',
          padding: '9px 20px',
          maxWidth: '1400px',
          margin: '0 auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'pan-x',
          scrollbarWidth: 'none',
        }}
      >
        <span
          style={{
            flexShrink: 0,
            fontFamily: 'var(--font-body), Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          Shop by origin
        </span>
        {WORLD_COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            title={c.name}
            aria-label={`Shop products from ${c.name}`}
            onClick={() => handleFlagClick(c.code)}
            style={{
              flexShrink: 0,
              width: '28px',
              height: '20px',
              padding: 0,
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              pointerEvents: isDragging ? 'none' : 'auto',
            }}
          >
            <img
              src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
              alt=""
              draggable={false}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
