import React, { useState, useEffect } from 'react';
import { Shield, Users, BarChart2, Coins, TrendingUp, Sparkles, Send } from 'lucide-react';

export default function AdminDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [wingoOverride, setWingoOverride] = useState('');
  const [crashOverride, setCrashOverride] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // stats
      const resStats = await fetch('http://localhost:3001/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataStats = await resStats.json();
      if (dataStats.stats) setStats(dataStats.stats);

      // users
      const resUsers = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataUsers = await resUsers.json();
      if (dataUsers.users) setUsers(dataUsers.users);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const submitOverride = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/admin/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          wingo_color: wingoOverride || null,
          crash_multiplier: crashOverride || null
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Override set successfully!\nNext WinGo: ${data.nextWinGoColor || 'Normal'}\nNext Crash: ${data.nextCrashMultiplier ? data.nextCrashMultiplier + 'x' : 'Normal'}`);
        setWingoOverride('');
        setCrashOverride('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', color: '#888' }}>Loading Admin Console...</div>;
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Banner */}
      <div
        className="frosted-card"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15) 0%, rgba(22, 22, 26, 0.8) 100%)',
          border: '1px solid rgba(255, 107, 0, 0.2)',
          padding: '20px',
          textAlign: 'center',
          borderRadius: '20px',
          marginBottom: '20px'
        }}
      >
        <Shield size={40} color="var(--action-highlight)" style={{ margin: '0 auto 8px' }} />
        <span
          style={{
            color: 'var(--action-highlight)',
            fontWeight: 800,
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          Master Platform Admin
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
          CONTROL DASHBOARD
        </h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          <div className="frosted-card" style={{ margin: 0 }}>
            <span style={{ fontSize: '10px', color: '#8a8a93', fontWeight: 600 }}>TOTAL STAKE</span>
            <div className="monospace-ledger" style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              ₹{stats.total_bets.toFixed(2)}
            </div>
          </div>
          <div className="frosted-card" style={{ margin: 0 }}>
            <span style={{ fontSize: '10px', color: '#8a8a93', fontWeight: 600 }}>HOUSE REVENUE</span>
            <div className="monospace-ledger" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success-layer)', marginTop: '4px' }}>
              ₹{stats.house_profit.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Game Override Inputs */}
      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '0.5px' }}>
        ROUND RESOLUTION OVERRIDES
      </h2>

      <div className="frosted-card">
        <form onSubmit={submitOverride} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: '#8a8a93' }}>NEXT WINGO COLOR / NUM</span>
              <select
                className="form-input mt-12"
                style={{ padding: '8px' }}
                value={wingoOverride}
                onChange={(e) => setWingoOverride(e.target.value)}
              >
                <option value="">No Override (Pool Alg)</option>
                <option value="red">Force Red</option>
                <option value="green">Force Green</option>
                <option value="violet">Force Violet</option>
                <option value="0">Force Number 0</option>
                <option value="3">Force Number 3</option>
                <option value="7">Force Number 7</option>
                <option value="8">Force Number 8</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: '#8a8a93' }}>NEXT CRASH MULTIPLIER</span>
              <input
                type="number"
                step="0.01"
                className="form-input mt-12"
                style={{ padding: '8px' }}
                placeholder="e.g. 15.50"
                value={crashOverride}
                onChange={(e) => setCrashOverride(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="action-btn" style={{ padding: '10px' }}>
            Apply Overrides
          </button>
        </form>
      </div>

      {/* User Directory */}
      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '0.5px' }}>
        REGISTERED USERS DIRECTORY ({users.length})
      </h2>

      <div className="frosted-card" style={{ padding: 0, overflow: 'hidden' }}>
        {users.map((u) => (
          <div
            key={u.id}
            className="row"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-glass)',
              fontSize: '12px'
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: '#fff' }}>{u.phone_number}</div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                Joined: {new Date(u.created_at).toLocaleDateString('en-IN')}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="monospace-ledger" style={{ fontWeight: 800, color: 'var(--success-layer)' }}>
                ₹{parseFloat(u.lifetime_turnover).toFixed(2)}
              </div>
              <div style={{ fontSize: '9px', color: '#666' }}>Turnover</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
