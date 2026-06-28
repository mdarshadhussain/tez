'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick, playWinChime, playLossSound, playTick } from '../utils/audio';
import { RefreshCw, RotateCcw } from 'lucide-react';

// ─── Card Data ────────────────────────────────────────────────────────────────
const SUITS = ['♥', '♦', '♣', '♠'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function cardValue(rank) {
  if (['J', 'Q', 'K', '10'].includes(rank)) return 0;
  if (rank === 'A') return 1;
  return parseInt(rank);
}
function handScore(cards) {
  return cards.reduce((sum, c) => sum + cardValue(c.rank), 0) % 10;
}
function randomCard(used = []) {
  let card, tries = 0;
  do {
    card = { rank: RANKS[Math.floor(Math.random() * 13)], suit: SUITS[Math.floor(Math.random() * 4)] };
    tries++;
  } while (used.some(c => c.rank === card.rank && c.suit === card.suit) && tries < 200);
  return card;
}
function isRed(suit) { return suit === '♥' || suit === '♦'; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Baccarat Logic ───────────────────────────────────────────────────────────
function dealBaccarat() {
  const used = [];
  const draw = () => { const c = randomCard(used); used.push(c); return c; };
  let p = [draw(), draw()];
  let bk = [draw(), draw()];
  const ps = handScore(p), bs = handScore(bk);
  if (ps >= 8 || bs >= 8) return { p, bk };
  let pt = null;
  if (ps <= 5) { pt = draw(); p = [...p, pt]; }
  const nb = handScore(bk);
  let bankerDraws = false;
  if (!pt) { if (nb <= 5) bankerDraws = true; }
  else {
    const pv = cardValue(pt.rank);
    if (nb <= 2) bankerDraws = true;
    else if (nb === 3 && pv !== 8) bankerDraws = true;
    else if (nb === 4 && [2,3,4,5,6,7].includes(pv)) bankerDraws = true;
    else if (nb === 5 && [4,5,6,7].includes(pv)) bankerDraws = true;
    else if (nb === 6 && [6,7].includes(pv)) bankerDraws = true;
  }
  if (bankerDraws) bk = [...bk, draw()];
  return { p, bk };
}

// ─── Animated Playing Card ────────────────────────────────────────────────────
function PlayingCard({ card, flipped, dealDelay, deckOffX, deckOffY }) {
  const isRedSuit = isRed(card?.suit);
  const suitColor = isRedSuit ? 'text-[#e11d48]' : 'text-[#1e293b]';

  return (
    <motion.div
      initial={{ x: deckOffX, y: deckOffY, rotateZ: -15, scale: 0.7, opacity: 0 }}
      animate={{ x: 0, y: 0, rotateZ: 0, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 20, delay: dealDelay }}
      style={{ perspective: 1000, width: 72, height: 102 }}
      className="relative shrink-0"
    >
      {/* Flip container */}
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%', position: 'relative' }}
      >
        {/* Card Back */}
        <div
          style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
          className="rounded-[8px] overflow-hidden shadow-2xl"
        >
          <div className="w-full h-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center rounded-[8px] border border-blue-500/30">
            {/* Back pattern */}
            <div className="absolute inset-1 rounded-[6px] border border-blue-400/20" />
            <div className="grid grid-cols-4 gap-0.5 opacity-20 p-2">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-sm bg-white/40" />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-2xl font-black">🂠</div>
          </div>
        </div>

        {/* Card Face */}
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 }}
          className="rounded-[8px] bg-gradient-to-b from-white to-slate-50 shadow-xl border border-slate-200/90 flex flex-col items-center justify-center overflow-hidden p-2 select-none"
        >
          {/* Rank (Large in center-top) */}
          <div className={`font-black text-3xl tracking-tight leading-none ${suitColor} -mb-0.5`}>
            {card?.rank}
          </div>
          {/* Suit (Large, centered below rank) */}
          <div className={`text-2xl leading-none ${suitColor}`}>
            {card?.suit}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Card Slot Placeholder ────────────────────────────────────────────────────
function CardSlot() {
  return (
    <div
      className="rounded-[8px] border-2 border-dashed border-white/10"
      style={{ width: 72, height: 102 }}
    />
  );
}

// ─── Deck Component ───────────────────────────────────────────────────────────
function Deck({ dealing, shuffling }) {
  return (
    <motion.div
      animate={dealing ? { scale: [1, 0.95, 1] } : { scale: 1 }}
      transition={{ repeat: dealing ? Infinity : 0, duration: 0.6 }}
      className="relative cursor-default select-none"
      style={{ width: 48, height: 68 }}
    >
      {[4, 3, 2, 1, 0].map(i => {
        const isTop = i === 0;
        return (
          <motion.div
            key={i}
            animate={shuffling ? {
              x: [0, i % 2 === 0 ? -18 : 18, 0],
              rotate: [0, i % 2 === 0 ? -8 : 8, 0],
              y: [i * 2, i * 2 - 3, i * 2]
            } : { x: 0, rotate: 0, y: i * 2 }}
            transition={{ duration: 0.6, ease: "easeInOut", delay: i * 0.04 }}
            className={`absolute rounded-[6px] transition-shadow duration-300 ${
              isTop
                ? 'bg-gradient-to-b from-blue-500 to-blue-600 border border-blue-400'
                : 'bg-white border border-slate-200/80 shadow-sm'
            }`}
            style={{
              inset: 0,
              zIndex: 10 - i,
            }}
          >
            {isTop && (
              <div className="w-full h-full relative flex items-center justify-center">
                <div className="absolute inset-1 rounded-[4px] border border-blue-400/20" />
                <span className="text-white/30 text-lg font-black">🂠</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score, winner, side }) {
  const isWin = winner === side;
  const isTie = winner === 'tie';
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 16 }}
      className={`px-3 py-1 rounded-full font-black text-sm shadow-lg border ${
        isTie ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
        isWin
          ? side === 'player'
            ? 'bg-red-500 text-white border-red-400 shadow-red-500/40'
            : 'bg-[#3de796] text-black border-[#3de796]/50 shadow-[#3de796]/40'
          : 'bg-white/10 text-white/60 border-white/10'
      }`}
    >
      {score}
      {isWin && <span className="ml-1">👑</span>}
    </motion.div>
  );
}

// ─── Bet Zone ─────────────────────────────────────────────────────────────────
const ZONE_COLORS = {
  player: { bar: 'bg-blue-500', glow: 'shadow-blue-500/20', border: 'border-blue-500/50', badge: 'bg-blue-600' },
  tie:    { bar: 'bg-[#3de796]', glow: 'shadow-[#3de796]/20', border: 'border-[#3de796]/50', badge: 'bg-[#3de796]' },
  banker: { bar: 'bg-red-500', glow: 'shadow-red-500/20', border: 'border-red-500/50', badge: 'bg-red-600' },
};

function BetZone({ id, label, odds, amount, active, onClick, disabled }) {
  const c = ZONE_COLORS[id];
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      data-bet-zone={id}
      whileHover={!disabled ? { scale: 1.03, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`flex-1 flex flex-col items-center rounded-2xl border pt-0 pb-4 overflow-hidden cursor-pointer bg-[#141622] transition-all select-none ${
        active ? `${c.border} shadow-xl ${c.glow}` : 'border-white/[0.06]'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <div className={`w-full h-1.5 ${c.bar} mb-4`} />
      <span className="font-black text-white text-xs tracking-wider">{label}</span>
      <span className="text-text-muted text-[9px] font-bold mt-0.5">{odds}</span>

      <div className="mt-4 mb-3 h-10 flex items-center justify-center">
        {amount > 0 ? (
          <div className="relative w-9 h-9 flex items-center justify-center">
            {/* Chip stack */}
            {[...Array(Math.min(5, Math.ceil(amount / 100) + 1))].map((_, i, arr) => {
              const isTop = i === arr.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`absolute w-9 h-9 rounded-full ${c.badge} border-2 border-dashed border-white/20 shadow-md flex items-center justify-center`}
                  style={{ bottom: i * 3.5, left: 0, zIndex: i }}
                >
                  {isTop && (
                    <span className="font-black text-[8px] text-white select-none">
                      {amount >= 1000 ? `${(amount / 1000).toFixed(1).replace('.0', '')}K` : amount}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-7 h-7 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center"
          >
            <span className="text-white/30 text-base leading-none">+</span>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-1 text-[11px] font-black text-white/70">
        <span className="text-[#3de796] text-[10px]">₹</span>
        {(amount || 0).toFixed(2)}
      </div>
    </motion.button>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
const CHIP_STYLES = [
  { value: 10,    label: '10',   bg: 'bg-orange-500', ring: 'ring-orange-400' },
  { value: 100,   label: '100',  bg: 'bg-rose-600',   ring: 'ring-rose-400' },
  { value: 1000,  label: '1K',   bg: 'bg-violet-600', ring: 'ring-violet-400' },
  { value: 5000,  label: '5K',   bg: 'bg-blue-600',   ring: 'ring-blue-400' },
];

// ─── Win Overlay ──────────────────────────────────────────────────────────────
function WinOverlay({ winner, winAmount, totalBet, onDismiss }) {
  if (!winner) return null;
  const profit = winAmount - totalBet;
  const isWin = profit > 0;
  const isTie = winner === 'tie';

  return (
    <AnimatePresence>
      <motion.div
        key="win-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl"
        onClick={onDismiss}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] rounded-2xl" />

        {/* Particles on win */}
        {isWin && [...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ background: ['#3de796', '#fbbf24', '#f87171', '#60a5fa'][i % 4] }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos((i / 12) * Math.PI * 2) * (80 + Math.random() * 60),
              y: Math.sin((i / 12) * Math.PI * 2) * (80 + Math.random() * 60),
              scale: 0, opacity: 0,
            }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        ))}

        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          className="relative z-10 text-center px-8 py-6 rounded-3xl border border-white/10 bg-[#1a1d29]/90 shadow-2xl min-w-[220px]"
        >
          {isTie && !isWin ? (
            <>
              <div className="text-3xl mb-2">🤝</div>
              <div className="text-yellow-300 font-black text-xl tracking-wide">IT'S A TIE!</div>
              <div className="text-white/50 text-xs font-bold mt-1">Stakes returned</div>
            </>
          ) : isWin ? (
            <>
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-[#3de796] font-black text-xl tracking-wide drop-shadow-[0_0_20px_rgba(61,231,150,0.7)]">
                {winner.toUpperCase()} WINS!
              </div>
              <div className="text-white font-black text-3xl mt-1">+₹{profit.toFixed(2)}</div>
              <div className="text-white/40 text-[10px] font-bold mt-1">Total payout ₹{winAmount.toFixed(2)}</div>
            </>
          ) : (
            <>
              <div className="text-3xl mb-2">💸</div>
              <div className="text-red-400 font-black text-xl">YOU LOST</div>
              <div className="text-white/50 text-sm font-bold mt-1">-₹{Math.abs(profit).toFixed(2)}</div>
            </>
          )}
          <motion.p
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-white/30 text-[9px] font-bold tracking-widest uppercase mt-4"
          >
            Tap to continue
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Baccarat({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [tab, setTab] = useState('manual');
  const [selectedChip, setSelectedChip] = useState(10);
  const [chipPresets, setChipPresets] = useState([
    { value: 10,    bg: 'bg-orange-500', ring: 'ring-orange-400' },
    { value: 100,   bg: 'bg-rose-600',   ring: 'ring-rose-400' },
    { value: 1000,  bg: 'bg-violet-600', ring: 'ring-violet-400' },
    { value: 5000,  bg: 'bg-blue-600',   ring: 'ring-blue-400' },
  ]);
  const [playerBet, setPlayerBet] = useState(0);
  const [tieBet, setTieBet]     = useState(0);
  const [bankerBet, setBankerBet] = useState(0);
  const [betHistory, setBetHistory] = useState([]);
  
  const [liveWagers, setLiveWagers] = useState([]);
  const [livePool, setLivePool] = useState({ player: 145000, banker: 160000, tie: 25000 });

  const [timer, setTimer] = useState(15);
  const timerRef = useRef(null);
  const betsRef = useRef({ playerBet: 0, tieBet: 0, bankerBet: 0 });
  const runRoundRef = useRef(null);

  // Card animation state — each entry: { rank, suit, flipped, side }
  const [dealtCards, setDealtCards] = useState({ player: [], banker: [] });
  const [gamePhase, setGamePhase] = useState('betting'); // betting | dealing | result
  const [winner, setWinner] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [shuffling, setShuffling] = useState(false);

  const handleReshuffle = useCallback(async () => {
    if (gamePhase === 'dealing' || shuffling) return;
    setShuffling(true);
    playClick();
    for (let i = 0; i < 8; i++) {
      playTick();
      await sleep(80);
    }
    await sleep(200);
    setShuffling(false);
  }, [gamePhase, shuffling]);

  const [placedBets, setPlacedBets] = useState(false);
  const placedBetsRef = useRef(placedBets);
  React.useEffect(() => { placedBetsRef.current = placedBets; }, [placedBets]);

  // Autoplay
  const [isAutoplayRunning, setIsAutoplayRunning] = useState(false);
  const [numberOfBets, setNumberOfBets] = useState('10');
  const [autoBetsRemaining, setAutoBetsRemaining] = useState(0);
  const [totalWagered, setTotalWagered] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const isAutoRef = useRef(false);
  const balanceRef = useRef(playableBalance);
  const totalBetRef = useRef(0);
  const isRunningRef = useRef(false);

  React.useEffect(() => { balanceRef.current = playableBalance; }, [playableBalance]);
  React.useEffect(() => { isAutoRef.current = isAutoplayRunning; }, [isAutoplayRunning]);

  const totalBet = playerBet + tieBet + bankerBet;
  React.useEffect(() => { totalBetRef.current = totalBet; }, [totalBet]);
  React.useEffect(() => { betsRef.current = { playerBet, tieBet, bankerBet }; }, [playerBet, tieBet, bankerBet]);

  // ── Timer Logic ─────────────────────────────────────────────────────────────
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(15);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimeout(() => {
            if (isAutoRef.current) return;
            const currentBets = betsRef.current;
            const betSum = currentBets.playerBet + currentBets.tieBet + currentBets.bankerBet;
            if (betSum > 0 && runRoundRef.current) {
              runRoundRef.current(currentBets.playerBet, currentBets.tieBet, currentBets.bankerBet);
            } else {
              startTimer();
            }
          }, 50);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  React.useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const isDealing = gamePhase === 'dealing';

  // ── Live Wager Simulation ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (isDealing) return;
    let t;
    const go = () => {
      const d=['6','7','8','9'], ph=`${d[~~(Math.random()*4)]}${~~(Math.random()*10)}XXX${~~(100+Math.random()*900)}`;
      const sel=Math.random()<0.1?'tie':Math.random()<0.5?'player':'banker';
      const amt=[10,50,100,200,500,1000,2000,5000,10000][~~(Math.random()*9)];
      setLiveWagers(p=>[{phone:ph,sel,amt,id:Math.random()},...p.slice(0,2)]);
      setLivePool(p=>({...p,[sel]:p[sel]+amt}));
      t = setTimeout(go, 120+Math.random()*200);
    };
    t = setTimeout(go, 400);
    return () => clearTimeout(t);
  }, [isDealing]);

  // ── Bet Management ──────────────────────────────────────────────────────────
  const addBet = (zone, customValue = null) => {
    if (isDealing || isAutoplayRunning || timer <= 3) return;
    const val = customValue !== null ? customValue : selectedChip;
    if (val <= 0) return;
    playClick();
    setBetHistory(h => [...h, { playerBet, tieBet, bankerBet }]);
    if (zone === 'player') setPlayerBet(p => p + val);
    if (zone === 'tie')    setTieBet(t => t + val);
    if (zone === 'banker') setBankerBet(b => b + val);
  };

  const handleDragEnd = (event, info, chipValue) => {
    const coinEl = event.target?.closest('.rounded-full');
    if (!coinEl) return;

    // Temporarily hide the coin element from hit testing so document.elementFromPoint can see through it
    const originalPointerEvents = coinEl.style.pointerEvents;
    coinEl.style.pointerEvents = 'none';

    // Find what is underneath the coin
    const element = document.elementFromPoint(info.point.x, info.point.y);

    // Restore pointer events
    coinEl.style.pointerEvents = originalPointerEvents;

    const zoneElement = element?.closest('[data-bet-zone]');
    if (zoneElement) {
      const zoneId = zoneElement.getAttribute('data-bet-zone');
      addBet(zoneId, chipValue);
    }
  };

  const clearBets = () => {
    if (isDealing || timer <= 3) return;
    playClick(); setPlayerBet(0); setTieBet(0); setBankerBet(0); setBetHistory([]);
  };
  const undoBet = () => {
    if (isDealing || timer <= 3 || betHistory.length === 0) return;
    playClick();
    const last = betHistory[betHistory.length - 0]; // Wait, wait: betHistory.length - 1
    const safeLast = betHistory[betHistory.length - 1];
    setPlayerBet(safeLast.playerBet); setTieBet(safeLast.tieBet); setBankerBet(safeLast.bankerBet);
    setBetHistory(h => h.slice(0, -1));
  };
  const doubleBets = () => {
    if (isDealing || timer <= 3) return; playClick();
    setBetHistory(h => [...h, { playerBet, tieBet, bankerBet }]);
    setPlayerBet(p => p * 2); setTieBet(t => t * 2); setBankerBet(b => b * 2);
  };
  const halfBets = () => {
    if (isDealing || timer <= 3) return; playClick();
    setBetHistory(h => [...h, { playerBet, tieBet, bankerBet }]);
    setPlayerBet(p => Math.floor(p / 2)); setTieBet(t => Math.floor(t / 2)); setBankerBet(b => Math.floor(b / 2));
  };

  // ── Core Round Logic ────────────────────────────────────────────────────────
  const runRound = useCallback(async (pBet, tBet, bBet, isAutoSpin = false) => {
    if (isRunningRef.current) return null;
    isRunningRef.current = true;

    // If auto-spin and bets weren't locked via 'PLACE BET', spin empty.
    if (isAutoSpin && !placedBetsRef.current) {
      pBet = 0; tBet = 0; bBet = 0;
    }

    let bet = pBet + tBet + bBet;
    
    if (bet > balanceRef.current) {
      if (!isAutoSpin) { alert('Insufficient balance'); }
      isRunningRef.current = false;
      return null;
    }
    
    if (bet <= 0 && !isAutoSpin) { 
      alert('Place some chips first'); 
      isRunningRef.current = false;
      return null; 
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setPlacedBets(true);

    if (bet > 0) {
      setPlayableBalance(prev => prev - bet);
      setTotalWagered(prev => prev + bet);
    }
    setGamePhase('dealing');
    setWinner(null);
    setShowOverlay(false);

    const { p: playerCards, bk: bankerCards } = dealBaccarat();

    // Deal order: P1, B1, P2, B2, [P3], [B3]
    const dealOrder = [
      { side: 'player', card: playerCards[0] },
      { side: 'banker', card: bankerCards[0] },
      { side: 'player', card: playerCards[1] },
      { side: 'banker', card: bankerCards[1] },
    ];
    if (playerCards[2]) dealOrder.push({ side: 'player', card: playerCards[2] });
    if (bankerCards[2]) dealOrder.push({ side: 'banker', card: bankerCards[2] });

    // Reset dealt cards
    setDealtCards({ player: [], banker: [] });
    await sleep(100);

    // Deal and flip card by card (one by one)
    for (let i = 0; i < dealOrder.length; i++) {
      const { side, card } = dealOrder[i];

      // Deal card face-down (slide from deck)
      setDealtCards(prev => ({
        ...prev,
        [side]: [...prev[side], { ...card, flipped: false }],
      }));
      playTick();
      await sleep(350); // Wait for deal/slide animation

      // Turn/flip this card face-up
      setDealtCards(prev => {
        const updated = [...prev[side]];
        const idx = updated.length - 1;
        if (updated[idx]) updated[idx] = { ...updated[idx], flipped: true };
        return { ...prev, [side]: updated };
      });
      playTick();
      await sleep(500); // Wait for flip animation
    }

    await sleep(200);

    // Determine result
    const ps = handScore(playerCards);
    const bs = handScore(bankerCards);
    const w = ps > bs ? 'player' : bs > ps ? 'banker' : 'tie';
    setWinner(w);

    // Payout
    let payout = 0;
    if (w === 'player' && pBet > 0) payout += pBet * 2;
    if (w === 'banker' && bBet > 0) payout += bBet * 1.95;
    if (w === 'tie' && tBet > 0) payout += tBet * 9;
    if (w === 'tie') { payout += pBet + bBet; } // return stakes

    payout = parseFloat(payout.toFixed(2));
    setWinAmount(payout);
    const profit = payout - bet;
    
    if (bet > 0) {
      setTotalProfit(prev => prev + profit);
    }

    await sleep(200);
    if ((bet > 0 && profit > 0) || (bet > 0 && w === 'tie')) {
      setShowOverlay(true);
      setTimeout(() => {
        setShowOverlay(false);
      }, 2000);
    }

    if (bet > 0) {
      if (payout > 0) {
        playWinChime();
        if (isDemo) setPlayableBalance(prev => prev + payout);
        else {
          try {
            const res = await fetch('http://localhost:3001/api/games/record-bet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ game: 'baccarat', bet_amount: bet, payout_multiplier: payout / bet, payout_amount: payout, is_won: true, raw_selection: { w, ps, bs } })
            });
            const data = await res.json();
            if (data.success) setPlayableBalance(data.balance);
          } catch (e) { console.error(e); }
        }
      } else {
        playLossSound();
        if (!isDemo) {
          try {
            const res = await fetch('http://localhost:3001/api/games/record-bet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ game: 'baccarat', bet_amount: bet, payout_multiplier: 0, payout_amount: 0, is_won: false, raw_selection: { w, ps, bs } })
            });
            const data = await res.json();
            if (data.success) setPlayableBalance(data.balance);
          } catch (e) { console.error(e); }
        }
      }
    } else {
      // 0 bet visual feedback
      if (w !== 'tie') playLossSound();
    }

    setGamePhase('result');
    
    // Auto-advance to next round like Hotline
    setTimeout(() => {
      if (!isAutoRef.current) {
        setGamePhase('betting');
        setWinner(null);
        setShowOverlay(false);
        setDealtCards({ player: [], banker: [] });
        setPlacedBets(false);
        setPlayerBet(0); setBankerBet(0); setTieBet(0);
        startTimer();
      }
    }, 4000);

    isRunningRef.current = false;
    return { winner: w, payout, profit };
  }, [isDemo, setPlayableBalance, token]);
  
  React.useEffect(() => { runRoundRef.current = runRound; }, [runRound]);

  const handlePlay = async () => {
    if (isDealing || timer <= 3) return;
    if (totalBet <= 0) return alert('Place a bet first');
    if (totalBet > balanceRef.current) return alert('Insufficient balance');
    await runRound(playerBet, tieBet, bankerBet);
  };

  const handleNewRound = () => {
    playClick();
    setGamePhase('betting');
    setWinner(null);
    setShowOverlay(false);
    setDealtCards({ player: [], banker: [] });
  };

  const handleAutoplay = async () => {
    if (isAutoRef.current) { setIsAutoplayRunning(false); isAutoRef.current = false; return; }
    if (totalBet <= 0) return alert('Place a bet first');
    setIsAutoplayRunning(true);
    isAutoRef.current = true;
    setTotalWagered(0);
    setTotalProfit(0);
    let remaining = parseInt(numberOfBets) || 10;
    setAutoBetsRemaining(remaining);

    while (remaining > 0 && isAutoRef.current) {
      if (balanceRef.current < totalBetRef.current) { alert('Insufficient balance'); break; }
      await runRound(playerBet, tieBet, bankerBet);
      remaining--;
      setAutoBetsRemaining(remaining);
      if (remaining > 0 && isAutoRef.current) {
        await sleep(1200);
        setGamePhase('betting');
        setDealtCards({ player: [], banker: [] });
        setShowOverlay(false);
        await sleep(300);
      }
    }
    setIsAutoplayRunning(false);
  };

  const playerScore = handScore(dealtCards.player);
  const bankerScore = handScore(dealtCards.banker);
  const showScores = dealtCards.player.some(c => c.flipped) || dealtCards.banker.some(c => c.flipped);

  const getOffset = (side, idx) => {
    // Deck is top-centered. Relative to slot:
    const deckX = side === 'player' ? 180 : -180;
    const deckY = -150;
    return { x: deckX, y: deckY };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch h-full">

      {/* ── LEFT: Console ── */}
      <div className="lg:col-span-4 bg-[#141622] border border-white/[0.03] p-4 rounded-2xl flex flex-col gap-2.5 overflow-hidden order-2 lg:order-1 relative z-30 max-h-full">

        {/* Tabs */}
        <div className="bg-[#1a1b26] p-1.5 rounded-full flex gap-1">
          {['manual', 'autoplay'].map(t => (
            <button key={t} onClick={() => { playClick(); setTab(t); }} disabled={isDealing}
              className={`flex-1 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border-0 cursor-pointer 
                ${tab === t ? 'bg-[#3de796] text-[#0d1f17] shadow-lg shadow-[#3de796]/20' : 'bg-transparent text-white/50 hover:text-white/80'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'manual' ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Chip Value */}
            <div className="space-y-2 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">CHIP VALUE</span>
                <span className="text-[10px] font-black text-white/60">₹{selectedChip}</span>
              </div>
              <div className="bg-[#1a1b26] border border-white/5 rounded-2xl p-2 pl-4 flex items-center gap-3">
                <div className="text-[#3de796] font-black text-sm">₹</div>
                <input
                  type="number" value={selectedChip} disabled={isDealing}
                  onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setSelectedChip(v); }}
                  className="bg-transparent border-0 py-1.5 px-0 text-white font-black text-sm outline-none w-full"
                />
                <div className="flex gap-1.5 pr-1">
                  <button onClick={() => setSelectedChip(v => Math.max(1, v / 2))} disabled={isDealing || timer <= 3} className="bg-white/5 hover:bg-white/10 text-white/70 w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-black border-0 cursor-pointer disabled:opacity-40 transition-colors">½</button>
                  <button onClick={() => setSelectedChip(v => v * 2)} disabled={isDealing || timer <= 3} className="bg-white/5 hover:bg-white/10 text-white/70 w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-black border-0 cursor-pointer disabled:opacity-40 transition-colors">×2</button>
                </div>
              </div>
            </div>

            {/* Chip presets */}
            <div className="space-y-2 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">Chips (INR)</span>
                <button onClick={clearBets} disabled={isDealing || timer <= 3} className="text-[10px] font-bold text-white/40 hover:text-white cursor-pointer bg-transparent border-0 transition-colors disabled:opacity-40">Clear All</button>
              </div>
              <div className="flex gap-3">
                {chipPresets.map((chip, idx) => {
                  const label = chip.value >= 1000 ? `${(chip.value / 1000).toFixed(1).replace('.0', '')}K` : chip.value;
                  return (
                    <motion.div
                      key={idx}
                      drag={!isDealing}
                      dragSnapToOrigin
                      dragElastic={0.4}
                      onDragEnd={(event, info) => handleDragEnd(event, info, chip.value)}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { if (!isDealing && timer > 3) { playClick(); setSelectedChip(chip.value); } }}
                      onDoubleClick={() => {
                        if (isDealing || timer <= 3) return;
                        const v = prompt(`Enter new value for chip preset #${idx + 1} (₹):`, chip.value);
                        const num = parseFloat(v);
                        if (!isNaN(num) && num > 0) {
                          setChipPresets(prev => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], value: num };
                            return copy;
                          });
                          setSelectedChip(num);
                        }
                      }}
                      title="Double-click to edit coin value"
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-[11px] text-white cursor-pointer border-0 relative select-none z-[9999] transition-opacity duration-300 ${chip.bg} ${selectedChip === chip.value ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                    >
                      {/* Dashed inner circle */}
                      <div className="absolute inset-1.5 rounded-full border-[1.5px] border-dashed border-black/30 pointer-events-none" />
                      {/* Selection ring */}
                      {selectedChip === chip.value && (
                        <div className="absolute -inset-1 rounded-full border-2 border-white/20 pointer-events-none" />
                      )}
                      {label}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1" />

            {/* Action row */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: 'CLEAR', el: '✕', fn: clearBets },
                { label: 'UNDO', el: <RotateCcw size={14}/>, fn: undoBet },
                { label: '×2', el: '×2', fn: doubleBets },
                { label: '½', el: '½', fn: halfBets },
              ].map(({ label, el, fn }) => (
                <button key={label} onClick={fn} disabled={isDealing || placedBets}
                  className="flex flex-col items-center justify-center gap-1 h-12 rounded-xl bg-[#1a1b26] hover:bg-[#232433] text-white/50 hover:text-white transition-all cursor-pointer border-none disabled:opacity-40">
                  <span className="text-sm font-medium">{el}</span>
                  <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
                </button>
              ))}
            </div>

            {/* Live Multiplayer Bets */}
            <div className="flex-1 flex flex-col mt-3 border-t border-white/5 pt-3 min-h-[140px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-[#5e8ea6] uppercase tracking-[1px]">LIVE MULTIPLAYER BETS</span>
                <span className="text-[10px] font-black text-[#3de796] flex items-center gap-1.5 uppercase tracking-[1px]">
                  <div className="w-2 h-2 rounded-full bg-[#3de796]" /> LIVE POOL
                </span>
              </div>
              
              {/* Fake laser progress bar based on timer */}
              <div className="h-1.5 bg-[#1a1b26] rounded-full mb-3 overflow-hidden relative">
                <div className="absolute top-0 left-0 bottom-0 bg-[#ef4444] shadow-[0_0_8px_#ef4444] transition-all duration-1000 ease-linear rounded-full" 
                     style={{ width: `${(Math.max(0, timer) / 15) * 100}%` }} />
              </div>

              {/* 3 Pools */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { name: 'PLAYER POOL', color: 'border-red-900/30 text-red-500', val: 727083, pct: 33 },
                  { name: 'TIE POOL', color: 'border-emerald-900/30 text-emerald-500', val: 8289, pct: 0 },
                  { name: 'BANKER POOL', color: 'border-zinc-800 text-white', val: 1446873, pct: 67 }
                ].map(p => (
                  <div key={p.name} className={`flex flex-col items-center justify-center py-2 bg-[#1a1b26]/50 border ${p.color} rounded-lg`}>
                    <span className={`text-[7px] font-black uppercase tracking-widest ${p.color.split(' ')[1]}`}>{p.name}</span>
                    <span className="text-[11px] font-black text-white mt-1">₹{p.val.toLocaleString('en-IN')}</span>
                    <span className="text-[7px] font-bold text-white/40 mt-0.5">({p.pct}%)</span>
                  </div>
                ))}
              </div>

              <span className="text-[9px] font-black text-[#5e8ea6] uppercase tracking-[1px] mb-1">RECENT LIVE WAGERS</span>
              
              <div className="space-y-0.5 overflow-y-auto flex-1 relative pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {liveWagers.length>0?liveWagers.map(w=>(
                  <div key={w.id} className="flex items-center text-[10px] bg-transparent py-1.5 border-b border-white/[0.02]" style={{animation:'wagerIn 0.2s ease-out'}}>
                    <span className="w-20 text-white/70 font-black tracking-wider">{w.phone}</span>
                    <span className="w-12 text-[#5e8ea6] text-[8px] font-black text-center">BET ON</span>
                    <span className="w-12 flex items-center justify-center">
                      <div className={`w-3.5 h-3.5 rounded-full shadow-lg ${w.sel==='player'?'bg-[#3b82f6] shadow-[#3b82f6]/50':w.sel==='banker'?'bg-[#ef4444] shadow-[#ef4444]/50':'bg-[#10b981] shadow-[#10b981]/50'}`} />
                    </span>
                    <span className="flex-1 text-right font-black text-[#3de796] text-[11px]">₹{w.amt.toLocaleString('en-IN')}</span>
                  </div>
                )):<div className="text-[10px] text-white/20 italic py-2">Waiting for wagers...</div>}
              </div>
            </div>

            {/* Place Bet Button */}
            <motion.button
              onClick={() => setPlacedBets(true)}
              disabled={isDealing || placedBets || totalBet === 0 || timer <= 3 || gamePhase === 'result'}
              whileHover={!isDealing && !placedBets && totalBet > 0 && timer > 3 && gamePhase !== 'result' ? { scale: 1.02 } : {}}
              whileTap={!isDealing && !placedBets && totalBet > 0 && timer > 3 && gamePhase !== 'result' ? { scale: 0.97 } : {}}
              className={`w-full py-4 rounded-2xl font-black text-[13px] tracking-[2px] border-0 cursor-pointer transition-all mt-4
                ${isDealing || placedBets || totalBet === 0 || timer <= 3 || gamePhase === 'result'
                  ? 'bg-[#1a1b26] text-white/20 cursor-not-allowed shadow-none'
                  : 'bg-[#3de796] hover:bg-[#3de796]/90 text-[#0d1f17] shadow-lg shadow-[#3de796]/20'}`}
            >
              {isDealing ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>🃏</motion.span>
                  DEALING...
                </span>
              ) : placedBets ? 'BETS LOCKED' : timer <= 3 ? `CLOSING IN ${timer}s...` : 'PLACE BET'}
            </motion.button>
          </div>
        ) : (
          /* Autoplay tab */
          <div className="flex flex-col flex-1 gap-4 mt-2">
            <div className="space-y-3">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">Number of Bets</span>
              <div className="bg-[#1a1b26] border border-white/5 rounded-2xl p-2 pl-4 flex items-center gap-3">
                <input type="number" disabled={isAutoplayRunning} value={numberOfBets} onChange={e => setNumberOfBets(e.target.value)}
                  className="bg-transparent border-0 py-1.5 px-0 text-white font-black text-sm outline-none w-full" />
                <div className="flex gap-1.5 pr-1">
                  {['10','20','50'].map(n => (
                    <button key={n} onClick={() => { playClick(); setNumberOfBets(n); }} disabled={isAutoplayRunning}
                      className="bg-white/5 hover:bg-white/10 text-white/70 w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-black border-0 cursor-pointer disabled:opacity-40 transition-colors">{n}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-[#1a1b26] p-4 rounded-2xl border border-white/5 mt-2">
              {[['Wagered', `₹${totalWagered.toFixed(2)}`, 'text-white'], ['Profit', `${totalProfit >= 0 ? '+' : ''}₹${totalProfit.toFixed(2)}`, totalProfit >= 0 ? 'text-[#3de796]' : 'text-[#ef4444]'], ['Left', isAutoplayRunning ? autoBetsRemaining : numberOfBets, 'text-white/70']].map(([lbl, val, cls]) => (
                <div key={lbl} className="text-center space-y-1.5">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-[2px] block">{lbl}</span>
                  <span className={`font-black text-[13px] ${cls}`}>{val}</span>
                </div>
              ))}
            </div>

            <div className="flex-1" />

            <button onClick={handleAutoplay} disabled={!isAutoplayRunning && totalBet === 0}
              className={`w-full py-4 rounded-2xl font-black text-[13px] tracking-[2px] border-0 cursor-pointer transition-all disabled:opacity-50 mt-4 
                ${isAutoplayRunning ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-lg shadow-[#ef4444]/20' : 'bg-[#3de796] hover:bg-[#3de796]/90 text-[#0d1f17] shadow-lg shadow-[#3de796]/20'}`}>
              {isAutoplayRunning ? `STOP (${autoBetsRemaining} left)` : 'START AUTOPLAY'}
            </button>
          </div>

        )}
      </div>

      {/* ── RIGHT: Game Board ── */}
      <div className="lg:col-span-8 flex flex-col gap-4 order-1 lg:order-2 relative">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="bg-[#141622] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2 text-[10px] font-black text-text-muted">
            TOTAL BET
            <span className="text-[#3de796]">₹{totalBet.toFixed(2)}</span>
          </div>
          
          {/* Status banner (Moved timer to center) */}
          <div className="flex items-center gap-3">
            <div className="text-[9px] font-black tracking-widest uppercase drop-shadow-md text-right leading-tight"
              style={{ color: isDealing || gamePhase === 'result' ? '#f97316' : timer<=3 ? '#ef4444' : '#a826ff' }}>
              <div className="text-[7px] text-white/40 mb-0.5">STATUS</div>
              {isDealing ? 'DEALING CARDS' : gamePhase === 'result' ? 'ROUND OVER' : timer<=3 ? 'BETS CLOSED' : 'ACCEPTING BETS'}
            </div>
          </div>
        </div>

        {/* ── Card Table ── */}
        <div className="flex-1 relative rounded-2xl overflow-visible" style={{ minHeight: 200 }}>

          {/* Felt background container with rounded corners and hidden overflow to crop inner grids/gradients */}
          <div className="absolute inset-0 bg-[#0d1f17] rounded-2xl overflow-hidden border border-[#3de796]/[0.06]">
            <div className="absolute inset-0 opacity-[0.07]" style={{
              backgroundImage: 'radial-gradient(circle, #3de796 1px, transparent 1px)',
              backgroundSize: '18px 18px'
            }} />
            {/* Center glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(61,231,150,0.04) 0%, transparent 70%)'
            }} />
          </div>

          {/* Top-Centered Deck with Reshuffle Button */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute -inset-1 bg-black/40 rounded-[6px] blur-sm pointer-events-none" />
              <Deck dealing={isDealing} shuffling={shuffling} />
            </div>
            <button
              onClick={handleReshuffle}
              disabled={isDealing || shuffling}
              title="Reshuffle Deck"
              className="w-8 h-8 rounded-full bg-[#141622]/90 border border-white/10 hover:border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={13} className={shuffling ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Win Overlay */}
          {showOverlay && (
            <WinOverlay winner={winner} winAmount={winAmount} totalBet={totalBet} onDismiss={() => { setShowOverlay(false); }} />
          )}

          <div className="relative z-10 h-full flex items-center justify-around p-5 gap-4">

            {/* Player Hand */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[3px]">Player</span>
                {showScores && dealtCards.player.every(c => c.flipped) && (
                  <ScoreBadge score={playerScore} winner={winner} side="player" />
                )}
              </div>

              {/* Card slots */}
              <div className={`flex gap-2 p-3 rounded-2xl border-2 transition-all duration-500 ${
                winner === 'player' ? 'border-red-400/60 shadow-xl shadow-red-500/20' :
                winner === 'tie' ? 'border-yellow-400/30' :
                winner ? 'border-white/10' : 'border-white/[0.06]'
              } bg-black/20 backdrop-blur-sm`}>
                {/* Show dealt cards + empty slots */}
                {[0, 1, 2].map(idx => {
                  const card = dealtCards.player[idx];
                  if (!card) {
                    // Only show 2 empty slots before game starts
                    if (idx < 2 && gamePhase === 'betting') return <CardSlot key={idx} />;
                    return null;
                  }
                  const offset = getOffset('player', idx);
                  return (
                    <PlayingCard
                      key={`p-${idx}`}
                      card={card}
                      flipped={card.flipped}
                      dealDelay={0}
                      deckOffX={offset.x}
                      deckOffY={offset.y}
                    />
                  );
                })}
              </div>
            </div>

            {/* Center divider + Beautiful Creative Timer */}
            <div className="flex flex-col items-center gap-0 shrink-0 py-4 relative w-[80px] z-20">
              <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
              
              {/* Creative Timer Component in Center */}
              <div className="relative flex items-center justify-center my-2 transform hover:scale-110 transition-transform duration-500">
                {/* Outer Glow Ring */}
                <div className={`absolute inset-0 rounded-full blur-md opacity-30 transition-all duration-700
                  ${isDealing || gamePhase === 'result' ? 'bg-orange-500' : timer <= 3 ? 'bg-red-500 animate-pulse' : 'bg-[#a826ff]'}`} />
                
                {/* SVG Timer */}
                <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90 relative z-10 drop-shadow-xl" style={{display:'block'}}>
                  <circle cx="32" cy="32" r="28" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="transparent"
                    stroke={isDealing || gamePhase === 'result' ? '#f97316' : timer<=3 ? '#ef4444' : '#a826ff'}
                    strokeWidth="4"
                    strokeDasharray={`${2*Math.PI*28}`}
                    strokeDashoffset={isDealing || gamePhase === 'result' ? `${2*Math.PI*28}` : `${2*Math.PI*28 - (2*Math.PI*28 * Math.max(0,timer-3))/12}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                
                {/* Text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                  {isDealing || gamePhase === 'result' ? (
                    <span className="font-mono font-black text-white/50 text-[10px] tracking-widest mt-0.5">VS</span>
                  ) : (
                    <>
                      <span className="font-mono font-black text-white leading-none text-[18px]">
                        {`${timer<10?'0':''}${timer}`}
                      </span>
                      <span className="text-[7px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Sec</span>
                    </>
                  )}
                </div>
              </div>

              <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            </div>

            {/* Banker Hand */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[3px]">Banker</span>
                {showScores && dealtCards.banker.every(c => c.flipped) && (
                  <ScoreBadge score={bankerScore} winner={winner} side="banker" />
                )}
              </div>

              <div className={`flex gap-2 p-3 rounded-2xl border-2 transition-all duration-500 ${
                winner === 'banker' ? 'border-[#3de796]/60 shadow-xl shadow-[#3de796]/20' :
                winner === 'tie' ? 'border-yellow-400/30' :
                winner ? 'border-white/10' : 'border-white/[0.06]'
              } bg-black/20 backdrop-blur-sm`}>
                {[0, 1, 2].map(idx => {
                  const card = dealtCards.banker[idx];
                  if (!card) {
                    if (idx < 2 && gamePhase === 'betting') return <CardSlot key={idx} />;
                    return null;
                  }
                  const offset = getOffset('banker', idx);
                  return (
                    <PlayingCard
                      key={`b-${idx}`}
                      card={card}
                      flipped={card.flipped}
                      dealDelay={0}
                      deckOffX={offset.x}
                      deckOffY={offset.y}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bet Zones ── */}
        <div className="flex gap-3">
          <BetZone id="player" label="PLAYER" odds="1:1"    amount={playerBet} active={playerBet > 0} onClick={() => addBet('player')} disabled={isDealing || timer <= 3} />
          <BetZone id="tie"    label="TIE"    odds="8:1"    amount={tieBet}    active={tieBet > 0}    onClick={() => addBet('tie')}    disabled={isDealing || timer <= 3} />
          <BetZone id="banker" label="BANKER" odds="0.95:1" amount={bankerBet} active={bankerBet > 0} onClick={() => addBet('banker')} disabled={isDealing || timer <= 3} />
        </div>
      </div>
    </div>
  );
}
