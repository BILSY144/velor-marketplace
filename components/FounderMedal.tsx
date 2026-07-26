// Shared "founding seller" round medallion, shown on the image of every
// listing that belongs to a founding seller (William, 2026-07-26: "for
// every listing" -- "wherever a founding sellers listing is showed i want
// the round founders badge on their id card or on the image itself. this
// badge travels with the listing everywhere it is placed").
//
// This is NOT a new design -- it's the exact medallion already built and
// shipped on the main /shop grid (app/shop/page.tsx's renderProductCard),
// extracted here so every other listing surface (homepage reels, /search,
// /origins/[slug], /specialities/[term], a seller's own storefront grid)
// renders the identical badge instead of a one-off reinvention drifting
// out of sync. Deliberately small and corner-anchored so it can never grow
// to cover the product photo itself -- the "small enough to see but not
// big enough to limit the sellers listing visibility" rule from the same
// conversation.
//
// Driven purely by Seller.foundingBadge / CountryFounder (lib/founding.ts)
// -- true only for the seller who was first to get an APPROVED listing
// from their country. Caller passes the country name (when known) so the
// tooltip can say which one; omit it and the badge still renders with a
// generic tooltip.
export function FounderMedal({
  countryName,
  size = 54,
}: {
  countryName?: string | null
  size?: number
}) {
  const svgSize = Math.round(size * 0.85)
  return (
    <div
      title={
        countryName
          ? `Founding Seller of ${countryName}`
          : 'Founding Seller — the first verified seller from this country'
      }
      style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,22,7,0.95), rgba(15,11,3,0.95))',
        border: '1px solid rgba(185,138,47,0.5)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <svg width={svgSize} height={svgSize} viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="96" fill="none" stroke="#E9C46A" strokeWidth="3" />
        <circle cx="100" cy="100" r="86" fill="none" stroke="#E9C46A" strokeWidth="1" opacity="0.6" />
        <g stroke="#E9C46A" strokeWidth="3" fill="none" strokeLinecap="round" transform="translate(-9,0)">
          <path d="M52 128 q-10 -22 2 -44" /><path d="M54 124 q-8 -4 -14 -1 q4 -8 14 -6" /><path d="M52 108 q-8 -4 -14 -1 q4 -8 14 -6" /><path d="M52 92 q-7 -5 -13 -3 q3 -8 13 -5" />
        </g>
        <g stroke="#E9C46A" strokeWidth="3" fill="none" strokeLinecap="round" transform="translate(9,0)">
          <path d="M148 128 q10 -22 -2 -44" /><path d="M146 124 q8 -4 14 -1 q-4 -8 -14 -6" /><path d="M148 108 q8 -4 14 -1 q-4 -8 -14 -6" /><path d="M148 92 q7 -5 13 -3 q-3 -8 -13 -5" />
        </g>
        <text x="100" y="88" textAnchor="middle" fontSize="22" letterSpacing="2" fill="#E9C46A" fontWeight="700">VELOR</text>
        <text x="100" y="122" textAnchor="middle" fontSize="32" fontWeight="800" fill="#E9C46A">No. 001</text>
        <text x="100" y="146" textAnchor="middle" fontSize="16" letterSpacing="1.5" fill="#E9C46A" opacity="0.85">EST. 2026</text>
      </svg>
    </div>
  )
}
