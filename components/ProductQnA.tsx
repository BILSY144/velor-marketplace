'use client'

// Public Q&A on listings (2026-07-29, from William's Amazon PDP comparison).
// Answered questions are public; a signed-in asker sees their own pending
// ones marked "awaiting the seller's answer". Every pair is reportable.

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ReportContentButton from '@/components/ReportContentButton'

interface QnA {
  id: string
  question: string
  answer: string | null
  answeredAt: string | null
  createdAt: string
  askerName: string
  isMine: boolean
}

export default function ProductQnA({ productId, sellerName }: { productId: string; sellerName?: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<QnA[]>([])
  const [loaded, setLoaded] = useState(false)
  const [draft, setDraft] = useState('')
  const [asking, setAsking] = useState(false)
  const [asked, setAsked] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/questions?productId=${encodeURIComponent(productId)}`)
      if (r.ok) {
        const d = await r.json()
        setItems(Array.isArray(d.questions) ? d.questions : [])
      }
    } finally {
      setLoaded(true)
    }
  }, [productId])

  useEffect(() => { void load() }, [load])

  async function ask(e: React.FormEvent) {
    e.preventDefault()
    if (asking || !draft.trim()) return
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=/shop/${productId}`)
      return
    }
    setAsking(true)
    setError('')
    setAsked(false)
    try {
      const r = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, question: draft.trim() }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error || 'Could not send your question. Please try again.'); return }
      setDraft('')
      setAsked(true)
      await load()
    } catch {
      setError('Could not send your question. Please try again.')
    } finally {
      setAsking(false)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
      <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>Questions &amp; Answers</h2>
      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px' }}>
        Answers come from {sellerName || 'the seller'}. Questions are public once answered.
      </p>

      {loaded && items.length === 0 && (
        <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 16px' }}>
          No questions yet — be the first to ask.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: items.length ? '20px' : 0 }}>
        {items.map(q => (
          <div key={q.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--accent)', flexShrink: 0 }}>Q:</span>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, flex: 1, minWidth: '200px' }}>{q.question}</p>
              <ReportContentButton contentType="QUESTION" contentId={q.id} />
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', margin: '2px 0 6px 22px' }}>
              {q.askerName}{q.isMine ? ' (you)' : ''} · {new Date(q.createdAt).toLocaleDateString('en-GB')}
            </div>
            {q.answer ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginLeft: '22px' }}>
                <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--green)', flexShrink: 0 }}>A:</span>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>{q.answer}</p>
              </div>
            ) : (
              <p style={{ margin: '0 0 0 22px', fontSize: '12.5px', color: 'var(--muted)', fontStyle: 'italic' }}>
                Awaiting the seller&apos;s answer — only you can see this until it&apos;s answered.
              </p>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={ask} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={session ? 'Ask the seller about this piece…' : 'Sign in to ask the seller a question…'}
          maxLength={500}
          style={{ flex: 1, minWidth: '220px', minHeight: '44px', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '14px' }}
        />
        <button
          type="submit"
          disabled={asking || !draft.trim()}
          className="velor-pdp-tap"
          style={{ minHeight: '44px', padding: '0 22px', borderRadius: '999px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: asking || !draft.trim() ? 'not-allowed' : 'pointer', opacity: asking || !draft.trim() ? 0.6 : 1 }}
        >
          {asking ? 'Sending…' : 'Ask'}
        </button>
      </form>
      {error && <p style={{ color: 'var(--red)', fontSize: '13.5px', margin: '10px 0 0' }}>{error}</p>}
      {asked && (
        <p style={{ color: 'var(--green)', fontSize: '13.5px', fontWeight: 600, margin: '10px 0 0' }}>
          Question sent — it will appear publicly once the seller answers.
        </p>
      )}
    </div>
  )
}
