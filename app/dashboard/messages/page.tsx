'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSellerTier, PlanBadge } from '@/lib/dashboard-theme';

// The API sends a privacy-safe display name only (store name for sellers,
// "First L." for buyers) -- it never sends the other party's email address.
interface OtherUser {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
}

interface ConversationEntry {
  conversationId: string;
  otherUser: OtherUser;
  product: Product | null;
  lastMessage: { content: string; createdAt: string; senderId: string };
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string };
}

export default function DashboardMessagesPage() {
  const { tier, theme } = useSellerTier();
  const isPro = tier === 'PRO';
  const isElevated = tier !== 'STARTER';
  const accentColor = isPro ? '#FFD54A' : isElevated ? '#4FC3F7' : 'var(--accent)';

  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [selected, setSelected] = useState<ConversationEntry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/messages');
    if (res.ok) {
      const data = await res.json() as { currentUserId: string; conversations: ConversationEntry[] };
      setCurrentUserId(data.currentUserId);
      setConversations(data.conversations);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function openConversation(conv: ConversationEntry) {
    setSelected(conv);
    setLoadingThread(true);
    setMessages([]);
    const url = '/api/messages/' + conv.conversationId + (conv.product ? '?productId=' + conv.product.id : '');
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json() as { messages: Message[]; currentUserId: string; otherUser: OtherUser };
      setMessages(data.messages);
      setCurrentUserId(data.currentUserId);
      setOtherUser(data.otherUser);
    }
    setLoadingThread(false);
    fetchConversations();
  }

  async function sendMessage() {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: selected.otherUser.id,
        productId: selected.product?.id ?? null,
        content: draft.trim(),
      }),
    });
    if (res.ok) {
      const data = await res.json() as { message: Message };
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function initials(name: string | null | undefined) {
    if (name) return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
    return 'VM';
  }

  const totalUnread = conversations.reduce((n, c) => n + c.unreadCount, 0);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', fontFamily: 'var(--font-body)' }}>
      {/* Conversation list */}
      <div style={{ width: 320, borderRight: `1px solid ${isElevated ? theme.cardBorder : 'var(--border)'}`, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Inbox</h2>
          {totalUnread > 0 && (
            <span style={{ background: accentColor, color: isPro ? '#111' : '#000', fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 7px' }}>{totalUnread}</span>
          )}
          <PlanBadge tier={tier} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, color: 'var(--muted)', fontSize: 14 }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--muted)', fontSize: 14 }}>No messages yet.</div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selected?.conversationId === conv.conversationId && selected?.product?.id === conv.product?.id;
              const displayName = conv.otherUser.name;
              return (
                <button
                  key={conv.conversationId + (conv.product?.id ?? '')}
                  onClick={() => openConversation(conv)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: isSelected ? (isElevated ? theme.rowHoverBg : 'var(--surface)') : 'transparent',
                    border: 'none',
                    borderLeft: isSelected && isElevated ? `3px solid ${accentColor}` : '3px solid transparent',
                    borderBottom: '1px solid var(--border)',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: accentColor, flexShrink: 0 }}>
                    {initials(conv.otherUser.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: conv.unreadCount > 0 ? 700 : 400, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>{displayName}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{formatTime(conv.lastMessage.createdAt)}</span>
                    </div>
                    {conv.product && (
                      <div style={{ fontSize: 11, color: accentColor, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.product.title}</div>
                    )}
                    <div style={{ fontSize: 13, color: conv.unreadCount > 0 ? 'var(--text)' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage.senderId === currentUserId ? 'You: ' : ''}{conv.lastMessage.content}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0, marginTop: 6 }} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Thread panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 15 }}>
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              {isPro && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #FFD54A, #FF6B00)' }} />
              )}
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: accentColor }}>
                {initials(otherUser?.name ?? selected.otherUser.name)}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                  {otherUser?.name ?? selected.otherUser.name}
                </div>
                {selected.product && (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Re: {selected.product.title}</div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
              {loadingThread ? (
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</div>
              ) : messages.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>No messages in this conversation yet.</div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                      <div style={{ maxWidth: '70%' }}>
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isMine ? accentColor : 'var(--surface)',
                            color: isMine ? (isPro ? '#111' : '#000') : 'var(--text)',
                            fontSize: 14,
                            lineHeight: 1.5,
                            border: isMine ? 'none' : '1px solid var(--border)',
                          }}
                        >
                          {msg.content}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Compose */}
            <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message... (Enter to send)"
                rows={2}
                style={{
                  flex: 1,
                  resize: 'none',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: 'var(--text)',
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  lineHeight: 1.5,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !draft.trim()}
                style={{
                  background: accentColor,
                  color: isPro ? '#111' : '#000',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: sending || !draft.trim() ? 'not-allowed' : 'pointer',
                  opacity: sending || !draft.trim() ? 0.5 : 1,
                  height: 44,
                  whiteSpace: 'nowrap',
                }}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
