'use client';

import { IconArrowRight } from './icons';

export function PrimaryButton({
  children, onClick, type = 'button', disabled, loading, showArrow = true,
}: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit';
  disabled?: boolean; loading?: boolean; showArrow?: boolean;
}) {
  const isDisabled = disabled || loading;
  // Section 20 of ChatGPT's Implementation Specification v1.0 claimed height
  // 64 and a gradient fill -- direct pixel measurement of design-step1.png
  // (2026-08-01, scanning the button's own top/bottom edges and sampling its
  // fill colour) shows neither holds up: the real button is a *solid* colour
  // (~216,97,27 = #D8611B, no gradient) and only ~54px tall, not 66.
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        width: '100%', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        borderRadius: 12, background: '#D8611B', border: 'none',
        fontFamily: 'var(--sa-font-body)', fontSize: 18, fontWeight: 700, color: '#1a0d00',
        cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1, boxSizing: 'border-box',
      }}
    >
      {loading ? 'Submitting…' : children}
      {!loading && showArrow && <IconArrowRight size={20} />}
    </button>
  );
}
