'use client';

// /apply/invited — the landing page the outreach email CTA links to.
// Separate from /apply on purpose: sellers who were personally found and
// emailed see a congratulations page naming their founding perks before the
// standard application form, rather than landing on the same page every
// organic /sell visitor sees. Continuing here carries the country code
// through to /apply so the country field arrives pre-filled.

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { WORLD_COUNTRIES } from '@/lib/worldCountries';

const css = `
.iv-page{min-height:100vh;background:var(--bg);color:var(--text);font-family:var(--font-body);position:relative;display:flex;align-items:center}
.iv-page::before{content:'';position:fixed;top:-320px;left:50%;transform:translateX(-50%);width:900px;height:520px;background:radial-gradient(50% 50% at 50% 50%, rgba(255,107,0,.09) 0%, rgba(255,107,0,0) 100%);pointer-events:none}
.iv-wrap{max-width:640px;margin:0 auto;padding:64px 24px;position:relative}
.iv-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;font-weight:600}
.iv-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.iv-h1{font-family:var(--font-display);font-size:38px;line-height:1.12;margin:0 0 16px;font-weight:500;letter-spacing:-0.02em}
.iv-lede{font-size:16px;color:var(--muted);line-height:1.65;margin:0 0 36px;max-width:52ch}
.iv-perkbox{border:1px solid rgba(255,107,0,.3);border-radius:16px;padding:26px 28px;background:var(--surface);margin-bottom:34px}
.iv-perkbox .lbl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:16px}
.iv-perkbox ul{list-style:none;display:grid;gap:13px;margin:0;padding:0}
.iv-perkbox li{display:flex;gap:10px;font-size:14px;line-height:1.55}
.iv-perkbox i{color:var(--green);font-style:normal;flex:0 0 auto}
.iv-perkbox b{font-weight:600}
.iv-cta{display:inline-block;background:var(--accent);color:#160a00;border:0;border-radius:12px;padding:16px 34px;font-size:15px;font-weight:700;text-decoration:none}
.iv-note{font-size:13px;color:var(--muted);margin-top:16px}
@media(max-width:640px){.iv-h1{font-size:29px}}
`;

function InvitedContent() {
  const params = useSearchParams();
  const countryCode = (params.get('country') || '').toUpperCase();
  const country = WORLD_COUNTRIES.find(c => c.code === countryCode);
  const applyHref = countryCode ? `/apply?country=${countryCode}&invited=1` : '/apply?invited=1';

  return (
    <div className="iv-page">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="iv-wrap">
        <div className="iv-eyebrow"><span className="iv-dot" /> Congratulations &middot; you were personally invited</div>
        <h1 className="iv-h1">
          {country ? `You could be the first seller from ${country.name}.` : 'You could be a founding seller.'}
        </h1>
        <p className="iv-lede">
          We looked at what you make and chose to invite you directly &mdash; this page is only
          for sellers we reach out to, not the general application. Continue below, get approved,
          and list your first product to lock these perks in.
        </p>

        <div className="iv-perkbox">
          <div className="lbl">What you keep, as a founding seller</div>
          <ul>
            <li><i>&#10003;</i><span><b>Pro, free for life.</b> Never charged, for as long as the subscription runs unbroken.</span></li>
            <li><i>&#10003;</i><span><b>The founding badge.</b> Permanent, on your store and every listing.</span></li>
            <li><i>&#10003;</i><span>{country ? <><b>The first store on {country.name}&apos;s page.</b> Front and centre until others arrive &mdash; credited as the seller who opened it, always.</> : <><b>The first store on your country&apos;s page.</b> Front and centre until others arrive &mdash; credited as the seller who opened it, always.</>}</span></li>
            <li><i>&#10003;</i><span><b>Every Pro benefit, free, for life.</b> Unlimited listings, Go Live broadcasting, your dedicated AI account manager &mdash; the full paid tier, never billed.</span></li>
          </ul>
        </div>

        <p className="iv-note" style={{ marginTop: 0, marginBottom: 22 }}>
          These perks unlock once you list your first product &mdash; being approved isn&apos;t enough on its own.
        </p>

        <Link href={applyHref} className="iv-cta">Continue to your application &rarr;</Link>
        <p className="iv-note">Takes about 3 minutes. Free to list, no fees until you sell.</p>
      </div>
    </div>
  );
}

export default function InvitedPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--text)', padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>Loading...</div>}>
      <InvitedContent />
    </Suspense>
  );
}
