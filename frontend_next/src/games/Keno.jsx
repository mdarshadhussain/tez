'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sparkles, HelpCircle, Coins, Award, RefreshCw, ChevronLeft, Volume2, Settings, Info, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick, playWinChime, playTick, playHitSound, playLossSound, playKenoPick, playKenoBet, playKenoTick, playKenoMatch, playKenoWin } from '../utils/audio';

// Animated particle burst when a ball is hit
function HitParticles({ active }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-[#3de796] top-1/2 left-1/2"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((i / 8) * Math.PI * 2) * 22,
            y: Math.sin((i / 8) * Math.PI * 2) * 22,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// Keno win result overlay popup (wins only)
function KenoResultPopup({ winPayout, hitCount, selectedCount, onClose }) {
  if (!winPayout) return null;
  const isWin = winPayout.payout > 0;
  if (!isWin) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="keno-popup"
        initial={{ opacity: 0, y: 20, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onClose}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 cursor-pointer"
      >
        <div className={`rounded-2xl px-6 py-4 border text-center shadow-2xl min-w-[180px] ${
          isWin
            ? 'bg-[#3de796]/10 border-[#3de796]/30 backdrop-blur-sm'
            : 'bg-red-500/10 border-red-500/30 backdrop-blur-sm'
        }`}>
          <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
            isWin ? 'text-[#3de796]/70' : 'text-red-400/70'
          }`}>
            {hitCount} / {selectedCount} Hits
          </div>
          <div className={`font-black text-2xl ${
            isWin ? 'text-[#3de796] drop-shadow-[0_0_16px_rgba(61,231,150,0.6)]' : 'text-red-400'
          }`}>
            {isWin ? `+₹${winPayout.payout.toFixed(2)}` : 'No Win'}
          </div>
          {isWin && (
            <div className="text-white/40 text-[10px] font-bold mt-1">{winPayout.mult}x Multiplier</div>
          )}
          <div className="text-white/20 text-[9px] font-bold tracking-widest uppercase mt-2">Tap to dismiss</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Payout Multiplier Matrix per Risk Level and Selection Count
const MULTIPLIER_TABLES = {
  classic: {
    1: [0, 1.8],
    2: [0, 1.2, 2.5],
    3: [0, 1.0, 2.0, 5.0],
    4: [0, 0.5, 1.8, 4.0, 10.0],
    5: [0, 0, 1.5, 3.5, 8.0, 20.0],
    6: [0, 0, 1.2, 3.0, 6.0, 15.0, 45.0],
    7: [0, 0, 1.0, 2.0, 5.0, 12.0, 30.0, 75.0],
    8: [0, 0, 0.8, 1.8, 4.0, 10.0, 25.0, 60.0, 100.0],
    9: [0, 0, 0.5, 1.5, 3.0, 8.0, 20.0, 45.0, 85.0, 150.0],
    10: [0, 0, 0, 1.2, 2.5, 6.0, 15.0, 35.0, 75.0, 120.0, 200.0]
  },
  low: {
    1: [0.7, 1.2],
    2: [0.5, 1.0, 1.8],
    3: [0.4, 0.8, 1.5, 2.8],
    4: [0.3, 0.7, 1.2, 2.2, 5.0],
    5: [0.2, 0.6, 1.0, 1.8, 3.5, 8.0],
    6: [0.1, 0.5, 0.9, 1.5, 2.8, 6.0, 12.0],
    7: [0.1, 0.4, 0.8, 1.3, 2.2, 4.5, 10.0, 20.0],
    8: [0.1, 0.3, 0.7, 1.1, 1.8, 3.5, 8.0, 16.0, 35.0],
    9: [0.1, 0.3, 0.6, 1.0, 1.5, 2.8, 6.0, 12.0, 28.0, 60.0],
    10: [0.1, 0.2, 0.5, 0.8, 1.3, 2.2, 4.5, 9.0, 20.0, 45.0, 100.0]
  },
  medium: {
    1: [0, 1.9],
    2: [0, 1.5, 3.2],
    3: [0, 1.2, 2.5, 6.5],
    4: [0, 0.8, 2.0, 5.0, 15.0],
    5: [0, 0.5, 1.8, 4.5, 12.0, 30.0],
    6: [0, 0, 1.5, 3.5, 9.0, 25.0, 70.0],
    7: [0, 0, 1.2, 2.8, 7.0, 20.0, 55.0, 150.0],
    8: [0, 0, 1.0, 2.2, 5.5, 15.0, 45.0, 120.0, 350.0],
    9: [0, 0, 0.8, 1.8, 4.5, 12.0, 35.0, 95.0, 280.0, 700.0],
    10: [0, 0, 0.5, 1.5, 3.5, 9.5, 28.0, 75.0, 220.0, 550.0, 1000.0]
  },
  high: {
    1: [0, 2.2],
    2: [0, 0, 4.5],
    3: [0, 0, 3.0, 11.0],
    4: [0, 0, 2.0, 8.5, 30.0],
    5: [0, 0, 0, 5.0, 22.0, 85.0],
    6: [0, 0, 0, 3.5, 15.0, 60.0, 250.0],
    7: [0, 0, 0, 2.0, 10.0, 40.0, 180.0, 600.0],
    8: [0, 0, 0, 0, 7.0, 30.0, 130.0, 450.0, 1200.0],
    9: [0, 0, 0, 0, 5.0, 22.0, 95.0, 350.0, 1000.0, 3000.0],
    10: [0, 0, 0, 0, 0, 15.0, 70.0, 280.0, 800.0, 2500.0, 5000.0]
  }
};

export default function Keno({ socket, user, token, playableBalance, setPlayableBalance, isDemo }) {
  const [tab, setTab] = useState('manual'); // manual, autoplay
  const [showAutoConfig, setShowAutoConfig] = useState(false);
  const [betAmount, setBetAmount] = useState('50');
  const [riskLevel, setRiskLevel] = useState('classic'); // classic, low, medium, high
  const [sliderPickCount, setSliderPickCount] = useState(5);
  
  // Timed Multiplayer state
  const [timer, setTimer] = useState(15);
  const [hasBet, setHasBet] = useState(false);
  const [activeBetAmount, setActiveBetAmount] = useState(0);
  const [activeBetSelection, setActiveBetSelection] = useState([]);
  const [activeBetRisk, setActiveBetRisk] = useState('classic');
  const [balanceAtRoundEnd, setBalanceAtRoundEnd] = useState(null);
  const [history, setHistory] = useState([]);

  // Autoplay config
  const [numberOfBets, setNumberOfBets] = useState('0'); // '0' represents infinite
  const [onWinReset, setOnWinReset] = useState(true);
  const [onWinIncrease, setOnWinIncrease] = useState('0.00');
  const [onLossReset, setOnLossReset] = useState(true);
  const [onLossIncrease, setOnLossIncrease] = useState('0.00');
  const [stopProfit, setStopProfit] = useState('0.00');
  const [stopLoss, setStopLoss] = useState('0.00');
  const [autoBetsRemaining, setAutoBetsRemaining] = useState(0);
  const [isAutoplayRunning, setIsAutoplayRunning] = useState(false);
  const [totalWagered, setTotalWagered] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  // Game active state
  const [selectedNums, setSelectedNums] = useState([]);
  const [drawnNums, setDrawnNums] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winPayout, setWinPayout] = useState(null);
  const [hitCount, setHitCount] = useState(0);

  // Unified State Ref to prevent stale closures in socket events
  const stateRef = useRef();
  stateRef.current = {
    selectedNums,
    hasBet,
    activeBetSelection,
    activeBetRisk,
    activeBetAmount,
    balanceAtRoundEnd,
    isDemo,
    playableBalance,
    isAutoplayRunning,
    autoBetsRemaining,
    betAmount,
    onWinReset,
    onWinIncrease,
    onLossReset,
    onLossIncrease,
    riskLevel,
    user,
    socket
  };

  useEffect(() => {
    if (!socket) return;

    const handleTimers = (timers) => {
      setTimer(timers.keno);
    };

    const handleOutcome = (data) => {
      const drawn = data.outcome || data.lastOutcome;
      if (!drawn || drawn.length === 0) return;

      // Update history
      const newHistory = (data.history || []).map((val, idx) => ({
        id: `outcome_${idx}_${Date.now()}_${Math.random()}`,
        val
      }));
      setHistory(newHistory);

      // Start drawing animation
      setIsDrawing(true);
      setDrawnNums([]);
      setWinPayout(null);

      let count = 0;
      const interval = setInterval(() => {
        const drawnVal = drawn[count];
        setDrawnNums(prev => [...prev, drawnVal]);

        // play sound based on latest numbers picked
        if (stateRef.current.selectedNums.includes(drawnVal)) {
          playKenoMatch();
        } else {
          playKenoTick();
        }

        count++;

        if (count === 10) {
          clearInterval(interval);
          setIsDrawing(false);

          const curState = stateRef.current;

          // Resolve active bets at the end of the drawing animation
          if (curState.hasBet) {
            const hits = curState.activeBetSelection.filter(n => drawn.includes(n)).length;
            setHitCount(hits);

            const table = MULTIPLIER_TABLES[curState.activeBetRisk][curState.activeBetSelection.length] || [];
            const mult = table[hits] || 0;
            const payout = parseFloat((curState.activeBetAmount * mult).toFixed(2));

            setWinPayout({ payout, mult });

            if (payout > 0) {
              playKenoWin();
              setTotalProfit(prev => prev + (payout - curState.activeBetAmount));
              if (curState.isDemo) {
                setPlayableBalance(prev => prev + payout);
              } else if (curState.balanceAtRoundEnd !== null) {
                setPlayableBalance(curState.balanceAtRoundEnd);
              }
            } else {
              playLossSound();
              setTotalProfit(prev => prev - curState.activeBetAmount);
            }

            setTimeout(() => {
              setWinPayout(null);
            }, 2500);

            setHasBet(false);
            setBalanceAtRoundEnd(null);

            // Handle Autoplay Next Step
            if (curState.isAutoplayRunning) {
              let nextBet = curState.activeBetAmount;
              if (payout > 0) {
                if (!curState.onWinReset) {
                  nextBet = nextBet * (1 + parseFloat(curState.onWinIncrease) / 100);
                } else {
                  nextBet = parseFloat(curState.betAmount) || 50;
                }
              } else {
                if (!curState.onLossReset) {
                  nextBet = nextBet * (1 + parseFloat(curState.onLossIncrease) / 100);
                } else {
                  nextBet = parseFloat(curState.betAmount) || 50;
                }
              }
              setBetAmount(nextBet.toFixed(2));

              const nextRemaining = curState.autoBetsRemaining - 1;
              if (nextRemaining <= 0) {
                setIsAutoplayRunning(false);
                setAutoBetsRemaining(0);
              } else {
                setAutoBetsRemaining(nextRemaining);
                setTimeout(() => {
                  autoPlaceBet(nextBet);
                }, 800);
              }
            }
          } else {
            if (curState.isAutoplayRunning) {
              const nextRemaining = curState.autoBetsRemaining;
              if (nextRemaining > 0) {
                setTimeout(() => {
                  autoPlaceBet(parseFloat(curState.betAmount) || 50);
                }, 800);
              }
            }
          }
        }
      }, 230);
    };

    const handleBetResult = (data) => {
      if (data.game === 'keno' && !isDemo) {
        if (data.won) {
          setBalanceAtRoundEnd(data.balance);
        }
      }
    };

    const handleBetPlacedSuccess = (data) => {
      if (data.game === 'keno' && !isDemo) {
        setPlayableBalance(data.balance);
      }
    };

    const handleInitData = (data) => {
      const mapped = (data.keno || []).map((val, idx) => ({
        id: `init_${idx}`,
        val
      }));
      setHistory(mapped);
    };

    const handleBetCancelled = (data) => {
      if (data.game === 'keno' && !isDemo) {
        setPlayableBalance(data.balance);
        setHasBet(false);
        setActiveBetAmount(0);
      }
    };

    const handleCancelBetError = (data) => {
      alert(data.error);
    };

    socket.on('game_timers', handleTimers);
    socket.on('keno_resolution', handleOutcome);
    socket.on('bet_result', handleBetResult);
    socket.on('bet_placed_success', handleBetPlacedSuccess);
    socket.on('init_data', handleInitData);
    socket.on('bet_cancelled_success', handleBetCancelled);
    socket.on('cancel_bet_error', handleCancelBetError);

    socket.emit('request_init_data');

    return () => {
      socket.off('game_timers', handleTimers);
      socket.off('keno_resolution', handleOutcome);
      socket.off('bet_result', handleBetResult);
      socket.off('bet_placed_success', handleBetPlacedSuccess);
      socket.off('init_data', handleInitData);
      socket.off('bet_cancelled_success', handleBetCancelled);
      socket.off('cancel_bet_error', handleCancelBetError);
    };
  }, [socket, isDemo, setPlayableBalance]);

  const toggleNum = (num) => {
    if (isDrawing || isAutoplayRunning || hasBet || timer <= 4) return;
    playKenoPick();
    let newNums;
    if (selectedNums.includes(num)) {
      newNums = selectedNums.filter(n => n !== num);
    } else {
      if (selectedNums.length >= 10) {
        alert('You can select a maximum of 10 numbers.');
        return;
      }
      newNums = [...selectedNums, num];
    }
    setSelectedNums(newNums);
    setWinPayout(null);
    if (newNums.length >= 1) {
      setSliderPickCount(newNums.length);
    }
  };

  const autoPick = (count) => {
    if (isDrawing || isAutoplayRunning || hasBet || timer <= 4) return;
    playClick();
    const pickCount = count || sliderPickCount;
    const nums = [];
    while (nums.length < pickCount) {
      const rand = Math.floor(Math.random() * 40) + 1;
      if (!nums.includes(rand)) nums.push(rand);
    }
    setSelectedNums(nums);
  };

  const clearSelection = () => {
    if (isDrawing || isAutoplayRunning || hasBet || timer <= 4) return;
    playClick();
    setSelectedNums([]);
    setDrawnNums([]);
    setWinPayout(null);
  };

  const multiplyBet = (multiplier) => {
    playClick();
    const current = parseFloat(betAmount);
    if (!isNaN(current)) {
      setBetAmount((current * multiplier).toFixed(2));
    }
  };

  const currentMultiplierTable = MULTIPLIER_TABLES[riskLevel][selectedNums.length] || [];

  const cancelBet = () => {
    if (!hasBet || timer <= 4) return;
    playKenoPick();

    if (isDemo) {
      setPlayableBalance(prev => prev + activeBetAmount);
      setHasBet(false);
      setActiveBetAmount(0);
    } else {
      if (!user) return;
      socket.emit('cancel_bet', { userId: user.id, game: 'keno' });
    }
  };

  const placeBet = () => {
    if (hasBet) return;
    if (timer <= 4) return;

    if (selectedNums.length === 0) return alert('Select at least 1 number');
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    playKenoBet();
    setHasBet(true);
    setActiveBetAmount(amt);
    setActiveBetSelection(selectedNums);
    setActiveBetRisk(riskLevel);

    if (isDemo) {
      setPlayableBalance(prev => prev - amt);
      setTotalWagered(prev => prev + amt);
    } else {
      if (!user) return alert('Please login to place real bets');
      socket.emit('place_bet', {
        userId: user.id,
        game: 'keno',
        selection: { selectedNums, riskLevel },
        amount: amt
      });
    }
  };

  const autoPlaceBet = (customAmt) => {
    const curState = stateRef.current;
    const amt = customAmt !== undefined ? customAmt : (parseFloat(curState.betAmount) || 50);
    if (amt > curState.playableBalance) {
      alert('Autoplay stopped: Insufficient balance');
      setIsAutoplayRunning(false);
      return;
    }
    if (curState.selectedNums.length === 0) {
      alert('Autoplay stopped: No numbers selected');
      setIsAutoplayRunning(false);
      return;
    }

    setHasBet(true);
    setActiveBetAmount(amt);
    setActiveBetSelection(curState.selectedNums);
    setActiveBetRisk(curState.riskLevel);

    if (curState.isDemo) {
      setPlayableBalance(prev => prev - amt);
      setTotalWagered(prev => prev + amt);
    } else {
      if (!curState.user) {
        setIsAutoplayRunning(false);
        return;
      }
      curState.socket.emit('place_bet', {
        userId: curState.user.id,
        game: 'keno',
        selection: { selectedNums: curState.selectedNums, riskLevel: curState.riskLevel },
        amount: amt
      });
    }
  };

  const handleAutoplayLoop = () => {
    playClick();
    if (isAutoplayRunning) {
      setIsAutoplayRunning(false);
      return;
    }

    if (selectedNums.length === 0) return alert('Select at least 1 number to play');
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');

    setIsAutoplayRunning(true);
    setTotalWagered(0);
    setTotalProfit(0);

    let betsCount = parseInt(numberOfBets);
    let infinite = betsCount === 0;
    let remaining = infinite ? 999999 : betsCount;
    setAutoBetsRemaining(remaining);

    // Place bet immediately if betting is open
    if (timer > 4 && !hasBet) {
      setHasBet(true);
      setActiveBetAmount(amt);
      setActiveBetSelection(selectedNums);
      setActiveBetRisk(riskLevel);

      if (isDemo) {
        setPlayableBalance(prev => prev - amt);
        setTotalWagered(prev => prev + amt);
      } else {
        if (!user) return alert('Please login to place bets');
        socket.emit('place_bet', {
          userId: user.id,
          game: 'keno',
          selection: { selectedNums, riskLevel },
          amount: amt
        });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full">
      
      {/* Left Console Panel (4 Columns) */}
      <div className="lg:col-span-4 bg-[#141622] border border-white/[0.02] p-5 rounded-2xl md:rounded-3xl flex flex-col gap-4 relative overflow-y-auto scrollbar-none order-2 lg:order-1">
          
          <AnimatePresence mode="wait">
            {!showAutoConfig ? (
              <motion.div
                key="main-console"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col flex-1 gap-4"
              >
                {/* Manual / Auto Tab Toggles */}
                <div className="bg-zinc-950/40 p-1 rounded-xl flex gap-1 border border-white/5 order-5 lg:order-1">
                  <button
                    onClick={() => { playClick(); setTab('manual'); }}
                    disabled={isDrawing || isAutoplayRunning}
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
                    disabled={isDrawing || isAutoplayRunning}
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
                    <span>{playableBalance.toFixed(2)} INR</span>
                  </div>
                  <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-1 font-bold text-[#3de796] text-sm select-none">
                      ₹
                    </div>
                    <input
                      type="number"
                      disabled={isDrawing || isAutoplayRunning || hasBet || timer <= 4}
                      className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => multiplyBet(0.5)}
                        disabled={isDrawing || isAutoplayRunning || hasBet || timer <= 4}
                        className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors disabled:opacity-40"
                      >
                        1/2
                      </button>
                      <button
                        onClick={() => multiplyBet(2.0)}
                        disabled={isDrawing || isAutoplayRunning || hasBet || timer <= 4}
                        className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors disabled:opacity-40"
                      >
                        X2
                      </button>
                    </div>
                  </div>
                </div>

                {/* Risk Level Selector */}
                <div className="space-y-2 order-3 lg:order-3">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Risk Level</span>
                  <div className="bg-zinc-950/40 p-1 rounded-xl flex gap-1 border border-white/5">
                    {['classic', 'low', 'medium', 'high'].map((level) => (
                      <button
                        key={level}
                        onClick={() => { playClick(); setRiskLevel(level); }}
                        disabled={isDrawing || isAutoplayRunning || hasBet || timer <= 4}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border-0 cursor-pointer ${
                          riskLevel === level
                            ? 'bg-[#3de796] text-black shadow-sm'
                            : 'bg-transparent text-text-muted hover:text-white'
                        } disabled:opacity-40`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number Picker Slider */}
                <div className="space-y-2.5 order-4 lg:order-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Number Picker</span>
                    <button
                      onClick={clearSelection}
                      disabled={isDrawing || isAutoplayRunning || hasBet || timer <= 4}
                      className="bg-transparent border-0 text-text-muted hover:text-[#3de796] text-[10px] font-bold cursor-pointer transition-colors underline disabled:opacity-40"
                    >
                      Clear Picks
                    </button>
                  </div>
                  <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-3">
                    <span className="text-white font-black text-xs select-none w-4">{sliderPickCount}</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      disabled={isDrawing || isAutoplayRunning || hasBet || timer <= 4}
                      value={sliderPickCount || 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSliderPickCount(val);
                        if (!(isDrawing || isAutoplayRunning || hasBet || timer <= 4)) {
                          playClick();
                          const nums = [];
                          while (nums.length < val) {
                            const rand = Math.floor(Math.random() * 40) + 1;
                            if (!nums.includes(rand)) nums.push(rand);
                          }
                          setSelectedNums(nums);
                          setWinPayout(null);
                        }
                      }}
                      className="flex-1 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#3de796] disabled:opacity-40"
                    />
                    <button
                      onClick={() => autoPick()}
                      disabled={isDrawing || isAutoplayRunning || hasBet || timer <= 4}
                      className="bg-[#242938] hover:bg-[#2e3549] text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border-0 cursor-pointer transition-all tracking-wider disabled:opacity-40"
                    >
                      Pick
                    </button>
                  </div>
                </div>

                {/* Autoplay controls block */}
                {tab === 'autoplay' && (
                  <div className="space-y-3 order-4 lg:order-4">
                    {/* Number of Bets */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Number of Bets</span>
                      <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                        <input
                          type="number"
                          disabled={isAutoplayRunning}
                          className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                          value={numberOfBets}
                          onChange={(e) => setNumberOfBets(e.target.value)}
                        />
                        <div className="flex gap-1">
                          <button onClick={() => { playClick(); setNumberOfBets('10'); }} disabled={isAutoplayRunning} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors disabled:opacity-40">10</button>
                          <button onClick={() => { playClick(); setNumberOfBets('20'); }} disabled={isAutoplayRunning} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors disabled:opacity-40">20</button>
                          <button onClick={() => { playClick(); setNumberOfBets('50'); }} disabled={isAutoplayRunning} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors disabled:opacity-40">50</button>
                          <button onClick={() => { playClick(); setNumberOfBets('0'); }} disabled={isAutoplayRunning} className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors disabled:opacity-40">∞</button>
                        </div>
                      </div>
                    </div>

                    {/* Live autoplay stats */}
                    <div className="grid grid-cols-3 gap-2 bg-zinc-950/20 p-3 rounded-2xl border border-white/5">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Wagered</span>
                        <span className="text-white font-black text-xs">₹{totalWagered.toFixed(2)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Profit</span>
                        <span className={`font-black text-xs ${totalProfit >= 0 ? 'text-[#3de796]' : 'text-red-400'}`}>
                          {totalProfit >= 0 ? '+' : ''}₹{totalProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Remaining</span>
                        <span className="text-white font-black text-xs">
                          {isAutoplayRunning ? (autoBetsRemaining === 999999 ? '∞' : autoBetsRemaining) : (numberOfBets === '0' ? '∞' : numberOfBets)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* NEXT ROUND TIMER */}
                <div className="order-4 lg:order-4 space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
                    <span>NEXT ROUND TIMER</span>
                    <span className={timer <= 4 ? "text-red-500 font-black animate-pulse" : "text-[#3de796] font-black"}>{timer}s</span>
                  </div>
                  <div className="relative w-full h-2 bg-[#0f111a] rounded-full overflow-hidden border border-white/[0.04]">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        timer <= 4 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-[#3de796] shadow-[0_0_8px_#3de796]'
                      }`}
                      style={{ width: `${(timer / 15) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Footer launch button */}
                <div className="order-5 lg:order-5 lg:mt-auto lg:pt-4 space-y-2">
                  {tab === 'manual' ? (
                    hasBet && timer > 4 ? (
                      <button
                        onClick={cancelBet}
                        className="w-full py-4 rounded-2xl font-black text-sm tracking-wider shadow-lg border-0 cursor-pointer transition-all bg-red-500 hover:bg-red-400 text-white shadow-red-500/10"
                      >
                        CANCEL BET (₹{activeBetAmount.toFixed(2)})
                      </button>
                    ) : (
                      <button
                        onClick={placeBet}
                        disabled={hasBet || timer <= 4 || selectedNums.length === 0}
                        className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider shadow-lg border-0 cursor-pointer transition-all ${
                          hasBet 
                            ? 'bg-[#141622] text-[#3de796] border border-[#3de796]/20 cursor-default'
                            : timer <= 4
                            ? 'bg-zinc-800/80 text-white/20 cursor-not-allowed'
                            : 'bg-[#3de796] hover:bg-[#3de796]/80 text-black shadow-[#3de796]/10'
                        }`}
                      >
                        {hasBet ? 'BET PLACED' : timer <= 4 ? `BETTING CLOSED (${timer}s)` : 'PLAY'}
                      </button>
                    )
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => { playClick(); setShowAutoConfig(true); }}
                        disabled={isAutoplayRunning}
                        className="w-full bg-[#242938] hover:bg-[#2e3549] text-white py-3 rounded-xl font-bold text-xs tracking-wider border-0 cursor-pointer transition-all disabled:opacity-40"
                      >
                        CONFIGURE AUTO
                      </button>
                      <button
                        onClick={handleAutoplayLoop}
                        disabled={!isAutoplayRunning && (timer <= 4 || selectedNums.length === 0)}
                        className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider shadow-lg border-0 cursor-pointer transition-all disabled:opacity-50 ${
                          isAutoplayRunning
                            ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
                            : 'bg-[#3de796] hover:bg-[#3de796]/80 text-black shadow-[#3de796]/10'
                        }`}
                      >
                        {isAutoplayRunning
                          ? `STOP AUTOPLAY (${autoBetsRemaining})`
                          : 'START AUTOPLAY'}
                      </button>
                    </div>
                  )}
                </div>

              </motion.div>
            ) : (
              // Autoplay Advanced configuration view
              <motion.div
                key="auto-config"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 flex flex-col flex-1"
              >
                {/* Header Back button */}
                <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1 select-none">
                  <button
                    onClick={() => { playClick(); setShowAutoConfig(false); }}
                    className="bg-transparent border-0 text-text-muted hover:text-white cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-black text-white uppercase tracking-wider">Configure Auto</span>
                </div>

                {/* ON WIN selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">On Win</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { playClick(); setOnWinReset(true); }}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${
                        onWinReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-text-muted border-white/10 hover:text-white'
                      }`}
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => { playClick(); setOnWinReset(false); }}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${
                        !onWinReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-text-muted border-white/10 hover:text-white'
                      }`}
                    >
                      Increase By
                    </button>
                  </div>
                  {!onWinReset && (
                    <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center">
                      <input
                        type="number"
                        className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                        value={onWinIncrease}
                        onChange={(e) => setOnWinIncrease(e.target.value)}
                      />
                      <span className="text-[10px] font-black text-text-muted px-2">%</span>
                    </div>
                  )}
                </div>

                {/* ON LOSS selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">On Loss</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { playClick(); setOnLossReset(true); }}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${
                        onLossReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-text-muted border-white/10 hover:text-white'
                      }`}
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => { playClick(); setOnLossReset(false); }}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border ${
                        !onLossReset ? 'bg-[#3de796] text-black border-transparent' : 'bg-transparent text-text-muted border-white/10 hover:text-white'
                      }`}
                    >
                      Increase By
                    </button>
                  </div>
                  {!onLossReset && (
                    <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center">
                      <input
                        type="number"
                        className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                        value={onLossIncrease}
                        onChange={(e) => setOnLossIncrease(e.target.value)}
                      />
                      <span className="text-[10px] font-black text-text-muted px-2">%</span>
                    </div>
                  )}
                </div>

                {/* Stop on profit */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Stop on Profit</span>
                  <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-1 font-bold text-text-muted text-sm select-none">
                      ₹
                    </div>
                    <input
                      type="number"
                      className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                      value={stopProfit}
                      onChange={(e) => setStopProfit(e.target.value)}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => { playClick(); const val = parseFloat(stopProfit); if (!isNaN(val)) setStopProfit((val * 0.5).toFixed(2)); }}
                        className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer"
                      >
                        1/2
                      </button>
                      <button
                        onClick={() => { playClick(); const val = parseFloat(stopProfit); if (!isNaN(val)) setStopProfit((val * 2.0).toFixed(2)); }}
                        className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer"
                      >
                        X2
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stop on loss */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Stop on Loss</span>
                  <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-1 font-bold text-text-muted text-sm select-none">
                      ₹
                    </div>
                    <input
                      type="number"
                      className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => { playClick(); const val = parseFloat(stopLoss); if (!isNaN(val)) setStopLoss((val * 0.5).toFixed(2)); }}
                        className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer"
                      >
                        1/2
                      </button>
                      <button
                        onClick={() => { playClick(); const val = parseFloat(stopLoss); if (!isNaN(val)) setStopLoss((val * 2.0).toFixed(2)); }}
                        className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer"
                      >
                        X2
                      </button>
                    </div>
                  </div>
                </div>

                {/* Apply buttons */}
                <div className="mt-auto pt-4 flex gap-2">
                  <button
                    onClick={() => { playClick(); setShowAutoConfig(false); }}
                    className="flex-1 bg-[#3de796] hover:bg-[#3de796]/80 text-black py-3 rounded-xl font-black text-xs tracking-wider border-0 cursor-pointer transition-all"
                  >
                    APPLY
                  </button>
                  <button
                    onClick={() => {
                      playClick();
                      setOnWinReset(true);
                      setOnWinIncrease('0.00');
                      setOnLossReset(true);
                      setOnLossIncrease('0.00');
                      setStopProfit('0.00');
                      setStopLoss('0.00');
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

        {/* Right Playing Grid & Multipliers Panel (8 Columns) */}
        <div className="lg:col-span-8 p-4 md:p-5 flex flex-col gap-6 relative justify-between order-1 lg:order-2">
          
          {/* Numbers Playing board 8x5 Grid */}
          <div className="grid grid-cols-8 gap-1.5 md:gap-3 flex-1 select-none">
            {Array(40).fill(null).map((_, i) => {
              const num = i + 1;
              const isSelected = selectedNums.includes(num);
              const isHit = isSelected && drawnNums.includes(num);
              const isDrawn = drawnNums.includes(num);
              const justDrawn = drawnNums[drawnNums.length - 1] === num;

              let styleClasses = "bg-[#242938] text-[#c0c8d8] border border-white/5 hover:border-white/10 hover:bg-[#2e3549]";

              if (isSelected) {
                styleClasses = "bg-[#2d1822] text-[#ff3b30] border border-[#ff3b30]/50 shadow-[0_0_10px_rgba(255,59,48,0.15)]";
              }
              if (isDrawn && !isHit) {
                styleClasses = "bg-[#132f21] text-[#3de796] border border-[#3de796]/50";
              }
              if (isHit) {
                styleClasses = "bg-[#3de796] text-[#0f111a] border border-[#3de796] shadow-[0_0_20px_rgba(61,231,150,0.55)]";
              }

              return (
                <motion.button
                  key={num}
                  onClick={() => toggleNum(num)}
                  disabled={isDrawing || isAutoplayRunning || hasBet || timer <= 4}
                  whileHover={!(isDrawing || isAutoplayRunning || hasBet || timer <= 4) ? { scale: 1.1, y: -3 } : {}}
                  whileTap={!(isDrawing || isAutoplayRunning || hasBet || timer <= 4) ? { scale: 0.9 } : {}}
                  animate={
                    justDrawn && isHit
                      ? {
                          scale: [1, 1.4, 0.95, 1.1, 1],
                          rotate: [0, -8, 8, -4, 0],
                          boxShadow: [
                            '0 0 0px rgba(61,231,150,0)',
                            '0 0 30px rgba(61,231,150,0.8)',
                            '0 0 15px rgba(61,231,150,0.4)',
                          ],
                        }
                      : justDrawn && !isHit
                      ? {
                          scale: [1, 1.2, 0.9, 1],
                          rotate: [0, 6, -6, 0],
                        }
                      : isHit
                      ? {
                          scale: 1,
                          boxShadow: '0 0 18px rgba(61,231,150,0.45)',
                        }
                      : { scale: 1, rotate: 0, boxShadow: '0 0 0px rgba(0,0,0,0)' }
                  }
                  transition={{
                    duration: justDrawn ? 0.55 : 0.2,
                    ease: 'easeOut',
                  }}
                  className={`relative aspect-square rounded-xl flex items-center justify-center font-extrabold text-sm transition-colors duration-200 cursor-pointer overflow-visible disabled:cursor-not-allowed ${styleClasses}`}
                >
                  {/* Particle burst only on the most recently drawn hit */}
                  {justDrawn && isHit && <HitParticles active={true} />}
                  
                  {/* Ripple on just-drawn miss */}
                  {justDrawn && !isHit && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-red-400"
                      initial={{ opacity: 0.8, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.6 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}

                  {num}
                </motion.button>
              );
            })}
          </div>

          {/* Lower layout footer containing the Multiplier capsules */}
          <div className="border-t border-white/5 pt-4 space-y-3 relative">

            {/* Win/Loss popup */}
            <KenoResultPopup
              winPayout={winPayout}
              hitCount={hitCount}
              selectedCount={selectedNums.length}
              onClose={() => setWinPayout(null)}
            />
            
            {selectedNums.length === 0 ? (
              <div className="text-center text-xs text-text-muted py-2 select-none">
                Select 1–10 Numbers To Play
              </div>
            ) : (
              <div className="space-y-3">
                {/* Progress bar for hit tracking */}
                <div className="relative h-1.5 bg-zinc-950 rounded-full w-full select-none overflow-visible">
                  <motion.div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#3de796] to-emerald-400 rounded-full"
                    animate={{
                      width: `${winPayout !== null && selectedNums.length > 0 ? Math.min(100, (hitCount / selectedNums.length) * 100) : 0}%`
                    }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  />
                  <motion.div
                    className="absolute w-3 h-3 rounded-full bg-[#3de796] -top-[3px] shadow-lg shadow-[#3de796]/60"
                    animate={{
                      left: `calc(${winPayout !== null && selectedNums.length > 0 ? Math.min(100, (hitCount / selectedNums.length) * 100) : 0}% - 6px)`
                    }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  />
                </div>

                {/* Horizontal multiplier table */}
                <div className="flex gap-1.5 justify-between overflow-x-auto scrollbar-none pb-1 select-none">
                  {currentMultiplierTable.map((m, hits) => {
                    const isActiveHit = hitCount === hits && winPayout !== null;
                    return (
                      <motion.div
                        key={hits}
                        animate={isActiveHit ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center gap-1 shrink-0 min-w-[46px]"
                      >
                        <span
                          className={`text-[10px] font-black px-2 py-1.5 rounded-lg border text-center transition-all w-full ${
                            isActiveHit
                              ? 'bg-[#3de796] text-[#0f111a] border-[#3de796] shadow-[0_0_12px_rgba(61,231,150,0.4)]'
                              : m > 0
                              ? 'bg-[#242938] text-slate-300 border-white/5'
                              : 'bg-[#1a1c25] text-white/20 border-white/[0.03]'
                          }`}
                        >
                          {m > 0 ? `${m}x` : '0x'}
                        </span>
                        <div className="flex flex-col items-center gap-0.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full border transition-all ${
                              isActiveHit ? 'bg-[#3de796] border-[#3de796]' : 'bg-[#242938] border-white/10'
                            }`}
                          />
                          <span className={`text-[8px] font-bold ${isActiveHit ? 'text-[#3de796]' : 'text-text-muted'}`}>
                            {hits}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

    </div>
  );
}
