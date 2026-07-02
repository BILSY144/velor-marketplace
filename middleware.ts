import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Protect dashboard routes - require session
  if (pathname.startsWith('/dashboard')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }
  }

  // Protect admin API routes - require auth token
  if (pathname.startsWith('/api/admin')) {
    const secret = process.env.ADMIN_SECRET
    const authHeader = req.headers.get('authorization')
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
}
