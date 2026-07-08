'use client'

  import { useState, useRef, useEffect } from 'react'

    type ChatMessage = { role: 'user' | 'assistant'; content: string }
    type Tier = 'STARTER' | 'PRO' | 'ENTERPRISE'
    type Variant = 'buyer' | 'seller'

    // Velor's AI assistant persona image (circular, transparent background).
    const AVATAR = '/velor-assistant.png'

    const BUYER_GREETING = "Hi, I'm Velor's AI Assistant. I'm here to help you shop with confidence — how our buyer protection works, tracking an order, returns and disputes, or finding something from our sellers around the world."

    const GREETINGS: Record<Tier, string> = {
      STARTER: "Hi, I'm Velor's AI Assistant. Ask me about fees, payouts, escrow timing, listing tips, or Velor policies.",
      PRO: "Hi, I'm your Velor AI Assistant. I can see your own account data now, so ask me about your recent orders, your next payout, or your seller standing, as well as fees and listing tips.",
      ENTERPRISE: "Hi, I'm your dedicated Velor AI Account Manager. I can look up your recent orders, explain your payout timing, draft a reply for a buyer or for support, and flag anything urgent straight to our team.",
    }

    const BUYER_LABELS = { title: 'Velor AI Assistant', subtitle: 'Here to help you shop', placeholder: 'Ask about buyer protection, orders, returns...' }

    const LABELS: Record<Tier, { title: string; subtitle: string; placeholder: string }> = {
      STARTER: { title: 'Velor AI Assistant', subtitle: 'Always-on AI, not a human', placeholder: 'Ask about fees, payouts, listings...' },
      PRO: { title: 'Velor AI Assistant — Pro', subtitle: 'Grounded in your account data', placeholder: 'Ask about your orders, payouts, or listings...' },
      ENTERPRISE: { title: 'Velor AI Account Manager', subtitle: 'Your dedicated AI account manager', placeholder: 'Ask me to look something up, draft a reply, or flag an issue...' },
    }

    export default function VelorAssistant({ variant = 'seller' }: { variant?: Variant }) {
      const isBuyer = variant === 'buyer'
      const [isOpen, setIsOpen] = useState(false)
  const [tier, setTier] = useState<Tier>('STARTER')
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: isBuyer ? BUYER_GREETING : GREETINGS.STARTER }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // The buyer-facing assistant never looks up seller-tier data.
    if (isBuyer) return
    fetch('/api/seller/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const t = data?.tier as Tier | undefined
        if (t === 'PRO' || t === 'ENTERPRISE') {
          setTier(t)
          setMessages([{ role: 'assistant', content: GREETINGS[t] }])
        }
      })
      .catch(() => {})
  }, [isBuyer])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
}
}, [messages, isOpen])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setError('')
    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
      try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, audience: isBuyer ? 'buyer' : 'seller' }),
})
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
} else {
        setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
}
} catch {
      setError('Network error. Please try again.')
} finally {
      setLoading(false)
}
}

  function handleKeyDown(e: any) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
}
}

  const labels = isBuyer ? BUYER_LABELS : LABELS[tier]

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200 }}>
{isOpen && (
        <div style={{ width: '360px', height: '480px', background: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', display: 'flex', flexDirection: 'column', marginBottom: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
                <img src={AVATAR} alt="Velor AI Assistant" width={38} height={38} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(212,175,90,0.5)' }} />
                <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '9px', height: '9px', borderRadius: '50%', background: '#00E676', border: '2px solid #111111' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>{labels.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999999' }}>{labels.subtitle}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#999999', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>x</button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
{messages.map((m, i) => (
              m.role === 'assistant' ? (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', alignSelf: 'flex-start', maxWidth: '90%' }}>
                  <img src={AVATAR} alt="" width={24} height={24} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ background: '#1C1C1C', color: '#E5E5E5', padding: '8px 12px', borderRadius: '10px', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.content}</div>
                </div>
              ) : (
                <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', background: '#FF6B00', color: '#FFFFFF', padding: '8px 12px', borderRadius: '10px', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.content}</div>
              )
            ))}
{loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', color: '#999999', fontSize: '12px' }}>
                <img src={AVATAR} alt="" width={24} height={24} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', opacity: 0.7 }} />
                Thinking...
              </div>
            )}
{error && (
              <div style={{ alignSelf: 'flex-start', color: '#FF1744', fontSize: '12px' }}>{error}</div>
                )}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #2A2A2A', display: 'flex', gap: '8px' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={labels.placeholder}
              rows={1}
              style={{ flex: 1, resize: 'none', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '8px 10px', color: '#FFFFFF', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ background: loading || !input.trim() ? '#2A2A2A' : '#FF6B00', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0 16px', fontSize: '13px', fontWeight: 600, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close Velor AI Assistant' : 'Open Velor AI Assistant'}
        style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', background: '#0D0D0D', border: '2px solid #FF6B00', padding: 0, cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,107,0,0.4)', overflow: 'hidden' }}
      >
        <img src={AVATAR} alt="Velor AI Assistant" width={60} height={60} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
{isOpen && (
          <span style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,13,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '13px', fontWeight: 700 }}>Close</span>
        )}
        <span style={{ position: 'absolute', bottom: '3px', right: '3px', width: '12px', height: '12px', borderRadius: '50%', background: '#00E676', border: '2px solid #0D0D0D' }} />
      </button>
    </div>
  )
}
