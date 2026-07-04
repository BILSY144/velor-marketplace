'use client'

import { useEffect, useState } from 'react'
import { STORE_THEMES, canUseTheme, canBrandLogo, type StoreTheme } from '@/lib/store-themes'

function Preview({ t }: { t: StoreTheme }) {
  const k = t.tokens
  return (
    <div style={{ background: k.bg, borderRadius: 12, overflow: 'hidden', border: `1px solid ${k.border}` }}>
      <div style={{ height: 66, background: k.heroBg, display: 'flex', alignItems: 'center', padding: '0 14px' }}>
        <div style={{ fontFamily: k.fontDisplay, color: k.text, fontWeight: 800, fontSize: 15, letterSpacing: '0.02em' }}>
          Your Store
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <span style={{ background: k.accent, color: k.accentText, padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, fontFamily: k.fontBody }}>
          Shop now
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginTop: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 44, background: k.surface, borderRadius: 8, border: `1px solid ${k.border}` }} />
          ))}
        </div>
        <div style={{ height: 8, width: '60%', background: k.muted, opacity: 0.4, borderRadius: 4, marginTop: 12 }} />
      </div>
    </div>
  )
}

export default function StorefrontDesign() {
  const [active, setActive] = useState('classic')
  const [tier, setTier] = useState('STARTER')
  const [unlocked, setUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [logo, setLogo] = useState<string | null>(null)
  const [logoBusy, setLogoBusy] = useState(false)

  async function load() {
    try {
      const r = await fetch('/api/seller/storefront')
      const d = await r.json()
      if (d.theme) setActive(d.theme)
      if (d.tier) setTier(d.tier)
      setUnlocked(d.unlocked === true)
      setLogo(d.logo || null)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    const q = new URLSearchParams(window.location.search)
    if (q.get('unlocked') === 'true') setToast('Unlocked — every storefront design is now yours.')
    if (q.get('cancelled') === 'true') setToast('Checkout cancelled — no charge was made.')
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setToast('Please choose a PNG, JPG or WebP image.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 320
        let { width, height } = img
        if (width > max || height > max) {
          const scale = Math.min(max / width, max / height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, width, height)
        uploadLogo(canvas.toDataURL('image/png'))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function uploadLogo(dataUrl: string) {
    setLogoBusy(true)
    try {
      const r = await fetch('/api/seller/storefront/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      })
      if (r.ok) {
        setLogo(dataUrl)
        setToast('Logo saved — it now leads your storefront.')
      } else if (r.status === 403) {
        setUnlockOpen(true)
      } else {
        setToast('Could not save that logo. Try a smaller image.')
      }
    } catch {
      setToast('Network error. Please try again.')
    }
    setLogoBusy(false)
  }

  async function removeLogo() {
    setLogoBusy(true)
    try {
      const r = await fetch('/api/seller/storefront/logo', { method: 'DELETE' })
      if (r.ok) {
        setLogo(null)
        setToast('Logo removed. Your store name leads the hero again.')
      }
    } catch {
      setToast('Network error. Please try again.')
    }
    setLogoBusy(false)
  }

  async function apply(id: string) {
    setBusy(true)
    try {
      const r = await fetch('/api/seller/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId: id }),
      })
      if (r.ok) {
        setActive(id)
        setToast('Storefront design applied.')
      } else {
        const data = await r.json().catch(() => ({}))
        setToast(data.error || ('Could not apply that design (status ' + r.status + ').'))
      }
    } catch {
      setToast('Network error. Please try again.')
    }
    setBusy(false)
  }

  function pick(id: string) {
    if (canUseTheme(tier, unlocked, id)) apply(id)
    else setUnlockOpen(true)
  }

  async function unlock() {
    setBusy(true)
    try {
      const r = await fetch('/api/seller/storefront/unlock', { method: 'POST' })
      const d = await r.json()
      if (d.checkoutUrl) window.location.href = d.checkoutUrl
      else {
        setToast(d.error === 'already_unlocked' ? 'You already have every design.' : 'Could not start checkout.')
        setBusy(false)
      }
    } catch {
      setToast('Network error. Please try again.')
      setBusy(false)
    }
  }

  const canAll = tier === 'PRO' || tier === 'ENTERPRISE' || unlocked

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto', fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, margin: 0 }}>Storefront design</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '8px 0 4px' }}>
        Choose how your store looks to buyers. Preview any design — apply it in one click.
      </p>
      {canAll ? (
        <p style={{ color: 'var(--green)', fontSize: 13.5, fontWeight: 600, margin: '0 0 24px' }}>
          {tier === 'PRO' || tier === 'ENTERPRISE'
            ? 'Every design is included with your plan.'
            : 'You have unlocked every design.'}
        </p>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '0 0 24px' }}>
          Your Classic design is free. Explore the full collection below.
        </p>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ width: 64, height: 64, borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {logo ? (
            <img src={logo} alt="Your store logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: 'var(--muted)', fontSize: 22, fontWeight: 800 }}>Aa</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Your store logo</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
            Add your own logo — it leads your storefront in place of your store name. PNG, JPG or WebP.
          </div>
        </div>
        {canBrandLogo(tier, unlocked) ? (
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <label style={{ background: 'var(--accent)', color: '#000', fontWeight: 800, fontSize: 13.5, padding: '10px 16px', borderRadius: 999, cursor: logoBusy ? 'default' : 'pointer', opacity: logoBusy ? 0.6 : 1 }}>
              {logoBusy ? 'Saving…' : logo ? 'Replace logo' : 'Upload logo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogoFile} disabled={logoBusy} style={{ display: 'none' }} />
            </label>
            {logo && (
              <button onClick={removeLogo} disabled={logoBusy} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 13.5, padding: '10px 16px', borderRadius: 999, cursor: 'pointer' }}>
                Remove
              </button>
            )}
          </div>
        ) : (
          <button onClick={() => setUnlockOpen(true)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13.5, fontWeight: 700, padding: '10px 16px', borderRadius: 999, cursor: 'pointer', flexShrink: 0 }}>
            Preview
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', padding: 40 }}>Loading designs…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {STORE_THEMES.map((t) => {
            const isActive = active === t.id
            const locked = !canUseTheme(tier, unlocked, t.id)
            return (
              <div
                key={t.id}
                onClick={() => pick(t.id)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 16,
                  padding: 12,
                  background: 'var(--surface)',
                  border: isActive ? '2px solid var(--accent)' : '1px solid var(--border)',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Preview t={t} />
                  {locked && (
                    <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 999, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                      &#128274;
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12.5 }}>{t.tagline}</div>
                  </div>
                  {isActive ? (
                    <span style={{ background: 'var(--accent)', color: '#000', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Active</span>
                  ) : locked ? (
                    <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Preview</span>
                  ) : (
                    <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>Apply</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {unlockOpen && (
        <div
          onClick={() => !busy && setUnlockOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.66)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 30, maxWidth: 440, width: '100%', textAlign: 'center' }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, margin: '0 0 8px' }}>
              Unlock every storefront design
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.55, margin: '0 0 18px' }}>
              Make your store unmistakably yours. Get instant access to all {STORE_THEMES.length} designs and your own logo — switch any time, forever.
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40 }}>&pound;9.99</span>
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>one-time</span>
            </div>
            <button
              onClick={unlock}
              disabled={busy}
              style={{ width: '100%', background: 'var(--accent)', color: '#000', border: 'none', fontWeight: 800, fontSize: 15, padding: '14px', borderRadius: 999, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
            >
              {busy ? 'Redirecting to checkout…' : 'Unlock all designs'}
            </button>
            <button
              onClick={() => setUnlockOpen(false)}
              disabled={busy}
              style={{ width: '100%', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13.5, padding: '12px', cursor: 'pointer', marginTop: 4 }}
            >
              Keep browsing
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '12px 20px', borderRadius: 12, fontSize: 14, zIndex: 120, boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
