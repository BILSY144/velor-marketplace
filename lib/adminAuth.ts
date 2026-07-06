import { NextRequest } from 'next/server'
import { auth } from '@/auth'

// Shared admin-access check used by internal reporting/admin API routes.
// Accepts EITHER a logged-in NextAuth session with role ADMIN (used when
// William is browsing the dashboard himself) OR a matching x-admin-secret
// header (used for Claude's permanent programmatic access, and any future
// server-to-server calls). Never log or echo the secret value.
export async function isAuthorizedAdmin(request?: NextRequest): Promise<boolean> {
  if (request) {
    const headerSecret = request.headers.get('x-admin-secret')
    if (headerSecret && process.env.ADMIN_SECRET && headerSecret === process.env.ADMIN_SECRET) {
      return true
    }
  }

  const session = await auth()
  if (session?.user && (session.user as { role?: string }).role === 'ADMIN') {
    return true
  }

  return false
}
