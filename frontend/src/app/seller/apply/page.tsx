'use client';

import { useState, useRef, useCallback } from 'react';
import { sellersApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

// ─── PDF Drop Zone Component ─────────────────────────────────────────────────
interface PdfDropZoneProps {
  label: string;
  subLabel: string;
  icon: string;
  value: string;       // base64 data URL
  onChange: (dataUrl: string, fileName: string, sizeKb: number) => void;
  fileName: string;
  sizeKb: number;
  required?: boolean;
}

function PdfDropZone({ label, subLabel, icon, value, onChange, fileName, sizeKb, required }: PdfDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const processFile = useCallback(async (file: File) => {
    setError('');
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_MB}MB allowed.`);
      return;
    }

    // Read as base64 — compressed enough for DB storage (PDF is already binary-compressed)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const sizeInKb = Math.round(file.size / 1024);
      onChange(dataUrl, file.name, sizeInKb);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const hasFile = !!value;

  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>
        {label} {required && <span style={{ color: 'var(--orvo-danger)' }}>*</span>}
      </label>
      <p style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginBottom: 10 }}>{subLabel}</p>

      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${hasFile ? 'var(--orvo-primary)' : dragging ? '#BBC863' : 'var(--orvo-border-strong)'}`,
          borderRadius: 16,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: hasFile
            ? 'rgba(49,105,78,0.05)'
            : dragging
            ? 'rgba(187,200,99,0.06)'
            : 'var(--orvo-surface-2)',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={onFileChange}
          required={required && !hasFile}
        />

        {hasFile ? (
          /* ── Uploaded state ── */
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* PDF thumbnail */}
            <div style={{
              width: 52, height: 64, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--orvo-primary) 0%, var(--orvo-primary-light) 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(49,105,78,0.25)',
            }}>
              <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span style={{ fontSize: 9, color: '#fff', fontWeight: 800, letterSpacing: 0.5, marginTop: 4 }}>PDF</span>
            </div>

            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--orvo-text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                {fileName}
              </p>
              <p style={{ fontSize: 12, color: 'var(--orvo-text-muted)' }}>
                {sizeKb < 1024 ? `${sizeKb} KB` : `${(sizeKb / 1024).toFixed(1)} MB`}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orvo-primary)' }} />
                <span style={{ fontSize: 11, color: 'var(--orvo-primary)', fontWeight: 700 }}>Ready to submit</span>
              </div>
            </div>

            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange('', '', 0); }}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: 16, fontWeight: 700,
              }}
            >
              ×
            </button>
          </div>
        ) : (
          /* ── Empty state ── */
          <div>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--orvo-text)', marginBottom: 4 }}>
              {dragging ? 'Drop your PDF here' : 'Drag & drop PDF here'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--orvo-text-muted)', marginBottom: 14 }}>
              or <span style={{ color: 'var(--orvo-primary)', fontWeight: 700, textDecoration: 'underline' }}>browse files</span>
            </p>
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '5px 14px', borderRadius: 99, background: 'rgba(49,105,78,0.06)', border: '1px solid var(--orvo-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--orvo-text-muted)' }}>PDF only · Max 5MB</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 12, color: 'var(--orvo-danger)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SellerApplyPage() {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ shopName: '', shopSlug: '', region: '', bio: '' });
  const [licenseFile, setLicenseFile] = useState({ dataUrl: '', name: '', sizeKb: 0 });
  const [idFile, setIdFile] = useState({ dataUrl: '', name: '', sizeKb: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Auth guard check ──
  if (authLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--orvo-bg)' }}>
        <p style={{ color: 'var(--orvo-text-muted)' }}>Loading application portal…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--orvo-bg)', padding: '0 24px' }}>
        <div style={{ maxWidth: 440, padding: 32, borderRadius: 20, background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 10 }}>Account Required</h2>
          <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            You must log in to your account first before applying to become a verified seller on our marketplace.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/auth/login" style={{ flex: 1, padding: '12px 20px', borderRadius: 10, background: 'var(--orvo-primary)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              Log In
            </Link>
            <Link href="/auth/register" style={{ flex: 1, padding: '12px 20px', borderRadius: 10, border: '1px solid var(--orvo-border)', color: 'var(--orvo-text)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const autoSlug = () =>
    setForm(f => ({ ...f, shopSlug: f.shopName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseFile.dataUrl && !idFile.dataUrl) {
      setError('Please upload at least one verification document (Business License or ID Proof).');
      return;
    }

    setLoading(true); setError('');
    try {
      await sellersApi.apply({
        ...form,
        businessLicenseUrl: licenseFile.dataUrl || 'https://example.com/no-license.pdf',
        idProofUrl: idFile.dataUrl || 'https://example.com/no-idproof.pdf',
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──
  if (success) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
          background: 'linear-gradient(135deg, var(--orvo-primary), var(--orvo-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
        }}>✓</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Application Submitted!</h1>
        <p style={{ color: 'var(--orvo-text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
          Your seller application with all verification documents has been received. Our admin team will review and respond within <strong>24 hours</strong>.
        </p>
        <div style={{ padding: '14px 20px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: 1 }}>⏳ Status: Pending Admin Review</span>
        </div>
        <Link href="/" style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--orvo-primary)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
          Back to Home
        </Link>
      </div>
    </div>
  );

  const STEPS = ['Shop Info', 'Documents', 'Review'];
  const canGoStep2 = form.shopName && form.shopSlug && form.region;
  const canSubmit = !!(canGoStep2 && (licenseFile.dataUrl || idFile.dataUrl));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--orvo-bg)', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏪</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 900, marginBottom: 8 }}>Apply to Sell on ORVO</h1>
          <p style={{ color: 'var(--orvo-text-muted)', fontSize: 15 }}>Get verified and start listing your products in under 24 hours.</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13,
                  background: step > i + 1 ? 'var(--orvo-primary)' : step === i + 1 ? 'var(--orvo-primary)' : 'var(--orvo-surface)',
                  color: step >= i + 1 ? '#fff' : 'var(--orvo-text-muted)',
                  border: step < i + 1 ? '2px solid var(--orvo-border)' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? 'var(--orvo-text)' : 'var(--orvo-text-muted)' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 40, height: 2, background: step > i + 1 ? 'var(--orvo-primary)' : 'var(--orvo-border)', margin: '0 12px', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--orvo-danger)', marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ══ STEP 1: Shop Info ══ */}
          {step === 1 && (
            <div style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 24 }}>🏪 Shop Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>Shop Name <span style={{ color: 'var(--orvo-danger)' }}>*</span></label>
                  <input className="input" placeholder="e.g. Assam Silk House" value={form.shopName}
                    onChange={update('shopName')} onBlur={autoSlug} required style={{ fontSize: 15 }} />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>Shop URL <span style={{ color: 'var(--orvo-danger)' }}>*</span></label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      position: 'absolute', left: 12, fontSize: 13, color: 'var(--orvo-text-muted)',
                      background: 'var(--orvo-surface-2)', padding: '2px 6px', borderRadius: 4,
                      fontFamily: 'monospace', pointerEvents: 'none',
                    }}>
                      orvo.com/
                    </span>
                    <input className="input" style={{ paddingLeft: 100, fontFamily: 'monospace' }}
                      placeholder="assam-silk-house" value={form.shopSlug}
                      onChange={update('shopSlug')} required />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>Region / State <span style={{ color: 'var(--orvo-danger)' }}>*</span></label>
                  <input className="input" placeholder="e.g. Assam, Punjab, Delhi" value={form.region}
                    onChange={update('region')} required />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>Shop Bio <span style={{ color: 'var(--orvo-text-faint)' }}>(optional)</span></label>
                  <textarea className="input" rows={3}
                    placeholder="Tell buyers about your story, heritage, and craft..."
                    value={form.bio} onChange={update('bio')}
                    style={{ resize: 'vertical', lineHeight: 1.6 }} />
                </div>

                <button
                  type="button"
                  disabled={!canGoStep2}
                  onClick={() => setStep(2)}
                  style={{
                    padding: '13px 28px', borderRadius: 12, border: 'none', cursor: canGoStep2 ? 'pointer' : 'not-allowed',
                    background: canGoStep2 ? 'var(--orvo-primary)' : 'var(--orvo-border)',
                    color: canGoStep2 ? '#fff' : 'var(--orvo-text-muted)',
                    fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
                  }}
                >
                  Continue to Documents →
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 2: Documents ══ */}
          {step === 2 && (
            <div style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>📄 Verification Documents</h2>
              <p style={{ fontSize: 13, color: 'var(--orvo-text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
                Upload PDF copies of your documents. Files are encrypted and stored securely. Only the admin team can view them.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <PdfDropZone
                  label="Business License / GST Certificate"
                  subLabel="Your shop's business registration, GST certificate, or trade license."
                  icon="🏛️"
                  value={licenseFile.dataUrl}
                  fileName={licenseFile.name}
                  sizeKb={licenseFile.sizeKb}
                  onChange={(dataUrl, name, sizeKb) => setLicenseFile({ dataUrl, name, sizeKb })}
                  required
                />

                <PdfDropZone
                  label="ID Proof (Aadhaar / Passport / PAN)"
                  subLabel="Government-issued ID for identity verification."
                  icon="🪪"
                  value={idFile.dataUrl}
                  fileName={idFile.name}
                  sizeKb={idFile.sizeKb}
                  onChange={(dataUrl, name, sizeKb) => setIdFile({ dataUrl, name, sizeKb })}
                  required
                />
              </div>

              {/* Privacy note */}
              <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(49,105,78,0.05)', border: '1px solid var(--orvo-border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
                <p style={{ fontSize: 12, color: 'var(--orvo-text-muted)', margin: 0, lineHeight: 1.6 }}>
                  Your documents are stored securely and only accessible by the ORVO admin team for verification. They are never shared publicly.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setStep(1)} style={{
                  padding: '12px 22px', borderRadius: 12, border: '1px solid var(--orvo-border)',
                  background: 'transparent', color: 'var(--orvo-text)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}>
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!licenseFile.dataUrl && !idFile.dataUrl}
                  onClick={() => { setError(''); setStep(3); }}
                  style={{
                    flex: 1, padding: '12px 28px', borderRadius: 12, border: 'none',
                    cursor: (licenseFile.dataUrl || idFile.dataUrl) ? 'pointer' : 'not-allowed',
                    background: (licenseFile.dataUrl || idFile.dataUrl) ? 'var(--orvo-primary)' : 'var(--orvo-border)',
                    color: (licenseFile.dataUrl || idFile.dataUrl) ? '#fff' : 'var(--orvo-text-muted)',
                    fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
                  }}
                >
                  Review Application →
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 3: Review ══ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Shop summary */}
              <div style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>🏪 Shop Info</h3>
                  <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--orvo-primary)', fontWeight: 700, fontSize: 13 }}>Edit</button>
                </div>
                {[
                  { label: 'Shop Name', value: form.shopName },
                  { label: 'URL', value: `orvo.com/${form.shopSlug}` },
                  { label: 'Region', value: form.region },
                  ...(form.bio ? [{ label: 'Bio', value: form.bio }] : []),
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--orvo-border)', fontSize: 14 }}>
                    <span style={{ color: 'var(--orvo-text-muted)', minWidth: 100, fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: 'var(--orvo-text)', fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Documents summary */}
              <div style={{ background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>📄 Documents</h3>
                  <button type="button" onClick={() => setStep(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--orvo-primary)', fontWeight: 700, fontSize: 13 }}>Edit</button>
                </div>
                {[
                  { label: 'Business License', file: licenseFile },
                  { label: 'ID Proof', file: idFile },
                ].filter(d => !!d.file.dataUrl).map(({ label, file }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--orvo-border)' }}>
                    <div style={{
                      width: 36, height: 44, borderRadius: 6, flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--orvo-primary) 0%, var(--orvo-primary-light) 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{file.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--orvo-primary)' }}>{file.sizeKb < 1024 ? `${file.sizeKb} KB` : `${(file.sizeKb / 1024).toFixed(1)} MB`}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orvo-primary)' }} />
                      <span style={{ fontSize: 11, color: 'var(--orvo-primary)', fontWeight: 700 }}>Ready</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setStep(2)} style={{
                  padding: '13px 22px', borderRadius: 12, border: '1px solid var(--orvo-border)',
                  background: 'transparent', color: 'var(--orvo-text)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}>
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  style={{
                    flex: 1, padding: '13px 28px', borderRadius: 12, border: 'none',
                    cursor: loading ? 'wait' : 'pointer',
                    background: 'linear-gradient(135deg, var(--orvo-primary) 0%, var(--orvo-primary-light) 100%)',
                    color: '#fff', fontWeight: 700, fontSize: 16,
                    boxShadow: '0 4px 20px rgba(49,105,78,0.3)',
                    opacity: loading ? 0.8 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? '⏳ Submitting…' : '🚀 Submit Application'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
