'use client';

import React, { useState, useEffect } from 'react';
import { Users, Copy, Award, ShieldAlert, Check, Share2, TrendingUp, Gem } from 'lucide-react';
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
    return (
      <div className="flex justify-center items-center h-64 text-[#3de796] animate-pulse">
        <Users size={32} className="opacity-50" />
      </div>
    );
  }

  const getCountByDepth = (depth) => {
    const item = stats.network.find((n) => n.depth === depth);
    return item ? item.count : 0;
  };

  const link = `http://tezclub.in/register?ref=${stats.invite_code}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 pb-24 max-w-5xl mx-auto space-y-6 relative"
    >
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Banner */}
      <div className="relative bg-slate-50 dark:bg-[#141622]/80 backdrop-blur-xl border border-black/15 dark:border-white/10 p-8 rounded-[32px] text-center overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-50 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)] mb-4">
            <Users size={40} className="text-purple-400" />
          </div>
          <span className="text-purple-400 font-extrabold text-[10px] tracking-[4px] uppercase block mb-2 drop-shadow-md">
            3-Tier Agent Network
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            Referral <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#3de796]">Program</span>
          </h1>
          <p className="text-slate-900 dark:text-white/60 text-xs md:text-sm max-w-md mx-auto mt-3 leading-relaxed font-medium">
            Earn real-time commissions on all nested network turnover volume. Expand your syndicate and increase your passive income.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invite Code card */}
        <div className="bg-slate-50 dark:bg-[#141622]/60 backdrop-blur-lg border border-[#3de796]/20 p-6 rounded-[24px] flex flex-col justify-between space-y-5 relative overflow-hidden group hover:border-[#3de796]/40 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#3de796]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-[#3de796]/20" />
          <div className="relative z-10">
            <span className="text-[10px] font-black text-slate-900 dark:text-white tracking-[0.2em] uppercase block">Your Invitation Link</span>
            <p className="text-xs text-slate-900 dark:text-white/50 mt-1.5 leading-relaxed font-medium">Share this unique reference link to onboard users to your syndicate.</p>
          </div>
          <div className="relative z-10 flex items-center justify-between bg-slate-100 dark:bg-[#1a1c29] border border-black/15 dark:border-white/10 p-4 rounded-xl shadow-inner">
            <span className="font-mono font-black text-[#3de796] text-sm truncate mr-4">
              {link}
            </span>
            <button
              onClick={() => copyToClipboard(link)}
              className="bg-[#3de796]/10 hover:bg-[#3de796]/20 border border-[#3de796]/30 text-[#3de796] p-2 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        {/* Commission Wallet */}
        <div className="bg-slate-50 dark:bg-[#141622]/60 backdrop-blur-lg border border-blue-500/20 p-6 rounded-[24px] flex flex-col justify-between space-y-5 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-blue-500/20" />
          <div className="relative z-10">
            <span className="text-[10px] font-black text-blue-400 tracking-[0.2em] uppercase block drop-shadow-md">Commission Balance</span>
            <div className="flex items-end gap-1.5 mt-2">
              <span className="text-xl text-slate-900 dark:text-white/50 font-black leading-none mb-0.5">₹</span>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {parseFloat(stats.commission_balance).toFixed(2)}
              </div>
            </div>
          </div>
          <button
            className="w-full py-3.5 rounded-xl font-black text-[12px] tracking-[2px] uppercase border-0 cursor-pointer transition-all bg-blue-500 hover:bg-blue-400 text-slate-900 dark:text-white shadow-lg shadow-blue-500/20 relative z-10"
            onClick={() => alert('Commission claims process automatically to playable balance at midnight.')}
          >
            Claim Commission
          </button>
        </div>
      </div>

      {/* Tier Matrix */}
      <div>
        <h2 className="text-xs font-black text-slate-900 dark:text-white/70 tracking-[0.2em] uppercase mb-4 ml-2 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#3de796]" />
          Network Structure & Yields
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { level: 1, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', shadow: 'shadow-amber-400/20', vol: '0.6%' },
            { level: 2, color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/20', shadow: 'shadow-slate-300/20', vol: '0.3%' },
            { level: 3, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', shadow: 'shadow-orange-400/20', vol: '0.1%' }
          ].map(tier => (
            <div key={tier.level} className={`bg-slate-50 dark:bg-[#141622]/60 backdrop-blur-md border ${tier.border} rounded-[20px] p-5 text-center relative overflow-hidden`}>
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 ${tier.bg} rounded-full blur-[20px] pointer-events-none`} />
              <div className={`relative z-10 ${tier.color} text-3xl font-black drop-shadow-[0_0_8px_currentColor]`}>
                {getCountByDepth(tier.level)}
              </div>
              <div className="relative z-10 text-[11px] font-black text-slate-900 dark:text-white mt-2 uppercase tracking-wider">Tier {tier.level}</div>
              <div className="relative z-10 text-[10px] text-slate-900 dark:text-white/50 mt-1 font-bold bg-black/5 dark:bg-black/20 py-1 rounded-md">{tier.vol} Vol</div>
            </div>
          ))}
        </div>
      </div>

      {/* Safeguards / Warning */}
      <div className="bg-slate-50 dark:bg-[#141622]/80 backdrop-blur-md border border-red-500/20 p-5 rounded-[20px] flex gap-4 items-start shadow-lg">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
          <ShieldAlert size={20} className="text-red-400 animate-pulse" />
        </div>
        <div className="text-xs text-slate-900 dark:text-white/60 leading-relaxed font-medium mt-1">
          <strong className="text-red-400">Anti-Fraud Warning:</strong> Creating secondary accounts under your own invite chain will trigger automated hardware checks, leading to balance locks and immediate system suspension. Play fair.
        </div>
      </div>
    </motion.div>
  );
}
