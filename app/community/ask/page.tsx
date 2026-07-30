// Ask The Maker -- the real, live aggregator of Q&A across every seller's
// journal (2026-08-01, William: "make the makers circle live connected to
// all sellers, routed, wired correctly ... make this epic once and for
// all"). Previously this URL had no dedicated page at all and fell
// through to the honest "being built" placeholder in
// app/community/[section]/page.tsx. Real questions now exist (the
// per-seller "Ask the Maker" board built earlier today) -- this page
// gathers the newest ones from across the whole marketplace in one real,
// live feed, same "no algorithm, newest first" posture as the Workshop
// Feed. Each question deep-links back to its seller's journal at the
// #ask-the-maker anchor to read the full thread or answer it.

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { jpCss } from '../journals/jpStyles'
import { maskPersonalName } from '@/lib/messageIdentity'

function timeAgo(iso: string | Date): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const dynamic = 'force-dynamic'

export default async function AskTheMakerAggregator() {
  const socialEnabled = process.env.VELOR_SOCIAL_ENABLED === 'true'

  if (!socialEnabled) {
    return (
      <main className="jp-page">
        <style>{jpCss}</style>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h1 className="jp-sectitle">Ask The Maker</h1>
          <p className="jp-note" style={{ marginTop: 10 }}>Q&amp;A isn&rsquo;t switched on yet &mdash; check back soon.</p>
        </div>
      </main>
    )
  }

  const questions = await prisma.sellerQuestion.findMany({
    where: { status: 'PUBLISHED', seller: { approved: true } },
    select: {
      id: true,
      body: true,
      askerId: true,
      createdAt: true,
      seller: { select: { id: true, storeName: true, storeLogo: true, userId: true } },
      _count: { select: { answers: { where: { status: 'PUBLISHED' } } } },
      answers: {
        where: { status: 'PUBLISHED' },
        select: { id: true, body: true, authorId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 40,
  })

  const peopleIds = Array.from(new Set([
    ...questions.map((q) => q.askerId),
    ...questions.flatMap((q) => q.answers.map((a) => a.authorId)),
  ]))
  const people = peopleIds.length ? await prisma.user.findMany({ where: { id: { in: peopleIds } }, select: { id: true, name: true } }) : []
  const nameById = new Map(people.map((p) => [p.id, p.name]))

  return (
    <main className="jp-page">
      <style>{jpCss}</style>
      <nav className="jp-crumbs" aria-label="Breadcrumb">
        <Link href="/community">The Makers&rsquo; Circle</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="jp-crumb-here">Ask The Maker</span>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ padding: '10px 4px 28px' }}>
          <h1 className="jp-sectitle" style={{ fontSize: 32 }}>Ask The Maker</h1>
          <p className="jp-note" style={{ maxWidth: 640, marginTop: 8 }}>
            Real questions, answered by the maker or by other buyers &mdash; gathered from every seller&rsquo;s journal.
            To ask your own, visit any <Link href="/community/journals" className="jp-viewall" style={{ display: 'inline', marginTop: 0 }}>maker&rsquo;s journal</Link> and use their Ask box.
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="jp-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p className="jp-note" style={{ margin: 0 }}>No questions have been asked yet &mdash; the first one will appear here.</p>
          </div>
        ) : (
          <div className="jp-comments">
            {questions.map((q) => {
              const latestAnswer = q.answers[0] ?? null
              const answerIsSeller = latestAnswer ? latestAnswer.authorId === q.seller.userId : false
              return (
                <div key={q.id} className="jp-comment">
                  {q.seller.storeLogo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={q.seller.storeLogo} alt="" className="jp-comment-avatar" style={{ objectFit: 'cover' }} />
                  ) : (
                    <span className="jp-comment-avatar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF8A2B, #FF6B00)', color: '#fff', fontWeight: 700 }} aria-hidden="true">
                      {q.seller.storeName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="jp-comment-body">
                    <div className="jp-comment-top">
                      <span className="jp-comment-name">{maskPersonalName(nameById.get(q.askerId) ?? null)} asked <Link href={`/seller/${q.seller.id}`} style={{ color: 'var(--mc-gold)' }}>{q.seller.storeName}</Link></span>
                      <span className="jp-comment-time">{timeAgo(q.createdAt)}</span>
                    </div>
                    <p className="jp-comment-text">{q.body}</p>
                    {latestAnswer ? (
                      <div style={{ marginTop: 8, paddingLeft: 14, borderLeft: '2px solid var(--mc-goldline)' }}>
                        <div className="jp-comment-top">
                          <span className="jp-comment-name">{answerIsSeller ? `${q.seller.storeName} (Maker)` : maskPersonalName(nameById.get(latestAnswer.authorId) ?? null)}</span>
                          <span className="jp-comment-time">{timeAgo(latestAnswer.createdAt)}</span>
                        </div>
                        <p className="jp-comment-text">{latestAnswer.body}</p>
                      </div>
                    ) : (
                      <p className="jp-note" style={{ margin: '4px 0 0' }}>No answer yet.</p>
                    )}
                    <Link href={`/seller/${q.seller.id}#ask-the-maker`} className="jp-viewall" style={{ marginTop: 6 }}>
                      {q._count.answers > 1 ? `See all ${q._count.answers} answers` : 'Continue this conversation'} <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
