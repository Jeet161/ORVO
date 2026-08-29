'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { productsApi, categoriesApi, Category } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ImgFile { dataUrl: string; name: string; }

// ─── Step Progress Bar ────────────────────────────────────────────────────────
function StepBar({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {labels.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 15, transition: 'all 0.3s',
                background: done ? 'var(--orvo-primary)' : active ? 'var(--orvo-surface-3)' : 'var(--orvo-surface)',
                color: done ? '#fff' : active ? 'var(--orvo-primary)' : 'var(--orvo-text-faint)',
                border: active ? '2px solid var(--orvo-primary)' : done ? 'none' : '1px solid var(--orvo-border)',
                boxShadow: active ? 'var(--shadow-glow)' : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: active ? 'var(--orvo-primary)' : done ? 'var(--orvo-text)' : 'var(--orvo-text-faint)', textTransform: 'uppercase', letterSpacing: 1.2, whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < total - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? 'var(--orvo-primary)' : 'var(--orvo-border)', margin: '0 16px', marginBottom: 26, transition: 'background 0.3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Image Drop Zone ──────────────────────────────────────────────────────────
function ImageDropZone({ images, onAdd, onRemove, onSetPrimary }: {
  images: ImgFile[];
  onAdd: (dataUrl: string, name: string) => void;
  onRemove: (i: number) => void;
  onSetPrimary: (i: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [err, setErr] = useState('');

  const processFile = useCallback((file: File) => {
    setErr('');
    if (!file.type.startsWith('image/')) { setErr('Only image files accepted.'); return; }
    if (file.size > 5 * 1024 * 1024) { setErr('Image too large — max 5 MB.'); return; }
    const r = new FileReader();
    r.onload = e => onAdd(e.target?.result as string, file.name);
    r.readAsDataURL(file);
  }, [onAdd]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  }, [processFile]);

  return (
    <div>
      {/* Drop zone */}
      {images.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragging ? 'var(--orvo-primary)' : 'var(--orvo-border-strong)'}`,
            borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'var(--orvo-surface-3)' : 'var(--orvo-surface-2)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--orvo-text)', marginBottom: 6 }}>Drop images here or click to browse</div>
          <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)' }}>PNG, JPG, WEBP — max 5 MB each. First image = main photo.</div>
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', border: i === 0 ? '2px solid var(--orvo-primary)' : '2px solid var(--orvo-border)' }}>
              <img src={img.dataUrl} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {i === 0 && <span style={{ position: 'absolute', top: 6, left: 6, background: 'var(--orvo-primary)', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>MAIN</span>}
              <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', gap: 3 }}>
                {i !== 0 && <button type="button" onClick={() => onSetPrimary(i)} title="Set as main" style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'rgba(255,255,255,0.9)', color: 'var(--orvo-primary)', fontSize: 10, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>⭐</button>}
                <button type="button" onClick={() => onRemove(i)} style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'rgba(185,28,28,0.95)', color: '#fff', fontSize: 14, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
            </div>
          ))}
          {/* Add more slot */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{ aspectRatio: '1', borderRadius: 12, border: `2px dashed ${dragging ? 'var(--orvo-primary)' : 'var(--orvo-border)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--orvo-surface-2)', gap: 4, transition: 'all 0.2s' }}
          >
            <span style={{ fontSize: 22, color: 'var(--orvo-text-faint)' }}>+</span>
            <span style={{ fontSize: 10, color: 'var(--orvo-text-muted)', fontWeight: 600 }}>Add more</span>
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => Array.from(e.target.files ?? []).forEach(processFile)} />

      {err && <p style={{ fontSize: 12, color: 'var(--orvo-danger)', marginTop: 8, fontWeight: 600 }}>⚠ {err}</p>}
      {images.length > 0 && (
        <button type="button" onClick={() => inputRef.current?.click()} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--orvo-border)', background: 'var(--orvo-surface-2)', color: 'var(--orvo-text-muted)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>+ Add more images</button>
      )}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-muted)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {label}{required && <span style={{ color: 'var(--orvo-primary)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--orvo-text-faint)', margin: 0, paddingLeft: 4 }}>{hint}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 12,
  border: '1px solid var(--orvo-border)', background: 'var(--orvo-surface)',
  color: 'var(--orvo-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'all 0.2s',
};

function CustomInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...style
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--orvo-primary)';
        e.target.style.background = 'var(--orvo-surface-2)';
        e.target.style.boxShadow = 'var(--shadow-glow)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'var(--orvo-border)';
        e.target.style.background = 'var(--orvo-surface)';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

// ─── Custom Text Area ─────────────────────────────────────────────────────────
function CustomTextArea({ style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle,
        resize: 'vertical',
        ...style
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--orvo-primary)';
        e.target.style.background = 'var(--orvo-surface-2)';
        e.target.style.boxShadow = 'var(--shadow-glow)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'var(--orvo-border)';
        e.target.style.background = 'var(--orvo-surface)';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

// ─── Custom Category Dropdown ─────────────────────────────────────────────────
function CategorySelect({ categories, value, onChange }: { categories: Category[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = categories.find(c => c.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          color: selected ? 'var(--orvo-text)' : 'var(--orvo-text-faint)',
          boxShadow: open ? 'var(--shadow-glow)' : 'none',
          borderColor: open ? 'var(--orvo-primary)' : 'var(--orvo-border)',
          background: open ? 'var(--orvo-surface-2)' : 'var(--orvo-surface)',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = 'var(--orvo-border-strong)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = 'var(--orvo-border)'; }}
      >
        <span>{selected ? selected.name : '— Select a category —'}</span>
        <span style={{ fontSize: 10, color: 'var(--orvo-text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
          background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border-strong)',
          borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-deep)',
          maxHeight: 260, overflowY: 'auto',
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { onChange(cat.id); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '11px 16px', border: 'none', cursor: 'pointer',
                background: value === cat.id ? 'var(--orvo-surface-3)' : 'transparent',
                color: value === cat.id ? 'var(--orvo-primary)' : 'var(--orvo-text)',
                fontSize: 14, fontWeight: value === cat.id ? 700 : 400,
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (value !== cat.id) (e.target as HTMLButtonElement).style.background = 'var(--orvo-surface-2)'; }}
              onMouseLeave={e => { if (value !== cat.id) (e.target as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {value === cat.id ? '✓ ' : ''}{cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const STEPS = ['Basic Info', 'Pricing & Stock', 'Photos', 'Review'];

function NewProductContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    categoryId: '',
    tags: '',
    isStudentListing: false,
    condition: 'GOOD',
    listingType: 'SELL',
    location: ''
  });
  const [pricing, setPricing] = useState({ price: '', stock: '' });
  const [images, setImages] = useState<ImgFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-set student listing based on query param or if user is a buyer
  useEffect(() => {
    const isStudent = searchParams.get('student') === 'true';
    if (isStudent || user?.role === 'BUYER') {
      setForm(f => ({ ...f, isStudentListing: true }));
    }
  }, [searchParams, user]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'SELLER' && user.role !== 'BUYER') { router.push('/'); return; }
    categoriesApi.getAll().then(setCategories);
  }, [user, authLoading]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
  };
  const setP = (k: keyof typeof pricing) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPricing(p => ({ ...p, [k]: e.target.value }));
  };

  const autoSlug = () => {
    if (form.slug.trim()) return;
    const s = form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm(f => ({ ...f, slug: s }));
  };

  const addImage = useCallback((dataUrl: string, name: string) => setImages(imgs => [...imgs, { dataUrl, name }]), []);
  const removeImage = useCallback((i: number) => setImages(imgs => imgs.filter((_, idx) => idx !== i)), []);
  const setPrimary = useCallback((i: number) => setImages(imgs => { const c = [...imgs]; const [item] = c.splice(i, 1); return [item, ...c]; }), []);

  // Step validation
  const canStep1 = form.title.trim() && form.slug.trim() && form.description.trim() && form.categoryId && (!form.isStudentListing || form.location.trim());
  const canStep2 = parseFloat(pricing.price) >= 0 && parseInt(pricing.stock) >= 0;
  const canStep3 = images.length > 0;

  const handleSubmit = async () => {
    setError(''); setSubmitting(true);
    try {
      await productsApi.create({
        categoryId: form.categoryId,
        title: form.title,
        slug: form.slug,
        description: form.description,
        price: parseFloat(pricing.price) || 0,
        stock: parseInt(pricing.stock) || 0,
        tags: form.tags || undefined,
        images: images.map(i => i.dataUrl),
        isStudentListing: form.isStudentListing,
        condition: form.isStudentListing ? form.condition : undefined,
        listingType: form.isStudentListing ? form.listingType : undefined,
        location: form.isStudentListing ? form.location : undefined,
      });
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Failed to submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  const selectedCat = categories.find(c => c.id === form.categoryId);

  if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--orvo-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 36, height: 36, border: '3px solid var(--orvo-border)', borderTop: '3px solid var(--orvo-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>;

  // ─── Sidebar ──────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside style={{ width: 240, flexShrink: 0, background: '#1E4632', display: 'flex', flexDirection: 'column', padding: '36px 0', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
      <div style={{ padding: '0 22px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#BBC863', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>ORVO</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Seller HQ</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Your shop management centre</div>
      </div>
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {[
          { label: 'Overview', icon: '📊', href: '/seller/dashboard' },
          { label: 'My Products', icon: '📦', href: '/seller/dashboard?sec=products' },
          { label: 'Orders', icon: '🛒', href: '/seller/dashboard?sec=orders' },
        ].map(item => (
          <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 4, textDecoration: 'none', color: 'rgba(255,255,255,0.55)', fontWeight: 500, fontSize: 14 }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        {/* Active: Add Product */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 4, background: 'rgba(187,200,99,0.15)', color: '#BBC863', fontWeight: 700, fontSize: 14 }}>
          <span style={{ fontSize: 16 }}>➕</span>
          <span>Add Product</span>
        </div>
      </nav>
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link href="/seller/dashboard" style={{ display: 'block', padding: '9px 14px', borderRadius: 10, textDecoration: 'none', textAlign: 'center', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: 13 }}>
          ← Back to Dashboard
        </Link>
      </div>
    </aside>
  );

  // ─── Success screen ───────────────────────────────────────────────────────
  if (done) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--orvo-bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', background: 'linear-gradient(135deg, var(--orvo-primary-light), var(--orvo-primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#fff', boxShadow: 'var(--shadow-glow)' }}>✓</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 900, color: 'var(--orvo-text)', marginBottom: 12 }}>Product Submitted!</h1>
          <p style={{ color: 'var(--orvo-text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            {form.isStudentListing ? (
              <span>Your campus listing is <strong style={{ color: 'var(--orvo-primary)' }}>instantly approved and active</strong> on the Campus Marketplace!</span>
            ) : (
              <span>Your listing is <strong style={{ color: 'var(--orvo-primary)' }}>pending admin review</strong>. Once approved it goes live on the marketplace.</span>
            )}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => { setDone(false); setStep(0); setForm({ title: '', slug: '', description: '', categoryId: '', tags: '', isStudentListing: false, condition: 'GOOD', listingType: 'SELL', location: '' }); setPricing({ price: '', stock: '' }); setImages([]); }} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'var(--orvo-primary)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>+ Add Another</button>
            <Link href="/seller/dashboard" style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--orvo-border)', background: 'var(--orvo-surface)', color: 'var(--orvo-text)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>Go to Dashboard</Link>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--orvo-bg)' }}>
      <Sidebar />

      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Seller HQ · New Listing</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 30, color: 'var(--orvo-text)', margin: '0 0 4px' }}>List a New Product</h1>
          <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14 }}>Fill in each step — your product goes live after admin approval.</p>
        </div>

        {/* Step bar */}
        <StepBar step={step} total={STEPS.length} labels={STEPS} />

        {/* Card */}
        <div style={{ 
          background: 'var(--orvo-surface-3)', 
          border: '1px solid var(--orvo-border)', 
          borderRadius: 24, 
          padding: '48px 44px', 
          maxWidth: 720,
          boxShadow: 'var(--shadow-card)',
        }}>

          {/* ── STEP 0: Basic Info ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--orvo-text)', margin: 0 }}>Basic Information</h2>

              <Field label="Product Title" required>
                <CustomInput placeholder="e.g. Handwoven Silk Saree – Assam Blue" value={form.title} onChange={set('title')} onBlur={autoSlug} />
              </Field>

              <Field label="URL Slug" required hint="Auto-generated from title. Must be unique.">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--orvo-text-faint)', fontWeight: 700, pointerEvents: 'none' }}>products/</span>
                  <CustomInput style={{ paddingLeft: 84 }} placeholder="handwoven-silk-saree" value={form.slug} onChange={set('slug')} />
                </div>
              </Field>

              <Field label="Description" required>
                <CustomTextArea placeholder="Describe your product — materials, dimensions, use case, what makes it special..." value={form.description} onChange={set('description')} rows={5} />
              </Field>

              <Field label="Category" required>
                <CategorySelect
                  categories={categories}
                  value={form.categoryId}
                  onChange={(id) => setForm(f => ({ ...f, categoryId: id }))}
                />
              </Field>

              <Field label="Tags" hint="Comma-separated. Helps buyers find your listing.">
                <CustomInput placeholder="silk, handmade, assam, traditional..." value={form.tags} onChange={set('tags')} />
              </Field>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--orvo-surface-2)', padding: 16, borderRadius: 12, border: '1px solid var(--orvo-border)', margin: '10px 0' }}>
                <input
                  type="checkbox"
                  id="isStudentListing"
                  disabled={user?.role === 'BUYER'}
                  checked={user?.role === 'BUYER' ? true : form.isStudentListing}
                  onChange={e => setForm(f => ({ ...f, isStudentListing: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: user?.role === 'BUYER' ? 'not-allowed' : 'pointer', accentColor: 'var(--orvo-primary)' }}
                />
                <label htmlFor="isStudentListing" style={{ fontWeight: 700, fontSize: 14, color: 'var(--orvo-text)', cursor: user?.role === 'BUYER' ? 'not-allowed' : 'pointer' }}>
                  🏫 List as a Used Student/Campus Product {user?.role === 'BUYER' ? '(Required for Student accounts)' : ''}
                </label>
              </div>

              {form.isStudentListing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--orvo-surface-2)', padding: 20, borderRadius: 16, border: '1px solid var(--orvo-border-strong)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--orvo-primary)', margin: '0 0 4px' }}>Campus Listing Details</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Condition" required>
                      <select
                        value={form.condition}
                        onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                        style={{ ...inputStyle }}
                      >
                        <option value="NEW" style={{ background: 'var(--orvo-surface)', color: 'var(--orvo-text)' }}>✨ New</option>
                        <option value="LIKE_NEW" style={{ background: 'var(--orvo-surface)', color: 'var(--orvo-text)' }}>🌟 Like New</option>
                        <option value="GOOD" style={{ background: 'var(--orvo-surface)', color: 'var(--orvo-text)' }}>👍 Good</option>
                        <option value="FAIR" style={{ background: 'var(--orvo-surface)', color: 'var(--orvo-text)' }}>👌 Fair</option>
                      </select>
                    </Field>

                    <Field label="Offer Type" required>
                      <select
                        value={form.listingType}
                        onChange={e => setForm(f => ({ ...f, listingType: e.target.value }))}
                        style={{ ...inputStyle }}
                      >
                        <option value="SELL" style={{ background: 'var(--orvo-surface)', color: 'var(--orvo-text)' }}>💰 Buy / Sell</option>
                        <option value="RENT" style={{ background: 'var(--orvo-surface)', color: 'var(--orvo-text)' }}>⏳ Rent</option>
                        <option value="FREE" style={{ background: 'var(--orvo-surface)', color: 'var(--orvo-text)' }}>🎁 Free / Donate</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Campus Location" required hint="e.g. Hostel Block B, Room 204 or Sector 15 PG">
                    <CustomInput placeholder="Where can the buyer meet you on campus?" value={form.location} onChange={set('location')} />
                  </Field>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button disabled={!canStep1} onClick={() => setStep(1)} style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: canStep1 ? 'var(--orvo-primary)' : 'var(--orvo-border-strong)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: canStep1 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }} onMouseEnter={e => { if (canStep1) e.currentTarget.style.background = 'var(--orvo-primary-light)'; }} onMouseLeave={e => { if (canStep1) e.currentTarget.style.background = 'var(--orvo-primary)'; }}>
                  Next: Pricing & Stock →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: Pricing & Stock ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--orvo-text)', margin: 0 }}>Pricing & Stock</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Field label="Selling Price (₹)" required>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--orvo-text-faint)', fontWeight: 700, pointerEvents: 'none' }}>₹</span>
                    <CustomInput style={{ paddingLeft: 38 }} type="number" min="0" step="0.01" placeholder="0.00" value={pricing.price} onChange={setP('price')} />
                  </div>
                </Field>
                <Field label="Available Stock" required>
                  <CustomInput type="number" min="0" step="1" placeholder="0" value={pricing.stock} onChange={setP('stock')} />
                </Field>
              </div>

              {/* Live preview */}
              {parseFloat(pricing.price) > 0 && (
                <div style={{ background: 'var(--orvo-surface-2)', border: '1px solid var(--orvo-border)', borderRadius: 14, padding: '18px 22px', display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--orvo-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Selling Price</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--orvo-primary)' }}>₹{parseFloat(pricing.price).toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--orvo-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Stock</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--orvo-text)' }}>{pricing.stock || 0} units</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button onClick={() => setStep(0)} style={{ padding: '13px 24px', borderRadius: 12, border: '1px solid var(--orvo-border)', background: 'var(--orvo-surface-2)', color: 'var(--orvo-text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orvo-border-strong)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--orvo-border)'}>← Back</button>
                <button disabled={!canStep2} onClick={() => setStep(2)} style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: canStep2 ? 'var(--orvo-primary)' : 'var(--orvo-border-strong)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: canStep2 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }} onMouseEnter={e => { if (canStep2) e.currentTarget.style.background = 'var(--orvo-primary-light)'; }} onMouseLeave={e => { if (canStep2) e.currentTarget.style.background = 'var(--orvo-primary)'; }}>
                  Next: Photos →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Photos ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--orvo-text)', margin: '0 0 6px' }}>Product Photos</h2>
                <p style={{ color: 'var(--orvo-text-muted)', fontSize: 13, margin: 0 }}>Upload at least one photo. The first image becomes your main listing photo.</p>
              </div>

              <ImageDropZone images={images} onAdd={addImage} onRemove={removeImage} onSetPrimary={setPrimary} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button onClick={() => setStep(1)} style={{ padding: '13px 24px', borderRadius: 12, border: '1px solid var(--orvo-border)', background: 'var(--orvo-surface-2)', color: 'var(--orvo-text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orvo-border-strong)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--orvo-border)'}>← Back</button>
                <button disabled={!canStep3} onClick={() => setStep(3)} style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: canStep3 ? 'var(--orvo-primary)' : 'var(--orvo-border-strong)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: canStep3 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }} onMouseEnter={e => { if (canStep3) e.currentTarget.style.background = 'var(--orvo-primary-light)'; }} onMouseLeave={e => { if (canStep3) e.currentTarget.style.background = 'var(--orvo-primary)'; }}>
                  Review & Submit →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--orvo-text)', margin: 0 }}>Review Your Listing</h2>

              {/* Product card preview */}
              <div style={{ background: 'var(--orvo-surface-2)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--orvo-border)' }}>
                {/* Main image */}
                {images[0] && (
                  <div style={{ height: 220, overflow: 'hidden' }}>
                    <img src={images[0].dataUrl} alt="main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--orvo-text)', marginBottom: 4 }}>{form.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginBottom: 12 }}>{selectedCat?.name} {form.tags && `· ${form.tags}`}</div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--orvo-text-muted)', marginBottom: 14 }}>
                    <span>₹<strong style={{ color: 'var(--orvo-primary)', fontSize: 20, fontWeight: 900 }}>{parseFloat(pricing.price).toLocaleString('en-IN')}</strong></span>
                    <span>{pricing.stock} units in stock</span>
                    <span>{images.length} photo{images.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', lineHeight: 1.6 }}>{form.description.slice(0, 160)}{form.description.length > 160 ? '…' : ''}</div>
                </div>
              </div>

              {/* Additional photos strip */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {images.slice(1, 5).map((img, i) => (
                    <div key={i} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--orvo-border)' }}>
                      <img src={img.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  {images.length > 5 && <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--orvo-surface-2)', border: '1px solid var(--orvo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--orvo-text-faint)', fontWeight: 700 }}>+{images.length - 5}</div>}
                </div>
              )}

              {/* Status notice */}
              {form.isStudentListing ? (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(49, 105, 78, 0.08)', border: '1px solid rgba(49, 105, 78, 0.2)', fontSize: 13, color: 'var(--orvo-success)', fontWeight: 600 }}>
                  ⚡ This campus listing will be <strong>instantly approved and live</strong> for fellow students!
                </div>
              ) : (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: '#b45309', fontWeight: 600 }}>
                  ⏳ This listing will be <strong>pending admin review</strong> before going live on the marketplace.
                </div>
              )}
              {error && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--orvo-danger)', fontSize: 13, fontWeight: 600 }}>⚠ {error}</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button onClick={() => setStep(2)} style={{ padding: '13px 24px', borderRadius: 12, border: '1px solid var(--orvo-border)', background: 'var(--orvo-surface-2)', color: 'var(--orvo-text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orvo-border-strong)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--orvo-border)'}>← Back</button>
                <button onClick={handleSubmit} disabled={submitting} style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: submitting ? 'var(--orvo-border-strong)' : 'var(--orvo-primary)', color: '#fff', fontWeight: 900, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }} onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = 'var(--orvo-primary-light)'; }} onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = 'var(--orvo-primary)'; }}>
                  {submitting ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Submitting…</> : '🚀 Submit Listing'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--orvo-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--orvo-border)', borderTop: '3px solid var(--orvo-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--orvo-text-muted)' }}>Loading listing portal…</p>
        </div>
      </div>
    }>
      <NewProductContent />
    </Suspense>
  );
}
