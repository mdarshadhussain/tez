'use client';

import React, { useState } from 'react';
import { Shield, Coins, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-accent-orange/5 border-b border-accent-orange/25 p-3 relative z-50 backdrop-blur-md"
    >
      <div 
        className="flex items-center justify-between cursor-pointer max-w-7xl mx-auto px-4" 
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-accent-orange animate-pulse" />
          <span className="text-xs font-bold text-accent-orange tracking-widest uppercase">
            TezClub Developer Control Centre
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-text-muted hover:text-slate-900 dark:text-white transition-colors">
          <span>{collapsed ? 'EXPAND PANELS' : 'COLLAPSE'}</span>
          {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden max-w-7xl mx-auto px-4 mt-3"
          >
            <div className="flex gap-3 flex-wrap pb-1">
              <button
                onClick={mintCredits}
                className="flex-1 min-w-[150px] bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/10 hover:border-accent-green/50 hover:bg-accent-green/10 rounded-xl text-slate-900 dark:text-white text-xs font-medium py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
              >
                <Coins size={14} className="text-accent-green" />
                Mint ₹1,00,000.00 Credits
              </button>

              <button
                onClick={triggerRain}
                className="flex-1 min-w-[150px] bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/10 hover:border-accent-blue/50 hover:bg-accent-blue/10 rounded-xl text-slate-900 dark:text-white text-xs font-medium py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
              >
                <Sparkles size={14} className="text-accent-blue" />
                Trigger Live Chat Rain Bot
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
