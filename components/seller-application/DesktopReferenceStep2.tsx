'use client';

import Link from 'next/link';
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

// 2026-08-xx (William): "a lot of the images I choose for cover photo it
// gives me a message saying it's the wrong size" -- this was the flat 2MB
// raw-file-size reject below (see the removed check in addImage), and a
// normal modern phone photo is routinely 3-15MB, so most real photos a
// seller tried just got rejected outright with no way to proceed except
// hunting down a smaller file. Same fix already used for product images
// (resizeAndCompressImage in app/dashboard/products/page.tsx): instead of
// rejecting on raw file size, downscale to a sane max dimension and
// re-encode as JPEG, backing off quality until the result is comfortably
// small -- so essentially any real photo succeeds, and the seller never
// sees a size error for a normal photo. MAX_IMAGE_DATA_URL_LEN is a
// post-encoding budget (not a raw-file limit): two images this size stay
// far under the request body limit the /api/seller/apply route is subject
// to. Slightly larger than the product-image budget (400_000 vs 350_000)
// since a cover photo is wider-aspect and benefits from a bit more detail.
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

export function DesktopReferenceStep2({
  form, update, onBack, onNext, error, foundedCountryCodes,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onBack: () => void;
  onNext: () => void;
  error: string | null;
  // ISO codes that already have a claimed founding seat (see
  // getFoundedCountryCodes in lib/founding.ts), passed down from
  // app/apply/page.tsx. Optional so this still renders without it; the
  // Founding Seller Badge panel below just always offers the badge in that
  // case rather than hiding it on missing data.
  foundedCountryCodes?: string[];
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
    setImageError(null);
    try {
      const encoded = await compressImage(file);
      const next = [...form.sampleImages];
      next[index] = encoded;
      update('sampleImages', next);
    } catch (caught) {
      setImageError(caught instanceof Error ? caught.message : 'Could not read that image -- please try a different file.');
    }
  }

  function toggleCategory(value: string) {
    const exists = form.productCategories.includes(value);
    if (exists) update('productCategories', form.productCategories.filter(item => item !== value));
    else if (form.productCategories.length < MAX_CATEGORIES) update('productCategories', [...form.productCategories, value]);
  }

  // shippingCountry stores an ISO code (see types.ts); same lookup
  // FinishStep and DesktopReferenceStep4 already use to show a name instead
  // of the raw code. shippingCountry itself is now only ever set on Step 3
  // (see the removed Country/Region control below) -- it will still be ''
  // the first time a seller reaches this step, before Step 3 exists.
  const countryName = COUNTRY_OPTIONS.find(([code]) => code === form.shippingCountry)?.[1] ?? form.shippingCountry;

  // 2026-08-xx (William): "remove page 2 country and region box and text
  // completely as we already have that on page 3" -- Step 3
  // (DesktopReferenceStep3.tsx) already has a real, working shippingCountry
  // select, so the one added here earlier was a redundant second control
  // for the same field. Rather than fixing/keeping it, it's removed
  // outright (see below); what's left is only knowing whether the
  // shippingCountry already picked on Step 3 has a founder claimed for it.
  const countryAlreadyFounded = !!form.shippingCountry && (foundedCountryCodes?.includes(form.shippingCountry) ?? false);

  return (
    <div aria-label="Velor seller application, step 2 of 4" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#050505' }}>
      <div style={{ position: 'absolute', left, top, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <img src="/apply-wizard/design-step2.png" alt="" aria-hidden="true" draggable={false} style={{ position: 'absolute', inset: 0, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, userSelect: 'none', pointerEvents: 'none' }} />
        {/* William 2026-08-01: the wizard is intentionally a full-screen,
            no-header experience, but that left no way back out to the
            homepage -- the artwork's own baked "VELOR" wordmark just sits
            there as flat pixels. Measured directly (pixel-density scan of
            the orange glyphs, same technique used elsewhere in this file)
            across all four design-stepN.png files: the wordmark lockup
            occupies roughly x=33-239, y=25-122 on every step. Covered with
            a matching near-black panel (sampled background at that spot is
            pure #000 on all four images) and replaced with the site's real,
            current logo file (same asset GlobalHeader.tsx uses), wrapped in
            a home link. */}
        <div style={{ position: 'absolute', left: 20, top: 15, width: 235, height: 120, background: '#000' }} />
        <Link href="/" aria-label="Velor home" style={{ position: 'absolute', left: 40, top: 43, display: 'block' }}>
          <img src="/velor-logo-2026.png" alt="Velor — Global Marketplace" draggable={false} style={{ height: 64, width: 'auto' }} />
        </Link>


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

        {/* 2026-08-02: a real Country/Region select was added here to fix
            "country/region selection does not work". William then asked
            for it to be removed entirely since Step 3 already had its own
            country field -- done in a later pass, replaced with a plain
            cover panel painting over the artwork's baked "Country / Region"
            decoration. William's next message reversed that: he wants a
            real, working dropdown here after all, whose choice carries
            over to Step 3 and LOCKS the field there ("the seller cannot
            choose a different shipping address") -- see the read-only
            display added in DesktopReferenceStep3.tsx. So the select is
            back, this time sized to the box's true, pixel-verified bounds
            (left=468/top=432/224x48 -- see the sizing-fix commit) instead
            of the earlier 280x52 guess that overlapped the Live Preview
            card. Shares the same form.shippingCountry as Step 3, so
            picking it either place keeps both in sync. */}
        <select
          aria-label="Country / Region"
          autoComplete="country"
          value={form.shippingCountry}
          onChange={e => update('shippingCountry', e.target.value)}
          style={{ ...control, left: 468, top: 432, width: 224, height: 48, padding: '0 10px', appearance: 'auto' }}
        >
          <option value="">Select your country</option>
          {COUNTRY_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>

        {/* 2026-08-02 fix: William reported "trouble selecting my crafts".
            Two real bugs found: (1) this select's own width (220) was
            believed to be narrower than the visible box baked into the
            artwork (estimated at 280px, matching the Country/Region box
            above), so it was widened to 280 to match. (2) already-selected
            categories were never disabled in the list, so reopening the
            dropdown and clicking one you'd already picked silently REMOVED
            it (toggleCategory toggles) -- easy to do by mistake since the
            checkmark is easy to miss in a long list. Now disabled once
            selected; removal is only via the X chip below, so a click here
            can no longer undo a choice. */}
        {/* 2026-08-xx correction: the 280px width in fix (1) above was
            itself the bug William then reported ("primary categories box
            [is] overlapping the profile card area... you can see the other
            boxes behind them"). A per-pixel border scan of
            design-step2.png (same technique used to fix the Country/Region
            panel above) finds this box's true bounds are x=470-689,
            y=525-566 -- 219x41, the same width as Country/Region, not 280.
            The old 280-wide select ran 61px past the box's real right edge
            into the gap before the Live Preview column, so its rightmost
            ~60px sat over blank background and then over the edge of the
            Live Preview card -- the actual chevron/box the artwork draws
            was always within the true 219px width, so nothing is lost by
            narrowing back to it (with a small margin for full coverage). */}
        <select
          aria-label="Add a product category"
          value=""
          onChange={e => { if (e.target.value) toggleCategory(e.target.value); }}
          style={{ ...control, left: 468, top: 523, width: 224, height: 46, padding: '0 14px', appearance: 'auto' }}
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
        {/* 2026-08-xx correction: William confirmed the profile circle now
            fits, but said the cover image was "still off". The 1065 right
            edge above was itself an estimate, not a measurement -- a proper
            per-column brightness/variance scan of design-step2.png (flat,
            near-zero-variance background vs. textured photo content) puts
            the true right edge at x=1084, not 1065, i.e. a true width of
            346px, not 327px. That 19px shortfall is exactly why the cover
            photo looked like it wasn't reaching/filling its box on the
            right side. Left/top/height were already correct (738/444/192,
            re-verified the same way) and are unchanged. */}
        {form.sampleImages[1] && (
          <img src={form.sampleImages[1]} alt="Cover preview" style={{ position: 'absolute', left: 738, top: 444, width: 346, height: 192, borderRadius: 14, objectFit: 'cover' }} />
        )}
        {form.sampleImages[0] && (
          <img src={form.sampleImages[0]} alt="Profile preview" style={{ position: 'absolute', left: 757, top: 521, width: 106, height: 106, borderRadius: '50%', border: '3px solid #f2efe7', objectFit: 'cover' }} />
        )}

        {/* 2026-08-02 (William): "when a potential seller signs up and the
            country already has a founder, do we not give them the option
            to see any founder badge in the store mock up" -- the gold
            "FOUNDING SELLER" pill next to the store name in this Live
            Preview card is NOT a dynamic overlay at all -- it's baked
            directly into design-step2.png's stock-photo artwork, so it
            was rendering unconditionally for every single applicant,
            including ones whose shippingCountry already has a claimed
            founding seat (countryAlreadyFounded, computed above) and who
            will NOT actually receive this badge. That's directly
            misleading -- the mock-up promised a badge some sellers were
            never going to get. Pixel-measured the pill's exact bounds in
            design-step2.png (gold-fill detection, distinct from the
            near-black card background around it): x=866-999, y=613-635.
            Background sampled at several points just outside the pill
            (605/640/620 rows) comes back (11,11,11)-(12,12,12), matching
            the #0d0d0d already used elsewhere in this file, so a solid
            #0d0d0d panel exactly over those bounds cleanly erases the
            pill with no visible seam. Only rendered when
            countryAlreadyFounded is true -- every other applicant still
            sees the real "FOUNDING SELLER" pill exactly as designed. */}
        {countryAlreadyFounded && (
          <div style={{ position: 'absolute', left: 864, top: 610, width: 138, height: 28, background: '#0d0d0d' }} />
        )}

        {/* Live preview overlays only the user-controlled values, leaving the approved visual skin intact. */}
        <div style={{ position: 'absolute', left: 763, top: 646, width: 293, minHeight: 72, background: 'rgba(12,12,12,.94)', padding: '7px 0', boxSizing: 'border-box', color: '#f1eee8', fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 27, fontWeight: 600 }}>
          {form.businessName || 'Your Store Name'}
          <div style={{ marginTop: 7, color: '#c8c2b8', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 400 }}>{countryName || 'Country name'}</div>
        </div>
        {/* 2026-08-xx (William): "store description goes off screen in the
            profile card if the seller chooses a description over a certain
            amount of words. It should all be in view" -- this box's
            overflow:hidden simply cut off (invisibly) any text past ~3
            lines, and the textarea above allows up to 500 characters, far
            more than 3 lines fits at this font size. The artwork isn't
            editable, so this box can't just grow -- a per-pixel scan of
            design-step2.png finds baked icon-row content (the "Crafted
            with care / Authentic & original / Ships worldwide" row)
            starting at y~825, only 72px below this box's top (753), which
            is the hard ceiling before growing the box would start
            overlapping that row. Switched hidden overflow to a scrollable
            region within that same footprint instead, so a long
            description is always fully reachable by scrolling the preview
            rather than silently truncated with no way to see the rest. */}
        <div style={{ position: 'absolute', left: 763, top: 753, width: 292, height: 68, overflowY: 'auto', background: 'rgba(12,12,12,.96)', color: '#d7d2ca', font: '14px/1.55 Inter, sans-serif', paddingTop: 4 }}>
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
        {/* 2026-08-xx (William): "if the country has a founder all ready
            the founder badge should not be available for that seller
            application" -- a country's founding seat is a single unique
            claim (CountryFounder.countryCode is unique, see
            grantCountryFounderIfFirst in lib/founding.ts), so once
            someone from a country holds it, this panel must stop
            promising the badge to later applicants from the same country.
            shippingCountry is only known once Step 3 has been visited (it
            isn't collected on this step anymore -- see the removed
            Country/Region control above), so this only ever flips to the
            "claimed" state when a seller comes back to edit Step 2 (from
            Finish) after already filling in Step 3; on a first pass through
            with no country yet, it falls back to still offering the badge
            rather than assuming it's unavailable. */}
        {/* 2026-08-01 correction (William): "top right is the founders
            badge and text. it is not alligned with the other badges and
            the text is too long so it overfolws the border. and you can
            see a different colour background behing badge and text" --
            three separate bugs, all traced back to this box's guessed
            geometry via a pixel-gridded scan of design-step2.png:
            1) Background seam: the card's true interior background here
               is (14,14,14)/#0e0e0e (the existing #0d0d0d was already
               correct, within 1 unit), but this box's bounds
               (left:1108, width:410 -> spans x1108-1518) OVERFLOW the
               card's real edges. Edge-detection (biggest brightness jump
               at y=220/320/420/520/620/720) puts the true interior at
               x~1117 to x~1506 -- past x1506 and before x1117 is the pure
               black OUTER page background, so the old box was painting
               #0d0d0d over that black margin, which is exactly the
               "different colour background" seam. Narrowed to the real
               card bounds (left:1117, width:389) so the fill never
               touches the outer background.
            2) Icon misalignment: the sibling perk icons ("First from your
               country", "Velor Live access", "Free to list", "Smart
               tools", "Seller support") are small flat glyphs (not
               bordered rings) whose horizontal centres cluster tightly
               around x~1172-1176 in every row, measured via orange-pixel
               bounding boxes. This box's 74px bordered icon, flush against
               the box's left edge with no left padding, centred at
               ~1108+37=1145 -- ~27-31px left of the siblings. Added
               paddingLeft:20 (interior left edge 1117+20=1137, icon centre
               1137+37=1174) to land on the same shared centreline.
            3) Text overflow: sibling rows' text columns run up to
               ~264-265px wide before hitting the card's right edge. This
               box's text had no width cap at all, so it kept running past
               the card border. With the box narrowed to 389px and 20px of
               padding on each side, the text column after the icon+gap has
               ~253px available -- capped it explicitly (width 253,
               boxSizing border-box) to match the sibling convention and
               guarantee it wraps inside the card instead of overflowing. */}
        <div style={{ position: 'absolute', left: 1117, top: 328, width: 389, height: 102, background: '#0d0d0d', display: 'flex', alignItems: 'flex-start', gap: 22, paddingLeft: 20, paddingRight: 20, boxSizing: 'border-box' }}>
          <div style={{ width: 74, height: 74, borderRadius: '50%', border: `1.5px solid ${countryAlreadyFounded ? '#5a5a5a' : '#f47a20'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconShieldStar size={32} color={countryAlreadyFounded ? '#6b6b6b' : '#f47a20'} />
          </div>
          <div style={{ paddingTop: 6, width: 253, boxSizing: 'border-box' }}>
            <div style={{ color: countryAlreadyFounded ? '#9a9a9a' : '#f2efe7', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 5 }}>
              {countryAlreadyFounded ? 'Founding Badge Already Claimed' : 'Founding Seller Badge'}
            </div>
            <div style={{ color: '#8f8f8f', fontFamily: 'Inter, sans-serif', fontSize: 13.5, lineHeight: 1.45 }}>
              {countryAlreadyFounded
                ? `Another seller from ${countryName || 'your country'} already holds this badge.`
                : 'Permanent status, shown proudly on your store.'}
            </div>
          </div>
        </div>

        {error && <div role="alert" style={{ position: 'absolute', left: 292, top: 905, width: 500, color: '#ff9a82', font: '12px Inter, sans-serif', textAlign: 'center' }}>{error}</div>}
        <button type="button" onClick={onBack} aria-label="Back to About You" style={{ position: 'absolute', left: 47, top: 955, width: 180, height: 44, background: 'transparent', border: 0, cursor: 'pointer' }} />
        <button type="button" onClick={onNext} aria-label="Continue to Shipping" style={{ position: 'absolute', left: 1126, top: 948, width: 380, height: 46, background: 'transparent', border: 0, cursor: 'pointer' }} />
      </div>
    </div>
  );
}
