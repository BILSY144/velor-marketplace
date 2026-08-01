'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormState } from './types';
import { IconBriefcase, IconCheck, IconEye, IconEyeOff, IconPerson } from './icons';

const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 1024;

function selectionStyle(selected: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    top: 323,
    width: 276,
    height: 126,
    borderRadius: 12,
    border: `1px solid ${selected ? '#f4771f' : 'rgba(255,255,255,.13)'}`,
    background: selected ? 'linear-gradient(135deg,#1d120d 0%,#111 100%)' : 'linear-gradient(135deg,#111 0%,#0f0f0f 100%)',
    color: '#f4f2ee',
    padding: '20px 20px 16px',
    textAlign: 'left',
    boxSizing: 'border-box',
    cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif',
  };
}

const inputBase: React.CSSProperties = {
  position: 'absolute',
  height: 42,
  borderRadius: 7,
  border: '1px solid rgba(255,255,255,.12)',
  background: '#0c0c0c',
  color: '#f2efe7',
  padding: '0 15px',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

export function DesktopReferenceStep1({
  form,
  update,
  onNext,
  error,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onNext: () => void;
  error: string | null;
}) {
  const [viewport, setViewport] = useState({ width: DESIGN_WIDTH, height: DESIGN_HEIGHT });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const scale = useMemo(
    () => Math.min(viewport.width / DESIGN_WIDTH, viewport.height / DESIGN_HEIGHT),
    [viewport],
  );
  const left = Math.max(0, (viewport.width - DESIGN_WIDTH * scale) / 2);
  const top = Math.max(0, (viewport.height - DESIGN_HEIGHT * scale) / 2);

  return (
    <div aria-label="Velor seller application, step 1 of 4" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#050505' }}>
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* The approved artwork is used as the desktop visual skin. This is
            deliberate: the PNG is the only authoritative source for the
            original globe crop, exact icon drawings, font rendering and
            optical spacing. Interactive form controls are layered above it. */}
        <img
          src="/apply-wizard/design-step1.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, userSelect: 'none', pointerEvents: 'none' }}
        />

        {/* Real seller-type controls replace the baked cards so the selection
            can change while retaining the artwork's dimensions. */}
        <button
          type="button"
          aria-pressed={form.sellerType === 'individual'}
          onClick={() => update('sellerType', 'individual')}
          style={{ ...selectionStyle(form.sellerType === 'individual'), left: 869 }}
        >
          {form.sellerType === 'individual' && (
            <span style={{ position: 'absolute', top: 14, right: 14, width: 24, height: 24, borderRadius: '50%', background: '#f4771f', color: '#1a0d00', display: 'grid', placeItems: 'center' }}>
              <IconCheck size={14} />
            </span>
          )}
          <span style={{ display: 'block', color: form.sellerType === 'individual' ? '#f4771f' : '#9a9a9a', height: 45 }}><IconPerson size={31} /></span>
          <strong style={{ display: 'block', fontSize: 16, lineHeight: 1.25 }}>As an individual</strong>
          <span style={{ display: 'block', marginTop: 4, color: '#929292', fontSize: 13 }}>I sell on my own</span>
        </button>

        <button
          type="button"
          aria-pressed={form.sellerType === 'business'}
          onClick={() => update('sellerType', 'business')}
          style={{ ...selectionStyle(form.sellerType === 'business'), left: 1166, width: 282 }}
        >
          {form.sellerType === 'business' && (
            <span style={{ position: 'absolute', top: 14, right: 14, width: 24, height: 24, borderRadius: '50%', background: '#f4771f', color: '#1a0d00', display: 'grid', placeItems: 'center' }}>
              <IconCheck size={14} />
            </span>
          )}
          <span style={{ display: 'block', color: form.sellerType === 'business' ? '#f4771f' : '#9a9a9a', height: 45 }}><IconBriefcase size={31} /></span>
          <strong style={{ display: 'block', fontSize: 16, lineHeight: 1.25 }}>As a registered business</strong>
          <span style={{ display: 'block', marginTop: 4, color: '#929292', fontSize: 13 }}>I represent a business</span>
        </button>

        <input
          aria-label="Store name"
          autoComplete="organization"
          value={form.businessName}
          onChange={e => update('businessName', e.target.value)}
          placeholder="e.g. Ahmed's Pottery"
          style={{ ...inputBase, left: 869, top: 503, width: 275 }}
        />
        <input
          aria-label="Your full name"
          autoComplete="name"
          value={form.contactName}
          onChange={e => update('contactName', e.target.value)}
          placeholder="e.g. Ahmed Khan"
          style={{ ...inputBase, left: 869, top: 600, width: 275 }}
        />
        <input
          aria-label="Email address"
          type="email"
          autoComplete="email"
          value={form.contactEmail}
          onChange={e => update('contactEmail', e.target.value)}
          placeholder="you@email.com"
          style={{ ...inputBase, left: 869, top: 697, width: 354 }}
        />
        <div style={{ position: 'absolute', left: 869, top: 792, width: 354, height: 42 }}>
          <input
            aria-label="Create a password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.password}
            onChange={e => update('password', e.target.value)}
            placeholder="At least 8 characters"
            style={{ ...inputBase, inset: 0, width: '100%', paddingRight: 44 }}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(value => !value)}
            style={{ position: 'absolute', right: 10, top: 10, width: 24, height: 24, display: 'grid', placeItems: 'center', color: '#9d9d9d' }}
          >
            {showPassword ? <IconEyeOff size={19} /> : <IconEye size={19} />}
          </button>
        </div>

        {error && (
          <div role="alert" style={{ position: 'absolute', left: 869, top: 838, width: 579, color: '#ff9a82', fontFamily: 'Inter, sans-serif', fontSize: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Invisible functional hit-area preserves the exact baked CTA. */}
        <button
          type="button"
          onClick={onNext}
          aria-label="Continue to Your Store"
          style={{ position: 'absolute', left: 869, top: 858, width: 579, height: 56, borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
        />
        <a
          href="/auth/sign-in"
          aria-label="Sign in"
          style={{ position: 'absolute', left: 1200, top: 934, width: 55, height: 26 }}
        />
      </div>
    </div>
  );
}
