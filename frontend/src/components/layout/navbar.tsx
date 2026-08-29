'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect, useRef } from 'react';
import { cartApi, notificationsApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Detect scroll for shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load cart + notif counts
  useEffect(() => {
    if (!user) return;
    cartApi.get().then(c => setCartCount(c.items.reduce((s, i) => s + i.quantity, 0))).catch(() => {});
    notificationsApi.getUnreadCount().then(r => setNotifCount(r.count)).catch(() => {});
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'ADMIN') return { href: '/admin/dashboard', label: 'Admin Panel' };
    if (user.role === 'SELLER') return { href: '/seller/dashboard', label: 'Seller HQ' };
    return { href: '/buyer/dashboard', label: 'My Dashboard' };
  };

  const dashLink = getDashboardLink();

  if (pathname === '/seller/apply' || pathname.startsWith('/seller/dashboard') || pathname.startsWith('/seller/products')) {
    return null;
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: '#0A1A0F',
      borderBottom: scrolled ? '1px solid rgba(187,200,99,0.15)' : '1px solid rgba(255,255,255,0.06)',
      boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 76, gap: 24 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ color: '#BBC863', fontSize: 18, fontWeight: 900 }}>✦</span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: '-0.5px' }}>
            ORVO
          </span>
        </Link>

        {/* Search bar (centered, Enajori style) */}
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 640 }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for Products, Brands and More"
              style={{
                width: '100%', padding: '11px 18px 11px 44px',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 99, color: '#fff', fontSize: 14, outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(187,200,99,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
            />
          </div>
        </form>

        {/* Right side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* More dropdown */}
          <div ref={moreRef} style={{ position: 'relative' }}>
            <button onClick={() => setMoreOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 600, padding: '8px 12px', borderRadius: 8,
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'}
            >
              More
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transition: 'transform 0.2s', transform: moreOpen ? 'rotate(180deg)' : 'none' }}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {moreOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 180,
                background: '#132a1b', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                padding: '8px', zIndex: 100,
              }}>
                {[
                  { href: '/', label: 'Home', desc: 'Back to homepage' },
                  { href: '/products', label: 'The Marketplace', desc: 'Browse all products' },
                  { href: '/seller/apply', label: 'Become a Seller', desc: 'Start selling on ORVO' },
                  { href: '#', label: 'Contact', desc: 'Get in touch' },
                  { href: '#', label: 'About Us', desc: 'Our story & mission' },
                ].map(item => (
                  <Link key={item.label} href={item.href} onClick={() => setMoreOpen(false)} style={{
                    display: 'block', padding: '10px 14px', borderRadius: 8,
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(187,200,99,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{item.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{item.desc}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Auth / Profile */}
          {loading ? (
            <div style={{ width: 80, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />
          ) : user ? (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button onClick={() => setProfileOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 99, padding: '6px 14px 6px 6px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(187,200,99,0.4)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #BBC863, #658C58)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 12, color: '#1E4632',
                }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{user.name?.split(' ')[0]}</span>
                <svg width="11" height="11" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 200,
                  background: '#132a1b', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                  padding: '8px', zIndex: 100,
                }}>
                  {/* Role badge */}
                  <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: '#BBC863', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{user.role}</div>
                  </div>

                   {/* Profile Menu Items (Enajori style) */}
                   {[
                     { href: '/orders', label: 'My Orders', icon: '📦' },
                     { href: '/wishlist', label: 'Wishlist', icon: '♡' },
                     { href: '/cart', label: 'Cart', icon: '🛒' },
                   ].map(item => (
                     <Link key={item.label} href={item.href} onClick={() => setProfileOpen(false)} style={{
                       display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8,
                       textDecoration: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500,
                       transition: 'all 0.15s',
                     }}
                       onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(187,200,99,0.1)'; (e.currentTarget as HTMLElement).style.color = '#BBC863'; }}
                       onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
                     >
                       <span style={{ fontSize: 14 }}>{item.icon}</span>
                       <span>{item.label}</span>
                     </Link>
                   ))}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4, paddingTop: 4 }}>
                    <button onClick={() => { setProfileOpen(false); logout(); }} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#ef4444', fontSize: 13, fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 14 }}>↳</span>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/auth/login" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
                color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.12)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(187,200,99,0.4)'; (e.currentTarget as HTMLElement).style.color = '#BBC863'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Login
              </Link>
              <Link href="/auth/register" style={{
                padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
                background: '#BBC863', color: '#1E4632', fontSize: 13, fontWeight: 700,
              }}>
                Sign up
              </Link>
            </div>
          )}

          {/* Cart icon */}
          <Link href={user ? "/cart" : "/auth/login"} style={{
            position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
            color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.12)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(187,200,99,0.4)'; (e.currentTarget as HTMLElement).style.color = '#BBC863'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Cart
            {user && cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#BBC863', color: '#1E4632',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
              }}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
