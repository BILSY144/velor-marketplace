'use client'

import { useEffect, useState } from 'react'
import { useSellerTier, PlanBadge, tierCardStyle } from '@/lib/dashboard-theme'

interface SupportTicket {
  id: string
  subject: string
  message: string
  priority: 'STANDARD' | 'PRIORITY'
  status: 'OPEN' | 'RESOLVED'
  createdAt: string
}

interface SupportData {
  tier: string
  isPriority: boolean
  tickets: SupportTicket[]
}

export default function SupportPage() {
  const { tier, theme } = useSellerTier()
  const isEnterprise = tier === 'PRO' || tier === 'ENTERPRISE'

  const [data, setData] = useState<SupportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/dashboard/support')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/dashboard/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      if (res.ok) {
        setSubject('')
        setMessage('')
        setFeedback({ type: 'success', text: 'Your message has been sent. We will be in touch soon.' })
        await load()
      } else {
        const json = await res.json().catch(() => ({}))
        setFeedback({ type: 'error', text: json.error || 'Something went wrong. Please try again.' })
      }
    } catch {
      setFeedback({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>
  }

  // isPriority is server-driven from /api/dashboard/support based on the
  // seller's actual tier — this determination is never altered client-side.
  const isPriority = data?.isPriority ?? false

  return (
    <div style={{ padding: 32, maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, color: 'var(--text)', marginBottom: 8 }}>
          Support
        </h1>
        <PlanBadge tier={tier} />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        Get in touch with the Velor team about your store, orders, or account.
      </p>

      {isPriority ? (
        <div style={tierCardStyle(theme, { padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' })}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #FFD54A, #FF6B00)' }} />
          <span style={{ background: 'linear-gradient(90deg, #FFD54A, #FF6B00)', color: '#111', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 12, padding: '4px 10px', borderRadius: 999, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            Priority Support
          </span>
          <span style={{ color: 'var(--text)', fontSize: 14 }}>
            As a Pro seller, messages you send here are flagged for priority review by our team - response times under 2 hours.
          </span>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 28, color: 'var(--muted)', fontSize: 14 }}>
          Our team typically responds within 1-2 business days. Pro sellers get priority-flagged support
          <a href="/dashboard/upgrade/pro" style={{ color: 'var(--accent)' }}> - see the Pro plan</a>.
        </div>
      )}

      <form onSubmit={handleSubmit} style={tierCardStyle(theme, { padding: 24, marginBottom: 32 })}>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="What's this about?"
          style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, marginBottom: 16 }}
        />
        <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's going on..."
          rows={6}
          style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, marginBottom: 16, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
        />
        {feedback ? (
          <div style={{ marginBottom: 16, fontSize: 13, color: feedback.type === 'success' ? 'var(--green)' : 'var(--red)' }}>
            {feedback.text}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? 'Sending...' : 'Send message'}
        </button>
      </form>

      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, color: 'var(--text)', marginBottom: 16 }}>
        Your requests
      </h2>

      {data && data.tickets.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>You haven't sent any support requests yet.</p>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data?.tickets.map((t) => (
          <div key={t.id} style={tierCardStyle(theme, { padding: '14px 18px' })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{t.subject}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {t.priority === 'PRIORITY' ? (
                  <span style={{ background: 'var(--accent)', color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase' }}>
                    Priority
                  </span>
                ) : null}
                <span style={{ fontSize: 11, color: t.status === 'OPEN' ? 'var(--accent)' : 'var(--green)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {t.status === 'OPEN' ? 'Open' : 'Resolved'}
                </span>
              </div>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>{t.message}</p>
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>
              {new Date(t.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
