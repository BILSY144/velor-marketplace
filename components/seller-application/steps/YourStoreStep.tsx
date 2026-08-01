'use client';

import { useRef, useState } from 'react';
import { Field, fieldStyle } from '../FormField';
import { PrimaryButton } from '../PrimaryButton';
import { COUNTRY_OPTIONS, FormState, MAX_CATEGORIES, PRODUCT_CATEGORY_OPTIONS } from '../types';

// 2026-08-xx: same fix as the desktop shell's DesktopReferenceStep2.tsx --
// William reported real photos routinely getting rejected with a size
// error (a normal phone photo is often 3-15MB, well past the flat 2MB raw
// cap this used to enforce, see the removed checks in addFiles below).
// Downscale + re-encode as JPEG instead of hard-rejecting, same approach
// already used for product images (resizeAndCompressImage in
// app/dashboard/products/page.tsx), so real photos succeed instead of
// bouncing off a size limit.
const MAX_IMAGE_DIMENSION = 1600;
const MAX_IMAGE_DATA_URL_LEN = 400_000;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const scale = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Could not process that image.')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > MAX_IMAGE_DATA_URL_LEN && quality > 0.35) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        if (dataUrl.length > MAX_IMAGE_DATA_URL_LEN) {
          reject(new Error('This image is still too large even after compression -- please try a different photo.'));
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.src = String(reader.result ?? '');
    };
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
  // 2026-08-01 fix: this used to be ONE shared file input (`imageInput`) with
  // a single `addFiles` handler that REPLACED the entire form.sampleImages
  // array with whatever was picked in that one dialog -- so a seller had to
  // multi-select both photos in a single native picker action to get both a
  // profile AND a cover image. Mobile photo pickers overwhelmingly default
  // to single-selection (or make multi-select non-obvious), so a mobile
  // seller picking their profile photo, then coming back to pick a cover
  // photo, silently WIPED the profile photo they'd already chosen -- every
  // second pick just replaced index 0, since a single-file selection always
  // lands there. Reported by William: "as a new seller I can only upload a
  // profile image, there isn't an option to upload a cover image." Root
  // cause confirmed by comparing against the desktop shell
  // (DesktopReferenceStep2.tsx), which already had this right: two SEPARATE
  // inputs/buttons, each independently writing its own index via
  // `addImage(file, index)` (`next[index] = encoded`, preserving the other
  // slot) rather than replacing the whole array. Mirrored that pattern here.
  const profileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  // 2026-08-02 fix: same root cause as the desktop Step 2 fix -- a file that
  // failed the type/size check here was silently dropped from the accepted
  // list with no feedback, so choosing a normal (often >2MB) phone photo
  // just did nothing and looked broken. Now the rejected files are named.
  const [imageError, setImageError] = useState<string | null>(null);

  function toggleCategory(category: string) {
    if (form.productCategories.includes(category)) update('productCategories', form.productCategories.filter(item => item !== category));
    else if (form.productCategories.length < MAX_CATEGORIES) update('productCategories', [...form.productCategories, category]);
  }

  async function addImage(file: File | undefined, index: number) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError(`"${file.name}" isn't an image file. Please choose a JPG, PNG or WebP.`);
      return;
    }
    setImageError(null);
    try {
      const encoded = await compressImage(file);
      // Merge into the existing array at this index only -- never replace
      // the whole array, or picking one photo wipes the other (see the
      // fix note above).
      const next = [...form.sampleImages];
      next[index] = encoded;
      update('sampleImages', next);
    } catch (caught) {
      setImageError(caught instanceof Error ? caught.message : 'Could not read that image -- please try a different file.');
    }
  }

  // shippingCountry stores an ISO code (see types.ts) -- match the same
  // display-name lookup used on the desktop shell's Live Preview card.
  const countryName = COUNTRY_OPTIONS.find(([code]) => code === form.shippingCountry)?.[1] ?? form.shippingCountry;

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
        <Field label="Store images" required hint="Upload a profile photo and a cover photo -- large photos are resized automatically. Profile is required; cover is optional but recommended.">
          <input ref={profileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void addImage(e.target.files?.[0], 0)} style={{ display: 'none' }} />
          <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void addImage(e.target.files?.[0], 1)} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => profileInput.current?.click()} style={{ flex: 1, minHeight: 110, border: '1px dashed var(--sa-accent)', borderRadius: 12, background: '#0d0d0d', color: 'var(--sa-muted)', font: '13px var(--sa-font-body)', overflow: 'hidden', position: 'relative', padding: 0 }}>
              {form.sampleImages[0] ? <img src={form.sampleImages[0]} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Choose profile photo'}
            </button>
            <button type="button" onClick={() => coverInput.current?.click()} style={{ flex: 1, minHeight: 110, border: '1px dashed var(--sa-accent)', borderRadius: 12, background: '#0d0d0d', color: 'var(--sa-muted)', font: '13px var(--sa-font-body)', overflow: 'hidden', position: 'relative', padding: 0 }}>
              {form.sampleImages[1] ? <img src={form.sampleImages[1]} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Choose cover photo'}
            </button>
          </div>
          {imageError && <div role="alert" style={{ marginTop: 8, color: '#ff9a82', font: '12px/1.4 var(--sa-font-body)' }}>{imageError}</div>}
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
              <div style={{ marginTop: 2, color: 'var(--sa-muted)', font: '12px var(--sa-font-body)' }}>{countryName || 'Country name'}</div>
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
