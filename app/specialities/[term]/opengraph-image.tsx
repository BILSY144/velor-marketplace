import { ImageResponse } from 'next/og'
import React from 'react'
import { findSpecialityBySlug, buyerLabel } from '@/lib/specialities'

// Per-speciality social share image for /specialities/[term] (e.g.
// /specialities/tea-ceremony). Added by the standing SEO agent, 2026-07-21.
//
// Before this file existed, all 59 /specialities/[term] pages shared the
// exact same sitewide generic image (app/opengraph-image.tsx, the homepage
// logo card) for both openGraph.images and twitter.images (see
// app/specialities/[term]/layout.tsx) -- so sharing a link to e.g.
// /specialities/tea-ceremony on social media or in a chat app looked
// identical to sharing the homepage. This gives each speciality page its
// own distinct, real-data share image: the real buyer-facing label
// (lib/specialities.ts's buyerLabel(), the same one already used in this
// route's own <title>/meta description) and the term's real family/kind
// plus its one-line standfirst (both already rendered on the page itself,
// app/specialities/[term]/page.tsx lines ~160/169) -- no new fact is
// authored here, purely a visual re-presentation of data already live on
// the page. An invalid slug (no matching term in the closed 59-term
// vocabulary -- already a distinct noindex metadata state per layout.tsx)
// falls back to the same generic sitewide card app/opengraph-image.tsx
// renders, rather than inventing "Speciality Not Found" branding for a
// state nothing should ever actually share.
//
// Visual design deliberately mirrors app/origins/[slug]/opengraph-image.tsx
// exactly (same #0d0d0f background, same #FF6B00 accent bars top/bottom,
// same radial-gradient glow, same "velorcommerce.store" footer line, same
// >18-char headline downscale threshold -- verified against all 59 real
// buyerLabel() outputs, longest is "Ceramics & porcelain" at 20 chars) so
// this reads as the same brand system as both the sitewide default and the
// origin-side pages, not a third one-off design -- only the headline/body
// content differs, and only the eyebrow label swaps "Shop by Origin" for
// "Shop by Speciality" to match this route's own section.

export const alt = 'Velor — Shop by Speciality'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ term: string }> }

export default async function Image({ params }: Props) {
  const { term: slug } = await params
  const speciality = findSpecialityBySlug(slug)
  const h = React.createElement

  if (!speciality) {
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

  const label = buyerLabel(speciality.term)

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
        'Shop by Speciality'
      ),
      h(
        'div',
        {
          style: {
            marginTop: 22,
            // Mirrors the same >18-char downscale rule
            // app/origins/[slug]/opengraph-image.tsx already uses for long
            // country names -- verified this run against every real
            // buyerLabel() output (max 20 chars, "Ceramics & porcelain").
            fontSize: label.length > 18 ? 60 : 84,
            fontWeight: 700,
            color: '#F5F5F5',
            display: 'flex',
            textAlign: 'center',
            maxWidth: 1000,
            justifyContent: 'center',
          },
        },
        label
      ),
      h(
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
        speciality.line
      ),
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
