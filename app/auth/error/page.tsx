'use client'

// auth.ts configures `pages: { error: '/auth/error' }`, meaning NextAuth
// redirects here on any sign-in failure (bad OAuth callback, blocked
// account, misconfiguration, etc). This page did not exist until the
// 2026-07-16 readiness audit caught it -- until now, a NextAuth error sent
// users to a default Next.js 404, which looks broken and gives no way back
// into the sign-in flow. Styled to match app/auth/sign-in/page.tsx.

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration. Please try again shortly.',
  AccessDenied: 'Access was denied. You may not have permission to sign in with that account.',
  Verification: 'That sign-in link has expired or has already been used.',
  OAuthSignin: 'There was a problem starting the sign-in with that provider.',
  OAuthCallback: 'There was a problem completing the sign-in with that provider.',
  OAuthCreateAccount: 'We could not create an account using that provider.',
  EmailCreateAccount: 'We could not create an account with that email.',
  Callback: 'There was a problem completing sign-in.',
  OAuthAccountNotLinked: 'That email is already associated with a different sign-in method. Please sign in using your original method.',
  CredentialsSignin: 'Invalid email or password.',
  SessionRequired: 'Please sign in to access that page.',
  Default: 'Something went wrong while signing you in.',
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('error') || 'Default'
  const message = ERROR_MESSAGES[code] || ERROR_MESSAGES.Default

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D0D0D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        padding: '24px',
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;600&display=swap"
        rel="stylesheet"
      />
      <Link
        href="/"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: '20px',
          color: '#FF6B00',
          textDecoration: 'none',
          letterSpacing: '-0.5px',
        }}
      >
        VELOR
      </Link>

      <div
        style={{
          background: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '16px',
          padding: '48px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '28px',
            color: '#FFFFFF',
            margin: '0 0 8px',
          }}
        >
          Sign-in error
        </h1>
        <p style={{ color: '#999999', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
          {message}
        </p>

        <div
          style={{
            background: 'rgba(255,23,68,0.1)',
            border: '1px solid #FF1744',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#FF1744',
            fontSize: '13px',
            marginBottom: '28px',
          }}
        >
          Error code: {code}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/auth/sign-in"
            style={{
              display: 'block',
              textAlign: 'center',
              background: '#FF6B00',
              color: '#0D0D0D',
              fontWeight: 700,
              fontSize: '15px',
              padding: '14px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Back to sign in
          </Link>
          <Link
            href="/"
            style={{
              display: 'block',
              textAlign: 'center',
              background: 'transparent',
              border: '1px solid #2A2A2A',
              color: '#999999',
              fontWeight: 600,
              fontSize: '15px',
              padding: '14px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorContent />
    </Suspense>
  )
}
