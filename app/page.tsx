import Link from 'next/link';
const categories = [
  { name: 'Fitness and Gym', slug: 'fitness-gym' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Home and Garden', slug: 'home-garden' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Outdoor Living', slug: 'outdoor' },
];
export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#0D0D0D', minHeight: '100vh' }}>
      <section style={{ padding: '80px 24px', textAlign: 'center', borderBottom: '1px solid #2A2A2A' }}>
        <p style={{ color: '#FF6B00', fontSize: '12px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>The Global AI Marketplace</p>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: '24px' }}>Sell to the world.<br />Buy with confidence.</h1>
        <p style={{ color: '#999999', fontSize: '18px', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>Velor connects independent sellers with buyers across 180+ countries. AI-powered, zero friction, built for scale.</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/shop" style={{ backgroundColor: '#FF6B00', color: '#FFFFFF', padding: '16px 32px', borderRadius: '8px', fontWeight: 700, fontSize: '16px', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif' }}>Shop Now</Link>
          <Link href="/sell" style={{ backgroundColor: 'transparent', color: '#FFFFFF', padding: '16px 32px', borderRadius: '8px', fontWeight: 700, fontSize: '16px', textDecoration: 'none', border: '1px solid #2A2A2A', fontFamily: 'Space Grotesk, sans-serif' }}>Start Selling</Link>
        </div>
      </section>
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 700, color: '#FFFFFF', marginBottom: '32px', textAlign: 'center' }}>Shop by Category</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {categories.map((cat) => (
            <Link key={cat.slug} href={'/shop?category=' + cat.slug} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '28px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#FFFFFF', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '15px', textAlign: 'center' }}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
      <section style={{ padding: '60px 24px', borderTop: '1px solid #2A2A2A' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          {[
            { title: 'Global Reach', desc: 'Sell to 180+ countries from day one. AI handles localisation, currency, and compliance.' },
            { title: 'Zero Setup Fees', desc: 'List your products for free. We take a small commission only when you sell.' },
            { title: 'AI-Powered Listings', desc: 'Our AI writes your product descriptions, sets optimal prices, and finds your buyers.' },
          ].map((item) => (
            <div key={item.title} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '32px' }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 700, color: '#FF6B00', marginBottom: '12px' }}>{item.title}</h3>
              <p style={{ color: '#999999', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
