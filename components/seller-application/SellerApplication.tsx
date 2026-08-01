'use client';

// Real React/TypeScript recreation of William's 4-step founding-seller
// wizard (design-step1..4.png), built directly inside the production
// Next.js app -- per the plan agreed with William and ChatGPT (2026-08-01):
// ChatGPT is Creative Director (design spec, tokens, copy, build order),
// this recreates it as real, typed, responsive components rather than a
// standalone vanilla-HTML prototype or an image-background overlay, and
// posts straight to the real /api/seller/apply endpoint that already works
// (Prisma + Resend), not a stub -- see app/api/seller/apply/route.ts for the
// exact payload shape every field name below matches.
//
// Styling: inline style objects, matching this codebase's actual existing
// convention (SellerForm.tsx, the prior version of this page, etc.) --
// Tailwind is listed in package.json/tailwind.config.ts but was never wired
// into globals.css (no @tailwind directive), so its utility classes are
// silent no-ops here.
//
// Layout rebuilt 2026-08-01: William compared the first build directly
// against design-step1.png (pixel-for-pixel, both rendered at the same
// 1536x1024) and flagged that the *composition* had drifted -- not just
// individual colours -- and specifically that the globe was "wrong and
// barely visible." Went back to ChatGPT with that exact screenshot; its
// diagnosis: this page is NOT two flush, equal-height panels. It's a single
// full-bleed dark canvas where the globe is the dominant background image
// (not a corner accent), and the step nav + form card FLOAT over it as
// separate, absolutely-positioned elements -- the step nav "belongs to the
// page, not the form," and the card is an inset, rounded, floating panel,
// not a flush column. That structure only makes sense at desktop widths, so
// it lives in .seller-app-desktop-shell (see tokens.css), with a completely
// separate, normal-flow .seller-app-mobile-shell for <1024px (condensed
// hero, compact step indicator, then the form, all stacked) -- same split
// point and reasoning as the previous build, just implemented as two
// sibling shells instead of one flex row, since the desktop shell's
// absolute positioning doesn't collapse into a usable mobile layout the way
// a flex-basis change would have.
import { useState } from 'react';
import './tokens.css';
import { FormState, initialForm } from './types';
import { StepProgress } from './StepProgress';
import { AboutYouStep } from './steps/AboutYouStep';
import { HeroPanel } from './HeroPanel';
import { DesktopReferenceStep1 } from './DesktopReferenceStep1';
import { IconGlobe } from './icons';

export default function SellerApplication() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function validateStep1(): string | null {
    if (form.sellerType !== 'individual' && form.sellerType !== 'business') return 'Please choose how you are selling.';
    if (!form.businessName.trim()) return 'Store name is required.';
    if (!form.contactName.trim()) return 'Your full name is required.';
    if (!form.contactEmail.trim() || !/^\S+@\S+\.\S+$/.test(form.contactEmail)) return 'A valid email address is required.';
    if (form.password.length < 8) return 'Your password must be at least 8 characters.';
    return null;
  }

  function goNext() {
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    }
    setError(null);
    setStep(s => Math.min(4, s + 1));
  }

  const stepBody = (
    <>
      {error && (
        <div style={{ marginBottom: 20, borderRadius: 9, border: '1px solid rgba(220,60,40,.4)', background: 'rgba(220,60,40,.1)', padding: '10px 14px', fontFamily: 'var(--sa-font-body)', fontSize: 14, color: '#ff9d8a' }}>
          {error}
        </div>
      )}
      {step === 1 && (
        <AboutYouStep form={form} update={update} onNext={goNext} submitting={submitting} />
      )}
      {step > 1 && (
        <div style={{ padding: '64px 0', textAlign: 'center', fontFamily: 'var(--sa-font-body)', color: 'var(--sa-muted)' }}>
          Step {step} is being built next, exactly like Step 1 -- real design tokens, real
          components, following ChatGPT&apos;s brief -- once you&apos;ve signed off on this one.
        </div>
      )}
    </>
  );

  return (
    <div className="seller-app" style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--sa-bg-gradient)' }}>
      {/* Desktop/tablet (>=1024px): full-bleed canvas, globe + hero copy in
          normal flow (all positioned by HeroPanel itself), step nav and
          form card floating on top as separate absolutely-positioned
          elements -- see tokens.css and the file header above for why. */}
      <div className="seller-app-desktop-shell">
        {step === 1 ? (
          <DesktopReferenceStep1 form={form} update={update} onNext={goNext} error={error} />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}><HeroPanel /></div>
            <div style={{ position: 'absolute', top: 40, right: 46, width: 540, zIndex: 1 }}>
              <StepProgress current={step} onJump={n => n < step && setStep(n)} />
            </div>
            <div style={{ position: 'absolute', top: 150, right: 46, bottom: 44, width: 650, zIndex: 1, borderRadius: 20, border: '1px solid rgba(255,255,255,.05)', background: '#0e0e0e', boxShadow: '0 20px 50px rgba(0,0,0,.32)', padding: 48, boxSizing: 'border-box', overflowY: 'auto' }}>
              <div style={{ maxWidth: 560 }}>{stepBody}</div>
            </div>
          </>
        )}
      </div>

      {/* Mobile/tablet (<1024px): normal stacked flow, no floating card, no
          full globe -- condensed hero pitch, compact step indicator, then
          the form. */}
      <div className="seller-app-mobile-shell" style={{ height: '100%', overflowY: 'auto', padding: 32, boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--sa-font-display)', fontSize: 24, fontWeight: 700, color: 'var(--sa-accent)' }}>VELOR</span>
            <span style={{ fontFamily: 'var(--sa-font-body)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--sa-muted)' }}>GLOBAL MARKETPLACE</span>
          </div>
          <p style={{ marginTop: 16, marginBottom: 6, fontFamily: 'var(--sa-font-body)', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--sa-accent)' }}>
            BECOME A FOUNDING SELLER
          </p>
          <h1 style={{ margin: 0, fontFamily: 'var(--sa-font-display)', fontSize: 30, fontWeight: 600, lineHeight: 1.1, color: 'var(--sa-text)' }}>
            Open your country&apos;s <span style={{ color: 'var(--sa-accent)' }}>marketplace.</span>
          </h1>
          <p style={{ marginTop: 8, fontFamily: 'var(--sa-font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--sa-muted)' }}>
            Be the first verified seller from your country and sell to buyers in{' '}
            <span style={{ color: 'var(--sa-accent)' }}>190 countries.</span>
          </p>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start', borderRadius: 10, border: '1px solid var(--sa-gold)', padding: '10px 12px' }}>
            <IconGlobe size={20} color="var(--sa-gold)" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontFamily: 'var(--sa-font-body)', fontSize: 12, lineHeight: 1.4, color: 'var(--sa-gold)' }}>
              <strong>190 founding seats. All still open.</strong> Be the first from your country.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 36, overflowX: 'auto' }}>
          <StepProgress current={step} onJump={n => n < step && setStep(n)} />
        </div>

        <div style={{ maxWidth: 560 }}>{stepBody}</div>
      </div>
    </div>
  );
}
