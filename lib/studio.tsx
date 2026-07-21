'use client';

// ============================================================
// VELOR SELLER STUDIO design system (2026-07-21) -- the
// Shopify-style professional dashboard William approved from
// the concept mockup (velor-seller-dashboard-concept.html):
// light surfaces, left sidebar, white cards, crisp tables,
// Fraunces page headings, orange used sparingly as the accent.
// Replaces lib/halo.tsx for the dashboard (halo stays only
// until every page has migrated off it).
//
// Standing rules honoured here: no Tailwind, inline CSS +
// tokens; no emojis; brand accent #FF6B00; Fraunces headings.
// ============================================================

import React from 'react';

export const STUDIO = {
  bg: '#F6F6F7',
  surface: '#FFFFFF',
  border: '#E3E3E6',
  borderSoft: '#ECECEF',
  ink: '#1A1A1D',
  ink2: '#44464B',
  muted: '#6D7175',
  faint: '#9C9FA5',
  accent: '#FF6B00',
  accentSoft: '#FFF1E7',
  accentLine: '#FFD9BE',
  green: '#108043',
  greenSoft: '#E3F1DF',
  amber: '#8A6116',
  amberSoft: '#FBF1DC',
  red: '#B3261E',
  redSoft: '#FBEAE8',
  blue: '#1D5F93',
  blueSoft: '#E8F1F8',
  fontBody: "'Inter', sans-serif",
  fontDisplay: "'Space Grotesk', sans-serif",
  fontSerif: "'Fraunces', serif",
} as const;

// ---------- layout primitives ----------

export function pageStyle(): React.CSSProperties {
  return { padding: '26px 28px 60px', maxWidth: 1180, margin: '0 auto' };
}

export function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: STUDIO.surface,
    border: `1px solid ${STUDIO.border}`,
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(26,26,29,0.04)',
    ...extra,
  };
}

export function cardHeadStyle(): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px', borderBottom: `1px solid ${STUDIO.borderSoft}`,
  };
}

export function kickerStyle(): React.CSSProperties {
  return {
    fontFamily: STUDIO.fontDisplay, fontSize: 10.5, fontWeight: 600,
    letterSpacing: '0.16em', textTransform: 'uppercase', color: STUDIO.accent,
    marginBottom: 6,
  };
}

export function h1Style(): React.CSSProperties {
  return {
    fontFamily: STUDIO.fontSerif, fontWeight: 600, fontSize: 26,
    letterSpacing: '-0.3px', color: STUDIO.ink, margin: 0,
  };
}

// ---------- components ----------

export function StudioPageHead(props: {
  kicker: string;
  title: string;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <div style={kickerStyle()}>{props.kicker}</div>
        <h1 style={h1Style()}>{props.title}</h1>
        {props.sub && <div style={{ color: STUDIO.muted, fontSize: 13, marginTop: 5 }}>{props.sub}</div>}
      </div>
      {props.actions && <div style={{ display: 'flex', gap: 9, flexShrink: 0 }}>{props.actions}</div>}
    </div>
  );
}

export function StudioButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}) {
  const variant = props.variant || 'primary';
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 8, padding: '8px 15px', fontSize: 13, fontWeight: 600,
    cursor: props.disabled ? 'not-allowed' : 'pointer', border: '1px solid transparent',
    fontFamily: STUDIO.fontBody, textDecoration: 'none', opacity: props.disabled ? 0.55 : 1,
    ...(variant === 'primary'
      ? { background: STUDIO.accent, color: '#fff', boxShadow: '0 1px 2px rgba(255,107,0,0.3)' }
      : variant === 'danger'
        ? { background: STUDIO.redSoft, color: STUDIO.red, borderColor: '#F1C4C0' }
        : { background: STUDIO.surface, borderColor: STUDIO.border, color: STUDIO.ink2 }),
    ...props.style,
  };
  if (props.href) {
    return <a href={props.href} style={base}>{props.children}</a>;
  }
  return (
    <button type={props.type || 'button'} onClick={props.onClick} disabled={props.disabled} style={base}>
      {props.children}
    </button>
  );
}

export type ChipTone = 'good' | 'escrow' | 'neutral' | 'bad' | 'blue';

export function StudioChip(props: { tone: ChipTone; children: React.ReactNode; dot?: boolean }) {
  const tones: Record<ChipTone, { bg: string; color: string; border?: string }> = {
    good: { bg: STUDIO.greenSoft, color: STUDIO.green },
    escrow: { bg: STUDIO.amberSoft, color: STUDIO.amber },
    neutral: { bg: STUDIO.bg, color: STUDIO.muted, border: STUDIO.border },
    bad: { bg: STUDIO.redSoft, color: STUDIO.red },
    blue: { bg: STUDIO.blueSoft, color: STUDIO.blue },
  };
  const t = tones[props.tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 6,
      padding: '3px 8px', fontSize: 11, fontWeight: 600, background: t.bg, color: t.color,
      border: t.border ? `1px solid ${t.border}` : '1px solid transparent',
      whiteSpace: 'nowrap',
    }}>
      {props.dot !== false && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />}
      {props.children}
    </span>
  );
}

export function StudioKpi(props: { label: React.ReactNode; value: React.ReactNode; delta?: React.ReactNode }) {
  return (
    <div style={cardStyle({ padding: '15px 17px' })}>
      <div style={{ fontSize: 12, fontWeight: 500, color: STUDIO.muted }}>{props.label}</div>
      <div style={{ fontFamily: STUDIO.fontDisplay, fontSize: 23, fontWeight: 700, letterSpacing: '-0.5px', marginTop: 7, color: STUDIO.ink }}>
        {props.value}
      </div>
      {props.delta && <div style={{ fontSize: 11.5, fontWeight: 500, color: STUDIO.muted, marginTop: 5 }}>{props.delta}</div>}
    </div>
  );
}

export const tableThStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
  color: STUDIO.faint, textAlign: 'left', padding: '9px 18px',
  borderBottom: `1px solid ${STUDIO.borderSoft}`, fontFamily: STUDIO.fontBody,
};

export const tableTdStyle: React.CSSProperties = {
  padding: '11px 18px', borderBottom: `1px solid ${STUDIO.borderSoft}`,
  verticalAlign: 'middle', fontSize: 12.8, color: STUDIO.ink,
};

export function StudioNotice(props: { tone: 'blue' | 'orange' | 'red'; children: React.ReactNode; style?: React.CSSProperties }) {
  const tones = {
    blue: { bg: STUDIO.blueSoft, border: '#CBDFEF', color: '#173F5F' },
    orange: { bg: STUDIO.accentSoft, border: STUDIO.accentLine, color: '#7A3A00' },
    red: { bg: STUDIO.redSoft, border: '#F1C4C0', color: '#7A1B15' },
  };
  const t = tones[props.tone];
  return (
    <div style={{
      display: 'flex', gap: 12, borderRadius: 12, padding: '13px 16px', fontSize: 12.8,
      lineHeight: 1.55, marginBottom: 14, alignItems: 'flex-start',
      background: t.bg, border: `1px solid ${t.border}`, color: t.color, ...props.style,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden>
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
      </svg>
      <div>{props.children}</div>
    </div>
  );
}

// Form field style shared by settings-type pages -- theme-safe (never
// hardcode dark hexes; the black-input-box bug class from the halo era).
export const inputStyle: React.CSSProperties = {
  width: '100%', background: STUDIO.surface, border: `1px solid ${STUDIO.border}`,
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: STUDIO.ink,
  fontFamily: STUDIO.fontBody, outline: 'none', boxSizing: 'border-box',
};

export const selectPillStyle: React.CSSProperties = {
  background: STUDIO.surface, border: `1px solid ${STUDIO.border}`, borderRadius: 8,
  padding: '6px 9px', fontSize: 12, fontWeight: 500, color: STUDIO.ink2,
  fontFamily: STUDIO.fontBody, cursor: 'pointer', outline: 'none', maxWidth: 110,
};
