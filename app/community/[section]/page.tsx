'use client'

/**
 * THE MAKERS' CIRCLE -- section pages (William's redesign, 2026-07-30).
 *
 * Every box on /community routes here. Each section holds this honest,
 * on-brand placeholder until William supplies that section's dedicated
 * design -- we are building them out one at a time. When a section gets its
 * real page, create app/community/<section>/page.tsx as a static route (it
 * automatically takes precedence over this dynamic one) and remove the
 * entry below.
 *
 * LAW #1: placeholders say plainly that the page is being built. Every
 * "meanwhile" link points at a real, live feature -- no dead ends.
 *
 * 2026-07-31 (William: "a lot of the clickable links/buttons go nowhere"):
 * world, videos, collections, learning and countries all got real static
 * routes today (app/community/<section>/page.tsx) and were removed from the
 * map below. live-shopping was removed too -- its hub card now routes
 * straight to /live, Velor's real live-shopping page, instead of a
 * dedicated /community/live-shopping placeholder. Only 'challenge' remains:
 * there is no real contest/submission/voting model behind it yet, so a real
 * page would mean fabricating a winner -- forbidden. Left as the honest
 * placeholder until that feature actually exists.
 */

import Link from 'next/link'
import { useParams } from 'next/navigation'

type SectionDef = {
  title: string
  kicker: string
  description: string
  links: { label: string; href: string }[]
}

const SECTIONS: Record<string, SectionDef> = {
  featured: {
    title: 'Featured today',
    kicker: 'The spotlight',
    description:
      'A daily front page for the community: makers live on air, fresh journal entries, new workshop films and the questions buyers are asking. The full page is being designed now.',
    links: [
      { label: 'See the workshop feed', href: '/workshop' },
      { label: 'Watch the live channel', href: '/live' },
    ],
  },
  journals: {
    title: 'Creator journals',
    kicker: 'Stories from the bench',
    description:
      'Every maker keeps a journal of their work -- first orders, failed glazes, finished commissions. This page will gather every journal from around the world in one place.',
    links: [{ label: 'Read the latest entries', href: '/workshop' }],
  },
  ask: {
    title: 'Ask the maker',
    kicker: 'Questions and answers',
    description:
      'Ask any verified maker a question and their answer is published for the whole community. Today you can ask from any listing page -- this page will bring every conversation together.',
    links: [{ label: 'Find a maker to ask', href: '/shop' }],
  },
  challenge: {
    title: 'Community challenge',
    kicker: 'Show us your craft',
    description:
      'Monthly challenges for makers -- show your oldest tool, your first piece, your workshop view -- with the winner crowned Artisan of the Month. The first challenge opens as the circle grows.',
    links: [
      { label: 'Become a maker', href: '/apply' },
      { label: 'Meet the community', href: '/community' },
    ],
  },
}

export default function CommunitySectionPage() {
  const params = useParams<{ section: string }>()
  const slug = (params?.section as string) ?? ''
  const def = SECTIONS[slug]

  return (
    <main style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '60vh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px clamp(16px, 4vw, 34px) 80px' }}>
        <Link
          href="/community"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#D4AF37',
          }}
        >
          &larr; The Makers&rsquo; Circle
        </Link>

        {def ? (
          <>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                margin: '26px 0 10px',
              }}
            >
              {def.kicker}
            </div>
            <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', lineHeight: 1.1, marginBottom: 16 }}>{def.title}</h1>
            <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 560, marginBottom: 26 }}>{def.description}</p>

            <div
              style={{
                border: '1px dashed var(--border)',
                borderRadius: 12,
                padding: '18px 20px',
                marginBottom: 28,
                fontSize: 13.5,
                color: 'var(--muted)',
              }}
            >
              This page of the Makers&rsquo; Circle is being crafted right now. In the meantime, everything below is live
              today.
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {def.links.map((l) => (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 44,
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text)',
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', lineHeight: 1.1, margin: '26px 0 16px' }}>
              We can&rsquo;t find that corner of the circle
            </h1>
            <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 26 }}>
              That page doesn&rsquo;t exist in the Makers&rsquo; Circle. Head back to the community and pick a section
              from there.
            </p>
            <Link
              href="/community"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 44,
                padding: '10px 22px',
                borderRadius: 8,
                background: 'var(--accent)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Back to the community
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
