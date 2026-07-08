'use client'

// A horizontal rail the buyer can grab and fling, exactly like the country
// flag strip under the header (components/CountryOriginStrip.tsx). Press and
// drag to spin through the cards; release and it glides to a stop with
// momentum. A plain tap still navigates, because we only treat the gesture
// as a drag once the pointer has moved past a few pixels.
//
// Why the manual tap handling: we call setPointerCapture on pointerdown so
// the drag keeps tracking outside the rail. That makes the browser swallow
// the native click on whatever card is under the pointer, so an ordinary
// <Link> onClick never fires. Instead each child card carries a
// data-drag-href attribute, and on release -- if the pointer never moved --
// we hit-test the release point against each card's real bounding rect and
// navigate ourselves. We also cancel any native click that does slip
// through, so a fling never accidentally opens a stream.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const DRAG_THRESHOLD_PX = 6
const FRICTION = 0.94
const MIN_VELOCITY = 0.05

interface DragScrollerProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  /** Accessible label for the rail. */
  ariaLabel?: string
}

export default function DragScroller({ children, className, style, ariaLabel }: DragScrollerProps) {
  const router = useRouter()
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

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
      const instVelocity = ((e.clientX - drag.current.lastX) / dt) * 16.7
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

    if (drag.current.moved) return

    const track = trackRef.current
    const cards = track?.querySelectorAll<HTMLElement>('[data-drag-href]')
    if (!cards) return
    for (const card of cards) {
      const r = card.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        const href = card.dataset.dragHref
        if (href) router.push(href)
        break
      }
    }
  }, [runMomentum, router])

  // Never let a native click through: taps are handled in endDrag, and a
  // fling must not navigate.
  const swallowClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  useEffect(() => stopMomentum, [stopMomentum])

  return (
    <div
      ref={trackRef}
      role="list"
      aria-label={ariaLabel}
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={swallowClick}
      style={{
        display: 'flex',
        gap: 14,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 8,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'pan-x',
        scrollbarWidth: 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
