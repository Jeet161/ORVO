'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Product, cartApi, wishlistApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

interface ProductCardProps {
  product: Product;
  showStatus?: boolean;
}

export function ProductCard({ product, showStatus = false }: ProductCardProps) {
  const { user } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [added, setAdded] = useState(false);

  let primaryImage = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  const imageUrl = product.title === 'Fast Wireless Charger 15W' 
    ? 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80'
    : primaryImage?.url;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }
    try {
      if (inWishlist) {
        await wishlistApi.remove(product.id);
        setInWishlist(false);
      } else {
        await wishlistApi.add(product.id);
        setInWishlist(true);
      }
    } catch {}
  };

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }
    setAddingCart(true);
    try {
      await cartApi.addItem(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {}
    setAddingCart(false);
  };

  const statusColors: Record<string, string> = {
    APPROVED: 'badge-success',
    PENDING: 'badge-warning',
    REJECTED: 'badge-danger',
    OUT_OF_STOCK: 'badge-muted',
  };

  return (
    <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card" style={{ cursor: 'pointer' }}>
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', background: 'var(--orvo-surface-2)' }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/400x400/0A1A0F/BBC863?text=No+Image';
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orvo-text-faint)', fontSize: 32 }}>
              📦
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(8,11,17,0.7)', backdropFilter: 'blur(8px)',
              border: '1px solid var(--orvo-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16,
              color: inWishlist ? '#ff6b6b' : '#fff',
              transition: 'all 0.2s',
            }}
          >
            {inWishlist ? '♥' : '♡'}
          </button>

          {/* Status badge */}
          {showStatus && (
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <span className={`badge ${statusColors[product.status] || 'badge-muted'}`}>
                {product.status}
              </span>
            </div>
          )}

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(8,11,17,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="badge badge-muted" style={{ fontSize: 12 }}>Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px 16px' }}>
          {product.category && (
            <div style={{ fontSize: 11, color: 'var(--orvo-primary-light)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>
              {product.category.name}
            </div>
          )}
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--orvo-text)', marginBottom: 4, lineHeight: 1.3,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {product.title}
          </h3>

          {product.seller && (
            <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginBottom: 10 }}>
              by {product.seller.shopName}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--orvo-text)' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>

            {product.stock > 0 && (
              <button
                onClick={addToCart}
                disabled={addingCart}
                className={`btn btn-sm ${added ? 'btn-success' : 'btn-primary'}`}
              >
                {added ? '✓ Added' : addingCart ? '...' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
