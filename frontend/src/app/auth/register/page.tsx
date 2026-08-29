'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { GoogleLogin } from '@react-oauth/google';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Step = 'form' | 'otp' | 'done';

export default function RegisterPage() {
  const { register, loginGoogle } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // OTP state
  const [step, setStep] = useState<Step>('form');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP.');
      setStep('otp');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    }
    setLoading(false);
  };

  // Handle OTP box inputs
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP + Register
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setError('');
    setOtpLoading(true);
    try {
      await register(email, name, password, otpCode);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    }
    setOtpLoading(false);
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP.');
      setResendCooldown(60);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  // Google
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginGoogle(credentialResponse.credential);
    } catch {
      setError('Google sign-up failed. Please try again.');
    }
    setGoogleLoading(false);
  };

  const cardStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,212,170,0.12) 0%, transparent 60%)',
    padding: '24px',
  };

  return (
    <div style={cardStyle}>
      <div className="glass" style={{ width: '100%', maxWidth: 420, padding: 40 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--orvo-primary), var(--orvo-accent))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 12,
          }}>O</div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            {step === 'otp' ? 'Verify Your Email' : 'Join ORVO'}
          </h1>
          <p style={{ color: 'var(--orvo-text-muted)', fontSize: 14 }}>
            {step === 'otp'
              ? `We sent a 6-digit code to ${email}`
              : 'Create your account to start shopping'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', marginBottom: 20,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, fontSize: 13, color: 'var(--orvo-danger)',
          }}>{error}</div>
        )}

        {/* ── STEP 1: Registration Form ── */}
        {step === 'form' && (
          <>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--orvo-border)' }} />
              <span style={{ fontSize: 12, color: 'var(--orvo-text-muted)', fontWeight: 500 }}>OR REGISTER WITH EMAIL</span>
              <div style={{ flex: 1, height: 1, background: 'var(--orvo-border)' }} />
            </div>

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                {loading ? 'Sending Code...' : 'Continue →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--orvo-text-muted)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: 'var(--orvo-primary-light)', fontWeight: 600, textDecoration: 'none' }}>
                Sign in →
              </Link>
            </p>
          </>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyAndRegister}>
            {/* 6 OTP boxes */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  style={{
                    width: 48, height: 56,
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: 700,
                    border: `2px solid ${digit ? 'var(--orvo-primary)' : 'var(--orvo-border)'}`,
                    borderRadius: 12,
                    background: 'var(--orvo-surface)',
                    color: 'var(--orvo-text)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    caretColor: 'var(--orvo-primary)',
                  }}
                />
              ))}
            </div>

            <button type="submit" disabled={otpLoading} className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }}>
              {otpLoading ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  fontSize: 13,
                  color: resendCooldown > 0 ? 'var(--orvo-text-muted)' : 'var(--orvo-primary-light)',
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => { setStep('form'); setOtp(['', '', '', '', '', '']); setError(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: 'var(--orvo-text-muted)', padding: 0,
                }}
              >
                ← Change email or details
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
