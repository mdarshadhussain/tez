import React, { useState, useEffect } from 'react';
import { CircleDot, Flame, BarChart2, Layers, Gamepad2, Target, TrendingUp, Shuffle, DollarSign, Award, Gift, Crown } from 'lucide-react';
import { playClick } from '../utils/audio';

const gamesList = [
  { id: 'wingo', name: 'WinGo Color', desc: '1m & 3m countdown loops', icon: CircleDot, badge: 'MULTIPLAYER', color: 'var(--success-layer)' },
  { id: 'bigsmall', name: 'Big / Small', desc: 'Macro predictions 0-9', icon: BarChart2, badge: 'POPULAR', color: '#FF3B30' },
  { id: 'trx', name: 'TRX WinGo', desc: 'Verifiable TRON hash blocks', icon: Layers, badge: 'BLOCKCHAIN', color: 'var(--purple-accent)' },
  { id: 'crash', name: 'Crash Aviator', desc: 'Multiply vector curves', icon: Flame, badge: 'HOT', color: 'var(--action-highlight)' },
  { id: 'mines', name: 'Mines Field', desc: 'Grid block reveal mines', icon: Gamepad2, badge: 'SOLO x24', color: '#34C759' },
  { id: 'plinko', name: 'Plinko Board', desc: 'Orb drop physics bins', icon: Target, badge: 'PHYSICS', color: 'var(--vip-status)' },
  { id: 'limbo', name: 'Limbo Multiplier', desc: 'Aim targets and cashout', icon: TrendingUp, badge: 'RAPID', color: '#FF2D55' },
  { id: 'roulette', name: 'Double Roulette', desc: 'Horizontal slider spins', icon: Shuffle, badge: '15S TICK', color: '#00E5FF' },
  { id: 'dice', name: 'Dice Slider', desc: 'Probability odds slider', icon: DollarSign, badge: 'CUSTOM ODDS', color: '#34C759' },
  { id: 'coin', name: 'Coin Flip 3D', desc: 'Instant 3D 50/50 rotations', icon: CircleDot, badge: 'FAST INR', color: 'var(--action-highlight)' }
];

const tickerWins = [
  { user: '998****41', game: 'Mines Field', amount: '₹4,500.00', multiplier: 'x12.5', color: '#34C759' },
  { user: '812****89', game: 'Crash Aviator', amount: '₹12,400.00', multiplier: 'x48.2', color: 'var(--action-highlight)' },
  { user: '701****23', game: 'WinGo Color', amount: '₹850.00', multiplier: 'x2.0', color: 'var(--success-layer)' },
  { user: '900****56', game: 'Plinko Board', amount: '₹3,200.00', multiplier: 'x8.5', color: 'var(--vip-status)' },
  { user: '944****12', game: 'Coin Flip 3D', amount: '₹1,500.00', multiplier: 'x1.96', color: 'var(--action-highlight)' },
  { user: '888****90', game: 'Limbo Multiplier', amount: '₹75,000.00', multiplier: 'x150.0', color: '#ff2d55' },
  { user: '912****78', game: 'Double Roulette', amount: '₹6,000.00', multiplier: 'x14.0', color: '#00E5FF' },
  { user: '956****04', game: 'TRX WinGo', amount: '₹9,800.00', multiplier: 'x9.8', color: 'var(--purple-accent)' },
];

export default function Home({ setGameMode }) {
  const [tickerItems, setTickerItems] = useState(tickerWins);

  // Periodically generate simulated live wins to keep ticker fresh
  useEffect(() => {
    const interval = setInterval(() => {
      const randomUser = `${Math.floor(Math.random() * 300 + 700)}****${Math.floor(Math.random() * 90 + 10)}`;
      const randomGame = gamesList[Math.floor(Math.random() * gamesList.length)];
      const randomMult = (Math.random() * 10 + 1.2).toFixed(1);
      const randomAmt = (Math.random() * 4000 + 100).toFixed(2);
      
      const newWin = {
        user: randomUser,
        game: randomGame.name,
        amount: `₹${parseFloat(randomAmt).toLocaleString('en-IN')}`,
        multiplier: `x${randomMult}`,
        color: randomGame.color
      };

      setTickerItems((prev) => {
        const next = [...prev];
        next.pop();
        return [newWin, ...next];
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      
      {/* Hero Panel (Plump Layout) */}
      <div className="hero-card glowing-border-pink shimmer-card">
        
        {/* Animated Particles floating in the hero banner */}
        <div className="hero-particle float-anim" style={{ top: '15%', left: '38%', width: '10px', height: '10px', background: 'rgba(255, 0, 102, 0.4)', filter: 'blur(2px)' }} />
        <div className="hero-particle float-delayed-anim" style={{ top: '55%', left: '12%', width: '8px', height: '8px', background: 'rgba(0, 229, 255, 0.4)', filter: 'blur(1px)' }} />
        <div className="hero-particle float-fast-anim" style={{ top: '72%', left: '48%', width: '12px', height: '12px', background: 'rgba(212, 175, 55, 0.35)', filter: 'blur(2px)' }} />
        <div className="hero-particle float-anim" style={{ top: '22%', left: '78%', width: '6px', height: '6px', background: 'rgba(168, 38, 255, 0.5)' }} />

        {/* Left Info Column */}
        <div style={{ flex: 1, zIndex: 5, maxWidth: '500px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px' }}>
            Zero Forms.<br />
            <span style={{ color: 'var(--action-highlight)' }}>100% Action.</span>
          </h1>
          
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#9284ad' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crown size={16} color="var(--action-highlight)" />
              <span>Highest Rebate in Online iGaming</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crown size={16} color="var(--action-highlight)" />
              <span>Elite VIP Perks for High-Rollers</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crown size={16} color="var(--action-highlight)" />
              <span>Earn up to 62.5% Rakeback on Every Bet</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <button className="action-btn" onClick={() => { playClick(); alert('Ready! Start placing bets in the game matrix below.'); }}>
              Play Now
            </button>
            <button
              className="action-btn cyan-btn"
              onClick={() => { playClick(); alert('Verify signup instantly with our zero-KYC crypto wallet address mapping.'); }}
            >
              Verify Ledger
            </button>
          </div>

          {/* Crypto / Currency Floating Icons Row */}
          <div className="coin-row">
            {['₿', 'Ξ', '₮', '₹', 'SOL', 'ADA'].map((coin) => (
              <span key={coin} className="coin-icon float-fast-anim">{coin}</span>
            ))}
          </div>
        </div>

        {/* Right High-Fidelity Interactive Roulette Wheel Visual */}
        <div
          style={{
            width: '240px',
            height: '240px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5
          }}
          className="float-anim"
        >
          {/* Outer glowing spinning ring (Hot Pink) */}
          <div
            style={{
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              border: '6px solid var(--action-highlight)',
              boxShadow: '0 0 40px rgba(255, 0, 102, 0.3), inset 0 0 40px rgba(255, 0, 102, 0.3)',
              position: 'absolute'
            }}
            className="spin-slow"
          />
          {/* Inner detailed purple roulette graphics and slot illustration */}
          <div
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #200f40 0%, #090514 100%)',
              border: '8px solid var(--purple-accent)',
              boxShadow: '0 0 25px rgba(168, 38, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            <img
              src="/crypto_slots.png"
              alt="Crypto Slots"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Floating Background Glow (Pink/Purple) */}
        <div
          style={{
            position: 'absolute',
            right: '-10%',
            top: '-20%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(255, 0, 102, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Real-time Ticker of Lucky Winners */}
      <div className="ticker-container">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <div key={idx} className="ticker-item">
              <span style={{ color: '#9284ad' }}>{item.user}</span>
              <span style={{ color: '#fff', fontSize: '11px', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 6px', borderRadius: '6px' }}>{item.game}</span>
              <span className="win-amount">{item.amount}</span>
              <span style={{ color: item.color, fontWeight: 900 }}>{item.multiplier}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Promotional Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="frosted-card card-plump-hover glowing-border-cyan shimmer-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Crown size={24} color="var(--vip-status)" />
              <img
                src="/gold_crown.png"
                alt="Gold Crown"
                style={{ width: '55px', height: '55px', objectFit: 'contain' }}
                className="float-delayed-anim"
              />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginTop: '12px' }}>King of the Castle</h3>
            <p style={{ fontSize: '11px', color: '#9284ad', marginTop: '6px' }}>
              Become the weekly leader and claim from the ₹1,00,000 prize allocations pool.
            </p>
          </div>
          <button className="action-btn cyan-btn" style={{ padding: '10px', fontSize: '12px', marginTop: '16px', borderRadius: '14px' }}>
            Enter Challenge
          </button>
        </div>

        <div className="frosted-card card-plump-hover glowing-border-pink shimmer-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <TrendingUp size={24} color="var(--action-highlight)" />
              <span style={{ fontSize: '10px', color: 'var(--action-highlight)', background: 'rgba(255,0,102,0.1)', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>VIP ONLY</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginTop: '12px' }}>62.5% Rake Back</h3>
            <p style={{ fontSize: '11px', color: '#9284ad', marginTop: '6px' }}>
              Instant turnovers evaluation gives you the highest rebates in the industry.
            </p>
          </div>
          <button className="action-btn cyan-btn" style={{ padding: '10px', fontSize: '12px', marginTop: '16px', borderRadius: '14px' }}>
            Claim Rebate
          </button>
        </div>

        <div className="frosted-card card-plump-hover glowing-border-cyan shimmer-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Award size={24} color="var(--purple-accent)" />
              <span style={{ fontSize: '10px', color: 'var(--purple-accent)', background: 'rgba(168,38,255,0.1)', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>REWARDS</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginTop: '12px' }}>Unmatched Rewards</h3>
            <p style={{ fontSize: '11px', color: '#9284ad', marginTop: '6px' }}>
              Accumulate points to unlock Apple hardware and flight plans at the VIP tournaments.
            </p>
          </div>
          <button className="action-btn cyan-btn" style={{ padding: '10px', fontSize: '12px', marginTop: '16px', borderRadius: '14px' }}>
            View Milestones
          </button>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginBottom: '16px', letterSpacing: '0.5px' }}>
        ALL GAME MATRIX
      </h2>

      {/* Grid of games */}
      <div className="game-grid">
        {gamesList.map((g) => {
          const IconComponent = g.icon;
          return (
            <div
              key={g.id}
              onClick={() => setGameMode(g.id)}
              className="frosted-card card-plump-hover shimmer-card"
              style={{
                margin: 0,
                padding: '22px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '160px',
                border: '2px solid rgba(255, 0, 102, 0.05)',
                background: `linear-gradient(135deg, #170f2b 0%, rgba(23, 15, 43, 0.8) 60%, ${g.color}0d 100%)`,
                position: 'relative'
              }}
            >
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '10px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <IconComponent size={22} color={g.color} />
                </div>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: g.color,
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    letterSpacing: '0.5px',
                    border: '1px solid rgba(255, 255, 255, 0.02)'
                  }}
                >
                  {g.badge}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{g.name}</h3>
                <p style={{ fontSize: '11px', color: '#9284ad', marginTop: '5px' }}>{g.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
