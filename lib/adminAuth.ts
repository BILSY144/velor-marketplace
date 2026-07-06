import { NextRequest } from 'next/server'
import { auth } from '@/auth'

// Shared admin-access check used by internal reporting/admin API routes.
// Accepts EITHER a logged-in NextAuth session with role ADMIN (used when
// William is browsing the dashboard himself) OR a matching 'Authorization:
// Bearer <ADMIN_SECRET>' header -- the same convention middleware.ts already
// enforces on /api/admin/* routes -- used for Claude's permanent programmatic
// access and any other server-to-server calls. Never log or echo the secret.
export async function isAuthorizedAdmin(request?: NextRequest): Promise<boolean> {
  if (request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && process.env.ADMIN_SECRET && authHeader === 'Bearer ' + process.env.ADMIN_SECRET) {
      return true
    }
  }

  const session = await auth()
  if (session?.user && (session.user as { role?: string }).role === 'ADMIN') {
    return true
  }

  return false
}
