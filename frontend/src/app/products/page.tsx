'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { productsApi, categoriesApi, Product, Category } from '@/lib/api';
import { ProductCard } from '@/components/products/product-card';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    sellerRegion: '',
    sortBy: 'newest' as 'newest' | 'price_asc' | 'price_desc',
  });

  const fetchProducts = useCallback(() => {
    setLoading(true);
    productsApi.getAll({
      search: filters.search || undefined,
      category: filters.category || undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      sellerRegion: filters.sellerRegion || undefined,
      sortBy: filters.sortBy,
    })
    .then(setProducts)
    .catch((err) => console.error('Products fetch failed:', err))
    .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    categoriesApi.getAll()
      .then(setCategories)
      .catch((err) => console.error('Categories fetch failed:', err));
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 400);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const flatCategories = (cats: Category[]): Category[] =>
    cats.flatMap((c) => [c, ...flatCategories(c.children || [])]);

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28 }}>

        {/* Sidebar Filters */}
        <aside>
          <div className="glass" style={{ padding: 20, position: 'sticky', top: 80 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Filters</h3>

            {/* Search */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>SEARCH</label>
              <input
                className="input"
                placeholder="Keyword..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>CATEGORY</label>
              <select
                className="input"
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                style={{ background: 'var(--orvo-surface-2)', color: 'var(--orvo-text)' }}
              >
                <option value="">All Categories</option>
                {flatCategories(categories).map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>PRICE RANGE (₹)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="input" type="number" placeholder="Min" value={filters.minPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))} />
                <input className="input" type="number" placeholder="Max" value={filters.maxPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))} />
              </div>
            </div>

            {/* Region */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>SELLER REGION</label>
              <input className="input" placeholder="e.g. Punjab"
                value={filters.sellerRegion}
                onChange={(e) => setFilters((f) => ({ ...f, sellerRegion: e.target.value }))} />
            </div>

            {/* Sort */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 600, display: 'block', marginBottom: 8 }}>SORT BY</label>
              <select className="input" value={filters.sortBy}
                onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as any }))}
                style={{ background: 'var(--orvo-surface-2)', color: 'var(--orvo-text)' }}>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 16 }}
              onClick={() => setFilters({ search: '', category: '', minPrice: '', maxPrice: '', sellerRegion: '', sortBy: 'newest' })}>
              Clear filters
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700 }}>
              Products {!loading && <span style={{ fontSize: 14, color: 'var(--orvo-text-muted)', fontWeight: 400 }}>({products.length} results)</span>}
            </h1>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 340, borderRadius: 16 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--orvo-text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <p style={{ fontSize: 16 }}>No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingTop: 48 }}>
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
