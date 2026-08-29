'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message || 'If an account with that email exists, a reset link has been sent.');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
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
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#fff', letterSpacing: '-0.5px' }}>Reset password</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>Enter your email to request a reset link</p>
        </div>

        {error && (
          <div style={{
            padding: '12px 14px', marginBottom: 20,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, fontSize: 13, color: 'var(--orvo-danger)',
          }}>{error}</div>
        )}

        {message ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              padding: '14px 18px', marginBottom: 24,
              background: 'rgba(187,200,99,0.08)', border: '1px solid rgba(187,200,99,0.25)',
              borderRadius: 12, fontSize: 14, color: '#BBC863', lineHeight: 1.6
            }}>{message}</div>
            <Link href="/auth/login" style={{
              display: 'inline-block', padding: '12px 24px', borderRadius: 10,
              background: '#BBC863', color: '#1E4632', fontWeight: 800, fontSize: 14,
              textDecoration: 'none'
            }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8, letterSpacing: 1 }}>EMAIL ADDRESS</label>
              <input
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none', transition: 'border-color 0.2s, background 0.2s' }}
                onFocus={e => { e.target.style.borderColor = '#BBC863'; e.target.style.background = 'rgba(255,255,255,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, background: '#BBC863',
                color: '#1E4632', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#d2df78'}
              onMouseLeave={e => e.currentTarget.style.background = '#BBC863'}
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              Remember your password?{' '}
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
