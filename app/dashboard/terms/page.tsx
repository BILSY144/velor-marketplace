'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/seller/terms', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to record acceptance');
      router.push('/dashboard');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Velor Marketplace</h1>
          <p className="mt-2 text-gray-500">Seller Agreement - Version 1.0 (July 2026)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 px-8 py-5">
            <h2 className="text-white font-semibold text-lg">Seller Terms &amp; Conditions</h2>
            <p className="text-gray-400 text-sm mt-1">Please read carefully before accessing your seller dashboard</p>
          </div>
          <div className="px-8 py-8 prose prose-sm max-w-none text-gray-700 space-y-6 overflow-y-auto max-h-[60vh]">
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">1. Definitions</h3><p>Platform means the Velor Marketplace at velorcommerce.store and all associated services. Seller means any individual or entity that registers to sell products on the Platform. Buyer means any person purchasing products through the Platform. Listing means any product offered for sale by a Seller. GMV means Gross Merchandise Value - the total value of sales processed through the Platform.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">2. Eligibility</h3><p>To become a Seller you must: (a) be at least 18 years of age; (b) have the legal capacity to enter into binding contracts in your jurisdiction; (c) operate a lawful business or sell goods you are legally entitled to sell; (d) complete identity and business verification as required by the Platform; (e) not be located in a country subject to applicable trade sanctions or export controls.</p><p className="mt-2">The Platform operates globally. Sellers are solely responsible for ensuring compliance with all laws applicable in their country of operation and in the countries they ship to.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">3. Account Registration &amp; Verification</h3><p>Sellers must provide accurate, complete, and current information during registration and keep it updated. The Platform requires identity verification (government-issued ID) and, where applicable, business registration documentation before a Seller account becomes fully active. The Platform reserves the right to suspend or terminate accounts where verification cannot be completed or where false information has been provided.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">4. Platform Fees &amp; Commission</h3><p>The Platform charges commission on each sale. Rates depend on your subscription tier:</p><ul className="list-disc pl-5 mt-2 space-y-1"><li><strong>Starter (Free):</strong> 15% commission on GMV. Maximum 50 active listings. Basic analytics.</li><li><strong>Pro (49/month):</strong> 8% commission on GMV. Unlimited listings. Full analytics, custom storefront, featured listing slots, priority review, discount code tools.</li><li><strong>Enterprise (Negotiated):</strong> 4-5% commission on GMV. Unlimited listings. All Pro features plus dedicated account manager, API access, custom reporting.</li></ul><p className="mt-2">Commission is deducted from each transaction before payout. Subscription fees are billed monthly via Stripe and are non-refundable except where required by applicable law. The Platform reserves the right to adjust fee structures with 30 days notice.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">5. Payouts</h3><p>Seller earnings (GMV minus platform commission) are transferred to your connected Stripe account within 3 business days of confirmed delivery. Minimum payout thresholds apply: 50 GBP for Starter accounts, 20 GBP for Pro and Enterprise. A reserve of 5% of cumulative earnings may be held for up to 90 days for new sellers to cover potential disputes or chargebacks.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">6. Prohibited Items</h3><p>The following are strictly prohibited: weapons, firearms, controlled substances, counterfeit goods, adult content, hazardous materials, live animals subject to CITES restrictions, human remains, stolen goods, financial instruments, items subject to trade sanctions, and any item prohibited under UK, EU, or US law.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">7. Seller Responsibilities</h3><p>Sellers are solely responsible for: (a) accuracy of all product descriptions and images; (b) holding appropriate title to sell all listed items; (c) fulfilling orders promptly; (d) packaging goods safely; (e) complying with consumer protection regulations in destination countries; (f) handling customer service professionally; (g) providing tracking information for all shipments.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">8. Returns &amp; Disputes</h3><p>Sellers must honour a minimum 14-day return policy for all physical goods. In the event of a buyer dispute, the Platform may mediate. If a chargeback is initiated, the disputed amount plus chargeback fees may be deducted from the Seller earnings or reserve.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">9. Platform Rights &amp; Enforcement</h3><p>The Platform reserves the right to: (a) remove any listing at its sole discretion; (b) suspend or terminate a Seller account for breach of these terms; (c) withhold payouts pending investigation of suspected fraud; (d) modify these terms with 30 days notice to active Sellers.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">10. Data Protection</h3><p>The Platform processes Seller personal data in accordance with its Privacy Policy and UK GDPR. Seller data is shared with Stripe Inc. solely for processing transactions and payouts. Buyer shipping data must only be used for fulfilment.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">11. Intellectual Property</h3><p>Sellers retain ownership of their original product images and descriptions. By listing on the Platform, Sellers grant the Platform a non-exclusive licence to display listing content for operating and promoting the Platform. Sellers must not list products that infringe third-party intellectual property rights.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">12. Tax Obligations</h3><p>Sellers are solely responsible for determining and fulfilling their own tax obligations, including income tax, VAT, GST, and import duties. The Platform does not provide tax advice or remit taxes on behalf of Sellers.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">13. Limitation of Liability</h3><p>The Platform total liability to a Seller shall not exceed the total commission paid by that Seller in the 3 months preceding the claim. The Platform is not liable for indirect, consequential, incidental, or punitive damages.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">14. Independent Contractor</h3><p>Sellers are independent contractors. Nothing in these terms creates an employment, partnership, or agency relationship between the Seller and the Platform.</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">15. Governing Law</h3><p>These terms are governed by the laws of England and Wales. Disputes shall be submitted to binding arbitration under the rules of the London Court of International Arbitration (LCIA).</p></section>
            <section><h3 className="text-base font-semibold text-gray-900 mb-2">16. Entire Agreement</h3><p>These terms, together with the Platform Privacy Policy, constitute the entire agreement between the Seller and the Platform. If any provision is found unenforceable, the remaining provisions continue in full force.</p></section>
            <p className="text-gray-400 text-xs pt-4 border-t border-gray-100">Effective date: 1 July 2026 - Version 1.0 - Operated by Velor Commerce - Contact: customerservice@velorcommerce.co.uk</p>
          </div>
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
              <span className="text-sm text-gray-700">I have read and agree to the Velor Marketplace Seller Agreement (v1.0, July 2026). I confirm I have the legal authority to bind myself or my business to these terms.</span>
            </label>
            <button onClick={handleAccept} disabled={!accepted || loading} className="w-full bg-gray-900 text-white font-semibold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors text-sm">
              {loading ? 'Saving...' : 'Accept and Enter Dashboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
