import { NextRequest, NextResponse } from 'next/server'
import { recomputeAllSellerScores } from '@/lib/seller-ranking'

export const maxDuration = 60

// Daily cron — authoritative recompute of every seller's ranking score.
// Vercel Cron sends Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await recomputeAllSellerScores()
  return NextResponse.json({ ok: true, ...result })
}
