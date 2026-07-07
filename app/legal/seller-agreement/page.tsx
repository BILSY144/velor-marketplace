export default function SellerAgreementPage() {
  const sections = [
    {
      title: "1. Platform Fee",
      body: "Velor charges a commission on the product subtotal of each completed sale, based on your subscription tier: Starter (free) 15%, Pro (49 GBP per month) 8%, Enterprise (199 GBP per month) 5%. The commission is deducted automatically via Stripe Connect before funds are transferred to your account and is inclusive of payment processing costs. Full tier details, listing allowances and current pricing are shown on the Pricing and Tiers page; if you do not subscribe to a paid tier, the Starter rate applies.",
    },
    {
      title: "2. Seller Responsibilities",
      body: "As a seller you are responsible for: (a) the accuracy of all product listings, descriptions, and images; (b) ensuring products comply with all applicable laws and safety standards; (c) fulfilling orders within the stated dispatch timeframe; (d) providing tracking information where available; (e) handling customer communications professionally.",
    },
    {
      title: "3. Product Approval and Seller Rules",
      body: "All product listings are subject to review and approval by Velor. Listings must comply with the Seller Rules and Product Compliance Policy (published at /legal/seller-rules), which forms part of this Agreement and covers prohibited items, certificate-required regulated materials, food, dangerous goods, customs declarations, HS codes and product safety. We reserve the right to reject or remove listings that violate these policies, are inaccurately described, pose safety concerns, or are otherwise unsuitable for the platform.",
    },
    {
      title: "4. Payouts",
      body: "Payouts are processed via Stripe Connect to your connected bank account. You must complete Stripe's identity verification to receive payouts. To protect buyers, funds for each order are held until delivery is confirmed and are then released automatically -- within 15 days for new sellers, reducing to 72 hours once you build a trusted delivery track record. Orders with an open return or dispute are held until the case is resolved. Velor is not responsible for delays caused by Stripe or your bank.",
    },
    {
      title: "5. Returns and Disputes",
      body: "Sellers must accept returns for items that are faulty, damaged, or significantly not as described. Where consumer law in the buyer's country grants a statutory withdrawal or cooling-off right against business sellers, you must honour it. Sellers should respond to buyer messages within 48 hours. Unresolved disputes may be escalated to Velor for mediation. Velor's decision in disputes is final.",
    },
    {
      title: "6. Prohibited Conduct",
      body: "Sellers must not: (a) list counterfeit, stolen, or infringing products; (b) manipulate reviews or feedback; (c) conduct transactions outside the Velor platform to avoid fees; (d) misrepresent products or delivery times; (e) engage in any fraudulent or deceptive conduct; (f) list items prohibited or restricted under the Seller Rules and Product Compliance Policy without the required documentation.",
    },
    {
      title: "7. Account Suspension",
      body: "Velor reserves the right to suspend or permanently ban seller accounts for violations of this Agreement, repeated negative buyer experiences, or any conduct that damages the reputation or integrity of the platform.",
    },
    {
      title: "8. Intellectual Property",
      body: "Sellers warrant that they own or are licensed to use all content in their listings. Sellers indemnify Velor against any claims arising from intellectual property infringement in seller-provided content.",
    },
    {
      title: "9. Tax",
      body: "Where marketplace facilitator laws apply, Velor collects and remits the relevant sales tax or VAT on facilitated orders at checkout. In all other cases sellers are solely responsible for accounting for and remitting any taxes applicable to their sales, including VAT, income tax, and any other levies, and in every case sellers remain responsible for their own income tax and business registrations. Velor does not provide tax advice.",
    },
    {
      title: "10. Amendments",
      body: "Velor may amend this Agreement from time to time. Sellers will be notified of material changes by email. Continued use of the platform after changes take effect constitutes acceptance of the updated Agreement.",
    },
    {
      title: "11. Contact",
      body: "Seller support: sellers@velorcommerce.store. Legal enquiries: legal@velorcommerce.store",
    },
  ];

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Seller Agreement</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 48 }}>Last updated: 7 July 2026</p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px', marginBottom: 40 }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>
            This Seller Agreement governs your access to and use of the Velor Commerce seller platform. By applying and being accepted as a seller, you agree to the terms below, together with the Seller Rules and Product Compliance Policy at /legal/seller-rules.
          </p>
        </div>
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
