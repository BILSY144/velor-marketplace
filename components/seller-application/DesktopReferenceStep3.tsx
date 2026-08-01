'use client';

import { useEffect, useMemo, useState } from 'react';
import { COUNTRY_OPTIONS, FormState } from './types';
import { IconChartUp } from './icons';

const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 1024;

const inputStyle: React.CSSProperties = {
  position: 'absolute', height: 42, borderRadius: 7,
  border: '1px solid rgba(255,255,255,.13)', background: '#0d0d0d',
  color: '#f2efe7', padding: '0 14px', fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

export function DesktopReferenceStep3({
  form, update, onBack, onNext, error, foundingSeatsAvailable,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onBack: () => void;
  onNext: () => void;
  error: string | null;
  // Live remaining founding-seat count (see lib/founding.ts). Optional --
  // when omitted, the artwork's own baked "190 FOUNDING SEATS. ALL STILL
  // OPEN." line is simply left showing instead of being painted over.
  foundingSeatsAvailable?: number;
}) {
  const [viewport, setViewport] = useState({ width: DESIGN_WIDTH, height: DESIGN_HEIGHT });
  useEffect(() => {
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    measure(); window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const scale = useMemo(() => Math.min(viewport.width / DESIGN_WIDTH, viewport.height / DESIGN_HEIGHT), [viewport]);
  const left = Math.max(0, (viewport.width - DESIGN_WIDTH * scale) / 2);
  const top = Math.max(0, (viewport.height - DESIGN_HEIGHT * scale) / 2);

  return (
    <div aria-label="Velor seller application, step 3 of 4" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#050505' }}>
      <div style={{ position: 'absolute', left, top, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <img src="/apply-wizard/design-step3.png" alt="" aria-hidden="true" draggable={false} style={{ position: 'absolute', inset: 0, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, userSelect: 'none', pointerEvents: 'none' }} />

        <input aria-label="Shipping full name" autoComplete="name" value={form.shippingName} onChange={e => update('shippingName', e.target.value)} placeholder="e.g. Ahmed Khan" style={{ ...inputStyle, left: 72, top: 428, width: 364 }} />
        <input aria-label="Shipping phone number" autoComplete="tel" value={form.shippingPhone} onChange={e => update('shippingPhone', e.target.value)} placeholder="+44 7123 456789" style={{ ...inputStyle, left: 451, top: 428, width: 316 }} />
        <input aria-label="Address line 1" autoComplete="address-line1" value={form.shippingStreet1} onChange={e => update('shippingStreet1', e.target.value)} placeholder="e.g. 123 High Street" style={{ ...inputStyle, left: 72, top: 517, width: 695 }} />
        <input aria-label="Address line 2, optional" autoComplete="address-line2" value={form.shippingStreet2} onChange={e => update('shippingStreet2', e.target.value)} placeholder="e.g. Unit 4, Floor 2, etc." style={{ ...inputStyle, left: 72, top: 602, width: 695 }} />
        <input aria-label="City or town" autoComplete="address-level2" value={form.shippingCity} onChange={e => update('shippingCity', e.target.value)} placeholder="e.g. London" style={{ ...inputStyle, left: 72, top: 684, width: 220 }} />
        <input aria-label="State or region, optional" autoComplete="address-level1" value={form.shippingState} onChange={e => update('shippingState', e.target.value)} placeholder="e.g. Greater London" style={{ ...inputStyle, left: 315, top: 684, width: 220 }} />
        <input aria-label="Postcode or ZIP" autoComplete="postal-code" value={form.shippingZip} onChange={e => update('shippingZip', e.target.value)} placeholder="e.g. SW1A 1AA" style={{ ...inputStyle, left: 558, top: 684, width: 209 }} />
        <select aria-label="Shipping country" autoComplete="country" value={form.shippingCountry} onChange={e => update('shippingCountry', e.target.value)} style={{ ...inputStyle, left: 72, top: 770, width: 317, appearance: 'auto' }}>
          <option value="">Select country</option>
          {COUNTRY_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>

        {/* The approved art has a "Preferred shipping methods" checklist here (label
            + 3 checkboxes, y~745-848 in the 1536x1024 artwork -- not a live field,
            nothing on the form posts it), but the live API needs shippingCompany.
            The cover panel spans the full label+checkbox block (not just the first
            line) so none of the baked checkbox artwork bleeds through above/below
            the real input -- a shorter box here previously left "Express Shipping"
            and "International Shipping" visible around the edges. */}
        <div style={{ position: 'absolute', left: 434, top: 744, width: 333, height: 114, background: '#111', borderRadius: 7, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ display: 'block', marginBottom: 7, color: '#ece8e0', font: '14px Inter, sans-serif' }}>Company (optional)</label>
          <input aria-label="Shipping company, optional" autoComplete="organization" value={form.shippingCompany} onChange={e => update('shippingCompany', e.target.value)} placeholder="Company or workshop name" style={{ ...inputStyle, position: 'relative', left: 0, top: 0, width: 333 }} />
        </div>

        {/* The approved artwork's "FOUNDING SELLER BENEFITS" list also had a
            "Pro, free for life -- Worth £49/month" line (same retired-Pro-
            tier issue as the Step 2 sidebar -- see the comment there). This
            box already lists the real current founding perks separately
            ("Founding seller badge", "Top placement"), so this bullet is
            just replaced rather than left duplicating stale pricing.
            Bounds pixel-checked against design-step3.png so neither the
            box header above nor "Founding seller badge" below is clipped.
            Placeholder copy/icon pending an updated design pass. */}
        <div style={{ position: 'absolute', left: 1155, top: 480, width: 370, height: 54, background: '#161616', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', border: '1.3px solid #f47a20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconChartUp size={17} color="#f47a20" />
          </div>
          <div>
            <div style={{ color: '#f2efe7', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>Smart Tools</div>
            <div style={{ color: '#8f8f8f', fontFamily: 'Inter, sans-serif', fontSize: 11.5 }}>Analytics &amp; optimisation to grow.</div>
          </div>
        </div>

        {/* Same stale-claim fix as DesktopReferenceStep1.tsx's founding-seats
            panel (see that comment for the full rationale) -- this artwork
            has its own separate baked "190 FOUNDING SEATS. ALL STILL OPEN."
            line lower in the shipping-benefits box. Bounds measured
            directly from design-step3.png via a pixel-gridded crop: the
            bordered box interior runs roughly x=1150-1495, y=805-885, with
            "BE THE FIRST FROM YOUR COUNTRY" above (kept, still accurate)
            and the box's rounded bottom border below (kept) -- this panel
            covers only the seats line itself, with margin on both sides
            so it doesn't bleed into the border. */}
        {/* 2026-08-01 correction: same pixel-density re-check as
            DesktopReferenceStep1.tsx after William reported an overlap bug
            on Step 1's version of this panel. This one's vertical bounds
            were fine (glyphs at y~859-876, well inside 850-882), but the
            left edge was measured too far right -- glyphs actually start
            at x~1188, 27px before this panel's old left:1215, leaving a
            sliver of the baked "1" visible. Widened left/width to start
            comfortably before the real text and still clear the border. */}
        {foundingSeatsAvailable !== undefined && (
          <div style={{ position: 'absolute', left: 1180, top: 850, width: 310, height: 32, background: '#0d0d0d', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.01em', color: '#f4771f', whiteSpace: 'nowrap' }}>
              {foundingSeatsAvailable > 0 ? `${foundingSeatsAvailable} FOUNDING SEATS. STILL OPEN.` : 'ALL FOUNDING SEATS CLAIMED.'}
            </span>
          </div>
        )}

        {error && <div role="alert" style={{ position: 'absolute', left: 245, top: 922, width: 520, color: '#ff9a82', font: '12px Inter, sans-serif', textAlign: 'center' }}>{error}</div>}
        <button type="button" onClick={onBack} aria-label="Back to Your Store" style={{ position: 'absolute', left: 40, top: 953, width: 200, height: 46, background: 'transparent', border: 0, cursor: 'pointer' }} />
        <button type="button" onClick={onNext} aria-label="Continue to Finish" style={{ position: 'absolute', left: 1124, top: 948, width: 382, height: 46, background: 'transparent', border: 0, cursor: 'pointer' }} />
      </div>
    </div>
  );
}
