import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import SellerJournalView from '../SellerJournalView'

// The REAL per-seller journal page in William's journal-page design --
// what the showcase at /community/journals demonstrates, filled with a
// living seller's actual published entries. "View as buyer" on the
// Creator Journals dashboard lands here (William, 2026-07-30: "when i
// click as view as buyer button it doesnt show me a sellers journal page
// like we designed"). Placeholder-free: every figure is real; sections a
// seller hasn't written yet render as honest awaiting-content slots.

export const dynamic = 'force-dynamic'

function NoJournalYet({ storeName }: { storeName?: string }) {
  return (
    <main style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--bg)', color: 'var(--text)', textAlign: 'center', padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 26 }}>{storeName ? `${storeName}'s journal is just beginning` : 'This journal is just beginning'}</h1>
      <p style={{ color: 'var(--muted)', maxWidth: 460, lineHeight: 1.6, margin: 0 }}>
        No entries have been published yet. Follow the maker on their storefront and the first story will find you.
      </p>
      <Link href="/community" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Back to The Makers&rsquo; Circle &rarr;</Link>
    </main>
  )
}

export default async function SellerJournalPage({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params
  if (process.env.VELOR_SOCIAL_ENABLED !== 'true') return <NoJournalYet />

  const seller = await prisma.seller.findFirst({
    where: { id: sellerId, approved: true },
    select: {
      id: true, storeName: true, description: true, country: true,
      storeLogo: true, foundingBadge: true, createdAt: true, currency: true,
    },
  })
  if (!seller) return <NoJournalYet />

  const posts = await prisma.journalPost.findMany({
    where: {
      sellerId: seller.id,
      OR: [
        { status: 'PUBLISHED' },
        { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
      ],
    },
    select: {
      id: true, title: true, body: true, images: true, videoUrl: true,
      createdAt: true, category: true, viewCount: true,
      makingProcess: true, notesTips: true, behindScenes: true, productIds: true,
      _count: { select: { likes: true, comments: { where: { status: 'PUBLISHED' } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  if (posts.length === 0) return <NoJournalYet storeName={seller.storeName} />

  const [followers, listings] = await Promise.all([
    prisma.follow.count({ where: { sellerId: seller.id } }),
    prisma.product.count({ where: { sellerId: seller.id, status: 'APPROVED' } }),
  ])

  // Every listing tagged across the entries, resolved once.
  const taggedIds = Array.from(new Set(posts.flatMap((p) => p.productIds)))
  const products = taggedIds.length
    ? await prisma.product.findMany({
        where: { id: { in: taggedIds }, sellerId: seller.id, status: 'APPROVED' },
        select: { id: true, title: true, price: true, images: true },
      })
    : []

  return (
    <SellerJournalView
      seller={{
        id: seller.id,
        storeName: seller.storeName,
        description: seller.description,
        country: seller.country,
        storeLogo: seller.storeLogo,
        foundingBadge: seller.foundingBadge ?? false,
        currency: seller.currency || 'GBP',
        memberSince: seller.createdAt.getFullYear(),
        followers,
        listings,
      }}
      posts={posts.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        images: p.images,
        videoUrl: p.videoUrl,
        createdAt: p.createdAt.toISOString(),
        category: p.category,
        viewCount: p.viewCount,
        makingProcess: p.makingProcess,
        notesTips: p.notesTips,
        behindScenes: p.behindScenes,
        productIds: p.productIds,
        likes: p._count.likes,
        comments: p._count.comments,
      }))}
      products={products.map((pr) => ({ id: pr.id, title: pr.title, price: pr.price, image: pr.images[0] || null }))}
    />
  )
}
