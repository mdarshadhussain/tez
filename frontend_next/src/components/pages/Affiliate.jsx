'use client';

import React, { useState, useEffect } from 'react';
import { Users, Copy, Award, ShieldAlert, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Affiliate({ token }) {
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!stats) {
    return <div className="p-6 text-text-muted text-xs">Loading network details...</div>;
  }

  const getCountByDepth = (depth) => {
    const item = stats.network.find((n) => n.depth === depth);
    return item ? item.count : 0;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 pb-24 max-w-5xl mx-auto space-y-6"
    >
      {/* Banner */}
      <div className="bg-gradient-to-br from-accent-cyan/10 via-zinc-950/80 to-zinc-950 border border-accent-cyan/20 p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl">
        <Users size={48} className="text-accent-cyan mx-auto mb-3" />
        <span className="text-accent-cyan font-extrabold text-[10px] tracking-[4px] uppercase block mb-1">
          3-Tier Agent Network
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          VOLUME AFFILIATE HUB
        </h1>
        <p className="text-text-muted text-xs md:text-sm max-w-md mx-auto mt-2 leading-relaxed">
          Earn real-time commissions on all nested network turnover volume. Expand your syndicate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invite Code card */}
        <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-black text-text-muted tracking-wider uppercase">Your Invitation Link</span>
            <p className="text-[11px] text-text-dim mt-1">Share this reference link to onboard users</p>
          </div>
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl">
            <span className="monospace-ledger font-extrabold text-white text-xs truncate mr-2">
              {stats.invite_code}
            </span>
            <button
              onClick={() => copyToClipboard(`http://tezclub.in/register?ref=${stats.invite_code}`)}
              className="bg-transparent border-0 text-accent-cyan hover:text-white transition-colors cursor-pointer p-1"
            >
              {copied ? <Check size={16} className="text-accent-green" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Commission Wallet */}
        <div className="bg-zinc-950/40 border border-accent-cyan/10 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-black text-accent-cyan tracking-wider uppercase">Commission Balance</span>
            <div className="monospace-ledger text-2xl font-black text-white mt-1">
              ₹{parseFloat(stats.commission_balance).toFixed(2)}
            </div>
          </div>
          <button
            className="action-btn py-2.5 w-full text-xs font-bold bg-accent-cyan hover:bg-accent-cyan/80 text-black hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            onClick={() => alert('Commission claims process automatically to playable balance at midnight.')}
          >
            Claim Commission
          </button>
        </div>
      </div>

      {/* Tier Matrix */}
      <div>
        <h2 className="text-xs font-black text-white tracking-widest uppercase mb-3">
          Network Structure & Yields
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-amber-400 text-lg md:text-2xl font-black">{getCountByDepth(1)}</div>
            <div className="text-xs font-bold text-white mt-1">Tier 1</div>
            <div className="text-[10px] text-text-muted mt-0.5">0.6% Vol</div>
          </div>

          <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-accent-cyan text-lg md:text-2xl font-black">{getCountByDepth(2)}</div>
            <div className="text-xs font-bold text-white mt-1">Tier 2</div>
            <div className="text-[10px] text-text-muted mt-0.5">0.3% Vol</div>
          </div>

          <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-accent-red text-lg md:text-2xl font-black">{getCountByDepth(3)}</div>
            <div className="text-xs font-bold text-white mt-1">Tier 3</div>
            <div className="text-[10px] text-text-muted mt-0.5">0.1% Vol</div>
          </div>
        </div>
      </div>

      {/* Safeguards / Warning */}
      <div className="bg-accent-red/5 border border-accent-red/20 p-4 rounded-2xl flex gap-3 items-start">
        <ShieldAlert size={20} className="text-accent-red shrink-0 mt-0.5 animate-pulse" />
        <div className="text-xs text-accent-red leading-relaxed">
          <strong>Anti-Fraud Warning:</strong> Creating secondary accounts under your own invite chain will trigger automated hardware checks, leading to balance locks and immediate system suspension.
        </div>
      </div>
    </motion.div>
  );
}
