export const metadata = {
  title: 'Terms of Service — Velor Marketplace',
  description:
    'Velor Marketplace Terms of Service: platform role, accounts, seller obligations, buyer protections, fees, prohibited items, intellectual property, liability and governing law.',
  alternates: { canonical: 'https://velorcommerce.store/legal/terms' },
  openGraph: {
    title: 'Terms of Service — Velor Marketplace',
    description:
      'Velor Marketplace Terms of Service: platform role, accounts, seller obligations, buyer protections, fees, prohibited items, intellectual property, liability and governing law.',
    url: 'https://velorcommerce.store/legal/terms',
    siteName: 'Velor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service — Velor Marketplace',
    description:
      'Velor Marketplace Terms of Service: platform role, accounts, seller obligations, buyer protections, fees, prohibited items, intellectual property, liability and governing law.',
  },
}

export default function TermsPage() {
  const sections = [
    {
      title: "1. Introduction",
      body: "These Terms of Service govern your use of the Velor Commerce platform operated by Velor Commerce Ltd (company number 17268133), registered office at 49 Station Road, Polegate, East Sussex, BN26 6EA. By accessing or using Velor, you agree to be bound by these Terms.",
    },
    {
      title: "2. The Velor Platform",
      body: "Velor is a multi-vendor marketplace that enables independent sellers to list and sell products to buyers. Velor acts as a platform intermediary and is not a party to transactions between Buyers and Sellers except where stated.",
    },
    {
      title: "3. Accounts",
      body: "You must be at least 18 years old to create an account. You are responsible for maintaining the security of your account credentials. You must not share your account with others or use another person's account.",
    },
    {
      title: "4. Seller Obligations",
      body: "Sellers must: (a) list only products they are authorised to sell; (b) provide accurate product descriptions and images; (c) fulfil orders promptly and in accordance with listed delivery estimates; (d) comply with all applicable laws including consumer protection, product safety, and tax legislation.",
    },
    {
      title: "5. Buyer Protections",
      body: "Buyers may request a return or refund if: (a) an item is significantly not as described; (b) an item is faulty or damaged; (c) an item is not delivered within the stated timeframe. Return requests must be submitted within 14 days of delivery via the order page.",
    },
    {
      title: "6. Platform Fees",
      body: "Velor charges a commission on each completed sale based on your subscription tier: 10% on Starter (free), 4% on Pro (£49/month), or 0% on Enterprise (£99/month). This fee is deducted automatically at the time of payment via Stripe Connect. All fees are inclusive of any applicable taxes.",
    },
    {
      title: "7. Prohibited Items",
      body: "The following items may not be listed or sold on Velor: illegal goods or substances; counterfeit or trademark-infringing items; weapons, ammunition, or dangerous materials; adult content; items that violate any applicable law.",
    },
    {
      title: "8. Intellectual Property",
      body: "Sellers retain ownership of their product listings and images. By listing on Velor, Sellers grant Velor a non-exclusive licence to display their content on the platform. Velor's branding, design, and proprietary content are owned by Velor Commerce Ltd.",
    },
    {
      title: "9. Limitation of Liability",
      body: "To the fullest extent permitted by law, Velor's liability to you shall not exceed the greater of (a) the total fees paid by you to Velor in the 12 months preceding the claim, or (b) £100. Velor is not liable for indirect, consequential, or incidental damages.",
    },
    {
      title: "10. Governing Law",
      body: "These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.",
    },
    {
      title: "11. Changes to Terms",
      body: "We may update these Terms from time to time. We will notify users of material changes by email. Continued use of the platform after changes take effect constitutes acceptance of the updated Terms.",
    },
    {
      title: "12. Contact",
      body: "Velor Commerce Ltd, registered in England and Wales. For legal enquiries: legal@velorcommerce.store",
    },
  ];

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 48 }}>Last updated: 1 July 2026</p>
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
