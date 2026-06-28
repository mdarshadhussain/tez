'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock } from 'lucide-react';

const CARD_SUITS = [
  { symbol: '♠', name: 'spades', color: '#1e293b' },
  { symbol: '♥', name: 'hearts', color: '#ef4444' },
  { symbol: '♦', name: 'diamonds', color: '#ef4444' },
  { symbol: '♣', name: 'clubs', color: '#1e293b' }
];

const CARD_VALUES = [
  { label: 'A', val: 1 },
  { label: '2', val: 2 },
  { label: '3', val: 3 },
  { label: '4', val: 4 },
  { label: '5', val: 5 },
  { label: '6', val: 6 },
  { label: '7', val: 7 },
  { label: '8', val: 8 },
  { label: '9', val: 9 },
  { label: '10', val: 10 },
  { label: 'J', val: 11 },
  { label: 'Q', val: 12 },
  { label: 'K', val: 13 }
];

// Mock User IDs matching Color Prediction/Roulette pattern
const MOCK_USER_IDS = [
  '62XXX180', '69XXX373', '81XXX924', '70XXX112', '93XXX884',
  '88XXX451', '60XXX730', '95XXX192', '77XXX360', '85XXX549'
];

export default function Hilo({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('50');
  const [gameActive, setGameActive] = useState(false);
  const [currentCard, setCurrentCard] = useState({ label: '7', val: 7, suit: '♥', color: '#ef4444', name: 'hearts' });
  const [nextCard, setNextCard] = useState(null);
  const [multiplier, setMultiplier] = useState(1.00);
  const [history, setHistory] = useState([
    { id: '1', card: { label: '7', val: 7, suit: '♥', color: '#ef4444', name: 'hearts' }, guessType: null, mult: 1.00 }
  ]);

  // Timing & Betting States (10 Seconds round countdown)
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameState, setGameState] = useState('betting'); // betting, drawing, reveal
  const [hasBet, setHasBet] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState(null); // 'high' or 'low'
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Autoplay states
  const [activeTab, setActiveTab] = useState('manual');
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [autoplayGuess, setAutoplayGuess] = useState('high');

  // Live Bets feed state
  const [liveBets, setLiveBets] = useState([]);
  const [isFlipping, setIsFlipping] = useState(false);

  // Pool values (High Pool vs Low Pool)
  const [highPoolValue, setHighPoolValue] = useState(128000);
  const [lowPoolValue, setLowPoolValue] = useState(115000);

  // Drawing process lock to prevent concurrent triggers
  const isDrawingRef = useRef(false);

  // Synthesize game sound effects using Web Audio API (Fully self-contained)
  const playSynthSound = (type) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'flip') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'deal') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch (e) {
      console.warn('Web Audio synthesis blocked:', e);
    }
  };

  const drawRandomCard = () => {
    const valObj = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
    const suitObj = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
    return { ...valObj, suit: suitObj.symbol, color: suitObj.color, name: suitObj.name };
  };

  // Generate a random mock bet matching roulette style (95% clean tens/hundreds, 5% big hundreds)
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

    const choice = Math.random() > 0.5 ? 'high' : 'low';
    return {
      id: Math.random(),
      username: name,
      betAmount: amount,
      choice,
      status: 'pending',
      multiplier: 0.00
    };
  }, []);

  // Card Draw execution (Draws exactly ONE card per round)
  const processCardDraw = useCallback(() => {
    if (isDrawingRef.current) return;
    isDrawingRef.current = true;
    
    setGameState('drawing');
    setIsFlipping(true);
    playSynthSound('flip'); // Play flip sound at start of draw
    
    const newCard = drawRandomCard();

    setTimeout(() => {
      setIsFlipping(false);
      playSynthSound('deal'); // Play deal sound when outcome lands
      
      const isSame = (newCard.val === currentCard.val);
      const isHigher = (newCard.val > currentCard.val);
      const isLower = (newCard.val < currentCard.val);

      let userWon = false;
      let winningMult = 1.00;

      const higherCount = 14 - currentCard.val;
      const lowerCount = currentCard.val;
      const highChance = higherCount / 13;
      const lowChance = lowerCount / 13;
      const highMult = currentCard.val === 1 ? parseFloat((0.97 / (12/13)).toFixed(2)) : parseFloat((0.97 / (highChance || 0.08)).toFixed(2));
      const lowMult = currentCard.val === 13 ? parseFloat((0.97 / (12/13)).toFixed(2)) : parseFloat((0.97 / (lowChance || 0.08)).toFixed(2));

      if (hasBet && selectedGuess) {
        if (currentCard.val === 13) {
          if (selectedGuess === 'low' && isLower) {
            userWon = true;
            winningMult = lowMult;
          } else if (selectedGuess === 'same' && isSame) {
            userWon = true;
            winningMult = 12.61;
          }
        } else if (currentCard.val === 1) {
          if (selectedGuess === 'high' && isHigher) {
            userWon = true;
            winningMult = highMult;
          } else if (selectedGuess === 'same' && isSame) {
            userWon = true;
            winningMult = 12.61;
          }
        } else {
          if (selectedGuess === 'high' && (isHigher || isSame)) {
            userWon = true;
            winningMult = highMult;
          } else if (selectedGuess === 'low' && (isLower || isSame)) {
            userWon = true;
            winningMult = lowMult;
          }
        }

        if (userWon) {
          const payout = parseFloat((parseFloat(betAmount) * winningMult).toFixed(2));
          setPlayableBalance(prev => prev + payout);
        }
      }

      setLiveBets(prev => 
        prev.map(bet => {
          let win = false;
          let mult = 1.00;
          
          if (currentCard.val === 13) {
            if (bet.choice === 'low') win = isLower;
            else if (bet.choice === 'same') win = isSame;
            mult = bet.choice === 'same' ? 12.61 : lowMult;
          } else if (currentCard.val === 1) {
            if (bet.choice === 'high') win = isHigher;
            else if (bet.choice === 'same') win = isSame;
            mult = bet.choice === 'same' ? 12.61 : highMult;
          } else {
            if (bet.choice === 'high') win = (isHigher || isSame);
            else if (bet.choice === 'low') win = (isLower || isSame);
            mult = bet.choice === 'high' ? highMult : lowMult;
          }

          return {
            ...bet,
            status: win ? 'won' : 'lost',
            multiplier: win ? mult : 0.00
          };
        })
      );

      const winningDirection = newCard.val > currentCard.val ? 'high' : newCard.val < currentCard.val ? 'low' : 'same';
      const winningOutcomeMult = winningDirection === 'high' ? highMult : winningDirection === 'low' ? lowMult : 12.61;

      setHistory(prev => {
        const nextHist = [
          ...prev,
          {
            id: String(Date.now() + Math.random()),
            card: newCard,
            guessType: winningDirection,
            mult: winningOutcomeMult
          }
        ];
        if (nextHist.length > 5) {
          return nextHist.slice(nextHist.length - 5);
        }
        return nextHist;
      });

      setCurrentCard(newCard);
      setGameState('reveal');

      setTimeout(() => {
        setLiveBets([]);
        setHasBet(false);
        setSelectedGuess(null);
        setHighPoolValue(128000);
        setLowPoolValue(115000);
        setTimeLeft(10);
        isDrawingRef.current = false;
        setGameState('betting');
      }, 3500);

    }, 800);
  }, [currentCard, hasBet, selectedGuess, betAmount, setPlayableBalance]);

  // Timer loop
  useEffect(() => {
    if (gameState !== 'betting') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev > 1) {
          return prev - 1;
        } else {
          clearInterval(timer);
          processCardDraw();
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, processCardDraw]);

  // Fast mock betting sub-timer (High traffic multiplayer lobby simulation)
  useEffect(() => {
    if (gameState !== 'betting' || timeLeft <= 3) return;

    const feedInterval = setInterval(() => {
      const betsCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 bets per tick
      for (let i = 0; i < betsCount; i++) {
        const newBet = generateMockBet();
        setLiveBets(l => [newBet, ...l]);
        if (newBet.choice === 'high') {
          setHighPoolValue(p => p + newBet.betAmount * 6);
        } else {
          setLowPoolValue(p => p + newBet.betAmount * 6);
        }
      }
    }, 220); // Fast interval for live action

    return () => clearInterval(feedInterval);
  }, [gameState, timeLeft, generateMockBet]);

  // Autoplay automatic betting hook
  useEffect(() => {
    if (activeTab === 'autoplay' && isAutoplayActive && !hasBet && timeLeft === 4) {
      let finalGuess = autoplayGuess;
      if (currentCard.val === 13 && finalGuess === 'high') {
        finalGuess = 'low';
      } else if (currentCard.val === 1 && finalGuess === 'low') {
        finalGuess = 'high';
      }
      
      const amt = parseFloat(betAmount);
      if (!isNaN(amt) && amt >= 10 && amt <= playableBalance) {
        setPlayableBalance(prev => prev - amt);
        setHasBet(true);
        setSelectedGuess(finalGuess);
        if (finalGuess === 'high') {
          setHighPoolValue(prev => prev + amt);
        } else {
          setLowPoolValue(prev => prev + amt);
        }
      } else {
        setIsAutoplayActive(false);
      }
    }
  }, [timeLeft, activeTab, isAutoplayActive, hasBet, autoplayGuess, currentCard, betAmount, playableBalance, setPlayableBalance]);

  // Place Bet
  const placeBet = (guess) => {
    if (timeLeft <= 3) return alert('Bets are locked for the last 3 seconds of the round!');
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    setPlayableBalance(prev => prev - amt);
    setHasBet(true);
    setSelectedGuess(guess);

    if (guess === 'high') {
      setHighPoolValue(prev => prev + amt);
    } else {
      setLowPoolValue(prev => prev + amt);
    }
  };

  // Option Odds display values
  const getCardOptions = () => {
    const val = currentCard.val;
    const higherCount = 14 - val;
    const lowerCount = val;
    
    const highChance = val === 1 ? 92.31 : parseFloat(((higherCount / 13) * 100).toFixed(2));
    const lowChance = val === 13 ? 92.31 : parseFloat(((lowerCount / 13) * 100).toFixed(2));
    
    const highMult = val === 1 ? 1.05 : parseFloat((0.97 / (higherCount / 13)).toFixed(2));
    const lowMult = val === 13 ? 1.05 : parseFloat((0.97 / (lowerCount / 13)).toFixed(2));
    
    return {
      high: { chance: highChance, mult: highMult },
      low: { chance: lowChance, mult: lowMult }
    };
  };

  const options = getCardOptions();
  const totalPool = highPoolValue + lowPoolValue || 1;
  const highPercent = Math.round((highPoolValue / totalPool) * 100);
  const lowPercent = Math.round((lowPoolValue / totalPool) * 100);

  const ThrillCardBack = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-[#5c56f8] to-[#4038d3] rounded-3xl flex items-center justify-center p-3 select-none border border-white/10 shadow-2xl">
      <div className="w-full h-full border-2 border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,#fff_8px,#fff_16px)]" />
        <span className="text-white text-3xl font-black font-sans tracking-tight italic select-none rotate-[-90deg] opacity-40">
          thrill
        </span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch w-full h-full select-none bg-transparent">
      
      {/* LEFT SIDE PANEL - UNIFIED CONSOLE CONTROLS */}
      <div className="lg:col-span-4 bg-[#141622] border border-white/[0.02] p-5 rounded-3xl flex flex-col gap-4 shadow-xl justify-between h-full relative overflow-hidden shrink-0 animate-fade-in">
        
        {/* MANUAL / AUTOPLAY TAB SWITCHER */}
        <div className="space-y-3">
          <div className="bg-zinc-950/40 p-1 rounded-xl flex gap-1 border border-white/5">
            <button
              onClick={() => { setActiveTab('manual'); setIsAutoplayActive(false); }}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setActiveTab('autoplay')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                activeTab === 'autoplay'
                  ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Autoplay
            </button>
          </div>

          {/* WALLET / PLAY BALANCE DISPLAY */}
          <div className="bg-zinc-950/20 border border-white/5 rounded-2xl p-3 flex justify-between items-center">
            <div>
              <span className="text-[8px] text-zinc-400 font-bold tracking-widest uppercase block leading-none">PLAY BALANCE</span>
              <span className="text-white font-extrabold text-sm block mt-1">₹{playableBalance.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[8px] text-zinc-400 font-bold tracking-widest uppercase block leading-none">TOTAL BET</span>
              <span className="text-[#3de796] font-black text-sm block mt-1">₹{hasBet ? betAmount : '0'}</span>
            </div>
          </div>
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
                disabled={hasBet || timeLeft <= 3 || isAutoplayActive}
                className="w-full bg-zinc-900/60 border border-white/5 rounded-xl py-2 pl-7 pr-3 text-xs font-black text-white focus:outline-none focus:border-[#3de796]/30 transition-all font-mono"
              />
            </div>
            <button
              disabled={hasBet || timeLeft <= 3 || isAutoplayActive}
              onClick={() => setBetAmount(prev => String(Math.max(10, parseFloat(prev) / 2)))}
              className="px-3 bg-zinc-900/60 hover:bg-[#3de796]/10 text-white hover:text-[#3de796] rounded-xl font-black text-[10px] transition-all cursor-pointer border border-white/5"
            >1/2</button>
            <button
              disabled={hasBet || timeLeft <= 3 || isAutoplayActive}
              onClick={() => setBetAmount(prev => String(parseFloat(prev) * 2))}
              className="px-3 bg-zinc-900/60 hover:bg-[#3de796]/10 text-white hover:text-[#3de796] rounded-xl font-black text-[10px] transition-all cursor-pointer border border-white/5"
            >2x</button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mt-1.5">
            {['50', '100', '500', '1000'].map(val => (
              <button
                key={val}
                disabled={hasBet || timeLeft <= 3 || isAutoplayActive}
                onClick={() => setBetAmount(val)}
                className="py-1.5 bg-zinc-950/20 hover:bg-[#3de796]/10 text-white hover:text-[#3de796] rounded-lg font-black text-[9px] transition-all cursor-pointer border border-white/5"
              >
                ₹{val}
              </button>
            ))}
          </div>
        </div>

        {/* AUTOPLAY OPTIONS */}
        {activeTab === 'autoplay' && (
          <div className="space-y-2">
            <span className="text-[9px] text-zinc-400 font-bold tracking-widest uppercase block">Autoplay Prediction Direction</span>
            <div className="bg-zinc-950/40 p-1 rounded-xl flex gap-1 border border-white/5">
              <button
                onClick={() => setAutoplayGuess('high')}
                disabled={isAutoplayActive}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                  autoplayGuess === 'high'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'bg-transparent text-zinc-400 hover:text-white'
                }`}
              >
                ▲ HIGHER
              </button>
              <button
                onClick={() => setAutoplayGuess('low')}
                disabled={isAutoplayActive}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                  autoplayGuess === 'low'
                    ? 'bg-[#ef4444] text-white shadow-md'
                    : 'bg-transparent text-zinc-400 hover:text-white'
                }`}
              >
                ▼ LOWER
              </button>
            </div>
          </div>
        )}

        {/* LIVE MULTIPLAYER POOLS & WAGERS FEED */}
        <div className="bg-zinc-950/30 border border-white/5 rounded-2xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-[8px] text-zinc-400 font-bold tracking-widest uppercase">
            <span>LIVE MULTIPLAYER POOLS</span>
            <span className="text-[#3de796] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3de796] animate-pulse" /> LIVE POOL</span>
          </div>
          
          <div className="flex h-2 rounded-full overflow-hidden bg-zinc-900 border border-white/5">
            <div 
              className="bg-emerald-500 transition-all duration-500" 
              style={{ width: `${highPercent}%` }} 
            />
            <div 
              className="bg-rose-500 transition-all duration-500" 
              style={{ width: `${lowPercent}%` }} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 text-center text-[9px] font-black uppercase">
            <div className="bg-emerald-500/5 rounded p-1 border border-emerald-500/10 flex flex-col justify-center">
              <span className="text-emerald-400 block text-[6.5px] font-bold tracking-wider leading-none">HIGHER POOL</span>
              <span className="text-white font-mono text-[9px] mt-1">₹{highPoolValue.toLocaleString('en-IN')}</span>
              <span className="text-white/30 text-[5.5px] mt-0.5 font-sans lowercase">({highPercent}%)</span>
            </div>
            <div className="bg-rose-500/5 rounded p-1 border border-rose-500/10 flex flex-col justify-center">
              <span className="text-rose-400 block text-[6.5px] font-bold tracking-wider leading-none">LOWER POOL</span>
              <span className="text-white font-mono text-[9px] mt-1">₹{lowPoolValue.toLocaleString('en-IN')}</span>
              <span className="text-white/30 text-[5.5px] mt-0.5 font-sans lowercase">({lowPercent}%)</span>
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/5 my-1" />

          {/* RECENT LIVE WAGERS LOG FEED */}
          <div className="space-y-1">
            <span className="text-[7.5px] text-zinc-400 font-bold tracking-widest uppercase block">RECENT LIVE WAGERS</span>
            <div className="space-y-1 max-h-[85px] overflow-y-auto scrollbar-none flex flex-col justify-end">
              {(() => {
                const displayBets = [];
                if (hasBet) {
                  displayBets.push({ id: 'user', username: 'You', betAmount: parseFloat(betAmount), choice: selectedGuess, isUser: true });
                }
                displayBets.push(...liveBets);
                return displayBets.slice(0, 2).map(wager => (
                  <div key={wager.id} className="flex items-center text-[8px] bg-zinc-950/20 border border-white/[0.02] p-1 px-2.5 rounded-lg text-white font-mono animate-fade-in">
                    <span className="w-16 font-semibold text-white/80 text-left">{wager.username}</span>
                    <span className="w-12 text-white/40 text-[7px] uppercase font-sans text-center">bet on</span>
                    <span className="w-12 flex justify-center">
                      <span className={`w-2.5 h-2.5 rounded-full ${wager.choice === 'high' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </span>
                    <span className="flex-1 text-right font-black text-[#3de796] text-[8.5px]">₹{wager.betAmount.toLocaleString('en-IN')}</span>
                  </div>
                ));
              })()}

              {liveBets.length === 0 && !hasBet && (
                <div className="text-[7.5px] text-white/20 italic p-1 text-center">Waiting for live wagers...</div>
              )}
            </div>
          </div>
        </div>

        {/* NEON EXECUTION BLOCK BUTTONS */}
        {activeTab === 'autoplay' ? (
          <button
            onClick={() => setIsAutoplayActive(prev => !prev)}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider border-0 cursor-pointer transition-all ${
              isAutoplayActive
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600'
                : 'bg-gradient-to-r from-emerald-400 to-[#3de796] hover:from-emerald-500 hover:to-[#3de796]/95 text-black shadow-md'
            }`}
          >
            {isAutoplayActive ? '🛑 Stop Autoplay' : '🚀 Start Autoplay'}
          </button>
        ) : (
          <div className="flex gap-2 w-full">
            {currentCard.val === 13 ? (
              <>
                <button
                  onClick={() => placeBet('low')}
                  disabled={hasBet || gameState !== 'betting' || timeLeft <= 3}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border-0 cursor-pointer transition-all ${
                    hasBet && selectedGuess === 'low'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-[0.98]'
                      : hasBet || timeLeft <= 3
                      ? 'bg-zinc-800/80 text-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white shadow-md hover:scale-[1.01]'
                  }`}
                >
                  ▼ LOWER
                </button>
                <button
                  onClick={() => placeBet('same')}
                  disabled={hasBet || gameState !== 'betting' || timeLeft <= 3}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border-0 cursor-pointer transition-all ${
                    hasBet && selectedGuess === 'same'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 scale-[0.98]'
                      : hasBet || timeLeft <= 3
                      ? 'bg-zinc-800/80 text-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:scale-[1.01]'
                  }`}
                >
                  🟰 SAME (12.61x)
                </button>
              </>
            ) : currentCard.val === 1 ? (
              <>
                <button
                  onClick={() => placeBet('high')}
                  disabled={hasBet || gameState !== 'betting' || timeLeft <= 3}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border-0 cursor-pointer transition-all ${
                    hasBet && selectedGuess === 'high'
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-[0.98]'
                      : hasBet || timeLeft <= 3
                      ? 'bg-zinc-800/80 text-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-400 to-[#3de796] hover:from-emerald-500 hover:to-[#3de796]/95 text-black shadow-md hover:scale-[1.01]'
                  }`}
                >
                  ▲ HIGHER
                </button>
                <button
                  onClick={() => placeBet('same')}
                  disabled={hasBet || gameState !== 'betting' || timeLeft <= 3}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border-0 cursor-pointer transition-all ${
                    hasBet && selectedGuess === 'same'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 scale-[0.98]'
                      : hasBet || timeLeft <= 3
                      ? 'bg-zinc-800/80 text-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:scale-[1.01]'
                  }`}
                >
                  🟰 SAME (12.61x)
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => placeBet('high')}
                  disabled={hasBet || gameState !== 'betting' || timeLeft <= 3}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border-0 cursor-pointer transition-all ${
                    hasBet && selectedGuess === 'high'
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-[0.98]'
                      : hasBet || timeLeft <= 3
                      ? 'bg-zinc-800/80 text-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-400 to-[#3de796] hover:from-emerald-500 hover:to-[#3de796]/95 text-black shadow-md hover:scale-[1.01]'
                  }`}
                >
                  ▲ HIGHER
                </button>
                <button
                  onClick={() => placeBet('low')}
                  disabled={hasBet || gameState !== 'betting' || timeLeft <= 3}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border-0 cursor-pointer transition-all ${
                    hasBet && selectedGuess === 'low'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-[0.98]'
                      : hasBet || timeLeft <= 3
                      ? 'bg-zinc-800/80 text-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white shadow-md hover:scale-[1.01]'
                  }`}
                >
                  ▼ LOWER
                </button>
              </>
            )}
          </div>
        )}

      </div>

      {/* RIGHT SIDE PANEL - LUXURY GREEN FELT TABLE DESIGN */}
      <div 
        className="lg:col-span-8 flex flex-col justify-between h-full relative overflow-hidden select-none animate-fade-in p-5.5 rounded-3xl"
        style={{
          background: 'radial-gradient(circle at center, #0c5e37 0%, #063c22 65%, #021a0f 100%)',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.85), 0 15px 35px rgba(0,0,0,0.6)',
          border: '2.5px solid rgba(212, 175, 55, 0.45)'
        }}
      >
        {/* Luxury gold dashed felt lines */}
        <div className="absolute inset-4 rounded-2xl border border-dashed border-[#d4af37]/15 pointer-events-none" />

        {/* MAIN BOARD ROW */}
        <div className="flex items-center justify-center gap-6 w-full flex-1 py-4 z-10">
          
          {/* HIGHER PANEL */}
          {/* HIGHER PANEL */}
          {currentCard.val === 1 ? (
            <div className="w-[110px] h-[160px] bg-black/45 border border-white/[0.04] rounded-2xl flex flex-col justify-between items-center p-3.5 text-center shrink-0 shadow-lg">
              <span className="text-[#10b981] text-lg font-black select-none">︽</span>
              <div className="text-[8px] font-black text-zinc-300 uppercase tracking-wider">Higher</div>
              <div className="text-xl font-black text-[#10b981] font-mono">{options.high.mult.toFixed(2)}x</div>
              <div className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wide flex items-center gap-0.5">
                <span>★ {options.high.chance}%</span>
              </div>
              <div className="text-[8px] text-zinc-400 font-black uppercase tracking-wider">Ace Lowest</div>
            </div>
          ) : currentCard.val === 13 ? (
            <div className="w-[110px] h-[160px] bg-black/45 border border-white/[0.04] rounded-2xl flex flex-col justify-between items-center p-3.5 text-center shrink-0 shadow-lg">
              <span className="text-purple-400 text-lg font-black select-none">🟰</span>
              <div className="text-[8px] font-black text-zinc-300 uppercase tracking-wider">Same (K)</div>
              <div className="text-xl font-black text-purple-400 font-mono">12.61x</div>
              <div className="bg-purple-500/15 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wide flex items-center gap-0.5">
                <span>★ 7.69%</span>
              </div>
              <div className="text-[8px] text-zinc-400 font-black uppercase tracking-wider">High Payout</div>
            </div>
          ) : (
            <div className="w-[110px] h-[160px] bg-black/45 border border-white/[0.04] rounded-2xl flex flex-col justify-between items-center p-3.5 text-center shrink-0 shadow-lg">
              <span className="text-[#10b981] text-lg font-black select-none">︽</span>
              <div className="text-[8px] font-black text-zinc-300 uppercase tracking-wider">Higher / Same</div>
              <div className="text-xl font-black text-[#10b981] font-mono">{options.high.mult.toFixed(2)}x</div>
              <div className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wide flex items-center gap-0.5">
                <span>★ {options.high.chance}%</span>
              </div>
              <div className="text-[8px] text-zinc-400 font-black uppercase tracking-wider">King Highest</div>
            </div>
          )}

          {/* MAIN CARD SLOT (With integrated creative border timer) */}
          <div className="w-[125px] h-[180px] relative select-none origin-center shrink-0">
            {/* Creative Card Progress Border SVG */}
            <svg className="absolute -inset-[5px] w-[135px] h-[190px] pointer-events-none z-20">
              <motion.rect
                x="2.5"
                y="2.5"
                width="130"
                height="185"
                rx="26"
                fill="transparent"
                stroke={timeLeft <= 3 ? '#ef4444' : '#3de796'}
                strokeWidth="3"
                strokeDasharray="610"
                initial={{ strokeDashoffset: 610 }}
                animate={{ strokeDashoffset: 610 - (timeLeft / 10) * 610 }}
                transition={{ duration: 0.95, ease: 'linear' }}
                style={{
                  filter: timeLeft <= 3 
                    ? 'drop-shadow(0 0 8px rgba(239,68,68,0.7))' 
                    : 'drop-shadow(0 0 8px rgba(61,231,150,0.7))',
                  strokeLinecap: 'round'
                }}
              />
            </svg>

            {/* Floating Timer Badge */}
            <div className="absolute -top-13 left-1/2 -translate-x-1/2 z-25 text-3xl font-black font-mono flex items-center justify-center opacity-65">
              <AnimatePresence mode="wait">
                <motion.span
                  key={timeLeft}
                  initial={{ y: 12, opacity: 0, scale: 0.7, rotateX: -90 }}
                  animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                  exit={{ y: -12, opacity: 0, scale: 0.7, rotateX: 90 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                  className={timeLeft <= 3 ? 'text-red-500 tracking-widest' : 'text-[#3de796] tracking-widest'}
                  style={{ transformOrigin: 'center' }}
                >
                  {String(timeLeft).padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              {gameState === 'drawing' || isFlipping ? (
                <motion.div
                  key="back"
                  initial={{ rotateY: -180, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 180, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <ThrillCardBack />
                </motion.div>
              ) : (
                <motion.div
                  key={`${currentCard.label}-${currentCard.suit}`}
                  initial={{ rotateY: -180, opacity: 0, scale: 0.9 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: 180, opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-white rounded-[24px] flex flex-col justify-between p-4.5 shadow-[0_12px_28px_rgba(0,0,0,0.5)] border border-white/10"
                >
                  <div className="text-left font-black text-2xl leading-none" style={{ color: currentCard.color }}>
                    {currentCard.label}
                  </div>
                  <div className="text-5xl align-self-center text-center filter drop-shadow-sm select-none" style={{ color: currentCard.color }}>
                    {currentCard.suit}
                  </div>
                  <div className="text-right font-black text-2xl leading-none" style={{ color: currentCard.color }}>
                    {currentCard.label}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LOWER PANEL */}
          {/* LOWER PANEL */}
          {currentCard.val === 13 ? (
            <div className="w-[110px] h-[160px] bg-black/45 border border-white/[0.04] rounded-2xl flex flex-col justify-between items-center p-3.5 text-center shrink-0 shadow-lg">
              <span className="text-[#a7e846] text-lg font-black select-none">︾</span>
              <div className="text-[8px] font-black text-zinc-300 uppercase tracking-wider">Lower</div>
              <div className="text-xl font-black text-[#a7e846] font-mono">{options.low.mult.toFixed(2)}x</div>
              <div className="bg-[#a7e846]/15 text-[#a7e846] border border-[#a7e846]/25 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wide flex items-center gap-0.5">
                <span>↙ {options.low.chance}%</span>
              </div>
              <div className="text-[8px] text-zinc-400 font-black uppercase tracking-wider">King Highest</div>
            </div>
          ) : currentCard.val === 1 ? (
            <div className="w-[110px] h-[160px] bg-black/45 border border-white/[0.04] rounded-2xl flex flex-col justify-between items-center p-3.5 text-center shrink-0 shadow-lg">
              <span className="text-purple-400 text-lg font-black select-none">🟰</span>
              <div className="text-[8px] font-black text-zinc-300 uppercase tracking-wider">Same (A)</div>
              <div className="text-xl font-black text-purple-400 font-mono">12.61x</div>
              <div className="bg-purple-500/15 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wide flex items-center gap-0.5">
                <span>★ 7.69%</span>
              </div>
              <div className="text-[8px] text-zinc-400 font-black uppercase tracking-wider">High Payout</div>
            </div>
          ) : (
            <div className="w-[110px] h-[160px] bg-black/45 border border-white/[0.04] rounded-2xl flex flex-col justify-between items-center p-3.5 text-center shrink-0 shadow-lg">
              <span className="text-[#a7e846] text-lg font-black select-none">︾</span>
              <div className="text-[8px] font-black text-zinc-300 uppercase tracking-wider">Lower / Same</div>
              <div className="text-xl font-black text-[#a7e846] font-mono">{options.low.mult.toFixed(2)}x</div>
              <div className="bg-[#a7e846]/15 text-[#a7e846] border border-[#a7e846]/25 px-2 py-0.5 rounded-full text-[8px] font-black tracking-wide flex items-center gap-0.5">
                <span>↙ {options.low.chance}%</span>
              </div>
              <div className="text-[8px] text-zinc-400 font-black uppercase tracking-wider">Ace Lowest</div>
            </div>
          )}

        </div>

        <div className="text-[10px] font-black uppercase text-white tracking-wider mb-2 text-center z-10 shrink-0 drop-shadow-md">
          {gameState === 'betting' ? (
            timeLeft <= 3 ? (
              <span className="text-red-400 font-extrabold tracking-widest animate-pulse">BETS LOCKED! DRAWING SOON</span>
            ) : (
              <span className="text-amber-400">Place bets Higher/Lower...</span>
            )
          ) : gameState === 'drawing' ? (
              <span className="text-emerald-300 animate-pulse">Shuffling cards...</span>
          ) : (
            <span className="text-zinc-100">Round complete! Next bets open shortly</span>
          )}
        </div>

        {/* TIMELINE CARD HISTORY */}
        <div className="w-full space-y-1.5 z-10 shrink-0 border-t border-[#d4af37]/20 pt-3">
          <span className="text-[9px] font-black uppercase tracking-wider text-[#d4af37] block">Card History</span>
          <div className="flex gap-0.5 overflow-x-auto pb-1.5 scrollbar-none items-center min-h-[135px] justify-center">
            {history.map((item, i) => {
              const isStart = i === 0;
              return (
                <React.Fragment key={item.id}>
                  {!isStart && (
                    <div className="w-[16px] h-[28px] bg-[#0c0d15] border border-white/10 rounded-full flex items-center justify-center shrink-0 mx-[-8px] z-20 shadow-lg">
                      {item.guessType === 'high' && <span className="text-[9px] font-black text-[#3de796] select-none">︽</span>}
                      {item.guessType === 'low' && <span className="text-[9px] font-black text-[#3de796] select-none">︾</span>}
                      {item.guessType === 'same' && <span className="text-[9px] font-black text-[#3de796] select-none">=</span>}
                    </div>
                  )}

                  <motion.div 
                    initial={{ y: -220, scale: 1.9, opacity: 0.8 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 100 }}
                    className="flex flex-col items-center shrink-0"
                  >
                    <div 
                      className="w-[65px] h-[95px] bg-white rounded-xl flex flex-col justify-between p-2.5 shadow-md border border-zinc-200 select-none relative z-10"
                    >
                      <div className="text-left font-black text-sm leading-none" style={{ color: item.card.color }}>
                        {item.card.label}
                      </div>
                      <div className="text-2xl align-self-center text-center leading-none filter drop-shadow-sm select-none" style={{ color: item.card.color }}>
                        {item.card.suit}
                      </div>
                      <div className="text-right font-black text-sm leading-none" style={{ color: item.card.color }}>
                        {item.card.label}
                      </div>
                    </div>
                    {isStart ? (
                      <span className="text-[8px] text-zinc-200 font-extrabold uppercase tracking-wider mt-2.5 select-none drop-shadow-md">Start Card</span>
                    ) : (
                      <span className="bg-[#3de796] text-[#0f111a] px-2.5 py-0.5 rounded-full text-[8px] font-black mt-1.5 font-mono shadow-md select-none min-w-[48px] text-center">
                        {item.mult.toFixed(2)}x
                      </span>
                    )}
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
