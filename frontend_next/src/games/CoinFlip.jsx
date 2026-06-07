'use client';
import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, RefreshCw, Timer, Info, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playCoinFlipSound, playWinChime, playLossSound, playClick } from '../utils/audio';

export default function CoinFlip({ socket, user, token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('20');
  const [prediction, setPrediction] = useState('heads'); // 'heads' or 'tails'
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [won, setWon] = useState(null);
  const [timer, setTimer] = useState(15);
  const [history, setHistory] = useState([]); // stores { id, val } objects for unique keys
  
  // Local active bet state
  const [hasBet, setHasBet] = useState(false);
  const [activeBetAmount, setActiveBetAmount] = useState(0);
  const [activeBetPrediction, setActiveBetPrediction] = useState(null);
  const [balanceAtRoundEnd, setBalanceAtRoundEnd] = useState(null);

  // Tab Selection visual state
  const [betTab, setBetTab] = useState('manual'); // 'manual' or 'autoplay'

  // Autoplay states
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [autoplayCount, setAutoplayCount] = useState('10');

  // Win/Loss Result Popup state
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [popupData, setPopupData] = useState({ won: false, amount: 0, prediction: '', outcome: '' });

  // Ref to track autoplay variables dynamically in socket callbacks
  const autoplayRef = useRef({ active: false, count: 10, prediction: 'heads', amount: 20 });

  useEffect(() => {
    autoplayRef.current = {
      active: isAutoplayActive,
      count: parseInt(autoplayCount) || 0,
      prediction: prediction,
      amount: parseFloat(betAmount) || 20
    };
  }, [isAutoplayActive, autoplayCount, prediction, betAmount]);

  useEffect(() => {
    if (!socket) return;

    const handleTimers = (timers) => {
      setTimer(timers.coinflip);
    };

    const handleOutcome = (data) => {
      const flipped = data.outcome || data.lastOutcome;
      if (!flipped) return;

      // Map incoming array elements to unique key objects
      const newHistory = (data.history || []).map((val, idx) => ({
        id: `outcome_${idx}_${Date.now()}_${Math.random()}`,
        val
      }));
      setHistory(newHistory);
      
      // Trigger coin spin animation & audio sound
      playCoinFlipSound();
      setSpinning(true);
      setResult(null);
      setWon(null);
      setShowResultPopup(false);

      setTimeout(() => {
        setResult(flipped);
        setSpinning(false);

        // Resolve active bets at the end of the spin
        if (hasBet) {
          const isWon = flipped === activeBetPrediction;
          setWon(isWon);
          
          // Set result popup payload
          setPopupData({
            won: isWon,
            amount: parseFloat((activeBetAmount * 1.95).toFixed(2)),
            prediction: activeBetPrediction,
            outcome: flipped
          });
          setShowResultPopup(true);

          if (isWon) {
            playWinChime();
            if (isDemo) {
              const payout = parseFloat((activeBetAmount * 1.95).toFixed(2));
              setPlayableBalance(prev => prev + payout);
            } else if (balanceAtRoundEnd !== null) {
              setPlayableBalance(balanceAtRoundEnd);
            }
          } else {
            playLossSound();
          }

          // Auto-hide popup after 2 seconds
          setTimeout(() => {
            setShowResultPopup(false);
          }, 2000);

          // Reset active bet states
          setHasBet(false);
          setBalanceAtRoundEnd(null);
        }

        // Trigger autoplay for next round if active
        if (autoplayRef.current.active) {
          const nextCount = autoplayRef.current.count - 1;
          if (nextCount <= 0) {
            setIsAutoplayActive(false);
            setAutoplayCount('0');
          } else {
            setAutoplayCount(String(nextCount));
            // Trigger auto bet placement for next round
            setTimeout(() => {
              autoPlaceBet();
            }, 800);
          }
        }
      }, 1500);
    };

    const handleBetResult = (data) => {
      if (data.game === 'coinflip' && !isDemo) {
        if (data.won) {
          setBalanceAtRoundEnd(data.balance);
        }
      }
    };

    const handleBetPlacedSuccess = (data) => {
      if (data.game === 'coinflip' && !isDemo) {
        setPlayableBalance(data.balance);
      }
    };

    const handleInitData = (data) => {
      const mapped = (data.coinflip || []).map((val, idx) => ({
        id: `init_${idx}`,
        val
      }));
      setHistory(mapped);
    };

    socket.on('game_timers', handleTimers);
    socket.on('coinflip_resolution', handleOutcome);
    socket.on('bet_result', handleBetResult);
    socket.on('bet_placed_success', handleBetPlacedSuccess);
    socket.on('init_data', handleInitData);

    socket.emit('request_init_data');

    return () => {
      socket.off('game_timers', handleTimers);
      socket.off('coinflip_resolution', handleOutcome);
      socket.off('bet_result', handleBetResult);
      socket.off('bet_placed_success', handleBetPlacedSuccess);
      socket.off('init_data', handleInitData);
    };
  }, [socket, hasBet, activeBetAmount, activeBetPrediction, balanceAtRoundEnd, isDemo, setPlayableBalance]);

  const placeBet = () => {
    if (hasBet) return;
    if (timer <= 4) return;

    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    playClick();
    setHasBet(true);
    setActiveBetAmount(amt);
    setActiveBetPrediction(prediction);

    if (isDemo) {
      setPlayableBalance(prev => prev - amt);
    } else {
      if (!user) return alert('Please login to place real bets');
      socket.emit('place_bet', {
        userId: user.id,
        game: 'coinflip',
        selection: prediction,
        amount: amt
      });
    }
  };

  const autoPlaceBet = () => {
    const amt = autoplayRef.current.amount;
    const pred = autoplayRef.current.prediction;

    if (amt > playableBalance) {
      alert('Autoplay stopped: Insufficient balance');
      setIsAutoplayActive(false);
      return;
    }

    setHasBet(true);
    setActiveBetAmount(amt);
    setActiveBetPrediction(pred);

    if (isDemo) {
      setPlayableBalance(prev => prev - amt);
    } else {
      if (!user) {
        setIsAutoplayActive(false);
        return;
      }
      socket.emit('place_bet', {
        userId: user.id,
        game: 'coinflip',
        selection: pred,
        amount: amt
      });
    }
  };

  const toggleAutoplay = () => {
    playClick();
    if (isAutoplayActive) {
      setIsAutoplayActive(false);
    } else {
      const count = parseInt(autoplayCount);
      if (isNaN(count) || count <= 0) {
        return alert('Please enter a valid number of rounds to autoplay');
      }
      const amt = parseFloat(betAmount);
      if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
      if (amt > playableBalance) return alert('Insufficient balance');

      setIsAutoplayActive(true);

      // Place first bet immediately if betting is open
      if (timer > 4 && !hasBet) {
        setHasBet(true);
        setActiveBetAmount(amt);
        setActiveBetPrediction(prediction);
        if (isDemo) {
          setPlayableBalance(prev => prev - amt);
        } else {
          if (!user) return alert('Please login to place bets');
          socket.emit('place_bet', {
            userId: user.id,
            game: 'coinflip',
            selection: prediction,
            amount: amt
          });
        }
      }
    }
  };

  const multiplyBet = (factor) => {
    playClick();
    setBetAmount(prev => {
      const val = parseFloat(prev);
      if (isNaN(val)) return '20';
      return Math.max(10, Math.round(val * factor)).toString();
    });
  };

  const selectRandom = () => {
    playClick();
    if (hasBet || timer <= 4) return;
    setPrediction(Math.random() < 0.5 ? 'heads' : 'tails');
  };

  const bettingClosed = timer <= 4;

  // Last 12 results sliced and reversed (oldest left, newest right)
  const last12 = history.slice(0, 12).reverse();

  return (
    <div className="coinflip-container w-full h-full flex flex-col md:flex-row gap-6 p-2 text-white font-sans selection:bg-transparent relative">
      <style>{`
        @keyframes coin-3d-spin-heads {
          0% { transform: rotateY(0deg) rotateX(0deg) rotateZ(0deg) scale(1); }
          30% { transform: rotateY(540deg) rotateX(120deg) rotateZ(90deg) scale(1.3); }
          60% { transform: rotateY(1080deg) rotateX(240deg) rotateZ(180deg) scale(1.4); }
          90% { transform: rotateY(1620deg) rotateX(120deg) rotateZ(270deg) scale(1.2); }
          100% { transform: rotateY(2160deg) rotateX(0deg) rotateZ(360deg) scale(1); }
        }
        @keyframes coin-3d-spin-tails {
          0% { transform: rotateY(0deg) rotateX(0deg) rotateZ(0deg) scale(1); }
          30% { transform: rotateY(540deg) rotateX(120deg) rotateZ(90deg) scale(1.3); }
          60% { transform: rotateY(1080deg) rotateX(240deg) rotateZ(180deg) scale(1.4); }
          90% { transform: rotateY(1710deg) rotateX(120deg) rotateZ(270deg) scale(1.2); }
          100% { transform: rotateY(2340deg) rotateX(0deg) rotateZ(360deg) scale(1); }
        }
        .coin-spinning-h {
          animation: coin-3d-spin-heads 1.5s cubic-bezier(0.1, 0.8, 0.1, 1) forwards;
          transform-style: preserve-3d;
        }
        .coin-spinning-t {
          animation: coin-3d-spin-tails 1.5s cubic-bezier(0.1, 0.8, 0.1, 1) forwards;
          transform-style: preserve-3d;
        }
      `}</style>

      {/* Left panel: Controls (Sidebar) */}
      <div className="w-full md:w-[320px] bg-[#1a1c2a] rounded-[24px] p-5 flex flex-col justify-between border border-white/[0.03] shadow-lg shrink-0">
        <div className="space-y-6">
          {/* Tab Selection */}
          <div className="flex bg-[#0f111a] p-1 rounded-full border border-white/[0.04]">
            <button
              onClick={() => { playClick(); setBetTab('manual'); }}
              disabled={isAutoplayActive}
              className={`flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                betTab === 'manual' ? 'bg-[#26293b] text-[#3de796]' : 'bg-transparent text-text-muted hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Manual
            </button>
            <button
              onClick={() => { playClick(); setBetTab('autoplay'); }}
              disabled={isAutoplayActive}
              className={`flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                betTab === 'autoplay' ? 'bg-[#26293b] text-[#3de796]' : 'bg-transparent text-text-muted hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Autoplay
            </button>
          </div>

          {/* Bet Amount Input */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
              <span className="flex items-center gap-1">
                BET AMOUNT <Info size={11} className="text-text-muted cursor-help" />
              </span>
              <span>{playableBalance.toFixed(2)} INR</span>
            </div>
            <div className="flex items-center bg-[#0f111a] rounded-xl px-3.5 py-3 border border-white/[0.05] focus-within:border-[#3de796]/50 transition-all">
              <span className="text-[#3de796] font-bold text-xs mr-2">₹</span>
              <input
                type="number"
                className="bg-transparent border-none outline-none text-white font-extrabold text-xs w-full focus:ring-0 p-0"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={hasBet || bettingClosed || isAutoplayActive}
              />
              <div className="flex gap-1.5 ml-2">
                <button
                  onClick={() => multiplyBet(0.5)}
                  disabled={hasBet || bettingClosed || isAutoplayActive}
                  className="bg-[#26293b] hover:bg-[#2d3148] text-white text-[9px] font-black px-2.5 py-1.5 rounded border-none cursor-pointer transition-all disabled:opacity-40"
                >
                  1/2
                </button>
                <button
                  onClick={() => multiplyBet(2.0)}
                  disabled={hasBet || bettingClosed || isAutoplayActive}
                  className="bg-[#26293b] hover:bg-[#2d3148] text-white text-[9px] font-black px-2.5 py-1.5 rounded border-none cursor-pointer transition-all disabled:opacity-40"
                >
                  X2
                </button>
              </div>
            </div>
          </div>

          {/* Number of Bets (only for Autoplay) */}
          {betTab === 'autoplay' && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
                <span>NUMBER OF BETS</span>
                <span>{autoplayCount} Rounds</span>
              </div>
              <div className="flex bg-[#0f111a] p-1 rounded-xl border border-white/[0.04] gap-1">
                {['10', '25', '50', '100'].map((val) => (
                  <button
                    key={val}
                    onClick={() => { playClick(); setAutoplayCount(val); }}
                    disabled={isAutoplayActive}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all border-none cursor-pointer ${
                      autoplayCount === val ? 'bg-[#26293b] text-white' : 'bg-transparent text-text-muted hover:text-white'
                    } disabled:opacity-40`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                disabled={isAutoplayActive}
                className="bg-[#0f111a] border border-white/[0.05] rounded-xl px-3.5 py-2.5 text-white font-extrabold text-xs w-full focus:ring-0 outline-none text-center"
                value={autoplayCount}
                placeholder="Custom count"
                onChange={(e) => setAutoplayCount(e.target.value)}
              />
            </div>
          )}

          {/* Countdown Timer */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
              <span>NEXT ROUND TIMER</span>
              <span className={bettingClosed ? "text-red-500 font-black" : "text-[#3de796] font-black"}>{timer}s</span>
            </div>
            <div className="relative w-full h-2.5 bg-[#0f111a] rounded-full overflow-hidden border border-white/[0.04]">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  bettingClosed ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-[#3de796] shadow-[0_0_8px_#3de796]'
                }`}
                style={{ width: `${(timer / 15) * 100}%` }}
              />
            </div>

            {/* Below timer: Animated digital ticker detail */}
            <div className="flex justify-center items-center py-2">
              <span className={`text-7xl font-black font-mono tracking-widest ${bettingClosed ? 'text-red-500 animate-pulse' : 'text-[#3de796]'}`}>
                {String(timer).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {betTab === 'autoplay' ? (
          <button
            onClick={toggleAutoplay}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-none cursor-pointer mt-6 shadow-lg ${
              isAutoplayActive
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/15'
                : 'bg-[#2effb0] hover:bg-[#2effb0]/90 text-[#0f111a] shadow-[#2effb0]/15'
            }`}
          >
            {isAutoplayActive ? `Stop Autoplay (${autoplayCount})` : 'Start Autoplay'}
          </button>
        ) : (
          <button
            onClick={placeBet}
            disabled={hasBet || bettingClosed}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-none cursor-pointer mt-6 shadow-lg ${
              hasBet
                ? 'bg-[#141622] text-[#3de796] border border-[#3de796]/20 cursor-default'
                : bettingClosed
                ? 'bg-zinc-800/80 text-white/20 cursor-not-allowed'
                : 'bg-[#2effb0] hover:bg-[#2effb0]/90 text-[#0f111a] shadow-[#2effb0]/15'
            }`}
          >
            {hasBet ? 'Bet Placed' : bettingClosed ? `Betting Closed (${timer}s)` : `Play`}
          </button>
        )}
      </div>

      {/* Right panel: Game Area */}
      <div className="flex-1 bg-[#161824] rounded-[24px] p-6 flex flex-col items-center justify-between border border-white/[0.03] shadow-lg relative min-h-[480px]">
        
        {/* Timer Bar or Count details in top header */}
        <div className="w-full flex justify-between items-center px-4 py-2 bg-[#0f111a]/80 rounded-2xl border border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${bettingClosed ? 'bg-red-500 animate-pulse' : 'bg-[#3de796] animate-pulse'}`} />
            <span className="text-[10px] font-black tracking-widest text-text-muted uppercase">
              {bettingClosed ? 'Round Processing' : 'Betting Phase'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-black">
            <Timer size={14} className={bettingClosed ? 'text-red-500' : 'text-[#3de796]'} />
            <span className={bettingClosed ? 'text-red-500' : 'text-[#3de796]'}>{timer}s</span>
          </div>
        </div>

        {/* Main Coin Stage */}
        <div className="flex-1 flex flex-col items-center justify-center py-6 w-full relative">
          <div className="relative w-44 h-44 flex items-center justify-center">
            
            {/* Spinning/Static Ring Coin */}
            <div
              className={`w-36 h-36 rounded-full border-[18px] transition-all flex items-center justify-center text-white font-black text-4xl shadow-2xl relative ${
                spinning 
                  ? (prediction === 'heads' ? 'coin-spinning-h' : 'coin-spinning-t')
                  : ''
              } ${
                result === 'tails'
                  ? 'border-[#e2e8f0] [background:radial-gradient(circle,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0.4)_100%)] shadow-slate-500/10'
                  : 'border-[#fbbf24] [background:radial-gradient(circle,rgba(251,191,36,0.12)_0%,rgba(0,0,0,0.4)_100%)] shadow-yellow-500/10'
              }`}
            >
              {/* Shimmer overlay effect */}
              <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none opacity-45" />
              {spinning ? '?' : result ? result.toUpperCase().charAt(0) : '?'}
            </div>

            {/* Micro-effects on Win/Loss */}
            {result && !spinning && (
              <div className="absolute -bottom-8 bg-[#0f111a]/95 border border-white/5 px-4 py-1.5 rounded-full text-[11px] font-black shadow-lg">
                {won ? (
                  <span className="text-[#3de796]">WON +₹{(activeBetAmount * 1.95).toFixed(2)}</span>
                ) : (
                  <span className="text-text-muted">Landed on {result.toUpperCase()}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prediction Selector Controls */}
        <div className="flex items-center bg-[#0f111a] rounded-[18px] p-1.5 border border-white/[0.04] gap-2 mb-6">
          <button
            onClick={() => { playClick(); setPrediction('heads'); }}
            disabled={hasBet || bettingClosed || isAutoplayActive}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[11px] tracking-wider transition-all border-none cursor-pointer ${
              prediction === 'heads'
                ? 'bg-[#26293b] text-white shadow-lg'
                : 'bg-transparent text-text-muted hover:text-white'
            } disabled:opacity-50`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
            HEADS
          </button>
          
          <button
            onClick={selectRandom}
            disabled={hasBet || bettingClosed || isAutoplayActive}
            className="p-3 bg-[#1e2130] hover:bg-[#26293b] text-text-muted hover:text-white rounded-xl border-none cursor-pointer transition-all flex items-center justify-center disabled:opacity-50"
            title="Random Selection"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <circle cx="15.5" cy="15.5" r="1.5"/>
              <circle cx="15.5" cy="8.5" r="1.5"/>
              <circle cx="8.5" cy="15.5" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
            </svg>
          </button>

          <button
            onClick={() => { playClick(); setPrediction('tails'); }}
            disabled={hasBet || bettingClosed || isAutoplayActive}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[11px] tracking-wider transition-all border-none cursor-pointer ${
              prediction === 'tails'
                ? 'bg-[#26293b] text-white shadow-lg'
                : 'bg-transparent text-text-muted hover:text-white'
            } disabled:opacity-50`}
          >
            <span className="w-2.5 h-2.5 bg-[#cbd5e1] rotate-45" />
            TAILS
          </button>
        </div>

        {/* History row: keeps sliding left with exactly 12 results, animating entrances, with gradient shadow overlay at the left edge */}
        <div className="w-full relative flex items-center justify-center py-3 border-t border-white/[0.03] overflow-hidden min-h-[50px]">
          {/* Left shadow fade mask */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#161824] via-[#161824]/90 to-transparent z-10 pointer-events-none" />
          
          <div className="flex gap-2 items-center justify-end px-6 max-w-md w-full">
            <AnimatePresence initial={false}>
              {last12.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 25, scale: 0.7 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -25, scale: 0.7 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  className={`w-7 h-7 rounded flex items-center justify-center font-black text-[10px] select-none border shadow-sm shrink-0 ${
                    item.val === 'heads'
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 text-yellow-950 shadow-yellow-500/10'
                      : 'bg-gradient-to-br from-slate-300 to-slate-500 border-slate-200 text-slate-900 shadow-slate-500/10'
                  }`}
                >
                  {item.val === 'heads' ? 'H' : 'T'}
                </motion.div>
              ))}
            </AnimatePresence>
            {last12.length === 0 && (
              <span className="text-[10px] text-text-dim uppercase tracking-widest font-black py-1">Waiting for history...</span>
            )}
          </div>
        </div>
      </div>

      {/* Center Result Overlay Popup Modal */}
      {showResultPopup && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-[24px] transition-all animate-fadeIn cursor-pointer"
          onClick={() => setShowResultPopup(false)}
        >
          <div 
            className={`p-6 rounded-3xl border text-center shadow-2xl max-w-xs w-full mx-4 transition-all scale-100 cursor-default ${
              popupData.won 
                ? 'bg-gradient-to-b from-[#1a2e26] to-[#0d1713] border-[#3de796]/30 text-white' 
                : 'bg-gradient-to-b from-[#2d1e22] to-[#180f11] border-red-500/30 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end -mt-2 -mr-2">
              <button 
                onClick={() => setShowResultPopup(false)} 
                className="text-white/40 hover:text-white bg-transparent border-none cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex justify-center mb-3">
              {popupData.won ? (
                <div className="w-16 h-16 rounded-full bg-[#3de796]/15 flex items-center justify-center text-[#3de796] border border-[#3de796]/30 shadow-lg shadow-[#3de796]/10">
                  <Award size={36} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center text-red-500 border border-red-500/30 shadow-lg shadow-red-500/10">
                  <span className="text-3xl font-black">!</span>
                </div>
              )}
            </div>

            <h3 className="text-base font-black tracking-wider uppercase mb-1">
              {popupData.won ? 'Winner!' : 'No Luck!'}
            </h3>
            
            <p className="text-[11px] text-white/60 mb-4 font-semibold">
              Round Outcome: <span className="font-extrabold text-white capitalize">{popupData.outcome}</span>
            </p>

            <div className="bg-[#0f111a]/60 px-4 py-2.5 rounded-xl border border-white/[0.04] inline-block">
              {popupData.won ? (
                <span className="text-[#3de796] text-lg font-black tracking-wide">
                  +₹{popupData.amount.toFixed(2)}
                </span>
              ) : (
                <span className="text-white/70 text-xs font-black tracking-wide">
                  Bet amount: ₹{activeBetAmount}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
