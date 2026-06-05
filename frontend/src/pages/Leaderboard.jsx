import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Award, Star } from 'lucide-react';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/vip/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
      })
      .catch((e) => console.error(e));
  }, []);

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Tournament Card */}
      <div
        className="frosted-card"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(22, 22, 26, 0.8) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          padding: '20px',
          textAlign: 'center',
          borderRadius: '20px',
          marginBottom: '20px'
        }}
      >
        <Trophy size={40} color="var(--vip-status)" style={{ margin: '0 auto 8px' }} />
        <span
          style={{
            color: 'var(--vip-status)',
            fontWeight: 800,
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          Monthly VIP Tournament
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
          WHALE TURNOVER CHALLENGE
        </h1>
        <p style={{ color: '#8A8A93', fontSize: '12px', marginTop: '8px' }}>
          Top high-rollers compete for ultimate luxury vacation escapes & hardware.
        </p>
      </div>

      {/* Prize Board */}
      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '0.5px' }}>
        PRIZE ALLOCATIONS
      </h2>
      
      <div className="frosted-card" style={{ padding: '12px', fontSize: '13px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
          <Award size={18} color="var(--vip-status)" />
          <div>
            <strong>Rank 1 - 3:</strong> Luxury Vacation to Dubai or Bali (Premium flights, 5-Star Resort).
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Gift size={18} color="var(--success-layer)" />
          <div>
            <strong>Rank 4 - 10:</strong> iPhone 15 Pro Max (256GB) / ASUS ROG Strix SCAR 16 (RTX 5080).
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '0.5px' }}>
        CURRENT LEADERBOARD
      </h2>

      {/* Table */}
      <div className="frosted-card" style={{ padding: 0, overflow: 'hidden' }}>
        {leaderboard.map((item, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          return (
            <div
              key={item.id}
              className="row"
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-glass)',
                background: rank === 1 ? 'rgba(212, 175, 55, 0.03)' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: rank === 1 ? 'var(--vip-status)' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'rgba(255,255,255,0.05)',
                    color: isTop3 ? '#09090A' : '#8A8A93',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '12px'
                  }}
                >
                  {rank}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{item.phone}</div>
                  <div style={{ fontSize: '11px', color: '#8a8a93', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={10} color="var(--vip-status)" /> VIP Level {item.vip_level}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="monospace-ledger" style={{ fontWeight: 700, color: 'var(--success-layer)', fontSize: '14px' }}>
                  ₹{parseFloat(item.lifetime_turnover).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '10px', color: '#8a8a93' }}>Turnover</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
