'use client'

// /contact — rebuilt 2026-07-09 to the design standard. Real form wired to
// the existing /api/contact (Resend) route, with idle/sending/sent/error
// states, next to plain-spoken contact cards. Channel voice, no emojis.

import { useState } from 'react'
import Link from 'next/link'

type FormStatus = 'idle' | 'sending' | 'sent' | 'error'

const css = `
.vc{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh}
.vc a{color:inherit;text-decoration:none}
.vc-wrap{max-width:1080px;margin:0 auto;padding:64px 32px 90px}
.vc-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:18px;font-weight:600}
.vc-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.vc h1{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;font-size:42px;line-height:1.08;margin:0 0 14px}
.vc-lede{font-size:16px;color:var(--muted);line-height:1.65;margin:0 0 44px;max-width:58ch}
.vc-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:44px;align-items:start}
.vc-form{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:30px}
.vc-lbl{display:block;font-size:12.5px;font-weight:600;letter-spacing:.04em;color:var(--muted);margin:0 0 7px;text-transform:uppercase}
.vc-in,.vc-ta{width:100%;box-sizing:border-box;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:var(--font-body);font-size:15px;padding:13px 15px;outline:none;transition:border-color .15s}
.vc-in:focus,.vc-ta:focus{border-color:var(--accent)}
.vc-ta{min-height:150px;resize:vertical;line-height:1.6}
.vc-row{margin-bottom:18px}
.vc-2col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.vc-btn{width:100%;border-radius:10px;padding:15px 0;font-size:15px;font-weight:600;border:0;cursor:pointer;font-family:inherit;background:var(--accent);color:#160a00;transition:opacity .2s}
.vc-btn:disabled{opacity:.45;cursor:not-allowed}
.vc-ok{border:1px solid rgba(46,204,113,.4);background:rgba(46,204,113,.08);border-radius:12px;padding:18px 20px;font-size:14.5px;line-height:1.6}
.vc-err{border:1px solid rgba(255,92,92,.4);background:rgba(255,92,92,.07);border-radius:12px;padding:14px 18px;font-size:14px;color:var(--red);margin-bottom:18px}
.vc-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 24px;margin-bottom:14px}
.vc-card h2{font-family:var(--font-display);font-weight:500;font-size:17px;margin:0 0 7px;letter-spacing:-0.01em}
.vc-card p{font-size:13.5px;color:var(--muted);line-height:1.6;margin:0}
.vc-card a{color:var(--accent) !important}
@media(max-width:860px){.vc-grid{grid-template-columns:1fr}.vc h1{font-size:32px}.vc-2col{grid-template-columns:1fr}}
`

export default function ContactPage() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Something went wrong. Please try again.')
      }
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="vc">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="vc-wrap">
        <div className="vc-eyebrow"><span className="vc-dot" /> Contact</div>
        <h1>Talk to Velor.</h1>
        <p className="vc-lede">
          A question about an order, about selling, or about the channel itself — write to us and
          a real answer comes back. We reply within one business day.
        </p>

        <div className="vc-grid">
          <div className="vc-form">
            {status === 'sent' ? (
              <div className="vc-ok">
                <b>Message sent.</b> Thanks — it has landed with our team, and a reply is on its
                way to {form.email || 'your inbox'} within one business day.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {status === 'error' && error && <div className="vc-err">{error}</div>}
                <div className="vc-row vc-2col">
                  <div>
                    <label className="vc-lbl" htmlFor="vc-name">Your name</label>
                    <input id="vc-name" className="vc-in" value={form.name} onChange={set('name')} required maxLength={120} />
                  </div>
                  <div>
                    <label className="vc-lbl" htmlFor="vc-email">Email</label>
                    <input id="vc-email" className="vc-in" type="email" value={form.email} onChange={set('email')} required maxLength={200} />
                  </div>
                </div>
                <div className="vc-row">
                  <label className="vc-lbl" htmlFor="vc-subject">Subject</label>
                  <input id="vc-subject" className="vc-in" value={form.subject} onChange={set('subject')} maxLength={200} placeholder="What is it about?" />
                </div>
                <div className="vc-row">
                  <label className="vc-lbl" htmlFor="vc-message">Message</label>
                  <textarea id="vc-message" className="vc-ta" value={form.message} onChange={set('message')} required maxLength={5000} />
                </div>
                <button className="vc-btn" type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          <div>
            <div className="vc-card">
              <h2>Buying on Velor</h2>
              <p>
                Order questions are fastest from the order page itself — tracking, returns and
                disputes all live there. For everything else, the <Link href="/help">help centre</Link> answers
                the common questions.
              </p>
            </div>
            <div className="vc-card">
              <h2>Selling on Velor</h2>
              <p>
                Thinking about opening your country? Start at <Link href="/sell">Sell on Velor</Link> — the
                honest maths, the founding perks, and the application are all there.
              </p>
            </div>
            <div className="vc-card">
              <h2>Email, if you prefer</h2>
              <p>
                <a href="mailto:support@velorcommerce.store">support@velorcommerce.store</a> reaches
                the same team. Velor Commerce Ltd is registered in England and Wales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
