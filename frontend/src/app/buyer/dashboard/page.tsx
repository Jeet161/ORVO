'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ordersApi, wishlistApi, notificationsApi, Order, WishlistItem, Notification } from '@/lib/api';

type Section = 'overview' | 'orders' | 'wishlist' | 'notifications';

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  PENDING:    { bg: 'rgba(245,158,11,0.12)',  color: '#b45309' },
  CONFIRMED:  { bg: 'rgba(59,130,246,0.12)',  color: '#1d4ed8' },
  PROCESSING: { bg: 'rgba(139,92,246,0.12)',  color: '#6d28d9' },
  SHIPPED:    { bg: 'rgba(6,182,212,0.12)',   color: '#0e7490' },
  DELIVERED:  { bg: 'rgba(34,197,94,0.12)',   color: '#15803d' },
  CANCELLED:  { bg: 'rgba(239,68,68,0.12)',   color: '#b91c1c' },
  PAID:       { bg: 'rgba(34,197,94,0.12)',   color: '#15803d' },
  FAILED:     { bg: 'rgba(239,68,68,0.12)',   color: '#b91c1c' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? { bg: 'rgba(100,100,100,0.12)', color: '#555' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {status}
    </span>
  );
}

export default function BuyerDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    // Redirect sellers/admins to their own dashboards
    if (user.role === 'SELLER') { router.push('/seller/dashboard'); return; }
    if (user.role === 'ADMIN')  { router.push('/admin/dashboard');  return; }

    // Parse section from URL query
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const secParam = urlParams.get('sec') as Section;
      if (secParam && ['overview', 'orders', 'wishlist', 'notifications'].includes(secParam)) {
        setSection(secParam);
      }
    }

    Promise.all([
      ordersApi.getMyOrders(),
      wishlistApi.get(),
      notificationsApi.getAll(),
      notificationsApi.getUnreadCount(),
    ]).then(([o, w, n, u]) => {
      setOrders(o);
      setWishlist(w);
      setNotifications(n);
      setUnread(u.count);
    }).finally(() => setLoading(false));
  }, [user, authLoading]);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
    setUnread(u => Math.max(0, u - 1));
  };

  const NAV = [
    { key: 'overview' as Section,       label: 'My Dashboard',   icon: '🏠', badge: 0 },
    { key: 'orders' as Section,         label: 'My Orders',      icon: '📦', badge: orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length },
    { key: 'wishlist' as Section,       label: 'Wishlist',       icon: '❤️', badge: wishlist.length },
    { key: 'notifications' as Section,  label: 'Notifications',  icon: '🔔', badge: unread },
  ];

  if (loading || authLoading) return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--orvo-border)', borderTop: '3px solid var(--orvo-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--orvo-text-muted)' }}>Loading your dashboard…</p>
      </div>
    </div>
  );

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'DELIVERED');
  const totalSpent = completedOrders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--orvo-bg)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--orvo-surface)',
        borderRight: '1px solid var(--orvo-border)',
        display: 'flex', flexDirection: 'column',
        padding: '32px 0',
        position: 'sticky', top: 64,
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
      }}>
        {/* Profile */}
        <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--orvo-border)', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 12px',
            background: 'linear-gradient(135deg, var(--orvo-primary) 0%, var(--orvo-accent) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 22, color: '#fff',
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginTop: 2 }}>{user?.email}</div>
          <span style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(49,105,78,0.1)', color: 'var(--orvo-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Buyer
          </span>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {NAV.map(item => (
            <button key={item.key} onClick={() => setSection(item.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              marginBottom: 4, textAlign: 'left', fontSize: 14,
              background: section === item.key ? 'rgba(49,105,78,0.08)' : 'transparent',
              color: section === item.key ? 'var(--orvo-primary)' : 'var(--orvo-text)',
              fontWeight: section === item.key ? 700 : 500,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ background: 'var(--orvo-primary)', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 7px', minWidth: 20, textAlign: 'center' }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--orvo-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/seller/apply" style={{
            display: 'block', padding: '9px 14px', borderRadius: 10, textDecoration: 'none', textAlign: 'center',
            background: 'rgba(187,200,99,0.15)', color: 'var(--orvo-primary)',
            border: '1px solid var(--orvo-accent)', fontWeight: 700, fontSize: 13,
          }}>
            🏪 Become a Seller
          </Link>
          <button onClick={logout} style={{
            width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid var(--orvo-border)',
            cursor: 'pointer', background: 'transparent', color: 'var(--orvo-text-muted)', fontWeight: 500, fontSize: 13,
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: '36px 32px', overflowY: 'auto', maxWidth: 'calc(100vw - 240px)' }}>

        {/* ═══ OVERVIEW ═══ */}
        {section === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>
                Welcome back, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14 }}>Here's a summary of your account activity.</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              {[
                { icon: '📦', label: 'Total Orders', value: orders.length, color: '#3b82f6' },
                { icon: '🚚', label: 'Active Orders', value: activeOrders.length, color: '#f59e0b' },
                { icon: '✅', label: 'Delivered', value: completedOrders.length, color: '#22c55e' },
                { icon: '💰', label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: 'var(--orvo-primary)' },
                { icon: '❤️', label: 'Wishlist Items', value: wishlist.length, color: '#e11d48' },
                { icon: '🔔', label: 'Unread Alerts', value: unread, color: '#7c3aed' },
              ].map(c => (
                <div key={c.label} style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 14, padding: '20px', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginTop: 4, fontWeight: 600 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--orvo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>Recent Orders</h3>
                <button onClick={() => setSection('orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--orvo-primary)', fontWeight: 700, fontSize: 13 }}>View all →</button>
              </div>
              {orders.slice(0, 4).map(o => (
                <div key={o.id} style={{ padding: '14px 22px', borderBottom: '1px solid var(--orvo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13, color: 'var(--orvo-primary)' }}>#{o.id.slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginTop: 2 }}>{o.items.length} item(s) · {new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StatusBadge status={o.status} />
                    <span style={{ fontWeight: 700 }}>₹{o.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--orvo-text-muted)' }}>
                  <p style={{ marginBottom: 14 }}>No orders yet. Start shopping!</p>
                  <Link href="/products" style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--orvo-primary)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                    Browse Products
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ORDERS ═══ */}
        {section === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>My Orders</h1>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--orvo-text-muted)' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>📭</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif' }}>No orders yet</h3>
                <p style={{ marginBottom: 20 }}>Your orders will appear here once you make a purchase.</p>
                <Link href="/products" style={{ padding: '11px 24px', borderRadius: 10, background: 'var(--orvo-primary)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Shop Now</Link>
              </div>
            ) : orders.map(o => (
              <div key={o.id} style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--orvo-primary)' }}>#{o.id.slice(-8).toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginLeft: 10 }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <StatusBadge status={o.paymentStatus} />
                    <StatusBadge status={o.status} />
                    <span style={{ fontWeight: 800, fontSize: 16 }}>₹{o.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {o.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--orvo-text-muted)', padding: '8px 12px', background: 'var(--orvo-surface-2)', borderRadius: 8 }}>
                      <span>{item.product?.title ?? 'Product'} × {item.quantity}</span>
                      <span style={{ fontWeight: 700, color: 'var(--orvo-text)' }}>₹{item.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ WISHLIST ═══ */}
        {section === 'wishlist' && (
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, margin: '0 0 20px' }}>My Wishlist</h1>
            {wishlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--orvo-text-muted)' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>💔</div>
                <p style={{ marginBottom: 20 }}>Your wishlist is empty. Start saving items you love!</p>
                <Link href="/products" style={{ padding: '11px 24px', borderRadius: 10, background: 'var(--orvo-primary)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Browse Products</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {wishlist.map(item => {
                  const img = item.product.images?.find(i => i.isPrimary) || item.product.images?.[0];
                  return (
                    <Link key={item.id} href={`/products/${item.product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)', transition: 'box-shadow 0.2s' }}>
                        <div style={{ height: 160, background: 'var(--orvo-surface-2)', overflow: 'hidden' }}>
                          {img ? <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>}
                        </div>
                        <div style={{ padding: '14px 16px' }}>
                          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.title}</p>
                          <p style={{ fontWeight: 800, color: 'var(--orvo-primary)', fontSize: 16 }}>₹{item.product.price.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ NOTIFICATIONS ═══ */}
        {section === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, margin: 0 }}>Notifications</h1>
              {unread > 0 && (
                <button onClick={async () => { await notificationsApi.markAllRead(); setNotifications(n => n.map(x => ({ ...x, isRead: true }))); setUnread(0); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--orvo-primary)', fontWeight: 700, fontSize: 13 }}>
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--orvo-text-muted)' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>🔕</div>
                <p>No notifications yet.</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => !n.isRead && markRead(n.id)} style={{
                padding: '16px 20px', borderRadius: 14, cursor: n.isRead ? 'default' : 'pointer',
                background: n.isRead ? 'var(--orvo-surface)' : 'rgba(49,105,78,0.05)',
                border: `1px solid ${n.isRead ? 'var(--orvo-border)' : 'rgba(49,105,78,0.2)'}`,
                display: 'flex', gap: 14, alignItems: 'flex-start',
                transition: 'all 0.15s',
              }}>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orvo-primary)', flexShrink: 0, marginTop: 6 }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 14, margin: '0 0 4px' }}>{n.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--orvo-text-muted)', margin: 0 }}>{n.message}</p>
                  <p style={{ fontSize: 11, color: 'var(--orvo-text-faint)', marginTop: 6 }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
