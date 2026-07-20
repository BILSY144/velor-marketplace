// Privacy-safe display identities for buyer <-> seller messaging.
//
// Rule (William, 2026-07-20): the other party in a conversation never sees
// your email address, and buyers are never shown by full real name. Sellers
// appear as their store name (the same name shown on product pages); buyers
// appear as "First L."; nobody's email leaves the server.

import { prisma } from '@/lib/prisma'

export function maskPersonalName(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return 'Velor member'
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0]
  return parts[0] + ' ' + parts[parts.length - 1][0].toUpperCase() + '.'
}

// Resolve a set of user ids to display names: store name if the user has a
// Seller record, otherwise their masked personal name.
export async function displayIdentities(userIds: string[]): Promise<Map<string, string>> {
  const ids = Array.from(new Set(userIds)).filter(Boolean)
  if (ids.length === 0) return new Map()
  const [users, sellers] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
    prisma.seller.findMany({ where: { userId: { in: ids } }, select: { userId: true, storeName: true } }),
  ])
  const storeByUser = new Map(sellers.map((s) => [s.userId, s.storeName]))
  const out = new Map<string, string>()
  for (const u of users) {
    out.set(u.id, storeByUser.get(u.id) ?? maskPersonalName(u.name))
  }
  return out
}
