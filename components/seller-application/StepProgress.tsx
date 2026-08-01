'use client';

import { STEPS } from './types';
import { IconPerson, IconVase, IconBox, IconRocket } from './icons';

const STEP_ICONS = [IconPerson, IconVase, IconBox, IconRocket];

export function StepProgress({ current, onJump }: { current: number; onJump: (n: number) => void }) {
  const currentMeta = STEPS[current - 1];
  return (
    <>
      {/* Full 4-icon nav -- desktop and larger tablets (>=768px). Hidden
          below that via .seller-app-stepnav-full in tokens.css. */}
      <div className="seller-app-stepnav-full" style={{ alignItems: 'flex-start' }}>
        {STEPS.map((s, i) => {
          const Icon = STEP_ICONS[i];
          const active = s.n === current;
          const done = s.n < current;
          const emphasised = active || done;
          const tone = emphasised ? 'var(--sa-accent)' : 'var(--sa-border-light)';
          return (
            <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start' }}>
              <button
                type="button"
                onClick={() => onJump(s.n)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: 128, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span style={{
                  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 48, width: 48, borderRadius: '50%', border: `1.5px solid ${tone}`,
                  color: emphasised ? 'var(--sa-accent)' : 'var(--sa-muted)',
                }}
                >
                  <Icon size={20} />
                  <span style={{
                    position: 'absolute', right: -4, top: -4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: 20, width: 20, borderRadius: '50%', fontFamily: 'var(--sa-font-body)', fontSize: 11, fontWeight: 700,
                    background: emphasised ? 'var(--sa-accent)' : 'var(--sa-border-light)',
                    color: emphasised ? '#1a0d00' : 'var(--sa-muted)',
                  }}
                  >
                    {s.n}
                  </span>
                </span>
                <span style={{ marginTop: 8, fontFamily: 'var(--sa-font-body)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: active ? 'var(--sa-text)' : 'var(--sa-muted)' }}>
                  {s.label}
                </span>
                <span style={{ marginTop: 2, fontFamily: 'var(--sa-font-body)', fontSize: 11, lineHeight: 1.3, color: 'var(--sa-muted)' }}>{s.hint}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div style={{ marginTop: 24, height: 1, width: 20, flexShrink: 0, background: done ? 'var(--sa-accent)' : 'var(--sa-border-light)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Compact "Step X of 4" + progress bar -- phones (<768px). A
          horizontally-scrolling icon row hides future steps and reads badly
          that narrow, per ChatGPT's review (2026-08-01). Hidden at 768px+
          via .seller-app-stepnav-compact in tokens.css. */}
      <div className="seller-app-stepnav-compact">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--sa-font-body)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sa-muted)' }}>
            Step {current} of {STEPS.length}
          </span>
          <span style={{ fontFamily: 'var(--sa-font-body)', fontSize: 13, fontWeight: 700, color: 'var(--sa-text)' }}>{currentMeta.label}</span>
        </div>
        <div style={{ height: 4, width: '100%', borderRadius: 2, background: 'var(--sa-border-light)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(current / STEPS.length) * 100}%`, background: 'var(--sa-accent)', borderRadius: 2, transition: 'width .2s ease' }} />
        </div>
      </div>
    </>
  );
}
