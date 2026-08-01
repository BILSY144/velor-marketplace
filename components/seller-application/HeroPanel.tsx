'use client';

import { IconGlobe, IconTag, IconLive, IconShieldStar, IconChartUp, IconPeople, IconFingerprint, IconShieldCheck, IconHeartHand } from './icons';

const FEATURES = [
  { icon: IconGlobe, lines: ['190 Countries', 'One Marketplace'] },
  { icon: IconTag, lines: ['Free to List', 'Forever'] },
  { icon: IconLive, lines: ['Velor Live', 'Seller Access'] },
  { icon: IconShieldStar, lines: ['Founding Seller', 'Status'] },
  { icon: IconChartUp, lines: ['Pro Tools', 'To Grow'] },
];

const FOOTER = [
  { icon: IconPeople, title: 'REAL PEOPLE', sub: 'Real culture' },
  { icon: IconFingerprint, title: 'BUILT FOR CULTURE', sub: 'Not mass produced' },
  { icon: IconShieldCheck, title: 'SAFE & TRUSTED', sub: 'Secure & verified' },
  { icon: IconHeartHand, title: 'PURPOSE DRIVEN', sub: 'Trade with impact' },
];

// Rebuilt 2026-08-01, v2 -- against ChatGPT's "Implementation Specification
// v1.0" (a 25-section developer handoff produced from the actual uploaded
// design-step1.png, not a side-by-side screenshot). William's feedback on
// the v1 rebuild was blunt: "there is so much difference" -- so this time
// we sent ChatGPT the original PNG directly and asked for real section-by-
// section numbers instead of visual estimates read off a comparison image.
// Every value below cites its spec section; all are relative to the
// 1536px-wide reference canvas (design-step1.png's own width), same as v1:
//   - logo: left 42 / top 28 (section 5)
//   - globe: ~940x940, centred ~(430, 310), overflowing left/top/under the
//     form card (section 7) -- still not decoration, still the hero
//   - hero content column: max-width only 510px now (section 8), much
//     narrower than v1's 720px attempt
//   - kicker/headline/paragraph sizing, benefits row, founding-seller card
//     and footer all per their numbered sections below
// This whole block is rendered inside .seller-app-desktop-shell (see
// SellerApplication.tsx / tokens.css), which is itself position:absolute
// covering the full viewport -- so the pixel values here are relative to
// that same full-width canvas, not to some narrower flex column.
export function HeroPanel() {
  return (
    <>
      {/* Warm radial glow behind the globe -- ChatGPT's final QA pass on the
          v2 rebuild (2026-08-01) scored it 93-95% match and called out one
          remaining ambient issue: "the original has a subtle warm ambience,
          your build is fractionally cooler." This is the fix it suggested --
          a faint warm glow behind the globe/sunrise, not a layout change. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left: -200, top: -300, width: 1300, height: 1300, zIndex: 0,
          background: 'radial-gradient(circle at 55% 45%, rgba(244,122,32,.16), rgba(244,122,32,0) 60%)',
        }}
      />
      {/* The globe -- section 7: "Most important element. It is NOT
          decoration. It is the visual anchor."
          2026-08-01 correction: ChatGPT's spec (and the QA pass built on top
          of it) placed this behind/under the headline, overflowing from the
          top-left. William flagged the result as still wrong ("globes are
          different sizes... dimensions and coordinates are off") and direct
          pixel/visual inspection of design-step1.png (gridded crops, brightness
          profiling at multiple rows) proves the spec's claim was simply
          incorrect: the reference headline text ("Open your country's") sits
          in clean, globe-free black space from x=48 to ~x=635, and the globe
          only becomes visually present starting around x=420-480, growing
          brighter toward x=600-880 -- i.e. it sits BESIDE the text column,
          not behind it. Our own hero-globe.png asset (1672x941) has its
          sphere occupying the left ~55% of the image with empty space on the
          right ~45%, so it needs to be positioned with its own left edge
          landing around x=420 (not x=-117, which put the sphere itself
          directly over the headline). Sized to preserve the 1672:941 aspect
          ratio. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left: 420, top: 110, width: 1700, height: 956, zIndex: 0,
          backgroundImage: `url('/seller-application/hero-globe.png')`,
          backgroundSize: 'contain',
          backgroundPosition: 'left center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Fade -- in design-step1.png the globe reads as bright/textured only
          in the upper portion of the panel; by the founding-seats card and
          footer it's already settled back to plain black. Our source photo
          doesn't have that built-in falloff (its own bottom edge is still
          lit), so this reproduces it rather than leaving the globe lit all
          the way down behind the lower content. Repositioned in lockstep
          with the globe image above. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left: 420, top: 110, width: 1700, height: 956, zIndex: 0,
          backgroundImage: 'linear-gradient(180deg, rgba(3,3,2,0) 48%, rgba(3,3,2,.55) 66%, var(--sa-bg) 86%)',
        }}
      />

      {/* Logo -- section 5: left margin 42, top 28, width ~200-210,
          subtitle letter-spacing increased, not bold. */}
      <div style={{ position: 'absolute', left: 42, top: 28, zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontFamily: 'var(--sa-font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--sa-accent)' }}>VELOR</span>
        <span style={{ marginTop: 2, fontFamily: 'var(--sa-font-body)', fontSize: 10, fontWeight: 400, letterSpacing: '0.3em', color: 'var(--sa-muted)' }}>GLOBAL MARKETPLACE</span>
      </div>

      {/* Hero copy -- starting ~220px below the logo (28 + 220 = 248).
          2026-08-01 correction, round 2: direct pixel measurement of
          design-step1.png puts the reference's own headline text ending
          around x=635-640, which first suggested narrowing this column to
          ~600px. In practice, at the browser's actual Cormorant Garamond
          metrics (not necessarily identical to whatever serif the reference
          used), "Open your country's" needs more like 680-700px to hold one
          line at this font-size -- 600px wrapped it to 3 lines instead of the
          reference's 2. Widened back out; the column now overlaps the
          globe's own left edge (x=420) in the background the same way the
          reference's text appears to sit in front of the globe's edge rather
          than being fully clear of it. */}
      <div style={{ position: 'absolute', left: 42, top: 248, width: 'min(700px, calc(100vw - 750px))', zIndex: 1 }}>
        <p style={{ margin: 0, fontFamily: 'var(--sa-font-body)', fontSize: 16, fontWeight: 700, letterSpacing: '3px', color: 'var(--sa-accent)' }}>
          BECOME A FOUNDING SELLER
        </p>
        {/* QA pass: "increase headline size by about 2-3% and tighten the
            line height very slightly" -- 70->72px, line-height 1.02->0.98. */}
        <h1 style={{ marginTop: 24, marginBottom: 0, fontFamily: 'var(--sa-font-display)', fontSize: 'clamp(46px, 4.8vw, 72px)', fontWeight: 600, lineHeight: 0.98, letterSpacing: '-1px', color: 'var(--sa-text)' }}>
          Open your country&apos;s<br />
          <span style={{ color: 'var(--sa-hero-orange)' }}>marketplace.</span>
        </h1>
        <p style={{ marginTop: 34, marginBottom: 0, maxWidth: 540, fontFamily: 'var(--sa-font-body)', fontSize: 16, lineHeight: '34px', color: 'var(--sa-body)' }}>
          Be the first verified seller from your country on Velor and sell authentic goods to
          buyers in <span style={{ color: 'var(--sa-accent)' }}>190 countries.</span>
        </p>

        {/* Benefits row -- section 10: 5 equal columns, 112px tall, each
            ~130px, 30px icons, 17px heading line / 15px body line. */}
        <div style={{ marginTop: 42, height: 1, width: '100%', maxWidth: 700, background: 'rgba(255,255,255,.1)' }} />
        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, height: 112, maxWidth: 700 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              {/* QA pass: "increase the icon size by around 10%" -- 30->33. */}
              <f.icon size={33} color="var(--sa-accent)" style={{ marginBottom: 12 }} />
              <span style={{ fontFamily: 'var(--sa-font-body)', fontSize: 17, fontWeight: 600, lineHeight: 1.35, color: 'var(--sa-text)' }}>{f.lines[0]}</span>
              <span style={{ fontFamily: 'var(--sa-font-body)', fontSize: 15, lineHeight: 1.35, color: 'var(--sa-body)' }}>{f.lines[1]}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, height: 1, width: '100%', maxWidth: 700, background: 'rgba(255,255,255,.1)' }} />

        {/* Founding-seller card -- section 11: width 445-460, height 120,
            radius 14, border 1px solid #D69C3A, background
            rgba(15,15,15,.65) (previously had no fill, border+glow only).
            QA pass: "the original has a slightly richer gold accent --
            increase border brightness and icon brightness, not the text" --
            border/icon use a brighter gold (#e6b563) while the copy stays
            on the spec's #D69C3A. */}
        <div
          style={{
            marginTop: 28, display: 'flex', alignItems: 'center', gap: 18, width: '100%', maxWidth: 460, height: 120,
            borderRadius: 14, border: '1px solid #e6b563', background: 'rgba(15,15,15,.65)',
            padding: '20px 22px', boxSizing: 'border-box', boxShadow: '0 0 32px rgba(214,161,74,.18)',
          }}
        >
          <IconGlobe size={44} color="#e6b563" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontFamily: 'var(--sa-font-body)', fontSize: 14, fontWeight: 700, lineHeight: 1.4, letterSpacing: '0.02em', color: 'var(--sa-gold)' }}>
              BE THE FIRST FROM YOUR COUNTRY<br />190 FOUNDING SEATS. ALL STILL OPEN.
            </p>
            <p style={{ marginTop: 8, marginBottom: 0, fontFamily: 'var(--sa-font-body)', fontSize: 13, lineHeight: 1.4, color: 'var(--sa-muted)' }}>
              Once someone from your country joins, your country&apos;s market opens on Velor.
            </p>
          </div>
        </div>

        {/* Footer trust row -- section 12: 4 equal-width columns, more
            breathing room than the benefits row, 34px vertical padding,
            22px icons. Kept in normal flow after the founding-seller card
            (not pinned to the viewport bottom via position:absolute) -- a
            fixed bottom offset overlapped this same content on shorter
            viewports (900px tall laptop windows, vs. the 1024px-tall
            reference), since it doesn't know how tall the content above it
            actually is. In flow, it simply pushes the page's own scroll
            extent instead of colliding with the founding-seller card. */}
        <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', rowGap: 16, columnGap: 24, width: 'min(700px, calc(100vw - 754px))', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 34, paddingBottom: 34 }}>
          {FOOTER.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 150px', minWidth: 150 }}>
              <f.icon size={22} color="var(--sa-accent)" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontFamily: 'var(--sa-font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--sa-text)' }}>{f.title}</p>
                <p style={{ margin: 0, fontFamily: 'var(--sa-font-body)', fontSize: 11, color: 'var(--sa-muted)' }}>{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
