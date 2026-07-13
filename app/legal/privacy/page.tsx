export const metadata = {
  title: 'Privacy Policy — Velor Marketplace',
  description:
    'How Velor Marketplace collects, uses, shares, retains and protects your personal data under UK GDPR and the Data Protection Act 2018, and how to exercise your data rights.',
  alternates: { canonical: 'https://velorcommerce.store/legal/privacy' },
  openGraph: {
    title: 'Privacy Policy — Velor Marketplace',
    description:
      'How Velor Marketplace collects, uses, shares, retains and protects your personal data under UK GDPR and the Data Protection Act 2018, and how to exercise your data rights.',
    url: 'https://velorcommerce.store/legal/privacy',
    siteName: 'Velor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — Velor Marketplace',
    description:
      'How Velor Marketplace collects, uses, shares, retains and protects your personal data under UK GDPR and the Data Protection Act 2018, and how to exercise your data rights.',
  },
}

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Data Controller",
      body: "Velor Commerce Ltd is the data controller for personal data collected through the Velor platform. We are committed to protecting your privacy in accordance with UK GDPR and the Data Protection Act 2018.",
    },
    {
      title: "2. Data We Collect",
      body: "We collect: (a) Account data — name, email address, password hash; (b) Transaction data — order details, shipping address, payment confirmation; (c) Seller data — business name and payout account details (Stripe Connect, or Payoneer where applicable); (d) Usage data — pages visited, device type, browser; (e) Communications — messages sent via the platform.",
    },
    {
      title: "3. How We Use Your Data",
      body: "We use your data to: (a) process and fulfil orders; (b) manage your account; (c) communicate order and account updates; (d) operate and improve the platform; (e) comply with legal obligations; (f) detect and prevent fraud.",
    },
    {
      title: "4. Lawful Basis",
      body: "We process personal data on the following lawful bases: (a) Contract — necessary to fulfil orders and operate accounts; (b) Legal obligation — tax, fraud prevention, and other legal requirements; (c) Legitimate interests — platform security, analytics, and service improvement; (d) Consent — marketing communications (you may withdraw consent at any time).",
    },
    {
      title: "5. Data Sharing",
      body: "We share data with: (a) Sellers — order details necessary to fulfil your purchase; (b) Stripe — payment processing and seller payouts; (c) Payoneer — seller payouts, for sellers in countries where Stripe payouts are not available; (d) Vercel — platform hosting; (e) Resend — transactional email delivery. We do not sell personal data to third parties.",
    },
    {
      title: "6. International Transfers",
      body: "Some of our service providers process data outside the UK. Where data is transferred internationally, we ensure appropriate safeguards are in place, including Standard Contractual Clauses where required.",
    },
    {
      title: "7. Data Retention",
      body: "We retain account data for as long as your account is active. Order data is retained for 7 years for tax and legal compliance. You may request deletion of your account at any time, subject to legal retention obligations.",
    },
    {
      title: "8. Your Rights",
      body: "Under UK GDPR, you have the right to: access your data; rectify inaccurate data; erase your data (where lawful); restrict or object to processing; data portability; withdraw consent. To exercise any right, email privacy@velorcommerce.store.",
    },
    {
      title: "9. Cookies",
      body: "We use strictly necessary cookies for session management and authentication. We do not use third-party advertising cookies without your consent.",
    },
    {
      title: "10. Contact and Complaints",
      body: "Data protection enquiries: privacy@velorcommerce.store. If you are unhappy with how we handle your data, you may lodge a complaint with the Information Commissioner's Office at ico.org.uk.",
    },
  ];

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 48 }}>Last updated: 7 July 2026</p>
        {sections.map(s => (
          <div key={s.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{s.title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--muted)' }}>{s.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
