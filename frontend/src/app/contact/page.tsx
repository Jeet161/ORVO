'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      alert('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '12px',
    border: '1px solid var(--orvo-border)', background: 'var(--orvo-surface)',
    color: 'var(--orvo-text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'all 0.2s', marginTop: '6px'
  };

  return (
    <div style={{
      background: 'var(--orvo-bg)',
      minHeight: '100vh',
      color: 'var(--orvo-text)',
      padding: '80px 24px 100px',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Header */}
        <section style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 800, color: 'var(--orvo-primary)',
            textTransform: 'uppercase', letterSpacing: '2px', display: 'inline-block',
            marginBottom: '12px', background: 'var(--orvo-surface-3)',
            padding: '6px 16px', borderRadius: '20px'
          }}>CONNECT</span>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: '42px', fontWeight: 900,
            color: 'var(--orvo-primary-dark)', letterSpacing: '-0.5px', margin: 0
          }}>
            Contact Our Team
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--orvo-text-muted)', marginTop: '8px' }}>
            Have questions about vendor applications or campus listings? We are here to help.
          </p>
        </section>

        {/* Content Wrapper */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px', alignItems: 'start'
        }}>
          
          {/* Column 1: Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: 'var(--orvo-surface-3)', border: '1px solid var(--orvo-border)',
              borderRadius: '20px', padding: '30px', boxShadow: 'var(--shadow-card)'
            }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '12px' }}>✉️</span>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 800, color: 'var(--orvo-primary-dark)', margin: '0 0 4px' }}>Email Support</h3>
              <p style={{ fontSize: '13px', color: 'var(--orvo-text-muted)', margin: '0 0 12px' }}>Send us a message anytime; we respond within 24 hours.</p>
              <a href="mailto:support@orvo.com" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--orvo-primary)', textDecoration: 'none' }}>support@orvo.com</a>
            </div>

            <div style={{
              background: 'var(--orvo-surface-3)', border: '1px solid var(--orvo-border)',
              borderRadius: '20px', padding: '30px', boxShadow: 'var(--shadow-card)'
            }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '12px' }}>🏫</span>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 800, color: 'var(--orvo-primary-dark)', margin: '0 0 4px' }}>Campus Hub</h3>
              <p style={{ fontSize: '13px', color: 'var(--orvo-text-muted)', margin: '0 0 12px' }}>Located at the Campus Incubation and Entrepreneurship Center.</p>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--orvo-primary)' }}>Block A, Room 302, University Campus</span>
            </div>
          </div>

          {/* Column 2: Form */}
          <div style={{
            background: 'var(--orvo-surface-3)', border: '1px solid var(--orvo-border)',
            borderRadius: '24px', padding: '40px 32px', boxShadow: 'var(--shadow-card)',
            position: 'relative', overflow: 'hidden'
          }}>
            
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎉</span>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 900, color: 'var(--orvo-primary-dark)', marginBottom: '8px' }}>Message Sent!</h3>
                <p style={{ fontSize: '14px', color: 'var(--orvo-text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                  Thank you for reaching out. A support coordinator will review your request and get back to you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  style={{
                    background: 'var(--orvo-primary)', color: '#fff', border: 'none',
                    padding: '12px 24px', borderRadius: '10px', fontWeight: 700,
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--orvo-primary-dark)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--orvo-primary)'}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: 'var(--orvo-primary-dark)', margin: 0 }}>Send a Message</h3>
                
                <div>
                  <label htmlFor="name" style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Your Name *</label>
                  <input
                    id="name"
                    required
                    placeholder="e.g. Karan Dutta"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--orvo-primary)'; e.target.style.background = 'var(--orvo-surface-2)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--orvo-border)'; e.target.style.background = 'var(--orvo-surface)'; }}
                  />
                </div>

                <div>
                  <label htmlFor="email" style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@university.edu"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--orvo-primary)'; e.target.style.background = 'var(--orvo-surface-2)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--orvo-border)'; e.target.style.background = 'var(--orvo-surface)'; }}
                  />
                </div>

                <div>
                  <label htmlFor="subject" style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Subject</label>
                  <input
                    id="subject"
                    placeholder="What is this regarding?"
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--orvo-primary)'; e.target.style.background = 'var(--orvo-surface-2)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--orvo-border)'; e.target.style.background = 'var(--orvo-surface)'; }}
                  />
                </div>

                <div>
                  <label htmlFor="message" style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Your Message *</label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    placeholder="Type your message here..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--orvo-primary)'; e.target.style.background = 'var(--orvo-surface-2)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--orvo-border)'; e.target.style.background = 'var(--orvo-surface)'; }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'var(--orvo-primary)', color: '#fff', border: 'none',
                    padding: '14px', borderRadius: '12px', fontWeight: 800, fontSize: '15px',
                    cursor: 'pointer', transition: 'background 0.2s', marginTop: '8px'
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--orvo-primary-dark)'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--orvo-primary)'; }}
                >
                  {loading ? 'Sending Message…' : '✉️ Submit Message'}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
