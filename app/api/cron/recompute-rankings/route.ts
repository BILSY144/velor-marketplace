import { NextRequest, NextResponse } from 'next/server'
import { recomputeAllSellerScores } from '@/lib/seller-ranking'
import { requireCronSecret } from '@/lib/cronAuth'

export const maxDuration = 60

// Daily cron — authoritative recompute of every seller's ranking score.
// Vercel Cron sends Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set.
export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError

  const result = await recomputeAllSellerScores()
  return NextResponse.json({ ok: true, ...result })
}
