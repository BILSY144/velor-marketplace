export const metadata = { title: 'Shop — Velor Marketplace', description: 'Discover products from sellers around the world.' };
export default function ShopPage() {
  return (
    <div style={{ backgroundColor: '#0D0D0D', minHeight: '100vh', padding: '60px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '40px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>Shop</h1>
        <p style={{ color: '#999999', fontSize: '16px', fontFamily: 'Inter, sans-serif', marginBottom: '40px' }}>Discover products from independent sellers worldwide.</p>
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>Marketplace launching soon</h2>
          <p style={{ color: '#999999', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>We are onboarding our first wave of sellers. Check back shortly or apply to sell today.</p>
        </div>
      </div>
    </div>
  );
}
