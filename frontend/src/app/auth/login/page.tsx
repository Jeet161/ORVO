'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { GoogleLogin } from '@react-oauth/google';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const { login, loginGoogle } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  
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
      await login(email, password, redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginGoogle(credentialResponse.credential, redirect);
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
      background: '#07130B', // Slightly deeper background for more contrast
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(187,200,99,0.2) 0%, transparent 65%)', // Brighter glow
      padding: '24px',
    }}>
      <div style={{ 
        width: '100%', maxWidth: 560, padding: '64px 56px',
        background: 'rgba(255,255,255,0.06)', // Slightly lighter glass card
        border: '1px solid rgba(255,255,255,0.12)', // more visible border
        backdropFilter: 'blur(32px)', // heavier blur
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
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#fff', letterSpacing: '-0.5px' }}>Welcome back</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>Sign in to your ORVO account</p>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 1 }}>OR CONTINUE WITH EMAIL</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8, letterSpacing: 1 }}>EMAIL</label>
            <input style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none', transition: 'border-color 0.2s, background 0.2s' }} onFocus={e => { e.target.style.borderColor = '#BBC863'; e.target.style.background = 'rgba(255,255,255,0.12)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.08)' }} type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, margin: 0 }}>PASSWORD</label>
              <Link href="/auth/forgot-password" style={{ fontSize: 12, color: '#BBC863', textDecoration: 'none', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>
            <input style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none', transition: 'border-color 0.2s, background 0.2s' }} onFocus={e => { e.target.style.borderColor = '#BBC863'; e.target.style.background = 'rgba(255,255,255,0.12)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.08)' }} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>



          {/* Demo credentials */}
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>Admin Access</div>
            <div><span style={{ color: '#fff' }}>admin@orvo.com</span> / admin123</div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 12, padding: '14px', borderRadius: 12, background: '#BBC863', color: '#1E4632', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#d2df78'} onMouseLeave={e => e.currentTarget.style.background = '#BBC863'}>
            {loading ? 'Signing in...' : 'Sign In with Email'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          No account?{' '}
          <Link href="/auth/register" style={{ color: '#BBC863', fontWeight: 700, textDecoration: 'none' }}>
            Create one →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07130B', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #BBC863', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading login portal…</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
