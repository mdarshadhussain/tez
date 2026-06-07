'use client';
import React, { useState, useRef } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playWinChime, playLossSound, playClick, playDiamondSound, playBombSound } from '../utils/audio';
const GemIcon = ({ size = 28, glow = false, dim = false }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ filter: glow ? 'drop-shadow(0 0 8px #3de796)' : dim ? 'brightness(0.35)' : 'none', transition: 'filter 0.3s' }}>
    <polygon points="20,4 36,14 36,26 20,36 4,26 4,14" fill={dim ? 'rgba(61,231,150,0.15)' : 'rgba(61,231,150,0.18)'} stroke={dim ? 'rgba(61,231,150,0.3)' : '#3de796'} strokeWidth="1.5" />
    <polygon points="20,4 28,14 20,14 12,14" fill={dim ? 'rgba(61,231,150,0.1)' : 'rgba(255,255,255,0.35)'} />
    <polygon points="12,14 20,14 20,36" fill={dim ? 'rgba(61,231,150,0.08)' : 'rgba(61,231,150,0.7)'} />
    <polygon points="28,14 20,36 20,14" fill={dim ? 'rgba(61,231,150,0.12)' : 'rgba(61,231,150,0.9)'} />
    <polygon points="4,14 12,14 20,36" fill={dim ? 'rgba(61,231,150,0.06)' : 'rgba(61,231,150,0.5)'} />
    <polygon points="36,14 20,36 28,14" fill={dim ? 'rgba(61,231,150,0.09)' : 'rgba(61,231,150,0.6)'} />
  </svg>
);

const MineIcon = ({ size = 28, dim = false }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ filter: dim ? 'brightness(0.5) contrast(0.8)' : 'none', opacity: dim ? 0.75 : 1, transition: 'filter 0.3s' }}>
    {/* Explosion rays */}
    {[0,45,90,135,180,225,270,315].map((deg, i) => (
      <line key={i}
        x1={20 + Math.cos(deg * Math.PI / 180) * 10}
        y1={20 + Math.sin(deg * Math.PI / 180) * 10}
        x2={20 + Math.cos(deg * Math.PI / 180) * 18}
        y2={20 + Math.sin(deg * Math.PI / 180) * 18}
        stroke={dim ? 'rgba(239, 68, 68, 0.4)' : '#ef4444'} strokeWidth="2.5" strokeLinecap="round"
      />
    ))}
    {/* Core */}
    <circle cx="20" cy="20" r="9" fill={dim ? 'url(#mineGradDim)' : 'url(#mineGrad)'} />
    <defs>
      <radialGradient id="mineGrad" cx="35%" cy="30%">
        <stop offset="0%" stopColor="#ff6b35" />
        <stop offset="60%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </radialGradient>
      <radialGradient id="mineGradDim" cx="35%" cy="30%">
        <stop offset="0%" stopColor="rgba(255, 107, 53, 0.4)" />
        <stop offset="60%" stopColor="rgba(220, 38, 38, 0.4)" />
        <stop offset="100%" stopColor="rgba(127, 29, 29, 0.4)" />
      </radialGradient>
    </defs>
    <circle cx="17" cy="17" r="2.5" fill={dim ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)'} />
  </svg>
);


export default function Mines({ token, playableBalance, setPlayableBalance, isDemo }) {
  const GRID_SIZES = [25, 36, 49, 64];
  const GRID_COLS  = { 25: 5, 36: 6, 49: 7, 64: 8 };

  const [betTab, setBetTab]           = useState('manual');
  const [betAmount, setBetAmount]     = useState('50');
  const [mineCount, setMineCount]     = useState(3);
  const [gridSize, setGridSize]       = useState(25);
  const [gameActive, setGameActive]   = useState(false);
  const [gameOver, setGameOver]       = useState(false);
  const [hitMine, setHitMine]         = useState(false);

  const [grid, setGrid]               = useState(() => Array(25).fill(null).map(() => ({ revealed: false, isMine: false, isHit: false })));
  const [revealedCount, setRevealedCount] = useState(0);
  const [multiplier, setMultiplier]   = useState(1.00);
  const [minesList, setMinesList]     = useState([]);

  // Popup
  const [showPopup, setShowPopup]     = useState(false);
  const [popupData, setPopupData]     = useState({ won: false, amount: 0 });

  // Autoplay states
  const [autoplayActive, setAutoplayActive] = useState(false);
  const [selectedAutoplayTiles, setSelectedAutoplayTiles] = useState([]);
  const [numberOfBets, setNumberOfBets] = useState('20');
  const autoplayRunningRef = useRef(false);

  const cols = GRID_COLS[gridSize];

  // Gem count = total safe tiles
  const gemCount = gridSize - mineCount;
  // Remaining safe tiles unrevealed
  const remainingGems = gemCount - revealedCount;

  const getMultiplier = (mines, revealed, total) => {
    let waysToWin = 1, totalComb = 1;
    for (let i = 0; i < revealed; i++) {
      waysToWin *= (total - mines - i);
      totalComb *= (total - i);
    }
    const prob = waysToWin / totalComb;
    return parseFloat((0.98 / prob).toFixed(4));
  };

  const multiplyBet = (f) => {
    playClick();
    setBetAmount(prev => {
      const v = parseFloat(prev);
      return Math.max(10, Math.round(isNaN(v) ? 50 : v * f)).toString();
    });
  };

  const resetGrid = (size, mines, minePositions) => {
    return Array(size).fill(null).map((_, i) => ({
      revealed: false,
      isMine: minePositions[i] === true,
      isHit: false,
    }));
  };

  const startGame = async () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');
    if (mineCount >= gridSize) return alert('Too many mines!');

    playClick();

    if (isDemo) {
      const mines = Array(gridSize).fill(false);
      let placed = 0;
      while (placed < mineCount) {
        const idx = Math.floor(Math.random() * gridSize);
        if (!mines[idx]) { mines[idx] = true; placed++; }
      }
      setPlayableBalance(prev => prev - amt);
      setMinesList(mines);
      setGrid(resetGrid(gridSize, mineCount, mines));
      setRevealedCount(0);
      setMultiplier(1.00);
      setGameActive(true);
      setGameOver(false);
      setHitMine(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/games/mines/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bet_amount: amt, mine_count: mineCount })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
        setMinesList(data.mines);
        setGrid(resetGrid(gridSize, mineCount, data.mines));
        setRevealedCount(0);
        setMultiplier(1.00);
        setGameActive(true);
        setGameOver(false);
        setHitMine(false);
      } else { alert(data.error); }
    } catch (e) { console.error(e); }
  };

  const selectTile = async (index) => {
    if (betTab === 'autoplay') {
      if (gameActive || autoplayActive) return;
      playClick();
      setSelectedAutoplayTiles(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
      return;
    }

    if (!gameActive || gameOver || grid[index].revealed) return;

    const newGrid = grid.map((t, i) => i === index ? { ...t, revealed: true } : t);

    if (newGrid[index].isMine) {
      // Reveal all tiles on mine hit
      const finalGrid = newGrid.map(t => ({ ...t, revealed: true, isHit: false }));
      finalGrid[index] = { ...finalGrid[index], isHit: true };
      setGrid(finalGrid);
      setGameActive(false);
      setGameOver(true);
      setHitMine(true);
      playBombSound();
      playLossSound();

      if (!isDemo) {
        await fetch('http://localhost:3001/api/games/record-bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ game: 'mines', bet_amount: parseFloat(betAmount), payout_multiplier: 0, payout_amount: 0, is_won: false, raw_selection: { mineCount, revealed: revealedCount + 1 } })
        }).catch(console.error);
      }

      setPopupData({ won: false, amount: parseFloat(betAmount) });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } else {
      const newRevealed = revealedCount + 1;
      const newMult = getMultiplier(mineCount, newRevealed, gridSize);
      setRevealedCount(newRevealed);
      setMultiplier(newMult);
      setGrid(newGrid);
      playDiamondSound();
    }
  };

  const startAutoplay = async () => {
    if (selectedAutoplayTiles.length === 0) return;
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    playClick();
    setAutoplayActive(true);
    autoplayRunningRef.current = true;

    let betsRemaining = numberOfBets === '∞' ? Infinity : parseInt(numberOfBets) || 20;

    while (betsRemaining > 0 && autoplayRunningRef.current) {
      if (parseFloat(betAmount) > playableBalance) {
        alert('Insufficient balance to continue autoplay.');
        break;
      }

      let mines = [];
      if (isDemo) {
        mines = Array(gridSize).fill(false);
        let placed = 0;
        while (placed < mineCount) {
          const idx = Math.floor(Math.random() * gridSize);
          if (!mines[idx]) { mines[idx] = true; placed++; }
        }
        setPlayableBalance(prev => prev - parseFloat(betAmount));
        setMinesList(mines);
        setGrid(resetGrid(gridSize, mineCount, mines));
        setRevealedCount(0);
        setMultiplier(1.00);
        setGameActive(true);
        setGameOver(false);
        setHitMine(false);
      } else {
        try {
          const res = await fetch('http://localhost:3001/api/games/mines/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ bet_amount: amt, mine_count: mineCount })
          });
          const data = await res.json();
          if (data.success) {
            setPlayableBalance(data.balance);
            setMinesList(data.mines);
            setGrid(resetGrid(gridSize, mineCount, data.mines));
            setRevealedCount(0);
            setMultiplier(1.00);
            setGameActive(true);
            setGameOver(false);
            setHitMine(false);
            mines = data.mines;
          } else {
            alert(data.error);
            break;
          }
        } catch (e) {
          console.error(e);
          break;
        }
      }

      let hitBomb = false;
      let revealedSoFar = 0;
      let currentMult = 1.00;

      for (const tileIndex of selectedAutoplayTiles) {
        if (!autoplayRunningRef.current) break;
        await new Promise(r => setTimeout(r, 130));

        const isMine = mines[tileIndex] === true;
        if (isMine) {
          hitBomb = true;
          const finalGrid = Array(gridSize).fill(null).map((_, i) => ({
            revealed: true,
            isMine: mines[i] === true,
            isHit: i === tileIndex,
          }));
          setGrid(finalGrid);
          setGameActive(false);
          setGameOver(true);
          setHitMine(true);
          playBombSound();
          playLossSound();

          if (!isDemo) {
            await fetch('http://localhost:3001/api/games/record-bet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ game: 'mines', bet_amount: parseFloat(betAmount), payout_multiplier: 0, payout_amount: 0, is_won: false, raw_selection: { mineCount, revealed: revealedSoFar + 1 } })
            }).catch(console.error);
          }

          setPopupData({ won: false, amount: parseFloat(betAmount) });
          setShowPopup(true);
          await new Promise(r => setTimeout(r, 500));
          setShowPopup(false);
          break;
        } else {
          revealedSoFar++;
          currentMult = getMultiplier(mineCount, revealedSoFar, gridSize);
          setRevealedCount(revealedSoFar);
          setMultiplier(currentMult);
          setGrid(g => g.map((t, i) => i === tileIndex ? { ...t, revealed: true } : t));
          playDiamondSound();
        }
      }

      if (!hitBomb && autoplayRunningRef.current) {
        await new Promise(r => setTimeout(r, 100));
        const payout = parseFloat((parseFloat(betAmount) * currentMult).toFixed(2));
        setGameActive(false);
        setGameOver(true);
        setGrid(g => g.map(t => ({ ...t, revealed: true })));
        playWinChime();

        if (isDemo) {
          setPlayableBalance(prev => prev + payout);
          setPopupData({ won: true, amount: payout, mult: currentMult });
          setShowPopup(true);
          await new Promise(r => setTimeout(r, 500));
          setShowPopup(false);
        } else {
          try {
            const res = await fetch('http://localhost:3001/api/games/record-bet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ game: 'mines', bet_amount: parseFloat(betAmount), payout_multiplier: currentMult, payout_amount: payout, is_won: true, raw_selection: { mineCount, revealed: revealedSoFar } })
            });
            const data = await res.json();
            if (data.success) {
              setPlayableBalance(data.balance);
              setPopupData({ won: true, amount: payout, mult: currentMult });
              setShowPopup(true);
              await new Promise(r => setTimeout(r, 500));
              setShowPopup(false);
            }
          } catch (e) { console.error(e); }
        }
      }

      if (betsRemaining !== Infinity) {
        betsRemaining--;
        setNumberOfBets(betsRemaining.toString());
      }

      if (betsRemaining > 0 && autoplayRunningRef.current) {
        await new Promise(r => setTimeout(r, 330));
      }
    }

    setAutoplayActive(false);
    autoplayRunningRef.current = false;
  };

  const stopAutoplay = () => {
    playClick();
    autoplayRunningRef.current = false;
    setAutoplayActive(false);
  };

  const pickRandom = () => {
    if (!gameActive || gameOver) return;
    playClick();
    const unrevealed = grid.map((t, i) => (!t.revealed ? i : -1)).filter(i => i >= 0);
    if (unrevealed.length === 0) return;
    const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    selectTile(pick);
  };

  const cashOut = async () => {
    if (!gameActive || revealedCount === 0) return;
    const payout = parseFloat((parseFloat(betAmount) * multiplier).toFixed(2));
    setGameActive(false);
    setGameOver(true);
    setGrid(g => g.map(t => ({ ...t, revealed: true })));
    playWinChime();

    if (isDemo) {
      setPlayableBalance(prev => prev + payout);
      setPopupData({ won: true, amount: payout, mult: multiplier });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/games/record-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ game: 'mines', bet_amount: parseFloat(betAmount), payout_multiplier: multiplier, payout_amount: payout, is_won: true, raw_selection: { mineCount, revealed: revealedCount } })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
        setPopupData({ won: true, amount: payout, mult: multiplier });
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
      }
    } catch (e) { console.error(e); }
  };

  const betAmt = parseFloat(betAmount) || 0;
  const currentPayout = parseFloat((betAmt * multiplier).toFixed(2));
  const nextMult = getMultiplier(mineCount, revealedCount + 1, gridSize);
  const nextPayout = parseFloat((betAmt * nextMult).toFixed(2));

  // Header label
  const headerLabel = !gameActive && !gameOver
    ? 'FIRST GEM'
    : revealedCount === 0
    ? 'FIRST GEM'
    : 'NEXT GEM';
  const headerValue = revealedCount === 0 ? nextPayout : nextPayout;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', gap: 16, padding: 8, color: '#fff', fontFamily: 'sans-serif', position: 'relative' }}>
      <style>{`
        @keyframes gem-reveal {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(5deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes mine-reveal {
          0%   { transform: scale(0.3); opacity: 0; filter: brightness(0); }
          40%  { transform: scale(1.35); filter: brightness(2); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1);   opacity: 1; filter: brightness(1); }
        }
        @keyframes tile-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-4px); }
          40%     { transform: translateX(4px); }
          60%     { transform: translateX(-3px); }
          80%     { transform: translateX(3px); }
        }
        .gem-anim  { animation: gem-reveal  0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
        .mine-anim { animation: mine-reveal 0.45s ease forwards, tile-shake 0.4s 0.1s ease forwards; }
        .tile-hover:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 6px 20px rgba(61,231,150,0.15) !important;
        }
        .mines-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 4px; border-radius: 2px;
          background: linear-gradient(90deg, #3de796 0%, #3de796 var(--pct, 20%), #2a2d3e var(--pct, 20%), #2a2d3e 100%);
          outline: none; cursor: pointer;
        }
        .mines-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #3de796; border: 3px solid #1a1c2a;
          box-shadow: 0 0 8px rgba(61,231,150,0.5); cursor: pointer;
        }
        .mines-slider::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: #3de796; border: 3px solid #1a1c2a; cursor: pointer;
        }
      `}</style>

      {/* ═══════ LEFT SIDEBAR ═══════ */}
      <div style={{
        width: 270, flexShrink: 0,
        background: '#1a1c2a',
        borderRadius: 20, padding: '18px 16px',
        display: 'flex', flexDirection: 'column', gap: 14,
        border: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>

        {/* Manual / Autoplay tabs */}
        <div style={{
          display: 'flex',
          background: '#0f111a',
          borderRadius: 999,
          padding: 4,
          alignSelf: 'center',
          marginBottom: 4,
        }}>
          {['manual', 'autoplay'].map(tab => {
            const isActive = betTab === tab;
            return (
              <button key={tab} onClick={() => { playClick(); setBetTab(tab); }} disabled={gameActive || autoplayActive}
                style={{
                  padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: isActive ? '#152b22' : 'transparent',
                  color: isActive ? '#3de796' : '#525a70',
                  transition: 'all 0.2s',
                }}>
                {tab}
              </button>
            );
          })}
        </div>

        {/* Bet Amount */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: '#6b7890', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>BET AMOUNT <Info size={9} /></span>
            <span>{(playableBalance || 0).toFixed(2)} USDT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f111a', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.05)', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(61,231,150,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#3de796', fontWeight: 900, fontSize: 13 }}>$</span>
            </div>
            <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)}
              disabled={gameActive || autoplayActive}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontWeight: 800, fontSize: 13, flex: 1, minWidth: 0 }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {[['1/2', 0.5], ['X2', 2]].map(([l, f]) => (
                <button key={l} onClick={() => multiplyBet(f)} disabled={gameActive || autoplayActive}
                  style={{ background: '#26293b', border: 'none', borderRadius: 5, color: '#aaa', fontSize: 9, fontWeight: 800, padding: '4px 7px', cursor: 'pointer', opacity: (gameActive || autoplayActive) ? 0.4 : 1 }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Number of Mines slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#6b7890', textTransform: 'uppercase', letterSpacing: '0.08em' }}>NUMBER OF MINES</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f111a', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', minWidth: 16 }}>{mineCount}</span>
            <input
              type="range" min="1" max={Math.min(24, gridSize - 1)} value={mineCount}
              onChange={e => setMineCount(parseInt(e.target.value))}
              disabled={gameActive || autoplayActive}
              className="mines-slider"
              style={{ '--pct': `${((mineCount - 1) / (Math.min(24, gridSize - 1) - 1)) * 100}%` }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setMineCount(m => Math.max(1, m - 1))} disabled={gameActive || autoplayActive}
                style={{ width: 20, height: 20, borderRadius: 5, background: '#26293b', border: 'none', color: '#aaa', fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <button onClick={() => setMineCount(m => Math.min(gridSize - 1, m + 1))} disabled={gameActive || autoplayActive}
                style={{ width: 20, height: 20, borderRadius: 5, background: '#26293b', border: 'none', color: '#aaa', fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
        </div>

        {/* Number of Bets (Autoplay Mode only) */}
        {betTab === 'autoplay' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#6b7890', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Number of Bets</span>
            <div style={{ display: 'flex', alignItems: 'center', background: '#0f111a', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.05)', gap: 8 }}>
              <input type="text" value={numberOfBets} onChange={e => setNumberOfBets(e.target.value)}
                disabled={autoplayActive}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontWeight: 800, fontSize: 13, flex: 1, minWidth: 0 }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                {['20', '50', '∞'].map(v => (
                  <button key={v} onClick={() => { playClick(); setNumberOfBets(v); }} disabled={autoplayActive}
                    style={{ background: '#26293b', border: 'none', borderRadius: 5, color: numberOfBets === v ? '#3de796' : '#aaa', fontSize: 9, fontWeight: 800, padding: '4px 7px', cursor: 'pointer' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gems + Mines counters (Manual Mode only) */}
        {betTab === 'manual' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'GEMS', value: gameActive ? remainingGems : gemCount, icon: <GemIcon size={24} glow={false} />, color: '#3de796' },
              { label: 'MINES', value: mineCount, icon: <MineIcon size={24} />, color: '#ef4444' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#6b7890', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f111a', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{item.value}</span>
                  {item.icon}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current/Next profit (Manual Mode only, while game active) */}
        {betTab === 'manual' && gameActive && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Current Profit', usdt: `${currentPayout.toFixed(2)} USDT`, dollar: `$${currentPayout.toFixed(2)}`, mult: `x${multiplier.toFixed(2)}` },
              { label: 'Next Profit',    usdt: `${nextPayout.toFixed(2)} USDT`,    dollar: `$${nextPayout.toFixed(2)}`,    mult: `x${nextMult.toFixed(2)}` },
            ].map(row => (
              <div key={row.label} style={{ background: '#0f111a', borderRadius: 10, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 9, color: '#6b7890', fontWeight: 700, marginBottom: 4 }}>{row.label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(61,231,150,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#3de796', fontSize: 9, fontWeight: 900 }}>T</span>
                    </div>
                    <span style={{ color: '#3de796', fontWeight: 900, fontSize: 12 }}>{row.dollar}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 8, color: '#6b7890' }}>{row.usdt}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{row.mult}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* CTA Section */}
        {betTab === 'autoplay' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button disabled={autoplayActive}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 12, cursor: autoplayActive ? 'not-allowed' : 'pointer',
                fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                background: '#26293b', border: 'none', color: '#cbd5e1', opacity: autoplayActive ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              Configure Auto
            </button>
            {autoplayActive ? (
              <button onClick={stopAutoplay}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'linear-gradient(90deg, #ef4444, #f87171)',
                  color: '#fff',
                  boxShadow: '0 0 24px rgba(239,68,68,0.3)',
                  transition: 'all 0.2s',
                }}>
                Stop Autoplay
              </button>
            ) : (
              <button onClick={startAutoplay} disabled={selectedAutoplayTiles.length === 0}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: selectedAutoplayTiles.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: selectedAutoplayTiles.length === 0 ? '#26293b' : 'linear-gradient(90deg, #3de796, #2effb0)',
                  color: selectedAutoplayTiles.length === 0 ? '#6b7890' : '#0f111a',
                  boxShadow: selectedAutoplayTiles.length === 0 ? 'none' : '0 0 24px rgba(61,231,150,0.3)',
                  transition: 'all 0.2s',
                }}>
                Start Autoplay
              </button>
            )}
          </div>
        ) : (
          /* Manual CTAs */
          <>
            {gameActive && (
              <button onClick={pickRandom}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                  fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1',
                  transition: 'all 0.2s',
                  marginBottom: 8,
                }}
                onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; }}
              >
                Pick Random Tile
              </button>
            )}

            {gameActive ? (
              <button onClick={cashOut} disabled={revealedCount === 0}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: revealedCount === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: revealedCount === 0 ? '#26293b' : 'linear-gradient(90deg, #3de796, #2effb0)',
                  color: revealedCount === 0 ? '#6b7890' : '#0f111a',
                  boxShadow: revealedCount > 0 ? '0 0 24px rgba(61,231,150,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}>
                Cash Out
              </button>
            ) : (
              <button onClick={startGame}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'linear-gradient(90deg, #3de796, #2effb0)',
                  color: '#0f111a',
                  boxShadow: '0 0 24px rgba(61,231,150,0.3)',
                  transition: 'all 0.2s',
                }}>
                Start Playing
              </button>
            )}
          </>
        )}
      </div>

      {/* ═══════ RIGHT GAME AREA ═══════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '24px 0',
      }}>
        {/* Grid Container Box */}
        <div style={{
          position: 'relative',
          background: '#0f111a',
          border: '10px solid #161825',
          borderRadius: 28,
          padding: '24px 20px 20px 20px',
          width: '100%',
          maxWidth: cols <= 5 ? 420 : cols <= 6 ? 440 : cols <= 7 ? 460 : 480,
          boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Top Tab Header */}
          <div style={{
            position: 'absolute',
            top: -33,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#161825',
            padding: '6px 20px',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            fontWeight: 900,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            zIndex: 10,
          }}>
            <span style={{ color: '#fff' }}>{betTab === 'autoplay' && !autoplayActive ? 'SELECT TILES' : headerLabel}</span>
            {!(betTab === 'autoplay' && !autoplayActive) && (
              <span style={{ color: '#3de796', textShadow: '0 0 8px rgba(61,231,150,0.4)' }}>
                ${gameActive ? nextPayout.toFixed(2) : '0.00'}
              </span>
            )}
          </div>

          {/* Autoplay Instruction Overlay */}
          {betTab === 'autoplay' && selectedAutoplayTiles.length === 0 && !autoplayActive && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(11, 13, 23, 0.65)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              borderRadius: 22,
              pointerEvents: 'none',
              padding: 24,
            }}>
              <div style={{
                background: '#1b1d2a',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16,
                padding: '24px 20px',
                textAlign: 'center',
                maxWidth: 260,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, lineHeight: '1.4' }}>
                  Pick Tiles to Start Autoplay
                </div>
                <div style={{ fontSize: 10, color: '#6b7890', lineHeight: '1.5', fontWeight: 600 }}>
                  Pick tiles to begin autoplay. These same tiles will be used each round.
                </div>
              </div>
            </div>
          )}

          {/* Game grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: cols <= 5 ? 12 : cols <= 6 ? 10 : 8,
            width: '100%',
            alignContent: 'center',
          }}>
            {grid.map((tile, index) => {
              const isRevealed = tile.revealed;
              const isGem = isRevealed && !tile.isMine;
              const isMineHit = isRevealed && tile.isMine && tile.isHit;
              const isMineExposed = isRevealed && tile.isMine && !tile.isHit;
              const isSelectedAutoplay = betTab === 'autoplay' && selectedAutoplayTiles.includes(index);
              const isClickable = (gameActive && !isRevealed && !gameOver) || (betTab === 'autoplay' && !autoplayActive);

              let bg, border, shadow, cursor;
              if (isGem) {
                bg = 'linear-gradient(135deg, rgba(61,231,150,0.14) 0%, rgba(61,231,150,0.06) 100%)';
                border = '2px solid #3de796';
                shadow = '0 0 18px rgba(61,231,150,0.25), inset 0 0 8px rgba(61,231,150,0.08)';
                cursor = 'default';
              } else if (isMineHit) {
                bg = 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(185,28,28,0.15) 100%)';
                border = '2px solid #ef4444';
                shadow = '0 0 20px rgba(239,68,68,0.4)';
                cursor = 'default';
              } else if (isMineExposed) {
                bg = 'rgba(239,68,68,0.05)';
                border = '1.5px solid rgba(239,68,68,0.25)';
                shadow = 'none';
                cursor = 'default';
              } else if (isSelectedAutoplay && !isRevealed) {
                bg = 'rgba(61,231,150,0.05)';
                border = '2px solid #3de796';
                shadow = '0 0 14px rgba(61,231,150,0.15)';
                cursor = 'pointer';
              } else {
                bg = '#2c3144';
                border = '1.5px solid transparent';
                shadow = '0 2px 6px rgba(0,0,0,0.2)';
                cursor = isClickable ? 'pointer' : 'default';
              }

              return (
                <div
                  key={index}
                  onClick={() => selectTile(index)}
                  className={isClickable ? 'tile-hover' : ''}
                  style={{
                    aspectRatio: '1',
                    background: bg, border, borderRadius: cols <= 5 ? 16 : 12,
                    boxShadow: shadow, cursor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s ease',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {isGem && (
                    <div className="gem-anim">
                      <GemIcon size={cols <= 5 ? 28 : cols <= 6 ? 24 : 20} glow={true} />
                    </div>
                  )}
                  {isMineHit && (
                    <div className="mine-anim">
                      <MineIcon size={cols <= 5 ? 28 : cols <= 6 ? 24 : 20} />
                    </div>
                  )}
                  {isMineExposed && (
                    <MineIcon size={cols <= 5 ? 26 : 22} dim={true} />
                  )}
                  {isSelectedAutoplay && !isRevealed && (
                    <GemIcon size={cols <= 5 ? 20 : 16} dim={true} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Clear Picks Button */}
          {betTab === 'autoplay' && selectedAutoplayTiles.length > 0 && !autoplayActive && (
            <button onClick={() => { playClick(); setSelectedAutoplayTiles([]); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6b7890',
                fontSize: 10,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                marginTop: 16,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = '#6b7890'}
            >
              Clear Picks ({selectedAutoplayTiles.length})
            </button>
          )}
        </div>
      </div>

      {/* ═══════ RESULT POPUP ═══════ */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPopup(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, borderRadius: 20, cursor: 'pointer' }}
          >
            <motion.div
              initial={{ scale: 0.75, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.75, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{
                padding: 28, borderRadius: 24, textAlign: 'center', maxWidth: 280, width: '100%', margin: '0 16px', cursor: 'default',
                background: popupData.won ? 'linear-gradient(160deg, #1a2e26, #0d1713)' : 'linear-gradient(160deg, #2d1e22, #180f11)',
                border: `1px solid ${popupData.won ? 'rgba(61,231,150,0.3)' : 'rgba(239,68,68,0.3)'}`,
                boxShadow: popupData.won ? '0 24px 60px rgba(61,231,150,0.15)' : '0 24px 60px rgba(239,68,68,0.2)',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: popupData.won ? 'rgba(61,231,150,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${popupData.won ? 'rgba(61,231,150,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                {popupData.won ? <GemIcon size={32} glow={true} /> : <MineIcon size={32} />}
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {popupData.won ? 'Cashed Out!' : 'Boom! Mine Hit'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 14, fontWeight: 600 }}>
                {popupData.won ? `${popupData.mult}x multiplier` : `Better luck next time`}
              </div>
              <div style={{ background: 'rgba(15,17,26,0.6)', padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block' }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: popupData.won ? '#3de796' : '#ef4444' }}>
                  {popupData.won ? `+₹${popupData.amount.toFixed(2)}` : `-₹${popupData.amount.toFixed(2)}`}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
