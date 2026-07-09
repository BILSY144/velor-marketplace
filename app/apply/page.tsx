'use client';

// Seller application — the general application form. Outreach emails no
// longer link straight here: they go to /apply/invited first (a
// congratulations page naming the founding perks), which then sends the
// seller on to this form with ?country=XX&invited=1 so the country field
// below arrives pre-filled. Read via window.location.search (not
// useSearchParams) so this stays a plain client component with no Suspense
// boundary required.
//
// The form logic, fields and POST /api/seller/apply submission are unchanged
// from the previous version — only the presentation moved.
//
// Language rule (standing): the first seller "opens" a country and is
// "credited as the seller who opened it" — never "claims", "owns", "is yours".

import { useEffect, useState } from 'react';

import { CATEGORY_NAMES as CATEGORIES } from '@/lib/categories';
import { WORLD_COUNTRIES } from '@/lib/worldCountries';

type FormState = {
  businessName: string;
  contactName: string;
  contactEmail: string;
  website: string;
  country: string;
  storeDescription: string;
  productCategories: string[];
};

const initialForm: FormState = {
  businessName: '',
  contactName: '',
  contactEmail: '',
  website: '',
  country: '',
  storeDescription: '',
  productCategories: [],
};

const css = `
.ap-page{min-height:100vh;background:var(--bg);color:var(--text);font-family:var(--font-body);position:relative}
.ap-page::before{content:'';position:fixed;top:-320px;left:50%;transform:translateX(-50%);width:900px;height:520px;background:radial-gradient(50% 50% at 50% 50%, rgba(255,107,0,.07) 0%, rgba(255,107,0,0) 100%);pointer-events:none}
.ap-wrap{max-width:1100px;margin:0 auto;padding:0 24px;position:relative}
.ap-hero{padding:64px 0 40px;display:grid;grid-template-columns:1.1fr .9fr;gap:52px;align-items:end}
.ap-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:18px;font-weight:600}
.ap-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.ap-h1{font-family:var(--font-display);font-size:46px;line-height:1.06;margin:0 0 16px;font-weight:500;letter-spacing:-0.02em;max-width:15ch}
.ap-lede{font-size:16.5px;color:var(--muted);line-height:1.62;max-width:50ch;margin:0}
.ap-perkbox{border:1px solid rgba(255,107,0,.3);border-radius:16px;padding:24px 26px;background:var(--surface)}
.ap-perkbox .lbl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:14px}
.ap-perkbox ul{list-style:none;display:grid;gap:11px;margin:0;padding:0}
.ap-perkbox li{display:flex;gap:10px;font-size:13.5px;line-height:1.5}
.ap-perkbox i{color:var(--green);font-style:normal;flex:0 0 auto}
.ap-perkbox b{font-weight:600}
.ap-trust{display:flex;gap:22px;font-size:13px;color:var(--muted);flex-wrap:wrap;padding:20px 0 34px;border-bottom:1px solid var(--border);margin-bottom:44px}
.ap-trust i{color:var(--green);font-style:normal;margin-right:6px}
.ap-formgrid{display:grid;grid-template-columns:1fr;gap:0;max-width:760px;margin:0 auto;padding-bottom:90px}
.ap-sec{position:relative;padding:36px 0 34px;border-top:1px solid var(--border)}
.ap-sec:first-child{border-top:0;padding-top:0}
.ap-bignum{position:absolute;right:0;top:26px;font-family:var(--font-display);font-size:64px;font-weight:700;line-height:1;color:transparent;-webkit-text-stroke:1px #26262d;user-select:none;pointer-events:none}
.ap-steplbl{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:9px}
.ap-h2{font-family:var(--font-display);font-size:21px;margin:0 0 6px;font-weight:500}
.ap-sub{font-size:13.5px;color:var(--muted);line-height:1.6;margin:0 0 24px;max-width:58ch}
.ap-label{display:block;font-size:13px;font-weight:500;margin-bottom:8px}
.ap-req{color:var(--accent);margin-left:2px}
.ap-field{margin-bottom:18px}
.ap-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ap-input,.ap-textarea,.ap-select{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:15px;font-family:inherit;padding:13px 15px;outline:none;box-sizing:border-box;transition:border-color .15s, box-shadow .15s}
.ap-input:focus,.ap-textarea:focus,.ap-select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(255,107,0,.14)}
.ap-input::placeholder,.ap-textarea::placeholder{color:#6b6b76}
.ap-textarea{min-height:120px;resize:vertical;line-height:1.6}
.ap-select{appearance:none;cursor:pointer;background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),linear-gradient(135deg,var(--muted) 50%,transparent 50%);background-position:calc(100% - 21px) 50%,calc(100% - 16px) 50%;background-size:5px 5px;background-repeat:no-repeat}
.ap-cats{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.ap-cat{border:1px solid var(--border);border-radius:999px;padding:8px 15px;font-size:13px;color:var(--muted);cursor:pointer;background:var(--surface);font-family:inherit;transition:all .13s}
.ap-cat:hover{color:var(--text);transform:translateY(-1px)}
.ap-cat.on{border-color:var(--accent);color:var(--text);background:rgba(255,107,0,.1);font-weight:500}
.ap-submit{width:100%;border-radius:12px;padding:16px 0;font-size:15.5px;font-weight:600;border:0;cursor:pointer;font-family:inherit;background:var(--accent);color:#160a00;transition:opacity .2s;margin-top:6px}
.ap-submit:disabled{opacity:.4;cursor:not-allowed}
.ap-legal{font-size:12px;color:var(--muted);text-align:center;margin-top:16px;line-height:1.6}
.ap-legal a{color:var(--accent);text-decoration:none}
.ap-error{border:1px solid rgba(226,75,74,.4);border-radius:12px;background:rgba(226,75,74,.06);color:var(--text);font-size:14px;padding:14px 16px;margin-bottom:20px}
.ap-success{max-width:640px;margin:80px auto;border:1px solid rgba(46,204,113,.32);border-radius:18px;background:var(--surface);padding:46px 44px;text-align:center}
.ap-success h2{font-family:var(--font-display);font-size:26px;margin:0 0 12px;font-weight:500}
.ap-success p{color:var(--muted);font-size:15px;line-height:1.7;margin:0 0 22px}
.ap-ref{background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--accent);font-family:monospace;font-size:13px;padding:10px 16px;display:inline-block}
@media(max-width:900px){.ap-hero{grid-template-columns:1fr;gap:30px;padding:40px 0 26px}.ap-h1{font-size:33px}.ap-row{grid-template-columns:1fr}.ap-bignum{display:none}}
`;

export default function ApplyPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Prefill country when arriving from /apply/invited?country=XX.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('country') || '').toUpperCase();
    if (code && WORLD_COUNTRIES.some(c => c.code === code)) {
      setForm(prev => ({ ...prev, country: code }));
    }
  }, []);

  function setField(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleCategory(cat: string) {
    setForm(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(cat)
        ? prev.productCategories.filter(c => c !== cat)
        : [...prev.productCategories, cat],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.businessName.trim() || !form.contactName.trim() || !form.contactEmail.trim()) {
      setError('Business name, contact name, and email are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');
      setApplicationId(data.applicationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (applicationId) {
    return (
      <div className="ap-page">
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="ap-wrap">
          <div className="ap-success">
            <h2>Application received.</h2>
            <p>
              Next: check your email for an identity verification link — every Velor seller
              verifies a government ID through Stripe before their store opens, and Velor never
              sees or stores the document. You will have our decision within 24 hours of your
              verification completing.
            </p>
            <div className="ap-ref">Reference: {applicationId}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-page">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ap-wrap">
        <div className="ap-hero">
          <div>
            <div className="ap-eyebrow"><span className="ap-dot" /> Founding sellers &middot; buyers arrive 6 August</div>
            <h1 className="ap-h1">Be the first from your country.</h1>
            <p className="ap-lede">
              Velor is the world&apos;s shopping channel — sellers broadcast live and sell in the
              stream, while their listings sell around the clock. The country and the maker stay
              on every listing, and whoever arrives first from each of the world&apos;s 190
              countries keeps something no seller after them can ever earn.
            </p>
          </div>
          <div className="ap-perkbox">
            <div className="lbl">What the first seller keeps</div>
            <ul>
              <li><i>&#10003;</i><span><b>Pro, free for life.</b> Never charged, for as long as the subscription runs unbroken.</span></li>
              <li><i>&#10003;</i><span><b>The founding badge.</b> Permanent, on your store and every listing.</span></li>
              <li><i>&#10003;</i><span><b>The first store on your country&apos;s page.</b> Front and centre until others arrive &mdash; credited as the seller who opened it, always.</span></li>
              <li><i>&#10003;</i><span><b>Live broadcasting, for life.</b> Go on air on Velor Live and sell in the stream &mdash; access no standard subscription includes. Plus the showreel slot: your film, on the homepage.</span></li>
            </ul>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '16px 0 0', lineHeight: 1.5 }}>
              Perks unlock once your first product is listed and live.
            </p>
          </div>
        </div>

        <div className="ap-trust">
          <span><i>&#10003;</i>Free to list &mdash; no listing fees, ever</span>
          <span><i>&#10003;</i>Decision within 24 hours of your identity verification completing</span>
          <span><i>&#10003;</i>Sell and get support in your own language</span>
          <span><i>&#10003;</i>Buyers pay into escrow &mdash; so they buy with confidence</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ap-formgrid">
            {error && <div className="ap-error">{error}</div>}

            <div className="ap-sec">
              <div className="ap-bignum">01</div>
              <div className="ap-steplbl">Your business</div>
              <h2 className="ap-h2">Who are you?</h2>
              <p className="ap-sub">Real details only &mdash; every application is reviewed, and every seller verifies a government ID before their store opens.</p>

              <div className="ap-field">
                <label className="ap-label">Business name <span className="ap-req">*</span></label>
                <input className="ap-input" type="text" value={form.businessName}
                  onChange={e => setField('businessName', e.target.value)}
                  placeholder="Your company or brand name" required />
              </div>

              <div className="ap-row">
                <div className="ap-field">
                  <label className="ap-label">Contact name <span className="ap-req">*</span></label>
                  <input className="ap-input" type="text" value={form.contactName}
                    onChange={e => setField('contactName', e.target.value)}
                    placeholder="Full name" required />
                </div>
                <div className="ap-field">
                  <label className="ap-label">Contact email <span className="ap-req">*</span></label>
                  <input className="ap-input" type="email" value={form.contactEmail}
                    onChange={e => setField('contactEmail', e.target.value)}
                    placeholder="you@company.com" required />
                </div>
              </div>

              <div className="ap-row">
                <div className="ap-field">
                  <label className="ap-label">Website or store link</label>
                  <input className="ap-input" type="url" value={form.website}
                    onChange={e => setField('website', e.target.value)}
                    placeholder="https://yourstore.com" />
                </div>
                <div className="ap-field">
                  <label className="ap-label">Country</label>
                  <select className="ap-select" value={form.country}
                    onChange={e => setField('country', e.target.value)}>
                    <option value="">Select country</option>
                    {WORLD_COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="ap-sec">
              <div className="ap-bignum">02</div>
              <div className="ap-steplbl">Your store</div>
              <h2 className="ap-h2">What do you make or sell?</h2>
              <p className="ap-sub">Tell us in your own words &mdash; what you sell, where it comes from, and what makes it worth crossing a border for.</p>

              <div className="ap-field">
                <label className="ap-label">Store description</label>
                <textarea className="ap-textarea" value={form.storeDescription}
                  onChange={e => setField('storeDescription', e.target.value)}
                  placeholder="What you sell, how it is made, and why buyers should care..." />
              </div>

              <div className="ap-field">
                <label className="ap-label">Product categories</label>
                <div className="ap-cats">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button"
                      className={'ap-cat' + (form.productCategories.includes(cat) ? ' on' : '')}
                      onClick={() => toggleCategory(cat)}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button className="ap-submit" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Apply to sell'}
            </button>

            <p className="ap-legal">
              By submitting this application you agree to the{' '}
              <a href="/legal/seller-agreement">Seller Agreement</a>{' '}and the{' '}
              <a href="/legal/seller-rules">Seller Rules and Product Compliance Policy</a>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
