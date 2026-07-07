'use client';
import { useState } from 'react';

const FAQS = [
  {
    category: 'Buying',
    items: [
      { q: 'How do I place an order?', a: 'Browse the shop, add items to your cart, and proceed to checkout. We accept major cards and display prices in 20 currencies.' },
      { q: 'What payment methods are accepted?', a: 'We accept Visa, Mastercard, American Express, and other major cards via Stripe. All payments are processed securely.' },
      { q: 'Can I track my order?', a: 'Yes. Once your order ships, the seller will update the tracking details. You can view your orders from your account page.' },
      { q: 'What is your returns policy?', a: 'Most items can be returned within 15 days of confirmed delivery. Contact the seller directly via the order page to initiate a return.' },
      { q: 'My item arrived damaged — what do I do?', a: 'Open a dispute from your order page within 7 days. Our team will review the case and ensure a fair resolution.' },
    ],
  },
  {
    category: 'Selling',
    items: [
      { q: 'How do I start selling on Velor?', a: 'Apply via the "Sell on Velor" page. Once approved, you can list products and receive payouts via Stripe Connect — or via Payoneer if Stripe does not support payouts in your country.' },
      { q: 'What is the platform fee?', a: 'Commission depends on your tier: 15% on the free Starter tier, 8% on Pro, and 5% on Enterprise. This covers payment processing, buyer protection, and platform costs.' },
      { q: 'How do payouts work?', a: 'Funds are held safely until your buyer confirms delivery, then released to your Stripe Connect account (or Payoneer where Stripe is unavailable), minus commission — within 15 days for new sellers, dropping to 72 hours once you build a trusted delivery record.' },
      { q: 'Can I sell internationally?', a: 'Yes. Velor is a global marketplace — your listings are visible to buyers worldwide by default, with prices converted live into the buyer’s currency.' },
      { q: 'How do I get my products approved?', a: 'Submit your listing and our team will review it within 1–2 business days. You will receive an email once approved or rejected.' },
    ],
  },
  {
    category: 'Account',
    items: [
      { q: 'How do I create an account?', a: 'Click "Sign in" at the top of the page and follow the prompts to create an account with your email address.' },
      { q: 'I forgot my password — how do I reset it?', a: 'Click "Sign in" and then "Forgot password" to receive a reset link to your email.' },
      { q: 'How do I contact Velor support?', a: 'Use the contact form below or email us at support@velorcommerce.store. We aim to respond within 1 business day.' },
    ],
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>Help Centre</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 12 }}>How can we help?</h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 56 }}>Find answers to common questions below, or contact us directly.</p>

        {FAQS.map(cat => (
          <div key={cat.category} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>{cat.category}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cat.items.map(item => {
                const key = cat.category + item.q;
                const isOpen = open === key;
                return (
                  <div key={item.q} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    <button
                      onClick={() => setOpen(isOpen ? null : key)}
                      style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 500 }}
                    >
                      {item.q}
                      <span style={{ fontSize: 20, color: 'var(--muted)', marginLeft: 16, flexShrink: 0 }}>{isOpen ? '-' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 20px 16px', fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>{item.a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 28px', marginTop: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Still need help?</h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 4 }}>Our support team is available Monday to Friday, 9am–6pm GMT.</p>
          <p style={{ fontSize: 15, color: 'var(--muted)' }}>Email: <a href="mailto:support@velorcommerce.store" style={{ color: 'var(--accent)' }}>support@velorcommerce.store</a></p>
        </div>
      </section>
    </main>
  );
}
