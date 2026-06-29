'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowDownLeft, ArrowUpRight, Award, CircleDot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const getIcon = (type) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft size={16} className="text-accent-cyan" />;
      case 'withdrawal': return <ArrowUpRight size={16} className="text-accent-red" />;
      case 'bet_place': return <CircleDot size={16} className="text-slate-500 dark:text-text-muted" />;
      case 'bet_win': return <Award size={16} className="text-yellow-400" />;
      case 'referral_commission': return <Award size={16} className="text-accent-blue" />;
      default: return <CircleDot size={16} className="text-slate-500 dark:text-text-muted" />;
    }
  };

  const formatType = (type) => {
    return type.toUpperCase().replace('_', ' ');
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase">
          Transaction Ledger
        </h3>
        <button
          onClick={fetchHistory}
          className="bg-transparent border-0 text-accent-cyan hover:text-slate-900 dark:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Reload Logs
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 dark:text-text-muted text-xs py-4">Loading ledger logs...</div>
      ) : history.length === 0 ? (
        <div className="bg-slate-200/40 dark:bg-zinc-950/40 border border-black/10 dark:border-white/5 text-center text-slate-500 dark:text-text-muted py-8 rounded-2xl text-xs">
          No transactions found on ledger.
        </div>
      ) : (
        <div className="bg-slate-200/30 dark:bg-zinc-950/30 border border-black/10 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {history.map((tx, idx) => {
              const isNegative = tx.amount < 0 || tx.type === 'bet_place' || tx.type === 'withdrawal';
              return (
                <motion.div
                  key={tx.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                  className="p-4 flex justify-between items-center hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-black/10 dark:border-white/5 flex items-center justify-center">
                      {getIcon(tx.type)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{formatType(tx.type)}</div>
                      <div className="text-[10px] text-slate-500 dark:text-text-muted mt-0.5">
                        {new Date(tx.created_at).toLocaleString('en-IN', { hour12: false })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`monospace-ledger font-black text-xs ${
                        isNegative ? 'text-accent-red' : 'text-accent-cyan'
                      }`}
                    >
                      {isNegative ? '-' : '+'}₹{Math.abs(tx.amount).toFixed(2)}
                    </div>
                    <div className="monospace-ledger text-[10px] text-slate-400 dark:text-text-dim mt-0.5">
                      Bal: ₹{tx.new_balance.toFixed(2)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
