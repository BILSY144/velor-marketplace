export const metadata = { title: 'Contact - Velor Commerce' }

export default function Page() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '72vh', padding: '72px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 800, color: 'var(--text)', margin: '0 0 20px', letterSpacing: '-1px' }}>Contact us</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>Questions about selling or buying on Velor? We are happy to help.</p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>Email us at <a href='mailto:hello@velorcommerce.store' style={{ color: 'var(--accent)' }}>hello@velorcommerce.store</a> and we will reply within 1 to 2 business days.</p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>Velor Commerce Ltd, a global online marketplace.</p>
      </div>
    </main>
  )
}
