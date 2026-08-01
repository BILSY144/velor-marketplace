'use client';

import { useEffect, useMemo, useState } from 'react';
import { COUNTRY_OPTIONS, FormState } from './types';

const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 1024;

const inputStyle: React.CSSProperties = {
  position: 'absolute', height: 42, borderRadius: 7,
  border: '1px solid rgba(255,255,255,.13)', background: '#0d0d0d',
  color: '#f2efe7', padding: '0 14px', fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

export function DesktopReferenceStep3({
  form, update, onBack, onNext, error,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onBack: () => void;
  onNext: () => void;
  error: string | null;
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

        {error && <div role="alert" style={{ position: 'absolute', left: 245, top: 922, width: 520, color: '#ff9a82', font: '12px Inter, sans-serif', textAlign: 'center' }}>{error}</div>}
        <button type="button" onClick={onBack} aria-label="Back to Your Store" style={{ position: 'absolute', left: 40, top: 953, width: 200, height: 46, background: 'transparent', border: 0, cursor: 'pointer' }} />
        <button type="button" onClick={onNext} aria-label="Continue to Finish" style={{ position: 'absolute', left: 1124, top: 948, width: 382, height: 46, background: 'transparent', border: 0, cursor: 'pointer' }} />
      </div>
    </div>
  );
}
