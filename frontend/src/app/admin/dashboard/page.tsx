'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, sellersApi, productsApi, AdminDashboard, SellerProfile, Product } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { AdminOverview } from '@/components/admin-dashboard/admin-overview';

type Tab = 'overview' | 'sellers' | 'products' | 'orders';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [pendingSellers, setPendingSellers] = useState<SellerProfile[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') { router.push('/'); return; }
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getPendingSellers(),
      adminApi.getPendingProducts(),
    ]).then(([s, ps, pp]) => {
      setStats(s);
      setPendingSellers(ps);
      setPendingProducts(pp);
    }).finally(() => setLoading(false));
  }, [user, authLoading]);

  const approveSeller = async (id: string) => {
    setActioning(id);
    await sellersApi.reviewApplication(id, 'APPROVED');
    setPendingSellers((s) => s.filter((p) => p.id !== id));
    setStats((s) => s ? { ...s, pendingSellers: s.pendingSellers - 1, totalSellers: s.totalSellers + 1 } : s);
    setActioning(null);
  };

  const rejectSeller = async (id: string) => {
    setActioning(id);
    await sellersApi.reviewApplication(id, 'REJECTED', rejectionReason || 'Application does not meet requirements.');
    setPendingSellers((s) => s.filter((p) => p.id !== id));
    setStats((s) => s ? { ...s, pendingSellers: s.pendingSellers - 1 } : s);
    setActioning(null);
    setRejectingId(null);
  };

  const approveProduct = async (id: string) => {
    setActioning(id);
    await productsApi.review(id, 'APPROVED');
    setPendingProducts((s) => s.filter((p) => p.id !== id));
    setStats((s) => s ? { ...s, pendingProducts: s.pendingProducts - 1, totalProducts: s.totalProducts + 1 } : s);
    setActioning(null);
  };

  const rejectProduct = async (id: string) => {
    setActioning(id);
    await productsApi.review(id, 'REJECTED');
    setPendingProducts((s) => s.filter((p) => p.id !== id));
    setStats((s) => s ? { ...s, pendingProducts: s.pendingProducts - 1 } : s);
    setActioning(null);
  };

  if (loading) return (
    <div className="container" style={{ paddingTop: 48 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
      </div>
    </div>
  );

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: '👤', color: '#5865f2' },
    { label: 'Active Sellers', value: stats.totalSellers, icon: '🏪', color: '#00d4aa' },
    { label: 'Live Products', value: stats.totalProducts, icon: '📦', color: '#22c55e' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '🛒', color: '#3b82f6' },
    { label: 'Pending Sellers', value: stats.pendingSellers, icon: '⏳', color: '#f59e0b', alert: stats.pendingSellers > 0 },
    { label: 'Pending Products', value: stats.pendingProducts, icon: '🔍', color: '#f59e0b', alert: stats.pendingProducts > 0 },
    { label: 'Platform Revenue', value: `₹${(stats.totalRevenue).toLocaleString('en-IN')}`, icon: '💰', color: '#22c55e' },
  ] : [];

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14 }}>Platform governance & moderation</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 36 }}>
        {statCards.map(({ label, value, icon, color, alert }) => (
          <div key={label} className="stat-card" style={{ borderColor: (alert as boolean) ? 'rgba(245,158,11,0.4)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              {(alert as boolean) && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--orvo-border)', marginBottom: 24 }}>
        {(['overview', 'sellers', 'products'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="btn btn-ghost btn-sm" style={{
            borderRadius: '8px 8px 0 0', textTransform: 'capitalize',
            borderBottom: tab === t ? '2px solid var(--orvo-primary)' : '2px solid transparent',
            color: tab === t ? 'var(--orvo-primary-light)' : 'var(--orvo-text-muted)',
          }}>
            {t}
            {t === 'sellers' && stats?.pendingSellers ? <span className="badge badge-warning" style={{ marginLeft: 6, padding: '2px 7px' }}>{stats.pendingSellers}</span> : null}
            {t === 'products' && stats?.pendingProducts ? <span className="badge badge-warning" style={{ marginLeft: 6, padding: '2px 7px' }}>{stats.pendingProducts}</span> : null}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && stats && (
        <AdminOverview
          stats={{
            totalUsers: stats.totalUsers,
            totalSellers: stats.totalSellers,
            totalProducts: stats.totalProducts,
            totalOrders: stats.totalOrders,
            totalRevenue: stats.totalRevenue,
          }}
          recentOrders={[]}
          pendingProducts={pendingProducts.length}
          pendingSellers={pendingSellers.length}
        />
      )}


      {/* Seller Verification Queue */}
      {tab === 'sellers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pendingSellers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--orvo-text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
              <p>All seller applications have been reviewed.</p>
            </div>
          ) : pendingSellers.map((seller) => (
            <div key={seller.id} className="glass" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{seller.shopName}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--orvo-text-muted)', flexWrap: 'wrap' }}>
                    <span>👤 {seller.user?.name}</span>
                    <span>✉️ {seller.user?.email}</span>
                    <span>📍 {seller.region}</span>
                    <span>🔗 slug: {seller.shopSlug}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={actioning === seller.id}
                    onClick={() => approveSeller(seller.id)}
                    className="btn btn-success btn-sm"
                  >
                    {actioning === seller.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    disabled={actioning === seller.id}
                    onClick={() => setRejectingId(rejectingId === seller.id ? null : seller.id)}
                    className="btn btn-danger btn-sm"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>

              {/* Document links */}
              <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                {(seller as any).businessLicenseUrl && (
                  <a href={(seller as any).businessLicenseUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    📄 Business License
                  </a>
                )}
                {(seller as any).idProofUrl && (
                  <a href={(seller as any).idProofUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    🪪 ID Proof
                  </a>
                )}
              </div>

              {/* Rejection reason input */}
              {rejectingId === seller.id && (
                <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                  <input className="input" placeholder="Rejection reason (optional)"
                    value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ flex: 1 }} />
                  <button onClick={() => rejectSeller(seller.id)} disabled={actioning === seller.id} className="btn btn-danger btn-sm">
                    Confirm Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Product Moderation Queue */}
      {tab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pendingProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--orvo-text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
              <p>All products have been reviewed.</p>
            </div>
          ) : pendingProducts.map((product) => {
            const img = product.images?.find((i) => i.isPrimary) || product.images?.[0];
            return (
              <div key={product.id} className="glass" style={{ padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', background: 'var(--orvo-surface-2)', flexShrink: 0 }}>
                  {img ? <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{product.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)', marginBottom: 6 }}>
                    ₹{product.price.toLocaleString('en-IN')} · Stock: {product.stock}
                    {product.category && ` · ${product.category.name}`}
                    {product.seller && ` · by ${product.seller.shopName} (${product.seller.region})`}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--orvo-text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {product.description}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button disabled={actioning === product.id} onClick={() => approveProduct(product.id)} className="btn btn-success btn-sm">
                    {actioning === product.id ? '...' : '✓ Approve'}
                  </button>
                  <button disabled={actioning === product.id} onClick={() => rejectProduct(product.id)} className="btn btn-danger btn-sm">
                    ✕ Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
