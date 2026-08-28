'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const { register, loginGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(email, name, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginGoogle(credentialResponse.credential);
    } catch (err: any) {
      setError('Google sign-up failed. Please try again.');
    }
    setGoogleLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,212,170,0.12) 0%, transparent 60%)',
      padding: '24px',
    }}>
      <div className="glass" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--orvo-primary), var(--orvo-accent))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 12,
          }}>O</div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Join ORVO</h1>
          <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14 }}>Create your account to start shopping</p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', marginBottom: 20,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, fontSize: 13, color: 'var(--orvo-danger)',
          }}>{error}</div>
        )}

        {/* Google Sign-Up Button */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {googleLoading ? (
              <div style={{ padding: '10px 0', fontSize: 13, color: 'var(--orvo-text-muted)' }}>
                Signing up with Google...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-up failed. Please try again.')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="signup_with"
                width="340"
              />
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--orvo-border)' }} />
          <span style={{ fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 500 }}>OR REGISTER WITH EMAIL</span>
          <div style={{ flex: 1, height: 1, background: 'var(--orvo-border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>FULL NAME</label>
            <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>EMAIL</label>
            <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--orvo-text-muted)', display: 'block', marginBottom: 6 }}>PASSWORD</label>
            <input className="input" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--orvo-text-muted)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--orvo-primary-light)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
