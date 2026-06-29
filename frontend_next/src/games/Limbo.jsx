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
          <div className="absolute inset-0 bg-black/10 dark:bg-black/30 dark:bg-black/60 backdrop-blur-sm rounded-2xl" />

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
                  className="text-slate-900 dark:text-white font-black text-4xl"
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
                  className="text-slate-900 dark:text-white/50 font-bold text-sm"
                >
                  Lost ₹{betAmount}
                </motion.div>
              </>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-900 dark:text-white/30 text-[10px] font-bold tracking-widest uppercase mt-2"
            >
              Tap to continue
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Limbo({ socket, user, token, playableBalance, setPlayableBalance, isDemo }) {
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

  // Timed multiplayer states
  const [timer, setTimer] = useState(15);
  const [hasBet, setHasBet] = useState(false);
  const [activeBetAmount, setActiveBetAmount] = useState(0);
  const [activeBetTargetMultiplier, setActiveBetTargetMultiplier] = useState(2.00);
  const [balanceAtRoundEnd, setBalanceAtRoundEnd] = useState(null);

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

  const bettingClosed = timer <= 4;

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

  const autoplayConfigRef = useRef({ active: false, amount: 50, targetMultiplier: 2.00 });

  useEffect(() => {
    autoplayConfigRef.current = {
      active: isAutoplayRunning,
      amount: parseFloat(betAmount) || 50,
      targetMultiplier: parseFloat(targetMultiplier) || 2.00
    };
  }, [isAutoplayRunning, betAmount, targetMultiplier]);

  useEffect(() => {
    if (!socket) return;

    const handleTimers = (timers) => {
      setTimer(timers.limbo);
    };

    const handleOutcome = (data) => {
      const rolled = data.outcome || data.lastOutcome;
      if (rolled === undefined || rolled === null) return;

      setHistory(data.history || []);
      setRolling(true);
      setShowPopup(false);
      setRolledMultiplier(null);

      // Smooth count-up
      const duration = 1200;
      const steps = 40;
      const stepTime = duration / steps;

      let count = 0;
      const interval = setInterval(() => {
        count++;
        const t = count / steps;
        const eased = 1 - Math.pow(1 - t, 2);
        const current = 1.00 + (rolled - 1.00) * eased;
        setDisplayMultiplier(current);

        if (count % 3 === 0) playTick();

        if (count >= steps) {
          clearInterval(interval);
          setDisplayMultiplier(rolled);
          setRolledMultiplier(rolled);
          setRolling(false);

          if (hasBet) {
            const isWon = rolled >= activeBetTargetMultiplier;
            setWon(isWon);

            const payout = isWon ? parseFloat((activeBetAmount * activeBetTargetMultiplier).toFixed(2)) : 0;
            
            lastResultRef.current = {
              payout,
              target: activeBetTargetMultiplier,
              amt: activeBetAmount
            };

            if (isWon) {
              setShowPopup(true);
              playWinChime();
              setTotalProfit(prev => prev + (payout - activeBetAmount));
              if (isDemo) {
                setPlayableBalance(prev => parseFloat((prev + payout).toFixed(2)));
              } else if (balanceAtRoundEnd !== null) {
                setPlayableBalance(balanceAtRoundEnd);
              }
            } else {
              playLossSound();
              setTotalProfit(prev => prev - activeBetAmount);
            }

            setTimeout(() => {
              setShowPopup(false);
            }, 2000);

            setHasBet(false);
            setBalanceAtRoundEnd(null);
          }

          // Handle autoplay logic
          if (autoplayConfigRef.current.active) {
            let remaining = autoBetsRemaining;
            if (remaining !== 0) {
              remaining--;
              setAutoBetsRemaining(remaining);
            }

            // Adjust autoplay count / stop triggers
            const currentProfit = balanceRef.current - startBalanceRef.current;
            const profitStop = parseFloat(stopProfit);
            const lossStop = parseFloat(stopLoss);

            let shouldStop = false;
            if (profitStop > 0 && currentProfit >= profitStop) {
              alert(`Autoplay profit target of ₹${profitStop} hit!`);
              shouldStop = true;
            }
            if (lossStop > 0 && Math.abs(currentProfit) >= lossStop && currentProfit < 0) {
              alert(`Autoplay loss limit of ₹${lossStop} hit!`);
              shouldStop = true;
            }

            if (remaining <= 0 || shouldStop) {
              setIsAutoplayRunning(false);
            } else {
              // Adjust bet size on win/loss
              const resultIsWon = rolled >= activeBetTargetMultiplier;
              let nextBet = parseFloat(betAmount);
              if (resultIsWon) {
                if (!onWinReset) {
                  const inc = parseFloat(onWinIncrease) / 100;
                  nextBet = nextBet * (1 + inc);
                }
              } else {
                if (!onLossReset) {
                  const inc = parseFloat(onLossIncrease) / 100;
                  nextBet = nextBet * (1 + inc);
                }
              }
              setBetAmount(nextBet.toFixed(2));

              setTimeout(() => {
                autoPlaceBet();
              }, 800);
            }
          }
        }
      }, stepTime);
    };

    const handleBetResult = (data) => {
      if (data.game === 'limbo' && !isDemo) {
        if (data.won) {
          setBalanceAtRoundEnd(data.balance);
        }
      }
    };

    const handleBetPlacedSuccess = (data) => {
      if (data.game === 'limbo' && !isDemo) {
        setPlayableBalance(data.balance);
      }
    };

    const handleInitData = (data) => {
      setHistory(data.limbo || []);
    };

    socket.on('game_timers', handleTimers);
    socket.on('limbo_resolution', handleOutcome);
    socket.on('bet_result', handleBetResult);
    socket.on('bet_placed_success', handleBetPlacedSuccess);
    socket.on('init_data', handleInitData);

    socket.emit('request_init_data');

    return () => {
      socket.off('game_timers', handleTimers);
      socket.off('limbo_resolution', handleOutcome);
      socket.off('bet_result', handleBetResult);
      socket.off('bet_placed_success', handleBetPlacedSuccess);
      socket.off('init_data', handleInitData);
    };
  }, [socket, hasBet, activeBetAmount, activeBetTargetMultiplier, balanceAtRoundEnd, isDemo, setPlayableBalance, autoBetsRemaining, stopProfit, stopLoss, betAmount, onWinReset, onWinIncrease, onLossReset, onLossIncrease]);

  const placeBet = () => {
    if (hasBet || timer <= 4) return;

    const amt = parseFloat(betAmount);
    const target = parseFloat(targetMultiplier);

    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (isNaN(target) || target < 1.01) return alert('Minimum target multiplier is 1.01x');
    if (amt > playableBalance) return alert('Insufficient balance');

    playClick();
    setHasBet(true);
    setActiveBetAmount(amt);
    setActiveBetTargetMultiplier(target);
    setTotalWagered(prev => prev + amt);

    if (isDemo) {
      setPlayableBalance(prev => parseFloat((prev - amt).toFixed(2)));
    } else {
      if (!user) return alert('Please login to place real bets');
      socket.emit('place_bet', {
        userId: user.id,
        game: 'limbo',
        selection: target,
        amount: amt
      });
    }
  };

  const autoPlaceBet = () => {
    const amt = autoplayConfigRef.current.amount;
    const target = autoplayConfigRef.current.targetMultiplier;

    if (amt > playableBalance) {
      alert('Autoplay stopped: Insufficient balance');
      setIsAutoplayRunning(false);
      return;
    }

    setHasBet(true);
    setActiveBetAmount(amt);
    setActiveBetTargetMultiplier(target);
    setTotalWagered(prev => prev + amt);

    if (isDemo) {
      setPlayableBalance(prev => parseFloat((prev - amt).toFixed(2)));
    } else {
      if (!user) {
        setIsAutoplayRunning(false);
        return;
      }
      socket.emit('place_bet', {
        userId: user.id,
        game: 'limbo',
        selection: target,
        amount: amt
      });
    }
  };

  const handleAutoplayLoop = () => {
    if (isAutoplayRunning) {
      setIsAutoplayRunning(false);
      return;
    }

    const amt = parseFloat(betAmount);
    const target = parseFloat(targetMultiplier);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (isNaN(target) || target < 1.01) return alert('Minimum multiplier target is 1.01x');
    if (amt > playableBalance) return alert('Insufficient balance');

    setIsAutoplayRunning(true);
    startBalanceRef.current = playableBalance;
    setTotalWagered(0);
    setTotalProfit(0);

    const betsCount = parseInt(numberOfBets);
    const infinite = betsCount === 0;
    const remaining = infinite ? 999999 : betsCount;
    setAutoBetsRemaining(remaining);

    if (timer > 4 && !hasBet) {
      setHasBet(true);
      setActiveBetAmount(amt);
      setActiveBetTargetMultiplier(target);
      setTotalWagered(prev => prev + amt);

      if (isDemo) {
        setPlayableBalance(prev => parseFloat((prev - amt).toFixed(2)));
      } else {
        if (!user) return alert('Please login to place bets');
        socket.emit('place_bet', {
          userId: user.id,
          game: 'limbo',
          selection: target,
          amount: amt
        });
      }
    }
  };

  const calculatedPayout = (parseFloat(betAmount) * parseFloat(targetMultiplier) || 0).toFixed(2);

  const resultData = lastResultRef.current;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full">

      {/* Left Console Panel */}
      <div className="lg:col-span-4 bg-slate-50 dark:bg-[#141622] border border-black/[0.05] dark:border-white/[0.02] p-5 rounded-2xl md:rounded-3xl flex flex-col gap-4 relative overflow-y-auto scrollbar-none order-2 lg:order-1">

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
              <div className="bg-slate-200/40 dark:bg-zinc-950/40 p-1 rounded-xl flex gap-1 border border-black/10 dark:border-white/5 order-5 lg:order-1">
                <button
                  onClick={() => { playClick(); setTab('manual'); }}
                  disabled={hasBet || bettingClosed || isAutoplayRunning}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                    tab === 'manual'
                      ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                      : 'bg-transparent text-slate-500 dark:text-text-muted hover:text-slate-900 dark:text-white'
                  }`}
                >
                  Manual
                </button>
                <button
                  onClick={() => { playClick(); setTab('autoplay'); }}
                  disabled={hasBet || bettingClosed || isAutoplayRunning}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                    tab === 'autoplay'
                      ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                      : 'bg-transparent text-slate-500 dark:text-text-muted hover:text-slate-900 dark:text-white'
                  }`}
                >
                  Autoplay
                </button>
              </div>

              {/* Bet Amount Input */}
              <div className="space-y-2 order-2 lg:order-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-text-muted">
                  <span>Bet Amount</span>
                  <span>0.00 INR</span>
                </div>
                <div className="bg-slate-200/40 dark:bg-zinc-950/40 border border-black/10 dark:border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 px-1 font-bold text-[#3de796] text-sm select-none">
                    ₹
                  </div>
                  <input
                    type="number"
                    disabled={hasBet || bettingClosed || isAutoplayRunning}
                    className="form-input bg-transparent border-0 py-1 px-0 text-slate-900 dark:text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => multiplyBet(0.5)}
                      disabled={hasBet || bettingClosed || isAutoplayRunning}
                      className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors"
                    >
                      1/2
                    </button>
                    <button
                      onClick={() => multiplyBet(2.0)}
                      disabled={hasBet || bettingClosed || isAutoplayRunning}
                      className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors"
                    >
                      X2
                    </button>
                  </div>
                </div>
              </div>

              {/* Multiplier & Win Chance inputs side-by-side */}
              <div className="grid grid-cols-2 gap-3 order-3 lg:order-3">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider">Multiplier</span>
                  <div className="bg-slate-200/40 dark:bg-zinc-950/40 border border-black/10 dark:border-white/5 rounded-xl p-2 flex items-center justify-between gap-1">
                    <input
                      type="number"
                      step="0.01"
                      disabled={hasBet || bettingClosed || isAutoplayRunning}
                      className="form-input bg-transparent border-0 py-1 px-0 text-slate-900 dark:text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                      value={targetMultiplier}
                      onChange={(e) => handleMultiplierChange(e.target.value)}
                    />
                    <TrendingUp size={14} className="text-slate-500 dark:text-text-muted shrink-0 mr-1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider">Win Chance</span>
                  <div className="bg-slate-200/40 dark:bg-zinc-950/40 border border-black/10 dark:border-white/5 rounded-xl p-2 flex items-center justify-between gap-1">
                    <input
                      type="number"
                      step="0.01"
                      disabled={hasBet || bettingClosed || isAutoplayRunning}
                      className="form-input bg-transparent border-0 py-1 px-0 text-slate-900 dark:text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                      value={winChance}
                      onChange={(e) => handleWinChanceChange(e.target.value)}
                    />
                    <Percent size={13} className="text-slate-500 dark:text-text-muted shrink-0 mr-1" />
                  </div>
                </div>
              </div>

              {/* Payout Preview */}
              <div className="bg-slate-200/30 dark:bg-zinc-950/30 rounded-xl p-3 border border-black/10 dark:border-white/5 order-3 lg:order-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider">Payout if Win</span>
                  <span className="text-[#3de796] font-black text-sm">₹{calculatedPayout}</span>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="space-y-2 order-4 lg:order-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-text-muted">
                  <span>NEXT ROUND TIMER</span>
                  <span style={{ color: bettingClosed ? '#ef4444' : '#3de796', fontWeight: 900 }}>{timer}s</span>
                </div>
                <div className="relative w-full h-2.5 bg-slate-200/40 dark:bg-zinc-950/40 rounded-full overflow-hidden border border-black/10 dark:border-white/5">
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 999,
                      background: bettingClosed ? '#ef4444' : '#3de796',
                      boxShadow: bettingClosed ? '0 0 8px #ef4444' : '0 0 8px #3de796',
                      width: `${(timer / 15) * 100}%`,
                      transition: 'width 1s linear'
                    }}
                  />
                </div>
              </div>

              {/* Autoplay statistics */}
              {tab === 'autoplay' && (
                <div className="space-y-3 order-4 lg:order-4 border-t border-black/10 dark:border-white/5 pt-3">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider">Number of Bets</span>
                    <div className="bg-slate-200/40 dark:bg-zinc-950/40 border border-black/10 dark:border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                      <input
                        type="number"
                        disabled={hasBet || bettingClosed || isAutoplayRunning}
                        className="form-input bg-transparent border-0 py-1 px-0 text-slate-900 dark:text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                        value={numberOfBets}
                        onChange={(e) => setNumberOfBets(e.target.value)}
                      />
                      <div className="flex gap-1">
                        <button onClick={() => { playClick(); setNumberOfBets('20'); }} disabled={hasBet || bettingClosed || isAutoplayRunning} className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors">20</button>
                        <button onClick={() => { playClick(); setNumberOfBets('50'); }} disabled={hasBet || bettingClosed || isAutoplayRunning} className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors">50</button>
                        <button onClick={() => { playClick(); setNumberOfBets('0'); }} disabled={hasBet || bettingClosed || isAutoplayRunning} className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors">∞</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-200/20 dark:bg-zinc-950/20 p-3 rounded-2xl border border-black/10 dark:border-white/5">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider block">Total Wagered</span>
                      <span className="text-slate-900 dark:text-white font-black text-xs">₹{totalWagered.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider block">Total Profits</span>
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
                    onClick={placeBet}
                    disabled={hasBet || bettingClosed}
                    className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider shadow-lg border-0 cursor-pointer transition-all ${
                      hasBet
                        ? 'bg-slate-50 dark:bg-[#141622] text-[#3de796] border border-[#3de796]/20'
                        : bettingClosed
                        ? 'bg-slate-300/80 dark:bg-zinc-800/80 text-slate-900 dark:text-white/20'
                        : 'bg-[#3de796] hover:bg-[#3de796]/80 text-black shadow-[#3de796]/10'
                    }`}
                  >
                    {hasBet ? 'BET PLACED' : bettingClosed ? `CLOSED (${timer}s)` : 'PLAY'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { playClick(); setShowAutoConfig(true); }}
                      disabled={hasBet || bettingClosed || isAutoplayRunning}
                      className="w-full bg-[#242938] hover:bg-[#2e3549] text-slate-900 dark:text-white py-3 rounded-xl font-bold text-xs tracking-wider border-0 cursor-pointer transition-all"
                    >
                      CONFIGURE AUTO
                    </button>
                    <button
                      onClick={handleAutoplayLoop}
                      disabled={rolling}
                      className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider border-0 cursor-pointer transition-all shadow-lg ${
                        isAutoplayRunning
                          ? 'bg-accent-red hover:bg-accent-red/80 text-slate-900 dark:text-white shadow-red-500/10'
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
              <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/5 pb-2 mb-1 select-none">
                <button onClick={() => { playClick(); setShowAutoConfig(false); }} className="bg-transparent border-0 text-slate-500 dark:text-text-muted hover:text-slate-900 dark:text-white cursor-pointer">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Configure Auto</span>
              </div>

              {/* On win settings */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider">On Win</span>
                <div className="flex gap-2">
                  <button onClick={() => { playClick(); setOnWinReset(true); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${onWinReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-slate-500 dark:text-text-muted border-black/15 dark:border-white/10 hover:text-slate-900 dark:text-white'}`}>Reset</button>
                  <button onClick={() => { playClick(); setOnWinReset(false); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${!onWinReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-slate-500 dark:text-text-muted border-black/15 dark:border-white/10 hover:text-slate-900 dark:text-white'}`}>Increase By</button>
                </div>
                {!onWinReset && (
                  <div className="bg-slate-200/40 dark:bg-zinc-950/40 border border-black/10 dark:border-white/5 rounded-xl p-2 flex items-center">
                    <input type="number" className="form-input bg-transparent border-0 py-1 px-0 text-slate-900 dark:text-white font-extrabold text-xs outline-none focus:ring-0 w-full" value={onWinIncrease} onChange={(e) => setOnWinIncrease(e.target.value)} />
                    <span className="text-[10px] font-black text-slate-500 dark:text-text-muted px-2">%</span>
                  </div>
                )}
              </div>

              {/* On Loss settings */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider">On Loss</span>
                <div className="flex gap-2">
                  <button onClick={() => { playClick(); setOnLossReset(true); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${onLossReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-slate-500 dark:text-text-muted border-black/15 dark:border-white/10 hover:text-slate-900 dark:text-white'}`}>Reset</button>
                  <button onClick={() => { playClick(); setOnLossReset(false); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${!onLossReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-slate-500 dark:text-text-muted border-black/15 dark:border-white/10 hover:text-slate-900 dark:text-white'}`}>Increase By</button>
                </div>
                {!onLossReset && (
                  <div className="bg-slate-200/40 dark:bg-zinc-950/40 border border-black/10 dark:border-white/5 rounded-xl p-2 flex items-center">
                    <input type="number" className="form-input bg-transparent border-0 py-1 px-0 text-slate-900 dark:text-white font-extrabold text-xs outline-none focus:ring-0 w-full" value={onLossIncrease} onChange={(e) => setOnLossIncrease(e.target.value)} />
                    <span className="text-[10px] font-black text-slate-500 dark:text-text-muted px-2">%</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider">Stop on Profit</span>
                <div className="bg-slate-200/40 dark:bg-zinc-950/40 border border-black/10 dark:border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 px-1 font-bold text-slate-500 dark:text-text-muted text-sm select-none">₹</div>
                  <input type="number" className="form-input bg-transparent border-0 py-1 px-0 text-slate-900 dark:text-white font-extrabold text-xs outline-none focus:ring-0 w-full" value={stopProfit} onChange={(e) => setStopProfit(e.target.value)} />
                  <div className="flex gap-1">
                    <button onClick={() => { playClick(); const val = parseFloat(stopProfit); if (!isNaN(val)) setStopProfit((val * 0.5).toFixed(2)); }} className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer">1/2</button>
                    <button onClick={() => { playClick(); const val = parseFloat(stopProfit); if (!isNaN(val)) setStopProfit((val * 2.0).toFixed(2)); }} className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer">X2</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider">Stop on Loss</span>
                <div className="bg-slate-200/40 dark:bg-zinc-950/40 border border-black/10 dark:border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 px-1 font-bold text-slate-500 dark:text-text-muted text-sm select-none">₹</div>
                  <input type="number" className="form-input bg-transparent border-0 py-1 px-0 text-slate-900 dark:text-white font-extrabold text-xs outline-none focus:ring-0 w-full" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
                  <div className="flex gap-1">
                    <button onClick={() => { playClick(); const val = parseFloat(stopLoss); if (!isNaN(val)) setStopLoss((val * 0.5).toFixed(2)); }} className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer">1/2</button>
                    <button onClick={() => { playClick(); const val = parseFloat(stopLoss); if (!isNaN(val)) setStopLoss((val * 2.0).toFixed(2)); }} className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer">X2</button>
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
                  className="flex-1 bg-[#242938] hover:bg-[#2e3549] text-slate-900 dark:text-white py-3 rounded-xl font-bold text-xs tracking-wider border-0 cursor-pointer transition-all"
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
                    : 'bg-black/5 dark:bg-white/5 text-slate-400 border-black/10 dark:border-white/5'
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
            <div className="bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
              <TrendingUp size={11} className="text-[#3de796]" />
              <span className="text-[10px] font-black text-slate-500 dark:text-text-muted uppercase tracking-wider">
                Target: <span className="text-slate-900 dark:text-white">{targetMultiplier}x</span>
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
                    ? 'text-slate-900 dark:text-white'
                    : won === true
                    ? 'text-[#3de796] drop-shadow-[0_0_30px_rgba(61,231,150,0.7)]'
                    : won === false
                    ? 'text-red-400 drop-shadow-[0_0_25px_rgba(255,100,100,0.5)]'
                    : 'text-slate-900 dark:text-white/80'
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
                  <span className="text-[10px] font-black text-slate-500 dark:text-text-muted uppercase tracking-widest">Rolling...</span>
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
                  className="text-[10px] font-bold text-slate-500 dark:text-text-muted/50 uppercase tracking-widest"
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
        <div className="flex justify-between items-center py-3 select-none border-t border-black/10 dark:border-white/5 mt-4">
          {tab === 'manual' ? (
            <>
              <div className="text-[10px] font-black tracking-wider uppercase text-slate-500 dark:text-text-muted">
                Win Chance: <span className="text-slate-900 dark:text-white ml-1">{winChance}%</span>
              </div>
              <div className="text-[10px] font-black tracking-wider uppercase text-slate-500 dark:text-text-muted">
                Payout on Win: <span className="text-[#3de796] ml-1">₹{calculatedPayout}</span>
              </div>
            </>
          ) : (
            <div className="text-[10px] font-black tracking-wider uppercase text-slate-500 dark:text-text-muted">
              Autoplays Remaining: <span className="text-[#3de796] ml-1">{isAutoplayRunning ? (autoBetsRemaining === 999999 ? '∞' : autoBetsRemaining) : numberOfBets === '0' ? '∞' : numberOfBets}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
