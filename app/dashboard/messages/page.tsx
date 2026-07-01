'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: { id: string; name: string | null; email: string };
  receiver: { id: string; name: string | null; email: string };
  product: { id: string; name: string; images: string[] };
}

interface Thread {
  key: string;
  productId: string;
  productName: string;
  productImage: string;
  otherParty: { id: string; name: string | null; email: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
}

interface ThreadsResponse {
  threads: Thread[];
  totalUnread: number;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/messages');
      if (!res.ok) throw new Error('Failed to load messages');
      const data: ThreadsResponse = await res.json();
      setThreads(data.threads);
      setTotalUnread(data.totalUnread);
    } catch {
      setError('Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') fetchThreads();
  }, [status, fetchThreads]);

  const selectThread = useCallback(async (thread: Thread) => {
    setSelectedThread(thread);
    setLoadingMessages(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/messages?productId=${thread.productId}&sellerId=${thread.otherParty.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages ?? []);
      // Refresh threads to update unread counts
      fetchThreads();
    } catch {
      setMessages(thread.messages ?? []);
    } finally {
      setLoadingMessages(false);
    }
  }, [fetchThreads]);

  const sendReply = useCallback(async () => {
    if (!replyText.trim() || !selectedThread) return;
    setSending(true);
    try {
      const res = await fetch('/api/dashboard/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedThread.otherParty.id,
          productId: selectedThread.productId,
          content: replyText.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setReplyText('');
      fetchThreads();
    } catch {
      setError('Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [replyText, selectedThread, fetchThreads]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
        <div style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>Loading messages...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '32px 32px 0', borderBottom: '1px solid #2A2A2A', marginBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              Messages
              {totalUnread > 0 && (
                <span style={{
                  marginLeft: '12px',
                  background: '#FF6B00',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  verticalAlign: 'middle',
                }}>
                  {totalUnread} unread
                </span>
              )}
            </h1>
            <p style={{ color: '#999', fontSize: '14px', margin: '4px 0 0' }}>
              Customer conversations about your products
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ margin: '16px 32px', padding: '12px 16px', background: '#2A1A1A', border: '1px solid #FF1744', borderRadius: '8px', color: '#FF1744', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', height: 'calc(100vh - 113px)' }}>
        {/* Thread list */}
        <div style={{
          width: '340px',
          minWidth: '340px',
          borderRight: '1px solid #2A2A2A',
          overflowY: 'auto',
        }}>
          {threads.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}>&#9993;</div>
              <div style={{ color: '#999', fontSize: '14px', lineHeight: 1.6 }}>
                No messages yet.<br />
                Buyers can contact you from your product pages.
              </div>
            </div>
          ) : (
            threads.map(thread => (
              <button
                key={thread.key}
                onClick={() => selectThread(thread)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  width: '100%',
                  padding: '16px 20px',
                  background: selectedThread?.key === thread.key ? '#1A1A1A' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #2A2A2A',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (selectedThread?.key !== thread.key) (e.currentTarget as HTMLButtonElement).style.background = '#111'; }}
                onMouseLeave={e => { if (selectedThread?.key !== thread.key) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {/* Product image */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: '#2A2A2A',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {thread.productImage && (
                    <img src={thread.productImage} alt={thread.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: thread.unreadCount > 0 ? 700 : 500,
                      color: '#FFFFFF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {thread.otherParty.name ?? thread.otherParty.email}
                    </span>
                    <span style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#FF6B00',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {thread.productName}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{
                      fontSize: '12px',
                      color: thread.unreadCount > 0 ? '#FFFFFF' : '#666',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {thread.lastMessage}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span style={{
                        background: '#FF6B00',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 700,
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}>
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Message thread */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedThread ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '48px', opacity: 0.15 }}>&#9993;</div>
              <div style={{ color: '#555', fontSize: '14px' }}>Select a conversation to view messages</div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #2A2A2A',
                background: '#0D0D0D',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#2A2A2A', overflow: 'hidden', flexShrink: 0 }}>
                  {selectedThread.productImage && (
                    <img src={selectedThread.productImage} alt={selectedThread.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '14px' }}>
                    {selectedThread.otherParty.name ?? selectedThread.otherParty.email}
                  </div>
                  <Link
                    href={`/shop/${selectedThread.productId}`}
                    style={{ fontSize: '12px', color: '#FF6B00', textDecoration: 'none' }}
                  >
                    {selectedThread.productName}
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', color: '#555', fontSize: '13px', paddingTop: '40px' }}>Loading...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#555', fontSize: '13px', paddingTop: '40px' }}>No messages in this thread yet.</div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender.id === session?.user?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          background: isMe ? '#FF6B00' : '#1A1A1A',
                          color: '#FFFFFF',
                          padding: '10px 14px',
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          fontSize: '14px',
                          lineHeight: 1.5,
                          border: isMe ? 'none' : '1px solid #2A2A2A',
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                          {isMe ? 'You' : (msg.sender.name ?? msg.sender.email)} · {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply input */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #2A2A2A',
                background: '#0D0D0D',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end',
              }}>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Type a reply... (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  style={{
                    flex: 1,
                    background: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    padding: '10px 14px',
                    resize: 'none',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  style={{
                    background: sending || !replyText.trim() ? '#333' : '#FF6B00',
                    color: sending || !replyText.trim() ? '#666' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: sending || !replyText.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                    whiteSpace: 'nowrap',
                    height: '60px',
                  }}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
                      }
