import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// One-time checkout that unlocks the full storefront theme library for a Starter seller.
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })

  if (!process.env.STRIPE_STOREFRONT_PRICE_ID) {
    return NextResponse.json({ error: 'Storefront unlock not configured' }, { status: 503 })
  }

  const s = seller as unknown as { tier?: string; storefrontUnlocked?: boolean }
  if (s.tier === 'PRO' || s.tier === 'ENTERPRISE' || s.storefrontUnlocked === true) {
    return NextResponse.json({ error: 'already_unlocked' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://velorcommerce.store'

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: process.env.STRIPE_STOREFRONT_PRICE_ID, quantity: 1 }],
    success_url: baseUrl + '/dashboard/storefront?unlocked=true',
    cancel_url: baseUrl + '/dashboard/storefront?cancelled=true',
    customer_email: session.user.email || undefined,
    metadata: { type: 'storefront_unlock', sellerId: seller.id },
  })

  return NextResponse.json({ checkoutUrl: checkout.url })
}
