// Small inline-SVG line icons for the seller-application wizard, redrawn to
// match the thin, single-weight outline style used throughout William's
// design references (not extracted from the raster mockups -- vector line
// icons stay crisp at every size/DPI, which a cropped screenshot fragment
// would not). All share the same stroke-based convention: currentColor,
// strokeWidth 1.6, round caps/joins.

// This codebase's actual styling convention is inline style objects (see
// SellerForm.tsx, lib components, etc.) -- Tailwind is a config-only
// leftover with no @tailwind directive wired into globals.css, so its
// utility classes (h-5 w-5, text-[color:...]) are silently no-ops here.
// Icons take an explicit pixel `size` + optional `color` instead.
type IconProps = { size?: number; color?: string; style?: React.CSSProperties };
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
function svgStyle({ size = 24, color, style }: IconProps): React.CSSProperties {
  return { width: size, height: size, color, flexShrink: 0, display: 'block', ...style };
}

export function IconPerson(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20c1.4-3.8 4.4-5.7 7.5-5.7s6.1 1.9 7.5 5.7" />
    </svg>
  );
}

export function IconBriefcase(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <rect x="3.2" y="7.5" width="17.6" height="11.5" rx="1.8" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M3.2 12.5h17.6" />
    </svg>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2M12 3.4c2.6 2.4 4 5.3 4 8.6s-1.4 6.2-4 8.6c-2.6-2.4-4-5.3-4-8.6s1.4-6.2 4-8.6Z" />
    </svg>
  );
}

export function IconTag(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M11.4 3.4h5.7a1.5 1.5 0 0 1 1.5 1.5v5.7a1.5 1.5 0 0 1-.44 1.06l-8.2 8.2a1.5 1.5 0 0 1-2.12 0l-5.12-5.12a1.5 1.5 0 0 1 0-2.12l8.2-8.2A1.5 1.5 0 0 1 11.4 3.4Z" />
      <circle cx="15.2" cy="8.8" r="1.3" />
    </svg>
  );
}

export function IconLive(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <circle cx="12" cy="15" r="2" />
      <path d="M8.4 11.4a5 5 0 0 1 7.2 0M5.7 8.7a9 9 0 0 1 12.6 0" />
    </svg>
  );
}

export function IconShieldStar(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M12 3.2 19 6v6c0 4.6-3 7.6-7 8.8-4-1.2-7-4.2-7-8.8V6Z" />
      <path d="m12 9 .95 1.9 2.1.3-1.5 1.47.35 2.08L12 13.75l-1.9 1 .35-2.08-1.5-1.47 2.1-.3Z" />
    </svg>
  );
}

export function IconChartUp(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M3.5 19.5h17" />
      <path d="M5 16.5 9.5 11l3 3 5.8-6.8" />
      <path d="M15.3 6.7h3v3" />
    </svg>
  );
}

export function IconPeople(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <circle cx="8.7" cy="8.2" r="2.6" />
      <circle cx="16.2" cy="9" r="2.1" />
      <path d="M3.2 19c1-3.1 3.2-4.7 5.5-4.7 2 0 3.8 1.1 4.8 3" />
      <path d="M13.8 14.7c1.9.2 3.6 1.5 4.4 4.3" />
    </svg>
  );
}

export function IconFingerprint(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5v2" />
      <path d="M12 4.5A7.5 7.5 0 0 0 4.5 12v3" />
      <path d="M8.2 19.5c-.6-1.2-1-2.7-1-4.5v-3a4.8 4.8 0 1 1 9.6 0v1.6" />
      <path d="M12 19.8c-1-1.4-1.6-3-1.6-5.3v-2.3a1.6 1.6 0 1 1 3.2 0v2.3c0 .8.1 1.5.3 2.1" />
    </svg>
  );
}

export function IconShieldCheck(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M12 3.2 19 6v6c0 4.6-3 7.6-7 8.8-4-1.2-7-4.2-7-8.8V6Z" />
      <path d="m9 12 2.1 2.1L15.3 10" />
    </svg>
  );
}

export function IconHeartHand(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M12.6 8.8c-.7-1.2-1.9-1.9-3.2-1.9-2 0-3.4 1.6-3.4 3.5 0 2.7 3.1 4.6 6.6 7.5 3.5-2.9 6.6-4.8 6.6-7.5 0-1.9-1.4-3.5-3.4-3.5-1.3 0-2.5.7-3.2 1.9Z" />
      <path d="M3.5 18.2h2.1c.5 0 1-.1 1.4-.3l2-.8a1.7 1.7 0 0 0-.6-3.3H6" />
    </svg>
  );
}

export function IconVase(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M9.3 3.4h5.4l-.5 2.7a2 2 0 0 0 .3 1.4l1.6 2.4a5.2 5.2 0 0 1 .9 2.9v3.6a4.6 4.6 0 0 1-4.6 4.6h-.8a4.6 4.6 0 0 1-4.6-4.6V12.8c0-1 .3-2 .9-2.9l1.6-2.4a2 2 0 0 0 .3-1.4Z" />
      <path d="M9.1 3.4h5.8" />
    </svg>
  );
}

export function IconBox(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M3.5 8.2 12 4l8.5 4.2v7.6L12 20l-8.5-4.2Z" />
      <path d="M3.5 8.2 12 12m0 0 8.5-3.8M12 12v8" />
    </svg>
  );
}

export function IconRocket(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M13.5 15.5c2.6-1.9 4-4.6 4.3-8.8.1-1.4-.2-2.2-1-3-.8-.8-1.6-1.1-3-1-4.2.3-6.9 1.7-8.8 4.3" />
      <path d="M13.5 15.5 9 17l-1-4.5c1.6-2.6 3.7-4.4 6.3-5.6a2.3 2.3 0 0 1 3.3 3.3c-1.2 2.6-3 4.7-5.6 6.3Z" />
      <circle cx="13.6" cy="9.4" r="1.4" />
      <path d="M8 16.5c-.3 1.3-.2 2.7 1.5 4.5-1.8 0-3.3-.3-4.5-1.5-.9-.9-1.3-2.2-1.5-4 1.7-.6 3.4-.2 4.5 1Z" />
    </svg>
  );
}

export function IconEye(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M2.5 12S5.8 5.8 12 5.8 21.5 12 21.5 12 18.2 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M3.5 3.5l17 17" />
      <path d="M10.6 5.9A9.8 9.8 0 0 1 12 5.8c6.2 0 9.5 6.2 9.5 6.2a15 15 0 0 1-3.4 4.2M7 6.9C4.4 8.4 2.5 12 2.5 12s3.3 6.2 9.5 6.2c1.1 0 2.1-.2 3-.5" />
      <path d="M9.9 10a2.6 2.6 0 0 0 3.7 3.6" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <rect x="4.8" y="10.5" width="14.4" height="9.5" rx="1.8" />
      <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base} style={svgStyle(props)}>
      <path d="M4 12h16M13.5 6.5 19 12l-5.5 5.5" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={svgStyle(props)}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}
