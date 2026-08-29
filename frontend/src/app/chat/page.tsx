'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { chatApi, User, ChatConversation, ChatMessage } from '@/lib/api';

function ChatContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/chat');
      return;
    }

    // Load initial conversations
    loadConversations();

    // Setup periodic polling for new messages (every 4 seconds)
    const interval = setInterval(() => {
      loadConversations(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [user]);

  // Read search params to auto-open chat
  useEffect(() => {
    const partnerId = searchParams.get('userId');
    const partnerName = searchParams.get('userName') || 'Seller';
    const partnerEmail = searchParams.get('userEmail') || '';
    const productId = searchParams.get('productId') || undefined;

    if (partnerId) {
      const mockPartner: User = {
        id: partnerId,
        name: partnerName,
        email: partnerEmail,
        role: 'BUYER', // Default role for mapping
      };
      setActivePartner(mockPartner);
      if (productId) {
        setActiveProductId(productId);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (activePartner) {
      loadMessages(activePartner.id, activeProductId);
    }
  }, [activePartner, activeProductId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async (silent = false) => {
    try {
      if (!silent) setLoadingConv(true);
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (!silent) setLoadingConv(false);
    }
  };

  const loadMessages = async (partnerId: string, productId?: string) => {
    try {
      setLoadingMsg(true);
      const data = await chatApi.getMessages(partnerId, productId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner || !inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const newMsg = await chatApi.sendMessage(activePartner.id, textToSend, activeProductId);
      setMessages(prev => [...prev, newMsg]);
      loadConversations(true);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const selectConversation = (conv: ChatConversation) => {
    setActivePartner(conv.partner);
    setActiveProductId(conv.product?.id);
    router.replace(`/chat?userId=${conv.partner.id}&userName=${encodeURIComponent(conv.partner.name)}&userEmail=${encodeURIComponent(conv.partner.email)}${conv.product ? `&productId=${conv.product.id}` : ''}`);
  };

  if (!user) {
    return <div style={{ background: '#0A1A0F', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Redirecting to Login...</div>;
  }

  return (
    <div style={{ background: '#0A1A0F', height: 'calc(100vh - 76px)', color: '#fff', display: 'flex', overflow: 'hidden' }}>
      
      {/* Sidebar - Conversation List */}
      <div style={{
        width: 380, borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, margin: 0 }}>Chats</h1>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loadingConv && conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.5 }}>
              No chats yet. Visit the <Link href="/campus-marketplace" style={{ color: '#BBC863', textDecoration: 'underline' }}>Campus Market</Link> to message a seller!
            </div>
          ) : (
            conversations.map((conv, idx) => {
              const isSelected = activePartner?.id === conv.partner.id && activeProductId === conv.product?.id;
              const productImg = conv.product?.images?.[0]?.url || 'https://placehold.co/100';
              return (
                <div
                  key={idx}
                  onClick={() => selectConversation(conv)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12,
                    cursor: 'pointer', marginBottom: 8, transition: 'all 0.15s',
                    background: isSelected ? 'rgba(187,200,99,0.1)' : 'transparent',
                    border: isSelected ? '1px solid rgba(187,200,99,0.2)' : '1px solid transparent'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* User Profile Initial */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #BBC863, #658C58)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, color: '#1E4632', flexShrink: 0
                  }}>
                    {conv.partner.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Conv Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {conv.partner.name}
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: 12, color: isSelected ? '#BBC863' : 'rgba(255,255,255,0.5)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {conv.lastMessage}
                    </div>

                    {/* Associated Product Label */}
                    {conv.product && (
                      <div style={{ fontSize: 10, color: '#BBC863', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span>🛍️</span>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{conv.product.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {!conv.isRead && !isSelected && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#BBC863', flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0A1A0F' }}>
        {activePartner ? (
          <>
            {/* Header info */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #BBC863, #658C58)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, color: '#1E4632'
                }}>
                  {activePartner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{activePartner.name}</h3>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{activePartner.email}</span>
                </div>
              </div>

              {/* Product link badge if available */}
              {activeProductId && messages.length > 0 && messages[0].product && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                  borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{messages[0].product.title}</div>
                    <div style={{ color: '#BBC863', fontWeight: 700, fontSize: 11 }}>₹{messages[0].product.price}</div>
                  </div>
                  <Link href={`/products/${messages[0].product.slug}`} style={{
                    background: '#BBC863', color: '#1E4632', border: 'none',
                    padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontSize: 10, textDecoration: 'none'
                  }}>
                    View
                  </Link>
                </div>
              )}
            </div>

            {/* Messages list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 10px' }}>
              {loadingMsg && messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading messages...</div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        marginBottom: 16
                      }}
                    >
                      <div style={{
                        maxWidth: '65%',
                        background: isOwn ? '#BBC863' : 'rgba(255,255,255,0.06)',
                        color: isOwn ? '#1E4632' : '#fff',
                        padding: '12px 16px',
                        borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {msg.message}
                        </p>
                        <div style={{
                          textAlign: 'right', fontSize: 9, marginTop: 4,
                          color: isOwn ? 'rgba(30,70,50,0.6)' : 'rgba(255,255,255,0.4)'
                        }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12 }}>
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '14px 20px', color: '#fff', fontSize: 14, outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                style={{
                  background: '#BBC863', color: '#1E4632', border: 'none',
                  borderRadius: 12, padding: '0 24px', fontWeight: 700, cursor: 'pointer',
                  opacity: inputText.trim() ? 1 : 0.6
                }}
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', padding: 24 }}>
            <span style={{ fontSize: 48, marginBottom: 16 }}>💬</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>In-App Student Chat</h2>
            <p style={{ maxWidth: 360, textAlign: 'center', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              Select an active conversation on the left, or view an item on the Campus Market to start a chat with the seller!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--orvo-border)', borderTop: '3px solid var(--orvo-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--orvo-text-muted)' }}>Loading chat hub…</p>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
