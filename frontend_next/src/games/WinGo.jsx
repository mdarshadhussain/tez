'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CircleDot, Award, ShieldCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock User IDs matching Color Prediction/Roulette pattern
const MOCK_USER_IDS = [
  '62XXX180', '69XXX373', '81XXX924', '70XXX112', '93XXX884',
  '88XXX451', '60XXX730', '95XXX192', '77XXX360', '85XXX549'
];

export default function WinGo({ socket, user, playableBalance, setPlayableBalance, isDemo }) {
  const [timer, setTimer] = useState(15);
  const [history, setHistory] = useState([
    { round: 1024, num: 7, color: 'green' },
    { round: 1023, num: 2, color: 'red' },
    { round: 1022, num: 5, color: 'violet' },
    { round: 1021, num: 9, color: 'green' },
    { round: 1020, num: 0, color: 'violet' }
  ]);
  const [betAmount, setBetAmount] = useState('50');
  const [activeTab, setActiveTab] = useState('color'); // color or bigsmall
  const [selectedBet, setSelectedBet] = useState(null); // red, green, violet, 0-9, big, small
  const [lastOutcome, setLastOutcome] = useState(null);
  const [hasBet, setHasBet] = useState(false);

  // Live betting card states
  const [liveBets, setLiveBets] = useState([]);
  const [greenPoolValue, setGreenPoolValue] = useState(48000);
  const [violetPoolValue, setVioletPoolValue] = useState(12000);
  const [redPoolValue, setRedPoolValue] = useState(45000);

  // Shuffling active cursor angle for drawing phase
  const [activeShufflingIndex, setActiveShufflingIndex] = useState(null);

  // Local round counter
  const roundCounterRef = useRef(1025);

  // Generate a random mock bet matching Hilo/Roulette style
  const generateMockBet = useCallback(() => {
    const name = MOCK_USER_IDS[Math.floor(Math.random() * MOCK_USER_IDS.length)];
    const cleanHundreds = [50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000];
    const cleanTens = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    
    let amount = 100;
    const roll = Math.random();
    if (roll < 0.70) {
      amount = cleanHundreds[Math.floor(Math.random() * cleanHundreds.length)];
    } else if (roll < 0.95) {
      amount = cleanTens[Math.floor(Math.random() * cleanTens.length)];
    } else {
      amount = Math.floor(Math.random() * 5 + 3) * 1000;
    }

    const choices = ['green', 'violet', 'red', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'big', 'small'];
    const choice = choices[Math.floor(Math.random() * choices.length)];
    return {
      id: Math.random(),
      username: name,
      betAmount: amount,
      choice
    };
  }, []);

  // Settle round and determine outcome
  const resolveRound = useCallback(() => {
    const num = Math.floor(Math.random() * 10);
    let color = 'red';
    if (num === 0 || num === 5) {
      color = 'violet';
    } else if (num % 2 === 1) {
      color = 'green';
    }

    const outcome = { round: roundCounterRef.current, num, color };
    setLastOutcome(outcome);
    setHistory(prev => [outcome, ...prev].slice(0, 14));
    roundCounterRef.current += 1;

    // Check user wins
    if (hasBet && selectedBet) {
      let won = false;
      let multiplier = 0;

      if (selectedBet === 'red') {
        won = (num % 2 === 0 && num !== 0);
        multiplier = 2;
      } else if (selectedBet === 'green') {
        won = (num % 2 === 1 && num !== 5);
        multiplier = 2;
      } else if (selectedBet === 'violet') {
        won = (num === 0 || num === 5);
        multiplier = 4.5;
      } else if (selectedBet === 'big') {
        won = (num >= 5);
        multiplier = 1.96;
      } else if (selectedBet === 'small') {
        won = (num <= 4);
        multiplier = 1.96;
      } else {
        won = (selectedBet === String(num));
        multiplier = 9;
      }

      if (won) {
        const payout = parseFloat((parseFloat(betAmount) * multiplier).toFixed(2));
        setPlayableBalance(prev => prev + payout);
      }
    }

    // Reset round states
    setSelectedBet(null);
    setHasBet(false);
    setLiveBets([]);
    setGreenPoolValue(48000);
    setVioletPoolValue(12000);
    setRedPoolValue(45000);
    setActiveShufflingIndex(null);

  }, [hasBet, selectedBet, betAmount, setPlayableBalance]);

  // Main 15-second loop timer
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimer(prev => {
        if (prev > 1) {
          return prev - 1;
        } else {
          setTimeout(() => {
            resolveRound();
          }, 0);
          return 15;
        }
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [resolveRound]);

  // Fast mock betting sub-timer (High traffic multiplayer lobby simulation)
  useEffect(() => {
    if (timer <= 3) return;

    const feedInterval = setInterval(() => {
      const betsCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 bets per tick
      for (let i = 0; i < betsCount; i++) {
        const newBet = generateMockBet();
        setLiveBets(l => [newBet, ...l]);
        const c = newBet.choice;
        if (c === 'green' || ['1','3','7','9'].includes(c) || c === 'small') {
          setGreenPoolValue(p => p + newBet.betAmount * 5);
        } else if (c === 'red' || ['2','4','6','8'].includes(c) || c === 'big') {
          setRedPoolValue(p => p + newBet.betAmount * 5);
        } else {
          setVioletPoolValue(p => p + newBet.betAmount * 5);
        }
      }
    }, 220); // Fast interval for live action

    return () => clearInterval(feedInterval);
  }, [timer, generateMockBet]);

  // Outer ring laser rotation index shuffler
  useEffect(() => {
    if (timer <= 3) {
      const shuffler = setInterval(() => {
        setActiveShufflingIndex(prev => (prev === null ? 0 : (prev + 1) % 10));
      }, 80);
      return () => clearInterval(shuffler);
    } else {
      setActiveShufflingIndex(null);
    }
  }, [timer]);

  const placeBet = () => {
    if (!selectedBet) return alert('Select your bet first');
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    if (timer <= 3) {
      return alert('Betting closed for this round (3s lock)');
    }

    setPlayableBalance(prev => prev - amt);
    setHasBet(true);
  };

  const totalPool = greenPoolValue + violetPoolValue + redPoolValue || 1;
  const greenPercent = Math.round((greenPoolValue / totalPool) * 100);
  const violetPercent = Math.round((violetPoolValue / totalPool) * 100);
  const redPercent = 100 - greenPercent - violetPercent;

  // Helpers to get background of numbers
  const getNumberBg = (n) => {
    if (n === 0 || n === 5) return 'bg-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.5)]';
    if (n % 2 === 1) return 'bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    return 'bg-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch w-full h-full select-none bg-transparent">
      
      {/* LEFT SIDEBAR - CONTROL PANEL */}
      <div className="lg:col-span-4 bg-[#141622] border border-white/[0.02] p-5 rounded-3xl flex flex-col gap-4 shadow-xl justify-between h-full relative overflow-hidden shrink-0">
        
        <div className="space-y-3">
          {/* TAB MODE SELECTOR */}
          <div className="bg-zinc-950/40 p-1 rounded-xl flex gap-1 border border-white/5">
            <button
              onClick={() => { setActiveTab('color'); setSelectedBet(null); }}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                activeTab === 'color'
                  ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Colors & Numbers
            </button>
            <button
              onClick={() => { setActiveTab('bigsmall'); setSelectedBet(null); }}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                activeTab === 'bigsmall'
                  ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Big / Small Range
            </button>
          </div>
        </div>

        {/* BET TARGET SELECTION COMPONENT */}
        <div className="space-y-2">
          <span className="text-[9px] text-zinc-400 font-bold tracking-widest uppercase block">Select Bet Option</span>
          {activeTab === 'color' ? (
            <div className="space-y-3">
              {/* Primary Color Targets */}
              <div className="flex gap-2">
                {['green', 'violet', 'red'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedBet(c)}
                    disabled={timer <= 3 || hasBet}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 cursor-pointer text-white ${
                      selectedBet === c ? 'border-white shadow-lg' : 'border-transparent'
                    }`}
                    style={{
                      background: c === 'green' ? '#10b981' : c === 'violet' ? '#8b5cf6' : '#ef4444',
                    }}
                  >
                    {c} {c === 'violet' ? '4.5x' : '2x'}
                  </button>
                ))}
              </div>

              {/* Number Matrix Targets */}
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelectedBet(String(n))}
                    disabled={timer <= 3 || hasBet}
                    className={`py-2 rounded-lg text-[9px] font-black transition-all cursor-pointer border ${
                      selectedBet === String(n)
                        ? 'bg-[#3de796] border-[#3de796] text-black shadow-md'
                        : 'bg-zinc-950/20 border-white/5 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {n} (9x)
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedBet('small')}
                disabled={timer <= 3 || hasBet}
                className={`flex-1 p-3 rounded-2xl text-xs font-black uppercase transition-all border text-white cursor-pointer ${
                  selectedBet === 'small'
                    ? 'bg-[#3de796] border-[#3de796] text-black shadow-md'
                    : 'bg-zinc-950/20 border-white/5 hover:text-white'
                }`}
              >
                <div>Small (0-4)</div>
                <div className="text-[9px] text-zinc-400 font-bold mt-1 font-mono">1.96x payout</div>
              </button>

              <button
                onClick={() => setSelectedBet('big')}
                disabled={timer <= 3 || hasBet}
                className={`flex-1 p-3 rounded-2xl text-xs font-black uppercase transition-all border text-white cursor-pointer ${
                  selectedBet === 'big'
                    ? 'bg-[#3de796] border-[#3de796] text-black shadow-md'
                    : 'bg-zinc-950/20 border-white/5 hover:text-white'
                }`}
              >
                <div>Big (5-9)</div>
                <div className="text-[9px] text-zinc-400 font-bold mt-1 font-mono">1.96x payout</div>
              </button>
            </div>
          )}
        </div>

        {/* BET AMOUNT INPUT COMPONENT */}
        <div className="space-y-2">
          <span className="text-[9px] text-zinc-400 font-bold tracking-widest uppercase block">Bet Amount</span>
          
          <div className="flex gap-1.5 bg-zinc-950/40 p-2.5 rounded-2xl border border-white/5">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#3de796]">₹</span>
              <input
                type="number"
                value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                disabled={timer <= 3 || hasBet}
                className="w-full bg-zinc-900/60 border border-white/5 rounded-xl py-2 pl-7 pr-3 text-xs font-black text-white focus:outline-none focus:border-[#3de796]/30 transition-all font-mono"
              />
            </div>
            <button
              disabled={timer <= 3 || hasBet}
              onClick={() => setBetAmount(prev => String(Math.max(10, parseFloat(prev) / 2)))}
              className="px-3 bg-zinc-900/60 hover:bg-[#3de796]/10 text-white hover:text-[#3de796] rounded-xl font-black text-[10px] transition-all cursor-pointer border border-white/5"
            >1/2</button>
            <button
              disabled={timer <= 3 || hasBet}
              onClick={() => setBetAmount(prev => String(parseFloat(prev) * 2))}
              className="px-3 bg-zinc-900/60 hover:bg-[#3de796]/10 text-white hover:text-[#3de796] rounded-xl font-black text-[10px] transition-all cursor-pointer border border-white/5"
            >2x</button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mt-1.5">
            {['50', '100', '500', '1000'].map(val => (
              <button
                key={val}
                disabled={timer <= 3 || hasBet}
                onClick={() => setBetAmount(val)}
                className="py-1.5 bg-zinc-950/20 hover:bg-[#3de796]/10 text-white hover:text-[#3de796] rounded-lg font-black text-[9px] transition-all cursor-pointer border border-white/5"
              >
                ₹{val}
              </button>
            ))}
          </div>
        </div>

        {/* LIVE MULTIPLAYER POOLS & WAGERS FEED */}
        <div className="bg-zinc-950/30 border border-white/5 rounded-2xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-[8px] text-zinc-400 font-bold tracking-widest uppercase">
            <span>LIVE MULTIPLAYER POOLS</span>
            <span className="text-[#3de796] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3de796] animate-pulse" /> LIVE POOL</span>
          </div>
          
          <div className="flex h-2 rounded-full overflow-hidden bg-zinc-900 border border-white/5">
            <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${greenPercent}%` }} />
            <div className="bg-purple-500 transition-all duration-500" style={{ width: `${violetPercent}%` }} />
            <div className="bg-rose-500 transition-all duration-500" style={{ width: `${redPercent}%` }} />
          </div>
          
          <div className="grid grid-cols-3 gap-1 text-center text-[9px] font-black uppercase">
            <div className="bg-emerald-500/5 rounded p-1 border border-emerald-500/10 flex flex-col justify-center">
              <span className="text-emerald-400 block text-[5.5px] font-bold tracking-wider leading-none">GREEN</span>
              <span className="text-white font-mono text-[8px] mt-1">₹{greenPoolValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-purple-500/5 rounded p-1 border border-purple-500/10 flex flex-col justify-center">
              <span className="text-purple-400 block text-[5.5px] font-bold tracking-wider leading-none">VIOLET</span>
              <span className="text-white font-mono text-[8px] mt-1">₹{violetPoolValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-rose-500/5 rounded p-1 border border-rose-500/10 flex flex-col justify-center">
              <span className="text-rose-400 block text-[5.5px] font-bold tracking-wider leading-none">RED</span>
              <span className="text-white font-mono text-[8px] mt-1">₹{redPoolValue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/5 my-1" />

          {/* RECENT LIVE WAGERS LOG FEED */}
          <div className="space-y-1">
            <span className="text-[7.5px] text-zinc-400 font-bold tracking-widest uppercase block">RECENT LIVE WAGERS</span>
            <div className="space-y-1 max-h-[85px] overflow-y-auto scrollbar-none flex flex-col justify-end">
              {(() => {
                const displayBets = [];
                if (selectedBet) {
                  displayBets.push({ id: 'user', username: 'You', betAmount: parseFloat(betAmount), choice: selectedBet, isUser: true });
                }
                displayBets.push(...liveBets);
                return displayBets.slice(0, 2).map(wager => (
                  <div key={wager.id} className="flex items-center text-[8px] bg-zinc-950/20 border border-white/[0.02] p-1 px-2.5 rounded-lg text-white font-mono animate-fade-in">
                    <span className="w-16 font-semibold text-white/80 text-left">{wager.username}</span>
                    <span className="w-12 text-white/40 text-[7px] uppercase font-sans text-center">bet on</span>
                    <span className="w-12 flex justify-center">
                      <span className="font-extrabold text-[8.5px] uppercase" style={{
                        color: ['green','red','violet'].includes(wager.choice)
                          ? (wager.choice === 'green' ? '#10b981' : wager.choice === 'red' ? '#ef4444' : '#a855f7')
                          : '#fff'
                      }}>
                        {wager.choice}
                      </span>
                    </span>
                    <span className="flex-1 text-right font-black text-[#3de796] text-[8.5px]">₹{wager.betAmount.toLocaleString('en-IN')}</span>
                  </div>
                ));
              })()}

              {liveBets.length === 0 && !selectedBet && (
                <div className="text-[7.5px] text-white/20 italic p-1 text-center">Waiting for live wagers...</div>
              )}
            </div>
          </div>
        </div>

        {/* NEON EXECUTION BLOCK BUTTON */}
        <button
          onClick={placeBet}
          disabled={!selectedBet || timer <= 3 || hasBet}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider border-0 cursor-pointer transition-all ${
            hasBet
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-[0.98]'
              : timer <= 3
              ? 'bg-zinc-800/80 text-white/20 cursor-not-allowed'
              : !selectedBet
              ? 'bg-zinc-900/60 text-zinc-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-400 to-[#3de796] hover:from-emerald-500 hover:to-[#3de796]/95 text-black shadow-md hover:scale-[1.01]'
          }`}
        >
          {hasBet ? '✓ Bet Placed' : timer <= 3 ? '🔒 BETS LOCKED' : `Place Bet (₹${betAmount})`}
        </button>

      </div>

      {/* RIGHT SIDE PANEL - ACTIVE WINGO RADIAL RADAR BOARD */}
      <div 
        className="lg:col-span-8 flex flex-col justify-between h-full relative overflow-hidden select-none animate-fade-in p-6.5 rounded-3xl"
        style={{
          background: 'radial-gradient(circle at center, #1e1b4b 0%, #0c0f1d 75%, #02040a 100%)',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9), 0 15px 35px rgba(0,0,0,0.6)',
          border: '2.5px solid rgba(212, 175, 55, 0.45)'
        }}
      >
        {/* Luxury gold dashed felt lines */}
        <div className="absolute inset-4 rounded-2xl border border-dashed border-[#d4af37]/15 pointer-events-none" />

        {/* GIANT COUNTDOWN RADAR DIAL (Takes up 75% of the panel space) */}
        <div className="flex-1 flex items-center justify-center relative py-6 z-10">
          
          <div className="relative w-[310px] h-[310px] rounded-full flex items-center justify-center bg-black/60 border border-white/[0.04] shadow-2xl">
            
            {/* Spinning decorative orbit lines */}
            <div className="absolute inset-4 rounded-full border border-dashed border-[#3de796]/10 animate-spin-slow" />
            <div className="absolute inset-8 rounded-full border border-purple-500/10 animate-spin-reverse-slow" />
            
            {/* Outer Circular Numbers Target Dial */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n, i) => {
              const angleDeg = i * 36 - 90;
              const angleRad = angleDeg * (Math.PI / 180);
              const radius = 122; // Offset positions to sit on the outer ring
              const leftPos = `calc(50% + ${Math.cos(angleRad) * radius}px)`;
              const topPos = `calc(50% + ${Math.sin(angleRad) * radius}px)`;
              
              const isWinningIndex = lastOutcome && lastOutcome.num === n && timer > 3;
              const isShufflingActive = activeShufflingIndex === i;

              return (
                <div
                  key={n}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white border border-white/10 transition-all duration-200 ${getNumberBg(n)} ${
                    isWinningIndex 
                      ? 'scale-[1.3] ring-4 ring-[#d4af37] border-white z-20' 
                      : isShufflingActive
                      ? 'scale-[1.2] ring-2 ring-sky-400 border-white z-20'
                      : 'opacity-85'
                  }`}
                  style={{
                    left: leftPos,
                    top: topPos,
                  }}
                >
                  {n}
                </div>
              );
            })}

            {/* Inner Glowing Holographic Timer Console Core */}
            <div 
              className="w-40 h-40 rounded-full flex flex-col items-center justify-center relative bg-gradient-to-b from-[#11131e]/98 to-[#05060a]/99 border border-white/10 shadow-2xl backdrop-blur-md"
              style={{
                boxShadow: timer <= 3
                  ? '0 0 35px rgba(239,68,68,0.3), inset 0 0 20px rgba(239,68,68,0.15)'
                  : selectedBet
                  ? '0 0 35px rgba(61,231,150,0.3), inset 0 0 20px rgba(61,231,150,0.15)'
                  : '0 0 30px rgba(59,130,246,0.2), inset 0 0 20px rgba(59,130,246,0.1)'
              }}
            >
              {/* Radial gloss reflection */}
              <div className="absolute top-1 left-4 right-4 h-10 bg-gradient-to-b from-white/5 to-transparent rounded-t-full pointer-events-none" />

              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="74"
                  stroke="rgba(255,255,255,0.02)"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="74"
                  stroke={timer <= 3 ? '#ef4444' : '#3de796'}
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray="465"
                  initial={{ strokeDashoffset: 465 }}
                  animate={{ strokeDashoffset: 465 - (timer / 15) * 465 }}
                  transition={{ duration: 0.95, ease: 'linear' }}
                  style={{
                    filter: timer <= 3 
                      ? 'drop-shadow(0 0 5px #ef4444)' 
                      : 'drop-shadow(0 0 5px #3de796)',
                    strokeLinecap: 'round'
                  }}
                />
              </svg>

              <div className="flex flex-col items-center justify-center leading-none text-center">
                {timer <= 3 ? (
                  <>
                    <span className="text-3xl font-black font-mono text-[#ef4444] tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse">
                      LOCKED
                    </span>
                    <span className="text-[6.5px] text-zinc-500 font-extrabold uppercase mt-1">DRAWING...</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-black font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                      {timer}s
                    </span>
                    <span className="text-[7px] text-[#3de796] font-black uppercase mt-1 tracking-wider leading-none">NEXT DRAW</span>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* ACTIVE TARGET METADATA FOOTER DISPLAY */}
        <div className="flex justify-between items-center bg-black/45 border border-white/5 rounded-2xl p-3 px-5 mx-2.5 z-10 shadow-lg">
          <div>
            <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-widest block leading-none">Selected Prediction</span>
            <span className="text-xs font-black text-white block mt-1 uppercase">
              {selectedBet ? `🎯 ${selectedBet}` : 'No Bet Placed'}
            </span>
          </div>

          <div className="w-[1.5px] h-8 bg-white/5" />

          <div className="text-right">
            <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-widest block leading-none">Last Settled Round</span>
            <span className="text-xs font-black text-[#d4af37] block mt-1">
              {lastOutcome ? `#${lastOutcome.round} → Result: ${lastOutcome.num}` : 'Waiting...'}
            </span>
          </div>
        </div>

        {/* GLOWING HISTORICAL TRENDS TIMELINE PATH */}
        <div className="w-full space-y-2 z-10 shrink-0 border-t border-[#d4af37]/20 pt-4">
          <span className="text-[9px] font-black uppercase tracking-wider text-[#d4af37] block">Verifiable History Path</span>
          <div className="relative flex items-center justify-center gap-4 overflow-x-auto pb-1.5 scrollbar-none min-h-[55px] pt-1">
            
            {/* Connecting Neon Path Line */}
            <div className="absolute left-6 right-6 h-[1.5px] bg-gradient-to-r from-[#d4af37]/10 via-sky-500/20 to-[#d4af37]/10 pointer-events-none" />

            {history.slice(0, 10).map((h, i) => (
              <div
                key={i}
                className="flex flex-col items-center relative z-10 shrink-0"
              >
                {/* Nodes Display */}
                <motion.div 
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white shadow-md border border-white/10"
                  style={{
                    background: h.color === 'red' ? '#ef4444' : h.color === 'green' ? '#10b981' : '#8b5cf6',
                    boxShadow: `0 0 10px ${
                      h.color === 'red' ? 'rgba(239,68,68,0.3)' : h.color === 'green' ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)'
                    }`
                  }}
                >
                  {h.num}
                </motion.div>
                <span className="text-[5.5px] text-zinc-500 font-bold font-mono mt-1">#{h.round}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
