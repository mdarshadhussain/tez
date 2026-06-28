'use client';

import React, { useState, useEffect } from 'react';
import { playClick } from '../../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, TrendingUp, Users, Shield, Award, Sparkles, Search, SlidersHorizontal, Filter, ChevronDown, Compass, CheckCircle2 } from 'lucide-react';

const gamesList = [
  { id: 'wingo', name: 'Win Go', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#10b981] to-[#047857]', illustration: 'wingo' },

  { id: 'crash', name: 'Crash', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#ec4899] to-[#ea580c]', illustration: 'crash' },

  { id: 'limbo', name: 'Limbo', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#a3e635] to-[#3f6212]', illustration: 'limbo' },
  { id: 'roulette', name: 'Roulette', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#dc2626] to-[#1e1b4b]', illustration: 'roulette' },
  { id: 'dice', name: 'Dice', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#06b6d4] to-[#115e59]', illustration: 'dice' },
  { id: 'coin', name: 'Coin Flip', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#3b82f6] to-[#1e3a8a]', illustration: 'coin' },
  { id: 'hilo', name: 'Hilo', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#6366f1] to-[#4338ca]', illustration: 'hilo' },
  { id: 'keno', name: 'Keno', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#8b5cf6] to-[#5b21b6]', illustration: 'keno' },

  { id: 'hotline', name: 'Hotline', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#d946ef] to-[#86198f]', illustration: 'hotline' },

  { id: 'baccarat', name: 'Baccarat', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#f97316] to-[#9a3412]', illustration: 'baccarat' },
  { id: 'blackjack', name: 'Blackjack', tag: 'TEZCLUB ORIGINALS', style: 'bg-gradient-to-b from-[#dc2626] to-[#7f1d1d]', illustration: 'blackjack', subName: 'MULTI-SEAT' },
];

const categoryTabs = [
  { id: 'lobby', label: 'LOBBY', emoji: '⠿' },
  { id: 'originals', label: 'TEZCLUB ORIGINALS', emoji: '💎' },
  { id: 'slots', label: 'SLOTS', emoji: '🍒' },
  { id: 'live-casino', label: 'LIVE CASINO', emoji: '🃏' },
  { id: 'game-shows', label: 'GAME SHOWS', emoji: '🎡' },
  { id: 'table-games', label: 'TABLE GAMES', emoji: '🎲' },
  { id: 'boosted-rtp', label: 'BOOSTED RTP', emoji: '📈' },
  { id: 'new-arrivals', label: 'NEW ARRIVALS', emoji: '⭐' },
  { id: 'bonus-buys', label: 'BONUS BUYS', emoji: '🎁' },
  { id: 'blackjack', label: 'BLACKJACK', emoji: '♠️' },
  { id: 'roulette', label: 'ROULETTE', emoji: '🎡' },
  { id: 'baccarat', label: 'BACCARAT', emoji: '💵' },
];

const initialWinners = [
  { user: '@alexzendar', amount: '₹9,590', game: 'Slots', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80' },
  { user: '@jondeo', amount: '₹1,09,200', game: 'Roulette', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80' },
  { user: '@miliwatson', amount: '₹2,345', game: 'Mines', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80' },
  { user: '@gamedolr', amount: '₹9,876', game: 'Aviator', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80' },
];

export default function Home({ setGameMode, filter: parentFilter, setFilter: setParentFilter }) {
  const [localFilter, setLocalFilter] = useState('lobby');
  const filter = parentFilter !== undefined ? parentFilter : localFilter;
  const setFilter = setParentFilter !== undefined ? setParentFilter : setLocalFilter;

  const [hoveredId, setHoveredId] = useState(null);
  const [winners, setWinners] = useState(initialWinners);

  // Dynamic scroll controls states
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const scrollRef = React.useRef(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftScroll(scrollLeft > 1);
      setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      const observer = new MutationObserver(checkScroll);
      observer.observe(el, { childList: true, subtree: true });

      // Trigger a delayed check as layout elements render
      const timer = setTimeout(checkScroll, 100);

      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        observer.disconnect();
        clearTimeout(timer);
      };
    }
  }, []);

  useEffect(() => {
    checkScroll();
  }, [filter]);

  // Live winners feed simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const g = gamesList[Math.floor(Math.random() * gamesList.length)];
      const names = ['@ricky', '@lucas', '@sarah', '@emma', '@charlie', '@james'];
      const images = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80'
      ];
      const newWin = {
        user: names[Math.floor(Math.random() * names.length)],
        amount: `₹${(Math.random() * 8000 + 100).toFixed(0)}`,
        game: g.name,
        avatar: images[Math.floor(Math.random() * images.length)]
      };
      setWinners(prev => [newWin, ...prev.slice(0, 3)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderCardIllustration = (illustration) => {
    switch (illustration) {
      case 'keno':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            {/* Top Left Coin Badge */}
            <div className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 flex items-center justify-center font-black text-xs text-[#00f0ff] shadow-md rotate-[-12deg]">
              1
            </div>
            
            {/* Big Game Title */}
            <div className="text-center font-black text-2xl tracking-wider text-white select-none">
              KENO
            </div>
            
            {/* Bottom 3D Styled Token */}
            <div className="flex justify-center mb-1">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] border-2 border-cyan-300/40 shadow-[0_8px_20px_rgba(6,182,212,0.5)] flex items-center justify-center rotate-[15deg] transform hover:scale-105 transition-transform duration-200">
                <span className="font-extrabold text-white text-xl">20</span>
              </div>
            </div>
          </div>
        );
      case 'limbo':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            {/* Big Game Title */}
            <div className="text-center font-black text-2xl tracking-wider text-white select-none">
              LIMBO
            </div>
            
            {/* Multipliers stacked text */}
            <div className="flex flex-col items-center gap-1 mb-2 font-mono font-black select-none">
              <span className="text-[#a3e635] text-xl opacity-90 leading-none">900x</span>
              <span className="text-emerald-300 text-lg opacity-60 leading-none">800x</span>
            </div>
          </div>
        );
      case 'baccarat':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            {/* Top Right Orange Coin */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full border border-orange-300/20 bg-orange-500/10 flex items-center justify-center text-[9px] font-black text-orange-200">
              100
            </div>
            {/* Big Game Title */}
            <div className="text-center font-black text-2.5xl tracking-wider text-white select-none">
              BACCARAT
            </div>
            
            {/* Card Overlays */}
            <div className="relative h-16 w-full flex justify-center items-end mb-2 select-none">
              {/* Queen card */}
              <div className="absolute left-[30%] bottom-0 w-9 h-14 bg-white rounded-md border border-gray-200 shadow-lg flex flex-col justify-between p-1 rotate-[-15deg] transform origin-bottom">
                <span className="text-red-600 font-extrabold text-[10px] leading-none">Q</span>
                <span className="text-red-600 text-center text-sm leading-none">♥️</span>
              </div>
              {/* 9 Card */}
              <div className="absolute right-[30%] bottom-0 w-9 h-14 bg-white rounded-md border border-gray-200 shadow-lg flex flex-col justify-between p-1 rotate-[10deg] transform origin-bottom">
                <span className="text-gray-900 font-extrabold text-[10px] leading-none">9</span>
                <span className="text-gray-900 text-center text-sm leading-none">♠️</span>
              </div>
            </div>
          </div>
        );
      case 'coin':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            {/* Big Game Title */}
            <div className="text-center font-black text-2.5xl tracking-wider text-white select-none">
              COINFLIP
            </div>
            
            {/* Coin flip graphic */}
            <div className="flex justify-center mb-2 select-none">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 border-4 border-yellow-400 shadow-[0_6px_15px_rgba(234,179,8,0.5)] flex items-center justify-center transform rotate-y-180 animate-[spin_8s_linear_infinite]">
                <div className="w-10 h-10 rounded-full border border-yellow-500/20 bg-yellow-400/10 flex items-center justify-center text-yellow-600 font-black text-sm">
                  ♦
                </div>
              </div>
            </div>
          </div>
        );
      case 'dice':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            {/* Big Game Title */}
            <div className="text-center font-black text-2.5xl tracking-wider text-white select-none">
              DICE
            </div>
            
            {/* Isometric Glass Cube */}
            <div className="flex justify-center mb-2 select-none">
              <div className="w-14 h-14 bg-cyan-400/30 border-2 border-cyan-200/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] rounded-xl rotate-[45deg] transform flex items-center justify-center">
                <div className="w-8 h-8 border border-white/20 bg-cyan-200/10 rounded-lg"></div>
              </div>
            </div>
          </div>
        );
      case 'mines':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            {/* Big Game Title */}
            <div className="text-center font-black text-2.5xl tracking-wider text-white select-none">
              MINES
            </div>
            
            {/* Spiked iron bomb illustration */}
            <div className="flex justify-center mb-2 select-none">
              <div className="relative w-14 h-14 bg-zinc-900 border-2 border-zinc-700 rounded-full flex items-center justify-center shadow-2xl">
                {/* Spikes */}
                <div className="absolute -top-1.5 w-2.5 h-2.5 bg-zinc-700 rounded-sm"></div>
                <div className="absolute -bottom-1.5 w-2.5 h-2.5 bg-zinc-700 rounded-sm"></div>
                <div className="absolute -left-1.5 w-2.5 h-2.5 bg-zinc-700 rounded-sm"></div>
                <div className="absolute -right-1.5 w-2.5 h-2.5 bg-zinc-700 rounded-sm"></div>
                
                {/* Core glass screen */}
                <div className="w-8 h-8 rounded-full bg-red-600/90 border border-red-400/50 flex items-center justify-center animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'blackjack':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            {/* Big Game Title */}
            <div className="text-center select-none">
              <div className="font-black text-xl tracking-wider text-white leading-none">BLACK JACK</div>
              <div className="text-[7px] font-black text-red-200 tracking-widest mt-1 opacity-70">MULTI-SEAT</div>
            </div>
            
            {/* Cards layout */}
            <div className="relative h-16 w-full flex justify-center items-end mb-2 select-none">
              {/* Card 1 */}
              <div className="absolute left-[30%] bottom-0 w-9 h-14 bg-white rounded-md border border-gray-200 shadow-lg flex flex-col justify-between p-1 rotate-[-10deg] transform origin-bottom">
                <span className="text-gray-900 font-extrabold text-[10px] leading-none">K</span>
                <span className="text-gray-900 text-center text-sm leading-none">♣️</span>
              </div>
              {/* Card 2 */}
              <div className="absolute right-[30%] bottom-0 w-9 h-14 bg-white rounded-md border border-gray-200 shadow-lg flex flex-col justify-between p-1 rotate-[12deg] transform origin-bottom">
                <span className="text-red-600 font-extrabold text-[10px] leading-none">A</span>
                <span className="text-red-600 text-center text-sm leading-none">♦️</span>
              </div>
            </div>
          </div>
        );
      case 'crash':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            {/* Big Game Title */}
            <div className="text-center font-black text-2.5xl tracking-wider text-white select-none">
              CRASH
            </div>
            
            {/* Rocket ship launcher */}
            <div className="flex justify-center mb-2 pr-2 select-none">
              <div className="w-14 h-14 bg-white/10 hover:bg-white/15 rounded-full flex items-center justify-center border border-white/10 rotate-[-45deg] transform transition-transform duration-300">
                <span className="text-3.5xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] select-none">🚀</span>
              </div>
            </div>
          </div>
        );
      case 'wingo':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            <div className="text-center font-black text-2.5xl tracking-wider text-white select-none">
              WIN GO
            </div>
            <div className="flex justify-center gap-2 mb-2 select-none">
              <span className="text-3xl filter drop-shadow-md">🟢</span>
              <span className="text-3xl filter drop-shadow-md">🔴</span>
              <span className="text-3xl filter drop-shadow-md">🟡</span>
            </div>
          </div>
        );


      case 'roulette':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            <div className="text-center font-black text-2.5xl tracking-wider text-white select-none">
              ROULETTE
            </div>
            <div className="flex justify-center mb-2 select-none">
              <span className="text-3.5xl filter drop-shadow-md animate-spin-slow">🎡</span>
            </div>
          </div>
        );
      case 'hilo':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            <div className="text-center font-black text-2.5xl tracking-wider text-white select-none">
              HI-LO
            </div>
            <div className="flex justify-center gap-2 mb-2 select-none">
              <div className="bg-white text-zinc-900 border px-2.5 py-1 rounded font-black text-xs rotate-[-6deg]">HI</div>
              <div className="bg-white text-zinc-900 border px-2.5 py-1 rounded font-black text-xs rotate-[6deg]">LO</div>
            </div>
          </div>
        );

      case 'hotline':
        return (
          <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10 overflow-hidden select-none">
            <div className="text-center font-black text-2.5xl tracking-wider text-white select-none">
              HOTLINE
            </div>
            <div className="flex justify-center mb-2 select-none">
              <span className="text-3.5xl filter drop-shadow-md">📞</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-8 md:px-16 py-6 pb-24 space-y-8 overflow-x-hidden w-full">
      
      {/* ══════ TWIN HERO BANNERS (Thrill-style) ══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Banner 1: $75k Weekly Race */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 rounded-[24px] p-6 md:p-8 flex items-center justify-between border border-white/5 shadow-2xl relative overflow-hidden group min-h-[190px]">
          <div className="space-y-3 max-w-[65%] z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/30 text-[9px] font-black tracking-widest text-white/95 uppercase bg-white/5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              PROMOTION
            </span>
            <h2 className="text-2xl md:text-3.5xl font-black text-white leading-none tracking-tighter uppercase select-none">
              $75,000<br/>Weekly Race
            </h2>
            <p className="text-[10px] md:text-xs text-blue-100 font-extrabold uppercase tracking-wide opacity-80 leading-snug select-none">
              Climb the leaderboard.<br/>Earn your spot.
            </p>
          </div>
          
          {/* Checkered flag/Stopwatch illustration container */}
          <div className="w-[120px] md:w-[150px] shrink-0 z-10 flex items-center justify-center float-anim pr-2">
            <div className="relative w-24 h-24 bg-white/5 border border-white/15 rounded-full flex items-center justify-center shadow-inner">
              <span className="text-6xl select-none">⏱️</span>
              <span className="absolute -bottom-1 -right-1 text-4xl select-none rotate-[15deg]">🏁</span>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Banner 2: Boosted RTP (Neon Yellow-Green) */}
        <div className="bg-[#bcf74c] rounded-[24px] p-6 md:p-8 flex items-center justify-between shadow-2xl relative overflow-hidden group min-h-[190px] text-black border-0">
          <div className="space-y-3 max-w-[60%] z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-black/15 text-[9px] font-black tracking-widest text-black/80 bg-black/5 uppercase">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="text-black">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              FEATURED
            </span>
            <h2 className="text-2xl md:text-3.5xl font-black text-black leading-none tracking-tighter uppercase select-none">
              Boosted RTP
            </h2>
            <p className="text-[10px] md:text-xs text-black/70 font-extrabold uppercase tracking-wide leading-snug select-none">
              Higher returns<br/>on selected slots.
            </p>
          </div>
          
          {/* Slot Cards overlapping illustration container */}
          <div className="relative w-[130px] h-[100px] shrink-0 z-10 select-none mr-2">
            {/* Slot Card 1 */}
            <div className="absolute right-0 top-2 w-16 h-20 rounded-lg bg-orange-600 border border-black/10 shadow-lg flex flex-col justify-end p-1.5 select-none transform rotate-[10deg] hover:scale-105 transition-transform duration-200">
              <div className="text-[7px] font-black text-white leading-none select-none">SWEET</div>
              <div className="text-[5px] font-black text-orange-200 leading-none select-none">RUSH</div>
            </div>
            {/* Slot Card 2 */}
            <div className="absolute right-6 top-0 w-16 h-20 rounded-lg bg-yellow-500 border border-black/10 shadow-lg flex flex-col justify-end p-1.5 select-none transform rotate-[-5deg] z-20 hover:scale-105 transition-transform duration-200">
              <div className="text-[7px] font-black text-white leading-none select-none">JELLY</div>
              <div className="text-[5px] font-black text-yellow-100 leading-none select-none">EXPRESS</div>
            </div>
            {/* Slot Card 3 */}
            <div className="absolute right-12 top-4 w-16 h-20 rounded-lg bg-red-700 border border-black/10 shadow-lg flex flex-col justify-end p-1.5 select-none transform rotate-[-15deg] hover:scale-105 transition-transform duration-200">
              <div className="text-[7px] font-black text-white leading-none select-none">AGE OF</div>
              <div className="text-[5px] font-black text-red-200 leading-none select-none">SETH</div>
            </div>
          </div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        </div>

      </div>

      {/* ══════ THRILL-STYLE HORIZONTAL CATEGORIES ══════ */}
      <div className="space-y-4 pt-2 relative">
        <div className="relative flex items-center">
          {/* Left Navigation Arrow & Shadow Overlay */}
          <AnimatePresence>
            {showLeftScroll && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-0 top-0 bottom-4 w-16 bg-gradient-to-r from-[#0f111a] via-[#0f111a]/70 to-transparent pointer-events-none z-10"
                />
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    if (scrollRef.current) scrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
                  }}
                  className="absolute -left-4 z-20 w-10 h-10 rounded-full bg-[#171a25]/90 hover:bg-[#1d2130] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-all border border-white/5 shadow-2xl"
                >
                  ◀
                </motion.button>
              </>
            )}
          </AnimatePresence>

          {/* Category Tabs Scroll Box */}
          <div 
            ref={scrollRef}
            id="category-scroll-container"
            className="flex-1 flex gap-2.5 overflow-x-auto pb-4 scrollbar-none select-none scroll-smooth px-6"
          >
            {categoryTabs.map(cat => {
              const isActive = cat.id === filter;
              const getCategoryIcon = (id, active) => {
                const color = active ? "text-[#3de796]" : "text-[#94a3b8]";
                switch (id) {
                  case 'lobby':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={color}>
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    );
                  case 'originals':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={color}>
                        <path d="M12 2L2 12l10 10 10-10L12 2z" />
                      </svg>
                    );
                  case 'slots':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={color}>
                        <path d="M18.5 3c-.8 0-1.5.5-1.8 1.2l-3.5 8c-.6-.4-1.3-.7-2.2-.7-2.5 0-4.5 2-4.5 4.5S8.5 20.5 11 20.5s4.5-2 4.5-4.5V9.4l2.2-5c.4.2.8.3 1.3.3.8 0 1.5-.5 1.8-1.2.3-.7-.2-1.5-1.3-1.5zM6 13c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" />
                      </svg>
                    );
                  case 'live-casino':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={color}>
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" />
                      </svg>
                    );
                  case 'game-shows':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={color}>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 3v18M3 12h18m-2.6-6.4l-12.8 12.8m0-12.8l12.8 12.8" />
                      </svg>
                    );
                  case 'table-games':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={color}>
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-12 6c-.8 0-1.5-.7-1.5-1.5S6.2 6 7 6s1.5.7 1.5 1.5S7.8 9 7 9zm10 9c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm-5-4.5c-.8 0-1.5-.7-1.5-1.5s.67-1.5 1.5-1.5 1.5.7 1.5 1.5-.67 1.5-1.5 1.5z" />
                      </svg>
                    );
                  case 'boosted-rtp':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={color}>
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 13H5v-2h6v2zm0-4H5v-2h6v2zm0-4H5V7h6v2zm9 8h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4h-6V7h6v2z" />
                      </svg>
                    );
                  case 'new-arrivals':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={color}>
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    );
                  case 'bonus-buys':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={color}>
                        <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35-.54-.81-1.45-1.35-2.5-1.35-1.66 0-3 1.34-3 3 0 .35.07.69.18 1H5c-1.1 0-2 .9-2 2v3c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V8c0-1.1-.9-2-2-2zM12 5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .28-.08.53-.21.75l-2.31-2.31c.22-.13.47-.21.75-.21h.27zm-3.5 0c0-.83.67-1.5 1.5-1.5h.27c.28 0 .53.08.75.21l-2.31 2.31c-.13-.22-.21-.47-.21-.75zm-3.5 14c0 1.1.9 2 2 2h4v-10H4v8zm12 2c1.1 0 2-.9 2-2v-8h-8v10h6z" />
                      </svg>
                    );
                  case 'blackjack':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={color}>
                        <path d="M12 8.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.5 6c0 1.1.9 2 2 2 .4 0 .7-.1 1-.3v2.8c-1.1.5-2 1.5-2 2.7h5c0-1.2-.9-2.2-2-2.7v-2.8c.3.2.6.3 1 .3 1.1 0 2-.9 2-2s-.9-2-2-2c-.9 0-1.6.6-1.9 1.4-.2-.1-.5-.2-.8-.2-.3 0-.6.1-.8.2-.3-.8-1-1.4-1.9-1.4-1.1 0-2 .9-2 2z" />
                      </svg>
                    );
                  case 'roulette':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={color}>
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="5" />
                        <circle cx="12" cy="12" r="1" />
                      </svg>
                    );
                  case 'baccarat':
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={color}>
                        <path d="M12 2C9.5 7.5 4 10.5 4 13.5S7.58 19 12 19s8-2 8-5.5S14.5 7.5 12 2zm1 17.5v2h-2v-2h2z" />
                      </svg>
                    );
                  default:
                    return null;
                }
              };

              const getCategoryLabel = (id) => {
                if (id === 'originals') {
                  return <span className="text-[9px] font-black uppercase tracking-tight leading-none text-center">originals</span>;
                }
                const words = cat.label.split(' ');
                if (words.length > 1) {
                  return (
                    <span className="text-[9px] font-black uppercase tracking-tight leading-none text-center block">
                      {words[0]}<br/>{words[1]}
                    </span>
                  );
                }
                return <span className="text-[9px] font-black uppercase tracking-tight leading-none text-center">{cat.label}</span>;
              };

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playClick();
                    setFilter(cat.id);
                  }}
                  className={`flex-shrink-0 w-24 h-24 flex flex-col items-center justify-center gap-2 border rounded-2xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#3de796]/5 text-[#3de796] border-[#3de796] shadow-lg shadow-[#3de796]/5 scale-[1.01]'
                      : 'bg-[#171a25] border-transparent text-[#94a3b8] hover:text-white hover:bg-[#1d2130]'
                  }`}
                >
                  {getCategoryIcon(cat.id, isActive)}
                  {getCategoryLabel(cat.id)}
                </button>
              );
            })}
          </div>

          {/* Right Navigation Arrow & Shadow Overlay */}
          <AnimatePresence>
            {showRightScroll && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-[#0f111a] via-[#0f111a]/70 to-transparent pointer-events-none z-10"
                />
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    if (scrollRef.current) scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
                  }}
                  className="absolute -right-4 z-20 w-10 h-10 rounded-full bg-[#171a25]/90 hover:bg-[#1d2130] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-all border border-white/5 shadow-2xl"
                >
                  ▶
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ══════ TEZCLUB ORIGINALS SECTION ══════ */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between select-none">
          <h3 className="text-sm font-black text-white tracking-tighter uppercase flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#3de796]">
              <path d="M19 3H5L2.04 8.78L12 22L21.96 8.78L19 3ZM6.12 5H17.88L19.46 8H4.54L6.12 5ZM12 19.3L5.47 10.63H18.53L12 19.3Z" />
            </svg>
            TEZCLUB ORIGINALS
          </h3>
          <div className="flex gap-1.5">
            <button className="w-8 h-8 rounded-lg bg-[#171a25] border border-white/5 flex items-center justify-center text-text-secondary hover:text-white cursor-pointer transition-all text-xs font-bold">
              ◀
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#171a25] border border-white/5 flex items-center justify-center text-[#94a3b8] hover:text-white cursor-pointer transition-all text-xs font-bold">
              ▶
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {gamesList.map(game => (
            <motion.div
              layoutId={`game-card-${game.id}`}
              key={game.id}
              onClick={() => { playClick(); setGameMode(game.id); }}
              onMouseEnter={() => setHoveredId(game.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`aspect-[3/4] rounded-xl overflow-hidden cursor-pointer relative shadow-xl border border-white/5 flex items-center justify-center ${game.style} group`}
              whileHover={{ y: -4, shadow: '0 15px 30px rgba(0,0,0,0.5)', borderColor: 'rgba(61,231,150,0.3)' }}
              transition={{ duration: 0.15 }}
            >
              {/* Badge Tag */}
              <span className="absolute top-3 left-3 text-[7px] font-black text-white/55 bg-black/15 px-1.5 py-0.5 rounded uppercase tracking-wider select-none">
                {game.tag}
              </span>

              {/* Specific custom Illustration replica */}
              {renderCardIllustration(game.illustration)}

              {/* Sub-label for blackjack multiseat */}
              {game.subName && (
                <span className="absolute bottom-2 left-0 right-0 text-[6px] text-center font-black text-white/60 tracking-widest uppercase">
                  {game.subName}
                </span>
              )}

              {/* Hover Play Button Overlay */}
              <AnimatePresence>
                {hoveredId === game.id && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-20"
                  >
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="bg-[#3de796] text-[#0f111a] font-black text-xs py-2 px-4 rounded-xl shadow-[0_0_20px_rgba(61,231,150,0.4)] flex items-center gap-1.5"
                    >
                      <Play size={10} className="fill-current text-[#0f111a]" /> Play
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
