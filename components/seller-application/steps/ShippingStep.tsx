'use client';

import { Field, fieldStyle } from '../FormField';
import { PrimaryButton } from '../PrimaryButton';
import { COUNTRY_OPTIONS, FormState } from '../types';

export function ShippingStep({ form, update, onBack, onNext }: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p style={{ margin: 0, color: 'var(--sa-accent)', font: '700 12px var(--sa-font-body)', letterSpacing: '.14em' }}>SHIPPING INFORMATION</p>
      <h2 style={{ margin: '8px 0 0', color: 'var(--sa-text)', font: '600 38px/1.05 var(--sa-font-display)' }}>Where your parcels begin.</h2>
      <p style={{ color: 'var(--sa-muted)', font: '14px/1.55 var(--sa-font-body)' }}>Add the real address from which your goods will normally be dispatched.</p>
      <div style={{ display: 'grid', gap: 18, marginTop: 26 }}>
        <Field label="Full name" required><input style={fieldStyle} value={form.shippingName} onChange={e => update('shippingName', e.target.value)} autoComplete="name" /></Field>
        <Field label="Company" hint="Optional"><input style={fieldStyle} value={form.shippingCompany} onChange={e => update('shippingCompany', e.target.value)} autoComplete="organization" /></Field>
        <Field label="Phone number"><input style={fieldStyle} value={form.shippingPhone} onChange={e => update('shippingPhone', e.target.value)} autoComplete="tel" /></Field>
        <Field label="Address line 1" required><input style={fieldStyle} value={form.shippingStreet1} onChange={e => update('shippingStreet1', e.target.value)} autoComplete="address-line1" /></Field>
        <Field label="Address line 2"><input style={fieldStyle} value={form.shippingStreet2} onChange={e => update('shippingStreet2', e.target.value)} autoComplete="address-line2" /></Field>
        <Field label="City / Town" required><input style={fieldStyle} value={form.shippingCity} onChange={e => update('shippingCity', e.target.value)} autoComplete="address-level2" /></Field>
        <Field label="State / Region"><input style={fieldStyle} value={form.shippingState} onChange={e => update('shippingState', e.target.value)} autoComplete="address-level1" /></Field>
        <Field label="Postcode / ZIP" required><input style={fieldStyle} value={form.shippingZip} onChange={e => update('shippingZip', e.target.value)} autoComplete="postal-code" /></Field>
        <Field label="Country" required>
          <select style={fieldStyle} value={form.shippingCountry} onChange={e => update('shippingCountry', e.target.value)} autoComplete="country"><option value="">Select country</option>{COUNTRY_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select>
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <button type="button" onClick={onBack} style={{ flex: 1, minHeight: 52, border: '1px solid var(--sa-border)', borderRadius: 10, background: 'transparent', color: 'var(--sa-text)' }}>Back</button>
        <div style={{ flex: 2 }}><PrimaryButton onClick={onNext}>Continue to Finish</PrimaryButton></div>
      </div>
    </div>
  );
}
