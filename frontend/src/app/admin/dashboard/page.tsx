'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, sellersApi, productsApi, ordersApi, AdminDashboard, SellerProfile, Product, Order } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

type Section = 'overview' | 'sellers' | 'products' | 'orders';

const NAV_ITEMS: { key: Section; label: string; icon: string }[] = [
  { key: 'overview',  label: 'Overview',        icon: '📊' },
  { key: 'sellers',   label: 'Seller Approvals', icon: '🏪' },
  { key: 'products',  label: 'Product Review',   icon: '📦' },
  { key: 'orders',    label: 'All Orders',       icon: '🛒' },
];

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  PENDING:    { bg: 'rgba(245,158,11,0.15)',  color: '#b45309' },
  CONFIRMED:  { bg: 'rgba(59,130,246,0.15)',  color: '#1d4ed8' },
  PROCESSING: { bg: 'rgba(139,92,246,0.15)',  color: '#6d28d9' },
  SHIPPED:    { bg: 'rgba(6,182,212,0.15)',   color: '#0e7490' },
  DELIVERED:  { bg: 'rgba(34,197,94,0.15)',   color: '#15803d' },
  CANCELLED:  { bg: 'rgba(239,68,68,0.15)',   color: '#b91c1c' },
  APPROVED:   { bg: 'rgba(34,197,94,0.15)',   color: '#15803d' },
  REJECTED:   { bg: 'rgba(239,68,68,0.15)',   color: '#b91c1c' },
  PAID:       { bg: 'rgba(34,197,94,0.15)',   color: '#15803d' },
  FAILED:     { bg: 'rgba(239,68,68,0.15)',   color: '#b91c1c' },
};

function Badge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? { bg: 'rgba(100,100,100,0.15)', color: '#555' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.5px',
      background: s.bg,
      color: s.color,
      textTransform: 'uppercase',
    }}>{status}</span>
  );
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>('overview');
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [pendingSellers, setPendingSellers] = useState<SellerProfile[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') { router.push('/'); return; }
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getPendingSellers(),
      adminApi.getPendingProducts(),
      adminApi.getAllOrders(),
    ]).then(([s, ps, pp, o]) => {
      setStats(s);
      setPendingSellers(ps);
      setPendingProducts(pp);
      setOrders(o);
    }).finally(() => setLoading(false));
  }, [user, authLoading]);

  const approveSeller = useCallback(async (id: string) => {
    setActioning(id);
    try {
      await sellersApi.reviewApplication(id, 'APPROVED');
      setPendingSellers(p => p.filter(s => s.id !== id));
      setStats(s => s ? { ...s, pendingSellers: s.pendingSellers - 1, totalSellers: s.totalSellers + 1 } : s);
    } finally { setActioning(null); }
  }, []);

  const rejectSeller = useCallback(async (id: string) => {
    setActioning(id);
    try {
      await sellersApi.reviewApplication(id, 'REJECTED', rejectionReason || 'Does not meet requirements.');
      setPendingSellers(p => p.filter(s => s.id !== id));
      setStats(s => s ? { ...s, pendingSellers: s.pendingSellers - 1 } : s);
      setRejectingId(null); setRejectionReason('');
    } finally { setActioning(null); }
  }, [rejectionReason]);

  const approveProduct = useCallback(async (id: string) => {
    setActioning(id);
    try {
      await productsApi.review(id, 'APPROVED');
      setPendingProducts(p => p.filter(x => x.id !== id));
      setStats(s => s ? { ...s, pendingProducts: s.pendingProducts - 1, totalProducts: s.totalProducts + 1 } : s);
    } finally { setActioning(null); }
  }, []);

  const rejectProduct = useCallback(async (id: string) => {
    setActioning(id);
    try {
      await productsApi.review(id, 'REJECTED');
      setPendingProducts(p => p.filter(x => x.id !== id));
      setStats(s => s ? { ...s, pendingProducts: s.pendingProducts - 1 } : s);
    } finally { setActioning(null); }
  }, []);

  /* ─── Loading skeleton ─── */
  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--orvo-bg)' }}>
      <aside style={{ width: 240, background: '#1E4632', padding: '32px 0' }} />
      <main style={{ flex: 1, padding: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[...Array(7)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
        </div>
      </main>
    </div>
  );

  const statCards = stats ? [
    { label: 'Total Users',      value: stats.totalUsers,    icon: '👤', color: '#5865f2', sub: 'registered accounts' },
    { label: 'Active Sellers',   value: stats.totalSellers,  icon: '🏪', color: '#00d4aa', sub: 'verified shops' },
    { label: 'Live Products',    value: stats.totalProducts, icon: '📦', color: '#a855f7', sub: 'in marketplace' },
    { label: 'Total Orders',     value: stats.totalOrders,   icon: '🛒', color: '#3b82f6', sub: 'all time' },
    { label: 'Pending Sellers',  value: stats.pendingSellers, icon: '⏳', color: '#f59e0b', sub: 'awaiting review', alert: stats.pendingSellers > 0 },
    { label: 'Pending Products', value: stats.pendingProducts, icon: '🔍', color: '#f59e0b', sub: 'awaiting approval', alert: stats.pendingProducts > 0 },
    { label: 'Platform Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: '#22c55e', sub: 'from paid orders' },
  ] : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--orvo-bg)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        background: '#1E4632',
        display: 'flex',
        flexDirection: 'column',
        padding: '36px 0',
        position: 'sticky',
        top: 64,
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, color: '#BBC863', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>
            ORVO
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Admin Console</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Platform governance</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '20px 12px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = section === item.key;
            const badge = item.key === 'sellers' ? stats?.pendingSellers : item.key === 'products' ? stats?.pendingProducts : 0;
            return (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 4,
                  background: active ? 'rgba(187,200,99,0.15)' : 'transparent',
                  color: active ? '#BBC863' : 'rgba(255,255,255,0.6)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {(badge ?? 0) > 0 && (
                  <span style={{
                    background: '#f59e0b',
                    color: '#000',
                    fontSize: 10,
                    fontWeight: 800,
                    borderRadius: 20,
                    padding: '2px 7px',
                    minWidth: 20,
                    textAlign: 'center',
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin badge */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #BBC863, #658C58)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, color: '#1E4632',
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#BBC863', textTransform: 'uppercase', letterSpacing: 1 }}>Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: '40px 36px', overflowY: 'auto', maxWidth: 'calc(100vw - 240px)' }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, margin: 0 }}>
            {NAV_ITEMS.find(n => n.key === section)?.icon}{' '}
            {NAV_ITEMS.find(n => n.key === section)?.label}
          </h1>
          <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14, marginTop: 4 }}>
            {section === 'overview' && 'Platform health at a glance'}
            {section === 'sellers' && `${stats?.pendingSellers ?? 0} applications waiting for your decision`}
            {section === 'products' && `${stats?.pendingProducts ?? 0} products waiting for moderation`}
            {section === 'orders' && `${orders.length} orders in the system`}
          </p>
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {section === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Alert banners */}
            {(stats?.pendingSellers ?? 0) + (stats?.pendingProducts ?? 0) > 0 && (
              <div style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 14,
                padding: '14px 20px',
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
              }}>
                {(stats?.pendingSellers ?? 0) > 0 && (
                  <button onClick={() => setSection('sellers')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⏳ {stats?.pendingSellers} seller{stats?.pendingSellers !== 1 ? 's' : ''} awaiting review →
                  </button>
                )}
                {(stats?.pendingProducts ?? 0) > 0 && (
                  <button onClick={() => setSection('products')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🔍 {stats?.pendingProducts} product{stats?.pendingProducts !== 1 ? 's' : ''} awaiting moderation →
                  </button>
                )}
              </div>
            )}

            {/* Stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14 }}>
              {statCards.map(card => (
                <div key={card.label} style={{
                  background: 'var(--orvo-surface)',
                  border: `1px solid ${(card as any).alert ? 'rgba(245,158,11,0.35)' : 'var(--orvo-border)'}`,
                  borderRadius: 14,
                  padding: '20px 22px',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{card.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--orvo-text)', marginTop: 6 }}>{card.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--orvo-text-muted)', marginTop: 2 }}>{card.sub}</div>
                </div>
              ))}
            </div>

            {/* Recent orders mini-table */}
            <div style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--orvo-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>Recent Orders</h3>
                <button onClick={() => setSection('orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--orvo-primary)', fontWeight: 700, fontSize: 13 }}>
                  View all →
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--orvo-border)', background: 'var(--orvo-surface-2)' }}>
                      {['Order ID', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--orvo-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 8).map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--orvo-border)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--orvo-primary)' }}>#{order.id.slice(-8).toUpperCase()}</td>
                        <td style={{ padding: '12px 16px' }}>{(order as any).buyer?.name ?? '—'}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>₹{order.totalAmount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 16px' }}><Badge status={order.status} /></td>
                        <td style={{ padding: '12px 16px', color: 'var(--orvo-text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--orvo-text-muted)', fontStyle: 'italic' }}>No orders yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SELLER APPROVALS ═══ */}
        {section === 'sellers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pendingSellers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--orvo-text-muted)' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 8 }}>All caught up!</h3>
                <p>No seller applications are pending review.</p>
              </div>
            ) : pendingSellers.map(seller => (
              <div key={seller.id} style={{
                background: 'var(--orvo-surface)',
                border: '1px solid var(--orvo-border)',
                borderRadius: 16,
                padding: '22px 26px',
                boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{seller.shopName}</div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--orvo-text-muted)', flexWrap: 'wrap' }}>
                      <span>👤 {seller.user?.name ?? '—'}</span>
                      <span>✉️ {seller.user?.email ?? '—'}</span>
                      <span>📍 {seller.region}</span>
                      <span style={{ fontFamily: 'monospace', background: 'var(--orvo-surface-2)', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>/{seller.shopSlug}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      disabled={actioning === seller.id}
                      onClick={() => approveSeller(seller.id)}
                      style={{
                        padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 13,
                        opacity: actioning === seller.id ? 0.5 : 1,
                      }}
                    >
                      {actioning === seller.id ? '…' : '✓ Approve'}
                    </button>
                    <button
                      disabled={actioning === seller.id}
                      onClick={() => setRejectingId(rejectingId === seller.id ? null : seller.id)}
                      style={{
                        padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 13,
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>

                {/* Dynamic Inline PDF Document Previews */}
                <div style={{ display: 'flex', gap: 20, marginTop: 18, flexWrap: 'wrap' }}>
                  {(seller as any).businessLicenseUrl && (
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orvo-text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        📄 Business License / GST
                      </div>
                      <iframe
                        src={(seller as any).businessLicenseUrl}
                        style={{ width: '100%', height: 320, borderRadius: 12, border: '1px solid var(--orvo-border)', background: '#fff' }}
                        title="Business License"
                      />
                    </div>
                  )}
                  {(seller as any).idProofUrl && (
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orvo-text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        🪪 ID Proof (Aadhaar/Passport)
                      </div>
                      <iframe
                        src={(seller as any).idProofUrl}
                        style={{ width: '100%', height: 320, borderRadius: 12, border: '1px solid var(--orvo-border)', background: '#fff' }}
                        title="ID Proof"
                      />
                    </div>
                  )}
                </div>

                {/* Rejection input */}
                {rejectingId === seller.id && (
                  <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      className="input"
                      placeholder="Reason for rejection (optional)"
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      style={{ flex: 1, minWidth: 200 }}
                    />
                    <button
                      onClick={() => rejectSeller(seller.id)}
                      disabled={actioning === seller.id}
                      style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#b91c1c', color: '#fff', fontWeight: 700, fontSize: 13 }}
                    >
                      {actioning === seller.id ? '…' : 'Confirm Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ PRODUCT MODERATION ═══ */}
        {section === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pendingProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--orvo-text-muted)' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, marginBottom: 8 }}>All products reviewed!</h3>
                <p>No listings are awaiting moderation.</p>
              </div>
            ) : pendingProducts.map(product => {
              const img = product.images?.find(i => i.isPrimary) || product.images?.[0];
              return (
                <div key={product.id} style={{
                  background: 'var(--orvo-surface)',
                  border: '1px solid var(--orvo-border)',
                  borderRadius: 16,
                  padding: '18px 22px',
                  display: 'flex',
                  gap: 18,
                  alignItems: 'flex-start',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  {/* Product image */}
                  <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: 'var(--orvo-surface-2)', flexShrink: 0, border: '1px solid var(--orvo-border)' }}>
                    {img
                      ? <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{product.title}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--orvo-text-muted)', flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--orvo-primary)', fontSize: 15 }}>₹{product.price.toLocaleString('en-IN')}</span>
                      <span>Stock: {product.stock}</span>
                      {product.category && <span>📂 {product.category.name}</span>}
                      {product.seller && <span>🏪 {product.seller.shopName} ({product.seller.region})</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--orvo-text-muted)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {product.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <button
                      disabled={actioning === product.id}
                      onClick={() => approveProduct(product.id)}
                      style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 13, opacity: actioning === product.id ? 0.5 : 1 }}
                    >
                      {actioning === product.id ? '…' : '✓ Approve'}
                    </button>
                    <button
                      disabled={actioning === product.id}
                      onClick={() => rejectProduct(product.id)}
                      style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 13 }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ ALL ORDERS ═══ */}
        {section === 'orders' && (
          <div style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--orvo-border)', background: 'var(--orvo-surface-2)' }}>
                    {['Order ID', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--orvo-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--orvo-text-muted)', fontStyle: 'italic' }}>No orders in the system yet.</td></tr>
                  ) : orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--orvo-border)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--orvo-surface-2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--orvo-primary)', whiteSpace: 'nowrap' }}>
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>{(order as any).buyer?.name ?? '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--orvo-text-muted)' }}>{(order as any).buyer?.email ?? ''}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--orvo-text-muted)' }}>
                        {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge status={order.paymentStatus} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge status={order.status} />
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--orvo-text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
