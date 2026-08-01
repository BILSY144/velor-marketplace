'use client';

// This codebase's real styling convention is inline style objects (see
// SellerForm.tsx and the prior version of app/apply/page.tsx) -- Tailwind is
// present in package.json/tailwind.config.ts but never wired into
// globals.css (no @tailwind directive), so its utility classes are no-ops
// here. Every seller-application component styles itself the same way the
// rest of the app already does.

// Section 15 of ChatGPT's Implementation Specification v1.0 (2026-08-01):
// labels are Inter weight 600 (was 500/13px). QA pass on the v2 rebuild
// nudged this down slightly again -- "labels slightly smaller, increase
// vertical spacing between form elements" -- 15->14, with the extra
// breathing room applied via the field gap in AboutYouStep.tsx.
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 8, fontFamily: 'var(--sa-font-body)',
  fontSize: 14, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--sa-muted)',
};

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={labelStyle}>
      {children}
      {required && <span style={{ marginLeft: 2, color: 'var(--sa-accent)' }}>*</span>}
    </label>
  );
}

// The style every real text input / select / textarea in the wizard
// shares, so they all render identically regardless of which HTML element
// they are. Spread this onto the element's own style prop.
// Section 17 of the spec claimed height 60 -- direct pixel measurement of
// design-step1.png (2026-08-01, scanning the "Store name" input's own top/
// bottom edges) shows the real input is only ~40px tall. Radius/background/
// border/padding held up against measurement and are unchanged.
export const fieldStyle: React.CSSProperties = {
  width: '100%', height: 40, boxSizing: 'border-box', borderRadius: 12,
  border: '1px solid var(--sa-border)', background: 'var(--sa-input-bg)',
  padding: '0 18px', fontFamily: 'var(--sa-font-body)', fontSize: 15,
  color: 'var(--sa-text)', outline: 'none',
};

export function Field({
  label, required, children, hint,
}: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {hint && <p style={{ marginTop: 6, fontSize: 12, color: 'var(--sa-muted)' }}>{hint}</p>}
    </div>
  );
}
