'use client'

  import { useState, useRef, useEffect } from 'react'

    type ChatMessage = { role: 'user' | 'assistant'; content: string }

    const GREETING: ChatMessage = {
        role: 'assistant',
      content: "Hi, I'm Velor's AI Business Assistant. Ask me about fees, payouts, escrow timing, listing tips, or Velor policies.",
    }

    export default function VelorAssistant() {
      const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

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
        body: JSON.stringify({ messages: nextMessages }),
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

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200 }}>
{isOpen && (
        <div style={{ width: '360px', height: '480px', background: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', display: 'flex', flexDirection: 'column', marginBottom: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>Velor AI Business Assistant</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999999' }}>Always-on AI, not a human</p>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#999999', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>x</button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
{messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: m.role === 'user' ? '#FF6B00' : '#1C1C1C', color: m.role === 'user' ? '#FFFFFF' : '#E5E5E5', padding: '8px 12px', borderRadius: '10px', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
{m.content}
              </div>
            ))}
{loading && (
              <div style={{ alignSelf: 'flex-start', color: '#999999', fontSize: '12px' }}>Thinking...</div>
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
              placeholder="Ask about fees, payouts, listings..."
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
        style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FF6B00', border: 'none', color: '#FFFFFF', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,107,0,0.4)' }}
      >
{isOpen ? 'Close' : 'AI'}
      </button>
    </div>
  )
}
