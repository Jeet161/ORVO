'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const { login, loginGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginGoogle(credentialResponse.credential);
    } catch (err: any) {
      setError('Google sign-in failed. Please try again.');
    }
    setGoogleLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(88,101,242,0.15) 0%, transparent 60%)',
      padding: '24px',
    }}>
      <div className="glass" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--orvo-primary), var(--orvo-accent))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff',
            marginBottom: 12,
          }}>O</div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14 }}>Sign in to your ORVO account</p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', marginBottom: 20,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, fontSize: 13, color: 'var(--orvo-danger)',
          }}>{error}</div>
        )}

        {/* Google Sign-In Button */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {googleLoading ? (
              <div style={{ padding: '10px 0', fontSize: 13, color: 'var(--orvo-text-muted)' }}>
                Signing in with Google...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="signin_with"
                width="340"
              />
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--orvo-border)' }} />
          <span style={{ fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 500 }}>OR CONTINUE WITH EMAIL</span>
          <div style={{ flex: 1, height: 1, background: 'var(--orvo-border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>EMAIL</label>
            <input className="input" type="email" placeholder="you@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>PASSWORD</label>
            <input className="input" type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {/* Demo credentials */}
          <div style={{ padding: '10px 12px', background: 'var(--orvo-surface-2)', borderRadius: 8, border: '1px solid var(--orvo-border)', fontSize: 12, color: 'var(--orvo-text-muted)' }}>
            <div style={{ fontWeight: 600, color: 'var(--orvo-text)', marginBottom: 4 }}>Demo Credentials</div>
            <div>Admin: admin@orvo.com / admin123</div>
            <div>Seller: seller@orvo.com / seller123</div>
            <div>Buyer: buyer@orvo.com / buyer123</div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
            {loading ? 'Signing in...' : 'Sign In with Email'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--orvo-text-muted)' }}>
          No account?{' '}
          <Link href="/auth/register" style={{ color: 'var(--orvo-primary-light)', fontWeight: 600, textDecoration: 'none' }}>
            Create one →
          </Link>
        </p>
      </div>
    </div>
  );
}
