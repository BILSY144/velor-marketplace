export default function AboutPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>About Velor</p>
        <h1 style={{ fontSize: 48, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1, marginBottom: 24 }}>
          A marketplace built for everyone.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--muted)', marginBottom: 20 }}>
          Velor is a global multi-vendor marketplace connecting independent sellers with buyers worldwide. We believe commerce should be open, fair, and accessible to anyone with something great to offer.
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--muted)', marginBottom: 20 }}>
          Our platform handles payments, seller onboarding, and buyer protection â so sellers can focus on their products and buyers can shop with confidence.
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--muted)', marginBottom: 48 }}>
          Velor Commerce Ltd is registered in England and Wales. We operate globally: sellers can list from, and ship to, 190 countries.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 64 }}>
          {[
            { label: 'Platform fee', value: '15%', note: 'Competitive and transparent' },
            { label: 'Countries', value: '190', note: 'Sell to, and ship from, anywhere' },
            { label: 'Currencies', value: '20', note: 'Multi-currency checkout' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 24px' }}>
              <p style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent)', marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{s.note}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 16 }}>Our values</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
          {[
            { title: 'Transparency', desc: 'Clear fees, clear policies. No hidden charges.' },
            { title: 'Fairness', desc: 'Sellers keep 85% of every sale. Buyers are protected on every order.' },
            { title: 'Global by default', desc: 'Multi-currency, multi-language ready â built to scale from day one.' },
          ].map(v => (
            <div key={v.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px' }}>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{v.title}</p>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>{v.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 28px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Want to sell on Velor?</h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 20 }}>Apply to become a seller and reach buyers worldwide.</p>
          <a href="/sell-on-velor" style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', textDecoration: 'none', padding: '14px 28px', borderRadius: 8, fontWeight: 600, fontSize: 15 }}>Apply now</a>
        </div>
      </section>
    </main>
  );
}
