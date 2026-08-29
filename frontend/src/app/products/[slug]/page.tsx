'use client';

import { useEffect, useState, useRef } from 'react';
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
  
  // Wishlist state
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Share tooltip/copy notification state
  const [copied, setCopied] = useState(false);

  // Fetch product and check wishlist status
  useEffect(() => {
    setLoading(true);
    productsApi.getBySlug(slug)
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  // Fetch wishlist status asynchronously (non-blocking)
  useEffect(() => {
    if (user && product) {
      wishlistApi.get()
        .then((items) => {
          const found = items.some(item => item.product.id === product.id);
          setInWishlist(found);
        })
        .catch(console.error);
    }
  }, [user, product]);

  const addToCart = async () => {
    if (!user) {
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setAddingCart(true);
    try {
      await cartApi.addItem(product!.id, quantity);
      setCartMsg('Added to cart!');
      setTimeout(() => setCartMsg(''), 2500);
    } catch (err: any) {
      setCartMsg(err.message || 'Failed to add to cart');
      setTimeout(() => setCartMsg(''), 2500);
    }
    setAddingCart(false);
  };

  const toggleWishlist = async () => {
    if (!user) {
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!product || wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await wishlistApi.remove(product.id);
        setInWishlist(false);
      } else {
        await wishlistApi.add(product.id);
        setInWishlist(true);
      }
    } catch (err) {
      console.error('Wishlist action failed:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const shareProduct = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(console.error);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await reviewsApi.create(product.id, reviewRating, reviewComment);
      const updated = await productsApi.getBySlug(slug);
      setProduct(updated);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      console.error('Review submit failed:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: 50, maxWidth: 1200, margin: '0 auto' }}>
          <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 16, width: '20%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 40, width: '70%', borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 24, width: '40%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 100, width: '100%', borderRadius: 12 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ paddingTop: 100, paddingBottom: 100, textAlign: 'center', color: 'var(--orvo-text-muted)' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
        <h2>Product not found</h2>
        <p style={{ marginTop: 10, marginBottom: 24 }}>The product you are looking for does not exist or has been removed.</p>
        <Link href="/products" className="btn btn-primary">Browse Marketplace</Link>
      </div>
    );
  }

  const avgRating = product.reviews && product.reviews.length > 0
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <div className="container" style={{ paddingTop: 50, paddingBottom: 100, maxWidth: 1200, margin: '0 auto' }}>
      
      {/* ── Product Main View ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 56, marginBottom: 60, alignItems: 'start' }}>
        
        {/* Photo Gallery & Slides Column */}
        <div style={{ position: 'sticky', top: 110 }}>
          {/* Main Hero Photo (Carousel Slide) */}
          <div style={{ 
            aspectRatio: '1', 
            borderRadius: 24, 
            overflow: 'hidden', 
            background: '#ffffff', 
            border: '1px solid var(--orvo-border)', 
            boxShadow: 'var(--shadow-card)',
            marginBottom: 16,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {product.images && product.images[selectedImg] ? (
              <img 
                src={product.images[selectedImg].url} 
                alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease-in-out' }} 
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--orvo-text-faint)', gap: 8 }}>
                <span style={{ fontSize: 64 }}>📦</span>
                <span>No product image</span>
              </div>
            )}

            {/* Previous Arrow Button */}
            {product.images && product.images.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedImg((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid var(--orvo-border)',
                  color: 'var(--orvo-text)',
                  fontSize: 18,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s',
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                ‹
              </button>
            )}

            {/* Next Arrow Button */}
            {product.images && product.images.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedImg((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid var(--orvo-border)',
                  color: 'var(--orvo-text)',
                  fontSize: 18,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s',
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                ›
              </button>
            )}

            {/* Slide Index Dot Indicators */}
            {product.images && product.images.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 8,
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '6px 12px',
                borderRadius: 20,
                backdropFilter: 'blur(4px)',
                zIndex: 2,
              }}>
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImg(idx)}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      padding: 0,
                      border: 'none',
                      cursor: 'pointer',
                      background: idx === selectedImg ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Out of Stock Overlay */}
            {product.stock === 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(8,11,17,0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                zIndex: 3
              }}>
                Out of Stock
              </div>
            )}
          </div>

          {/* Thumbnails list */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {product.images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedImg(i)} 
                  style={{
                    width: 72, 
                    height: 72, 
                    borderRadius: 12, 
                    overflow: 'hidden',
                    border: `2px solid ${i === selectedImg ? 'var(--orvo-primary)' : 'var(--orvo-border)'}`,
                    boxShadow: i === selectedImg ? '0 0 0 3px rgba(49, 105, 78, 0.15)' : 'none',
                    cursor: 'pointer', 
                    background: '#ffffff', 
                    padding: 0,
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Category breadcrumb */}
          {product.category && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link href="/products" style={{ textDecoration: 'none', fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 500 }}>
                MARKETPLACE
              </Link>
              <span style={{ fontSize: 10, color: 'var(--orvo-text-faint)' }}>/</span>
              <Link href={`/products?category=${product.category.slug}`} style={{ textDecoration: 'none', fontSize: 12, color: 'var(--orvo-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {product.category.name}
              </Link>
            </div>
          )}

          {/* Product Title */}
          <h1 className="font-display" style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, color: 'var(--orvo-text)', margin: 0 }}>
            {product.title}
          </h1>

          {/* Rating Summary Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ color: avgRating && Number(avgRating) >= s ? '#f59e0b' : 'var(--orvo-text-faint)', fontSize: 18 }}>
                  ★
                </span>
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--orvo-text-muted)' }}>
              {avgRating ? `${avgRating} out of 5` : 'No reviews yet'}
            </span>
            {product.reviews && product.reviews.length > 0 && (
              <>
                <span style={{ color: 'var(--orvo-text-faint)' }}>|</span>
                <span style={{ fontSize: 13, color: 'var(--orvo-primary)', fontWeight: 700 }}>
                  {product.reviews.length} Customer Review{product.reviews.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>

          {/* Pricing Row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--orvo-primary)' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 600 }}>Inclusive of all taxes</span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--orvo-border)', margin: '4px 0' }} />

          {/* Product Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-faint)', textTransform: 'uppercase', letterSpacing: 0.8 }}>About this item</span>
            <p style={{ color: 'var(--orvo-text-muted)', fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
              {product.description}
            </p>
          </div>

          {/* Stock Availability */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ 
              padding: '6px 12px', 
              borderRadius: 20, 
              fontSize: 12, 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: 0.5,
              background: product.stock > 5 ? 'rgba(49, 105, 78, 0.1)' : product.stock > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: product.stock > 5 ? 'var(--orvo-primary)' : product.stock > 0 ? '#b45309' : 'var(--orvo-danger)'
            }}>
              {product.stock > 5 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left in stock` : 'Out of Stock'}
            </span>
          </div>

          {/* Seller profile information */}
          {product.seller && (
            <div style={{ 
              padding: '16px 20px', 
              background: 'var(--orvo-surface)', 
              borderRadius: 16, 
              border: '1px solid var(--orvo-border)',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-faint)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {product.isStudentListing ? '🎓 Student Listing By' : 'Sold & Shipped By'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--orvo-text)' }}>{product.seller.shopName}</div>
                    <div style={{ fontSize: 13, color: 'var(--orvo-text-muted)', marginTop: 2 }}>
                      📍 {product.isStudentListing ? `Campus Location: ${product.location || 'Not specified'}` : `Region: ${product.seller.region}`}
                    </div>
                  </div>
                  {product.seller.isVerified && (
                    <span style={{ background: 'rgba(187,200,99,0.15)', color: 'var(--orvo-primary-dark)', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>

              {product.isStudentListing && (
                <Link
                  href={`/chat?userId=${product.seller.userId || ''}&userName=${encodeURIComponent(product.seller.shopName)}&productId=${product.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: '#BBC863',
                    color: '#1E4632',
                    fontWeight: 800,
                    fontSize: 13,
                    padding: '10px 16px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  💬 Chat with Student Seller
                </Link>
              )}
            </div>
          )}

          {/* Add to Cart, Wishlist, and Share Panel */}
          {product.stock > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* Quantity selector */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  border: '1px solid var(--orvo-border)', 
                  borderRadius: 12, 
                  background: 'var(--orvo-surface-2)',
                  overflow: 'hidden',
                  height: 48
                }}>
                  <button 
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{ width: 40, height: '100%', border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--orvo-text-muted)' }}
                  >
                    −
                  </button>
                  <span style={{ width: 36, textAlign: 'center', fontWeight: 700, fontSize: 15, color: 'var(--orvo-text)' }}>
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    style={{ width: 40, height: '100%', border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--orvo-text-muted)' }}
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart button */}
                <button 
                  onClick={addToCart} 
                  disabled={addingCart} 
                  className="btn"
                  style={{ 
                    flex: 1, 
                    height: 48, 
                    background: 'transparent',
                    border: '2px solid var(--orvo-primary)',
                    color: 'var(--orvo-primary)', 
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {addingCart ? 'Adding...' : 'Add to Cart'}
                </button>

                {/* Buy Now button */}
                <button 
                  onClick={() => {
                    if (!user) {
                      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
                      return;
                    }
                    // Store buy-now intent in sessionStorage (does NOT touch cart)
                    sessionStorage.setItem('orvo_buynow', JSON.stringify({
                      productId: product.id,
                      productTitle: product.title,
                      productImage: product.images?.[0]?.url ?? null,
                      productPrice: product.price,
                      quantity,
                    }));
                    window.location.href = '/checkout?mode=buynow';
                  }} 
                  className="btn"
                  style={{ 
                    flex: 1, 
                    height: 48, 
                    background: 'linear-gradient(135deg, var(--orvo-accent) 0%, var(--orvo-primary-light) 100%)', 
                    color: '#1E4632',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 800,
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  Buy Now
                </button>
              </div>

              {/* Action buttons (Wishlist, Share) */}
              <div style={{ display: 'flex', gap: 12 }}>
                
                {/* Wishlist toggle */}
                <button 
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 12,
                    border: '1px solid var(--orvo-border)',
                    background: inWishlist ? 'rgba(239,68,68,0.06)' : 'var(--orvo-surface)',
                    color: inWishlist ? '#ef4444' : 'var(--orvo-text-muted)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: 16 }}>{inWishlist ? '♥' : '♡'}</span>
                  {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </button>

                {/* Share product */}
                <button 
                  onClick={shareProduct}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 12,
                    border: '1px solid var(--orvo-border)',
                    background: 'var(--orvo-surface)',
                    color: 'var(--orvo-text-muted)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: 14 }}>🔗</span>
                  {copied ? 'Link Copied!' : 'Share Product'}
                </button>

              </div>
            </div>
          )}

          {/* Cart Message toast/notification */}
          {cartMsg && (
            <div style={{ 
              padding: '12px 16px', 
              background: 'rgba(49, 105, 78, 0.08)', 
              border: '1px solid rgba(49, 105, 78, 0.2)', 
              borderRadius: 12, 
              fontSize: 14, 
              color: 'var(--orvo-primary)',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {cartMsg}
            </div>
          )}
        </div>
      </div>

      {/* ── Premium Product Description Section (Enajori style) ── */}
      <div style={{ 
        marginTop: 40,
        marginBottom: 40,
        padding: '32px 40px',
        background: 'var(--orvo-surface)',
        border: '1px solid var(--orvo-border)',
        borderRadius: 24,
        boxShadow: 'var(--shadow-card)'
      }}>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 900, marginBottom: 16, color: 'var(--orvo-text)' }}>
          Product Description
        </h2>
        <p style={{ 
          color: 'var(--orvo-text-muted)', 
          fontSize: 15.5, 
          lineHeight: 1.8, 
          whiteSpace: 'pre-line',
          margin: 0
        }}>
          {product.description}
        </p>
      </div>

      {/* ── Product Reviews & Feedback section ── */}
      <div style={{ marginTop: 80 }}>
        <div style={{ height: 1, background: 'var(--orvo-border)', marginBottom: 40 }} />
        
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 900, marginBottom: 24, color: 'var(--orvo-text)' }}>
          Customer Reviews & Ratings
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.8fr)', gap: 48, alignItems: 'start' }}>
          
          {/* Review write panel / Ratings summary */}
          <div style={{ position: 'sticky', top: 110, display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Reviews Summary Stats */}
            <div style={{ 
              padding: '24px', 
              background: 'var(--orvo-surface)', 
              borderRadius: 20, 
              border: '1px solid var(--orvo-border)',
              boxShadow: 'var(--shadow-card)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--orvo-primary)' }}>
                {avgRating || '0.0'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '8px 0' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} style={{ color: avgRating && Number(avgRating) >= s ? '#f59e0b' : 'var(--orvo-text-faint)', fontSize: 20 }}>
                    ★
                  </span>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--orvo-text-muted)', fontWeight: 600 }}>
                Based on {product.reviews?.length || 0} customer reviews
              </p>
            </div>

            {/* Write a review form */}
            {user ? (
              <form onSubmit={submitReview} style={{ 
                padding: '24px', 
                background: 'var(--orvo-surface)', 
                borderRadius: 20, 
                border: '1px solid var(--orvo-border)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--orvo-text)' }}>Write a review</h3>
                
                {/* Star selection */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-faint)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Rating</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        key={s} 
                        type="button"
                        onClick={() => setReviewRating(s)} 
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', fontSize: 28,
                          color: reviewRating >= s ? '#f59e0b' : 'var(--orvo-text-faint)',
                          padding: 0,
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment area */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-faint)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Your Comment</label>
                  <textarea 
                    className="input" 
                    rows={4} 
                    placeholder="Share your thoughts about this item's quality, details, delivery..." 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    style={{ resize: 'vertical' }} 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submittingReview || !reviewComment.trim()} 
                  className="btn btn-primary"
                  style={{ width: '100%', height: 44, borderRadius: 10 }}
                >
                  {submittingReview ? 'Submitting Review...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div style={{ 
                padding: '24px', 
                background: 'var(--orvo-surface-2)', 
                borderRadius: 20, 
                border: '1px dashed var(--orvo-border)',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--orvo-text-muted)', marginBottom: 14 }}>
                  You must be logged in to leave a review.
                </p>
                <Link href="/auth/login" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}>
                  Log In
                </Link>
              </div>
            )}
          </div>

          {/* List of Reviews */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!product.reviews || product.reviews.length === 0 ? (
              <div style={{ 
                padding: '48px 24px', 
                background: 'var(--orvo-surface)', 
                borderRadius: 20, 
                border: '1px solid var(--orvo-border)', 
                textAlign: 'center',
                color: 'var(--orvo-text-muted)'
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✍️</div>
                <p style={{ margin: 0, fontWeight: 500 }}>No reviews yet. Be the first to share your feedback!</p>
              </div>
            ) : (
              product.reviews.map((review) => (
                <div 
                  key={review.id} 
                  style={{ 
                    padding: '20px 24px', 
                    background: 'var(--orvo-surface)', 
                    borderRadius: 20, 
                    border: '1px solid var(--orvo-border)',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--orvo-text)', fontSize: 15 }}>
                        {review.user?.name ?? 'Anonymous'}
                      </div>
                      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} style={{ color: review.rating >= s ? '#f59e0b' : 'var(--orvo-text-faint)', fontSize: 14 }}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--orvo-text-faint)', fontWeight: 600 }}>
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p style={{ 
                      color: 'var(--orvo-text-muted)', 
                      fontSize: 14.5, 
                      lineHeight: 1.6, 
                      margin: 0,
                      whiteSpace: 'pre-line'
                    }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* ── Related Products Carousel Slider ── */}
      <RelatedProductsSection categorySlug={product.category?.slug} currentProductId={product.id} />

    </div>
  );
}

import { ProductCard } from '@/components/products/product-card';

function RelatedProductsSection({ categorySlug, currentProductId }: { categorySlug?: string; currentProductId: string }) {
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!categorySlug) return;
    productsApi.getAll({ category: categorySlug })
      .then((data) => {
        // Filter out the current product
        setRelated(data.filter(p => p.id !== currentProductId));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categorySlug, currentProductId]);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 300;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div style={{ marginTop: 60 }}>
        <h3 className="font-display" style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>Related Products</h3>
        <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ width: 240, height: 320, borderRadius: 16, flexShrink: 0 }} />
          ))}
        </div>
      </div>
    );
  }

  if (related.length === 0) return null;

  return (
    <div style={{ marginTop: 80, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 className="font-display" style={{ fontSize: 24, fontWeight: 900, color: 'var(--orvo-text)' }}>Related Products</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => scroll('left')}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1px solid var(--orvo-border)', background: 'var(--orvo-surface)',
              color: 'var(--orvo-text)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}
          >
            ‹
          </button>
          <button 
            onClick={() => scroll('right')}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1px solid var(--orvo-border)', background: 'var(--orvo-surface)',
              color: 'var(--orvo-text)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}
          >
            ›
          </button>
        </div>
      </div>

      <div 
        ref={sliderRef}
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 20,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: 16,
          scrollbarWidth: 'none', // Firefox
        }}
      >
        {related.map((prod) => (
          <div key={prod.id} style={{ width: 260, flexShrink: 0, scrollSnapAlign: 'start' }}>
            <ProductCard product={prod} />
          </div>
        ))}
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }
      `}</style>
    </div>
  );
}
