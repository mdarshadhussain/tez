import React, { useState, useEffect } from 'react';
import { playClick } from '../utils/audio';

const gamesList = [
  { id: 'crash', name: 'Aviator', provider: 'Spribe', image: '/aviator_plane.png', players: 2847, tag: 'HOT' },
  { id: 'mines', name: 'Mines', provider: 'Spribe', image: '/mines.png', players: 1923, tag: 'TOP' },
  { id: 'plinko', name: 'Plinko', provider: 'Spribe', image: '/plinko.png', players: 1456, tag: '' },
  { id: 'dice', name: 'Dice', provider: 'Spribe', image: '/dice.png', players: 1102, tag: '' },
  { id: 'hilo', name: 'Hi-Lo', provider: 'Spribe', image: '/hilo.png', players: 876, tag: 'NEW' },
  { id: 'keno', name: 'Keno', provider: 'Spribe', image: '/keno.png', players: 734, tag: '' },
  { id: 'goal', name: 'Goal', provider: 'Spribe', image: '/goal.png', players: 654, tag: '' },
  { id: 'hotline', name: 'Hotline', provider: 'Spribe', image: '/hotline.png', players: 543, tag: '' },
  { id: 'chicken', name: 'Chicken', provider: 'Spribe', image: '/gold_crown.png', players: 1120, tag: 'NEW' },
  { id: 'wingo', name: 'WinGo', provider: 'TezClub', image: '/wingo.png', players: 3210, tag: 'LIVE' },
  { id: 'limbo', name: 'Limbo', provider: 'Spribe', image: '/limbo.png', players: 987, tag: '' },
  { id: 'roulette', name: 'Roulette', provider: 'TezClub', image: '/roulette.png', players: 1589, tag: '' },
  { id: 'coin', name: 'Coin Flip', provider: 'TezClub', image: '/coinflip.png', players: 2103, tag: '' },
  { id: 'bigsmall', name: 'Big Small', provider: 'TezClub', image: '/bigsmall.png', players: 1876, tag: '' },
  { id: 'trx', name: 'TRX Hash', provider: 'TezClub', image: '/trx.png', players: 1345, tag: 'CRYPTO' },
];

const winData = [
  { user: '998***41', game: 'Aviator', amount: '₹4,500', mult: 'x12.5' },
  { user: '812***89', game: 'Mines', amount: '₹12,400', mult: 'x48.2' },
  { user: '701***23', game: 'WinGo', amount: '₹850', mult: 'x2.0' },
  { user: '900***56', game: 'Plinko', amount: '₹3,200', mult: 'x8.5' },
  { user: '944***12', game: 'Coin Flip', amount: '₹1,500', mult: 'x1.96' },
  { user: '888***90', game: 'Limbo', amount: '₹75,000', mult: 'x150' },
  { user: '912***78', game: 'Roulette', amount: '₹6,000', mult: 'x14' },
  { user: '956***04', game: 'TRX Hash', amount: '₹9,800', mult: 'x9.8' },
];

export default function Home({ setGameMode }) {
  const [filter, setFilter] = useState('all');
  const [hoveredId, setHoveredId] = useState(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [wins, setWins] = useState(winData);

  // Auto banner rotation
  useEffect(() => {
    const t = setInterval(() => setBannerIdx(p => (p + 1) % 3), 5000);
    return () => clearInterval(t);
  }, []);

  // Live wins ticker
  useEffect(() => {
    const t = setInterval(() => {
      const g = gamesList[Math.floor(Math.random() * gamesList.length)];
      const w = {
        user: `${Math.floor(Math.random() * 300 + 700)}***${Math.floor(Math.random() * 90 + 10)}`,
        game: g.name,
        amount: `₹${(Math.random() * 15000 + 100).toFixed(0)}`,
        mult: `x${(Math.random() * 50 + 1.2).toFixed(1)}`
      };
      setWins(p => [w, ...p.slice(0, 7)]);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const filters = [
    { key: 'all', label: 'All Games' },
    { key: 'spribe', label: 'Spribe' },
    { key: 'tezclub', label: 'TezClub' },
    { key: 'popular', label: 'Popular' },
  ];

  const filtered = filter === 'all' ? gamesList
    : filter === 'spribe' ? gamesList.filter(g => g.provider === 'Spribe')
    : filter === 'tezclub' ? gamesList.filter(g => g.provider === 'TezClub')
    : gamesList.filter(g => g.players > 1500);

  const banners = [
    { title: 'GET +500% ON FIRST DEPOSIT', sub: 'Start winning big with our welcome bonus package', btn: 'Get Bonus', img: '/banner_welcome.png', accent: '#2ee65a', bg: 'linear-gradient(135deg, #0a2a15 0%, #1a1a2e 50%, #0d3320 100%)' },
    { title: 'AVIATOR TOURNAMENT', sub: 'Win ₹5,00,000 in weekly Aviator competition', btn: 'Join Now', img: '/banner_sport.png', accent: '#3b82f6', bg: 'linear-gradient(135deg, #0a1a2e 0%, #1a1a2e 50%, #0d1a33 100%)' },
    { title: 'DAILY CASHBACK UP TO 30%', sub: 'Get instant cashback on every bet you place', btn: 'Learn More', img: '/aviator_plane.png', accent: '#f59e0b', bg: 'linear-gradient(135deg, #2a1a0a 0%, #1a1a2e 50%, #33200d 100%)' },
  ];

  const b = banners[bannerIdx];

  // Styles
  const s = {
    page: { padding: '20px 24px', position: 'relative', minHeight: '100%' },
    section: { marginBottom: '28px' },
    sectionTitle: { fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    sectionCount: { fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' },
  };

  return (
    <div style={s.page}>

      {/* ══════ HERO BANNER ══════ */}
      <div style={s.section}>
        <div style={{
          background: b.bg,
          borderRadius: 'var(--radius-lg)',
          padding: '36px 40px',
          minHeight: '200px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${b.accent}15`,
          transition: 'all 0.5s ease',
          cursor: 'default'
        }}>
          {/* Left */}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '50%' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: '10px' }}>
              {b.title}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              {b.sub}
            </p>
            <button
              onClick={() => { playClick(); alert('Promo coming soon!'); }}
              style={{
                background: b.accent, color: '#000', border: 'none',
                borderRadius: 'var(--radius-sm)', padding: '10px 24px',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                boxShadow: `0 4px 20px ${b.accent}30`, transition: 'all 0.15s ease',
                fontFamily: 'var(--font-primary)'
              }}
            >
              {b.btn}
            </button>
          </div>

          {/* Right Image */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <img
              src={b.img}
              alt="promo"
              style={{ maxHeight: '160px', maxWidth: '260px', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}
            />
          </div>

          {/* Decorative */}
          <div style={{ position: 'absolute', right: '-50px', bottom: '-50px', width: '250px', height: '250px', borderRadius: '50%', background: `radial-gradient(circle, ${b.accent}08, transparent 70%)`, pointerEvents: 'none' }} />
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
          {banners.map((_, i) => (
            <div
              key={i}
              onClick={() => setBannerIdx(i)}
              style={{
                width: bannerIdx === i ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: bannerIdx === i ? banners[i].accent : 'rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* ══════ LIVE WINS TICKER ══════ */}
      <div style={{
        ...s.section,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '8px 0'
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to right, var(--bg-card), transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to left, var(--bg-card), transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div className="ticker-track" style={{ paddingLeft: '12px' }}>
          {[...wins, ...wins].map((w, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '4px 12px', marginRight: '8px', whiteSpace: 'nowrap',
              fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.02)', borderRadius: '6px'
            }}>
              <span style={{ color: 'var(--text-dim)' }}>{w.user}</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{w.game}</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{w.amount}</span>
              <span style={{ color: 'var(--accent-orange)', fontWeight: 700, fontSize: '11px' }}>{w.mult}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════ FILTER TABS ══════ */}
      <div style={{ ...s.section, marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => { playClick(); setFilter(f.key); }}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                border: filter === f.key ? '1px solid rgba(46,230,90,0.25)' : '1px solid var(--border-color)',
                background: filter === f.key ? 'rgba(46,230,90,0.08)' : 'var(--bg-card)',
                color: filter === f.key ? '#fff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--font-primary)'
              }}
            >
              {f.label}
            </button>
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-green)' }}>
              {gamesList.reduce((a, g) => a + g.players, 0).toLocaleString()} online
            </span>
          </div>
        </div>
      </div>

      {/* ══════ GAMES GRID ══════ */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span>{filter === 'all' ? 'All Games' : filter === 'spribe' ? 'Spribe Originals' : filter === 'tezclub' ? 'TezClub Originals' : 'Most Popular'}</span>
          <span style={s.sectionCount}>{filtered.length} games</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
          gap: '12px'
        }}>
          {filtered.map(game => (
            <div
              key={game.id}
              onClick={() => { playClick(); setGameMode(game.id); }}
              onMouseEnter={() => setHoveredId(game.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: `1px solid ${hoveredId === game.id ? 'rgba(46,230,90,0.2)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: hoveredId === game.id ? 'translateY(-4px)' : 'none',
                boxShadow: hoveredId === game.id ? '0 12px 32px rgba(0,0,0,0.4)' : 'var(--shadow-card)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Image area */}
              <div style={{
                width: '100%',
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <img
                  src={game.image}
                  alt={game.name}
                  style={{
                    maxWidth: '80%',
                    maxHeight: '110px',
                    objectFit: 'contain',
                    transition: 'transform 0.25s ease',
                    transform: hoveredId === game.id ? 'scale(1.08)' : 'scale(1)',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))'
                  }}
                />

                {/* Tag badge */}
                {game.tag && (
                  <span style={{
                    position: 'absolute', top: '8px', left: '8px',
                    fontSize: '9px', fontWeight: 700,
                    background: game.tag === 'HOT' ? 'var(--accent-red)'
                      : game.tag === 'NEW' ? 'var(--accent-green)'
                      : game.tag === 'TOP' ? 'var(--accent-orange)'
                      : game.tag === 'LIVE' ? 'var(--accent-red)'
                      : game.tag === 'CRYPTO' ? 'var(--accent-purple)'
                      : 'var(--accent-blue)',
                    color: '#fff', padding: '2px 7px', borderRadius: '4px',
                    letterSpacing: '0.5px', textTransform: 'uppercase'
                  }}>
                    {game.tag}
                  </span>
                )}

                {/* Play overlay on hover */}
                {hoveredId === game.id && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.15s ease'
                  }}>
                    <div style={{
                      background: 'var(--accent-green)',
                      color: '#000',
                      padding: '8px 20px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 700,
                      boxShadow: '0 4px 15px var(--accent-green-glow)'
                    }}>
                      Play Now
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>
                  {game.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-dim)' }}>
                    {game.provider}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
                    {game.players.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════ QUICK LINKS SECTION ══════ */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span>Quick Access</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Deposit', icon: '💳', desc: 'Add funds instantly', color: 'var(--accent-green)' },
            { label: 'Withdraw', icon: '🏧', desc: 'Cash out winnings', color: 'var(--accent-blue)' },
            { label: 'Bonuses', icon: '🎁', desc: 'Claim your rewards', color: 'var(--accent-orange)' },
            { label: 'Support', icon: '💬', desc: '24/7 live chat', color: 'var(--accent-cyan)' },
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => { playClick(); alert(`${item.label} - Coming soon!`); }}
              style={{
                padding: '18px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                background: `${item.color}10`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px', flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{item.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════ STATS BAR ══════ */}
      <div style={s.section}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px'
        }}>
          {[
            { label: 'Total Bets', value: '2.4M+', color: 'var(--accent-green)' },
            { label: 'Total Won', value: '₹18.5Cr', color: 'var(--accent-orange)' },
            { label: 'Active Now', value: '24,567', color: 'var(--accent-blue)' },
            { label: 'Games', value: '14+', color: 'var(--accent-purple)' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════ FOOTER ══════ */}
      <div style={{
        padding: '24px 0 16px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {['Provably Fair', '24/7 Support', 'Instant Payouts', 'Crypto Ready', 'Licensed'].map(item => (
            <span key={item} style={{
              fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)',
              padding: '4px 12px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)'
            }}>
              {item}
            </span>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
          TezClub is a licensed online gaming platform. All games are provably fair and independently audited. Play responsibly. 18+ only.
        </p>
      </div>
    </div>
  );
}
