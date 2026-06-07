'use client';

import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ShieldCheck, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import TransactionHistory from '../TransactionHistory';

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
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 pb-24 max-w-5xl mx-auto space-y-6"
    >
      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-accent-cyan/5 via-zinc-950/80 to-zinc-950 border border-accent-cyan/15 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
        <span className="text-[10px] font-black text-text-muted tracking-[2px] uppercase block mb-1">
          Playable Balance (INR)
        </span>
        <div className="monospace-ledger text-3xl md:text-4xl font-black text-white">
          ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-accent-cyan" /> Secured Encryption Gateway (UPI/IMPS)
          </span>
          <span>Account Standard Verified</span>
        </div>
      </div>

      {/* Tabs / Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deposit Column */}
        <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan border border-accent-cyan/20">
              <ArrowDownLeft size={16} />
            </div>
            <span className="text-xs font-black text-white tracking-wider uppercase">Deposit Funds</span>
          </div>

          <div className="flex gap-2">
            {[100, 500, 1000].map((preset) => (
              <button
                key={preset}
                onClick={() => setDepositAmount(String(preset))}
                className="flex-1 bg-white/5 border border-white/5 hover:border-accent-cyan/40 hover:bg-accent-cyan/10 rounded-xl text-white text-xs py-2 cursor-pointer transition-all duration-200"
              >
                ₹{preset}
              </button>
            ))}
          </div>

          <input
            type="number"
            className="form-input py-2.5 px-3 text-xs bg-white/5 border border-white/10 rounded-xl"
            placeholder="Amount (₹)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />

          <button 
            className="action-btn w-full py-2.5 text-xs bg-accent-cyan hover:bg-accent-cyan/80 text-black font-black hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]" 
            onClick={handleDeposit}
          >
            Instant UPI Deposit
          </button>
        </div>

        {/* Withdraw Column */}
        <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-red/10 flex items-center justify-center text-accent-red border border-accent-red/20">
              <ArrowUpRight size={16} />
            </div>
            <span className="text-xs font-black text-white tracking-wider uppercase">Withdraw Funds</span>
          </div>

          <div className="flex gap-2">
            {[500, 2000, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setWithdrawAmount(String(preset))}
                className="flex-1 bg-white/5 border border-white/5 hover:border-accent-red/40 hover:bg-accent-red/10 rounded-xl text-white text-xs py-2 cursor-pointer transition-all duration-200"
              >
                ₹{preset}
              </button>
            ))}
          </div>

          <input
            type="number"
            className="form-input py-2.5 px-3 text-xs bg-white/5 border border-white/10 rounded-xl"
            placeholder="Amount (₹)"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />

          <button 
            className="action-btn w-full py-2.5 text-xs bg-accent-red hover:bg-accent-red/80 text-white font-black hover:shadow-[0_0_15px_rgba(255,51,102,0.3)]" 
            onClick={handleWithdraw}
          >
            Request IMPS Payout
          </button>
        </div>
      </div>

      <div className="bg-zinc-950/20 border border-white/5 p-4 rounded-2xl flex gap-3 items-center">
        <CreditCard size={20} className="text-text-muted shrink-0" />
        <div className="text-[11px] text-text-muted leading-normal">
          Minimum transaction limit is ₹100.00. Standard verification processing cycles take 5–15 minutes.
        </div>
      </div>

      {/* Transaction History ledger list */}
      <TransactionHistory token={token} />
    </motion.div>
  );
}
