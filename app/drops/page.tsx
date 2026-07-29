import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getOrCreateNextDrop, isDropLive, DROP_LIVE_HOURS } from '@/lib/drops'
import DropStage from '@/components/DropStage'
import DropSubscribe from '@/components/DropSubscribe'
import FollowSellerButton from '@/components/FollowSellerButton'
import SaveToCollectionButton from '@/components/SaveToCollectionButton'

// Fresh from the Workshop -- redesigned per the standing design directive
// (2026-07-29): a market square the moment before opening, not a product
// grid. Collage cards at varied sizes and slight rotations, a countdown
// theatre, a living maker strip, things to do while waiting.

export const dynamic = 'force-dynamic'

const SIZES = [
  { c: 'span 3', r: 'span 3', rot: '-1.2deg' },
  { c: 'span 2', r: 'span 2', rot: '0.9deg' },
  { c: 'span 1', r: 'span 2', rot: '-0.6deg' },
  { c: 'span 2', r: 'span 3', rot: '1.1deg' },
  { c: 'span 2', r: 'span 2', rot: '-0.8deg' },
  { c: 'span 1', r: 'span 2', rot: '0.7deg' },
]

export default async function DropsPage() {
  if (process.env.VELOR_SOCIAL_ENABLED === 'false') {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)' }}>The workshop is warming up</h1>
        <p style={{ color: 'var(--muted)' }}>Drops open soon. Check back shortly.</p>
      </main>
    )
  }
  const drop = await getOrCreateNextDrop()
  const live = isDropLive(drop.scheduledAt)
  const items = await prisma.dropItem.findMany({
    where: { dropId: drop.id, product: { status: 'APPROVED' } },
    select: {
      id: true,
      product: { select: { id: true, title: true, images: true, originCountry: true, seller: { select: { id: true, storeName: true, country: true, activeMaker: true } } } },
    },
    orderBy: { createdAt: 'asc' },
    take: 60,
  })
  items.sort((a, b) => Number(b.product.seller.activeMaker) - Number(a.product.seller.activeMaker))
  const makers = [...new Map(items.map(i => [i.product.seller.id, i.product.seller])).values()]
  const shards = items.slice(0, 5).map(i => i.product.images[0]).filter(Boolean)
  const gold = 'var(--gold, #D4AF37)'

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 90px' }}>
      <style>{[
        '@keyframes vdPulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.45; transform: scale(1.35) } }',
        '.vd-pulse { animation: vdPulse 1.6s ease-in-out infinite }',
        '@keyframes vdRise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }',
        '.vd-card { animation: vdRise 0.5s ease both; transition: transform 0.25s ease, box-shadow 0.25s ease }',
        '.vd-card:hover { transform: rotate(0deg) translateY(-6px) scale(1.015); box-shadow: 0 18px 44px rgba(0,0,0,0.45); z-index: 3 }',
        '.vd-strip::-webkit-scrollbar { display: none }',
        '@media (prefers-reduced-motion: reduce) { .vd-card, .vd-pulse { animation: none } }',
      ].join('\n')}</style>

      {/* The stage */}
      <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: '54px 40px 46px', background: 'radial-gradient(120% 140% at 15% 0%, rgba(212,175,55,0.14) 0%, transparent 45%), radial-gradient(120% 120% at 100% 100%, rgba(255,107,0,0.10) 0%, transparent 50%), var(--surface)', border: '1px solid var(--border)' }}>
        {shards.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" aria-hidden style={{ position: 'absolute', width: 190, height: 150, objectFit: 'cover', borderRadius: 14, opacity: 0.16, filter: live ? 'none' : 'blur(2px)', transform: 'rotate(' + (i * 11 - 22) + 'deg)', right: (i * 16) + '%', top: (i % 2 === 0 ? 6 : 48) + '%', pointerEvents: 'none' }} />
        ))}
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: gold, marginBottom: 10 }}>The weekly drop</div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: 42, lineHeight: 1.05, fontFamily: 'var(--font-display)', maxWidth: 620 }}>Fresh from the Workshop</h1>
          <p style={{ margin: '0 0 26px 0', fontSize: 15, color: 'var(--muted)', maxWidth: 560 }}>
            Once a week the benches are cleared and new pieces from real makers go on the table together -- {DROP_LIVE_HOURS} hours, then the doors close until next time.
          </p>
          <DropStage scheduledAt={drop.scheduledAt.toISOString()} liveHours={DROP_LIVE_HOURS} />
          <div style={{ marginTop: 30, maxWidth: 470, transform: 'rotate(-0.4deg)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>Get the door knock</div>
            <DropSubscribe />
          </div>
        </div>
      </section>

      {/* The makers behind this drop */}
      {makers.length > 0 && (
        <section style={{ marginTop: 34 }}>
          <h2 style={{ fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 14px 4px' }}>The hands behind this week</h2>
          <div className="vd-strip" style={{ display: 'flex', gap: 22, overflowX: 'auto', padding: '6px 4px 12px' }}>
            {makers.map(m => (
              <div key={m.id} style={{ flex: '0 0 auto', textAlign: 'center', width: 108 }}>
                <Link href={'/seller/' + m.id} style={{ textDecoration: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, margin: '0 auto', borderRadius: 999, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, var(--accent), #7a3d00)', boxShadow: m.activeMaker ? ('0 0 0 3px ' + gold + ', 0 6px 18px rgba(212,175,55,0.35)') : '0 0 0 1px var(--border)' }}>
                    {(m.storeName || 'V').charAt(0).toUpperCase()}
                  </span>
                  <span style={{ display: 'block', marginTop: 8, fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.storeName}</span>
                </Link>
                {m.activeMaker && <span style={{ display: 'block', fontSize: 10, color: gold, marginTop: 2 }}>In the workshop this week</span>}
                <div style={{ marginTop: 6 }}><FollowSellerButton sellerId={m.id} compact /></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The table */}
      <section style={{ marginTop: 30 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', border: '1px dashed var(--border)', borderRadius: 24, transform: 'rotate(-0.3deg)' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ opacity: 0.9 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: '16px 0 8px' }}>The benches are being cleared</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 420, margin: '0 auto 18px' }}>Pieces land here through the week as makers finish them. Meanwhile the workshops are open -- watch things being made.</p>
            <Link href="/workshop" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 999, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Step into the Workshop feed</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridAutoRows: 86, gap: 14 }}>
            {items.map((i, idx) => {
              const s = SIZES[idx % SIZES.length]
              return (
                <div key={i.id} className="vd-card" style={{ gridColumn: s.c, gridRow: s.r, position: 'relative', borderRadius: 16, overflow: 'hidden', transform: 'rotate(' + s.rot + ')', background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: (idx * 60) + 'ms' }}>
                  <Link href={live ? '/shop/' + i.product.id : '/drops'} prefetch={false} style={{ position: 'absolute', inset: 0, display: 'block' }}>
                    {i.product.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.product.images[0]} alt={i.product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: live ? 'none' : 'blur(3px) saturate(0.8)' }} />
                    )}
                    <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 45%)' }} />
                    <span style={{ position: 'absolute', left: 12, right: 12, bottom: 10 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>{i.product.title}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{i.product.seller.storeName}{i.product.seller.activeMaker ? ' · in the workshop this week' : ''}</span>
                    </span>
                    {!live && (
                      <span style={{ position: 'absolute', top: 12, left: -34, transform: 'rotate(-35deg)', background: gold, color: '#1a1205', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 40px' }}>At the drop</span>
                    )}
                  </Link>
                  <span style={{ position: 'absolute', top: 8, right: 8 }}><SaveToCollectionButton productId={i.product.id} compact /></span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section style={{ marginTop: 44, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderRadius: 18, border: '1px solid var(--border)', background: 'linear-gradient(100deg, rgba(212,175,55,0.07), transparent 60%)', transform: 'rotate(0.3deg)' }}>
        <div>
          <h2 style={{ fontSize: 16, margin: '0 0 4px 0', fontFamily: 'var(--font-display)' }}>Are you a maker?</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Put up to three pieces on this table from your dashboard -- active makers stand first in line.</p>
        </div>
        <Link href="/dashboard/drops" style={{ padding: '10px 22px', borderRadius: 999, background: 'transparent', border: '1px solid ' + gold, color: gold, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Join the drop</Link>
      </section>
    </main>
  )
}
