import React, { useState } from 'react';
import { Shield, Coins, Sparkles, RefreshCw } from 'lucide-react';

export default function AdminPanel({ token, socket, user, setPlayableBalance }) {
  const [collapsed, setCollapsed] = useState(true);

  const mintCredits = async () => {
    if (!token || !user) return;
    try {
      const res = await fetch('http://localhost:3001/api/admin/mint-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: 100000.00 })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
        alert('Admin credits added: ₹1,00,000.00');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerRain = () => {
    if (!socket) return;
    socket.emit('admin_trigger_rain');
    alert('Rain Event Broadcasted to Chat Users!');
  };

  return (
    <div
      style={{
        background: 'rgba(255, 107, 0, 0.05)',
        borderBottom: '1px solid rgba(255, 107, 0, 0.2)',
        padding: collapsed ? '8px' : '16px',
        position: 'relative',
        zIndex: 140
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={16} color="var(--action-highlight)" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--action-highlight)', letterSpacing: '1px' }}>
            TEZCLUB TESTING CONTROLS
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#888' }}>{collapsed ? 'SHOW' : 'HIDE'}</span>
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={mintCredits}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '11px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Coins size={12} color="var(--success-layer)" />
            Add ₹1,00,000
          </button>

          <button
            onClick={triggerRain}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '11px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={12} color="var(--vip-status)" />
            Trigger Rain
          </button>
        </div>
      )}
    </div>
  );
}
