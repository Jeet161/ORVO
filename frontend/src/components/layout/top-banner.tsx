'use client';

import { useState, useEffect } from 'react';

const MESSAGES = [
  '⚡ Free shipping on orders above ₹999!',
  '🏺 Handcrafted by verified local Indian artisans.',
  '🛡️ 100% Quality Inspected and Moderated products.',
  '🏬 Want to sell? Click on "Become a Seller" in the menu!',
];

export function TopAnnouncementBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % MESSAGES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: '#BBC863',
      color: '#1E4632',
      fontSize: 12,
      fontWeight: 700,
      textAlign: 'center',
      padding: '7px 16px',
      overflow: 'hidden',
      position: 'relative',
      height: 30,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      letterSpacing: '0.5px',
      borderBottom: '1px solid rgba(49,105,78,0.15)',
    }}>
      <div key={index} style={{
        animation: 'slideText 0.5s ease-out forwards',
        whiteSpace: 'nowrap',
      }}>
        {MESSAGES[index]}
      </div>

      <style jsx global>{`
        @keyframes slideText {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
