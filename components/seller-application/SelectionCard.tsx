'use client';

import { IconCheck } from './icons';

// Section 16 of ChatGPT's Implementation Specification v1.0 claimed height
// 98 -- direct pixel measurement of design-step1.png (2026-08-01, scanning
// the card's own left/orange border top-to-bottom) shows the real card runs
// from roughly y=328 to y=445, i.e. ~117px tall, not 98. Width 280, radius
// 14, border 1px, selected colour #F47A20, background #16110E all held up.
// Two of these sit side by side inside the 650px form card (padding 48 each
// side = 554px content width), so width uses flex:'1 1 0' with a 280px cap
// rather than a hard 280px -- two hard 280s plus a gap doesn't quite fit
// that content width.
export function SelectionCard({
  icon, title, subtitle, selected, onClick,
}: {
  icon: React.ReactNode; title: string; subtitle: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative', flex: '1 1 0', maxWidth: 280, minHeight: 120, textAlign: 'left', borderRadius: 14,
        padding: 16, boxSizing: 'border-box',
        border: `1px solid ${selected ? 'var(--sa-accent)' : 'var(--sa-border)'}`,
        background: selected ? 'rgba(244,122,32,.08)' : '#16110e',
        cursor: 'pointer',
      }}
    >
      {selected && (
        <span style={{
          position: 'absolute', right: 14, top: 14, width: 24, height: 24, borderRadius: '50%',
          background: 'var(--sa-accent)', color: '#1a0d00', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        >
          <IconCheck size={14} />
        </span>
      )}
      <div style={{ marginBottom: 24, color: selected ? 'var(--sa-accent)' : 'var(--sa-muted)' }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--sa-font-body)', fontSize: 15, fontWeight: 600, color: 'var(--sa-text)' }}>{title}</div>
      <div style={{ marginTop: 2, fontFamily: 'var(--sa-font-body)', fontSize: 13, color: 'var(--sa-muted)' }}>{subtitle}</div>
    </button>
  );
}
