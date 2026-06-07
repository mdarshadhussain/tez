'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Info, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playWinChime, playLossSound, playClick } from '../utils/audio';

// ── Audio helpers ────────────────────────────────────────────────
function playSliderTick() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (_) {}
}

function playDiceRollSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    for (let i = 0; i < 7; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.07;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + Math.random() * 130, t);
      osc.frequency.exponentialRampToValueAtTime(70 + Math.random() * 50, t + 0.065);
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    }
    const clack = ctx.createOscillator();
    const cg = ctx.createGain();
    const ct = ctx.currentTime + 0.55;
    clack.type = 'sawtooth';
    clack.frequency.setValueAtTime(280, ct);
    clack.frequency.exponentialRampToValueAtTime(55, ct + 0.13);
    cg.gain.setValueAtTime(0.1, ct);
    cg.gain.exponentialRampToValueAtTime(0.001, ct + 0.14);
    clack.connect(cg);
    cg.connect(ctx.destination);
    clack.start(ct);
    clack.stop(ct + 0.15);
  } catch (_) {}
}

// ── Rounded hexagon badge ────────────────────────────────────────
// Uses a regular hexagon path with large strokeLinejoin='round' + pathLength trick
// to achieve fully rounded corners
function HexBadge({ value, color = '#ef4444', size = 72 }) {
  const fillColor = color === '#3de796'
    ? 'rgba(61,231,150,0.10)'
    : 'rgba(239,68,68,0.10)';
  // Rounded hexagon via path with bezier curves at each vertex
  const hex = 'M40,8 C46,8 72,24 74,30 C76,36 76,44 74,50 C72,56 46,72 40,72 C34,72 8,56 6,50 C4,44 4,36 6,30 C8,24 34,8 40,8 Z';
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 80 80" style={{ position: 'absolute', inset: 0 }}>
        <path
          d={hex}
          fill={fillColor}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner glow ring */}
        <path
          d={hex}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          strokeOpacity="0.3"
          transform="scale(0.88) translate(5.5, 5.5)"
        />
      </svg>
      <span style={{ fontWeight: 900, fontSize: size * 0.22, color: '#ffffff', fontFamily: 'monospace', zIndex: 1, letterSpacing: '-0.5px' }}>
        {value !== null ? value.toFixed(2) : ''}
      </span>
    </div>
  );
}

export default function Dice({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('50');
  const [sliderValue, setSliderValue] = useState(50);
  const [direction, setDirection] = useState('over');
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const [won, setWon] = useState(null);
  const [betTab, setBetTab] = useState('manual');
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [popupData, setPopupData] = useState({ won: false, amount: 0 });
  const [history, setHistory] = useState([]);

  // Autoplay
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [autoplayCount, setAutoplayCount] = useState('10');
  const autoplayRef = useRef({ active: false, remaining: 0 });

  // Slider tick throttle
  const lastTickRef = useRef(0);

  const getWinChance = () => direction === 'over' ? 100 - sliderValue : sliderValue;
  const getMultiplier = () => {
    const c = getWinChance();
    if (c <= 0) return 0;
    return parseFloat((98 / c).toFixed(4));
  };

  const mult = getMultiplier();
  const winChance = getWinChance();
  const betAmt = parseFloat(betAmount) || 0;
  const payoutOnWin = parseFloat((betAmt * mult).toFixed(2));
  const profit = parseFloat((payoutOnWin - betAmt).toFixed(2));

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value);
    setSliderValue(val);
    // throttled tick sound
    const now = Date.now();
    if (now - lastTickRef.current > 40) {
      playSliderTick();
      lastTickRef.current = now;
    }
  };

  const executeRoll = async (amt, m) => {
    setRolling(true);
    setShowResultPopup(false);
    playDiceRollSound();

    await new Promise(r => setTimeout(r, 700));

    const rolled = parseFloat((Math.random() * 100).toFixed(2));
    const isWon = direction === 'over' ? rolled > sliderValue : rolled < sliderValue;
    const payout = isWon ? parseFloat((amt * m).toFixed(2)) : 0;

    setRollResult(rolled);
    setWon(isWon);
    setHistory(prev => [rolled, ...prev].slice(0, 10));

    if (isDemo) {
      setPlayableBalance(prev => parseFloat((prev - amt + payout).toFixed(2)));
      setRolling(false);
      setPopupData({ won: isWon, amount: isWon ? payout : amt, rollResult: rolled });
      setShowResultPopup(true);
      setTimeout(() => setShowResultPopup(false), 2000);
      if (isWon) playWinChime(); else playLossSound();
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/games/record-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          game: 'dice', bet_amount: amt,
          payout_multiplier: isWon ? m : 0, payout_amount: payout,
          is_won: isWon, raw_selection: { sliderValue, direction, rolled }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
        setPopupData({ won: isWon, amount: isWon ? payout : amt, rollResult: rolled });
        setShowResultPopup(true);
        setTimeout(() => setShowResultPopup(false), 2000);
        if (isWon) playWinChime(); else playLossSound();
      }
    } catch (e) { console.error(e); }
    finally { setRolling(false); }
  };

  const rollDice = () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');
    const wc = getWinChance();
    if (wc <= 0 || wc >= 100) return alert('Invalid target');
    executeRoll(amt, mult);
  };

  const toggleAutoplay = () => {
    playClick();
    if (isAutoplayActive) { setIsAutoplayActive(false); autoplayRef.current.active = false; return; }
    const count = parseInt(autoplayCount);
    if (isNaN(count) || count <= 0) return alert('Enter valid autoplay count');
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet ₹10');
    if (amt > playableBalance) return alert('Insufficient balance');
    autoplayRef.current = { active: true, remaining: count };
    setIsAutoplayActive(true);
    const doRound = async () => {
      if (!autoplayRef.current.active || autoplayRef.current.remaining <= 0) {
        setIsAutoplayActive(false); autoplayRef.current.active = false; return;
      }
      if (parseFloat(betAmount) > playableBalance) {
        alert('Autoplay stopped: Insufficient balance');
        setIsAutoplayActive(false); autoplayRef.current.active = false; return;
      }
      autoplayRef.current.remaining -= 1;
      setAutoplayCount(String(autoplayRef.current.remaining));
      await executeRoll(parseFloat(betAmount), getMultiplier());
      if (autoplayRef.current.active && autoplayRef.current.remaining > 0) setTimeout(doRound, 350);
      else { setIsAutoplayActive(false); autoplayRef.current.active = false; }
    };
    doRound();
  };

  const multiplyBet = (f) => {
    playClick();
    setBetAmount(prev => {
      const v = parseFloat(prev);
      return Math.max(10, Math.round(isNaN(v) ? 50 : v * f)).toString();
    });
  };

  // % position for the "win value" label below track
  const winLabelPct = direction === 'over'
    ? sliderValue + (100 - sliderValue) * 0.5
    : sliderValue * 0.5;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', gap: 20, padding: 8, color: '#fff', fontFamily: 'sans-serif', position: 'relative' }}>
      <style>{`
        /* ── Two-tone slider ── */
        input[type=range].ds {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          width: 100%;
          cursor: pointer;
          position: absolute;
          top: 0; left: 0; height: 100%;
          margin: 0; padding: 0;
          opacity: 0;
          z-index: 10;
        }
        @keyframes hex-pop {
          0%   { transform: scale(0.6) translateY(-10px); opacity: 0; }
          60%  { transform: scale(1.12) translateY(2px);  opacity: 1; }
          100% { transform: scale(1)   translateY(0);     opacity: 1; }
        }
        .hex-pop { animation: hex-pop 0.4s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes hex-drag {
          0%   { transform: scaleX(1.18) scaleY(0.88); filter: blur(0.5px); }
          40%  { transform: scaleX(1.12) scaleY(0.90); filter: blur(0.3px); }
          100% { transform: scaleX(1)    scaleY(1);    filter: blur(0px);   }
        }
        .hex-drag { animation: hex-drag 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        @keyframes val-glow-green {
          0%,100% { text-shadow: 0 0 0 transparent; }
          50%      { text-shadow: 0 0 14px rgba(61,231,150,0.9); }
        }
        .val-glow { animation: val-glow-green 1.2s ease infinite; }
        @keyframes slide-in-right {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .pill-enter { animation: slide-in-right 0.3s ease forwards; }
      `}</style>

      {/* ═══════════ LEFT PANEL ═══════════ */}
      <div style={{
        width: 290, flexShrink: 0,
        background: '#1a1c2a',
        borderRadius: 24, padding: 20,
        display: 'flex', flexDirection: 'column', gap: 18,
        border: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#0f111a', borderRadius: 999, padding: 4, border: '1px solid rgba(255,255,255,0.04)' }}>
          {['manual', 'autoplay'].map(tab => (
            <button key={tab} onClick={() => { playClick(); setBetTab(tab); }}
              disabled={isAutoplayActive}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: betTab === tab ? '#26293b' : 'transparent',
                color: betTab === tab ? '#3de796' : '#6b7890',
                transition: 'all 0.2s', opacity: isAutoplayActive ? 0.5 : 1,
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Bet Amount */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#6b7890' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>BET AMOUNT <Info size={10} /></span>
            <span>{(playableBalance || 0).toFixed(2)} INR</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f111a', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#3de796', fontWeight: 700, fontSize: 12, marginRight: 8 }}>₹</span>
            <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)}
              disabled={rolling || isAutoplayActive}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontWeight: 800, fontSize: 12, flex: 1, minWidth: 0 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              {[['½', 0.5], ['2×', 2]].map(([lbl, f]) => (
                <button key={lbl} onClick={() => multiplyBet(f)} disabled={rolling || isAutoplayActive}
                  style={{ background: '#26293b', border: 'none', borderRadius: 6, color: '#fff', fontSize: 9, fontWeight: 900, padding: '6px 10px', cursor: 'pointer', opacity: (rolling || isAutoplayActive) ? 0.4 : 1 }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Autoplay count */}
        {betTab === 'autoplay' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#6b7890' }}>
              <span>NUMBER OF BETS</span><span>{autoplayCount} Rounds</span>
            </div>
            <div style={{ display: 'flex', background: '#0f111a', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.04)', gap: 4 }}>
              {['10', '25', '50', '100'].map(v => (
                <button key={v} onClick={() => { playClick(); setAutoplayCount(v); }} disabled={isAutoplayActive}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 900, background: autoplayCount === v ? '#26293b' : 'transparent', color: autoplayCount === v ? '#fff' : '#6b7890', opacity: isAutoplayActive ? 0.4 : 1 }}>
                  {v}
                </button>
              ))}
            </div>
            <input type="number" disabled={isAutoplayActive} value={autoplayCount} onChange={e => setAutoplayCount(e.target.value)}
              style={{ background: '#0f111a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontWeight: 800, fontSize: 12, outline: 'none', textAlign: 'center' }}
            />
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Multiplier', value: `${mult}×` },
            { label: 'Win Chance', value: `${winChance}%` },
            { label: 'Profit', value: `₹${profit}`, green: true },
          ].map(s => (
            <div key={s.label} style={{ background: '#0f111a', borderRadius: 12, padding: '10px 8px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#6b7890', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: s.green ? '#3de796' : '#fff' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Direction toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7890' }}>DIRECTION</div>
          <div style={{ display: 'flex', background: '#0f111a', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.04)', gap: 4 }}>
            {[['over', 'Roll Over ↑'], ['under', 'Roll Under ↓']].map(([val, label]) => (
              <button key={val} onClick={() => { playClick(); setDirection(val); }} disabled={rolling || isAutoplayActive}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 900, background: direction === val ? '#26293b' : 'transparent', color: direction === val ? '#3de796' : '#6b7890', opacity: (rolling || isAutoplayActive) ? 0.4 : 1 }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Action button */}
        {betTab === 'autoplay' ? (
          <button onClick={toggleAutoplay}
            style={{ width: '100%', padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', background: isAutoplayActive ? '#ef4444' : '#2effb0', color: isAutoplayActive ? '#fff' : '#0f111a' }}>
            {isAutoplayActive ? `Stop Autoplay (${autoplayCount} left)` : 'Start Autoplay'}
          </button>
        ) : (
          <button onClick={rollDice} disabled={rolling}
            style={{ width: '100%', padding: '16px 0', borderRadius: 16, border: 'none', cursor: rolling ? 'default' : 'pointer', fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', background: rolling ? '#141622' : '#2effb0', color: rolling ? '#3de796' : '#0f111a', boxShadow: rolling ? 'none' : '0 0 24px rgba(46,255,176,0.2)' }}>
            {rolling ? 'Rolling...' : 'Roll Dice'}
          </button>
        )}
      </div>

      {/* ═══════════ RIGHT PANEL ═══════════ */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(180deg, #131520 0%, #0e1018 60%, #0b0d14 100%)',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 420,
      }}>
        {/* Subtle grid lines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 24 }}>
          {[25, 50, 75].map(p => (
            <div key={p} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 1, background: 'rgba(255,255,255,0.025)' }} />
          ))}
        </div>

        {/* History pills row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', minHeight: 36 }}>
          {history.length === 0 && (
            <span style={{ fontSize: 10, color: '#3a3f55', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              No history yet — start rolling!
            </span>
          )}
          {history.map((val, i) => {
            const wasWin = direction === 'over' ? val > sliderValue : val < sliderValue;
            return (
              <div key={i} className="pill-enter" style={{
                background: wasWin ? 'rgba(61,231,150,0.1)' : 'rgba(255,255,255,0.06)',
                border: wasWin ? '1px solid rgba(61,231,150,0.3)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 999, padding: '5px 12px',
                fontSize: 11, fontWeight: 900,
                color: wasWin ? '#3de796' : '#c0c8d8',
                fontFamily: 'monospace',
                letterSpacing: '0.02em',
                boxShadow: wasWin ? '0 0 10px rgba(61,231,150,0.15)' : 'none',
              }}>
                {val.toFixed(2)}
              </div>
            );
          })}
        </div>

        {/* Main stage */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>

          {/* ── TWO-TONE SLIDER with floating hex badge ── */}
          <div style={{ width: '100%', maxWidth: 560, userSelect: 'none' }}>

            {/* Outer wrapper — hex badge + stem + track share percentage coord space */}
            <div style={{ position: 'relative' }}>

              {/* Hex badge: only visible after first roll, slides to rollResult% */}
              {rollResult !== null && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% - 26px)',
                  left: `${rollResult}%`,
                  transform: 'translateX(-50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  transition: 'left 0.55s cubic-bezier(0.34,1.56,0.64,1)',
                  zIndex: 20,
                  pointerEvents: 'none',
                }}>
                  {/* Drag stretch wrapper — squishes horizontally while sliding */}
                  <div
                    className={!rolling ? 'hex-pop' : 'hex-drag'}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    <HexBadge
                      value={rolling ? null : rollResult}
                      color={!rolling ? (won ? '#3de796' : '#ef4444') : '#888'}
                      size={76}
                    />
                    {/* Label */}
                    <span style={{
                      fontSize: 9, fontWeight: 900,
                      color: !rolling ? (won ? '#3de796' : '#ef4444') : '#6b7890',
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      marginTop: 2,
                      textShadow: !rolling
                        ? (won ? '0 0 10px rgba(61,231,150,0.6)' : '0 0 10px rgba(239,68,68,0.6)')
                        : 'none',
                      transition: 'color 0.4s ease',
                      whiteSpace: 'nowrap',
                    }}>
                      {rolling ? 'Rolling...' : (won ? `WIN +₹${(betAmt * mult).toFixed(2)}` : 'LOSS')}
                    </span>
                    {/* Stem */}
                    <div style={{
                      width: 1, height: 8, marginTop: 2,
                      background: !rolling
                        ? (won ? 'rgba(61,231,150,0.5)' : 'rgba(239,68,68,0.5)')
                        : 'rgba(255,255,255,0.2)',
                      transition: 'background 0.4s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Track container — small top padding for hex clearance */}
              <div style={{ paddingTop: 30, position: 'relative' }}>
                <div style={{ position: 'relative', height: 14 }}>

                  {/* Track background */}
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 999, overflow: 'hidden', background: '#252a3a' }}>
                    {/* Teal (win) fill */}
                    <div style={{
                      position: 'absolute',
                      top: 0, bottom: 0,
                      left: direction === 'over' ? `${sliderValue}%` : '0%',
                      right: direction === 'over' ? '0%' : `${100 - sliderValue}%`,
                      background: 'linear-gradient(90deg, #3de796 0%, #2effb0 100%)',
                      boxShadow: '0 0 16px rgba(61,231,150,0.45)',
                      transition: 'left 0.04s linear, right 0.04s linear',
                      borderRadius: 999,
                    }} />
                  </div>

                  {/* Invisible range input */}
                  <input
                    type="range" min="2" max="98" value={sliderValue}
                    onChange={handleSliderChange}
                    disabled={rolling || isAutoplayActive}
                    className="ds"
                  />

                  {/* Custom thumb */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${sliderValue}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e2e8f0 0%, #ffffff 100%)',
                    boxShadow: '0 0 0 3px rgba(61,231,150,0.3), 0 4px 16px rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 5,
                    transition: 'left 0.04s linear',
                  }}>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <path d="M1 5h12M4 2L1 5l3 3M10 2l3 3-3 3" stroke="#6b7890" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>{/* end track height div */}

                {/* Tick marks */}
                <div style={{ position: 'relative', height: 16, marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4 }}>
                    {Array.from({ length: 101 }, (_, i) => {
                      const isMajor = i % 25 === 0;
                      return (
                        <div key={i} style={{
                          width: 1, height: isMajor ? 10 : 5,
                          background: isMajor ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                          flexShrink: 0,
                        }} />
                      );
                    })}
                  </div>
                </div>

                {/* Scale labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: '#4a5568', padding: '0 2px', marginTop: 2 }}>
                  {[0, 25, 50, 75, 100].map(n => <span key={n}>{n}</span>)}
                </div>

                {/* Target value label — glowing, at win zone center */}
                <div style={{ position: 'relative', height: 28, marginTop: 4 }}>
                  <div style={{
                    position: 'absolute',
                    left: `${winLabelPct}%`,
                    transform: 'translateX(-50%)',
                    fontSize: 20, fontWeight: 900, color: '#3de796',
                    fontFamily: 'monospace', letterSpacing: '-0.5px',
                    textShadow: '0 0 16px rgba(61,231,150,0.6)',
                    transition: 'left 0.04s linear',
                  }} className="val-glow">
                    {sliderValue}
                  </div>
                </div>

              </div>{/* end paddingTop wrapper */}
            </div>{/* end outer relative wrapper */}
          </div>{/* end maxWidth slider container */}
        </div>{/* end main stage */}

        {/* ── PAYOUT ON WIN footer ── */}
        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            PAYOUT ON WIN:{' '}
            <span style={{ color: '#3de796', textShadow: '0 0 12px rgba(61,231,150,0.5)' }}>
              ₹{payoutOnWin.toFixed(2)}
            </span>
          </span>
        </div>
      </div>

      {/* ═══════════ RESULT POPUP ═══════════ */}
      <AnimatePresence>
        {showResultPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowResultPopup(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, borderRadius: 24, cursor: 'pointer' }}>
            <motion.div
              initial={{ scale: 0.75, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.75, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: 28, borderRadius: 28, textAlign: 'center', maxWidth: 280, width: '100%', margin: '0 16px',
                background: popupData.won ? 'linear-gradient(160deg, #1a2e26, #0d1713)' : 'linear-gradient(160deg, #2d1e22, #180f11)',
                border: `1px solid ${popupData.won ? 'rgba(61,231,150,0.3)' : 'rgba(239,68,68,0.3)'}`,
                boxShadow: popupData.won ? '0 24px 60px rgba(61,231,150,0.15)' : '0 24px 60px rgba(239,68,68,0.15)',
                cursor: 'default',
              }}>
              <button onClick={() => setShowResultPopup(false)} style={{ position: 'absolute', top: 12, right: 14, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18 }}>✕</button>

              <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: popupData.won ? 'rgba(61,231,150,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${popupData.won ? 'rgba(61,231,150,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                {popupData.won ? <Award size={28} color="#3de796" /> : <span style={{ fontSize: 24, color: '#ef4444' }}>✗</span>}
              </div>

              <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {popupData.won ? 'You Won!' : 'No Luck!'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 14, fontWeight: 600 }}>
                Roll: <span style={{ color: '#fff', fontWeight: 900 }}>{(popupData.rollResult ?? 0).toFixed(2)}</span>
                &nbsp;• Target: <span style={{ color: '#fff', fontWeight: 900 }}>{direction === 'over' ? `Over ${sliderValue}` : `Under ${sliderValue}`}</span>
              </div>
              <div style={{ background: 'rgba(15,17,26,0.6)', padding: '10px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block' }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: popupData.won ? '#3de796' : 'rgba(255,255,255,0.5)' }}>
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
