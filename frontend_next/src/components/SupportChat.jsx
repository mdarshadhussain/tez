'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Search, HelpCircle, MessageSquare, Home, ArrowRight, ChevronRight, User } from 'lucide-react';

export default function SupportChat({ socket, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, messages, help
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  const messagesEndRef = useRef(null);

  // FAQ Static Data
  const faqData = [
    {
      id: 'vip',
      title: 'VIP Transfer program',
      answer: '👑 Our VIP Transfer program allows you to import your turnover status from other gaming platforms. Contact support directly with screenshots of your external profile turnover to instantly claim matching VIP tasks!'
    },
    {
      id: 'levels',
      title: 'What are the rewards levels and benefits at Thrill?',
      answer: '🎁 Thrill offers a tier-based rewards system: VIP 1 to VIP 5. Each level grants access to premium daily tasks, custom promotions, higher deposit match bonuses, and dedicated assistance.'
    },
    {
      id: 'levelup',
      title: 'What are the level up bonuses?',
      answer: '🔥 Leveling up grants instant playable cash awards! VIP 1 gets ₹100, VIP 2 gets ₹500, VIP 3 gets ₹2,000, VIP 4 gets ₹10,000, and VIP 5 gets ₹50,000. These are credited straight to your playable wallet.'
    },
    {
      id: 'xp',
      title: 'How to earn XP and climb the ranks?',
      answer: '🎮 XP is earned automatically by wagering in the casino. Every ₹100 bet on WinGo, Trx, Crash, Mines, Plinko, Limbo, Roulette, or Dice earns you 1 XP. The more you play, the faster you rank up!'
    },
    {
      id: 'deposit',
      title: 'Deposit not reflecting in wallet?',
      answer: '💳 Most UPI and NetBanking deposits are credited within 60 seconds. If your deposit is delayed, please go to the Wallet tab, find the deposit transaction, and make sure the UTR/Reference ID is entered correctly.'
    }
  ];

  // Initialize Support Session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let savedSessionId = localStorage.getItem('tez_support_session_id');
      if (!savedSessionId) {
        savedSessionId = 'support_sess_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('tez_support_session_id', savedSessionId);
      }
      setSessionId(savedSessionId);
    }
  }, []);

  // Socket Connection for Real-time Support Chat
  useEffect(() => {
    if (!socket || !sessionId) return;

    // Join the support session room
    socket.emit('join_support', { sessionId });

    // Fetch initial chat history
    fetch(`http://localhost:3001/api/support/messages/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.messages) {
          setMessages(data.messages);
        }
      })
      .catch(err => console.error('Error fetching support history', err));

    // Listen for incoming messages
    socket.on('receive_support_message', (msg) => {
      if (msg.sessionId === sessionId) {
        setMessages(prev => {
          // Check if message is already added to prevent duplicates
          if (prev.some(m => m.id === msg.id || (m.created_at === msg.created_at && m.text === msg.text))) {
            return prev;
          }
          return [...prev, msg];
        });

        // Set notification badge if chat window is closed or on another tab
        if (!isOpen || activeTab !== 'messages') {
          setHasNewMessage(true);
        }
      }
    });

    return () => {
      socket.off('receive_support_message');
    };
  }, [socket, sessionId, isOpen, activeTab]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSend = () => {
    if (!inputText.trim() || !socket || !sessionId) return;

    const payload = {
      sessionId,
      userId: user ? user.id : null,
      sender: 'user',
      text: inputText
    };

    socket.emit('send_support_message', payload);
    setInputText('');
  };

  // Get username display
  const username = user 
    ? (user.phone_number === '9999999999' ? 'Admin' : user.phone_number.substring(0, 5) + '***')
    : 'Player';

  const filteredFaqs = faqData.filter(faq => 
    faq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lastSupportMessage = [...messages].reverse().find(m => m.sender === 'support');

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. SUPPORT CHAT MODAL PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-[360px] h-[580px] bg-[#0c0d14] rounded-3xl shadow-2xl border border-white/5 overflow-hidden flex flex-col mb-4 text-left"
          >
            {/* Header section (Gradient / branding) */}
            <div className="bg-gradient-to-b from-blue-700 via-indigo-950 to-[#0c0d14] p-6 pb-4 relative shrink-0">
              <div className="flex justify-between items-center mb-4">
                {/* logo */}
                <div className="flex items-center font-black tracking-tighter uppercase select-none">
                  <span className="text-white text-xl">thrill</span>
                  <span className="text-[#3de796] bg-[#3de796]/10 border border-[#3de796]/20 px-1.5 py-0.5 rounded text-[10px] ml-1.5 font-bold tracking-wider">support</span>
                </div>
                
                {/* Close Button */}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer border-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Greeting */}
              <div className="space-y-1 mt-6">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Hi {username} <span className="animate-bounce">👋</span>
                </h2>
                <p className="text-sm text-white/80 font-medium">How can we help?</p>
              </div>
            </div>

            {/* 2. TABBED CONTENT BODY */}
            <div className="flex-1 overflow-y-auto px-5 py-2 relative scrollbar-none bg-[#0c0d14]">
              {activeTab === 'home' && (
                <div className="space-y-4 pt-2 pb-6">
                  {/* Recent Message Card */}
                  {lastSupportMessage ? (
                    <div 
                      onClick={() => setActiveTab('messages')}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all space-y-2.5"
                    >
                      <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Recent message</div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                          M
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-bold text-white">Maddie (Support)</span>
                            <span className="text-[9px] text-text-muted">Just now</span>
                          </div>
                          <p className="text-[11px] text-text-secondary truncate mt-0.5">
                            {lastSupportMessage.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setActiveTab('messages')}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all space-y-2.5"
                    >
                      <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Start a conversation</div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3de796] to-emerald-600 flex items-center justify-center text-black font-black text-sm">
                          ?
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white block">Chat with support team</span>
                          <span className="text-[10px] text-text-secondary">We reply in under 2 minutes</span>
                        </div>
                        <ChevronRight size={16} className="text-text-muted" />
                      </div>
                    </div>
                  )}

                  {/* Send Message pill */}
                  <button
                    onClick={() => setActiveTab('messages')}
                    className="w-full bg-white hover:bg-white/95 text-blue-900 font-bold text-xs py-3.5 px-5 rounded-2xl flex justify-between items-center transition-all shadow-md cursor-pointer border-0"
                  >
                    <span>Send us a message</span>
                    <Send size={14} className="text-blue-900 transform rotate-45" />
                  </button>

                  {/* Search for help box */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-3.5 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search for help"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#12141f] border border-white/5 py-2.5 pl-10 pr-4 rounded-xl text-xs text-white outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      {filteredFaqs.slice(0, 3).map(faq => (
                        <button
                          key={faq.id}
                          onClick={() => {
                            setSelectedFaq(faq);
                            setActiveTab('help');
                          }}
                          className="w-full text-left py-2.5 border-b border-white/5 flex justify-between items-center text-xs text-text-secondary hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
                        >
                          <span className="truncate pr-4">{faq.title}</span>
                          <ChevronRight size={14} className="text-text-muted shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="h-full flex flex-col pb-2">
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 py-3 scrollbar-none min-h-[300px]">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
                        <MessageSquare size={36} className="text-white/10 mb-2" />
                        <p className="text-xs font-bold">No messages yet</p>
                        <p className="text-[10px] mt-1">Send a message below to start a ticket with support</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isSupport = msg.sender === 'support';
                        return (
                          <div 
                            key={idx}
                            className={`flex ${isSupport ? 'justify-start' : 'justify-end'} items-end gap-2`}
                          >
                            {isSupport && (
                              <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-bold border border-blue-500/20 text-[9px] flex items-center justify-center shrink-0">
                                M
                              </div>
                            )}
                            <div
                              className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                                isSupport 
                                  ? 'bg-[#181a26] text-white border border-white/5 rounded-bl-sm' 
                                  : 'bg-blue-600 text-white rounded-br-sm'
                              }`}
                            >
                              <p className="break-words font-medium">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Box */}
                  <div className="flex gap-2 pt-2 border-t border-white/5 bg-[#0c0d14] sticky bottom-0">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className="flex-1 bg-white/5 border border-white/10 py-2.5 px-4 rounded-xl text-xs text-white outline-none focus:border-blue-500/30"
                    />
                    <button
                      onClick={handleSend}
                      className="bg-blue-600 hover:bg-blue-500 p-2.5 rounded-xl text-white cursor-pointer border-0 transition-colors flex items-center justify-center"
                    >
                      <Send size={14} className="transform rotate-45" />
                    </button>
                  </div>
                </div>
              )}

              {/* Help / FAQ Tab */}
              {activeTab === 'help' && (
                <div className="space-y-4 pt-2 pb-6">
                  {selectedFaq ? (
                    <div className="space-y-4">
                      <button
                        onClick={() => setSelectedFaq(null)}
                        className="text-xs text-blue-400 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0"
                      >
                        &larr; Back to Help list
                      </button>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                        <h3 className="font-extrabold text-sm text-white leading-snug">{selectedFaq.title}</h3>
                        <p className="text-xs text-text-secondary leading-relaxed font-medium">{selectedFaq.answer}</p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('messages');
                          setInputText(`Regarding FAQ topic: "${selectedFaq.title}" - `);
                        }}
                        className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Talk to a human helper about this
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search size={14} className="absolute left-3.5 top-3.5 text-text-muted" />
                        <input
                          type="text"
                          placeholder="Search FAQs"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 py-2.5 pl-10 pr-4 rounded-xl text-xs text-white outline-none focus:border-blue-500/50"
                        />
                      </div>

                      <div className="bg-[#12141f]/40 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                        {filteredFaqs.map(faq => (
                          <div
                            key={faq.id}
                            onClick={() => setSelectedFaq(faq)}
                            className="p-4 hover:bg-white/[0.02] cursor-pointer flex justify-between items-center transition-colors text-xs text-text-secondary hover:text-white"
                          >
                            <span className="font-medium pr-4">{faq.title}</span>
                            <ChevronRight size={14} className="text-text-muted" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. FIXED BOTTOM NAV BAR */}
            <div className="h-[64px] bg-[#12141f] border-t border-white/5 flex justify-around items-center shrink-0 px-4">
              <button
                onClick={() => {
                  setActiveTab('home');
                  setSelectedFaq(null);
                }}
                className={`flex flex-col items-center gap-1 cursor-pointer bg-transparent border-0 ${
                  activeTab === 'home' ? 'text-blue-500 font-bold' : 'text-text-muted hover:text-white/60'
                }`}
              >
                <Home size={18} />
                <span className="text-[9px]">Home</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('messages');
                  setHasNewMessage(false);
                }}
                className={`flex flex-col items-center gap-1 cursor-pointer bg-transparent border-0 relative ${
                  activeTab === 'messages' ? 'text-blue-500 font-bold' : 'text-text-muted hover:text-white/60'
                }`}
              >
                <div className="relative">
                  <MessageSquare size={18} />
                  {hasNewMessage && (
                    <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-bounce">
                      1
                    </span>
                  )}
                </div>
                <span className="text-[9px]">Messages</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('help');
                  setSelectedFaq(null);
                }}
                className={`flex flex-col items-center gap-1 cursor-pointer bg-transparent border-0 ${
                  activeTab === 'help' ? 'text-blue-500 font-bold' : 'text-text-muted hover:text-white/60'
                }`}
              >
                <HelpCircle size={18} />
                <span className="text-[9px]">Help</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION LAUNCHER BUTTON */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewMessage(false);
        }}
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 cursor-pointer border-0 outline-none"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor" />
              {/* Happy smile curve in middle of message bubble */}
              <path d="M8 9.5c1.5 2 4.5 2 6 0" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-blue-600 animate-ping" />
            )}
          </div>
        )}
      </motion.button>
    </div>
  );
}
