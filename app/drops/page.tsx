import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getOrCreateNextDrop, isDropLive, DROP_LIVE_HOURS } from '@/lib/drops'
import DropCountdown from '@/components/DropCountdown'
import DropSubscribe from '@/components/DropSubscribe'

// Fresh from the Workshop -- the weekly drop page (Velor Social stage 6).
// Server component reads via Prisma; countdown + subscribe are the only
// client islands. Inline CSS + CSS variables per house convention.

export const dynamic = 'force-dynamic'

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
      product: { select: { id: true, title: true, images: true, originCountry: true, seller: { select: { storeName: true, activeMaker: true } } } },
    },
    orderBy: { createdAt: 'asc' },
    take: 60,
  })
  // Active makers first -- the visibility reward for embracing the social layer
  items.sort((a, b) => Number(b.product.seller.activeMaker) - Number(a.product.seller.activeMaker))
  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 20px 80px' }}>
      <section style={{ padding: '28px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>The weekly drop</div>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 30, fontFamily: 'var(--font-display)' }}>Fresh from the Workshop</h1>
        <p style={{ margin: '0 0 18px 0', fontSize: 15, color: 'var(--muted)', maxWidth: 640 }}>
          Once a week, new pieces from real makers around the world go live together -- and stay live for {DROP_LIVE_HOURS} hours. Come at the hour, meet the makers, catch the piece.
        </p>
        <DropCountdown scheduledAt={drop.scheduledAt.toISOString()} liveHours={DROP_LIVE_HOURS} />
        <div style={{ marginTop: 20, maxWidth: 460 }}>
          <DropSubscribe />
        </div>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 14px 0' }}>{live ? 'Live now' : items.length > 0 ? 'In this week\'s drop' : 'The makers are preparing'}</h2>
        {items.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Pieces appear here as makers add them through the week. Follow your favourite makers and you will not miss it.</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {items.map(i => (
            <Link key={i.id} href={live ? '/shop/' + i.product.id : '/drops'} prefetch={false}
              style={{ textDecoration: 'none', color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'block' }}>
              <div style={{ position: 'relative', aspectRatio: '4 / 3', background: 'var(--bg)' }}>
                {i.product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.product.images[0]} alt={i.product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: live ? 'none' : 'blur(0px)' }} />
                )}
                {!live && <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 10px', borderRadius: 999 }}>Opens with the drop</div>}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{i.product.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{i.product.seller.storeName}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 40, padding: '20px 24px', border: '1px dashed var(--border)', borderRadius: 12 }}>
        <h2 style={{ fontSize: 16, margin: '0 0 6px 0' }}>Are you a maker?</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
          Add up to three of your live listings to the next drop from your <Link href='/dashboard/drops' style={{ color: 'var(--accent)' }}>dashboard</Link>. Every drop is a guaranteed audience for your work.
        </p>
      </section>
    </main>
  )
}
