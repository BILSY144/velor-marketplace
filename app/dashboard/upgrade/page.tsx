import Link from 'next/link'

const TILES: { id: string; name: string; price: string; blurb: string; gradient: string }[] = [
  { id: 'starter', name: 'Starter', price: 'Free', blurb: 'Up to 20 listings · 12% commission', gradient: 'linear-gradient(160deg, #26262c 0%, #101012 100%)' },
  { id: 'pro', name: 'Pro', price: '£49/mo', blurb: 'Up to 200 listings · 8% commission', gradient: 'linear-gradient(160deg, #7c3aed 0%, #3b1177 100%)' },
  { id: 'enterprise', name: 'Enterprise', price: '£99/mo', blurb: 'Unlimited listings · 5% commission', gradient: 'linear-gradient(160deg, #f59e0b 0%, #7c2d12 100%)' },
]

export default function UpgradeIndexPage() {
  return (
    <div
      style={{
        height: 'calc(100dvh - 64px)', width: '100%', background: 'var(--bg)', color: 'var(--text)',
        fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>Seller plans</p>
        <Link href="/dashboard" style={{ fontSize: '13px', color: 'var(--muted)' }}>← Dashboard</Link>
      </header>
      <main style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 700, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>Choose a plan to view</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>Each plan has its own dedicated page with full details and payment.</p>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {TILES.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/upgrade/${t.id}`}
              style={{
                width: '220px', borderRadius: '16px', padding: '24px 22px', background: t.gradient,
                display: 'flex', flexDirection: 'column', gap: '8px', color: '#fff',
              }}
            >
              <span style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{t.name}</span>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{t.price}</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{t.blurb}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
