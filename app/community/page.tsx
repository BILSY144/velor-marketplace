// THE MAKERS' CIRCLE -- Velor's community hub.
//
// William's design (2026-07-30, verbatim: "take everything out of my design
// and replicate it exactly the same non negoatiable") is kept 1:1 for every
// section EXCEPT the ones swapped to live data below, per William's
// confirmed decisions:
//
//  - 2026-08-01: "Featured Today", Creator Journals preview, Ask The Maker
//    preview -> real data (sellers, journal entries, published questions).
//  - 2026-08-02: Around the World, Workshop Videos, Follow Countries,
//    Maker Passport -> real data. Learning Centre -> real YouTube videos of
//    outside craftspeople as a labelled bridge until sellers upload their
//    own (William confirmed: "clearly labelled as guest content").
//  - 2026-07-30: Buyer's Collections -> real data. William confirmed he'd
//    signed the OSA pack (docs/osa/ -- all five documents now show SIGNED,
//    not DRAFT) and approved building the previously-missing public
//    browsing surface. That required more than a data swap: buyers had no
//    way to make a collection public at all before this (the account page
//    hardcoded every collection as "Private to you"), so a real
//    public/private toggle with plain-language consent copy was added
//    (app/account/collections/page.tsx, PATCH on
//    app/api/social/collections/route.ts) alongside the DPIA addendum and a
//    new "Community & Social Features" section in the privacy policy. This
//    box only ever shows collections a buyer explicitly opted into.
//
// Community Challenge and Live Shopping still have no backing model/feature
// (no contest, submission, voting, or live-chat table) and stay the
// design's own placeholder content.
//
// Honest "nothing yet" states everywhere real data is thin or empty --
// never a fallback to invented content.

import { prisma } from '@/lib/prisma'
import { countryToCode } from '@/lib/payoutRail'
import { maskPersonalName } from '@/lib/messageIdentity'
import CommunityPageClient, {
  type FeaturedCard,
  type JournalPreview,
  type AskRow,
  type WorldStats,
  type CountryRow,
  type WorkshopVideo,
  type MakerPassport,
  type PublicCollection,
} from './CommunityPageClient'

function publiclyVisibleWhere() {
  return {
    OR: [
      { status: 'PUBLISHED' as const },
      { status: 'SCHEDULED' as const, scheduledAt: { lte: new Date() } },
    ],
  }
}

// Real YouTube videos of craftspeople who are NOT Velor sellers -- an
// explicit, labelled bridge for the Learning Centre until makers upload
// their own (William, 2026-08-02: "clearly labelled as guest content").
// Sourced from real, existing public videos -- never invented video IDs or
// titles. Shown with a visible "guest video" label in the UI so it's never
// mistaken for Velor seller content.
const GUEST_LESSONS = [
  {
    href: 'https://www.youtube.com/watch?v=LzYDnlQvem0',
    thumb: 'https://img.youtube.com/vi/LzYDnlQvem0/hqdefault.jpg',
    title: 'How Leather Is Still Made Using an Ancient Method',
    country: 'Morocco',
  },
  {
    href: 'https://www.youtube.com/watch?v=LEusHADd6SU',
    thumb: 'https://img.youtube.com/vi/LEusHADd6SU/hqdefault.jpg',
    title: 'Life of a Traditional Japanese Pottery Craftsman',
    country: 'Japan',
  },
  {
    href: 'https://www.youtube.com/watch?v=sJMOrAW1vxw',
    thumb: 'https://img.youtube.com/vi/sJMOrAW1vxw/hqdefault.jpg',
    title: 'Alpaca Wool Clothing From Peru',
    country: 'Peru',
  },
  {
    href: 'https://www.youtube.com/watch?v=5UoZDpXtrPw',
    thumb: 'https://img.youtube.com/vi/5UoZDpXtrPw/hqdefault.jpg',
    title: 'Turkish Carpet Weaving',
    country: 'Turkey',
  },
]

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return (
      <CommunityPageClient
        featuredCards={[]}
        journalPreview={null}
        askRows={[]}
        worldStats={{ countries: 0, makers: 0, liveNow: 0, products: 0, journalEntries: 0 }}
        topCountries={[]}
        workshopVideos={[]}
        guestLessons={GUEST_LESSONS}
        passport={null}
        publicCollections={[]}
      />
    )
  }

  const [
    liveNow,
    freshPosts,
    latestJournal,
    questions,
    approvedSellers,
    liveNowCount,
    listedProductCount,
    journalPostCount,
    videoPosts,
    topSeller,
    publicCollectionRows,
  ] = await Promise.all([
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
    // Every approved seller's country -- powers both Around the World's
    // stats/spotlight and the Follow Countries list. Small table, cheap to
    // reduce in JS rather than fight groupBy's aggregate-orderBy syntax.
    prisma.seller.findMany({
      where: { approved: true },
      select: { country: true },
    }),
    prisma.liveStream.count({ where: { status: 'LIVE', seller: { approved: true } } }),
    prisma.product.count({ where: { status: 'APPROVED', seller: { approved: true } } }),
    prisma.journalPost.count({ where: { ...publiclyVisibleWhere(), seller: { approved: true } } }),
    prisma.journalPost.findMany({
      where: { ...publiclyVisibleWhere(), seller: { approved: true }, videoUrl: { not: null } },
      select: {
        id: true,
        title: true,
        images: true,
        seller: { select: { id: true, storeName: true, country: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    // Maker Passport spotlight -- the real approved seller with the most
    // followers (a plain, defensible "who's most followed" pick, not an
    // invented ranking).
    prisma.seller.findFirst({
      where: { approved: true },
      select: {
        id: true,
        storeName: true,
        storeLogo: true,
        country: true,
        foundingBadge: true,
        sellerBadge: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            journalPosts: { where: publiclyVisibleWhere() },
            orders: { where: { status: 'DELIVERED' } },
          },
        },
      },
      orderBy: { followers: { _count: 'desc' } },
    }),
    // Buyer's Collections -- ONLY ever collections the buyer explicitly
    // marked public via the toggle on their own collections page. Never
    // shows the buyer's real name, only the existing pseudonymous
    // "First L." format used everywhere else on Velor.
    prisma.collection.findMany({
      where: { isPublic: true, items: { some: {} } },
      select: {
        id: true,
        name: true,
        user: { select: { name: true } },
        items: {
          select: { product: { select: { images: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
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

  // Country -> seller count, most-represented first.
  const countryCounts = new Map<string, number>()
  for (const s of approvedSellers) {
    if (!s.country) continue
    countryCounts.set(s.country, (countryCounts.get(s.country) ?? 0) + 1)
  }
  const topCountries: CountryRow[] = Array.from(countryCounts.entries())
    .map(([name, count]) => ({ name, cc: countryToCode(name), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const worldStats: WorldStats = {
    countries: countryCounts.size,
    makers: approvedSellers.length,
    liveNow: liveNowCount,
    products: listedProductCount,
    journalEntries: journalPostCount,
  }

  const workshopVideos: WorkshopVideo[] = videoPosts.map((p) => ({
    id: p.id,
    title: p.title || 'Workshop video',
    image: p.images[0] || null,
    sellerName: p.seller.storeName,
    country: p.seller.country || 'Velor maker',
    href: `/seller/${p.seller.id}`,
  }))

  let passport: MakerPassport | null = null
  if (topSeller) {
    const videoCount = await prisma.journalPost.count({
      where: { sellerId: topSeller.id, videoUrl: { not: null } },
    })
    passport = {
      sellerId: topSeller.id,
      name: topSeller.storeName,
      storeLogo: topSeller.storeLogo,
      country: topSeller.country || 'Velor maker',
      cc: countryToCode(topSeller.country),
      founding: topSeller.foundingBadge,
      badge: topSeller.sellerBadge || 'NEW',
      memberSince: topSeller.createdAt.getFullYear().toString(),
      orders: topSeller._count.orders,
      followers: topSeller._count.followers,
      videos: videoCount,
      journalEntries: topSeller._count.journalPosts,
    }
  }

  const publicCollections: PublicCollection[] = publicCollectionRows.map((c) => ({
    id: c.id,
    name: c.name,
    image: c.items[0]?.product.images[0] || null,
    itemCount: c._count.items,
    by: maskPersonalName(c.user.name),
  }))

  return (
    <CommunityPageClient
      featuredCards={featuredCards}
      journalPreview={journalPreview}
      askRows={askRows}
      worldStats={worldStats}
      topCountries={topCountries}
      workshopVideos={workshopVideos}
      guestLessons={GUEST_LESSONS}
      passport={passport}
      publicCollections={publicCollections}
    />
  )
}
