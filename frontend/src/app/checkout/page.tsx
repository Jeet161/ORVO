'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi, paymentsApi, cartApi, Cart } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

// Small inline helper since usersApi lives in api.ts
async function getAddresses() {
  const token = localStorage.getItem('orvo_token');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    Promise.all([getAddresses(), cartApi.get()]).then(([addrs, c]) => {
      setAddresses(addrs);
      setCart(c);
      const def = addrs.find((a: any) => a.isDefault);
      if (def) setSelectedAddress(def.id);
    }).finally(() => setLoading(false));
  }, [user]);

  const subtotal = cart?.items.reduce((s, i) => s + i.product.price * i.quantity, 0) ?? 0;

  const placeOrder = async () => {
    if (!selectedAddress) { setError('Please select a delivery address.'); return; }
    if (!cart || cart.items.length === 0) { setError('Your cart is empty.'); return; }
    setPlacing(true);
    setError('');
    try {
      const idempotencyKey = `${user!.id}-${Date.now()}`;
      const order = await ordersApi.checkout({ addressId: selectedAddress, paymentMethod, idempotencyKey }) as any;

      // If online payment, process it immediately
      if (paymentMethod === 'ONLINE') {
        await paymentsApi.process(order.id);
      }

      router.push(`/orders/${order.id}?success=1`);
    } catch (err: any) {
      setError(err.message || 'Failed to place order.');
    }
    setPlacing(false);
  };

  if (loading) return (
    <div className="container" style={{ paddingTop: 48 }}>
      <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Delivery Address */}
          <div className="glass" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>📍 Delivery Address</h2>
            {addresses.length === 0 ? (
              <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14 }}>No addresses saved. Please add one in your profile.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {addresses.map((addr) => (
                  <label key={addr.id} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    border: `1px solid ${selectedAddress === addr.id ? 'var(--orvo-primary)' : 'var(--orvo-border)'}`,
                    background: selectedAddress === addr.id ? 'rgba(88,101,242,0.08)' : 'var(--orvo-surface-2)',
                    transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="address" value={addr.id}
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      style={{ marginTop: 3, accentColor: 'var(--orvo-primary)' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{addr.name} {addr.isDefault && <span className="badge badge-primary" style={{ marginLeft: 6 }}>Default</span>}</div>
                      <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)', marginTop: 2 }}>
                        {addr.street}, {addr.city}, {addr.state} – {addr.postalCode}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)' }}>📞 {addr.phone}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="glass" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>💳 Payment Method</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { value: 'COD', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: '💵' },
                { value: 'ONLINE', label: 'Online Payment', desc: 'Pay now (instant confirmation)', icon: '💳' },
              ] as const).map(({ value, label, desc, icon }) => (
                <label key={value} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${paymentMethod === value ? 'var(--orvo-primary)' : 'var(--orvo-border)'}`,
                  background: paymentMethod === value ? 'rgba(88,101,242,0.08)' : 'var(--orvo-surface-2)',
                  transition: 'all 0.2s',
                }}>
                  <input type="radio" name="payment" value={value}
                    checked={paymentMethod === value} onChange={() => setPaymentMethod(value)}
                    style={{ accentColor: 'var(--orvo-primary)' }} />
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)' }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: 'var(--orvo-danger)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <div className="glass" style={{ padding: 24, position: 'sticky', top: 84 }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Order Summary</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {cart?.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--orvo-text-muted)' }}>{item.product.title} × {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--orvo-text-muted)' }}>
              <span>Delivery</span><span style={{ color: 'var(--orvo-success)' }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
              <span>Total</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <button onClick={placeOrder} disabled={placing} className="btn btn-primary" style={{ width: '100%' }}>
              {placing ? 'Placing Order...' : paymentMethod === 'COD' ? '✓ Place Order (COD)' : '💳 Pay & Place Order'}
            </button>

            <p style={{ fontSize: 11, color: 'var(--orvo-text-faint)', textAlign: 'center', marginTop: 12 }}>
              By placing your order, you agree to ORVO's terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
