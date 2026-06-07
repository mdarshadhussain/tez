'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, X, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatRain({ socket, user, vipLevel, playableBalance, setPlayableBalance, chatOpen, setChatOpen }) {
  const isOpen = chatOpen;
  const setIsOpen = setChatOpen;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activeRain, setActiveRain] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('init_data', (data) => {
      if (data && data.chat) {
        setMessages(data.chat);
      }
    });

    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg].slice(-40));
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
                <Sparkles size={16} className="text-white animate-bounce mb-0.5" />
                <span className="text-[10px] text-yellow-100 uppercase tracking-tighter">Claim</span>
                <span className="text-white font-black text-sm">₹{packet.amount}</span>
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
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-80 h-full bg-zinc-950/95 border-l border-white/5 z-50 flex flex-col backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green border border-accent-green/20">
                  <Gift size={16} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white leading-tight">Live VIP Lobby</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
                    <span className="text-[10px] text-text-muted">Chat & Claim Rewards</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-white transition-colors cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.map((m, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`p-3 rounded-2xl border text-sm ${
                    m.system 
                      ? 'bg-accent-cyan/5 border-accent-cyan/10 text-accent-cyan shadow-[inset_0_0_12px_rgba(0,229,255,0.02)]' 
                      : 'bg-white/[0.02] border-white/5 text-text-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${m.system ? 'text-accent-cyan' : 'text-white'}`}>
                      {m.sender}
                    </span>
                    {m.vip_level > 0 && (
                      <span className="text-[9px] font-black border border-amber-500/50 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">
                        VIP {m.vip_level}
                      </span>
                    )}
                  </div>
                  <p className="break-words leading-relaxed text-xs">
                    {m.text}
                  </p>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Form */}
            <div className="p-4 border-t border-white/5 bg-zinc-950 flex gap-2">
              <input
                type="text"
                className="form-input flex-1 py-2 px-3 text-xs bg-white/5 border border-white/10 rounded-xl"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                className="bg-accent-green text-white p-2 rounded-xl cursor-pointer hover:bg-accent-green-hover shadow-[0_0_15px_rgba(255,0,102,0.3)] flex items-center justify-center"
              >
                <Send size={14} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
