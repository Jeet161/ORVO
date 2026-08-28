'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { sellersApi, productsApi, ordersApi, SellerAnalytics, Product, Order } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { SellerOverview } from '@/components/seller-dashboard/seller-overview';

type Tab = 'overview' | 'products' | 'orders';

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'SELLER') { router.push('/'); return; }
    Promise.all([
      sellersApi.getAnalytics(),
      productsApi.getSellerProducts(),
      ordersApi.getSellerOrders(),
    ]).then(([a, p, o]) => {
      setAnalytics(a);
      setProducts(p);
      setOrders(o);
    }).finally(() => setLoading(false));
  }, [user, authLoading]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);
    await ordersApi.updateStatus(orderId, status);
    const updated = await ordersApi.getSellerOrders();
    setOrders(updated);
    setUpdatingOrder(null);
  };

  const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

  const statCards = analytics ? [
    { label: 'Total Sales', value: `₹${analytics.totalSales.toLocaleString('en-IN')}`, icon: '💰', color: '#22c55e' },
    { label: 'Total Orders', value: analytics.totalOrders, icon: '📦', color: '#5865f2' },
    { label: 'Products Sold', value: analytics.productsSold, icon: '🛍️', color: '#00d4aa' },
    { label: 'Pending Orders', value: analytics.pendingOrders, icon: '⏳', color: '#f59e0b' },
    { label: 'Avg Order Value', value: `₹${analytics.avgOrderValue.toFixed(0)}`, icon: '📊', color: '#7c3aed' },
    { label: 'My Products', value: analytics.totalProducts, icon: '🗂️', color: '#3b82f6' },
  ] : [];

  const productStatusColors: Record<string, string> = {
    APPROVED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger', OUT_OF_STOCK: 'badge-muted',
  };

  if (loading) return (
    <div className="container" style={{ paddingTop: 48 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
      </div>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700 }}>Seller Dashboard</h1>
          <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14 }}>Welcome back, {user?.name}</p>
        </div>
        <Link href="/seller/products/new" className="btn btn-primary">+ Add Product</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 36 }}>
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--orvo-border)', marginBottom: 24 }}>
        {(['overview', 'products', 'orders'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="btn btn-ghost btn-sm" style={{
            borderRadius: '8px 8px 0 0', textTransform: 'capitalize',
            borderBottom: tab === t ? '2px solid var(--orvo-primary)' : '2px solid transparent',
            color: tab === t ? 'var(--orvo-primary-light)' : 'var(--orvo-text-muted)',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && analytics && (
        <SellerOverview
          shopName={user?.name || 'My Shop'}
          stats={[
            { label: 'Total Sales', value: `₹${analytics.totalSales.toLocaleString('en-IN')}`, code: 'revenue' },
            { label: 'Total Orders', value: String(analytics.totalOrders), code: 'orders' },
            { label: 'Products Sold', value: String(analytics.productsSold), code: 'items' },
            { label: 'Avg Order Value', value: `₹${analytics.avgOrderValue.toFixed(0)}`, code: 'rating' },
          ]}
          recentOrders={orders.slice(0, 5).map((o) => ({
            id: o.id,
            items: `${o.items.length} items`,
            amount: `₹${o.totalAmount.toLocaleString('en-IN')}`,
            status: o.status,
            createdAt: o.createdAt,
          }))}
        />
      )}


      {tab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--orvo-text-muted)', marginBottom: 16 }}>No products yet.</p>
              <Link href="/seller/products/new" className="btn btn-primary">Create First Product</Link>
            </div>
          ) : products.map((p) => {
            const img = p.images?.find((i) => i.isPrimary) || p.images?.[0];
            return (
              <div key={p.id} className="glass" style={{ display: 'flex', gap: 14, padding: '14px 18px', alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: 'var(--orvo-surface-2)', flexShrink: 0 }}>
                  {img ? <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>📦</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)' }}>Stock: {p.stock} · ₹{p.price.toLocaleString('en-IN')}</div>
                </div>
                <span className={`badge ${productStatusColors[p.status] || 'badge-muted'}`}>{p.status}</span>
                <Link href={`/seller/products/${p.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--orvo-text-muted)', textAlign: 'center', padding: '60px 0' }}>No orders yet.</p>
          ) : orders.map((o) => (
            <div key={o.id} className="glass" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>#{o.id.slice(0, 8).toUpperCase()}</span>
                  <span style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginLeft: 10 }}>
                    {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span style={{ fontWeight: 700 }}>₹{o.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              {/* Items */}
              <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)', marginBottom: 12 }}>
                {o.items.map((item) => `${item.product?.title} × ${item.quantity}`).join(', ')}
              </div>
              {/* Status update */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${o.status === 'DELIVERED' ? 'badge-success' : 'badge-warning'}`}>{o.status}</span>
                {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                  <select
                    value={o.status}
                    disabled={updatingOrder === o.id}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    style={{
                      background: 'var(--orvo-surface-2)', border: '1px solid var(--orvo-border)',
                      borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'var(--orvo-text)',
                      cursor: 'pointer',
                    }}
                  >
                    {statusOrder.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
