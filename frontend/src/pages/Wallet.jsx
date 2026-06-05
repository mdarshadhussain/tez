import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ShieldCheck, CreditCard } from 'lucide-react';
import TransactionHistory from '../components/TransactionHistory';

export default function Wallet({ token, balance, setBalance }) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid deposit amount');
    try {
      const res = await fetch('http://localhost:3001/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: amt })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.new_balance);
        alert(`Deposit of ₹${amt.toFixed(2)} completed successfully!`);
        setDepositAmount('');
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid withdrawal amount');
    if (amt > balance) return alert('Insufficient balance for withdrawal');
    try {
      const res = await fetch('http://localhost:3001/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: amt })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.new_balance);
        alert(`Withdrawal of ₹${amt.toFixed(2)} successfully processed!`);
        setWithdrawAmount('');
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Wallet Card */}
      <div
        className="frosted-card"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05) 0%, rgba(22, 22, 26, 0.8) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.15)',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '20px'
        }}
      >
        <span style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 600, letterSpacing: '1px' }}>
          PLAYABLE INR BALANCE
        </span>
        <div className="monospace-ledger" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--success-layer)', marginTop: '8px' }}>
          ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div className="row mt-12" style={{ color: '#8a8a93', fontSize: '11px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} color="var(--success-layer)" /> Secured Gateway (UPI/IMPS)
          </span>
          <span>INR Verified</span>
        </div>
      </div>

      {/* Tabs / Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {/* Deposit Column */}
        <div style={{ flex: 1 }} className="frosted-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <ArrowDownLeft size={16} color="var(--success-layer)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>DEPOSIT FUNDS</span>
          </div>

          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
            {[100, 500, 1000].map((preset) => (
              <button
                key={preset}
                onClick={() => setDepositAmount(String(preset))}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '6px 0',
                  cursor: 'pointer'
                }}
              >
                ₹{preset}
              </button>
            ))}
          </div>

          <input
            type="number"
            className="form-input mb-12"
            style={{ padding: '10px' }}
            placeholder="Amount (₹)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />

          <button className="action-btn" onClick={handleDeposit} style={{ background: 'var(--success-layer)', color: '#09090A', padding: '10px', fontSize: '13px' }}>
            Instant Deposit
          </button>
        </div>

        {/* Withdraw Column */}
        <div style={{ flex: 1 }} className="frosted-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <ArrowUpRight size={16} color="var(--action-highlight)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>WITHDRAW FUNDS</span>
          </div>

          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
            {[500, 2000, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setWithdrawAmount(String(preset))}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '6px 0',
                  cursor: 'pointer'
                }}
              >
                ₹{preset}
              </button>
            ))}
          </div>

          <input
            type="number"
            className="form-input mb-12"
            style={{ padding: '10px' }}
            placeholder="Amount (₹)"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />

          <button className="action-btn" onClick={handleWithdraw} style={{ background: 'var(--action-highlight)', padding: '10px', fontSize: '13px' }}>
            Request Payout
          </button>
        </div>
      </div>

      <div className="frosted-card" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
        <CreditCard size={24} color="#8a8a93" />
        <div style={{ fontSize: '11px', color: '#8a8a93' }}>
          Minimum deposit/withdrawal limit is ₹100.00. Standard processing takes 5–15 minutes on business cycles.
        </div>
      </div>

      {/* Transaction History ledger list */}
      <TransactionHistory token={token} />
    </div>
  );
}
