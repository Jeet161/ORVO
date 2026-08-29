'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sellersApi, productsApi, ordersApi, SellerAnalytics, Product, Order } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

type Section = 'overview' | 'products' | 'orders';

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  PENDING:    { bg: 'rgba(245,158,11,0.12)',  color: '#b45309' },
  CONFIRMED:  { bg: 'rgba(59,130,246,0.12)',  color: '#1d4ed8' },
  PROCESSING: { bg: 'rgba(139,92,246,0.12)',  color: '#6d28d9' },
  SHIPPED:    { bg: 'rgba(6,182,212,0.12)',   color: '#0e7490' },
  DELIVERED:  { bg: 'rgba(34,197,94,0.12)',   color: '#15803d' },
  CANCELLED:  { bg: 'rgba(239,68,68,0.12)',   color: '#b91c1c' },
  APPROVED:   { bg: 'rgba(34,197,94,0.12)',   color: '#15803d' },
  REJECTED:   { bg: 'rgba(239,68,68,0.12)',   color: '#b91c1c' },
  OUT_OF_STOCK: { bg: 'rgba(100,100,100,0.12)', color: '#555' },
};

function Badge({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? { bg: 'rgba(100,100,100,0.12)', color: '#555' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {status}
    </span>
  );
}

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function SellerDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>('overview');
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [notOnboarded, setNotOnboarded] = useState(false);
  const [onboardLoading, setOnboardLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== 'SELLER' && user.role !== 'BUYER')) { router.push('/'); return; }
    
    Promise.all([
      sellersApi.getAnalytics(),
      productsApi.getSellerProducts(),
      ordersApi.getSellerOrders(),
    ]).then(([a, p, o]) => {
      setAnalytics(a);
      setProducts(p);
      setOrders(o);
    }).catch((err) => {
      setNotOnboarded(true);
    }).finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleOnboard = async () => {
    setOnboardLoading(true);
    try {
      await sellersApi.studentOnboard();
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Onboarding failed');
    } finally {
      setOnboardLoading(false);
    }
  };

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);
    try {
      await ordersApi.updateStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } finally { setUpdatingOrder(null); }
  }, []);

  if (authLoading || (loading && !notOnboarded)) return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--orvo-border)', borderTop: '3px solid var(--orvo-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--orvo-text-muted)' }}>Loading your seller dashboard…</p>
      </div>
    </div>
  );

  if (notOnboarded) {
    return (
      <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', background: 'var(--orvo-bg)', padding: 24 }}>
        <div style={{
          background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)',
          borderRadius: 24, padding: '48px 36px', maxWidth: 480, textAlign: 'center',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🏫</span>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 900, color: 'var(--orvo-text)', marginBottom: 12 }}>Campus Corner</h2>
          <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            Activate your student corner to sell or rent used books, hostel sharing essentials, cycles, and lab equipment to fellow students!
          </p>
          <button
            onClick={handleOnboard}
            disabled={onboardLoading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, background: 'var(--orvo-primary)',
              color: '#fff', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {onboardLoading ? 'Activating…' : '⚡ Activate Student Corner'}
          </button>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;

  const NAV: { key: Section; label: string; icon: string; badge?: number }[] = [
    { key: 'overview',  label: 'Overview',  icon: '📊' },
    { key: 'products',  label: 'My Products', icon: '📦', badge: products.filter(p => p.status === 'PENDING').length },
    { key: 'orders',    label: 'Orders',    icon: '🛒', badge: pendingOrders },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--orvo-bg)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: '#1E4632',
        display: 'flex', flexDirection: 'column',
        padding: '36px 0',
        position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ padding: '0 22px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#BBC863', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>ORVO</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Seller HQ</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Your shop management centre</div>
        </div>

        {/* Seller info */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #BBC863, #658C58)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 16, color: '#1E4632', flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#BBC863', textTransform: 'uppercase', letterSpacing: 0.8 }}>Verified Seller</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {NAV.map(item => {
            const active = section === item.key;
            return (
              <button key={item.key} onClick={() => setSection(item.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                marginBottom: 4, textAlign: 'left', fontSize: 14,
                background: active ? 'rgba(187,200,99,0.15)' : 'transparent',
                color: active ? '#BBC863' : 'rgba(255,255,255,0.6)',
                fontWeight: active ? 700 : 500, transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span style={{ background: '#f59e0b', color: '#000', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 7px', minWidth: 20, textAlign: 'center' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/seller/products/new" style={{
            display: 'block', padding: '10px 14px', borderRadius: 10, textDecoration: 'none', textAlign: 'center',
            background: 'rgba(187,200,99,0.2)', color: '#BBC863',
            border: '1px solid rgba(187,200,99,0.35)', fontWeight: 800, fontSize: 13,
          }}>
            + Add New Product
          </Link>
          <Link href="/products" style={{
            display: 'block', padding: '9px 14px', borderRadius: 10, textDecoration: 'none', textAlign: 'center',
            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13,
          }}>
            🛍️ View Marketplace
          </Link>
          <button onClick={logout} style={{
            width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: 13,
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: '36px 32px', overflowY: 'auto', maxWidth: 'calc(100vw - 240px)' }}>

        {/* ═══ OVERVIEW ═══ */}
        {section === 'overview' && analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>Overview</h1>
                <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14 }}>Welcome back, {user?.name?.split(' ')[0]}! Here's your shop at a glance.</p>
              </div>
              <button onClick={() => setSection('products')} style={{
                padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'var(--orvo-primary)', color: '#fff', fontWeight: 700, fontSize: 14,
              }}>
                + Add Product
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              {[
                { icon: '💰', label: 'Total Revenue', value: `₹${analytics.totalSales.toLocaleString('en-IN')}`, color: '#22c55e' },
                { icon: '🛒', label: 'Total Orders', value: analytics.totalOrders, color: '#3b82f6' },
                { icon: '🛍️', label: 'Products Sold', value: analytics.productsSold, color: '#a855f7' },
                { icon: '⏳', label: 'Pending Orders', value: analytics.pendingOrders, color: '#f59e0b' },
                { icon: '📊', label: 'Avg Order Value', value: `₹${analytics.avgOrderValue.toFixed(0)}`, color: 'var(--orvo-primary)' },
                { icon: '📦', label: 'My Products', value: analytics.totalProducts, color: '#0ea5e9' },
              ].map(c => (
                <div key={c.label} style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 14, padding: '20px', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginTop: 6, fontWeight: 600 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Performance bars */}
            <div style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 16, padding: '24px', boxShadow: 'var(--shadow-card)' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, margin: '0 0 20px' }}>Shop Performance</h3>
              {[
                { label: 'Fulfilment Rate', value: analytics.totalOrders > 0 ? Math.round((analytics.productsSold / analytics.totalOrders) * 100) : 0 },
                { label: 'Products Listed', value: analytics.totalProducts > 0 ? Math.min(100, analytics.totalProducts * 10) : 0 },
                { label: 'Order Value Strength', value: analytics.avgOrderValue > 0 ? Math.min(100, Math.round(analytics.avgOrderValue / 50)) : 0 },
              ].map(bar => (
                <div key={bar.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <span style={{ color: 'var(--orvo-text-muted)' }}>{bar.label}</span>
                    <span style={{ color: 'var(--orvo-primary)' }}>{bar.value}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--orvo-surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${bar.value}%`, background: 'linear-gradient(90deg, var(--orvo-primary), var(--orvo-accent))', borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent orders mini */}
            <div style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--orvo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>Recent Orders</h3>
                <button onClick={() => setSection('orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--orvo-primary)', fontWeight: 700, fontSize: 13 }}>View all →</button>
              </div>
              {orders.slice(0, 5).map(o => (
                <div key={o.id} style={{ padding: '12px 22px', borderBottom: '1px solid var(--orvo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--orvo-primary)' }}>#{o.id.slice(-8).toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginLeft: 10 }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Badge status={o.status} />
                    <span style={{ fontWeight: 700 }}>₹{o.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: 'var(--orvo-text-muted)', fontStyle: 'italic' }}>No orders yet.</div>}
            </div>
          </div>
        )}

        {/* ═══ PRODUCTS ═══ */}
        {section === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>My Products</h1>
                <p style={{ color: 'var(--orvo-text-muted)', fontSize: 13 }}>{products.length} product{products.length !== 1 ? 's' : ''} in your catalogue</p>
              </div>
              <Link href="/seller/products/new" style={{
                padding: '10px 20px', borderRadius: 10, background: 'var(--orvo-primary)', color: '#fff',
                textDecoration: 'none', fontWeight: 700, fontSize: 13,
              }}>+ Add Product</Link>
            </div>

            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--orvo-text-muted)' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>📦</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 8 }}>No products yet</h3>
                <p style={{ marginBottom: 20 }}>Add your first product to start selling.</p>
                <Link href="/seller/products/new" style={{ padding: '11px 24px', borderRadius: 10, background: 'var(--orvo-primary)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Add First Product</Link>
              </div>
            ) : products.map(p => {
              const img = p.images?.find(i => i.isPrimary) || p.images?.[0];
              return (
                <div key={p.id} style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', background: 'var(--orvo-surface-2)', flexShrink: 0, border: '1px solid var(--orvo-border)' }}>
                    {img ? <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginTop: 3 }}>₹{p.price.toLocaleString('en-IN')} · Stock: {p.stock} · {p.category?.name}</div>
                  </div>
                  <Badge status={p.status} />
                  <Link href={`/seller/products/${p.id}/edit`} style={{
                    padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                    background: 'var(--orvo-surface-2)', color: 'var(--orvo-text)', border: '1px solid var(--orvo-border)',
                  }}>Edit</Link>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ ORDERS ═══ */}
        {section === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Orders</h1>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--orvo-text-muted)' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>🛒</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20 }}>No orders yet</h3>
                <p>Orders will appear here once buyers purchase your products.</p>
              </div>
            ) : orders.map(o => (
              <div key={o.id} style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--orvo-primary)' }}>#{o.id.slice(-8).toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginLeft: 10 }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>₹{o.totalAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* Items */}
                <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {o.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 12px', background: 'var(--orvo-surface-2)', borderRadius: 8 }}>
                      <span style={{ color: 'var(--orvo-text-muted)' }}>{item.product?.title ?? 'Product'} × {item.quantity}</span>
                      <span style={{ fontWeight: 700 }}>₹{item.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                {/* Status + update */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Badge status={o.status} />
                  {!['DELIVERED', 'CANCELLED'].includes(o.status) && (
                    <select
                      value={o.status}
                      disabled={updatingOrder === o.id}
                      onChange={e => updateOrderStatus(o.id, e.target.value)}
                      style={{
                        background: 'var(--orvo-surface-2)', border: '1px solid var(--orvo-border)',
                        borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--orvo-text)',
                        cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      {STATUS_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  {updatingOrder === o.id && <span style={{ fontSize: 12, color: 'var(--orvo-text-muted)' }}>Updating…</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
