'use client';

import { useEffect, useMemo, useState } from 'react';
import { COUNTRY_OPTIONS, FormState } from './types';

const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 1024;
const bodyText: React.CSSProperties = { color: '#c9c4bc', font: '14px/1.45 Inter, sans-serif' };

export function DesktopReferenceStep4({
  form, onBack, onEdit, onSubmit, error, submitting, submitted,
}: {
  form: FormState;
  onBack: () => void;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  error: string | null;
  submitting: boolean;
  submitted: boolean;
}) {
  const [viewport, setViewport] = useState({ width: DESIGN_WIDTH, height: DESIGN_HEIGHT });
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    measure(); window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const scale = useMemo(() => Math.min(viewport.width / DESIGN_WIDTH, viewport.height / DESIGN_HEIGHT), [viewport]);
  const left = Math.max(0, (viewport.width - DESIGN_WIDTH * scale) / 2);
  const top = Math.max(0, (viewport.height - DESIGN_HEIGHT * scale) / 2);
  const country = COUNTRY_OPTIONS.find(([code]) => code === form.shippingCountry)?.[1] ?? form.shippingCountry;

  return (
    <div aria-label="Velor seller application, step 4 of 4" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#050505' }}>
      <div style={{ position: 'absolute', left, top, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <img src="/apply-wizard/design-step4.png" alt="" aria-hidden="true" draggable={false} style={{ position: 'absolute', inset: 0, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, userSelect: 'none', pointerEvents: 'none' }} />

        {/* Replace the example review text with the seller's actual entries. */}
        <div style={{ position: 'absolute', left: 146, top: 438, width: 390, height: 89, background: '#101111', padding: '3px 6px', boxSizing: 'border-box', ...bodyText }}>
          <strong style={{ display: 'block', color: '#f0ede7', fontSize: 15 }}>About You</strong>
          {form.sellerType === 'business' ? 'Registered business' : 'Individual seller'}<br />
          {form.contactName}<br />{form.contactEmail}
        </div>
        <div style={{ position: 'absolute', left: 146, top: 545, width: 390, height: 91, background: '#101111', padding: '3px 6px', boxSizing: 'border-box', ...bodyText }}>
          <strong style={{ display: 'block', color: '#f0ede7', fontSize: 15 }}>Your Store</strong>
          {form.businessName}<br />
          <span style={{ display: 'block', maxHeight: 42, overflow: 'hidden' }}>{form.storeDescription}</span>
        </div>
        <div style={{ position: 'absolute', left: 146, top: 653, width: 390, height: 92, background: '#101111', padding: '3px 6px', boxSizing: 'border-box', ...bodyText }}>
          <strong style={{ display: 'block', color: '#f0ede7', fontSize: 15 }}>Shipping</strong>
          {form.shippingStreet1}{form.shippingStreet2 ? `, ${form.shippingStreet2}` : ''}, {form.shippingCity}, {form.shippingZip}, {country}<br />
          {form.shippingPhone || 'No telephone supplied'}
        </div>
        <div style={{ position: 'absolute', left: 146, top: 765, width: 390, height: 70, background: '#101111', padding: '3px 6px', boxSizing: 'border-box', ...bodyText }}>
          <strong style={{ display: 'block', color: '#f0ede7', fontSize: 15 }}>Store media</strong>
          {form.sampleImages.length} image{form.sampleImages.length === 1 ? '' : 's'} selected<br />
          {form.productCategories.join(', ')}
        </div>

        {[1, 2, 3].map((n, index) => (
          <button key={n} type="button" onClick={() => onEdit(n)} aria-label={`Edit ${n === 1 ? 'About You' : n === 2 ? 'Your Store' : 'Shipping'}`} style={{ position: 'absolute', left: 566, top: [462, 567, 674][index], width: 88, height: 36, border: 0, background: 'transparent', cursor: 'pointer' }} />
        ))}

        {!submitted && (
          <>
            {/* Cover the baked success sentence until the API confirms success. */}
            <div style={{ position: 'absolute', left: 861, top: 402, width: 560, height: 65, background: '#090909', color: '#eeeae4', textAlign: 'center', font: '16px/1.55 Inter, sans-serif', paddingTop: 7, boxSizing: 'border-box' }}>
              Review your details and submit your seller application.<br />
              <span style={{ color: '#a8a39c', fontSize: 14 }}>Nothing is sent until you select the button below.</span>
            </div>
            <label style={{ position: 'absolute', left: 72, top: 858, width: 580, minHeight: 58, display: 'flex', gap: 12, alignItems: 'flex-start', background: '#101111', color: '#d2cdc5', font: '13px/1.45 Inter, sans-serif', padding: '12px 14px', boxSizing: 'border-box' }}>
              <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#f4771f', flexShrink: 0 }} />
              <span>I confirm the information is accurate and agree to Velor&apos;s Seller Agreement, Seller Rules and Product Compliance Policy.</span>
            </label>
            <button type="button" disabled={!accepted || submitting} onClick={onSubmit} aria-label="Submit Seller Application" style={{ position: 'absolute', left: 739, top: 878, width: 730, height: 59, border: 0, borderRadius: 7, background: accepted ? 'linear-gradient(90deg,#e96a17,#f4771f)' : '#6c3519', color: '#140900', font: '700 17px Inter, sans-serif', cursor: accepted && !submitting ? 'pointer' : 'not-allowed' }}>
              {submitting ? 'Submitting application…' : 'Submit Seller Application  →'}
            </button>
          </>
        )}

        {submitted && <a href="/seller/dashboard" aria-label="Go to Seller Dashboard" style={{ position: 'absolute', left: 739, top: 878, width: 730, height: 59 }} />}
        {error && <div role="alert" style={{ position: 'absolute', left: 739, top: 944, width: 730, color: '#ff9a82', font: '12px Inter, sans-serif', textAlign: 'center' }}>{error}</div>}
        <button type="button" onClick={onBack} aria-label="Back to Shipping" style={{ position: 'absolute', left: 37, top: 951, width: 185, height: 48, background: 'transparent', border: 0, cursor: 'pointer' }} />
      </div>
    </div>
  );
}
