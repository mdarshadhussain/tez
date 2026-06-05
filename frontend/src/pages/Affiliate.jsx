import React, { useState, useEffect } from 'react';
import { Users, Copy, Award, ShieldAlert } from 'lucide-react';

export default function Affiliate({ token }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:3001/api/affiliate/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((e) => console.error(e));
  }, [token]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard: ' + text);
  };

  if (!stats) {
    return <div style={{ padding: '20px', color: '#888' }}>Loading network details...</div>;
  }

  // Aggregate stats
  const getCountByDepth = (depth) => {
    const item = stats.network.find((n) => n.depth === depth);
    return item ? item.count : 0;
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Banner */}
      <div
        className="frosted-card"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(22, 22, 26, 0.8) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          padding: '20px',
          textAlign: 'center',
          borderRadius: '20px',
          marginBottom: '20px'
        }}
      >
        <Users size={40} color="var(--success-layer)" style={{ margin: '0 auto 8px' }} />
        <span
          style={{
            color: 'var(--success-layer)',
            fontWeight: 800,
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          3-Tier Agent Network
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
          VOLUME AFFILIATE HUB
        </h1>
        <p style={{ color: '#8A8A93', fontSize: '12px', marginTop: '8px' }}>
          Earn commission on all network turnover volume. Keep your network winning!
        </p>
      </div>

      {/* Invite Code card */}
      <div className="frosted-card">
        <span style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 600 }}>YOUR INVITATION LINK</span>
        <div className="row mt-12" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '10px' }}>
          <span className="monospace-ledger" style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>
            {stats.invite_code}
          </span>
          <Copy
            size={16}
            color="var(--success-layer)"
            style={{ cursor: 'pointer' }}
            onClick={() => copyToClipboard(`http://tezclub.in/register?ref=${stats.invite_code}`)}
          />
        </div>
      </div>

      {/* Commission Wallet */}
      <div className="frosted-card" style={{ background: 'rgba(0, 229, 255, 0.03)' }}>
        <div className="row">
          <div>
            <span style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 600 }}>COMMISSION EARNINGS</span>
            <div className="monospace-ledger" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success-layer)', marginTop: '4px' }}>
              ₹{parseFloat(stats.commission_balance).toFixed(2)}
            </div>
          </div>
          <button
            className="action-btn"
            style={{ width: 'auto', padding: '10px 16px', fontSize: '12px' }}
            onClick={() => alert('Commission claims process automatically to playable balance at midnight.')}
          >
            Claim Commission
          </button>
        </div>
      </div>

      {/* Tier Matrix */}
      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '0.5px' }}>
        NETWORK STRUCTURE
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div className="frosted-card" style={{ textAlign: 'center', margin: 0 }}>
          <div style={{ color: 'var(--vip-status)', fontSize: '20px', fontWeight: 800 }}>
            {getCountByDepth(1)}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>Tier 1</div>
          <div style={{ fontSize: '9px', color: '#8a8a93', marginTop: '2px' }}>0.6% Turnover</div>
        </div>

        <div className="frosted-card" style={{ textAlign: 'center', margin: 0 }}>
          <div style={{ color: 'var(--success-layer)', fontSize: '20px', fontWeight: 800 }}>
            {getCountByDepth(2)}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>Tier 2</div>
          <div style={{ fontSize: '9px', color: '#8a8a93', marginTop: '2px' }}>0.3% Turnover</div>
        </div>

        <div className="frosted-card" style={{ textAlign: 'center', margin: 0 }}>
          <div style={{ color: '#FF2D55', fontSize: '20px', fontWeight: 800 }}>
            {getCountByDepth(3)}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>Tier 3</div>
          <div style={{ fontSize: '9px', color: '#8a8a93', marginTop: '2px' }}>0.1% Turnover</div>
        </div>
      </div>

      {/* Safeguards / Warning */}
      <div className="frosted-card mt-12" style={{ display: 'flex', gap: '10px', background: 'rgba(255, 59, 48, 0.05)', border: '1px solid rgba(255, 59, 48, 0.1)' }}>
        <ShieldAlert size={20} color="#FF3B30" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '11px', color: '#FF3B30' }}>
          <strong>Anti-Fraud Warning:</strong> Creating secondary accounts under your own invite chain will trigger automated hardware checks, leading to balance locks and immediate system suspension.
        </div>
      </div>
    </div>
  );
}
