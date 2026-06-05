import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowDownLeft, ArrowUpRight, Award, CircleDot } from 'lucide-react';

export default function TransactionHistory({ token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    setLoading(true);
    fetch('http://localhost:3001/api/user/transactions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.history) setHistory(data.history);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const getIcon = (type) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft size={16} color="var(--success-layer)" />;
      case 'withdrawal': return <ArrowUpRight size={16} color="var(--action-highlight)" />;
      case 'bet_place': return <CircleDot size={16} color="#8a8a93" />;
      case 'bet_win': return <Award size={16} color="var(--vip-status)" />;
      case 'referral_commission': return <Award size={16} color="var(--success-layer)" />;
      default: return <CircleDot size={16} color="#8a8a93" />;
    }
  };

  const formatType = (type) => {
    return type.toUpperCase().replace('_', ' ');
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <div className="row mb-12">
        <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
          TRANSACTION HISTORY
        </h3>
        <button
          onClick={fetchHistory}
          style={{ background: 'transparent', border: 'none', color: 'var(--success-layer)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
        >
          <RefreshCw size={12} /> Reload
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#888', fontSize: '12px', padding: '10px 0' }}>Loading ledger logs...</div>
      ) : history.length === 0 ? (
        <div className="frosted-card" style={{ textAlign: 'center', color: '#888', padding: '24px 0', fontSize: '12px' }}>
          No transactions found on ledger.
        </div>
      ) : (
        <div className="frosted-card" style={{ padding: 0, overflow: 'hidden' }}>
          {history.map((tx) => {
            const isNegative = tx.amount < 0 || tx.type === 'bet_place' || tx.type === 'withdrawal';
            return (
              <div
                key={tx.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-glass)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '8px' }}>
                    {getIcon(tx.type)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{formatType(tx.type)}</div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                      {new Date(tx.created_at).toLocaleString('en-IN', { hour12: false })}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    className="monospace-ledger"
                    style={{
                      fontWeight: 800,
                      color: isNegative ? '#FF3B30' : 'var(--success-layer)',
                      fontSize: '13px'
                    }}
                  >
                    {isNegative ? '-' : '+'}₹{Math.abs(tx.amount).toFixed(2)}
                  </div>
                  <div className="monospace-ledger" style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                    Bal: ₹{tx.new_balance.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
