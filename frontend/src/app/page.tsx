'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { productsApi, categoriesApi, Product, Category } from '@/lib/api';
import { ProductCard } from '@/components/products/product-card';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsApi.getAll({ sortBy: 'newest' }),
      categoriesApi.getAll(),
    ]).then(([products, cats]) => {
      setFeaturedProducts(products.slice(0, 8));
      setCategories(cats.slice(0, 6));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <section style={{
        padding: '100px 0 80px',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(88, 101, 242, 0.25) 0%, transparent 60%)',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 99, background: 'rgba(88,101,242,0.12)', border: '1px solid rgba(88,101,242,0.25)', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orvo-accent)', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'var(--orvo-primary-light)', fontWeight: 600, letterSpacing: 0.5 }}>Verified Multi-Vendor Marketplace</span>
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1px' }}>
            Shop with{' '}
            <span className="gradient-text">Complete Trust</span>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--orvo-text-muted)', maxWidth: 540, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Every seller on ORVO is verified by our team. Every product is moderated before going live. Shop with confidence.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" className="btn btn-primary btn-lg">
              Explore Products
            </Link>
            <Link href="/auth/register" className="btn btn-secondary btn-lg">
              Sell on ORVO
            </Link>
          </div>

          {/* Trust Badges */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
            {[
              { icon: '✓', label: 'Verified Sellers' },
              { icon: '🔍', label: 'Moderated Products' },
              { icon: '🔒', label: 'Secure Checkout' },
              { icon: '📦', label: 'Live Order Tracking' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--orvo-text-muted)', fontSize: 14, fontWeight: 500 }}>
                <span style={{ color: 'var(--orvo-accent)', fontSize: 16 }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section style={{ padding: '60px 0' }}>
          <div className="container">
            <h2 className="font-display" style={{ fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Browse Categories</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {categories.map((cat) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} style={{
                  display: 'block',
                  padding: '20px 16px',
                  background: 'var(--orvo-surface)',
                  border: '1px solid var(--orvo-border)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  color: 'var(--orvo-text)',
                  fontWeight: 500,
                  fontSize: 14,
                }}>
                  {cat.name}
                  {cat.children && cat.children.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--orvo-text-muted)', marginTop: 4 }}>
                      {cat.children.length} subcategories
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section style={{ padding: '20px 0 80px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <h2 className="font-display" style={{ fontSize: 28, fontWeight: 700 }}>Newest Arrivals</h2>
            <Link href="/products" className="btn btn-ghost btn-sm">View all →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 340, borderRadius: 16 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
