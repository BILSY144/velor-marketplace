// New-account rate limits (2026-07-29), per the signed online safety
// policy's build list: accounts younger than NEW_ACCOUNT_DAYS get a daily
// cap on outbound messages and reviews, blunting throwaway-account spam and
// grooming-style contact patterns without touching established members.
// Listings are not capped here -- every listing already passes moderation
// before a buyer can see it.

import { prisma } from '@/lib/prisma'

export const NEW_ACCOUNT_DAYS = 7
export const NEW_ACCOUNT_MESSAGES_PER_DAY = 20
export const NEW_ACCOUNT_REVIEWS_PER_DAY = 5

function isNewAccount(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() < NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000
}

/** Returns an error string if the send should be refused, else null. */
export async function checkNewAccountMessageLimit(userId: string, createdAt: Date): Promise<string | null> {
  if (!isNewAccount(createdAt)) return null
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const sent = await prisma.message.count({ where: { senderId: userId, createdAt: { gte: dayAgo } } })
  if (sent >= NEW_ACCOUNT_MESSAGES_PER_DAY) {
    return `New accounts can send up to ${NEW_ACCOUNT_MESSAGES_PER_DAY} messages a day for their first week. Please try again tomorrow.`
  }
  return null
}

/** Returns an error string if the review should be refused, else null. */
export async function checkNewAccountReviewLimit(userId: string, createdAt: Date): Promise<string | null> {
  if (!isNewAccount(createdAt)) return null
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const posted = await prisma.review.count({ where: { userId, createdAt: { gte: dayAgo } } })
  if (posted >= NEW_ACCOUNT_REVIEWS_PER_DAY) {
    return `New accounts can post up to ${NEW_ACCOUNT_REVIEWS_PER_DAY} reviews a day for their first week. Please try again tomorrow.`
  }
  return null
}
