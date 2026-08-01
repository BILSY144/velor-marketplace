'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRY_OPTIONS, FormState, MAX_CATEGORIES, PRODUCT_CATEGORY_OPTIONS } from './types';
import { IconShieldStar } from './icons';

const DESIGN_WIDTH = 1536;
const DESIGN_HEIGHT = 1024;

const control: React.CSSProperties = {
  position: 'absolute',
  borderRadius: 7,
  border: '1px solid rgba(255,255,255,.13)',
  background: '#0d0d0d',
  color: '#f2efe7',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

export function DesktopReferenceStep2({
  form, update, onBack, onNext, error,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onBack: () => void;
  onNext: () => void;
  error: string | null;
}) {
  const [viewport, setViewport] = useState({ width: DESIGN_WIDTH, height: DESIGN_HEIGHT });
  const profileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  // 2026-08-02 fix: William reported "image uploads not working that great" --
  // addImage previously rejected an oversized or wrong-type file with a bare
  // `return`, so a seller picking a normal phone photo (routinely 3-8MB) saw
  // nothing happen at all, with zero explanation. Local-only state (doesn't
  // touch the parent's shared `error`, which is reserved for step validation
  // on Continue) so a rejected file gets an actual, specific message.
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const scale = useMemo(() => Math.min(viewport.width / DESIGN_WIDTH, viewport.height / DESIGN_HEIGHT), [viewport]);
  const left = Math.max(0, (viewport.width - DESIGN_WIDTH * scale) / 2);
  const top = Math.max(0, (viewport.height - DESIGN_HEIGHT * scale) / 2);

  async function addImage(file: File | undefined, index: number) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError(`"${file.name}" isn't an image file. Please choose a JPG, PNG or WebP.`);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError(`"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB -- the limit is 2MB. Try a smaller photo, or compress it first.`);
      return;
    }
    setImageError(null);
    try {
      const encoded = await readImage(file);
      const next = [...form.sampleImages];
      next[index] = encoded;
      update('sampleImages', next);
    } catch {
      setImageError('Could not read that image -- please try a different file.');
    }
  }

  function toggleCategory(value: string) {
    const exists = form.productCategories.includes(value);
    if (exists) update('productCategories', form.productCategories.filter(item => item !== value));
    else if (form.productCategories.length < MAX_CATEGORIES) update('productCategories', [...form.productCategories, value]);
  }

  // shippingCountry stores an ISO code (see types.ts) -- now that this
  // field is a real, visible select on this step (see the fix below), show
  // the country name here instead of the raw code, same lookup FinishStep
  // and DesktopReferenceStep4 already use.
  const countryName = COUNTRY_OPTIONS.find(([code]) => code === form.shippingCountry)?.[1] ?? form.shippingCountry;

  return (
    <div aria-label="Velor seller application, step 2 of 4" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#050505' }}>
      <div style={{ position: 'absolute', left, top, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <img src="/apply-wizard/design-step2.png" alt="" aria-hidden="true" draggable={false} style={{ position: 'absolute', inset: 0, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, userSelect: 'none', pointerEvents: 'none' }} />

        <textarea
          aria-label="Store description"
          value={form.storeDescription}
          maxLength={500}
          onChange={e => update('storeDescription', e.target.value)}
          placeholder="Tell your story, your craft, your journey and what makes your products unique..."
          style={{ ...control, left: 47, top: 435, width: 397, height: 105, padding: '13px 14px', resize: 'none', lineHeight: 1.55 }}
        />
        <div aria-live="polite" style={{ position: 'absolute', left: 395, top: 551, width: 50, textAlign: 'right', font: '12px Inter, sans-serif', color: '#8d8d8d' }}>{form.storeDescription.length} / 500</div>

        <input
          aria-label="Website, optional"
          value={form.website}
          onChange={e => update('website', e.target.value)}
          placeholder="yourwebsite.com"
          style={{ ...control, left: 47, top: 625, width: 393, height: 40, padding: '0 14px' }}
        />

        {/* 2026-08-02 fix: William reported "country/region selection does
            not work". Root cause: this box was baked into design-step2.png
            as pure decoration -- "Country / Region", the globe icon and
            "Select your country" are all pixels in the artwork, with no
            real control ever layered on top of them, so clicking it could
            never do anything. Bounds pixel-measured directly from
            design-step2.png (canvas getImageData grid crop): the box runs
            x=470-750, y=438-490. Wired to the same form.shippingCountry
            used on Step 3, so picking it here also pre-fills Step 3 (and
            vice versa) instead of asking twice. */}
        <select
          aria-label="Country / Region"
          autoComplete="country"
          value={form.shippingCountry}
          onChange={e => update('shippingCountry', e.target.value)}
          style={{ ...control, left: 470, top: 438, width: 280, height: 52, padding: '0 14px', appearance: 'auto' }}
        >
          <option value="">Select your country</option>
          {COUNTRY_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>

        {/* 2026-08-02 fix: William reported "trouble selecting my crafts".
            Two real bugs found: (1) this select's own width (220) was
            narrower than the visible box baked into the artwork (measured
            at 280px wide -- same width as the Country/Region box directly
            above), so clicking the right ~60px of the box, including the
            dropdown chevron the artwork draws there, hit nothing. Widened
            to match. (2) already-selected categories were never disabled
            in the list, so reopening the dropdown and clicking one you'd
            already picked silently REMOVED it (toggleCategory toggles) --
            easy to do by mistake since the checkmark is easy to miss in a
            long list. Now disabled once selected; removal is only via the
            X chip below, so a click here can no longer undo a choice. */}
        <select
          aria-label="Add a product category"
          value=""
          onChange={e => { if (e.target.value) toggleCategory(e.target.value); }}
          style={{ ...control, left: 470, top: 526, width: 280, height: 42, padding: '0 14px', appearance: 'auto' }}
        >
          <option value="">{form.productCategories.length ? `${form.productCategories.length} selected` : 'Select up to 3 categories'}</option>
          {PRODUCT_CATEGORY_OPTIONS.map(category => <option key={category} value={category} disabled={form.productCategories.includes(category) || form.productCategories.length >= MAX_CATEGORIES}>{form.productCategories.includes(category) ? `✓ ${category}` : category}</option>)}
        </select>

        {form.productCategories.length > 0 && (
          <div style={{ position: 'absolute', left: 470, top: 574, width: 220, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {form.productCategories.map(category => (
              <button key={category} type="button" onClick={() => toggleCategory(category)} title={`Remove ${category}`} style={{ border: '1px solid rgba(244,122,32,.5)', borderRadius: 12, background: '#17110d', color: '#d9d2c9', padding: '3px 7px', font: '10px Inter, sans-serif', cursor: 'pointer' }}>{category} ×</button>
            ))}
          </div>
        )}

        {/* 2026-08-02 fix: these thumbnails used to render the chosen photo
            at opacity .78/.82 directly over the button, with nothing behind
            it but the baked design-step2.png artwork's own "Upload profile
            photo / JPG, PNG or WebP. Max 2MB" placeholder text at that same
            screen position -- so a real uploaded photo showed through at
            ~20-22% weaker than the baked text, reading as a messy overlap
            rather than a clean "photo selected" state (this is what William
            flagged as uploads "not working that great"). A solid backing
            div at opacity 1, THEN the photo at full opacity on top, fully
            covers the placeholder text once a file is chosen. */}
        <input ref={profileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload profile photo" onChange={e => void addImage(e.target.files?.[0], 0)} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
        <button type="button" onClick={() => profileInput.current?.click()} aria-label="Choose profile photo" style={{ position: 'absolute', left: 47, top: 746, width: 219, height: 146, border: 0, borderRadius: 7, background: form.sampleImages[0] ? '#0d0d0d' : 'transparent', cursor: 'pointer', overflow: 'hidden' }}>
          {form.sampleImages[0] && <img src={form.sampleImages[0]} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </button>

        <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload cover photo" onChange={e => void addImage(e.target.files?.[0], 1)} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
        <button type="button" onClick={() => coverInput.current?.click()} aria-label="Choose cover photo" style={{ position: 'absolute', left: 293, top: 746, width: 397, height: 146, border: 0, borderRadius: 7, background: form.sampleImages[1] ? '#0d0d0d' : 'transparent', cursor: 'pointer', overflow: 'hidden' }}>
          {form.sampleImages[1] && <img src={form.sampleImages[1]} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </button>
        {imageError && (
          <div role="alert" style={{ position: 'absolute', left: 47, top: 897, width: 643, color: '#ff9a82', font: '12px Inter, sans-serif', lineHeight: 1.4 }}>{imageError}</div>
        )}

        {/* 2026-08-02 fix: William reported the profile/cover photos never
            showing in this Live Preview card -- confirmed true. This block
            previously only overlaid TEXT (name/country/description); the
            card's cover-photo rectangle and circular avatar were always the
            baked stock photo from design-step2.png, never wired to
            form.sampleImages at all. Falls back to the baked stock photo
            when no image is chosen yet, same as the artwork's own
            placeholder intent. */}
        {/* 2026-08-02 correction: William then reported "the cover photo
            blocks the profile circle" and "profile image does not load at
            all" once both were live. Root cause: my first pass measured
            the wrong box entirely -- a plain brightness scan can't find an
            edge between two overlapping PHOTOS (both bright, both
            textured), so left=763/top=428/294x172 and a 180px circle were
            estimates, not measurements, and put a circle nearly twice the
            true size 47px too high, burying most of it inside the cover
            photo instead of sitting mostly below it -- with real photos
            (not the flat test colours used to verify the first fix) that
            reads as "the cover is covering the profile" / "profile isn't
            there". Re-measured properly this time by finding the avatar's
            own white ring (a sharp near-white spike against the photo,
            unlike a brightness-only scan): ring left/right at x=759/862,
            top/bottom at y=521/627 -- a ~106px circle, not 180px. Cover
            rectangle edges (background-to-photo transitions, unambiguous)
            are x=738-1065, y=444-636, with a rounded-rect corner radius
            matching the artwork's own (~14px). */}
        {form.sampleImages[1] && (
          <img src={form.sampleImages[1]} alt="Cover preview" style={{ position: 'absolute', left: 738, top: 444, width: 327, height: 192, borderRadius: 14, objectFit: 'cover' }} />
        )}
        {form.sampleImages[0] && (
          <img src={form.sampleImages[0]} alt="Profile preview" style={{ position: 'absolute', left: 757, top: 521, width: 106, height: 106, borderRadius: '50%', border: '3px solid #f2efe7', objectFit: 'cover' }} />
        )}

        {/* Live preview overlays only the user-controlled values, leaving the approved visual skin intact. */}
        <div style={{ position: 'absolute', left: 763, top: 646, width: 293, minHeight: 72, background: 'rgba(12,12,12,.94)', padding: '7px 0', boxSizing: 'border-box', color: '#f1eee8', fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 27, fontWeight: 600 }}>
          {form.businessName || 'Your Store Name'}
          <div style={{ marginTop: 7, color: '#c8c2b8', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400 }}>{countryName || 'Country name'}</div>
        </div>
        <div style={{ position: 'absolute', left: 763, top: 753, width: 292, height: 55, overflow: 'hidden', background: 'rgba(12,12,12,.96)', color: '#d7d2ca', font: '14px/1.55 Inter, sans-serif', paddingTop: 4 }}>
          {form.storeDescription || 'Your story and what makes your craft special will appear here.'}
        </div>

        {/* The approved artwork's "WHY SELL ON VELOR?" list included a
            "Pro, free for life -- worth £49/month" perk. The self-serve Pro
            tier was retired for a flat 10% commission for everyone (see
            app/dashboard/upgrade/pro/page.tsx and the "Retire self-serve
            Pro tier" commit) -- founding sellers now get a permanent badge
            + priority placement instead of a waived subscription, so
            there's no paid tier left to describe as "free". Painted over
            with the actual current founding perk instead of leaving stale
            pricing live on screen. Bounds measured directly from
            design-step2.png (this bullet's icon+title+subtext block only,
            pixel-checked against the "First from your country" bullet
            above it and "Velor Live access" below it so neither is
            clipped). Icon/copy here are a placeholder pending an updated
            design pass -- flagged to William as such. Coordinates verified
            against a pixel-gridded render of design-step2.png (the icon
            column centres at x~1160 with an ~80px circle, not the ~1080/56
            first guess -- a quick local Playwright screenshot caught the
            mismatch before this shipped). */}
        <div style={{ position: 'absolute', left: 1108, top: 328, width: 410, height: 102, background: '#0d0d0d', display: 'flex', alignItems: 'flex-start', gap: 22 }}>
          <div style={{ width: 74, height: 74, borderRadius: '50%', border: '1.5px solid #f47a20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconShieldStar size={32} color="#f47a20" />
          </div>
          <div style={{ paddingTop: 6 }}>
            <div style={{ color: '#f2efe7', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 5 }}>Founding Seller Badge</div>
            <div style={{ color: '#8f8f8f', fontFamily: 'Inter, sans-serif', fontSize: 13.5, lineHeight: 1.45 }}>Permanent status, shown proudly on your store.</div>
          </div>
        </div>

        {error && <div role="alert" style={{ position: 'absolute', left: 292, top: 905, width: 500, color: '#ff9a82', font: '12px Inter, sans-serif', textAlign: 'center' }}>{error}</div>}
        <button type="button" onClick={onBack} aria-label="Back to About You" style={{ position: 'absolute', left: 47, top: 955, width: 180, height: 44, background: 'transparent', border: 0, cursor: 'pointer' }} />
        <button type="button" onClick={onNext} aria-label="Continue to Shipping" style={{ position: 'absolute', left: 1126, top: 948, width: 380, height: 46, background: 'transparent', border: 0, cursor: 'pointer' }} />
      </div>
    </div>
  );
}
