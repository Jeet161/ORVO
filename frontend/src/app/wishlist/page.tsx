'use client';

import { useEffect, useState } from 'react';
import { wishlistApi, WishlistItem } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { ProductCard } from '@/components/products/product-card';
import Link from 'next/link';

export default function WishlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) wishlistApi.get().then(setItems).finally(() => setLoading(false));
    else setLoading(false);
  }, [user]);

  if (!user) return (
    <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
      <Link href="/auth/login" className="btn btn-primary">Login to view wishlist</Link>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>❤️ Wishlist</h1>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 320, borderRadius: 16 }} />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💔</div>
          <p style={{ color: 'var(--orvo-text-muted)', marginBottom: 20 }}>Your wishlist is empty.</p>
          <Link href="/products" className="btn btn-primary">Discover Products</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {items.map((item) => <ProductCard key={item.id} product={item.product} />)}
        </div>
      )}
    </div>
  );
}
