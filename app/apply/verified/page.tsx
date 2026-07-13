import Link from 'next/link';
import { APPLICATION_SLA_HOURS } from '@/lib/sellerApplicationReview';

export const metadata = {
  title: 'Verification submitted — Velor',
  description: 'Your identity verification has been submitted to Velor.',
  alternates: { canonical: 'https://velorcommerce.store/apply/verified' },
  openGraph: {
    title: 'Verification submitted — Velor',
    description: 'Your identity verification has been submitted to Velor.',
    url: 'https://velorcommerce.store/apply/verified',
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
    title: 'Verification submitted — Velor',
    description: 'Your identity verification has been submitted to Velor.',
    images: ['https://velorcommerce.store/opengraph-image'],
  },
};

// Where Stripe Identity sends a seller after they finish (or abandon) the
// hosted document check. See return_url in lib/identity.ts.
//
// IMPORTANT: Stripe redirects here for EVERY outcome -- verified, requires
// input, cancelled -- and it does so before the webhook necessarily lands.
// So this page must never tell the seller they passed. The only honest thing
// it can say is "we have your submission, we will email you". The verdict
// arrives at app/api/webhooks/stripe-identity and is acted on by the hourly
// onboarding agent.
export default function VerificationSubmittedPage() {
  return (
    <main
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-body)',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <section className="velor-section" style={{ maxWidth: 1360, margin: '0 auto', padding: '72px 24px' }}>
        <div
          style={{
            maxWidth: 620,
            margin: '0 auto',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 'clamp(24px, 5vw, 44px)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.03)',
              fontSize: 12,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 20,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--green)' }} />
            Verification submitted
          </div>

          <h1
            className="velor-h2"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(24px, 4vw, 34px)',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              margin: '0 0 16px',
            }}
          >
            Thank you. We have your verification.
          </h1>

          <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7, margin: '0 0 18px' }}>
            Our verification provider is checking your document now. You do not need to do anything
            else, and you can close this page safely.
          </p>

          <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7, margin: '0 0 26px' }}>
            We will email you a decision on your application within{' '}
            <strong style={{ color: 'var(--text)' }}>{APPLICATION_SLA_HOURS} hours</strong> of your
            verification completing — whichever way it goes. If the check could not be completed, we
            will email you a link to try again.
          </p>

          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: '0 10px 10px 0',
              padding: '14px 16px',
              textAlign: 'left',
              margin: '0 0 28px',
            }}
          >
            <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              Velor never sees your document
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6 }}>
              Your ID was sent directly to Stripe, our verification provider. They hold it, not us.
              Velor receives only a pass or fail.
            </div>
          </div>

          <div className="velor-cta-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link
              href="/"
              style={{
                background: 'var(--accent)',
                color: '#000',
                fontWeight: 800,
                fontSize: 15,
                textDecoration: 'none',
                padding: '14px 28px',
                borderRadius: 999,
              }}
            >
              Back to Velor
            </Link>
            <Link
              href="/legal/seller-rules"
              style={{
                background: 'transparent',
                color: 'var(--text)',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                padding: '14px 28px',
                borderRadius: 999,
                border: '1px solid var(--border)',
              }}
            >
              Read the seller rules
            </Link>
          </div>

          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '24px 0 0' }}>
            Questions? Email{' '}
            <a href="mailto:customerservice@velorcommerce.co.uk" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              customerservice@velorcommerce.co.uk
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
