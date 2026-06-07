'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Percent, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick, playWinChime, playTick, playLossSound } from '../utils/audio';

// Animated grid background with perspective
function GridBackground({ rolling, won }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      {/* Dark base */}
      <div className="absolute inset-0 bg-[#0a0c12]" />

      {/* Horizon grid lines — perspective feel */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Horizontal lines fanning from horizon */}
        {Array.from({ length: 10 }).map((_, i) => {
          const y = ((i + 1) / 10) * 100;
          return (
            <line
              key={`h${i}`}
              x1="0%" y1={`${y}%`}
              x2="100%" y2={`${y}%`}
              stroke="#3de796"
              strokeWidth="0.5"
            />
          );
        })}
        {/* Vertical lines fanning out */}
        {Array.from({ length: 13 }).map((_, i) => {
          const x = (i / 12) * 100;
          return (
            <line
              key={`v${i}`}
              x1={`${x}%`} y1="0%"
              x2={`${x}%`} y2="100%"
              stroke="#3de796"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>

      {/* Glow orb that pulses when rolling */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={
          rolling
            ? {
                background: [
                  'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(61,231,150,0.06) 0%, transparent 80%)',
                  'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(61,231,150,0.12) 0%, transparent 80%)',
                  'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(61,231,150,0.06) 0%, transparent 80%)',
                ],
              }
            : won === true
            ? { background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(61,231,150,0.15) 0%, transparent 80%)' }
            : won === false
            ? { background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,51,102,0.12) 0%, transparent 80%)' }
            : { background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(61,231,150,0.04) 0%, transparent 80%)' }
        }
        transition={{ duration: 1.2, repeat: rolling ? Infinity : 0, ease: 'easeInOut' }}
      />
    </div>
  );
}

// Win / Loss popup overlay
function ResultPopup({ won, payout, multiplier, betAmount, onClose }) {
  return (
    <AnimatePresence>
      {won !== null && (
        <motion.div
          key="popup"
          initial={{ opacity: 0, scale: 0.6, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: -20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl"
          onClick={onClose}
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl" />

          <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6">
            {won ? (
              <>
                {/* Win particle burst */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-[#3de796]"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos((i / 8) * Math.PI * 2) * 80,
                      y: Math.sin((i / 8) * Math.PI * 2) * 80,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                  />
                ))}

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl"
                >
                  🎉
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-[#3de796] font-black text-2xl tracking-tight drop-shadow-[0_0_20px_rgba(61,231,150,0.7)]"
                >
                  YOU WON!
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-white font-black text-4xl"
                >
                  ₹{payout}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-[#3de796]/60 text-sm font-bold"
                >
                  {multiplier}x Multiplier Hit!
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.4 }}
                  className="text-4xl"
                >
                  💥
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-red-400 font-black text-2xl tracking-tight"
                >
                  BUSTED
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/50 font-bold text-sm"
                >
                  Lost ₹{betAmount}
                </motion.div>
              </>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/30 text-[10px] font-bold tracking-widest uppercase mt-2"
            >
              Tap to continue
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Limbo({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [tab, setTab] = useState('manual');
  const [showAutoConfig, setShowAutoConfig] = useState(false);
  const [betAmount, setBetAmount] = useState('50');
  const [targetMultiplier, setTargetMultiplier] = useState('2.00');
  const [winChance, setWinChance] = useState('49.50');

  // Game states
  const [displayMultiplier, setDisplayMultiplier] = useState(1.00);
  const [rolledMultiplier, setRolledMultiplier] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [won, setWon] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [history, setHistory] = useState([2.26, 1.53, 1.58, 1.90, 1.00, 2.26, 1.59, 3.96, 1.91, 5.00]);

  // Autoplay config
  const [numberOfBets, setNumberOfBets] = useState('0');
  const [onWinReset, setOnWinReset] = useState(true);
  const [onWinIncrease, setOnWinIncrease] = useState('0.00');
  const [onLossReset, setOnLossReset] = useState(true);
  const [onLossIncrease, setOnLossIncrease] = useState('0.00');
  const [stopProfit, setStopProfit] = useState('0.00');
  const [stopLoss, setStopLoss] = useState('0.00');
  const [isAutoplayRunning, setIsAutoplayRunning] = useState(false);
  const [autoBetsRemaining, setAutoBetsRemaining] = useState(0);
  const [totalWagered, setTotalWagered] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  const isAutoplayRef = useRef(isAutoplayRunning);
  const balanceRef = useRef(playableBalance);
  const startBalanceRef = useRef(playableBalance);
  const lastResultRef = useRef(null);

  useEffect(() => {
    isAutoplayRef.current = isAutoplayRunning;
  }, [isAutoplayRunning]);

  useEffect(() => {
    balanceRef.current = playableBalance;
  }, [playableBalance]);

  const handleMultiplierChange = (val) => {
    setTargetMultiplier(val);
    const m = parseFloat(val);
    if (!isNaN(m) && m >= 1.01) {
      setWinChance((99.00 / m).toFixed(2));
    } else {
      setWinChance('');
    }
  };

  const handleWinChanceChange = (val) => {
    setWinChance(val);
    const w = parseFloat(val);
    if (!isNaN(w) && w > 0 && w <= 98.02) {
      setTargetMultiplier((99.00 / w).toFixed(2));
    } else {
      setTargetMultiplier('');
    }
  };

  const multiplyBet = (factor) => {
    playClick();
    const current = parseFloat(betAmount);
    if (!isNaN(current)) {
      setBetAmount((current * factor).toFixed(2));
    }
  };

  const startRoll = async () => {
    const amt = parseFloat(betAmount);
    const target = parseFloat(targetMultiplier);

    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (isNaN(target) || target < 1.01) return alert('Minimum target multiplier is 1.01x');
    if (amt > balanceRef.current) {
      setIsAutoplayRunning(false);
      return alert('Insufficient balance');
    }

    setPlayableBalance(prev => prev - amt);
    setTotalWagered(prev => prev + amt);
    setRolling(true);
    setWon(null);
    setShowPopup(false);
    setRolledMultiplier(null);

    // Roll calculation (99% RTP)
    const isHardCrash = Math.random() < 0.03;
    let rolled = 1.00;
    if (!isHardCrash) {
      const rand = Math.random();
      rolled = parseFloat((0.99 / (1.00 - rand)).toFixed(2));
      if (rolled < 1.00) rolled = 1.00;
    }

    const isWon = rolled >= target;
    const payout = isWon ? parseFloat((amt * target).toFixed(2)) : 0.00;

    // Smooth animated count-up
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;

    // Use easeOut curve for dramatic deceleration
    return new Promise((resolve) => {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        // Ease-out quadratic: fast then slow
        const t = count / steps;
        const eased = 1 - Math.pow(1 - t, 2);
        const current = 1.00 + (rolled - 1.00) * eased;
        setDisplayMultiplier(current);

        // Play tick every few steps
        if (count % 3 === 0) playTick();

        if (count >= steps) {
          clearInterval(interval);
          setDisplayMultiplier(rolled);
          setRolledMultiplier(rolled);
          setWon(isWon);
          setRolling(false);
          if (isWon) {
            setShowPopup(true);
            setTimeout(() => {
              setShowPopup(false);
            }, 2000);
          }

          // Update history
          setHistory(prev => [rolled, ...prev.slice(0, 9)]);
          lastResultRef.current = { payout, target, amt, isWon };

          if (isWon) {
            playWinChime();
            setTotalProfit(prev => prev + (payout - amt));
            if (isDemo) {
              setPlayableBalance(prev => prev + payout);
            } else {
              recordBetAPI(amt, target, payout, true, rolled);
            }
          } else {
            playLossSound();
            setTotalProfit(prev => prev - amt);
            if (!isDemo) {
              recordBetAPI(amt, 0.00, 0.00, false, rolled);
            }
          }
          resolve({ isWon, payout });
        }
      }, stepTime);
    });
  };

  const recordBetAPI = async (amt, target, payout, isWon, rolled) => {
    try {
      const res = await fetch('http://localhost:3001/api/games/record-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          game: 'limbo',
          bet_amount: amt,
          payout_multiplier: isWon ? target : 0.00,
          payout_amount: payout,
          is_won: isWon,
          raw_selection: { target, rolled }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoplayLoop = async () => {
    if (isAutoplayRunning) {
      setIsAutoplayRunning(false);
      return;
    }

    const amt = parseFloat(betAmount);
    const target = parseFloat(targetMultiplier);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (isNaN(target) || target < 1.01) return alert('Minimum multiplier target is 1.01x');

    setIsAutoplayRunning(true);
    startBalanceRef.current = balanceRef.current;
    setTotalWagered(0);
    setTotalProfit(0);

    let betsCount = parseInt(numberOfBets);
    let infinite = betsCount === 0;
    let currentBet = amt;
    let remaining = infinite ? 999999 : betsCount;
    setAutoBetsRemaining(remaining);

    while (remaining > 0 && isAutoplayRef.current) {
      if (balanceRef.current < currentBet) {
        alert('Insufficient balance for autoplay');
        break;
      }

      const currentProfit = balanceRef.current - startBalanceRef.current;
      const profitStop = parseFloat(stopProfit);
      const lossStop = parseFloat(stopLoss);

      if (profitStop > 0 && currentProfit >= profitStop) {
        alert(`Autoplay profit target of ₹${profitStop} hit!`);
        break;
      }
      if (lossStop > 0 && Math.abs(currentProfit) >= lossStop && currentProfit < 0) {
        alert(`Autoplay loss limit of ₹${lossStop} hit!`);
        break;
      }

      const result = await startRoll();
      if (!result) break;

      if (result.isWon) {
        if (onWinReset) {
          currentBet = amt;
        } else {
          const inc = parseFloat(onWinIncrease) / 100;
          currentBet = currentBet * (1 + inc);
        }
      } else {
        if (onLossReset) {
          currentBet = amt;
        } else {
          const inc = parseFloat(onLossIncrease) / 100;
          currentBet = currentBet * (1 + inc);
        }
      }
      setBetAmount(currentBet.toFixed(2));

      if (!infinite) {
        remaining--;
        setAutoBetsRemaining(remaining);
      }

      if (remaining > 0 && isAutoplayRef.current) {
        await new Promise(r => setTimeout(r, 1400));
      }
    }

    setIsAutoplayRunning(false);
  };

  const calculatedPayout = (parseFloat(betAmount) * parseFloat(targetMultiplier) || 0).toFixed(2);

  const resultData = lastResultRef.current;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full">

      {/* Left Console Panel */}
      <div className="lg:col-span-4 bg-[#141622] border border-white/[0.02] p-5 rounded-2xl md:rounded-3xl flex flex-col gap-4 relative overflow-hidden order-2 lg:order-1">

        <AnimatePresence mode="wait">
          {!showAutoConfig ? (
            <motion.div
              key="main-console"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col flex-1 gap-4"
            >
              {/* Manual / Auto Toggles */}
              <div className="bg-zinc-950/40 p-1 rounded-xl flex gap-1 border border-white/5 order-5 lg:order-1">
                <button
                  onClick={() => { playClick(); setTab('manual'); }}
                  disabled={rolling || isAutoplayRunning}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                    tab === 'manual'
                      ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                      : 'bg-transparent text-text-muted hover:text-white'
                  }`}
                >
                  Manual
                </button>
                <button
                  onClick={() => { playClick(); setTab('autoplay'); }}
                  disabled={rolling || isAutoplayRunning}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                    tab === 'autoplay'
                      ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                      : 'bg-transparent text-text-muted hover:text-white'
                  }`}
                >
                  Autoplay
                </button>
              </div>

              {/* Bet Amount Input */}
              <div className="space-y-2 order-2 lg:order-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
                  <span>Bet Amount</span>
                  <span>0.00 INR</span>
                </div>
                <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 px-1 font-bold text-[#3de796] text-sm select-none">
                    ₹
                  </div>
                  <input
                    type="number"
                    disabled={rolling || isAutoplayRunning}
                    className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => multiplyBet(0.5)}
                      disabled={rolling || isAutoplayRunning}
                      className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors"
                    >
                      1/2
                    </button>
                    <button
                      onClick={() => multiplyBet(2.0)}
                      disabled={rolling || isAutoplayRunning}
                      className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors"
                    >
                      X2
                    </button>
                  </div>
                </div>
              </div>

              {/* Multiplier & Win Chance inputs side-by-side */}
              <div className="grid grid-cols-2 gap-3 order-3 lg:order-3">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Multiplier</span>
                  <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-1">
                    <input
                      type="number"
                      step="0.01"
                      disabled={rolling || isAutoplayRunning}
                      className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                      value={targetMultiplier}
                      onChange={(e) => handleMultiplierChange(e.target.value)}
                    />
                    <TrendingUp size={14} className="text-text-muted shrink-0 mr-1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Win Chance</span>
                  <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-1">
                    <input
                      type="number"
                      step="0.01"
                      disabled={rolling || isAutoplayRunning}
                      className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                      value={winChance}
                      onChange={(e) => handleWinChanceChange(e.target.value)}
                    />
                    <Percent size={13} className="text-text-muted shrink-0 mr-1" />
                  </div>
                </div>
              </div>

              {/* Payout Preview */}
              <div className="bg-zinc-950/30 rounded-xl p-3 border border-white/5 order-3 lg:order-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Payout if Win</span>
                  <span className="text-[#3de796] font-black text-sm">₹{calculatedPayout}</span>
                </div>
              </div>

              {/* Autoplay statistics */}
              {tab === 'autoplay' && (
                <div className="space-y-3 order-4 lg:order-4 border-t border-white/5 pt-3">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Number of Bets</span>
                    <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                      <input
                        type="number"
                        disabled={rolling || isAutoplayRunning}
                        className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                        value={numberOfBets}
                        onChange={(e) => setNumberOfBets(e.target.value)}
                      />
                      <div className="flex gap-1">
                        <button onClick={() => { playClick(); setNumberOfBets('20'); }} disabled={rolling || isAutoplayRunning} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors">20</button>
                        <button onClick={() => { playClick(); setNumberOfBets('50'); }} disabled={rolling || isAutoplayRunning} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors">50</button>
                        <button onClick={() => { playClick(); setNumberOfBets('0'); }} disabled={rolling || isAutoplayRunning} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors">∞</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-zinc-950/20 p-3 rounded-2xl border border-white/5">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Total Wagered</span>
                      <span className="text-white font-black text-xs">₹{totalWagered.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Total Profits</span>
                      <span className={`font-black text-xs ${totalProfit >= 0 ? 'text-[#3de796]' : 'text-accent-red'}`}>
                        {totalProfit >= 0 ? '+' : ''}₹{totalProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="order-1 lg:order-5 lg:mt-auto lg:pt-4 space-y-2">
                {tab === 'manual' ? (
                  <button
                    onClick={startRoll}
                    disabled={rolling}
                    className="w-full bg-[#3de796] hover:bg-[#3de796]/80 text-black py-4 rounded-2xl font-black text-sm tracking-wider shadow-lg shadow-[#3de796]/10 border-0 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {rolling ? 'ROLLING...' : 'PLAY'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { playClick(); setShowAutoConfig(true); }}
                      disabled={rolling || isAutoplayRunning}
                      className="w-full bg-[#242938] hover:bg-[#2e3549] text-white py-3 rounded-xl font-bold text-xs tracking-wider border-0 cursor-pointer transition-all"
                    >
                      CONFIGURE AUTO
                    </button>
                    <button
                      onClick={handleAutoplayLoop}
                      disabled={rolling}
                      className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider border-0 cursor-pointer transition-all shadow-lg ${
                        isAutoplayRunning
                          ? 'bg-accent-red hover:bg-accent-red/80 text-white shadow-red-500/10'
                          : 'bg-[#3de796] hover:bg-[#3de796]/80 text-black shadow-[#3de796]/10'
                      }`}
                    >
                      {isAutoplayRunning ? 'STOP AUTOPLAY' : 'START AUTOPLAY'}
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="auto-config"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4 flex flex-col flex-1"
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1 select-none">
                <button onClick={() => { playClick(); setShowAutoConfig(false); }} className="bg-transparent border-0 text-text-muted hover:text-white cursor-pointer">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-white uppercase tracking-wider">Configure Auto</span>
              </div>

              {/* On win settings */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">On Win</span>
                <div className="flex gap-2">
                  <button onClick={() => { playClick(); setOnWinReset(true); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${onWinReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-text-muted border-white/10 hover:text-white'}`}>Reset</button>
                  <button onClick={() => { playClick(); setOnWinReset(false); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${!onWinReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-text-muted border-white/10 hover:text-white'}`}>Increase By</button>
                </div>
                {!onWinReset && (
                  <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center">
                    <input type="number" className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full" value={onWinIncrease} onChange={(e) => setOnWinIncrease(e.target.value)} />
                    <span className="text-[10px] font-black text-text-muted px-2">%</span>
                  </div>
                )}
              </div>

              {/* On Loss settings */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">On Loss</span>
                <div className="flex gap-2">
                  <button onClick={() => { playClick(); setOnLossReset(true); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${onLossReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-text-muted border-white/10 hover:text-white'}`}>Reset</button>
                  <button onClick={() => { playClick(); setOnLossReset(false); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${!onLossReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-text-muted border-white/10 hover:text-white'}`}>Increase By</button>
                </div>
                {!onLossReset && (
                  <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center">
                    <input type="number" className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full" value={onLossIncrease} onChange={(e) => setOnLossIncrease(e.target.value)} />
                    <span className="text-[10px] font-black text-text-muted px-2">%</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Stop on Profit</span>
                <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 px-1 font-bold text-text-muted text-sm select-none">₹</div>
                  <input type="number" className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full" value={stopProfit} onChange={(e) => setStopProfit(e.target.value)} />
                  <div className="flex gap-1">
                    <button onClick={() => { playClick(); const val = parseFloat(stopProfit); if (!isNaN(val)) setStopProfit((val * 0.5).toFixed(2)); }} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer">1/2</button>
                    <button onClick={() => { playClick(); const val = parseFloat(stopProfit); if (!isNaN(val)) setStopProfit((val * 2.0).toFixed(2)); }} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer">X2</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Stop on Loss</span>
                <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 px-1 font-bold text-text-muted text-sm select-none">₹</div>
                  <input type="number" className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
                  <div className="flex gap-1">
                    <button onClick={() => { playClick(); const val = parseFloat(stopLoss); if (!isNaN(val)) setStopLoss((val * 0.5).toFixed(2)); }} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer">1/2</button>
                    <button onClick={() => { playClick(); const val = parseFloat(stopLoss); if (!isNaN(val)) setStopLoss((val * 2.0).toFixed(2)); }} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer">X2</button>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 flex gap-2">
                <button onClick={() => { playClick(); setShowAutoConfig(false); }} className="flex-1 bg-[#3de796] hover:bg-[#3de796]/80 text-black py-3 rounded-xl font-black text-xs tracking-wider border-0 cursor-pointer transition-all">APPLY</button>
                <button
                  onClick={() => {
                    playClick();
                    setOnWinReset(true); setOnWinIncrease('0.00');
                    setOnLossReset(true); setOnLossIncrease('0.00');
                    setStopProfit('0.00'); setStopLoss('0.00');
                  }}
                  className="flex-1 bg-[#242938] hover:bg-[#2e3549] text-white py-3 rounded-xl font-bold text-xs tracking-wider border-0 cursor-pointer transition-all"
                >
                  RESET ALL
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Display Panel */}
      <div className="lg:col-span-8 flex flex-col justify-between order-1 lg:order-2 relative">

        {/* History Log Row */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 select-none justify-start mb-4">
          {history.map((h, i) => {
            const isWinner = h >= parseFloat(targetMultiplier);
            return (
              <motion.span
                key={`${h}-${i}`}
                initial={{ opacity: 0, scale: 0.6, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i === 0 ? 0 : 0, duration: 0.3 }}
                className={`text-[10px] font-black px-3 py-1.5 rounded-full border shrink-0 transition-all ${
                  isWinner
                    ? 'bg-[#3de796]/15 text-[#3de796] border-[#3de796]/20'
                    : 'bg-white/5 text-slate-400 border-white/5'
                }`}
              >
                {h.toFixed(2)}x
              </motion.span>
            );
          })}
        </div>

        {/* Central Display Screen */}
        <div className="flex-1 flex items-center justify-center relative rounded-2xl overflow-hidden min-h-[280px] border border-white/[0.04]">
          <GridBackground rolling={rolling} won={won} />

          {/* Multiplier display */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            {/* Target indicator chip */}
            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
              <TrendingUp size={11} className="text-[#3de796]" />
              <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                Target: <span className="text-white">{targetMultiplier}x</span>
              </span>
            </div>

            {/* Main animated multiplier number */}
            <motion.div
              key={rolling ? 'rolling' : rolledMultiplier}
              className="relative"
            >
              {/* Outer glow ring that pulses when rolling */}
              {rolling && (
                <motion.div
                  className="absolute inset-0 rounded-full blur-2xl"
                  animate={{
                    background: [
                      'radial-gradient(circle, rgba(61,231,150,0.2) 0%, transparent 70%)',
                      'radial-gradient(circle, rgba(61,231,150,0.4) 0%, transparent 70%)',
                      'radial-gradient(circle, rgba(61,231,150,0.2) 0%, transparent 70%)',
                    ],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              )}

              <motion.span
                className={`relative text-6xl md:text-7xl font-black tracking-tight select-none tabular-nums ${
                  rolling
                    ? 'text-white'
                    : won === true
                    ? 'text-[#3de796] drop-shadow-[0_0_30px_rgba(61,231,150,0.7)]'
                    : won === false
                    ? 'text-red-400 drop-shadow-[0_0_25px_rgba(255,100,100,0.5)]'
                    : 'text-white/80'
                }`}
                animate={
                  won === true
                    ? { scale: [1, 1.08, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }
                    : won === false
                    ? { x: [0, -6, 6, -4, 4, 0] }
                    : {}
                }
                transition={{ duration: 0.5 }}
              >
                {displayMultiplier.toFixed(2)}x
              </motion.span>
            </motion.div>

            {/* Status label */}
            <AnimatePresence mode="wait">
              {rolling ? (
                <motion.div
                  key="rolling"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-[#3de796]"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.7 }}
                  />
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Rolling...</span>
                </motion.div>
              ) : won !== null ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs font-black uppercase tracking-wider ${won ? 'text-[#3de796]' : 'text-red-400'}`}
                >
                  {won ? `+₹${resultData?.payout?.toFixed(2)}` : `-₹${resultData?.amt?.toFixed(2)}`}
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-bold text-text-muted/50 uppercase tracking-widest"
                >
                  Place Your Bet
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Win/Loss Popup */}
          <ResultPopup
            won={showPopup ? won : null}
            payout={resultData?.payout?.toFixed(2)}
            multiplier={resultData?.target}
            betAmount={resultData?.amt?.toFixed(2)}
            onClose={() => setShowPopup(false)}
          />
        </div>

        {/* Lower indicator */}
        <div className="flex justify-between items-center py-3 select-none border-t border-white/5 mt-4">
          {tab === 'manual' ? (
            <>
              <div className="text-[10px] font-black tracking-wider uppercase text-text-muted">
                Win Chance: <span className="text-white ml-1">{winChance}%</span>
              </div>
              <div className="text-[10px] font-black tracking-wider uppercase text-text-muted">
                Payout on Win: <span className="text-[#3de796] ml-1">₹{calculatedPayout}</span>
              </div>
            </>
          ) : (
            <div className="text-[10px] font-black tracking-wider uppercase text-text-muted">
              Autoplays Remaining: <span className="text-[#3de796] ml-1">{isAutoplayRunning ? (autoBetsRemaining === 999999 ? '∞' : autoBetsRemaining) : numberOfBets === '0' ? '∞' : numberOfBets}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
