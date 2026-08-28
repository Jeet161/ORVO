'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ordersApi, Order } from '@/lib/api';

const statusColors: Record<string, string> = {
  PENDING: 'badge-warning', CONFIRMED: 'badge-primary', PROCESSING: 'badge-primary',
  SHIPPED: 'badge-info', DELIVERED: 'badge-success', CANCELLED: 'badge-danger',
};

function OrderDetailContent() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === '1';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getById(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="container" style={{ paddingTop: 48 }}>
      <div className="skeleton" style={{ height: 500, borderRadius: 16 }} />
    </div>
  );

  if (!order) return (
    <div className="container" style={{ paddingTop: 80, textAlign: 'center', color: 'var(--orvo-text-muted)' }}>Order not found.</div>
  );

  const addr = order.shippingAddress as any;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      {isSuccess && (
        <div style={{ padding: '16px 20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--orvo-success)' }}>Order placed successfully!</div>
            <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)' }}>Thank you for shopping with ORVO.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700 }}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)', marginTop: 4 }}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className={`badge ${statusColors[order.status] || 'badge-muted'}`}>{order.status}</span>
          <span className={`badge ${order.paymentStatus === 'PAID' ? 'badge-success' : order.paymentStatus === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>
            Payment: {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Items Ordered</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {order.items.map((item) => {
            const img = item.product?.images?.find((i) => i.isPrimary) || item.product?.images?.[0];
            return (
              <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: 'var(--orvo-surface-2)', flexShrink: 0 }}>
                  {img ? <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>📦</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.product?.title || 'Product'}</div>
                  {(item as any).seller && <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)' }}>by {(item as any).seller.shopName}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>₹{item.subtotal.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)' }}>₹{item.price} × {item.quantity}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 800, fontSize: 18 }}>
          Total: ₹{order.totalAmount.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Shipping */}
      <div className="glass" style={{ padding: 24 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 14 }}>📍 Shipping Address</h2>
        <div style={{ fontSize: 14, color: 'var(--orvo-text-muted)', lineHeight: 1.8 }}>
          <div style={{ fontWeight: 600, color: 'var(--orvo-text)' }}>{addr.name}</div>
          <div>{addr.street}</div>
          <div>{addr.city}, {addr.state} – {addr.postalCode}</div>
          <div>📞 {addr.phone}</div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        <Link href="/orders" className="btn btn-secondary btn-sm">← All Orders</Link>
        <Link href="/products" className="btn btn-ghost btn-sm">Continue Shopping</Link>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingTop: 48 }}>
        <div className="skeleton" style={{ height: 500, borderRadius: 16 }} />
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}
