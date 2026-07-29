'use client'

// Seller Q&A inbox (2026-07-29): answer buyer questions from listings.
// Unanswered questions come first; an answer makes the pair public on the
// listing page. Answers run the shared no-contact-details filter server-side.

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface SellerQuestion {
  id: string
  question: string
  answer: string | null
  answeredAt: string | null
  createdAt: string
  user: { name: string | null }
  product: { id: string; title: string; images: string[] }
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '20px 22px',
}

export default function SellerQuestionsPage() {
  const [questions, setQuestions] = useState<SellerQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/questions?scope=seller')
      if (r.ok) {
        const d = await r.json()
        setQuestions(Array.isArray(d.questions) ? d.questions : [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function send(questionId: string) {
    const answer = (drafts[questionId] || '').trim()
    if (!answer || busyId) return
    setBusyId(questionId)
    setErrors(prev => ({ ...prev, [questionId]: '' }))
    try {
      const r = await fetch('/api/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErrors(prev => ({ ...prev, [questionId]: d.error || 'Could not save the answer.' }))
        return
      }
      setDrafts(prev => ({ ...prev, [questionId]: '' }))
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const unanswered = questions.filter(q => !q.answeredAt)
  const answered = questions.filter(q => !!q.answeredAt)

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px 80px', position: 'relative', zIndex: 1, fontFamily: 'var(--font-body)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>Fulfil</div>
      <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', margin: '0 0 6px' }}>Buyer questions</h1>
      <p style={{ fontSize: '14.5px', color: 'var(--muted)', margin: '0 0 26px', maxWidth: '560px', lineHeight: 1.6 }}>
        Questions buyers ask on your listings. Your answer is published on the listing
        for every future buyer to see — answered questions sell for you around the clock.
      </p>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

      {!loading && questions.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: '15px', margin: 0, color: 'var(--muted)' }}>
            No questions yet. When a buyer asks something on one of your listings, it lands here.
          </p>
        </div>
      )}

      {unanswered.length > 0 && (
        <>
          <h2 style={{ fontSize: '18px', margin: '0 0 12px' }}>Waiting for your answer ({unanswered.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '30px' }}>
            {unanswered.map(q => (
              <div key={q.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  {q.product.images?.[0] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={q.product.images[0]} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <Link href={`/shop/${q.product.id}`} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.product.title}
                  </Link>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--muted)', flexShrink: 0 }}>
                    {q.user.name || 'A buyer'} · {new Date(q.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 12px' }}>{q.question}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <textarea
                    value={drafts[q.id] || ''}
                    onChange={e => setDrafts(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Write your answer — it will be public on the listing…"
                    maxLength={2000}
                    style={{ flex: 1, minWidth: '220px', minHeight: '64px', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '14px', resize: 'vertical' }}
                  />
                  <button
                    type="button"
                    onClick={() => void send(q.id)}
                    disabled={busyId === q.id || !(drafts[q.id] || '').trim()}
                    style={{ minHeight: '44px', alignSelf: 'flex-end', padding: '0 22px', borderRadius: '999px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: busyId === q.id || !(drafts[q.id] || '').trim() ? 0.6 : 1 }}
                  >
                    {busyId === q.id ? 'Publishing…' : 'Publish answer'}
                  </button>
                </div>
                {errors[q.id] && <p style={{ color: 'var(--red)', fontSize: '13px', margin: '8px 0 0' }}>{errors[q.id]}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {answered.length > 0 && (
        <>
          <h2 style={{ fontSize: '18px', margin: '0 0 12px' }}>Answered ({answered.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {answered.map(q => (
              <div key={q.id} style={{ ...card, padding: '16px 20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                  <Link href={`/shop/${q.product.id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{q.product.title}</Link>
                  {' · '}{q.user.name || 'A buyer'}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>Q: {q.question}</p>
                <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>A: {q.answer}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
