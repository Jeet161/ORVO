'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ordersApi, paymentsApi, cartApi, usersApi, Cart, Address } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

const emptyForm = {
  name: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false,
};

interface BuyNowItem {
  productId: string;
  productTitle: string;
  productImage: string | null;
  productPrice: number;
  quantity: number;
}

function CheckoutContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get('mode') === 'buynow';

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyForm);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    // For buy-now, read from sessionStorage
    if (isBuyNow) {
      const stored = sessionStorage.getItem('orvo_buynow');
      if (!stored) { router.push('/products'); return; }
      setBuyNowItem(JSON.parse(stored));
    }

    // Always fetch addresses; also fetch cart if not buy-now mode
    const fetches = isBuyNow
      ? [usersApi.getAddresses(), Promise.resolve(null)]
      : [usersApi.getAddresses(), cartApi.get()];

    Promise.all(fetches as [Promise<Address[]>, Promise<Cart | null>])
      .then(([addrs, c]) => {
        setAddresses(addrs);
        if (!isBuyNow) setCart(c);
        const def = addrs.find((a) => a.isDefault);
        if (def) setSelectedAddress(def.id);
        else if (addrs.length > 0) setSelectedAddress(addrs[0].id);
        if (addrs.length === 0) setShowAddressForm(true);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  // Compute subtotal
  const subtotal = isBuyNow
    ? (buyNowItem ? buyNowItem.productPrice * buyNowItem.quantity : 0)
    : (cart?.items.reduce((s, i) => s + i.product.price * i.quantity, 0) ?? 0);

  const totalItems = isBuyNow
    ? (buyNowItem?.quantity ?? 0)
    : (cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');
    if (!addressForm.name || !addressForm.phone || !addressForm.street || !addressForm.city || !addressForm.state || !addressForm.postalCode) {
      setAddressError('Please fill all required fields.');
      return;
    }
    setSavingAddress(true);
    try {
      const newAddr = await usersApi.addAddress(addressForm);
      const updated = [...addresses, newAddr];
      setAddresses(updated);
      setSelectedAddress(newAddr.id);
      setShowAddressForm(false);
      setAddressForm(emptyForm);
    } catch (err: any) {
      setAddressError(err.message || 'Failed to save address.');
    }
    setSavingAddress(false);
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await usersApi.deleteAddress(id);
      const updated = addresses.filter((a) => a.id !== id);
      setAddresses(updated);
      if (selectedAddress === id) setSelectedAddress(updated[0]?.id ?? '');
    } catch (err: any) {
      setError(err.message || 'Failed to delete address.');
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) { setError('Please select or add a delivery address.'); return; }
    setPlacing(true);
    setError('');
    try {
      const idempotencyKey = `${user!.id}-${Date.now()}`;

      let order: any;

      if (isBuyNow && buyNowItem) {
        // ── Buy Now: direct order, no cart involved ──
        order = await ordersApi.buyNow({
          productId: buyNowItem.productId,
          quantity: buyNowItem.quantity,
          addressId: selectedAddress,
          paymentMethod,
          idempotencyKey,
        });
        sessionStorage.removeItem('orvo_buynow'); // clear after order
      } else {
        // ── Cart Checkout ──
        if (!cart || cart.items.length === 0) { setError('Your cart is empty.'); setPlacing(false); return; }
        order = await ordersApi.checkout({ addressId: selectedAddress, paymentMethod, idempotencyKey });
      }

      if (paymentMethod === 'ONLINE') {
        await paymentsApi.process(order.id);
      }

      router.push(`/orders/${order.id}?success=1`);
    } catch (err: any) {
      setError(err.message || 'Failed to place order.');
      setPlacing(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="skeleton" style={{ height: 180, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 16 }} />
        </div>
        <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
      </div>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 8 }}>
          <Link href={isBuyNow ? '/products' : '/cart'} style={{ color: 'var(--orvo-text-muted)', fontSize: 13, textDecoration: 'none' }}>
            ← {isBuyNow ? 'Back to Products' : 'Back to Cart'}
          </Link>
        </div>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>
          {isBuyNow ? '⚡ Quick Buy' : 'Checkout'}
        </h1>
        <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14, marginTop: 4 }}>
          {isBuyNow ? 'Buying directly — your cart is not affected' : `${totalItems} item${totalItems !== 1 ? 's' : ''} · Free delivery`}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 28, alignItems: 'start' }}>

        {/* ── Left Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Step 1: Delivery Address ── */}
          <div className="glass" style={{ padding: 28, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--orvo-primary), var(--orvo-accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 14, fontWeight: 800, flexShrink: 0,
                }}>1</div>
                <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>Delivery Address</h2>
              </div>
              {addresses.length > 0 && (
                <button
                  onClick={() => { setShowAddressForm(!showAddressForm); setAddressError(''); setAddressForm(emptyForm); }}
                  style={{
                    background: showAddressForm ? 'rgba(239,68,68,0.08)' : 'rgba(88,101,242,0.08)',
                    border: `1px solid ${showAddressForm ? 'rgba(239,68,68,0.25)' : 'var(--orvo-primary)'}`,
                    color: showAddressForm ? 'var(--orvo-danger)' : 'var(--orvo-primary)',
                    borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {showAddressForm ? '✕ Cancel' : '+ Add New Address'}
                </button>
              )}
            </div>

            {/* Saved addresses */}
            {addresses.length > 0 && !showAddressForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {addresses.map((addr) => (
                  <label key={addr.id} style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
                    border: `2px solid ${selectedAddress === addr.id ? 'var(--orvo-primary)' : 'var(--orvo-border)'}`,
                    background: selectedAddress === addr.id ? 'rgba(49,105,78,0.06)' : 'var(--orvo-surface-2)',
                    transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="address" value={addr.id}
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      style={{ marginTop: 4, accentColor: 'var(--orvo-primary)', width: 16, height: 16 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{addr.name}</span>
                        {addr.isDefault && (
                          <span style={{ background: 'rgba(49,105,78,0.12)', color: 'var(--orvo-primary)', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>Default</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)', lineHeight: 1.6 }}>
                        {addr.street}, {addr.city}, {addr.state} – {addr.postalCode}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)', marginTop: 2 }}>📞 {addr.phone}</div>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); handleDeleteAddress(addr.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--orvo-text-faint)', fontSize: 16, padding: '2px 6px', borderRadius: 6, transition: 'color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orvo-danger)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--orvo-text-faint)'}>🗑</button>
                  </label>
                ))}
              </div>
            )}

            {/* Empty state */}
            {addresses.length === 0 && !showAddressForm && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--orvo-text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
                <p style={{ fontSize: 14, margin: '0 0 16px' }}>No saved addresses yet.</p>
                <button onClick={() => setShowAddressForm(true)} className="btn btn-primary" style={{ fontSize: 14 }}>
                  Add Delivery Address
                </button>
              </div>
            )}

            {/* Inline Address Form */}
            {showAddressForm && (
              <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {addresses.length > 0 && <div style={{ height: 1, background: 'var(--orvo-border)', margin: '4px 0 12px' }} />}
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--orvo-text-muted)', margin: '0 0 4px' }}>📍 New Delivery Address</p>

                {addressError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--orvo-danger)' }}>
                    {addressError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--orvo-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name *</label>
                    <input className="input" placeholder="Recipient name" value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--orvo-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone *</label>
                    <input className="input" placeholder="10-digit number" value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--orvo-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Street Address *</label>
                  <input className="input" placeholder="House no., Building, Street, Area" value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--orvo-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>City *</label>
                    <input className="input" placeholder="City" value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--orvo-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>State *</label>
                    <select className="input" value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required style={{ cursor: 'pointer' }}>
                      <option value="">Select state</option>
                      {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--orvo-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>PIN Code *</label>
                    <input className="input" placeholder="6-digit PIN" value={addressForm.postalCode} maxLength={6}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value.replace(/\D/g, '') })} required />
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    style={{ accentColor: 'var(--orvo-primary)', width: 16, height: 16 }} />
                  <span style={{ color: 'var(--orvo-text-muted)', fontWeight: 500 }}>Set as default address</span>
                </label>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="submit" disabled={savingAddress} className="btn btn-primary" style={{ flex: 1 }}>
                    {savingAddress ? 'Saving...' : '✓ Save & Use This Address'}
                  </button>
                  {addresses.length > 0 && (
                    <button type="button" onClick={() => { setShowAddressForm(false); setAddressError(''); }}
                      className="btn" style={{ padding: '0 20px', color: 'var(--orvo-text-muted)' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* ── Step 2: Payment Method ── */}
          <div className="glass" style={{ padding: 28, borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--orvo-primary), var(--orvo-accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 14, fontWeight: 800, flexShrink: 0,
              }}>2</div>
              <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>Payment Method</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {([
                { value: 'COD', label: 'Cash on Delivery', desc: 'Pay with cash when your order arrives', icon: '💵', badge: 'Most Popular' },
                { value: 'ONLINE', label: 'Online Payment', desc: 'Pay now for instant order confirmation', icon: '💳', badge: null },
              ] as const).map(({ value, label, desc, icon, badge }) => (
                <label key={value} style={{
                  display: 'flex', gap: 14, alignItems: 'center',
                  padding: '18px 20px', borderRadius: 14, cursor: 'pointer',
                  border: `2px solid ${paymentMethod === value ? 'var(--orvo-primary)' : 'var(--orvo-border)'}`,
                  background: paymentMethod === value ? 'rgba(49,105,78,0.06)' : 'var(--orvo-surface-2)',
                  transition: 'all 0.2s',
                }}>
                  <input type="radio" name="payment" value={value}
                    checked={paymentMethod === value} onChange={() => setPaymentMethod(value)}
                    style={{ accentColor: 'var(--orvo-primary)', width: 16, height: 16 }} />
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{label}</span>
                      {badge && <span style={{ background: 'rgba(49,105,78,0.12)', color: 'var(--orvo-primary)', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>{badge}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)', marginTop: 2 }}>{desc}</div>
                  </div>
                  {paymentMethod === value && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--orvo-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>✓</div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* ── Step 3: Review Item(s) ── */}
          <div className="glass" style={{ padding: 28, borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--orvo-primary), var(--orvo-accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 14, fontWeight: 800, flexShrink: 0,
              }}>3</div>
              <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>Review Items</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isBuyNow && buyNowItem ? (
                /* Buy Now — single product */
                <div style={{
                  display: 'flex', gap: 14, alignItems: 'center',
                  padding: '14px 16px', borderRadius: 14,
                  background: 'var(--orvo-surface-2)', border: '1px solid var(--orvo-border)',
                }}>
                  <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', background: 'var(--orvo-surface)', flexShrink: 0, border: '1px solid var(--orvo-border)' }}>
                    {buyNowItem.productImage
                      ? <img src={buyNowItem.productImage} alt={buyNowItem.productTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{buyNowItem.productTitle}</div>
                    <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)' }}>Qty: {buyNowItem.quantity}</div>
                    <div style={{ fontSize: 11, color: 'var(--orvo-primary)', fontWeight: 700, marginTop: 3 }}>⚡ Direct Purchase</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--orvo-primary)' }}>
                    ₹{(buyNowItem.productPrice * buyNowItem.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ) : (
                /* Cart items */
                cart?.items.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex', gap: 14, alignItems: 'center',
                    padding: '14px 16px', borderRadius: 14,
                    background: 'var(--orvo-surface-2)', border: '1px solid var(--orvo-border)',
                  }}>
                    <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', background: 'var(--orvo-surface)', flexShrink: 0, border: '1px solid var(--orvo-border)' }}>
                      {item.product.images?.[0]?.url
                        ? <img src={item.product.images[0].url} alt={item.product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{item.product.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--orvo-primary)' }}>
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, fontSize: 14, color: 'var(--orvo-danger)', fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* ── Right Column: Order Summary ── */}
        <div style={{ position: 'sticky', top: 84 }}>
          <div className="glass" style={{ padding: 28, borderRadius: 20 }}>
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Order Summary</h2>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {isBuyNow && buyNowItem ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: 'var(--orvo-text-muted)', fontSize: 13, flex: 1 }}>
                    {buyNowItem.productTitle} <span style={{ opacity: 0.7 }}>× {buyNowItem.quantity}</span>
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                    ₹{(buyNowItem.productPrice * buyNowItem.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                cart?.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ color: 'var(--orvo-text-muted)', fontSize: 13, flex: 1 }}>
                      {item.product.title} <span style={{ opacity: 0.7 }}>× {item.quantity}</span>
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div style={{ height: 1, background: 'var(--orvo-border)', margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--orvo-text-muted)' }}>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
              <span style={{ fontWeight: 700 }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13 }}>
              <span style={{ color: 'var(--orvo-text-muted)' }}>Delivery</span>
              <span style={{ color: 'var(--orvo-primary)', fontWeight: 700 }}>FREE</span>
            </div>
            <div style={{ height: 1, background: 'var(--orvo-border)', margin: '0 0 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontWeight: 800, fontSize: 17 }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--orvo-primary)' }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {/* Selected address preview */}
            {selectedAddress && (() => {
              const addr = addresses.find((a) => a.id === selectedAddress);
              return addr ? (
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(49,105,78,0.06)', border: '1px solid rgba(49,105,78,0.2)', marginBottom: 16, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 3, color: 'var(--orvo-primary)' }}>📍 Delivering to</div>
                  <div style={{ color: 'var(--orvo-text-muted)', lineHeight: 1.5 }}>
                    {addr.name} · {addr.phone}<br />{addr.street}, {addr.city} – {addr.postalCode}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Payment badge */}
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--orvo-surface-2)', border: '1px solid var(--orvo-border)', marginBottom: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{paymentMethod === 'COD' ? '💵' : '💳'}</span>
              <span style={{ fontWeight: 600 }}>{paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</span>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing || showAddressForm || !selectedAddress}
              className="btn btn-primary"
              style={{ width: '100%', height: 52, fontSize: 16, fontWeight: 800, borderRadius: 14 }}
            >
              {placing ? '⏳ Placing Order...' : paymentMethod === 'COD'
                ? `✓ ${isBuyNow ? 'Buy Now (COD)' : 'Place Order (COD)'}`
                : `💳 Pay ₹${subtotal.toLocaleString('en-IN')} & Order`}
            </button>

            <p style={{ fontSize: 11, color: 'var(--orvo-text-faint)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              🔒 Secure checkout · By placing your order you agree to ORVO's terms.
            </p>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            {[
              { icon: '🚚', text: 'Free Delivery' },
              { icon: '🔒', text: 'Secure Payment' },
              { icon: '↩️', text: 'Easy Returns' },
              { icon: '✓', text: 'Verified Sellers' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)' }}>
                <span style={{ fontSize: 16 }}>{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingTop: 60 }}>
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
