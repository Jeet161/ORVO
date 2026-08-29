'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params from URL
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = searchParams.get('token') || '';
    const e = searchParams.get('email') || '';
    setToken(t);
    setEmail(e);

    if (!t || !e) {
      setError('Invalid reset link. Please request a new link.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, email, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#07130B',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(187,200,99,0.2) 0%, transparent 65%)',
      padding: '24px',
    }}>
      <div style={{ 
        width: '100%', maxWidth: 500, padding: '64px 56px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(32px)',
        borderRadius: 24,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: 'linear-gradient(135deg, #BBC863, #658C58)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 24, color: '#1E4632', marginBottom: 16,
            boxShadow: '0 8px 24px rgba(187,200,99,0.25)',
          }}>O</div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#fff', letterSpacing: '-0.5px' }}>New password</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>Enter your new secure password</p>
        </div>

        {error && (
          <div style={{
            padding: '12px 14px', marginBottom: 20,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, fontSize: 13, color: 'var(--orvo-danger)',
          }}>{error}</div>
        )}

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              padding: '14px 18px', marginBottom: 24,
              background: 'rgba(187,200,99,0.08)', border: '1px solid rgba(187,200,99,0.25)',
              borderRadius: 12, fontSize: 14, color: '#BBC863', lineHeight: 1.6
            }}>Your password has been reset successfully!</div>
            <Link href="/auth/login" style={{
              display: 'inline-block', padding: '12px 24px', borderRadius: 10,
              background: '#BBC863', color: '#1E4632', fontWeight: 800, fontSize: 14,
              textDecoration: 'none'
            }}>
              Proceed to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8, letterSpacing: 1 }}>NEW PASSWORD</label>
              <input
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none', transition: 'border-color 0.2s, background 0.2s' }}
                onFocus={e => { e.target.style.borderColor = '#BBC863'; e.target.style.background = 'rgba(255,255,255,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!token || !email}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8, letterSpacing: 1 }}>CONFIRM PASSWORD</label>
              <input
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none', transition: 'border-color 0.2s, background 0.2s' }}
                onFocus={e => { e.target.style.borderColor = '#BBC863'; e.target.style.background = 'rgba(255,255,255,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={!token || !email}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token || !email}
              style={{
                width: '100%', marginTop: 12, padding: '14px', borderRadius: 12, background: '#BBC863',
                color: '#1E4632', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#d2df78'}
              onMouseLeave={e => e.currentTarget.style.background = '#BBC863'}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              Or return to{' '}
              <Link href="/auth/login" style={{ color: '#BBC863', fontWeight: 700, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07130B', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #BBC863', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading portal…</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
