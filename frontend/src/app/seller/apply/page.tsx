'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sellersApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export default function SellerApplyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    shopName: '', shopSlug: '', region: '', bio: '',
    businessLicenseUrl: '', idProofUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const autoSlug = () => {
    setForm((f) => ({ ...f, shopSlug: f.shopName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await sellersApi.apply(form);
      setSuccess(true);
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  if (success) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass" style={{ maxWidth: 480, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Application Submitted!</h2>
        <p style={{ color: 'var(--orvo-text-muted)', marginBottom: 24 }}>
          Your seller application is under review. Our team will verify your documents and notify you via email and notifications.
        </p>
        <span className="badge badge-warning" style={{ fontSize: 13, padding: '6px 16px' }}>PENDING REVIEW</span>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 680 }}>
      <div style={{ marginBottom: 36 }}>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Apply to Sell on ORVO</h1>
        <p style={{ color: 'var(--orvo-text-muted)' }}>Fill out the form below. Our team will review your application within 24 hours.</p>
      </div>

      {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: 'var(--orvo-danger)', marginBottom: 20 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Shop Info */}
        <div className="glass" style={{ padding: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>🏪 Shop Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>SHOP NAME</label>
              <input className="input" placeholder="My Artisan Store" value={form.shopName}
                onChange={update('shopName')} onBlur={autoSlug} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>SHOP URL SLUG</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--orvo-text-muted)', fontSize: 13 }}>orvo.com/shop/</span>
                <input className="input" style={{ paddingLeft: 110 }} placeholder="my-artisan-store" value={form.shopSlug}
                  onChange={update('shopSlug')} required />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>REGION</label>
              <input className="input" placeholder="e.g. Punjab, Delhi, Maharashtra" value={form.region}
                onChange={update('region')} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>BIO (optional)</label>
              <textarea className="input" rows={3} placeholder="Tell buyers about your shop..."
                value={form.bio} onChange={update('bio')} style={{ resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="glass" style={{ padding: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>📄 Verification Documents</h2>
          <p style={{ fontSize: 13, color: 'var(--orvo-text-muted)', marginBottom: 18 }}>
            Provide direct URLs to your documents (e.g. Google Drive share links, hosted images).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>BUSINESS LICENSE URL</label>
              <input className="input" type="url" placeholder="https://..." value={form.businessLicenseUrl}
                onChange={update('businessLicenseUrl')} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>ID PROOF URL (Aadhaar / Passport)</label>
              <input className="input" type="url" placeholder="https://..." value={form.idProofUrl}
                onChange={update('idProofUrl')} required />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
