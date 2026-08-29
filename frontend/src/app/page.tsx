'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { productsApi, categoriesApi, Product, Category } from '@/lib/api';
import { ProductCard } from '@/components/products/product-card';

const CATEGORY_ICONS: Record<string, string> = {
  clothing: '👗', handicrafts: '🏺', jewellery: '💍', food: '🍱', electronics: '📱',
};

const FEATURES = [
  { icon: '🛡️', title: 'Verified Sellers', desc: 'Every seller is manually reviewed before they list a single product.' },
  { icon: '🔍', title: 'Moderated Products', desc: 'No fakes, no spam — all listings pass quality checks.' },
  { icon: '🚚', title: 'Tracked Deliveries', desc: 'Follow your order from payment to your doorstep.' },
  { icon: '⭐', title: 'Verified Reviews', desc: 'Only buyers who purchased can leave a review.' },
];

export default function HomePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([
      productsApi.getAll({ sortBy: 'newest' }),
      categoriesApi.getAll(),
    ]).then(([p, c]) => {
      setProducts(p.slice(0, 8));
      setCategories(c.slice(0, 6));
    }).finally(() => setLoading(false));
  }, []);

  // Auto-advance hero carousel
  const heroProducts = products.slice(0, 5);
  const startCarousel = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % Math.max(heroProducts.length, 1));
    }, 4000);
  }, [heroProducts.length]);

  useEffect(() => {
    if (heroProducts.length > 0) startCarousel();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [heroProducts.length, startCarousel]);

  const goTo = (idx: number) => {
    setHeroIndex(idx);
    startCarousel();
  };

  const hero = heroProducts[heroIndex];
  const heroImg = hero?.images?.find(i => i.isPrimary)?.url || hero?.images?.[0]?.url || '';

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          HERO — full-width dark sliding carousel (Enajori style)
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#0A1A0F', position: 'relative', overflow: 'hidden', minHeight: '82vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

        {/* ── Heading ── */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '15px 24px 10px' }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.3rem, 3.2vw, 2rem)',
            fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.8px',
            margin: 0
          }}>
            Crafted by{' '}
            <em style={{ fontStyle: 'italic', color: '#BBC863', fontFamily: 'Georgia, serif' }}>Artisans</em>
            {' '}.<br />
            Curated for{' '}
            <em style={{ fontStyle: 'italic', color: '#BBC863', fontFamily: 'Georgia, serif' }}>You</em>
            .
          </h1>
        </div>

        {/* ── Sliding product card ── */}
        <div style={{ width: '100%', maxWidth: 1140, padding: '0 24px', position: 'relative', zIndex: 2 }}>
          {loading ? (
            <div style={{ height: 420, borderRadius: 28, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
          ) : hero ? (
            <div key={heroIndex} style={{
              borderRadius: '28px 28px 28px 28px', overflow: 'hidden', position: 'relative',
              height: 420, boxShadow: '0 25px 60px rgba(0,0,0,0.55)',
              transition: 'opacity 0.5s ease',
            }}>
              {/* Background image */}
              {heroImg ? (
                <img src={heroImg} alt={hero.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1E4632 0%, #BBC863 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🛍️</div>
              )}

              {/* Gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />

              {/* Card content */}
              <div style={{ position: 'absolute', left: 24, bottom: 24, right: 24 }}>
                {hero.category && (
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: 'rgba(187,200,99,0.85)', color: '#1E4632', fontSize: 9, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
                    {hero.category.name}
                  </span>
                )}
                <h2 style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)', margin: '0 0 8px', textShadow: '0 2px 8px rgba(0,0,0,0.4)', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                  {hero.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#BBC863', fontWeight: 800, fontSize: 18 }}>₹{hero.price.toLocaleString('en-IN')}</span>
                  <Link href={`/products/${hero.slug}`} style={{
                    padding: '7px 18px', borderRadius: 99, background: '#fff', color: '#1E4632',
                    textDecoration: 'none', fontWeight: 700, fontSize: 11, letterSpacing: 0.5,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s',
                  }}>
                    LEARN MORE
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: 300, borderRadius: 20, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>
              No products yet — add some via the seller dashboard!
            </div>
          )}

          {/* ── Dot indicators ── */}
          {heroProducts.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 14, paddingRight: 4 }}>
              {heroProducts.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} style={{
                  width: i === heroIndex ? 28 : 8, height: 8, borderRadius: 99,
                  border: 'none', cursor: 'pointer', padding: 0,
                  background: i === heroIndex ? '#BBC863' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.35s ease',
                }} />
              ))}
            </div>
          )}
        </div>


      </section>

      {/* ══ CATEGORIES ════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section style={{ padding: '80px 0 60px', background: '#0A1A0F' }}>
          <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 40, letterSpacing: '-0.5px' }}>
              Categories
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: 18,
              justifyContent: 'center',
              maxWidth: 1080,
              margin: '0 auto'
            }}>
              {categories.map(cat => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 12, padding: '32px 20px', borderRadius: 16, textDecoration: 'none', textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  color: '#fff', fontWeight: 600, fontSize: 15,
                  transition: 'all 0.25s ease',
                }}
                  onMouseEnter={e => { 
                    (e.currentTarget as HTMLElement).style.background = 'rgba(187,200,99,0.08)'; 
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(187,200,99,0.25)'; 
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => { 
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; 
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; 
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: 40, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>{CATEGORY_ICONS[cat.slug] ?? '🛍️'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '0.3px', marginTop: 4 }}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FEATURED PRODUCTS ═════════════════════════════════════════ */}
      <section style={{ padding: '60px 0 80px', background: '#0f2018' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>Newest Arrivals</h2>
            <Link href="/products" style={{ fontSize: 13, fontWeight: 700, color: '#BBC863', textDecoration: 'none', letterSpacing: 0.5 }}>VIEW ALL →</Link>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {[...Array(4)].map((_, i) => <div key={i} style={{ height: 300, borderRadius: 16, background: 'rgba(255,255,255,0.05)' }} />)}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
              <p>No products live yet. Be the first to sell!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══ WHY ORVO (light section) ══════════════════════════════════ */}
      <section style={{ padding: '80px 0', background: '#F4FAD2' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, marginBottom: 10 }}>Why ORVO?</h2>
            <p style={{ color: 'var(--orvo-text-muted)', fontSize: 16 }}>Built around trust, transparency, and quality craftsmanship</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ padding: '28px 24px', borderRadius: 16, background: '#fff', border: '1px solid var(--orvo-border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BECOME A SELLER CTA ═══════════════════════════════════════ */}
      {(!user || user.role === 'BUYER') && (
        <section style={{ padding: '90px 0', background: '#0A1A0F', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(187,200,99,0.06)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <span style={{ display: 'inline-block', marginBottom: 20, padding: '5px 16px', borderRadius: 99, background: 'rgba(187,200,99,0.12)', border: '1px solid rgba(187,200,99,0.25)', fontSize: 11, fontWeight: 700, color: '#BBC863', letterSpacing: 2, textTransform: 'uppercase' }}>
              For Sellers
            </span>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-1px' }}>
              Ready to Sell on ORVO?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.75 }}>
              Apply to become a verified seller. Get your own shop dashboard, list products, and manage orders — after admin approval.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/seller/apply" style={{
                padding: '14px 34px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none',
                background: '#BBC863', color: '#1E4632', letterSpacing: 0.5,
                boxShadow: '0 4px 24px rgba(187,200,99,0.25)',
              }}>
                Apply to Sell →
              </Link>
              {!user && (
                <Link href="/auth/register" style={{
                  padding: '14px 34px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none',
                  background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  Create Account First
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
