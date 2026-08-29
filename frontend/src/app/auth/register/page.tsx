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
    background: '#07130B', // Slightly deeper background for more contrast
    backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(187,200,99,0.2) 0%, transparent 65%)', // Brighter glow
    padding: '24px',
  };

  return (
    <div style={cardStyle}>
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
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#fff', letterSpacing: '-0.5px' }}>
            {step === 'otp' ? 'Verify Your Email' : 'Join ORVO'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 1 }}>OR REGISTER WITH EMAIL</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8, letterSpacing: 1 }}>FULL NAME</label>
                <input style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none', transition: 'border-color 0.2s, background 0.2s' }} onFocus={e => { e.target.style.borderColor = '#BBC863'; e.target.style.background = 'rgba(255,255,255,0.12)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.08)' }} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8, letterSpacing: 1 }}>EMAIL</label>
                <input style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none', transition: 'border-color 0.2s, background 0.2s' }} onFocus={e => { e.target.style.borderColor = '#BBC863'; e.target.style.background = 'rgba(255,255,255,0.12)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.08)' }} type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8, letterSpacing: 1 }}>PASSWORD</label>
                <input style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none', transition: 'border-color 0.2s, background 0.2s' }} onFocus={e => { e.target.style.borderColor = '#BBC863'; e.target.style.background = 'rgba(255,255,255,0.12)' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.08)' }} type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 12, padding: '14px', borderRadius: 12, background: '#BBC863', color: '#1E4632', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#d2df78'} onMouseLeave={e => e.currentTarget.style.background = '#BBC863'}>
                {loading ? 'Sending Code...' : 'Continue →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: '#BBC863', fontWeight: 700, textDecoration: 'none' }}>
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
                    border: `2px solid ${digit ? '#BBC863' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.2s, background 0.2s',
                    caretColor: '#BBC863',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#BBC863'; e.target.style.background = 'rgba(255,255,255,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = digit ? '#BBC863' : 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                />
              ))}
            </div>

            <button type="submit" disabled={otpLoading} style={{ width: '100%', marginBottom: 16, padding: '14px', borderRadius: 12, background: '#BBC863', color: '#1E4632', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#d2df78'} onMouseLeave={e => e.currentTarget.style.background = '#BBC863'}>
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
                  color: resendCooldown > 0 ? 'rgba(255,255,255,0.4)' : '#BBC863',
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
                  fontSize: 13, color: 'rgba(255,255,255,0.5)', padding: 0,
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
