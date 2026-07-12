export const metadata = { title: 'Returns and Refunds - Velor Commerce', alternates: { canonical: 'https://velorcommerce.store/returns' } }

export default function Page() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '72vh', padding: '72px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 800, color: 'var(--text)', margin: '0 0 20px', letterSpacing: '-1px' }}>Returns and refunds</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>Each seller on Velor sets and manages their own returns and refunds policy, shown on the product page before you buy.</p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>If you need to return an item, contact the seller through your order in Your Orders, or reach our team and we will help coordinate.</p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>Need a hand? Email <a href='mailto:hello@velorcommerce.store' style={{ color: 'var(--accent)' }}>hello@velorcommerce.store</a>.</p>
      </div>
    </main>
  )
}
