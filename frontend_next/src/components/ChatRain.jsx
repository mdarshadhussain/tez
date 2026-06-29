'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, X, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatRain({ socket, user, vipLevel, playableBalance, setPlayableBalance, chatOpen, setChatOpen }) {
  const isOpen = chatOpen;
  const setIsOpen = setChatOpen;
  const [messages, setMessages] = useState([
    { sender: 'm4d', text: 'JACKBLACK212 you must coz this ones so far good from other sites', vip_level: 2 },
    { sender: 'milfsuckerdogg', text: 'MADSLOVERREF ouch', vip_level: 3 },
    { sender: 'ysl', text: "JACKBLACK212 purple site's been awful lately man.. ,__,", vip_level: 1 },
    { sender: 'itsbiglezmate', text: '[BET_SHARE] Keno | Thrill Originals | $12.14 | 350.00x', vip_level: 5 },
    { sender: 'shpagin', text: 'nice', vip_level: 2 },
    { sender: 'andrey1271', text: 'ITSBIGLEZMATE good job', vip_level: 3 },
    { sender: 'starbuster', text: 'Was fullu in 30sec', vip_level: 4 },
  ]);
  const [inputText, setInputText] = useState('');
  const [activeRain, setActiveRain] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('init_data', (data) => {
      if (data && data.chat && data.chat.length > 0) {
        setMessages(data.chat);
      }
    });

    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg].slice(-40));
    });

    socket.on('chat_error', (data) => {
      alert(data.error || 'Failed to send chat');
    });

    socket.on('rain_event', (data) => {
      // Spawn floating packets
      setActiveRain(data.packets || []);
      // Automatically clean up after 6 seconds
      setTimeout(() => {
        setActiveRain([]);
      }, 6000);
    });

    socket.on('rain_claim_success', (data) => {
      setPlayableBalance(data.balance);
      alert(`Claimed! ₹${data.amount} added to playable balance.`);
    });

    return () => {
      socket.off('init_data');
      socket.off('chat_message');
      socket.off('chat_error');
      socket.off('rain_event');
      socket.off('rain_claim_success');
    };
  }, [socket, setPlayableBalance]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputText.trim() || !socket) return;
    socket.emit('send_chat', {
      userId: user ? user.id : null,
      sender: user ? user.phone_number.substring(0, 3) + '***' : 'Player',
      text: inputText,
      vip_level: vipLevel
    });
    setInputText('');
  };

  const claimPacket = (packet) => {
    if (!socket || !user) return;
    socket.emit('claim_rain', {
      userId: user.id,
      amount: packet.amount
    });
    // Remove packet visually
    setActiveRain((prev) => prev.filter((p) => p.id !== packet.id));
  };

  // Resolve Diamond Color Class
  const getDiamondColorClass = (level) => {
    if (level === 1) return 'text-slate-500 dark:text-[#94a3b8]'; // grey/silver
    if (level === 2) return 'text-[#b45309]'; // copper
    if (level === 3) return 'text-[#fbbf24]'; // gold
    if (level >= 4) return 'text-[#38bdf8]'; // diamond blue
    return 'text-[#64748b]'; // default slate
  };

  // Helper to render message text with mentions highlighted
  const renderMessageText = (text) => {
    if (!text) return '';
    const words = text.split(' ');
    return words.map((word, idx) => {
      // Check if it's an uppercase mention of user/replies (like JACKBLACK212)
      const isMention = /^[A-Z0-9_-]{3,15}$/.test(word.replace(/[^A-Za-z0-9]/g, ''));
      if (isMention) {
        return (
          <span key={idx} className="bg-black/15 dark:bg-black/40 text-[9px] px-1 py-0.5 rounded font-black text-[#e2e8f0] mx-0.5 inline-block border border-black/10 dark:border-white/5">
            {word}
          </span>
        );
      }
      return word + ' ';
    });
  };

  return (
    <>
      {/* Floating Rain Layer */}
      <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
        <AnimatePresence>
          {activeRain.map((packet, index) => {
            const startX = 10 + (index * 12) % 80; // distribute horizontally
            return (
              <motion.div
                key={packet.id}
                initial={{ y: -100, x: `${startX}vw`, opacity: 0, scale: 0.5, rotate: 0 }}
                animate={{ 
                  y: '105vh', 
                  opacity: [0, 1, 1, 0], 
                  scale: [0.8, 1.1, 1, 0.8],
                  rotate: 360,
                  x: [`${startX}vw`, `${startX + (index % 2 === 0 ? 5 : -5)}vw`]
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  duration: 4.5 + (index % 3) * 0.5, 
                  ease: 'linear',
                  delay: (index % 4) * 0.2
                }}
                onClick={() => claimPacket(packet)}
                className="absolute pointer-events-auto cursor-pointer bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-600 border border-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] rounded-2xl p-3 flex flex-col items-center justify-center text-black font-extrabold text-xs select-none"
                style={{ width: '70px', height: '70px' }}
                whileHover={{ scale: 1.2, y: '-=10px', shadow: '0 0 25px rgba(245,158,11,0.8)' }}
              >
                <Sparkles size={16} className="text-slate-900 dark:text-white animate-bounce mb-0.5" />
                <span className="text-[10px] text-yellow-100 uppercase tracking-tighter">Claim</span>
                <span className="text-slate-900 dark:text-white font-black text-sm">₹{packet.amount}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 w-80 h-full bg-[#11131c] border-l border-black/10 dark:border-white/5 z-50 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/5 bg-white/40 dark:bg-[#171a25]/40 shrink-0">
              <div className="relative">
                <button className="bg-black/5 dark:bg-black/20 hover:bg-black/15 dark:bg-black/40 border border-black/10 dark:border-white/5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:text-white transition-all outline-none">
                  <span className="text-xs">🗣</span>
                  <span>General</span>
                  <span className="text-[8px] opacity-75">▼</span>
                </button>
              </div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:text-white bg-transparent border-0 cursor-pointer p-1.5 hover:bg-black/5 dark:bg-white/5 rounded-xl transition-all"
                title="Collapse Chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                </svg>
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin bg-[#0c0d14]/30">
              {messages.map((m, idx) => {
                const isBetShare = m.text && m.text.startsWith('[BET_SHARE]');

                if (isBetShare) {
                  const parts = m.text.replace('[BET_SHARE] ', '').split(' | ');
                  const gameName = parts[0] || 'Keno';
                  const studioName = parts[1] || 'Thrill Originals';
                  const amount = parts[2] || '$12.14';
                  const multiplier = parts[3] || '350.00x';

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={idx}
                      className="bg-[#1c1d27]/40 hover:bg-[#1c1d27]/60 border border-black/[0.05] dark:border-white/[0.02] p-3 rounded-2xl flex flex-col gap-2.5"
                    >
                      <div className="flex items-center gap-2 text-slate-500 dark:text-[#94a3b8] text-[10px] font-black uppercase tracking-wider">
                        <span className={`${getDiamondColorClass(m.vip_level)} text-xs shrink-0`}>◆</span>
                        <span>{m.sender} shared this bet</span>
                      </div>
                      
                      <div className="bg-slate-50/85 dark:bg-[#0f111a]/85 border border-black/10 dark:border-white/5 rounded-xl p-3 flex gap-3.5 items-center relative overflow-hidden">
                        {/* Game icon */}
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 p-[1px] relative shrink-0 shadow-md">
                          <div className="w-full h-full rounded-lg bg-[#0c0d14] flex flex-col items-center justify-center text-[10px] font-black relative overflow-hidden">
                            <span className="bg-blue-500 text-[6px] px-1 py-0.2 rounded absolute top-0.5 left-0.5 font-bold text-slate-900 dark:text-white">1</span>
                            <span className="text-slate-900 dark:text-white text-[9px] tracking-tighter uppercase mt-1">KENO</span>
                            <span className="text-purple-400 text-[6px] font-bold">20</span>
                          </div>
                        </div>
                        
                        {/* stats */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">{gameName}</h4>
                          <p className="text-[9px] text-[#6b7280] font-semibold">{studioName}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-black text-[#3de796] flex items-center gap-1">
                              <span className="text-[#3de796] text-[9px]">₮</span> {amount}
                            </span>
                            <span className="text-[10px] font-black text-slate-500 dark:text-[#94a3b8] flex items-center gap-1">
                              <span>⏱</span> {multiplier}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx}
                    className="bg-[#1c1d27]/70 hover:bg-[#1c1d27] border border-white/[0.01] px-3.5 py-2 rounded-xl text-[12.5px] leading-relaxed flex items-start gap-2 text-slate-500 dark:text-[#94a3b8]"
                  >
                    {/* Diamond icon colored by VIP */}
                    <span className={`${getDiamondColorClass(m.vip_level)} text-xs shrink-0 mt-[2px]`}>◆</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">{m.sender}:</span>
                      <span className="text-[#b2c1d4]">{renderMessageText(m.text)}</span>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Locked Wager Progress box */}
            <div className="px-4 py-3.5 mx-4 my-2 bg-[#1c1d27]/70 border border-black/[0.05] dark:border-white/[0.02] rounded-2xl space-y-2.5 shrink-0 select-none">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <span>🔒</span> Wager to unlock chat
                </span>
                <span className="text-slate-500 dark:text-[#94a3b8]">0/500 XP</span>
              </div>
              <div className="w-full bg-black/15 dark:bg-black/40 h-2 rounded-full overflow-hidden">
                <div className="w-[10%] h-full bg-[#3de796]" />
              </div>
            </div>

            {/* Input & Form footer */}
            <div className="p-4 border-t border-black/10 dark:border-white/5 bg-[#0c0d14] flex flex-col gap-2 shrink-0">
              <div className="bg-black/10 dark:bg-black/30 border border-black/10 dark:border-white/5 hover:border-black/15 dark:border-white/10 rounded-full px-4.5 py-1.5 flex items-center justify-between transition-all">
                <input
                  type="text"
                  className="bg-transparent border-0 text-xs w-full text-slate-900 dark:text-white outline-none py-2 placeholder:text-[#6b7280] font-medium"
                  placeholder="Message #General"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="text-[#3de796] hover:text-[#5cf2aa] transition-colors cursor-pointer bg-transparent border-0 p-1 flex items-center justify-center font-black text-lg select-none"
                >
                  ＋
                </button>
              </div>

              {/* Stats Footer bar */}
              <div className="flex justify-between items-center text-[9px] text-[#6b7280] font-black uppercase tracking-wider px-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#3de796] rounded-full animate-pulse" />
                  <span>Online: 420</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hover:text-slate-900 dark:text-white cursor-pointer transition-colors">Rules</span>
                  <span>160</span>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
