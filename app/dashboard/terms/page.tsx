'use client';

import { useState } from 'react';

export default function TermsPage() {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/seller/terms', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to record acceptance (status ' + res.status + ')');
      }
      // Hard navigation, not router.push: guarantees the browser re-sends the
      // request with the just-set velor_terms cookie and middleware evaluates
      // it fresh, instead of relying on the client router cache.
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const cardStyle = {
    background: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: '16px',
    padding: '40px',
  };
  const h3Style = { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '17px', color: '#FFFFFF', margin: '28px 0 10px' };
  const pStyle = { color: '#CCCCCC', fontSize: '14px', lineHeight: '1.7', margin: '0 0 4px' };

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Inter, sans-serif', padding: '48px 24px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '30px', color: '#FFFFFF', margin: '0 0 8px' }}>
            Velor Marketplace
          </h1>
          <p style={{ color: '#999999', fontSize: '14px', margin: 0 }}>Seller Agreement - Version 1.2 (July 2026)</p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '22px', color: '#FFFFFF', margin: '0 0 6px' }}>
            Seller Terms &amp; Conditions
          </h2>
          <p style={{ color: '#999999', fontSize: '14px', margin: '0 0 8px' }}>Please read carefully before accessing your seller dashboard</p>

          <h3 style={h3Style}>1. Definitions</h3>
          <p style={pStyle}>Platform means the Velor Marketplace at velorcommerce.store and all associated services. Seller means any individual or entity that registers to sell products on the Platform. Buyer means any person purchasing products through the Platform. Listing means any product offered for sale by a Seller. GMV means Gross Merchandise Value - the total value of sales processed through the Platform.</p>

          <h3 style={h3Style}>2. Eligibility</h3>
          <p style={pStyle}>To become a Seller you must: (a) be at least 18 years of age; (b) have the legal capacity to enter into binding contracts in your jurisdiction; (c) operate a lawful business or sell goods you are legally entitled to sell; (d) complete identity and business verification as required by the Platform; (e) not be located in a country subject to applicable trade sanctions or export controls.</p>
          <p style={pStyle}>The Platform is a global marketplace, open to Sellers and Buyers worldwide. Sellers are solely responsible for ensuring compliance with all laws applicable in their country of operation and in every country they ship to.</p>

          <h3 style={h3Style}>3. Account Registration &amp; Verification</h3>
          <p style={pStyle}>Sellers must provide accurate, complete, and current information during registration and keep it updated. The Platform requires identity verification (government-issued ID) and, where applicable, business registration documentation before a Seller account becomes fully active. The Platform reserves the right to suspend or terminate accounts where verification cannot be completed or where false information has been provided.</p>

          <h3 style={h3Style}>4. Platform Fees &amp; Commission</h3>
          <p style={pStyle}>The Platform charges commission on each sale. Rates depend on your subscription tier:</p>
          <ul style={{ color: '#CCCCCC', fontSize: '14px', lineHeight: '1.7', margin: '8px 0', paddingLeft: '20px' }}>
            <li><strong style={{ color: '#FFFFFF' }}>Starter (Free):</strong> 10% commission on GMV. Maximum 10 active listings. Go Live live shopping, seller dashboard, analytics, and buyer protection on every sale.</li>
            <li><strong style={{ color: '#FFFFFF' }}>Pro (£49/month):</strong> 4% commission on GMV. Unlimited listings. Go Live live shopping, full analytics, a dedicated AI account manager, full API access, a free custom storefront, featured listing slots, priority review, discount code tools.</li>
          </ul>
          <p style={pStyle}>Commission is deducted from each transaction before payout. Subscription fees are billed monthly via Stripe and are non-refundable except where required by applicable law. Optional add-on features (for example, additional storefront themes or custom branding beyond what your tier includes) may be offered for a separate one-time or recurring fee, disclosed at the point of purchase. The Platform reserves the right to adjust fee structures with 30 days notice.</p>

          <h3 style={h3Style}>5. Payouts</h3>
          <p style={pStyle}>Buyer payments are held on the Platform's account, not transferred directly to Sellers at the time of sale. Once an order is confirmed delivered (via carrier tracking), the Seller's share (sale price plus shipping and duties, minus commission) is released to the Seller's connected payout account - Stripe Connect where Stripe supports payouts in the Seller's country, or Payoneer where it does not - after a hold period:</p>
          <ul style={{ color: '#CCCCCC', fontSize: '14px', lineHeight: '1.7', margin: '8px 0', paddingLeft: '20px' }}>
            <li><strong style={{ color: '#FFFFFF' }}>New (probation) Sellers:</strong> 15 days after confirmed delivery.</li>
            <li><strong style={{ color: '#FFFFFF' }}>Trusted Sellers:</strong> 72 hours after confirmed delivery. A Seller becomes Trusted automatically once they have 10+ delivered orders, an account at least 30 days old, and no unresolved disputes or returns.</li>
          </ul>
          <p style={pStyle}>If a return or dispute is opened on an order, that order's payout is frozen until the return or dispute is resolved, regardless of the hold period above. Sellers must complete payout onboarding with the applicable provider (Stripe Connect, or Payoneer where applicable) to receive payouts; funds remain safely held on the Platform until onboarding is complete.</p>

          <h3 style={h3Style}>6. Prohibited Items</h3>
          <p style={pStyle}>The following are strictly prohibited: weapons, firearms, controlled substances, counterfeit goods, adult content, hazardous materials, live animals subject to CITES restrictions, human remains, stolen goods, financial instruments, items subject to trade sanctions, and any item prohibited under UK law or under applicable law in the Seller's or Buyer's jurisdiction. Regulated materials (for example CITES-listed wildlife or plant products) may only be listed with valid permits, per the Seller Rules and Product Compliance Policy at /legal/seller-rules.</p>

          <h3 style={h3Style}>7. Seller Responsibilities</h3>
          <p style={pStyle}>Sellers are solely responsible for: (a) accuracy of all product descriptions and images; (b) holding appropriate title to sell all listed items; (c) fulfilling orders promptly; (d) packaging goods safely; (e) complying with consumer protection regulations in destination countries; (f) handling customer service professionally; (g) providing tracking information for all shipments.</p>

          <h3 style={h3Style}>8. Returns &amp; Refunds</h3>
          <p style={pStyle}>Buyers may request a return within 15 days of confirmed delivery, for physical goods. Return requests submitted before delivery is confirmed, or more than 15 days after, will not be accepted by the Platform.</p>
          <p style={pStyle}>Sellers review return requests through their dashboard and may approve or reject each one. If a return is approved, the Buyer is refunded in full to their original payment method through the Platform. If the Seller's share of that sale has already been paid out, the Platform reverses that transfer as part of processing the refund - the Seller does not need to return the funds manually. While a return request is open, the related order's payout is frozen (see Section 5).</p>
          <p style={pStyle}>In the event of a Buyer dispute the Platform may mediate. If a chargeback is initiated, the disputed amount plus chargeback fees may be deducted from the Seller's earnings or reserve.</p>

          <h3 style={h3Style}>9. Platform Rights &amp; Enforcement</h3>
          <p style={pStyle}>The Platform reserves the right to: (a) remove any listing at its sole discretion; (b) suspend or terminate a Seller account for breach of these terms; (c) withhold payouts pending investigation of suspected fraud; (d) modify these terms with 30 days notice to active Sellers.</p>

          <h3 style={h3Style}>10. Data Protection</h3>
          <p style={pStyle}>The Platform processes Seller personal data in accordance with its Privacy Policy, UK GDPR, and other data protection laws that apply given the Seller's location. Seller data is shared with Stripe Inc. - and with Payoneer Inc. where Payoneer is the Seller's payout provider - solely for processing transactions and payouts. Buyer shipping data must only be used for fulfilment.</p>

          <h3 style={h3Style}>11. Intellectual Property</h3>
          <p style={pStyle}>Sellers retain ownership of their original product images and descriptions. By listing on the Platform, Sellers grant the Platform a non-exclusive licence to display listing content for operating and promoting the Platform. Sellers must not list products that infringe third-party intellectual property rights. Custom storefront branding (including uploaded logos and theme selections) remains the Seller's property; by uploading it the Seller grants the Platform the same non-exclusive licence described above to display it as part of the Seller's storefront.</p>

          <h3 style={h3Style}>12. Tax Obligations</h3>
          <p style={pStyle}>Sellers are solely responsible for determining and fulfilling their own tax obligations, including income tax, VAT, GST, and import duties, except where marketplace facilitator laws require the Platform to collect and remit sales tax or VAT on facilitated orders. The Platform does not provide tax advice.</p>

          <h3 style={h3Style}>13. Limitation of Liability</h3>
          <p style={pStyle}>The Platform's total liability to a Seller shall not exceed the total commission paid by that Seller in the 3 months preceding the claim. The Platform is not liable for indirect, consequential, incidental, or punitive damages.</p>

          <h3 style={h3Style}>14. Independent Contractor</h3>
          <p style={pStyle}>Sellers are independent contractors. Nothing in these terms creates an employment, partnership, or agency relationship between the Seller and the Platform.</p>

          <h3 style={h3Style}>15. Governing Law</h3>
          <p style={pStyle}>These terms are governed by the laws of England and Wales, the jurisdiction of Velor Commerce Ltd. Disputes shall be submitted to binding arbitration under the rules of the London Court of International Arbitration (LCIA).</p>

          <h3 style={h3Style}>16. Entire Agreement</h3>
          <p style={pStyle}>These terms, together with the Platform Privacy Policy and the Seller Rules and Product Compliance Policy, constitute the entire agreement between the Seller and the Platform. If any provision is found unenforceable, the remaining provisions continue in full force.</p>

          <p style={{ color: '#666666', fontSize: '12px', margin: '24px 0 0' }}>
            Effective date: 4 July 2026 - Version 1.2 - Operated by Velor Commerce Ltd - Contact: customerservice@velorcommerce.store
          </p>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #2A2A2A' }}>
            {error && (
              <div style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid #FF1744', borderRadius: '8px', padding: '12px 16px', color: '#FF1744', fontSize: '14px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#CCCCCC', fontSize: '14px', lineHeight: '1.6', cursor: 'pointer', marginBottom: '20px' }}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#FF6B00', flexShrink: 0 }}
              />
              <span>
                I have read and agree to the Velor Marketplace Seller Agreement (v1.2, July 2026). I confirm I have the legal authority to bind myself or my business to these terms.
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!accepted || loading}
              style={{
                width: '100%',
                background: !accepted || loading ? '#5A3000' : '#FF6B00',
                color: '#FFFFFF',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '15px',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                cursor: !accepted || loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Saving...' : 'Accept and Enter Dashboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
