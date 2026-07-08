import SellerForm from '@/components/SellerForm';
import { APPLICATION_SLA_HOURS } from '@/lib/sellerApplicationReview';

export const metadata = {
  title: 'Sell on Velor Marketplace',
  description: 'List for free and reach buyers worldwide on Velor.',
};

// Every figure on this page must be true of the live platform.
//   190  = countries in lib/worldCountries.ts, the same list the shop-by-origin
//          flag strip and the seller application dropdown are built from.
//   20   = SUPPORTED_CURRENCIES in lib/currency.ts.
//   24h  = APPLICATION_SLA_HOURS, enforced by app/api/cron/review-applications.
// Do not write a number here that no code backs up. The old copy claimed
// "22 countries reached" and "48h approval"; neither was true of anything.
export default function SellPage() {
  const stats = [
    { stat: '190', label: 'Countries you can sell to' },
    { stat: 'Free', label: 'To List Products' },
    { stat: `${APPLICATION_SLA_HOURS}h`, label: 'Seller approval, guaranteed' },
  ];

  return (
    <div style={{ backgroundColor: '#0D0D0D', minHeight: '100vh', padding: '60px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ color: '#FF6B00', fontSize: '12px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>
          Become a Seller
        </p>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: '16px' }}>
          Reach buyers around the world
        </h1>
        <p style={{ color: '#999999', fontSize: '18px', lineHeight: 1.6, marginBottom: '48px', fontFamily: 'Inter, sans-serif' }}>
          List for free. Sell globally. Get a decision on your application within {APPLICATION_SLA_HOURS} hours.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {stats.map((item) => (
            <div key={item.label} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 800, color: '#FF6B00' }}>{item.stat}</div>
              <div style={{ color: '#999999', fontSize: '14px', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>{item.label}</div>
            </div>
          ))}
        </div>
        <SellerForm />
      </div>
    </div>
  );
}
