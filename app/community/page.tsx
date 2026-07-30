// THE MAKERS' CIRCLE -- Velor's community hub.
//
// William's design (2026-07-30, verbatim: "take everything out of my design
// and replicate it exactly the same non negoatiable") is kept 1:1 for every
// section EXCEPT the three swapped out below -- William, 2026-08-01: "yes"
// to swapping "Featured Today", the Creator Journals preview, and the Ask
// The Maker preview to live data, now that real sellers/journals/Q&A exist.
// Everything else on this page (Workshop Videos, Live Shopping, Around the
// World, Buyer's Collections, Community Challenge, Learning Centre, Follow
// Countries, Maker Passport, the hero, the story banner, the trust strip)
// stays exactly as his design file, untouched, per his standing instruction
// -- those sections need real infrastructure that doesn't exist yet
// (a video library, a real live-shopping flow, a rewards system, a
// passport/verification model), not just a data swap.
//
// This file is now a real server component: it fetches whatever is
// genuinely live (the newest cross-seller journal entry with its real
// like/comment counts, up to four cards of real "happening now" activity --
// sellers live on air first, then the freshest journal posts, one card per
// seller so a single active maker doesn't fill the whole grid --  and the
// newest real published questions) and hands it to the client component
// that renders the interactive page. Honest "nothing yet" states everywhere
// real data is thin or empty -- never a fallback to invented content.

import { prisma } from '@/lib/prisma'
import { countryToCode } from '@/lib/payoutRail'
import CommunityPageClient, { type FeaturedCard, type JournalPreview, type AskRow } from './CommunityPageClient'

function publiclyVisibleWhere() {
  return {
    OR: [
      { status: 'PUBLISHED' as const },
      { status: 'SCHEDULED' as const, scheduledAt: { lte: new Date() } },
    ],
  }
}

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return <CommunityPageClient featuredCards={[]} journalPreview={null} askRows={[]} />
  }

  const [liveNow, freshPosts, latestJournal, questions] = await Promise.all([
    prisma.liveStream.findMany({
      where: { status: 'LIVE', seller: { approved: true } },
      select: {
        id: true,
        roomName: true,
        seller: { select: { id: true, storeName: true, storeLogo: true, country: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 4,
    }),
    prisma.journalPost.findMany({
      where: { ...publiclyVisibleWhere(), seller: { approved: true } },
      select: {
        id: true,
        title: true,
        body: true,
        images: true,
        seller: { select: { id: true, storeName: true, storeLogo: true, country: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 12, // pulled extra so we can dedupe down to one card per seller
    }),
    prisma.journalPost.findFirst({
      where: { ...publiclyVisibleWhere(), seller: { approved: true } },
      select: {
        title: true,
        body: true,
        images: true,
        seller: { select: { id: true, storeLogo: true } },
        _count: { select: { likes: true, comments: { where: { status: 'PUBLISHED' } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sellerQuestion.findMany({
      where: { status: 'PUBLISHED', seller: { approved: true } },
      select: {
        id: true,
        body: true,
        seller: { select: { id: true } },
        _count: { select: { answers: { where: { status: 'PUBLISHED' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ])

  // Live sellers first, then freshest journal posts -- one card per seller,
  // capped at four, real activity only.
  const seenSellers = new Set<string>()
  const featuredCards: FeaturedCard[] = []
  for (const l of liveNow) {
    if (featuredCards.length >= 4 || seenSellers.has(l.seller.id)) continue
    seenSellers.add(l.seller.id)
    featuredCards.push({
      key: l.id,
      img: l.seller.storeLogo,
      name: l.seller.storeName,
      cc: countryToCode(l.seller.country),
      country: l.seller.country || 'Velor maker',
      line: 'Live right now.',
      cta: 'Watch live',
      ctaIcon: true,
      href: `/live/${l.roomName}`,
    })
  }
  for (const p of freshPosts) {
    if (featuredCards.length >= 4 || seenSellers.has(p.seller.id)) continue
    seenSellers.add(p.seller.id)
    featuredCards.push({
      key: p.id,
      img: p.images[0] || p.seller.storeLogo,
      name: p.seller.storeName,
      cc: countryToCode(p.seller.country),
      country: p.seller.country || 'Velor maker',
      line: p.title || p.body.slice(0, 70),
      cta: 'View journal',
      ctaIcon: false,
      href: `/seller/${p.seller.id}`,
    })
  }

  const journalPreview: JournalPreview | null = latestJournal
    ? {
        title: latestJournal.title,
        body: latestJournal.body,
        image: latestJournal.images[0] || latestJournal.seller.storeLogo,
        likes: latestJournal._count.likes,
        comments: latestJournal._count.comments,
      }
    : null

  const askRows: AskRow[] = questions.map((q) => ({
    id: q.id,
    q: q.body.length > 72 ? `${q.body.slice(0, 72)}…` : q.body,
    n: q._count.answers,
    href: `/seller/${q.seller.id}#ask-the-maker`,
  }))

  return <CommunityPageClient featuredCards={featuredCards} journalPreview={journalPreview} askRows={askRows} />
}
