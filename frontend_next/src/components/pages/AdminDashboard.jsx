'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Coins, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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
    if (token) {
      fetchData();
    }
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
    return <div className="p-6 text-text-muted text-xs">Loading Admin Console...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 pb-24 max-w-5xl mx-auto space-y-6"
    >
      {/* Banner */}
      <div className="bg-gradient-to-br from-accent-orange/15 via-zinc-950/80 to-zinc-950 border border-accent-orange/20 p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl">
        <Shield size={48} className="text-accent-orange mx-auto mb-3 animate-pulse" />
        <span className="text-accent-orange font-extrabold text-[10px] tracking-[4px] uppercase block mb-1">
          Master Platform Admin
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          CONTROL DASHBOARD
        </h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl">
            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block">Total Stakes Volume</span>
            <div className="monospace-ledger text-lg md:text-xl font-black text-white mt-1">
              ₹{stats.total_bets.toFixed(2)}
            </div>
          </div>
          <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl">
            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block">House Gross profit</span>
            <div className="monospace-ledger text-lg md:text-xl font-black text-accent-cyan mt-1">
              ₹{stats.house_profit.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Game Override Inputs */}
      <div>
        <h2 className="text-xs font-black text-white tracking-widest uppercase mb-3">
          Round Resolution Overrides
        </h2>
        <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl">
          <form onSubmit={submitOverride} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-text-muted font-bold block mb-1.5 uppercase">Next WinGo Resolution</label>
                <select
                  className="form-input py-2 px-3 text-xs bg-white/5 border border-white/10 rounded-xl w-full"
                  value={wingoOverride}
                  onChange={(e) => setWingoOverride(e.target.value)}
                >
                  <option value="" className="bg-zinc-900 text-white">Default Logic (Algorithmic)</option>
                  <option value="red" className="bg-zinc-900 text-white">Force RED color</option>
                  <option value="green" className="bg-zinc-900 text-white">Force GREEN color</option>
                  <option value="violet" className="bg-zinc-900 text-white">Force VIOLET color</option>
                  <option value="0" className="bg-zinc-900 text-white">Force Number 0</option>
                  <option value="3" className="bg-zinc-900 text-white">Force Number 3</option>
                  <option value="7" className="bg-zinc-900 text-white">Force Number 7</option>
                  <option value="8" className="bg-zinc-900 text-white">Force Number 8</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-text-muted font-bold block mb-1.5 uppercase">Next Crash Multiplier</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input py-2 px-3 text-xs bg-white/5 border border-white/10 rounded-xl w-full"
                  placeholder="e.g. 15.50"
                  value={crashOverride}
                  onChange={(e) => setCrashOverride(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="action-btn py-2.5 w-full text-xs font-black bg-accent-orange hover:bg-accent-orange/80 text-white hover:shadow-[0_0_15px_rgba(255,94,0,0.3)]"
            >
              Apply Real-time Overrides
            </button>
          </form>
        </div>
      </div>

      {/* User Directory */}
      <div>
        <h2 className="text-xs font-black text-white tracking-widest uppercase mb-3">
          Registered Users Directory ({users.length})
        </h2>
        <div className="bg-zinc-950/30 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
          {users.map((u, idx) => (
            <div
              key={u.id || idx}
              className="flex justify-between items-center p-4 hover:bg-white/[0.01] transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-[10px] text-text-muted font-bold">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-white">{u.phone_number}</div>
                  <div className="text-[10px] text-text-dim mt-0.5">
                    Joined: {new Date(u.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="monospace-ledger font-extrabold text-accent-cyan">
                  ₹{parseFloat(u.lifetime_turnover).toFixed(2)}
                </div>
                <div className="text-[10px] text-text-dim mt-0.5">Turnover Volume</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
