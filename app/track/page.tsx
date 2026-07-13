export const metadata = {
  title: 'Track Your Order - Velor Commerce',
  alternates: { canonical: 'https://velorcommerce.store/track' },
  openGraph: {
    title: 'Track Your Order - Velor Commerce',
    url: 'https://velorcommerce.store/track',
    siteName: 'Velor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Track Your Order - Velor Commerce',
  },
}

export default function Page() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '72vh', padding: '72px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 800, color: 'var(--text)', margin: '0 0 20px', letterSpacing: '-1px' }}>Track your order</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>To track an order, sign in and open <a href="/orders" style={{ color: 'var(--accent)' }}>Your Orders</a>. Each order shows its current status and, once shipped, a tracking link.</p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>If a tracking number has not appeared yet, the seller may still be preparing your item for dispatch.</p>
      </div>
    </main>
  )
}
