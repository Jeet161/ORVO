'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { cartApi, notificationsApi } from '@/lib/api';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      cartApi.get().then((cart) => {
        const count = cart.items.reduce((s, i) => s + i.quantity, 0);
        setCartCount(count);
      }).catch(() => {});

      notificationsApi.getUnreadCount().then((res) => {
        setNotifCount(res.count);
      }).catch(() => {});
    }
  }, [user]);

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(244, 250, 210, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--orvo-border)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 16 }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, var(--orvo-primary), var(--orvo-accent))',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 14,
            color: '#fff',
          }}>O</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--orvo-text)', letterSpacing: '-0.5px' }}>
            ORVO
          </span>
        </Link>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 400 }}>
          <form action="/products" method="get">
            <input
              name="search"
              placeholder="Search products..."
              className="input"
              style={{ paddingLeft: 14, fontSize: 13 }}
            />
          </form>
        </div>

        {/* Nav links - desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/products" className="btn btn-ghost btn-sm">Products</Link>

          {user && (
            <>
              <Link href="/wishlist" className="btn btn-ghost btn-sm">Wishlist</Link>
              <Link href="/cart" className="btn btn-ghost btn-sm" style={{ position: 'relative' }}>
                Cart
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -4, right: -4,
                    background: 'var(--orvo-primary)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 18, height: 18,
                    fontSize: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700,
                  }}>{cartCount}</span>
                )}
              </Link>
              <Link href="/notifications" className="btn btn-ghost btn-sm" style={{ position: 'relative' }}>
                🔔
                {notifCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -4, right: -4,
                    background: 'var(--orvo-accent-2)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 18, height: 18,
                    fontSize: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700,
                  }}>{notifCount}</span>
                )}
              </Link>
            </>
          )}

          {user?.role === 'SELLER' && (
            <Link href="/seller/dashboard" className="btn btn-secondary btn-sm">Seller HQ</Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/dashboard" className="btn btn-secondary btn-sm">Admin</Link>
          )}
        </div>

        {/* Auth buttons */}
        {loading ? (
          <div className="skeleton" style={{ width: 80, height: 36, borderRadius: 8 }} />
        ) : user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/orders" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--orvo-surface-2)',
              border: '1px solid var(--orvo-border)',
            }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--orvo-primary), var(--orvo-accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, color: 'var(--orvo-text)', fontWeight: 500 }}>{user.name?.split(' ')[0]}</span>
            </Link>
            <button onClick={logout} className="btn btn-ghost btn-sm">
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/auth/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm">Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
