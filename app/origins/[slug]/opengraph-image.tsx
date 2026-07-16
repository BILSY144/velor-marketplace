import { ImageResponse } from 'next/og'
import React from 'react'
import { findCountryBySlug } from '@/lib/worldCountries'
import { cultureHints } from '@/lib/cultureHints'

// Per-country social share image for /origins/[slug] (e.g. /origins/japan).
// Added by the standing SEO agent, 2026-07-16.
//
// Before this file existed, all 190 /origins/[slug] country pages shared
// the exact same sitewide generic image (app/opengraph-image.tsx, the
// homepage logo card) for both openGraph.images and twitter.images (see
// app/origins/[slug]/layout.tsx) -- so sharing a link to e.g.
// /origins/japan on social media or in a chat app looked identical to
// sharing the homepage. This gives each country page its own distinct,
// real-data share image: the real country name (lib/worldCountries.ts,
// the same source the page and its metadata already use) and, where they
// exist, the first two real cultureHints (lib/cultureHints.ts, the exact
// same curated "known for" list already rendered on the page itself and
// already used in this route's own meta description) -- no new fact is
// authored here, purely a visual re-presentation of data already live on
// the page. An invalid slug (no matching country -- already a distinct
// noindex metadata state per layout.tsx) falls back to the same generic
// sitewide card app/opengraph-image.tsx renders, rather than inventing
// "Country Not Found" branding for a state nothing should ever actually
// share.
//
// Visual design deliberately mirrors app/opengraph-image.tsx exactly
// (same #0d0d0f background, same #FF6B00 accent bars top/bottom, same
// radial-gradient glow, same "velorcommerce.store" footer line) so this
// reads as the same brand system, not a new one-off design -- only the
// headline content differs.

export const alt = 'Velor — Shop by Origin'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ slug: string }> }

export default async function Image({ params }: Props) {
  const { slug } = await params
  const country = findCountryBySlug(slug)
  const h = React.createElement

  if (!country) {
    return new ImageResponse(
      h(
        'div',
        {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0d0d0f',
            backgroundImage:
              'radial-gradient(ellipse 700px 420px at 50% 50%, rgba(255,107,0,0.16), rgba(13,13,15,0) 70%)',
            position: 'relative',
          },
        },
        h('div', {
          style: { position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: '#FF6B00', display: 'flex' },
        }),
        h('img', {
          src: 'https://velorcommerce.store/velor-logo-2026.png',
          width: 810,
          height: 270,
          style: { objectFit: 'contain' },
        }),
        h(
          'div',
          { style: { marginTop: 30, fontSize: 26, color: '#FF6B00', display: 'flex' } },
          'velorcommerce.store'
        ),
        h('div', {
          style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundColor: '#FF6B00', display: 'flex' },
        })
      ),
      { ...size }
    )
  }

  const hints = cultureHints(country.code).slice(0, 2)

  return new ImageResponse(
    h(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d0d0f',
          backgroundImage:
            'radial-gradient(ellipse 700px 420px at 50% 50%, rgba(255,107,0,0.16), rgba(13,13,15,0) 70%)',
          position: 'relative',
        },
      },
      h('div', {
        style: { position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: '#FF6B00', display: 'flex' },
      }),
      h(
        'div',
        {
          style: {
            fontSize: 28,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#FF6B00',
            display: 'flex',
          },
        },
        'Shop by Origin'
      ),
      h(
        'div',
        {
          style: {
            marginTop: 22,
            // A few real country names (e.g. "St Vincent and the
            // Grenadines", 29 chars) run too wide for a single line at the
            // default size -- scale down for longer names so the card
            // stays legible instead of overflowing or wrapping awkwardly.
            fontSize: country.name.length > 18 ? 60 : 84,
            fontWeight: 700,
            color: '#F5F5F5',
            display: 'flex',
            textAlign: 'center',
            maxWidth: 1000,
            justifyContent: 'center',
          },
        },
        country.name
      ),
      hints.length > 0
        ? h(
            'div',
            {
              style: {
                marginTop: 26,
                fontSize: 30,
                color: '#B0B0B0',
                display: 'flex',
                textAlign: 'center',
                maxWidth: 940,
              },
            },
            `Known for ${hints.join(', ')}`
          )
        : null,
      h(
        'div',
        { style: { marginTop: 40, fontSize: 26, color: '#FF6B00', display: 'flex' } },
        'velorcommerce.store'
      ),
      h('div', {
        style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundColor: '#FF6B00', display: 'flex' },
      })
    ),
    { ...size }
  )
}
