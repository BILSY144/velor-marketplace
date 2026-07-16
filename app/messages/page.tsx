'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Msg {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
  sender: { id: string; name: string | null; image: string | null }
  receiver: { id: string; name: string | null; image: string | null }
  product: { id: string; name: string; images: string[] } | null
}

interface Thread {
  key: string
  otherId: string
  otherName: string
  otherImage: string | null
  product: Msg['product']
  messages: Msg[]
  lastMessage: Msg
  unreadCount: number
}

function buildThreads(messages: Msg[], myId: string): Thread[] {
  const map = new Map<string, Msg[]>()
  for (const m of messages) {
    const otherId = m.senderId === myId ? m.receiverId : m.senderId
    const key = [myId, otherId].sort().join('_') + (m.product ? '_' + m.product.id : '')
    const arr = map.get(key) ?? []
    arr.push(m)
    map.set(key, arr)
  }
  const threads: Thread[] = []
  for (const [key, msgs] of map.entries()) {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    const last = sorted[sorted.length - 1]
    const otherId = last.senderId === myId ? last.receiverId : last.senderId
    const other = last.senderId === myId ? last.receiver : last.sender
    threads.push({
      key,
      otherId,
      otherName: other.name ?? 'User',
      otherImage: other.image,
      product: last.product,
      messages: sorted,
      lastMessage: last,
      unreadCount: msgs.filter(m => !m.isRead && m.receiverId === myId).length,
    })
  }
  return threads.sort(
    (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function Avatar({ name, image, size = 36 }: { name: string; image: string | null; size?: number }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' as const, flexShrink: 0 }}
      />
    )
  }
  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.floor(size * 0.36), fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/sign-in')
  }, [status, router])

  const myId = (session?.user as { id?: string } | undefined)?.id ?? ''

  async function loadMessages() {
    if (!myId) return
    try {
      const r = await fetch('/api/messages')
      const data: Msg[] = await r.json()
      if (Array.isArray(data)) setThreads(buildThreads(data, myId))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      void loadMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, myId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeKey, threads])

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading messages...</p>
      </div>
    )
  }

  const activeThread = threads.find(t => t.key === activeKey) ?? null
  const totalUnread = threads.reduce((n, t) => n + t.unreadCount, 0)

  async function sendReply() {
    if (!reply.trim() || !activeThread) return
    setSending(true)
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activeThread.otherId,
          content: reply.trim(),
          ...(activeThread.product ? { productId: activeThread.product.id } : {}),
        }),
      })
      setReply('')
      await loadMessages()
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 13 }}>Home</Link>
        <span style={{ color: 'var(--border)' }}>/</span>
        <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Messages</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 49px)' }}>
        {/* Thread list */}
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <h1 style={{
              margin: 0, fontSize: 18, fontWeight: 700,
              color: 'var(--text)', fontFamily: 'var(--font-display)',
            }}>
              Inbox
            </h1>
            {totalUnread > 0 && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                {totalUnread} unread
              </p>
            )}
          </div>

          {threads.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', flex: 1 }}>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 8px' }}>No messages yet</p>
              <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 20px' }}>
                Contact a seller from any product page to start a conversation.
              </p>
              <Link href="/shop" style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none' }}>
                Browse products
              </Link>
            </div>
          ) : (
            threads.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveKey(t.key)}
                style={{
                  width: '100%', textAlign: 'left',
                  background: activeKey === t.key ? 'var(--surface)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--border)',
                  padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <Avatar name={t.otherName} image={t.otherImage} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{
                      fontSize: 14, fontWeight: t.unreadCount > 0 ? 700 : 600,
                      color: 'var(--text)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t.otherName}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
                      {timeAgo(t.lastMessage.createdAt)}
                    </span>
                  </div>
                  {t.product && (
                    <span style={{ fontSize: 11, color: 'var(--accent)', display: 'block', marginTop: 1 }}>
                      {t.product.name.length > 30 ? t.product.name.slice(0, 30) + '...' : t.product.name}
                    </span>
                  )}
                  <span style={{
                    fontSize: 13, color: 'var(--muted)', display: 'block',
                    marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {t.lastMessage.content.length > 50
                      ? t.lastMessage.content.slice(0, 50) + '...'
                      : t.lastMessage.content}
                  </span>
                </div>
                {t.unreadCount > 0 && (
                  <div style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {t.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Conversation panel */}
        {activeThread ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Conversation header */}
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
            }}>
              <Avatar name={activeThread.otherName} image={activeThread.otherImage} size={36} />
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  {activeThread.otherName}
                </p>
                {activeThread.product && (
                  <Link
                    href={`/shop/${activeThread.product.id}`}
                    style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    Re: {activeThread.product.name}
                  </Link>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {activeThread.messages.map(m => {
                const isMine = m.senderId === myId
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                      gap: 8, alignItems: 'flex-end',
                    }}
                  >
                    {!isMine && (
                      <Avatar name={activeThread.otherName} image={activeThread.otherImage} size={28} />
                    )}
                    <div style={{ maxWidth: 480 }}>
                      <div style={{
                        background: isMine ? 'var(--accent)' : 'var(--surface)',
                        color: 'var(--text)',
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        padding: '10px 14px', fontSize: 14, wordBreak: 'break-word' as const,
                        border: isMine ? 'none' : '1px solid var(--border)',
                      }}>
                        {m.content}
                      </div>
                      <p style={{
                        margin: '3px 0 0', fontSize: 11, color: 'var(--muted)',
                        textAlign: isMine ? 'right' : 'left',
                      }}>
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <div style={{
              padding: '12px 20px', borderTop: '1px solid var(--border)',
              display: 'flex', gap: 10, flexShrink: 0,
            }}>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void sendReply()
                  }
                }}
                placeholder="Write a message... (Enter to send, Shift+Enter for new line)"
                rows={2}
                style={{
                  flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px', color: 'var(--text)',
                  fontSize: 14, fontFamily: 'var(--font-body)', resize: 'none' as const, outline: 'none',
                }}
              />
              <button
                onClick={() => void sendReply()}
                disabled={sending || !reply.trim()}
                style={{
                  background: sending || !reply.trim() ? 'var(--border)' : 'var(--accent)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '0 20px', fontSize: 14, fontWeight: 600,
                  cursor: sending || !reply.trim() ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: 'var(--muted)', margin: '0 0 6px' }}>Select a conversation</p>
              <p style={{ fontSize: 13, color: 'var(--border)', margin: 0 }}>
                Choose a thread from the left to read and reply
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
