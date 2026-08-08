'use client';

import { useState } from 'react';
import { COUNTRY_OPTIONS, FormState } from '../types';

export function FinishStep({ form, onBack, onEdit, onSubmit, submitting, submitted }: {
  form: FormState;
  onBack: () => void;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitted: boolean;
}) {
  const [accepted, setAccepted] = useState(false);
  const country = COUNTRY_OPTIONS.find(([code]) => code === form.shippingCountry)?.[1] ?? form.shippingCountry;
  if (submitted) return <div style={{ textAlign: 'center', color: 'var(--sa-text)' }}><h2 style={{ font: '600 40px var(--sa-font-display)' }}>You&apos;re almost there.</h2><p style={{ color: 'var(--sa-muted)' }}>Your seller application has been received.</p><a href="/dashboard" style={{ display: 'block', marginTop: 28, borderRadius: 10, background: 'var(--sa-accent)', padding: 16, color: '#160a00', fontWeight: 700 }}>Go to Seller Dashboard</a></div>;

  const section = (title: string, text: React.ReactNode, step: number) => <div style={{ position: 'relative', borderBottom: '1px solid var(--sa-border)', padding: '16px 90px 16px 0' }}><strong style={{ display: 'block', color: 'var(--sa-text)' }}>{title}</strong><div style={{ marginTop: 6, color: 'var(--sa-muted)', lineHeight: 1.5 }}>{text}</div><button type="button" onClick={() => onEdit(step)} style={{ position: 'absolute', right: 0, top: 18, border: '1px solid var(--sa-border)', borderRadius: 7, background: '#111', color: 'var(--sa-text)', padding: '7px 12px' }}>Edit</button></div>;

  return <div><p style={{ margin: 0, color: 'var(--sa-accent)', fontWeight: 700 }}>READY TO LAUNCH</p><h2 style={{ margin: '8px 0', color: 'var(--sa-text)', font: '600 40px/1.05 var(--sa-font-display)' }}>Review and launch <span style={{ color: 'var(--sa-accent)' }}>your store.</span></h2>{section('About You', <>{form.contactName}<br />{form.contactEmail}</>, 1)}{section('Your Store', <>{form.businessName}<br />{form.storeDescription}<br />{form.productCategories.join(', ')}</>, 2)}{section('Shipping', <>{form.shippingStreet1}, {form.shippingCity}, {form.shippingZip}, {country}<br />{form.shippingPhone}</>, 3)}<label style={{ display: 'flex', gap: 10, marginTop: 22, color: 'var(--sa-muted)', lineHeight: 1.5 }}><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ accentColor: 'var(--sa-accent)' }} />I confirm the information is accurate and agree to Velor&apos;s Seller Agreement, Seller Rules and Product Compliance Policy.</label><button type="button" disabled={!accepted || submitting} onClick={onSubmit} style={{ width: '100%', minHeight: 56, marginTop: 22, border: 0, borderRadius: 10, background: accepted ? 'var(--sa-accent)' : '#643217', color: '#140900', fontWeight: 700 }}>{submitting ? 'Submitting…' : 'Submit Seller Application'}</button><button type="button" onClick={onBack} style={{ width: '100%', marginTop: 12, border: '1px solid var(--sa-border)', borderRadius: 10, background: 'transparent', color: 'var(--sa-text)', padding: 14 }}>Back to Shipping</button></div>;
}
