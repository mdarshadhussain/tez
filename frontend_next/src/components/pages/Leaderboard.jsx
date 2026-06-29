'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Award, Star } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 pb-24 max-w-5xl mx-auto space-y-6"
    >
      {/* Tournament Card */}
      <div className="bg-gradient-to-br from-amber-500/10 via-zinc-950/80 to-zinc-950 border border-amber-500/20 p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl">
        <Trophy size={48} className="text-amber-400 mx-auto mb-3 animate-bounce" />
        <span className="text-amber-400 font-extrabold text-[10px] tracking-[4px] uppercase block mb-1">
          Monthly VIP Tournament
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          WHALE TURNOVER CHALLENGE
        </h1>
        <p className="text-slate-500 dark:text-text-muted text-xs md:text-sm max-w-md mx-auto mt-2 leading-relaxed">
          Top high-rollers compete for ultimate luxury vacation escapes & hardware. Play games to climb!
        </p>
      </div>

      {/* Prize Board */}
      <div>
        <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase mb-3">
          Prize Allocations
        </h2>
        <div className="bg-slate-200/40 dark:bg-zinc-950/40 border border-black/10 dark:border-white/5 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex gap-3 items-start text-xs leading-relaxed text-slate-600 dark:text-text-secondary">
            <Award size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Rank 1 - 3:</strong> Luxury Vacation to Dubai or Bali (Premium flights, 5-Star Resort).
            </div>
          </div>
          <div className="flex gap-3 items-start text-xs leading-relaxed text-slate-600 dark:text-text-secondary">
            <Gift size={18} className="text-accent-green shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Rank 4 - 10:</strong> iPhone 15 Pro Max (256GB) / ASUS ROG Strix SCAR 16 (RTX 5080).
            </div>
          </div>
        </div>
      </div>

      {/* Current Leaderboard */}
      <div>
        <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase mb-3">
          Current Leaderboard Standings
        </h2>
        <div className="bg-slate-200/30 dark:bg-zinc-950/30 border border-black/10 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-lg">
          {leaderboard.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-text-muted py-8 text-xs">
              No tournament logs found.
            </div>
          ) : (
            leaderboard.map((item, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              return (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                  key={item.id}
                  className={`flex justify-between items-center p-4 hover:bg-white/[0.01] transition-colors ${
                    rank === 1 ? 'bg-amber-400/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border ${
                        rank === 1 
                          ? 'bg-amber-400 border-amber-300 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' 
                          : rank === 2 
                          ? 'bg-slate-300 border-slate-200 text-black' 
                          : rank === 3 
                          ? 'bg-amber-700 border-amber-600 text-slate-900 dark:text-white' 
                          : 'bg-slate-100 dark:bg-zinc-900 border-black/10 dark:border-white/5 text-slate-500 dark:text-text-muted'
                      }`}
                    >
                      {rank}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs md:text-sm">{item.phone}</div>
                      <div className="text-[10px] text-slate-500 dark:text-text-muted flex items-center gap-1 mt-0.5">
                        <Star size={10} className="text-amber-400 fill-amber-400" /> VIP Level {item.vip_level}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="monospace-ledger font-black text-accent-green text-xs md:text-sm">
                      ₹{parseFloat(item.lifetime_turnover).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-text-dim mt-0.5">Total Turnover</div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
