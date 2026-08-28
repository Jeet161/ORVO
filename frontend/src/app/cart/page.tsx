'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cartApi, Cart } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export default function CartPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = () => cartApi.get().then(setCart).finally(() => setLoading(false));

  useEffect(() => { if (user) fetchCart(); else setLoading(false); }, [user]);

  const updateQty = async (productId: string, qty: number) => {
    setUpdating(productId);
    await cartApi.updateItem(productId, qty);
    await fetchCart();
    setUpdating(null);
  };

  const removeItem = async (productId: string) => {
    setUpdating(productId);
    await cartApi.removeItem(productId);
    await fetchCart();
    setUpdating(null);
  };

  const subtotal = cart?.items.reduce((s, i) => s + i.product.price * i.quantity, 0) ?? 0;

  if (!user) return (
    <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
      <p style={{ color: 'var(--orvo-text-muted)', marginBottom: 16 }}>Please login to view your cart.</p>
      <Link href="/auth/login" className="btn btn-primary">Login</Link>
    </div>
  );

  if (loading) return (
    <div className="container" style={{ paddingTop: 48 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 12 }} />)}
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Your Cart</h1>

      {!cart || cart.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <p style={{ color: 'var(--orvo-text-muted)', marginBottom: 20 }}>Your cart is empty.</p>
          <Link href="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28 }}>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cart.items.map((item) => {
              const img = item.product.images?.find((i) => i.isPrimary) || item.product.images?.[0];
              return (
                <div key={item.id} className="glass" style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'center', opacity: updating === item.product.id ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--orvo-surface-2)' }}>
                    {img ? <img src={img.url} alt={item.product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link href={`/products/${item.product.slug}`} style={{ textDecoration: 'none', fontWeight: 600, color: 'var(--orvo-text)', fontSize: 15 }}>{item.product.title}</Link>
                    <div style={{ color: 'var(--orvo-text-muted)', fontSize: 13, marginTop: 2 }}>₹{item.product.price.toLocaleString('en-IN')} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--orvo-border)', borderRadius: 8, overflow: 'hidden' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => updateQty(item.product.id, item.quantity - 1)}>−</button>
                    <span style={{ padding: '0 14px', fontWeight: 600, color: 'var(--orvo-text)', minWidth: 40, textAlign: 'center' }}>{item.quantity}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => updateQty(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--orvo-text)', minWidth: 80, textAlign: 'right' }}>
                    ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeItem(item.product.id)} style={{ color: 'var(--orvo-danger)' }}>✕</button>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div>
            <div className="glass" style={{ padding: 24, position: 'sticky', top: 84 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Order Summary</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--orvo-text-muted)' }}>
                <span>Subtotal ({cart.items.length} items)</span>
                <span style={{ color: 'var(--orvo-text)', fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--orvo-text-muted)' }}>
                <span>Delivery</span>
                <span style={{ color: 'var(--orvo-success)', fontWeight: 600 }}>FREE</span>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 20 }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                Proceed to Checkout →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
