'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChevronRight,
  Database,
  Link,
  Cpu
} from 'lucide-react';

export default function SportsLobby() {
  const [email, setEmail] = useState('');
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  const handleWhitelist = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsWhitelisted(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-72px)] w-full text-slate-900 dark:text-white bg-[#0c0d14] px-6 relative overflow-hidden select-none">
      
      {/* Dynamic Background Grid Lines & Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#3de796]/10 to-blue-500/10 rounded-full blur-[200px] pointer-events-none" />

      {/* 1. GIANT HERO HEADER SECTION (Focal Point) */}
      <div className="text-center space-y-4 max-w-4xl relative z-10 mb-8">
        <span className="text-[#3de796] font-black text-xs tracking-[8px] uppercase block">
          TezClub Sportsbook
        </span>
        <h2 className="text-5xl sm:text-7xl md:text-8.5xl font-black tracking-tighter leading-none uppercase bg-gradient-to-r from-[#3de796] via-emerald-400 to-blue-400 bg-clip-text text-transparent filter drop-shadow-[0_0_40px_rgba(61,231,150,0.2)]">
          COMING SOON
        </h2>
        <p className="text-xs md:text-sm text-slate-600 dark:text-text-secondary max-w-sm mx-auto font-medium tracking-wide">
          Our decentralized sports odds engine is currently compiling.
        </p>
      </div>

      {/* 2. CREATIVE SPORTSBOOK COMPILING VISUAL */}
      <div className="relative flex items-center justify-center w-52 h-52 mb-8">
        
        {/* Outer Orbit Ring with Custom Keyframes Spin */}
        <div className="absolute inset-0 rounded-full border border-dashed border-black/10 dark:border-white/5 animate-[spin_60s_linear_infinite]" />
        
        {/* Middle Orbit Path */}
        <div className="absolute inset-5 rounded-full border border-black/10 dark:border-white/5" />

        {/* Orbiting Data Packets (Be creative: floating odds & components sliding in) */}
        <div className="absolute inset-0 animate-[spin_15s_linear_infinite]">
          {/* Packet 1: Odds */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3de796]/10 border border-[#3de796]/30 px-2.5 py-1 rounded-lg text-[8px] font-black text-[#3de796] flex items-center gap-1 shadow-md whitespace-nowrap">
            <span>ODDS</span>
            <span className="text-slate-900 dark:text-white font-bold">1.85x</span>
          </div>
        </div>

        <div className="absolute inset-5 animate-[spin_20s_linear_infinite_reverse]">
          {/* Packet 2: Live Feed API */}
          <div className="absolute -left-5 top-1/2 -translate-y-1/2 bg-blue-500/10 border border-blue-500/30 px-2 py-0.8 rounded-lg text-[7px] font-black text-blue-400 flex items-center gap-1 shadow-md whitespace-nowrap">
            <Link size={8} />
            <span>API LINKED</span>
          </div>
        </div>

        <div className="absolute inset-8 animate-[spin_12s_linear_infinite]">
          {/* Packet 3: Betslip Engine */}
          <div className="absolute -right-6 top-1/3 bg-purple-500/10 border border-purple-500/30 px-2 py-0.8 rounded-lg text-[7px] font-black text-purple-400 flex items-center gap-1 shadow-md whitespace-nowrap">
            <Database size={8} />
            <span>SLIP OK</span>
          </div>
        </div>

        {/* Inner compile progress ring */}
        <div className="absolute inset-11 rounded-full border border-double border-black/15 dark:border-white/10 flex items-center justify-center bg-black/15 dark:bg-black/40 shadow-inner">
          
          {/* Neon spinner arc */}
          <div className="absolute inset-0 rounded-full border-t-2 border-[#3de796] animate-spin" />
          
          {/* Core soccer ball icon pulsing */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0f111a] to-[#1e293b] border border-black/15 dark:border-white/10 flex items-center justify-center shadow-2xl relative z-10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#3de796] animate-[pulse_2s_infinite]">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.45 0 2.8.38 4 1.04l-1.46 2.01L12 6.55 9.46 7.05 8 5.04C9.2 4.38 10.55 4 12 4zM4.77 7.74l1.62 2.23.01.01-.2 2.58-2.17 1.04c-.65-1.16-1.03-2.48-1.03-3.9 0-.71.1-1.39.27-2.04l1.5-1.92zm7.23 8.35c-1.4 0-2.58-.96-2.92-2.27l1.92-1.47h2l1.92 1.47c-.34 1.31-1.52 2.27-2.92 2.27zm6.38-2.61l-2.17-1.04-.2-2.58 1.63-2.24 1.5 1.92c.17.65.27 1.33.27 2.04 0 1.42-.38 2.74-1.03 3.9zM6.92 19.34C5.1 18.23 3.73 16.5 3 14.47l2.25-1.08 1.83 1.4c.27 1 .91 1.83 1.77 2.33l-1.93 2.22zm10.16 0l-1.93-2.22c.86-.5 1.5-1.33 1.77-2.33l1.83-1.4 2.25 1.08c-.73 2.03-2.1 3.76-3.92 4.87z" />
            </svg>
          </div>
        </div>

        {/* Small floating percentage tag below core */}
        <div className="absolute -bottom-1 bg-white dark:bg-[#171a25] border border-black/15 dark:border-white/10 px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-wider text-slate-900 dark:text-white flex items-center gap-1 shadow-md">
          <Cpu size={8} className="text-[#3de796]" />
          <span>85% COMPILED</span>
        </div>
      </div>

      {/* 3. COMPACT WHITELIST MODULE */}
      <div className="w-full max-w-sm bg-[#11131c]/60 border border-black/10 dark:border-white/5 rounded-2xl p-5 backdrop-blur-xl relative z-10 shadow-2xl">
        {!isWhitelisted ? (
          <form onSubmit={handleWhitelist} className="space-y-3">
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter email for launch whitelist" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/10 dark:bg-black/30 border border-black/10 dark:border-white/5 hover:border-black/15 dark:border-white/10 focus:border-[#3de796]/30 text-xs rounded-xl px-3.5 py-2.5 w-full text-slate-900 dark:text-white outline-none transition-all placeholder:text-[#6b7280] font-medium"
              />
              <button 
                type="submit"
                className="bg-[#3de796] hover:bg-[#5cf2aa] text-white dark:text-[#0f111a] px-4.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 cursor-pointer border-0 shrink-0 flex items-center gap-1"
              >
                <span>Join</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-3 py-1 px-1">
            <div className="w-8 h-8 rounded-lg bg-[#3de796]/10 text-[#3de796] flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">You're on the Whitelist!</div>
              <p className="text-[9px] text-slate-500 dark:text-text-muted truncate mt-0.5">Notifying <code className="text-[#3de796] font-bold">{email}</code> at launch.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
