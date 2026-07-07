'use client';

import { useState } from 'react';

import { CATEGORY_NAMES as CATEGORIES } from '@/lib/categories';

const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany',
  'France', 'Italy', 'Spain', 'Netherlands', 'Japan', 'South Korea',
  'China', 'India', 'Brazil', 'Other',
];

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

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0D0D0D',
    color: '#F5F5F5',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: '48px 16px',
  },
  container: {
    maxWidth: '680px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '48px',
  },
  logo: {
    display: 'inline-block',
    background: '#FF6B00',
    color: '#FFF',
    fontWeight: 800,
    fontSize: '18px',
    letterSpacing: '0.1em',
    padding: '8px 20px',
    marginBottom: '32px',
  },
  h1: {
    fontSize: '32px',
    fontWeight: 700,
    margin: '0 0 12px',
    color: '#FFFFFF',
  },
  subtitle: {
    color: '#999',
    fontSize: '16px',
    margin: 0,
    lineHeight: 1.6,
  },
  card: {
    background: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '40px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#FF6B00',
    marginBottom: '24px',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#CCC',
    marginBottom: '8px',
  },
  required: {
    color: '#FF6B00',
    marginLeft: '2px',
  },
  input: {
    width: '100%',
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: '6px',
    color: '#F5F5F5',
    fontSize: '15px',
    padding: '11px 14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%',
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: '6px',
    color: '#F5F5F5',
    fontSize: '15px',
    padding: '11px 14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    minHeight: '120px',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: '6px',
    color: '#F5F5F5',
    fontSize: '15px',
    padding: '11px 14px',
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '8px',
    marginTop: '8px',
  },
  categoryBtn: (selected: boolean) => ({
    background: selected ? '#FF6B00' : '#111',
    border: selected ? '1px solid #FF6B00' : '1px solid #2A2A2A',
    borderRadius: '6px',
    color: selected ? '#FFF' : '#AAA',
    fontSize: '13px',
    padding: '9px 14px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.15s',
    fontWeight: selected ? 600 : 400,
  }),
  submitBtn: (disabled: boolean) => ({
    width: '100%',
    background: disabled ? '#333' : '#FF6B00',
    color: disabled ? '#666' : '#FFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    padding: '16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s',
    marginTop: '8px',
  }),
  error: {
    background: '#1A0A0A',
    border: '1px solid #5A1515',
    borderRadius: '8px',
    color: '#FF8080',
    fontSize: '14px',
    padding: '14px 16px',
    marginBottom: '20px',
  },
  successCard: {
    background: '#0A1A0A',
    border: '1px solid #1A4A1A',
    borderRadius: '12px',
    padding: '48px 40px',
    textAlign: 'center' as const,
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#4ADE80',
    marginBottom: '12px',
  },
  successText: {
    color: '#999',
    fontSize: '15px',
    lineHeight: 1.7,
    marginBottom: '24px',
  },
  refNum: {
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: '6px',
    color: '#FF6B00',
    fontFamily: 'monospace',
    fontSize: '13px',
    padding: '10px 16px',
    display: 'inline-block',
  },
};

export default function ApplyPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

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
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <div style={styles.logo}>VELOR</div>
          </div>
          <div style={styles.successCard}>
            <div style={styles.successTitle}>Application received</div>
            <p style={styles.successText}>
              Thank you for applying to sell on Velor Commerce. Our team will review your
              application and get back to you within 3-5 business days.
            </p>
            <div style={styles.refNum}>Reference: {applicationId}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>VELOR</div>
          <h1 style={styles.h1}>Sell on Velor Commerce</h1>
          <p style={styles.subtitle}>
            Join our curated marketplace of premium sellers. Tell us about your business
            and we will be in touch.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.card}>
            <div style={styles.sectionTitle}>Business details</div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Business name <span style={styles.required}>*</span>
              </label>
              <input
                style={styles.input}
                type="text"
                value={form.businessName}
                onChange={e => setField('businessName', e.target.value)}
                placeholder="Your company or brand name"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Contact name <span style={styles.required}>*</span>
                </label>
                <input
                  style={styles.input}
                  type="text"
                  value={form.contactName}
                  onChange={e => setField('contactName', e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Contact email <span style={styles.required}>*</span>
                </label>
                <input
                  style={styles.input}
                  type="email"
                  value={form.contactEmail}
                  onChange={e => setField('contactEmail', e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Website</label>
                <input
                  style={styles.input}
                  type="url"
                  value={form.website}
                  onChange={e => setField('website', e.target.value)}
                  placeholder="https://yourstore.com"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Country</label>
                <select
                  style={styles.select}
                  value={form.country}
                  onChange={e => setField('country', e.target.value)}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>About your store</div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Store description</label>
              <textarea
                style={styles.textarea}
                value={form.storeDescription}
                onChange={e => setField('storeDescription', e.target.value)}
                placeholder="Tell us about what you sell, your brand ethos, and what makes your products special..."
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Product categories</label>
              <div style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    style={styles.categoryBtn(form.productCategories.includes(cat))}
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={styles.submitBtn(submitting)}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  );
}