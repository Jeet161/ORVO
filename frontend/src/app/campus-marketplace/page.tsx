'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { productsApi, categoriesApi, sellersApi, Product, Category } from '@/lib/api';

const CONDITION_LABELS: Record<string, string> = {
  NEW: '✨ New',
  LIKE_NEW: '🌟 Like New',
  GOOD: '👍 Good',
  FAIR: '👌 Fair',
};

const TYPE_LABELS: Record<string, string> = {
  SELL: '💰 Buy',
  RENT: '⏳ Rent',
  FREE: '🎁 Free',
};

export default function CampusMarketplacePage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [listingType, setListingType] = useState('');
  const [location, setLocation] = useState('');
  const [activating, setActivating] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getAll({
        isStudentListing: true,
        category,
        condition,
        sortBy: 'newest',
        search: search.trim() || undefined,
      });

      // Filter on frontend for listingType and location if needed, or pass it to backend
      let filtered = data;
      if (listingType) {
        filtered = filtered.filter(p => p.listingType === listingType);
      }
      if (location) {
        filtered = filtered.filter(p => p.location?.toLowerCase().includes(location.toLowerCase()));
      }
      setProducts(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load categories
    categoriesApi.getAll().then(cats => {
      // Filter category list to books, hostel, lab, rides or all
      setCategories(cats);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [category, condition, listingType, location]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleSellClick = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/campus-marketplace');
      return;
    }

    if (user.role === 'SELLER') {
      router.push('/seller/products/new');
      return;
    }

    // Auto-upgrade to student seller
    try {
      setActivating(true);
      await sellersApi.studentOnboard();
      // Force refresh user profile/session if possible
      window.location.href = '/seller/products/new?student=true';
    } catch (err: any) {
      alert('Failed to activate seller profile: ' + err.message);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div style={{ background: '#0A1A0F', minHeight: '100vh', color: '#fff', paddingBottom: 80 }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #132a1b 0%, #0A1A0F 100%)',
        borderBottom: '1px solid rgba(187,200,99,0.15)',
        padding: '60px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(187,200,99,0.06)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(187,200,99,0.04)', filter: 'blur(80px)' }} />
        
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span style={{
            display: 'inline-block', marginBottom: 16, padding: '4px 12px', borderRadius: 99,
            background: 'rgba(187,200,99,0.12)', border: '1px solid rgba(187,200,99,0.25)',
            fontSize: 11, fontWeight: 700, color: '#BBC863', letterSpacing: 1.5, textTransform: 'uppercase'
          }}>
            🏫 Local Campus Hub
          </span>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', margin: '0 0 16px' }}>
            Hostel & PG <span style={{ color: '#BBC863', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>Marketplace</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, maxWidth: 550, margin: '0 auto 30px', lineHeight: 1.6 }}>
            Buy, rent, or grab free used books, hostel essentials, electronics, and bikes directly from fellow students on campus.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <button
              onClick={handleSellClick}
              disabled={activating}
              style={{
                background: '#BBC863', color: '#1E4632', border: 'none',
                padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(187,200,99,0.25)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {activating ? 'Setting up...' : '➕ Sell a Used Item'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 40, alignItems: 'start' }}>
          
          {/* Filters Sidebar */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: 24, position: 'sticky', top: 100
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>Filters</h2>

            {/* Category Select */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '10px 12px', color: '#fff', outline: 'none'
                }}
              >
                <option value="" style={{ background: '#132a1b' }}>All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug} style={{ background: '#132a1b' }}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Condition Select */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '10px 12px', color: '#fff', outline: 'none'
                }}
              >
                <option value="" style={{ background: '#132a1b' }}>All Conditions</option>
                {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k} style={{ background: '#132a1b' }}>{v}</option>
                ))}
              </select>
            </div>

            {/* Listing Type Select */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>Offer Type</label>
              <select
                value={listingType}
                onChange={e => setListingType(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '10px 12px', color: '#fff', outline: 'none'
                }}
              >
                <option value="" style={{ background: '#132a1b' }}>Buy / Rent / Free</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k} style={{ background: '#132a1b' }}>{v}</option>
                ))}
              </select>
            </div>

            {/* Location Input */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>Campus Location</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Hostel A"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '10px 12px', color: '#fff', outline: 'none'
                }}
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setCategory('');
                setCondition('');
                setListingType('');
                setLocation('');
                setSearch('');
              }}
              style={{
                width: '100%', padding: '10px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
                color: 'rgba(255,255,255,0.7)', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            >
              Reset Filters
            </button>
          </div>

          {/* Listings Area */}
          <div>
            {/* Search Input Row */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, marginBottom: 30 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search campus marketplace (e.g. algorithms book, kettle)..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '14px 20px', color: '#fff', fontSize: 15, outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#BBC863', color: '#1E4632', border: 'none',
                  borderRadius: 12, padding: '0 28px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Search
              </button>
            </form>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ height: 350, borderRadius: 20, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444' }}>
                <p>{error}</p>
                <button onClick={fetchProducts} style={{ color: '#BBC863', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginTop: 10 }}>Retry</button>
              </div>
            ) : products.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '80px 24px', borderRadius: 20,
                background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)'
              }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🔍</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Listings Found</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 400, margin: '0 auto' }}>
                  No campus listings match your current filters. Try relaxing filters or start the trend by listing your own used items!
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
                {products.map(product => {
                  const image = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || 'https://placehold.co/400x300';
                  return (
                    <div
                      key={product.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        transition: 'transform 0.2s, border-color 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = 'rgba(187,200,99,0.3)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      }}
                    >
                      {/* Product Image */}
                      <Link href={`/products/${product.slug}`} style={{ position: 'relative', display: 'block', height: 200, overflow: 'hidden' }}>
                        <img src={image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{
                          position: 'absolute', top: 12, left: 12,
                          background: 'rgba(10,26,15,0.85)', backdropFilter: 'blur(4px)',
                          color: '#BBC863', padding: '4px 10px', borderRadius: 99,
                          fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5
                        }}>
                          {TYPE_LABELS[product.listingType || 'SELL'] || 'Buy'}
                        </span>
                        {product.condition && (
                          <span style={{
                            position: 'absolute', bottom: 12, right: 12,
                            background: 'rgba(255,255,255,0.9)', color: '#1E4632',
                            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700
                          }}>
                            {CONDITION_LABELS[product.condition] || product.condition}
                          </span>
                        )}
                      </Link>

                      {/* Content */}
                      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                          {product.category?.name}
                        </span>
                        <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: '#fff' }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3, height: 40, overflow: 'hidden' }}>
                            {product.title}
                          </h3>
                        </Link>

                        {/* Location */}
                        {product.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                            <span>📍</span>
                            <span>{product.location}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 17, fontWeight: 800, color: '#BBC863' }}>
                            {product.price === 0 ? 'Free' : `₹${product.price.toLocaleString('en-IN')}`}
                          </span>
                          
                          <Link href={`/products/${product.slug}`} style={{
                            background: '#fff', color: '#1E4632', padding: '6px 12px',
                            borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: 'none'
                          }}>
                            View Detail
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
