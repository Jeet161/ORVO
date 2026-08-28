'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { productsApi, reviewsApi, cartApi, wishlistApi, Product } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { slug } = useParams() as { slug: string };
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [cartMsg, setCartMsg] = useState('');
  const [inWishlist, setInWishlist] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    productsApi.getBySlug(slug)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async () => {
    if (!user) return;
    setAddingCart(true);
    try {
      await cartApi.addItem(product!.id, quantity);
      setCartMsg('Added to cart!');
      setTimeout(() => setCartMsg(''), 2500);
    } catch (err: any) {
      setCartMsg(err.message || 'Failed to add');
      setTimeout(() => setCartMsg(''), 2500);
    }
    setAddingCart(false);
  };

  const submitReview = async () => {
    if (!user || !product) return;
    setSubmittingReview(true);
    try {
      await reviewsApi.create(product.id, reviewRating, reviewComment);
      const updated = await productsApi.getBySlug(slug);
      setProduct(updated);
      setReviewComment('');
    } catch {}
    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[60, 80, 40, 100].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: 20, width: `${w}%`, borderRadius: 6 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="container" style={{ paddingTop: 80, textAlign: 'center', color: 'var(--orvo-text-muted)' }}>Product not found.</div>;
  }

  const avgRating = product.reviews && product.reviews.length > 0
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>

        {/* Images */}
        <div>
          <div style={{ aspectRatio: '1', borderRadius: 16, overflow: 'hidden', background: 'var(--orvo-surface-2)', border: '1px solid var(--orvo-border)', marginBottom: 12 }}>
            {product.images[selectedImg] ? (
              <img src={product.images[selectedImg].url} alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📦</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)} style={{
                  width: 60, height: 60, borderRadius: 8, overflow: 'hidden',
                  border: `2px solid ${i === selectedImg ? 'var(--orvo-primary)' : 'var(--orvo-border)'}`,
                  cursor: 'pointer', background: 'none', padding: 0,
                }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {product.category && (
            <Link href={`/products?category=${product.category.slug}`} style={{ textDecoration: 'none', fontSize: 12, color: 'var(--orvo-primary-light)', fontWeight: 600, letterSpacing: 0.5 }}>
              {product.category.name.toUpperCase()}
            </Link>
          )}

          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: 'var(--orvo-text)' }}>
            {product.title}
          </h1>

          {/* Rating */}
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[1,2,3,4,5].map((s) => (
                <span key={s} style={{ color: Number(avgRating) >= s ? '#f59e0b' : 'var(--orvo-text-faint)' }}>★</span>
              ))}
              <span style={{ fontSize: 13, color: 'var(--orvo-text-muted)' }}>{avgRating} ({product.reviews?.length} reviews)</span>
            </div>
          )}

          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--orvo-text)' }}>
            ₹{product.price.toLocaleString('en-IN')}
          </div>

          <p style={{ color: 'var(--orvo-text-muted)', lineHeight: 1.7 }}>{product.description}</p>

          {/* Stock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${product.stock > 5 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Seller info */}
          {product.seller && (
            <div style={{ padding: '12px 16px', background: 'var(--orvo-surface-2)', borderRadius: 12, border: '1px solid var(--orvo-border)' }}>
              <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginBottom: 4 }}>Sold by</div>
              <div style={{ fontWeight: 600, color: 'var(--orvo-text)' }}>{product.seller.shopName}</div>
              <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)' }}>📍 {product.seller.region}</div>
            </div>
          )}

          {/* Qty + Add to cart */}
          {user && product.stock > 0 && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--orvo-border)', borderRadius: 10, overflow: 'hidden' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span style={{ padding: '0 16px', fontWeight: 600, color: 'var(--orvo-text)' }}>{quantity}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <button onClick={addToCart} disabled={addingCart} className="btn btn-primary" style={{ flex: 1 }}>
                {addingCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}

          {cartMsg && (
            <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, fontSize: 13, color: 'var(--orvo-success)' }}>
              {cartMsg}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div style={{ marginTop: 64 }}>
        <div className="divider" />
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Customer Reviews</h2>

        {user && (
          <div className="glass" style={{ padding: 24, marginBottom: 32 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Write a Review</h3>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 24,
                  color: reviewRating >= s ? '#f59e0b' : 'var(--orvo-text-faint)',
                }}>★</button>
              ))}
            </div>
            <textarea className="input" rows={3} placeholder="Share your experience..." value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              style={{ resize: 'vertical', marginBottom: 12 }} />
            <button onClick={submitReview} disabled={submittingReview} className="btn btn-primary btn-sm">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}

        {!product.reviews || product.reviews.length === 0 ? (
          <p style={{ color: 'var(--orvo-text-muted)' }}>No reviews yet. Be the first!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {product.reviews.map((review) => (
              <div key={review.id} className="glass" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--orvo-text)' }}>{review.user.name}</span>
                    <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} style={{ color: review.rating >= s ? '#f59e0b' : 'var(--orvo-text-faint)', fontSize: 14 }}>★</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--orvo-text-faint)' }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14 }}>{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
