'use client'

// A horizontal strip of every country's flag, shown directly under the
// header on every public page. Buyers press the mouse (or touch) and drag
// to "spin" through flags -- releasing lets it glide to a stop with
// momentum, like flicking a reel -- then click a flag to browse products
// whose Origin Country matches it (?origin=<ISO2> on /shop).
//
// TAP RELIABILITY (rewritten 2026-07-17, William's bug report): the old
// version called setPointerCapture on EVERY pointerdown, which makes the
// browser retarget pointerup/click to the track div -- so the flag button's
// own onClick never fired, and navigation depended on a manual
// getBoundingClientRect hit-test at release time. That hit-test silently
// missed whenever layout was shifting (lazy images, scroll restoration),
// and on touch any finger wobble past the 6px threshold turned a tap into
// a "drag" that navigated nowhere. Result: intermittent dead taps, worst
// on mobile, and buyers stuck on one country page.
//
// New model: capture is DEFERRED. Pointerdown only records the start
// point; nothing is captured, so a plain tap keeps fully native click
// behaviour on the button (100% reliable). Only once the pointer has
// actually moved past the drag threshold do we take capture and start
// scrolling the reel -- and after a real drag we suppress the one click
// that follows it so releasing a spin never accidentally opens a country.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WORLD_COUNTRIES } from '@/lib/worldCountries'

// Touch needs a bigger dead-zone than a mouse: fingertips wobble several
// pixels during a deliberate tap, and treating that as a drag is exactly
// the dead-tap bug this rewrite removes.
const DRAG_THRESHOLD_MOUSE_PX = 6
const DRAG_THRESHOLD_TOUCH_PX = 14
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
    dragging: false,
    suppressClick: false,
    threshold: DRAG_THRESHOLD_MOUSE_PX,
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
    // Deliberately NO setPointerCapture here -- see header comment. A tap
    // that never crosses the threshold stays a completely native click.
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: track.scrollLeft,
      dragging: false,
      suppressClick: false,
      threshold: e.pointerType === 'mouse' ? DRAG_THRESHOLD_MOUSE_PX : DRAG_THRESHOLD_TOUCH_PX,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
    }
  }, [stopMomentum])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const track = trackRef.current
    if (!track || drag.current.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.current.startX

    if (!drag.current.dragging) {
      if (Math.abs(dx) <= drag.current.threshold) return
      // The pointer has genuinely started dragging: only NOW take capture
      // (so the drag keeps tracking outside the strip) and mark the next
      // click for suppression.
      drag.current.dragging = true
      drag.current.suppressClick = true
      setIsDragging(true)
      try {
        track.setPointerCapture(e.pointerId)
      } catch {
        // Capture can fail if the pointer was released mid-frame; the drag
        // still works for movement inside the strip, so ignore.
      }
    }

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

    // Country-to-country switching (2026-07-21, William: "when i click on a
  // flag it stays on united kingdom"): a client-router push from
  // /shop?origin=X to /shop?origin=Y (same pathname, query-only) was
  // silently ignored by the app router in production -- reproduced live;
  // no error, URL simply never changed. From any OTHER page the soft push
  // works fine. So: soft-navigate normally, but when already on /shop use
  // a full navigation, which the browser handles unconditionally.
  const goToOrigin = useCallback((code: string) => {
    const href = `/shop?origin=${code}`
    if (typeof window !== 'undefined' && window.location.pathname === '/shop') {
      window.location.assign(href)
    } else {
      router.push(href)
    }
  }, [router])

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (drag.current.pointerId !== e.pointerId) return
    drag.current.pointerId = -1
    if (drag.current.dragging) {
      setIsDragging(false)
      drag.current.dragging = false
      if (Math.abs(drag.current.velocity) > MIN_VELOCITY) runMomentum()
      // drag.current.suppressClick stays true just long enough to swallow
      // the click event the browser fires after this pointerup; it is
      // consumed (or expires) in onClickCapture below.
      return
    }
    // TAP-ON-POINTERUP (2026-07-17, William: flags still dead on his phone
    // after the deferred-capture rewrite). Mobile WebKit decides for itself
    // when a touch on a pan-x scroller becomes a scroll, and when it does it
    // simply never delivers the button's click -- our 14px threshold never
    // enters into it. So a clean tap must not depend on the browser's click
    // at all: if the pointer never crossed OUR drag threshold, navigate
    // right here on pointerup (which HAS been delivered, or we would not be
    // in this handler), and swallow the trailing click so it cannot fire a
    // second navigation. Keyboard users still navigate via the button's own
    // onClick -- Enter/Space produce no pointer events, so nothing here
    // interferes with that path.
    const flag = (e.target as HTMLElement).closest?.('[data-country-code]') as HTMLElement | null
    const code = flag?.getAttribute('data-country-code')
    if (code) {
      drag.current.suppressClick = true
      // If WebKit never delivers the trailing click, don't leave the
      // suppression armed to swallow an unrelated future click (e.g. a
      // keyboard activation, which has no pointerdown to reset it).
      setTimeout(() => { drag.current.suppressClick = false }, 400)
      goToOrigin(code)
    }
  }, [runMomentum, goToOrigin])

  // Swallows exactly one click after a real drag, so releasing a spin over
  // a flag doesn't navigate. Plain taps never set suppressClick, so their
  // clicks pass straight through to the flag button's onClick.
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (drag.current.suppressClick) {
      drag.current.suppressClick = false
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  useEffect(() => stopMomentum, [stopMomentum])

  const handleFlagClick = (e: React.MouseEvent, code: string) => {
    // Modified clicks (new tab etc.) take the anchor's default behaviour.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    goToOrigin(code)
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
        onClickCapture={onClickCapture}
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
          <a
            key={c.code}
            href={`/shop?origin=${c.code}`}
            title={c.name}
            aria-label={`Shop goods from ${c.name}`}
            data-country-code={c.code}
            draggable={false}
            onClick={(e) => handleFlagClick(e, c.code)}
            style={{
              flexShrink: 0,
              width: '37px',
              height: '27px',
              padding: 0,
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              cursor: 'pointer',
              display: 'block',
            }}
          >
            <img
              src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
              alt=""
              draggable={false}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
            />
          </a>
        ))}
      </div>
    </div>
  )
}
