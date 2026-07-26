// Shared "founding seller" round medallion, shown on the ID CARD (the
// caption/info panel) of every listing that belongs to a founding seller.
//
// Moved OFF the listing photo and onto the id card (William, 2026-07-26:
// "i want the round founders badge on the id card instead of on the image
// ... sellers will not be happy it is blocking the buyers view of their
// listing ... nothing should block the buyers view of the listing. only
// the heart like symbol.") -- this superseded the original 2026-07-26
// brief earlier the same day ("on their id card or on the image itself"),
// once sellers pushed back that the medal sitting on the photo covered
// part of their product. The badge itself is unchanged (still the exact
// medallion first built on the main /shop grid); only WHERE callers place
// it changed. This component therefore no longer hardcodes its own
// position -- it used to be `position:absolute;bottom:10;right:10` so it
// could sit on top of an image, but every caller now renders it inline
// inside the caption instead, so a fixed absolute position would either
// do nothing (no positioned ancestor) or misplace it. Callers pass `style`
// if they need any positioning of their own; by default it just sits
// wherever it's placed in normal flow, sized small enough to read as an
// icon next to the seller name/price line.
//
// Shared across every listing surface (homepage reels, /shop grid,
// /search, /specialities/[term], a seller's own storefront grid) so they
// all render the identical badge instead of a one-off reinvention
// drifting out of sync.
//
// Driven purely by Seller.foundingBadge / CountryFounder (lib/founding.ts)
// -- true only for the seller who was first to get an APPROVED listing
// from their country. Caller passes the country name (when known) so the
// tooltip can say which one; omit it and the badge still renders with a
// generic tooltip.
export function FounderMedal({
  countryName,
  size = 20,
  style,
}: {
  countryName?: string | null
  size?: number
  style?: React.CSSProperties
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
        display: 'inline-flex',
        flexShrink: 0,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,22,7,0.95), rgba(15,11,3,0.95))',
        border: '1px solid rgba(185,138,47,0.5)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        ...style,
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
