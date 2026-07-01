import Link from 'next/link';

export const metadata = {
  title: 'Seller Agreement — Velor Marketplace',
  description: 'Velor Seller Terms of Service. Read before registering as a seller.',
};

export default function SellerAgreementPage() {
  return (
    <div style={{
      background: '#0D0D0D',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      color: '#FFFFFF',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ borderBottom: '1px solid #2A2A2A', padding: '24px 0', textAlign: 'center' }}>
        <Link href="/" style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: '24px',
          color: '#FF6B00',
          textDecoration: 'none',
          letterSpacing: '-0.5px',
        }}>
          VELOR
        </Link>
      </div>

      {/* Document */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{
            color: '#FF6B00',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            Legal Agreement
          </p>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 800,
            fontSize: '40px',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}>
            Velor Seller Agreement
          </h1>
          <p style={{ color: '#999999', fontSize: '14px' }}>Last updated: 1 July 2026</p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          <AgreementSection num="1" title="Introduction">
            <p>This Seller Agreement (&quot;Agreement&quot;) is between Velor Commerce Ltd (&quot;Velor&quot;, &quot;we&quot;, &quot;us&quot;) and the seller (&quot;you&quot;, &quot;Seller&quot;) who registers to sell on velorcommerce.store. By clicking &quot;I Accept&quot;, you confirm that you have read, understood, and agree to be bound by all terms of this Agreement.</p>
          </AgreementSection>

          <AgreementSection num="2" title="Seller Eligibility">
            <ul>
              <li>You must be 18 years of age or older and legally permitted to sell goods in the United Kingdom.</li>
              <li>Business sellers must provide an accurate company name and registered business address.</li>
              <li>You must have a valid Stripe account connected via Stripe Connect to receive payouts.</li>
              <li>Velor reserves the right to reject any seller application at its sole discretion, without obligation to provide reasons.</li>
            </ul>
          </AgreementSection>

          <AgreementSection num="3" title="Permitted Product Categories">
            <p style={{ marginBottom: '12px' }}>Only the following product categories are permitted on the Velor Marketplace:</p>
            <ul>
              <li>Home Gym Equipment</li>
              <li>Cardio Machines</li>
              <li>Recovery &amp; Wellness Tools</li>
              <li>Sports Accessories</li>
              <li>Outdoor Fitness Equipment</li>
              <li>Yoga &amp; Pilates Equipment</li>
            </ul>
            <p style={{ marginTop: '12px', color: '#999999', fontSize: '14px' }}>Products outside these categories will be removed without notice. Repeated violations may result in account suspension.</p>
          </AgreementSection>

          <AgreementSection num="4" title="Prohibited Items">
            <p style={{ marginBottom: '12px' }}>The following items are strictly prohibited from listing on Velor:</p>
            <ul>
              <li>Clothing, shoes, footwear, or apparel of any kind</li>
              <li>Food, dietary supplements, protein powders, or any ingestible product</li>
              <li>Counterfeit, replica, or unauthorised branded goods</li>
              <li>Products that do not comply with UK product safety regulations</li>
              <li>Electrical items without valid UK CE or UKCA safety marking</li>
              <li>Weapons, knives, or any item capable of causing physical harm</li>
              <li>Adult content or age-restricted products</li>
              <li>Any item that is illegal to sell in the United Kingdom</li>
            </ul>
            <div style={{
              marginTop: '16px',
              background: 'rgba(255,23,68,0.08)',
              border: '1px solid #2A2A2A',
              borderLeft: '3px solid #FF1744',
              padding: '14px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#CCCCCC',
            }}>
              Listing a prohibited item will result in immediate removal and may result in permanent account suspension. Velor reserves the right to report illegal listings to relevant authorities.
            </div>
          </AgreementSection>

          <AgreementSection num="5" title="Product Listing Standards">
            <ul>
              <li>All product titles, descriptions, and specifications must be accurate and not misleading in any way.</li>
              <li>Images must be genuine photographs of the actual product. AI-generated, stock, or misleading images are not permitted.</li>
              <li>Pricing must accurately reflect the product being sold. Hidden fees or bait-and-switch pricing is prohibited.</li>
              <li>Stock levels must be kept up to date at all times. Overselling is not permitted.</li>
              <li>All products must comply with the UK Consumer Rights Act 2015: goods must be of satisfactory quality, fit for purpose, and as described.</li>
            </ul>
          </AgreementSection>

          <AgreementSection num="6" title="Commission & Payments">
            <ul>
              <li>Velor charges a <strong style={{ color: '#FFFFFF' }}>15% commission</strong> on every completed sale, applied to the total sale price including VAT where applicable.</li>
              <li>Payments are processed via <strong style={{ color: '#FFFFFF' }}>Stripe Connect</strong> directly to your registered bank account.</li>
              <li>Payouts are typically received within 2 business days of a completed and non-disputed sale.</li>
              <li>Velor does not charge listing fees, monthly subscription fees, or setup fees.</li>
              <li>In the event of a refund or chargeback, the 15% commission is reversed proportionally.</li>
              <li>Velor reserves the right to hold payouts pending resolution of buyer disputes.</li>
            </ul>
          </AgreementSection>

          <AgreementSection num="7" title="Returns & Refunds">
            <ul>
              <li>Sellers must honour Velor&apos;s standard <strong style={{ color: '#FFFFFF' }}>30-day returns policy</strong> on all products.</li>
              <li>Buyers are entitled to return most items within 30 days under the Consumer Contracts Regulations 2013. Sellers must comply with this statutory right.</li>
              <li>If a return is approved, the seller is responsible for costs associated with the returned goods unless the buyer is at fault.</li>
              <li>Velor will mediate disputes between buyers and sellers. Velor&apos;s decision in any dispute is final and binding.</li>
              <li>Sellers with a return rate exceeding 10% of orders in any 30-day period may be subject to review or suspension.</li>
            </ul>
          </AgreementSection>

          <AgreementSection num="8" title="UK Legal Compliance">
            <p style={{ marginBottom: '12px' }}>Sellers are <strong style={{ color: '#FFFFFF' }}>solely responsible</strong> for compliance with all applicable UK laws, including but not limited to:</p>
            <ul>
              <li><strong>VAT:</strong> Collecting and remitting VAT to HMRC if your taxable turnover exceeds the current threshold (£90,000/year). Velor does not collect VAT on your behalf.</li>
              <li><strong>Consumer Rights Act 2015:</strong> All goods must be of satisfactory quality, fit for purpose, and as described.</li>
              <li><strong>General Product Safety Regulations 2005:</strong> All products must meet UK safety standards before listing.</li>
              <li><strong>UK GDPR:</strong> Any buyer personal data you access must be handled in compliance with UK data protection law. You may not use buyer data for unsolicited marketing.</li>
              <li><strong>Safety markings:</strong> All applicable products must carry CE or UKCA markings as required by UK law.</li>
            </ul>
          </AgreementSection>

          <AgreementSection num="9" title="Prohibited Conduct">
            <p style={{ marginBottom: '12px' }}>The following conduct is strictly prohibited and will result in immediate account suspension:</p>
            <ul>
              <li>Attempting to transact directly with buyers outside of the Velor platform to circumvent commission</li>
              <li>Posting, incentivising, or purchasing fake or misleading product reviews</li>
              <li>Using Velor buyer data for unsolicited marketing communications</li>
              <li>Impersonating another brand, seller, or individual</li>
              <li>Any form of fraudulent activity, including payment fraud or identity fraud</li>
              <li>Coordinating with other sellers to manipulate pricing, search rankings, or reviews</li>
            </ul>
            <p style={{ marginTop: '16px', color: '#999999', fontSize: '14px' }}>Velor reserves the right to report violations to Action Fraud, Trading Standards, or other relevant authorities.</p>
          </AgreementSection>

          <AgreementSection num="10" title="Intellectual Property">
            <ul>
              <li>By listing on Velor, you confirm that you own or have full rights to all images, descriptions, brand names, and content you upload.</li>
              <li>You grant Velor a non-exclusive, royalty-free, worldwide licence to use your product images, titles, and descriptions for the purposes of operating and marketing the Velor platform.</li>
              <li>You must not list products that infringe on third-party trademarks, copyrights, or intellectual property rights.</li>
            </ul>
          </AgreementSection>

          <AgreementSection num="11" title="Account Suspension & Termination">
            <p style={{ marginBottom: '12px' }}>Velor may suspend or permanently terminate a seller account at any time, with or without prior notice, for:</p>
            <ul>
              <li>Any breach of this Agreement</li>
              <li>Receiving an excessive volume of buyer complaints</li>
              <li>Chargeback rate exceeding 2% of total orders in any 30-day period</li>
              <li>Any conduct Velor reasonably deems harmful to its brand, buyers, or platform integrity</li>
              <li>Legal requirement or instruction from a regulatory authority</li>
            </ul>
            <p style={{ marginTop: '12px', color: '#999999', fontSize: '14px' }}>Upon termination, any outstanding payouts for completed, non-disputed orders will be processed in the normal payout cycle. Payouts for disputed or pending orders may be withheld pending resolution.</p>
          </AgreementSection>

          <AgreementSection num="12" title="Limitation of Liability">
            <p>To the fullest extent permitted by law, Velor Commerce Ltd is not liable for: a seller&apos;s failure to fulfil orders; product defects or safety issues arising from seller products; customs or import issues; any indirect, consequential, or incidental loss; or any loss arising from use of the platform beyond the value of commission fees charged to the seller in the relevant period.</p>
          </AgreementSection>

          <AgreementSection num="13" title="Governing Law">
            <p>This Agreement is governed by and construed in accordance with the laws of England and Wales. Any disputes arising under this Agreement shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </AgreementSection>

          <AgreementSection num="14" title="Changes to This Agreement">
            <p>Velor may update these terms at any time. Sellers will be notified of material changes by email to the address registered on their account. Continued use of the platform following notification constitutes acceptance of the revised terms.</p>
          </AgreementSection>

        </div>

        {/* Acceptance block */}
        <div style={{
          marginTop: '64px',
          padding: '40px',
          background: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#999999', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            By clicking below, you confirm you have read and agree to the Velor Seller Agreement.<br />
            Your acceptance will be recorded with a timestamp.
          </p>
          <Link href="/dashboard" style={{
            display: 'inline-block',
            background: '#FF6B00',
            color: '#FFFFFF',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            padding: '16px 48px',
            borderRadius: '8px',
            textDecoration: 'none',
            letterSpacing: '0.5px',
          }}>
            I Accept — Start Selling
          </Link>
          <p style={{ color: '#999999', fontSize: '12px', marginTop: '16px' }}>
            Velor Commerce Ltd · England and Wales · Last updated 1 July 2026
          </p>
        </div>

      </div>
    </div>
  );
}

function AgreementSection({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 700,
        fontSize: '20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{
          background: '#FF6B00',
          color: '#FFFFFF',
          borderRadius: '6px',
          width: '32px',
          height: '32px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 700,
          flexShrink: 0,
        }}>{num}</span>
        {title}
      </h2>
      <div style={{
        color: '#CCCCCC',
        fontSize: '15px',
        lineHeight: 1.75,
        paddingLeft: '44px',
      }}>
        {children}
      </div>
    </div>
  );
}
