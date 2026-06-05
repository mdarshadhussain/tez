import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Award } from 'lucide-react';

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
    
    // Quick validation: must claim sequentially
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
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Banner */}
      <div
        className="frosted-card"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.1) 0%, rgba(22, 22, 26, 0.8) 100%)',
          border: '1px solid rgba(255, 107, 0, 0.2)',
          padding: '20px',
          textAlign: 'center',
          borderRadius: '20px',
          marginBottom: '20px'
        }}
      >
        <Calendar size={40} color="var(--action-highlight)" style={{ margin: '0 auto 8px' }} />
        <span
          style={{
            color: 'var(--action-highlight)',
            fontWeight: 800,
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          Daily Retention Tasks
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
          STREAKS & MILESTONES
        </h1>
        <p style={{ color: '#8A8A93', fontSize: '12px', marginTop: '8px' }}>
          Claim micro-rewards everyday. Unlock bonuses as you hit turnover milestones.
        </p>
      </div>

      {/* 7 Day Streak */}
      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '0.5px' }}>
        7-DAY SIGNIN STREAK
      </h2>
      
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px'
        }}
      >
        {streakDays.map((day, idx) => (
          <div
            key={day.day}
            onClick={() => claimStreak(idx)}
            className="frosted-card"
            style={{
              flexShrink: 0,
              width: '75px',
              textAlign: 'center',
              margin: 0,
              padding: '12px 6px',
              cursor: day.claimed ? 'default' : 'pointer',
              border: day.claimed ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid var(--border-glass)',
              background: day.claimed ? 'rgba(0, 229, 255, 0.03)' : 'rgba(22, 22, 26, 0.8)'
            }}
          >
            <div style={{ fontSize: '11px', color: '#8A8A93' }}>Day {day.day}</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
              ₹{day.bonus}
            </div>
            <div style={{ marginTop: '8px' }}>
              {day.claimed ? (
                <CheckCircle2 size={16} color="var(--success-layer)" style={{ margin: '0 auto' }} />
              ) : (
                <Clock size={16} color="#8a8a93" style={{ margin: '0 auto' }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '0.5px' }}>
        ACTIVE MILESTONES
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {milestones.map((m) => (
          <div key={m.id} className="frosted-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{m.desc}</div>
              <div style={{ fontSize: '11px', color: 'var(--success-layer)', marginTop: '4px' }}>
                Progress: {m.progress}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--vip-status)',
                  marginBottom: '6px'
                }}
              >
                +₹{m.bonus}
              </span>
              <button
                disabled={m.claimed}
                onClick={() => claimMilestone(m.id)}
                style={{
                  background: m.claimed ? 'rgba(255,255,255,0.02)' : 'var(--action-highlight)',
                  border: 'none',
                  borderRadius: '6px',
                  color: m.claimed ? '#666' : '#fff',
                  fontSize: '11px',
                  padding: '6px 10px',
                  fontWeight: 700,
                  cursor: m.claimed ? 'default' : 'pointer'
                }}
              >
                {m.claimed ? 'Claimed' : 'Simulate Claim'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
