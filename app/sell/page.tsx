import SellerForm from '@/components/SellerForm';
export const metadata = { title: 'Sell on Velor Marketplace', description: 'Join thousands of sellers reaching global buyers on Velor.' };
export default function SellPage() {
  return (
    <div style={{ backgroundColor: '#0D0D0D', minHeight: '100vh', padding: '60px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ color: '#FF6B00', fontSize: '12px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>Become a Seller</p>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: '16px' }}>Reach buyers in 180+ countries</h1>
        <p style={{ color: '#999999', fontSize: '18px', lineHeight: 1.6, marginBottom: '48px', fontFamily: 'Inter, sans-serif' }}>List for free. Sell globally. Get paid fast.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {[{ stat: '180+', label: 'Countries Reached' }, { stat: 'Free', label: 'To List Products' }, { stat: '48h', label: 'Seller Approval' }].map((item) => (
            <div key={item.stat} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
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
