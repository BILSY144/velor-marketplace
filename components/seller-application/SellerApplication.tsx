'use client';

import { useEffect, useState } from 'react';
import './tokens.css';
import { FormState, initialForm } from './types';
import { StepProgress } from './StepProgress';
import { AboutYouStep } from './steps/AboutYouStep';
import { YourStoreStep } from './steps/YourStoreStep';
import { ShippingStep } from './steps/ShippingStep';
import { FinishStep } from './steps/FinishStep';
import { DesktopReferenceStep1 } from './DesktopReferenceStep1';
import { DesktopReferenceStep2 } from './DesktopReferenceStep2';
import { DesktopReferenceStep3 } from './DesktopReferenceStep3';
import { DesktopReferenceStep4 } from './DesktopReferenceStep4';
import { IconGlobe } from './icons';

export default function SellerApplication() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prospectId = params.get('prospectId') || params.get('prospect') || '';
    if (prospectId) setForm(prev => ({ ...prev, prospectId }));
  }, []);

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

  function validateStep2(): string | null {
    if (form.storeDescription.trim().length < 20) return 'Please add at least 20 characters describing your store and goods.';
    if (form.productCategories.length === 0) return 'Please choose at least one product category.';
    if (form.website.trim() && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(form.website.trim())) return 'Please enter a valid website address.';
    if (form.sampleImages.filter(Boolean).length === 0) return 'Please upload at least one store image.';
    return null;
  }

  function validateStep3(): string | null {
    if (!form.shippingName.trim()) return 'Shipping full name is required.';
    if (!form.shippingStreet1.trim()) return 'Address line 1 is required.';
    if (!form.shippingCity.trim()) return 'City or town is required.';
    if (!form.shippingZip.trim()) return 'Postcode or ZIP is required.';
    if (!form.shippingCountry.trim()) return 'Shipping country is required.';
    return null;
  }

  function goNext() {
    const validation = step === 1 ? validateStep1() : step === 2 ? validateStep2() : step === 3 ? validateStep3() : null;
    if (validation) { setError(validation); return; }
    setError(null);
    setStep(current => Math.min(4, current + 1));
  }

  function goBack() {
    setError(null);
    setStep(current => Math.max(1, current - 1));
  }

  function jumpTo(target: number) {
    setError(null);
    setStep(Math.max(1, Math.min(4, target)));
  }

  async function submitApplication() {
    const errors = validateStep1() || validateStep2() || validateStep3();
    if (errors) { setError(errors); return; }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/seller/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerType: form.sellerType,
          businessName: form.businessName.trim(),
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim(),
          password: form.password,
          storeDescription: form.storeDescription.trim(),
          website: form.website.trim(),
          productCategories: form.productCategories,
          sampleImages: form.sampleImages.filter(Boolean),
          prospectId: form.prospectId || null,
          shippingName: form.shippingName.trim(),
          shippingCompany: form.shippingCompany.trim(),
          shippingStreet1: form.shippingStreet1.trim(),
          shippingStreet2: form.shippingStreet2.trim(),
          shippingCity: form.shippingCity.trim(),
          shippingState: form.shippingState.trim(),
          shippingZip: form.shippingZip.trim(),
          shippingCountry: form.shippingCountry,
          shippingPhone: form.shippingPhone.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Seller application could not be submitted.');
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Seller application could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  }

  const mobileStep = (
    <>
      {error && <div role="alert" style={{ marginBottom: 20, borderRadius: 9, border: '1px solid rgba(220,60,40,.4)', background: 'rgba(220,60,40,.1)', padding: '10px 14px', fontFamily: 'var(--sa-font-body)', fontSize: 14, color: '#ff9d8a' }}>{error}</div>}
      {step === 1 && <AboutYouStep form={form} update={update} onNext={goNext} submitting={submitting} />}
      {step === 2 && <YourStoreStep form={form} update={update} onBack={goBack} onNext={goNext} />}
      {step === 3 && <ShippingStep form={form} update={update} onBack={goBack} onNext={goNext} />}
      {step === 4 && <FinishStep form={form} onBack={goBack} onEdit={jumpTo} onSubmit={submitApplication} submitting={submitting} submitted={submitted} />}
    </>
  );

  return (
    <div className="seller-app" style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--sa-bg-gradient)' }}>
      <div className="seller-app-desktop-shell">
        {step === 1 && <DesktopReferenceStep1 form={form} update={update} onNext={goNext} error={error} />}
        {step === 2 && <DesktopReferenceStep2 form={form} update={update} onBack={goBack} onNext={goNext} error={error} />}
        {step === 3 && <DesktopReferenceStep3 form={form} update={update} onBack={goBack} onNext={goNext} error={error} />}
        {step === 4 && <DesktopReferenceStep4 form={form} onBack={goBack} onEdit={jumpTo} onSubmit={submitApplication} error={error} submitting={submitting} submitted={submitted} />}
      </div>

      <div className="seller-app-mobile-shell" style={{ height: '100%', overflowY: 'auto', padding: 24, boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--sa-font-display)', fontSize: 24, fontWeight: 700, color: 'var(--sa-accent)' }}>VELOR</span>
            <span style={{ fontFamily: 'var(--sa-font-body)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--sa-muted)' }}>GLOBAL MARKETPLACE</span>
          </div>
          <p style={{ marginTop: 16, marginBottom: 6, fontFamily: 'var(--sa-font-body)', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--sa-accent)' }}>BECOME A FOUNDING SELLER</p>
          <h1 style={{ margin: 0, fontFamily: 'var(--sa-font-display)', fontSize: 30, fontWeight: 600, lineHeight: 1.1, color: 'var(--sa-text)' }}>Open your country&apos;s <span style={{ color: 'var(--sa-accent)' }}>marketplace.</span></h1>
          <p style={{ marginTop: 8, fontFamily: 'var(--sa-font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--sa-muted)' }}>Be the first verified seller from your country and sell to buyers in <span style={{ color: 'var(--sa-accent)' }}>190 countries.</span></p>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start', borderRadius: 10, border: '1px solid var(--sa-gold)', padding: '10px 12px' }}>
            <IconGlobe size={20} color="var(--sa-gold)" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontFamily: 'var(--sa-font-body)', fontSize: 12, lineHeight: 1.4, color: 'var(--sa-gold)' }}><strong>190 founding seats. All still open.</strong> Be the first from your country.</p>
          </div>
        </div>
        <div style={{ marginBottom: 28 }}><StepProgress current={step} onJump={n => n < step && jumpTo(n)} /></div>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>{mobileStep}</div>
      </div>
    </div>
  );
}
