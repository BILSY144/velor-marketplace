'use client';

import { useState } from 'react';
import { FormState } from '../types';
import { Field, fieldStyle } from '../FormField';
import { SelectionCard } from '../SelectionCard';
import { PrimaryButton } from '../PrimaryButton';
import { IconPerson, IconBriefcase, IconGlobe, IconLock, IconEye, IconEyeOff } from '../icons';

export function AboutYouStep({
  form, update, onNext, submitting,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onNext: () => void;
  submitting: boolean;
}) {
  const [showPw, setShowPw] = useState(false);

  return (
    <div>
      {/* Section 14 of ChatGPT's spec claimed 60px/600 Cormorant Garamond --
          direct pixel measurement of design-step1.png (2026-08-01, brightness-
          profiling the title's own text row) puts its bounding box at
          y=199-234, only 35px tall, implying an actual font-size closer to
          40-45px, not 60. Clamped so it still scales down cleanly on the
          mobile shell. */}
      <h2 style={{ margin: 0, fontFamily: 'var(--sa-font-display)', fontSize: 'clamp(30px, 3.2vw, 42px)', fontWeight: 600, lineHeight: 1.1, color: 'var(--sa-text)' }}>
        Let&apos;s start with you.
      </h2>
      <p style={{ marginTop: 12, fontFamily: 'var(--sa-font-body)', fontSize: 15, color: 'var(--sa-muted)' }}>
        Create your seller account in minutes.
      </p>

      {/* QA pass on the v2 rebuild: "increase vertical spacing between form
          elements" -- 24->28. */}
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <Field label="How are you selling?" required>
          <div style={{ marginTop: 4, display: 'flex', gap: 16 }}>
            <SelectionCard
              icon={<IconPerson size={24} />}
              title="As an individual"
              subtitle="I sell on my own"
              selected={form.sellerType === 'individual'}
              onClick={() => update('sellerType', 'individual')}
            />
            <SelectionCard
              icon={<IconBriefcase size={24} />}
              title="As a registered business"
              subtitle="I represent a business"
              selected={form.sellerType === 'business'}
              onClick={() => update('sellerType', 'business')}
            />
          </div>
        </Field>

        <div className="seller-app-2col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Store name" required>
              <input
                style={fieldStyle}
                placeholder="e.g. Ahmed's Pottery"
                value={form.businessName}
                onChange={e => update('businessName', e.target.value)}
              />
            </Field>
            <Field label="Your full name" required>
              <input
                style={fieldStyle}
                placeholder="e.g. Ahmed Khan"
                value={form.contactName}
                onChange={e => update('contactName', e.target.value)}
              />
            </Field>
          </div>
          {/* Section 18: information card is 300x160, radius 14, border
              #D69C3A. */}
          <div style={{ alignSelf: 'flex-start', width: '100%', maxWidth: 300, minHeight: 160, boxSizing: 'border-box', display: 'flex', gap: 12, borderRadius: 14, border: '1px solid var(--sa-gold)', padding: 16 }}>
            <IconGlobe size={28} color="var(--sa-gold)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontFamily: 'var(--sa-font-body)', fontSize: 13, fontWeight: 700, color: 'var(--sa-gold)' }}>Why your country matters</p>
              <p style={{ marginTop: 4, fontFamily: 'var(--sa-font-body)', fontSize: 13, lineHeight: 1.4, color: 'var(--sa-muted)' }}>
                The first verified seller from each country opens that country&apos;s market on Velor.
              </p>
              <p style={{ marginTop: 6, fontFamily: 'var(--sa-font-body)', fontSize: 13, fontWeight: 600, color: 'var(--sa-gold)' }}>
                Be the pioneer. Be seen. Be global.
              </p>
            </div>
          </div>
        </div>

        <Field label="Email address" required>
          <input
            type="email"
            style={fieldStyle}
            placeholder="you@email.com"
            value={form.contactEmail}
            onChange={e => update('contactEmail', e.target.value)}
          />
        </Field>

        <div className="seller-app-2col">
          <Field label="Create a password" required>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                style={{ ...fieldStyle, paddingRight: 44 }}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={e => update('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--sa-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                {showPw ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>
          </Field>
          {/* Section 19: privacy notice -- 18px lock icon, grey #A9A9A9,
              15px body. */}
          <div style={{ alignSelf: 'center', paddingTop: 24, display: 'flex', gap: 8 }}>
            <IconLock size={18} color="#a9a9a9" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ margin: 0, fontFamily: 'var(--sa-font-body)', fontSize: 15, lineHeight: 1.4, color: '#a9a9a9' }}>
              We&apos;ll never share your information. Your data is safe with us.
            </p>
          </div>
        </div>

        <PrimaryButton onClick={onNext} loading={submitting}>Continue to Your Store</PrimaryButton>

        {/* Section 21: sign-in row is 15px, grey #CFCFCF, with only "Sign
            in" itself in orange. */}
        <p style={{ textAlign: 'center', fontFamily: 'var(--sa-font-body)', fontSize: 15, color: 'var(--sa-body)' }}>
          Already have an account?{' '}
          <a href="/auth/sign-in" style={{ fontWeight: 600, color: 'var(--sa-accent)' }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
