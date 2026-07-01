import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell on Velor | Reach Thousands of UK Fitness Buyers',
  description:
    'List your fitness products on Velor Marketplace. No upfront fees. 15% commission only on sales. Instant Stripe payouts. Set up in minutes.',
};

export default function SellOnVelorPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=Inter:wght@400;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sov-root {
          background: #0D0D0D;
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
        }

        /* HERO */
        .sov-hero {
          background: #0D0D0D;
          padding: 100px 24px 80px;
          text-align: center;
          border-bottom: 1px solid #2A2A2A;
        }
        .sov-hero-eyebrow {
          display: inline-block;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #FF6B00;
          border: 1px solid #FF6B00;
          border-radius: 4px;
          padding: 4px 12px;
          margin-bottom: 28px;
        }
        .sov-hero h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(40px, 6vw, 68px);
          font-weight: 800;
          line-height: 1.05;
          color: #FFFFFF;
          max-width: 820px;
          margin: 0 auto 24px;
          letter-spacing: -0.02em;
        }
        .sov-hero h1 span {
          color: #FF6B00;
        }
        .sov-hero-sub {
          font-family: 'Inter', sans-serif;
          font-size: 18px;
          font-weight: 400;
          color: #999999;
          max-width: 600px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }
        .sov-hero-cta {
          display: inline-block;
          background: #FF6B00;
          color: #FFFFFF;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.01em;
          padding: 18px 48px;
          border-radius: 6px;
          text-decoration: none;
          transition: background 0.15s;
          margin-bottom: 20px;
        }
        .sov-hero-cta:hover {
          background: #e05e00;
        }
        .sov-hero-trust {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #999999;
          margin-top: 4px;
        }

        /* STATS BAR */
        .sov-stats {
          display: flex;
          justify-content: center;
          gap: 0;
          background: #1A1A1A;
          border-bottom: 1px solid #2A2A2A;
        }
        .sov-stat {
          flex: 1;
          max-width: 320px;
          text-align: center;
          padding: 40px 24px;
          border-right: 1px solid #2A2A2A;
        }
        .sov-stat:last-child {
          border-right: none;
        }
        .sov-stat-number {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #FF6B00;
          line-height: 1;
          margin-bottom: 8px;
        }
        .sov-stat-label {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #999999;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* SECTION WRAPPER */
        .sov-section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 24px;
        }
        .sov-section-label {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #FF6B00;
          margin-bottom: 12px;
        }
        .sov-section-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 48px;
          line-height: 1.15;
        }

        /* HOW IT WORKS */
        .sov-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .sov-steps { grid-template-columns: 1fr; }
          .sov-stats { flex-direction: column; }
          .sov-stat { border-right: none; border-bottom: 1px solid #2A2A2A; }
          .sov-stat:last-child { border-bottom: none; }
          .sov-why-grid { grid-template-columns: 1fr !important; }
        }
        .sov-step-card {
          background: #1A1A1A;
          border: 1px solid #2A2A2A;
          border-radius: 10px;
          padding: 36px 28px;
          position: relative;
        }
        .sov-step-num {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 48px;
          font-weight: 800;
          color: #2A2A2A;
          line-height: 1;
          margin-bottom: 20px;
          user-select: none;
        }
        .sov-step-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 12px;
        }
        .sov-step-body {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #999999;
          line-height: 1.65;
        }
        .sov-step-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #FF6B00;
          border-radius: 10px 10px 0 0;
        }

        /* WHY VELOR */
        .sov-why-section {
          background: #111111;
          border-top: 1px solid #2A2A2A;
          border-bottom: 1px solid #2A2A2A;
        }
        .sov-why-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .sov-why-card {
          background: #1A1A1A;
          border: 1px solid #2A2A2A;
          border-radius: 10px;
          padding: 36px 32px;
        }
        .sov-why-icon {
          width: 44px;
          height: 44px;
          background: rgba(255, 107, 0, 0.12);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .sov-why-icon svg {
          width: 22px;
          height: 22px;
          stroke: #FF6B00;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .sov-why-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 19px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 10px;
        }
        .sov-why-body {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #999999;
          line-height: 1.65;
        }

        /* CATEGORIES */
        .sov-cats {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .sov-cat-pill {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #FF6B00;
          border: 1px solid #FF6B00;
          border-radius: 100px;
          padding: 8px 20px;
          background: rgba(255, 107, 0, 0.06);
        }

        /* CTA SECTION */
        .sov-cta-section {
          background: #1A1A1A;
          border-top: 1px solid #2A2A2A;
          border-bottom: 1px solid #2A2A2A;
          text-align: center;
          padding: 80px 24px;
        }
        .sov-cta-section h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        .sov-cta-section p {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          color: #999999;
          margin-bottom: 36px;
        }
        .sov-cta-btn {
          display: inline-block;
          background: #FF6B00;
          color: #FFFFFF;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 17px;
          font-weight: 700;
          padding: 18px 52px;
          border-radius: 6px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .sov-cta-btn:hover {
          background: #e05e00;
        }
        .sov-cta-sub {
          display: block;
          margin-top: 16px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #999999;
        }

        /* FAQ */
        .sov-faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sov-faq-item {
          background: #1A1A1A;
          border: 1px solid #2A2A2A;
          border-radius: 8px;
          padding: 28px 32px;
        }
        .sov-faq-q {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 12px;
        }
        .sov-faq-a {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #999999;
          line-height: 1.65;
        }
      `}</style>

      <div className="sov-root">

        {/* HERO */}
        <section className="sov-hero">
          <div className="sov-hero-eyebrow">Now accepting sellers</div>
          <h1>
            Sell to thousands of<br />
            <span>UK fitness buyers.</span>
          </h1>
          <p className="sov-hero-sub">
            List your products on Velor Marketplace &mdash; the UK&apos;s fastest-growing fitness
            and home equipment store. Set up in minutes, get paid instantly.
          </p>
          <div>
            <a href="/dashboard" className="sov-hero-cta">
              Start Selling Free
            </a>
          </div>
          <p className="sov-hero-trust">15% commission only when you sell. No monthly fees.</p>
        </section>

        {/* STATS BAR */}
        <div className="sov-stats">
          <div className="sov-stat">
            <div className="sov-stat-number">10,000+</div>
            <div className="sov-stat-label">Monthly Visitors</div>
          </div>
          <div className="sov-stat">
            <div className="sov-stat-number">15%</div>
            <div className="sov-stat-label">Commission Only</div>
          </div>
          <div className="sov-stat">
            <div className="sov-stat-number">2 days</div>
            <div className="sov-stat-label">Instant Stripe Payouts</div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section className="sov-section">
          <div className="sov-section-label">How it works</div>
          <h2 className="sov-section-title">Three steps to your first sale.</h2>
          <div className="sov-steps">
            <div className="sov-step-card">
              <div className="sov-step-num">01</div>
              <div className="sov-step-title">Create your seller account</div>
              <p className="sov-step-body">
                Sign up with your email, connect your Stripe account, and complete a quick
                identity check. Takes under 3 minutes.
              </p>
            </div>
            <div className="sov-step-card">
              <div className="sov-step-num">02</div>
              <div className="sov-step-title">List your products</div>
              <p className="sov-step-body">
                Upload photos, set your prices, and write your descriptions. Velor handles
                the storefront, SEO, and checkout &mdash; you just supply the product.
              </p>
            </div>
            <div className="sov-step-card">
              <div className="sov-step-num">03</div>
              <div className="sov-step-title">Get paid</div>
              <p className="sov-step-body">
                When a sale lands, funds hit your Stripe account within 2 business days.
                Velor retains a 15% commission. That is all we take.
              </p>
            </div>
          </div>
        </section>

        {/* WHY VELOR */}
        <div className="sov-why-section">
          <section className="sov-section">
            <div className="sov-section-label">Why Velor</div>
            <h2 className="sov-section-title">Built for sellers, not platforms.</h2>
            <div className="sov-why-grid">

              <div className="sov-why-card">
                <div className="sov-why-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="sov-why-title">Zero upfront cost</div>
                <p className="sov-why-body">
                  No listing fees. No monthly subscription. No setup charge.
                  You pay a 15% commission only on sales that actually happen.
                  If you do not sell, you pay nothing.
                </p>
              </div>

              <div className="sov-why-card">
                <div className="sov-why-icon">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M9 21V9"/>
                  </svg>
                </div>
                <div className="sov-why-title">Your own storefront</div>
                <p className="sov-why-body">
                  Your products live on a premium UK marketplace, not buried inside
                  Amazon&apos;s algorithm. Velor&apos;s brand drives traffic directly to
                  what you sell.
                </p>
              </div>

              <div className="sov-why-card">
                <div className="sov-why-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 1v22"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <div className="sov-why-title">Instant payouts</div>
                <p className="sov-why-body">
                  Stripe Connect means your earnings go directly to your bank account.
                  No platform holding funds for 30 days. No manual withdrawal requests.
                  Your money, fast.
                </p>
              </div>

              <div className="sov-why-card">
                <div className="sov-why-icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <div className="sov-why-title">UK-focused traffic</div>
                <p className="sov-why-body">
                  Every buyer on Velor is in the United Kingdom. No international
                  shipping headaches, no currency conversion, no customs forms.
                  Sell UK. Ship UK. Simple.
                </p>
              </div>

            </div>
          </section>
        </div>

        {/* CATEGORIES */}
        <section className="sov-section" style={{ paddingBottom: '40px' }}>
          <div className="sov-section-label">What we stock</div>
          <h2 className="sov-section-title">Categories we are looking for.</h2>
          <div className="sov-cats">
            {[
              'Home Gym Equipment',
              'Cardio Machines',
              'Recovery & Wellness',
              'Sports Accessories',
              'Outdoor Fitness',
              'Yoga & Pilates',
            ].map((cat) => (
              <div key={cat} className="sov-cat-pill">{cat}</div>
            ))}
          </div>
        </section>

        {/* CTA SECTION */}
        <div className="sov-cta-section">
          <h2>Ready to reach UK buyers?</h2>
          <p>Your products. Our platform. Let&apos;s grow together.</p>
          <a href="/dashboard" className="sov-cta-btn">
            Apply to Sell
          </a>
          <span className="sov-cta-sub">Takes 3 minutes. No credit card required.</span>
        </div>

        {/* FAQ */}
        <section className="sov-section">
          <div className="sov-section-label">FAQ</div>
          <h2 className="sov-section-title">Common questions.</h2>
          <div className="sov-faq-list">

            <div className="sov-faq-item">
              <div className="sov-faq-q">How much does it cost?</div>
              <p className="sov-faq-a">
                Nothing upfront. Velor takes a 15% commission on every sale you make.
                There are no listing fees, no monthly subscriptions, and no setup costs.
                That is it.
              </p>
            </div>

            <div className="sov-faq-item">
              <div className="sov-faq-q">When do I get paid?</div>
              <p className="sov-faq-a">
                Payouts are processed via Stripe Connect directly to your bank account,
                typically within 2 business days of a completed sale. You connect your
                own Stripe account during onboarding &mdash; Velor never holds your funds.
              </p>
            </div>

            <div className="sov-faq-item">
              <div className="sov-faq-q">What can I sell?</div>
              <p className="sov-faq-a">
                Fitness equipment, home gym gear, cardio machines, recovery tools, and
                sports accessories. We do not accept clothing, shoes, or food products.
                If you are unsure whether your product fits, apply and we will let you know.
              </p>
            </div>

          </div>
        </section>

      </div>
    </>
  );
}
