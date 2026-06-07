'use client';

import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VIPTasks({ balance, setBalance }) {
  const [streakDays, setStreakDays] = useState([
    { day: 1, bonus: 10, claimed: true },
    { day: 2, bonus: 15, claimed: true },
    { day: 3, bonus: 20, claimed: false },
    { day: 4, bonus: 25, claimed: false },
    { day: 5, bonus: 30, claimed: false },
    { day: 6, bonus: 40, claimed: false },
    { day: 7, bonus: 100, claimed: false }
  ]);

  const [milestones, setMilestones] = useState([
    { id: 1, desc: 'Complete 35 rounds of Crash (₹50 min stake)', progress: '12 / 35', bonus: 150, claimed: false },
    { id: 2, desc: 'Place ₹500.00 total bets in WinGo', progress: '320 / 500', bonus: 80, claimed: false },
    { id: 3, desc: 'Uncover 15 diamond tiles in Mines', progress: '7 / 15', bonus: 50, claimed: false }
  ]);

  const claimStreak = (dayIdx) => {
    const day = streakDays[dayIdx];
    if (day.claimed) return;
    
    // must claim sequentially
    if (dayIdx > 0 && !streakDays[dayIdx - 1].claimed) {
      alert('Please claim previous days first!');
      return;
    }

    const newStreak = [...streakDays];
    newStreak[dayIdx].claimed = true;
    setStreakDays(newStreak);
    setBalance((prev) => prev + day.bonus);
    alert(`Streak Day ${day.day} claimed! ₹${day.bonus} added.`);
  };

  const claimMilestone = (id) => {
    const mile = milestones.find((m) => m.id === id);
    if (!mile || mile.claimed) return;

    // Simulate completion for testing
    const updated = milestones.map((m) => {
      if (m.id === id) {
        return { ...m, claimed: true, progress: 'Completed' };
      }
      return m;
    });
    setMilestones(updated);
    setBalance((prev) => prev + mile.bonus);
    alert(`Milestone claimed! ₹${mile.bonus} added.`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 pb-24 max-w-5xl mx-auto space-y-6"
    >
      {/* Banner */}
      <div className="bg-gradient-to-br from-accent-orange/10 via-zinc-950/80 to-zinc-950 border border-accent-orange/20 p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl">
        <Calendar size={48} className="text-accent-orange mx-auto mb-3" />
        <span className="text-accent-orange font-extrabold text-[10px] tracking-[4px] uppercase block mb-1">
          Daily Retention Tasks
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          STREAKS & MILESTONES
        </h1>
        <p className="text-text-muted text-xs md:text-sm max-w-md mx-auto mt-2 leading-relaxed">
          Claim micro-rewards everyday. Unlock larger bonuses as you hit operational milestones.
        </p>
      </div>

      {/* 7 Day Streak */}
      <div>
        <h2 className="text-xs font-black text-white tracking-widest uppercase mb-3">
          7-Day Sign-in Streak
        </h2>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {streakDays.map((day, idx) => (
            <motion.div
              whileHover={{ y: -2 }}
              key={day.day}
              onClick={() => claimStreak(idx)}
              className={`flex-shrink-0 w-24 text-center rounded-2xl border p-4 cursor-pointer transition-all duration-200 select-none ${
                day.claimed 
                  ? 'bg-accent-cyan/5 border-accent-cyan/20 text-accent-cyan' 
                  : 'bg-zinc-950/40 border-white/5 text-text-secondary hover:border-white/20'
              }`}
            >
              <div className="text-[10px] text-text-muted">Day {day.day}</div>
              <div className="font-extrabold text-sm text-white mt-1.5">
                ₹{day.bonus}
              </div>
              <div className="mt-3 flex justify-center">
                {day.claimed ? (
                  <CheckCircle2 size={16} className="text-accent-cyan animate-pulse" />
                ) : (
                  <Clock size={16} className="text-text-dim" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h2 className="text-xs font-black text-white tracking-widest uppercase mb-3">
          Active Game Milestones
        </h2>
        <div className="space-y-3">
          {milestones.map((m) => (
            <div 
              key={m.id} 
              className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl flex justify-between items-center hover:bg-zinc-950/60 transition-colors"
            >
              <div>
                <div className="font-bold text-white text-xs md:text-sm leading-snug">{m.desc}</div>
                <div className="text-[10px] text-accent-cyan mt-1 font-medium">
                  Progress: {m.progress}
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5">
                <span className="font-black text-xs text-accent-orange block">
                  +₹{m.bonus}
                </span>
                <button
                  disabled={m.claimed}
                  onClick={() => claimMilestone(m.id)}
                  className={`border-0 rounded-xl text-[10px] font-extrabold py-1.5 px-3 cursor-pointer transition-all ${
                    m.claimed 
                      ? 'bg-white/5 text-text-dim cursor-default' 
                      : 'bg-accent-orange hover:bg-accent-orange/80 text-white shadow-[0_0_10px_rgba(255,94,0,0.3)]'
                  }`}
                >
                  {m.claimed ? 'Claimed' : 'Claim Reward'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
