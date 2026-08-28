'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ordersApi, Order } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

const statusColors: Record<string, string> = {
  PENDING: 'badge-warning', CONFIRMED: 'badge-primary', PROCESSING: 'badge-primary',
  SHIPPED: 'badge-info', DELIVERED: 'badge-success', CANCELLED: 'badge-danger',
};
const paymentColors: Record<string, string> = {
  PENDING: 'badge-warning', PAID: 'badge-success', FAILED: 'badge-danger',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) ordersApi.getMyOrders().then(setOrders).finally(() => setLoading(false));
    else setLoading(false);
  }, [user]);

  if (!user) return (
    <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
      <Link href="/auth/login" className="btn btn-primary">Login to view orders</Link>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 860 }}>
      <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>My Orders</h1>

      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14, marginBottom: 14 }} />)
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
          <p style={{ color: 'var(--orvo-text-muted)', marginBottom: 20 }}>You haven't placed any orders yet.</p>
          <Link href="/products" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
              <div className="glass" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {/* Thumbnail */}
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--orvo-surface-2)' }}>
                    {order.items[0]?.product?.images?.[0] ? (
                      <img src={order.items[0].product.images.find(i => i.isPrimary)?.url || order.items[0].product.images[0].url}
                        alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <span style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)' }}>
                      {order.items.length} item(s) · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`badge ${statusColors[order.status] || 'badge-muted'}`}>{order.status}</span>
                    <span className={`badge ${paymentColors[order.paymentStatus] || 'badge-muted'}`}>{order.paymentStatus}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
