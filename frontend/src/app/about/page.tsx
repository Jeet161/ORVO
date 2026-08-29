'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{
      background: 'var(--orvo-bg)',
      minHeight: '100vh',
      color: 'var(--orvo-text)',
      padding: '80px 24px 100px',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '80px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 800, color: 'var(--orvo-primary)',
            textTransform: 'uppercase', letterSpacing: '2px', display: 'inline-block',
            marginBottom: '12px', background: 'var(--orvo-surface-3)',
            padding: '6px 16px', borderRadius: '20px'
          }}>OUR STORY</span>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: '48px', fontWeight: 900,
            lineHeight: 1.1, color: 'var(--orvo-primary-dark)', letterSpacing: '-1px',
            marginBottom: '20px'
          }}>
            Vetted Sellers. Verified Trust.
          </h1>
          <p style={{
            fontSize: '18px', color: 'var(--orvo-text-muted)', lineHeight: 1.6,
            maxWidth: '680px', margin: '0 auto'
          }}>
            ORVO is a premium multi-vendor marketplace designed from the ground up to ensure safety, quality, and reliability for both buyers and sellers.
          </p>
        </section>

        {/* Pillars Grid */}
        <section style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px', marginBottom: '80px'
        }}>
          {[
            {
              icon: '🛡️',
              title: 'Vetted Sellers Only',
              desc: 'Every business vendor is strictly verified by our administrative team with official licensing proofs before opening shop. No scams, no fakes.'
            },
            {
              icon: '🏫',
              title: 'Student Campus Corner',
              desc: 'We host a dedicated local marketplace for student hostel and PG communities to buy, rent, or share used books, appliances, and transport.'
            },
            {
              icon: '🔍',
              title: 'Moderated Products',
              desc: 'Every new listing goes through admin confirmation before putting in the site, maintaining strict standards and product quality.'
            }
          ].map((pillar, i) => (
            <div key={i} style={{
              background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)',
              borderRadius: '24px', padding: '36px', boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.2s', cursor: 'default'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '20px' }}>{pillar.icon}</span>
              <h3 style={{
                fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800,
                color: 'var(--orvo-primary-dark)', marginBottom: '12px'
              }}>{pillar.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--orvo-text-muted)', lineHeight: 1.6, margin: 0 }}>{pillar.desc}</p>
            </div>
          ))}
        </section>

        {/* Campus Story Card */}
        <section style={{
          background: 'var(--orvo-surface-3)', borderRadius: '32px',
          padding: '56px 48px', border: '1px solid var(--orvo-border)',
          boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center', gap: '20px', marginBottom: '80px'
        }}>
          <span style={{ fontSize: '48px' }}>🎓</span>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: '30px', fontWeight: 900,
            color: 'var(--orvo-primary-dark)', margin: 0
          }}>Campus Circular Economy</h2>
          <p style={{
            fontSize: '15px', color: 'var(--orvo-text)', lineHeight: 1.7,
            maxWidth: '680px', margin: 0
          }}>
            Our Campus Marketplace empowers students to recycle, resell, or rent out used textbooks, hostel basics, cycles, and lab tools. By keeping listings local, students can exchange items directly face-to-face inside their hostels or PG blocks, saving money and cutting down waste.
          </p>
          <Link href="/campus-marketplace" style={{
            marginTop: '12px', background: 'var(--orvo-primary)', color: '#fff',
            padding: '12px 28px', borderRadius: '12px', textDecoration: 'none',
            fontWeight: 700, fontSize: '14px', transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--orvo-primary-dark)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--orvo-primary)'}
          >
            Explore Campus Market →
          </Link>
        </section>

        {/* Quick Footer Call to Action */}
        <section style={{ textAlign: 'center' }}>
          <h3 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 800,
            color: 'var(--orvo-primary-dark)', marginBottom: '16px'
          }}>Ready to join our community?</h3>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{
              background: 'var(--orvo-primary)', color: '#fff', padding: '12px 24px',
              borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '13px'
            }}>Create Account</Link>
            <Link href="/seller/apply" style={{
              background: 'var(--orvo-surface)', border: '1px solid var(--orvo-border)',
              color: 'var(--orvo-text)', padding: '12px 24px', borderRadius: '10px',
              textDecoration: 'none', fontWeight: 600, fontSize: '13px'
            }}>Become a Seller</Link>
          </div>
        </section>

      </div>
    </div>
  );
}
