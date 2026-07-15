import { ImageResponse } from 'next/og'
import React from 'react'

export const alt = 'Velor - Global Marketplace'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const h = React.createElement
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
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: '#FF6B00',
          display: 'flex',
        },
      }),
      // New 2026 brand mark already carries the GLOBAL MARKETPLACE strap,
      // so no separate strap text line is rendered under it.
      h('img', {
        src: 'https://velorcommerce.store/velor-logo-2026.png',
        width: 810,
        height: 270,
        style: { objectFit: 'contain' },
      }),
      h(
        'div',
        {
          style: {
            marginTop: 30,
            fontSize: 26,
            color: '#FF6B00',
            display: 'flex',
          },
        },
        'velorcommerce.store'
        ),
      h('div', {
        style: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: '#FF6B00',
          display: 'flex',
        },
      })
      ),
    { ...size }
    )
}
