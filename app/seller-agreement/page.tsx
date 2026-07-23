import Link from 'next/link';
import { CATEGORY_NAMES } from '@/lib/categories';

export const metadata = {
  title: 'Seller Agreement — Velor Marketplace',
  description: 'Velor Seller Terms of Service. Read before registering as a seller.',
  alternates: { canonical: 'https://velorcommerce.store/seller-agreement' },
  openGraph: {
    title: 'Seller Agreement — Velor Marketplace',
    description: 'Velor Seller Terms of Service. Read before registering as a seller.',
    url: 'https://velorcommerce.store/seller-agreement',
    siteName: 'Velor',
    // locale added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale ('en_GB', verified against lib/currency.ts's
    // real GBP default, not invented).
    locale: 'en_GB',
    type: 'website',
    // images added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale (vercel/next.js#50353: an explicit openGraph
    // object replaces the whole object, dropping the root file-convention
    // image unless listed here).
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seller Agreement — Velor Marketplace',
    description: 'Velor Seller Terms of Service. Read before registering as a seller.',
    images: ['https://velorcommerce.store/opengraph-image'],
  },
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
          <p style={{ color: '#999999', fontSize: '14px' }}>Last updated: 7 July 2026</p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          <AgreementSection num="1" title="Introduction">
            <p>This Seller Agreement (&quot;Agreement&quot;) is between Velor Commerce Ltd (&quot;Velor&quot;, &quot;we&quot;, &quot;us&quot;) and the seller (&quot;you&quot;, &quot;Seller&quot;) who registers to sell on velorcommerce.store. By clicking &quot;I Accept&quot;, you confirm that you have read, understood, and agree to be bound by all terms of this Agreement, together with the Seller Rules and Product Compliance Policy published at /legal/seller-rules, which forms part of this Agreement.</p>
          </AgreementSection>

          <AgreementSection num="2" title="Seller Eligibility">
            <ul>
              <li>You must be 18 years of age or older and legally permitted to sell goods in your country of operation.</li>
              <li>Velor is a global marketplace, open to sellers worldwide. Business sellers must provide an accurate company name and registered business address; individual makers must provide accurate identity details.</li>
              <li>You must complete payout onboarding to receive payments: via Stripe Connect where Stripe supports payouts in your country, or via Dots where it does not. Your payout method is confirmed during onboarding.</li>
              <li>Velor reserves the right to reject any seller application at its sole discretion, without obligation to provide reasons.</li>
            </ul>
          </AgreementSection>

          <AgreementSection num="3" title="Permitted Product Categories">
            <p style={{ marginBottom: '12px' }}>Velor accepts products across its full marketplace catalogue, including:</p>
            <ul>
              {CATEGORY_NAMES.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <p style={{ marginTop: '12px', color: '#999999', fontSize: '14px' }}>Some categories carry additional requirements (for example, food and regulated materials) — see the Seller Rules and Product Compliance Policy. Products listed in the wrong category may be recategorised or removed.</p>
          </AgreementSection>

          <AgreementSection num="4" title="Prohibited Items">
            <p style={{ marginBottom: '12px' }}>The following items are strictly prohibited from listing on Velor:</p>
            <ul>
              <li>Counterfeit, replica, stolen, or unauthorised branded goods</li>
              <li>Weapons, ammunition, and weapon parts</li>
              <li>Illegal drugs and controlled substances</li>
              <li>Ivory and tortoiseshell in any form</li>
              <li>Genuine antiques, archaeological artifacts, and cultural heritage items (newly made cultural and artisan goods are welcome)</li>
              <li>Parts or feathers of protected bird species</li>
              <li>Fresh, refrigerated, frozen, or short-shelf-life food</li>
              <li>Recalled or known-unsafe products</li>
              <li>Adult content or age-restricted products</li>
              <li>Any item illegal to sell in your country or in the buyer&apos;s country</li>
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
              Listing a prohibited item will result in immediate removal and may result in permanent account suspension. Regulated materials (such as CITES-listed wildlife or plant products) are not prohibited outright but require valid permits before listing — see the Seller Rules and Product Compliance Policy. Velor reserves the right to report illegal listings to relevant authorities.
            </div>
          </AgreementSection>

          <AgreementSection num="5" title="Product Listing Standards">
            <ul>
              <li>All product titles, descriptions, materials, origin countries, and specifications must be accurate and not misleading in any way.</li>
              <li>Images must be genuine photographs of the actual product. AI-generated, stock, or misleading images are not permitted.</li>
              <li>Pricing must accurately reflect the product being sold. Hidden fees or bait-and-switch pricing is prohibited.</li>
              <li>Stock levels must be kept up to date at all times. Overselling is not permitted.</li>
              <li>Goods must be of satisfactory quality, fit for purpose, and as described, and must comply with the consumer protection law of the countries you sell to.</li>
              <li>Customs information (product description, HS code, declared value) must be truthful — see the Seller Rules and Product Compliance Policy.</li>
            </ul>
          </AgreementSection>

          <AgreementSection num="6" title="Commission, Fees & Payouts">
            <ul>
              <li>Velor charges commission on the product subtotal of each completed sale based on your subscription tier: <strong style={{ color: '#FFFFFF' }}>Starter (free) 10%</strong>, <strong style={{ color: '#FFFFFF' }}>Pro (£49/month) 4%</strong>.</li>
              <li>Payouts are made via <strong style={{ color: '#FFFFFF' }}>Stripe Connect</strong> where Stripe supports your country, or via <strong style={{ color: '#FFFFFF' }}>Dots</strong> where it does not.</li>
              <li>To protect buyers, funds are held until delivery is confirmed, then released automatically: within 15 days for new sellers, reducing to 72 hours once you build a trusted delivery record.</li>
              <li>Velor does not charge listing fees or setup fees. Paid tiers are optional monthly subscriptions.</li>
              <li>In the event of a refund or chargeback, commission is reversed proportionally.</li>
              <li>Velor reserves the right to hold payouts pending resolution of buyer disputes.</li>
            </ul>
          </AgreementSection>

          <AgreementSection num="7" title="Returns & Refunds">
            <ul>
              <li>Buyers may request a return within <strong style={{ color: '#FFFFFF' }}>15 days of confirmed delivery</strong>. Sellers must accept returns for items that are faulty, damaged, or significantly not as described.</li>
              <li>Where consumer law in the buyer&apos;s country grants a statutory withdrawal or cooling-off right against business sellers, you must honour it.</li>
              <li>If a return is approved, the buyer is refunded in full through the platform; any released payout for that order is reversed automatically.</li>
              <li>Velor will mediate disputes between buyers and sellers. Velor&apos;s decision in any dispute is final and binding.</li>
              <li>Sellers with a return rate exceeding 10% of orders in any 30-day period may be subject to review or suspension.</li>
            </ul>
          </AgreementSection>

          <AgreementSection num="8" title="Legal & Tax Compliance">
            <p style={{ marginBottom: '12px' }}>Sellers are <strong style={{ color: '#FFFFFF' }}>solely responsible</strong> for compliance with all laws applicable in their country of operation and every country they ship to, including:</p>
            <ul>
              <li><strong>Product safety:</strong> goods must meet the safety standards of destination countries, including CE or UKCA marking where the category requires it.</li>
              <li><strong>Trade and customs law:</strong> accurate declarations, correct HS codes, and valid permits for regulated materials, per the Seller Rules and Product Compliance Policy.</li>
              <li><strong>Tax:</strong> where marketplace facilitator laws apply, Velor collects and remits the relevant sales tax or VAT on facilitated orders at checkout. In all other cases you are responsible for your own tax obligations, and in every case for your own income tax and business registrations.</li>
              <li><strong>Data protection:</strong> buyer personal data you access must be handled lawfully and used only for order fulfilment — never for unsolicited marketing.</li>
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
            <p style={{ marginTop: '16px', color: '#999999', fontSize: '14px' }}>Velor reserves the right to report violations to law enforcement, consumer protection, and trading standards authorities in the relevant countries.</p>
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
              <li>Any breach of this Agreement or the Seller Rules and Product Compliance Policy</li>
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
            Velor Commerce Ltd · England and Wales · Last updated 7 July 2026
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
