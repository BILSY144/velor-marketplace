'use client';

import { useRef, useState } from 'react';
import { Field, fieldStyle } from '../FormField';
import { PrimaryButton } from '../PrimaryButton';
import { FormState, MAX_CATEGORIES, PRODUCT_CATEGORY_OPTIONS } from '../types';

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

export function YourStoreStep({ form, update, onBack, onNext }: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const imageInput = useRef<HTMLInputElement>(null);
  // 2026-08-02 fix: same root cause as the desktop Step 2 fix -- a file that
  // failed the type/size check here was silently dropped from the accepted
  // list with no feedback, so choosing a normal (often >2MB) phone photo
  // just did nothing and looked broken. Now the rejected files are named.
  const [imageError, setImageError] = useState<string | null>(null);

  function toggleCategory(category: string) {
    if (form.productCategories.includes(category)) update('productCategories', form.productCategories.filter(item => item !== category));
    else if (form.productCategories.length < MAX_CATEGORIES) update('productCategories', [...form.productCategories, category]);
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const all = Array.from(files).slice(0, 2);
    const rejected = all.filter(file => !file.type.startsWith('image/') || file.size > 2 * 1024 * 1024);
    const accepted = all.filter(file => file.type.startsWith('image/') && file.size <= 2 * 1024 * 1024);
    setImageError(rejected.length
      ? rejected.map(file => !file.type.startsWith('image/')
        ? `"${file.name}" isn't an image file.`
        : `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB -- the limit is 2MB.`).join(' ')
      : null);
    if (accepted.length) update('sampleImages', await Promise.all(accepted.map(readImage)));
  }

  return (
    <div>
      <p style={{ margin: 0, color: 'var(--sa-accent)', font: '700 12px var(--sa-font-body)', letterSpacing: '.14em' }}>TELL THE WORLD YOUR STORY</p>
      <h2 style={{ margin: '8px 0 0', color: 'var(--sa-text)', font: '600 38px/1.05 var(--sa-font-display)' }}>Show the world what makes <span style={{ color: 'var(--sa-accent)' }}>your craft</span> special.</h2>
      <p style={{ color: 'var(--sa-muted)', font: '14px/1.55 var(--sa-font-body)' }}>Buyers connect with real stories. Share what you make, how it is made and what makes it meaningful.</p>

      <div style={{ display: 'grid', gap: 20, marginTop: 26 }}>
        <Field label="Store description" required hint={`${form.storeDescription.length} / 500 characters`}>
          <textarea value={form.storeDescription} maxLength={500} onChange={e => update('storeDescription', e.target.value)} style={{ ...fieldStyle, minHeight: 130, height: 130, paddingTop: 14, resize: 'vertical' }} placeholder="Tell your story, your craft and what makes your products unique…" />
        </Field>
        <Field label="Your website" hint="Optional — a website or social profile buyers can visit.">
          <input value={form.website} onChange={e => update('website', e.target.value)} style={fieldStyle} placeholder="yourwebsite.com" />
        </Field>
        <Field label="Primary categories" required hint="Choose up to three categories.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRODUCT_CATEGORY_OPTIONS.map(category => {
              const selected = form.productCategories.includes(category);
              return <button key={category} type="button" onClick={() => toggleCategory(category)} disabled={!selected && form.productCategories.length >= MAX_CATEGORIES} style={{ border: `1px solid ${selected ? 'var(--sa-accent)' : 'var(--sa-border)'}`, borderRadius: 18, background: selected ? '#21130d' : '#101010', color: selected ? '#f4eee7' : 'var(--sa-muted)', padding: '8px 11px', font: '12px var(--sa-font-body)' }}>{category}</button>;
            })}
          </div>
        </Field>
        <Field label="Store images" required hint="Upload up to two JPG, PNG or WebP images, maximum 2MB each.">
          <input ref={imageInput} type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e => void addFiles(e.target.files)} style={{ display: 'none' }} />
          <button type="button" onClick={() => imageInput.current?.click()} style={{ width: '100%', minHeight: 110, border: '1px dashed var(--sa-accent)', borderRadius: 12, background: '#0d0d0d', color: 'var(--sa-muted)', font: '14px var(--sa-font-body)' }}>Choose profile and cover images</button>
          {imageError && <div role="alert" style={{ marginTop: 8, color: '#ff9a82', font: '12px/1.4 var(--sa-font-body)' }}>{imageError}</div>}
          {form.sampleImages.filter(Boolean).length > 0 && <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>{form.sampleImages.filter(Boolean).map((src, i) => <img key={i} src={src} alt={`Selected store image ${i + 1}`} style={{ width: 90, height: 70, objectFit: 'cover', borderRadius: 8 }} />)}</div>}
        </Field>

        {/* 2026-08-02: William reported the profile/cover photos never
            showing in "the preview box" -- true for this shell too, and
            worse here: this compact mobile/tablet layout (shown on any
            viewport under the 1365.98px breakpoint in tokens.css -- most
            laptop windows that aren't maximized) never had a preview card
            at all, only the small thumbnail chips above. The desktop shell
            got a Live Preview card wired up to real photos (see
            DesktopReferenceStep2.tsx), but anyone under that breakpoint
            never saw it. Adding the same live preview here, in normal flow
            (no baked artwork on this shell, so no pixel-measured overlay --
            just a plain card), so it isn't tied to viewport width. */}
        <Field label="Live preview" hint="This is how your store will appear to buyers.">
          <div style={{ maxWidth: 360, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--sa-border)', background: '#0d0d0d' }}>
            <div style={{ position: 'relative', height: 120, background: form.sampleImages[1] ? `center/cover no-repeat url(${form.sampleImages[1]})` : 'linear-gradient(135deg,#1a1a1a,#0d0d0d)' }}>
              <div style={{ position: 'absolute', left: 16, bottom: -32, width: 64, height: 64, borderRadius: '50%', border: '3px solid #0d0d0d', overflow: 'hidden', background: '#1a1a1a' }}>
                {form.sampleImages[0] && <img src={form.sampleImages[0]} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
            </div>
            <div style={{ padding: '40px 16px 16px' }}>
              <div style={{ color: 'var(--sa-text)', font: '600 18px var(--sa-font-display)' }}>{form.businessName || 'Your Store Name'}</div>
              <div style={{ marginTop: 2, color: 'var(--sa-muted)', font: '12px var(--sa-font-body)' }}>{form.shippingCountry || 'Country name'}</div>
              <div style={{ marginTop: 8, color: 'var(--sa-muted)', font: '13px/1.5 var(--sa-font-body)' }}>{form.storeDescription || 'Your story and what makes your craft special will appear here.'}</div>
            </div>
          </div>
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <button type="button" onClick={onBack} style={{ flex: 1, minHeight: 52, border: '1px solid var(--sa-border)', borderRadius: 10, background: 'transparent', color: 'var(--sa-text)' }}>Back</button>
        <div style={{ flex: 2 }}><PrimaryButton onClick={onNext}>Continue to Shipping</PrimaryButton></div>
      </div>
    </div>
  );
}
