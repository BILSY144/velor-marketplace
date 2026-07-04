import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: '18px',
          color: 'var(--accent)',
          letterSpacing: '0.1em',
          marginBottom: '28px',
        }}
      >
        VELOR
      </div>

      <div
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(48px, 8vw, 80px)',
          lineHeight: 1,
          color: 'var(--accent)',
          marginBottom: '16px',
        }}
      >
        404
      </div>

      <h1
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700,
          fontSize: '26px',
          margin: '0 0 12px',
        }}
      >
        We couldn&apos;t find that page
      </h1>

      <p
        style={{
          color: 'var(--muted)',
          fontSize: '15px',
          lineHeight: 1.6,
          maxWidth: '440px',
          margin: '0 0 32px',
        }}
      >
        The product or page you&apos;re looking for may have been removed, sold out, or the link
        might be out of date. Let&apos;s get you back on track.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
        <Link
          href="/shop"
          style={{
            background: 'var(--accent)',
            color: '#000',
            fontWeight: 800,
            fontSize: '15px',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: 999,
          }}
        >
          Browse the shop
        </Link>
        <Link
          href="/"
          style={{
            background: 'transparent',
            color: 'var(--text)',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: 999,
            border: '1px solid var(--border)',
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
