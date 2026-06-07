'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Users, Coins, Sparkles, MessageSquare, Send, Calendar, Clock, RefreshCw, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard({ token, socket }) {
  const [adminTab, setAdminTab] = useState('overview'); // overview, support
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [wingoOverride, setWingoOverride] = useState('');
  const [crashOverride, setCrashOverride] = useState('');
  const [loading, setLoading] = useState(true);

  // Support Console State
  const [supportThreads, setSupportThreads] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedThreadMessages, setSelectedThreadMessages] = useState([]);
  const [replyText, setReplyText] = useState('');

  // Payment Gateway Config State
  const [upiId, setUpiId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState([]);

  const fetchPendingDeposits = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/deposits/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.deposits) {
        setPendingDeposits(data.deposits);
      }
    } catch (e) {
      console.error('Error fetching pending deposits', e);
    }
  };

  const handleDepositAction = async (txnId, action) => {
    if (!confirm(`Are you sure you want to ${action} this deposit?`)) return;
    try {
      const res = await fetch('http://localhost:3001/api/admin/deposits/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transaction_id: txnId, action })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchPendingDeposits();
        fetchData(); // refresh overview stats
      } else {
        alert(data.error || 'Failed to process deposit action');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating deposit status');
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/payment/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setUpiId(data.settings.upi_id);
        setQrUrl(data.settings.qr_url);
      }
    } catch (e) {
      console.error('Error fetching payment settings', e);
    }
  };

  const handleUpdatePaymentSettings = async (e) => {
    e.preventDefault();
    setUpdatingSettings(true);
    try {
      const res = await fetch('http://localhost:3001/api/payment/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ upi_id: upiId, qr_url: qrUrl })
      });
      const data = await res.json();
      if (data.success) {
        alert('Payment settings updated successfully!');
      } else {
        alert(data.error || 'Failed to update payment settings');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating payment settings');
    } finally {
      setUpdatingSettings(false);
    }
  };
  
  const chatEndRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // stats
      const resStats = await fetch('http://localhost:3001/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataStats = await resStats.json();
      if (dataStats.stats) setStats(dataStats.stats);

      // users
      const resUsers = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataUsers = await resUsers.json();
      if (dataUsers.users) setUsers(dataUsers.users);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportThreads = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/support/threads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.threads) {
        setSupportThreads(data.threads);
      }
    } catch (e) {
      console.error('Error fetching support threads', e);
    }
  };

  const fetchThreadMessages = async (sessId) => {
    try {
      const res = await fetch(`http://localhost:3001/api/support/messages/${sessId}`);
      const data = await res.json();
      if (data.messages) {
        setSelectedThreadMessages(data.messages);
      }
    } catch (e) {
      console.error('Error fetching messages', e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      fetchSupportThreads();
      fetchPaymentSettings();
      fetchPendingDeposits();
    }
  }, [token]);

  // Handle Real-time Support Socket Events
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (msg) => {
      // Refresh the support threads list
      fetchSupportThreads();

      // If this session is currently active/selected by admin, append the message
      if (selectedSessionId && msg.sessionId === selectedSessionId) {
        setSelectedThreadMessages(prev => {
          if (prev.some(m => m.id === msg.id || (m.created_at === msg.created_at && m.text === msg.text))) {
            return prev;
          }
          return [...prev, msg];
        });
      }
    };

    socket.on('support_new_message_notification', handleNewNotification);
    
    // Also listen to incoming messages if joined room
    socket.on('receive_support_message', (msg) => {
      if (selectedSessionId && msg.sessionId === selectedSessionId) {
        setSelectedThreadMessages(prev => {
          if (prev.some(m => m.id === msg.id || (m.created_at === msg.created_at && m.text === msg.text))) {
            return prev;
          }
          return [...prev, msg];
        });
      }
    });

    return () => {
      socket.off('support_new_message_notification', handleNewNotification);
      socket.off('receive_support_message');
    };
  }, [socket, selectedSessionId]);

  // Join the selected session support room so admin gets real-time messages
  useEffect(() => {
    if (socket && selectedSessionId) {
      socket.emit('join_support', { sessionId: selectedSessionId });
      fetchThreadMessages(selectedSessionId);
    }
  }, [socket, selectedSessionId]);

  // Scroll support window to bottom
  useEffect(() => {
    if (selectedSessionId) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThreadMessages, selectedSessionId]);

  const submitOverride = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/admin/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          wingo_color: wingoOverride || null,
          crash_multiplier: crashOverride || null
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Override set successfully!\nNext WinGo: ${data.nextWinGoColor || 'Normal'}\nNext Crash: ${data.nextCrashMultiplier ? data.nextCrashMultiplier + 'x' : 'Normal'}`);
        setWingoOverride('');
        setCrashOverride('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBlock = async (userId) => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/toggle-block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: data.is_blocked } : u));
      } else {
        alert(data.error || 'Failed to toggle block status');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendSupportReply = () => {
    if (!replyText.trim() || !socket || !selectedSessionId) return;

    socket.emit('send_support_message', {
      sessionId: selectedSessionId,
      userId: null, // sent by support
      sender: 'support',
      text: replyText
    });

    setReplyText('');
  };

  if (loading && !stats) {
    return <div className="p-6 text-text-muted text-xs">Loading Admin Console...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 pb-24 max-w-5xl mx-auto space-y-6"
    >
      {/* Banner */}
      <div className="bg-gradient-to-br from-accent-orange/15 via-zinc-950/80 to-zinc-950 border border-accent-orange/20 p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl">
        <Shield size={48} className="text-accent-orange mx-auto mb-3 animate-pulse" />
        <span className="text-accent-orange font-extrabold text-[10px] tracking-[4px] uppercase block mb-1">
          Master Platform Admin
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          CONTROL DASHBOARD
        </h1>

        {/* Tab Selection */}
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          <button
            onClick={() => setAdminTab('overview')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-0 ${
              adminTab === 'overview'
                ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20'
                : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
            }`}
          >
            Overview & Overrides
          </button>
          <button
            onClick={() => {
              setAdminTab('support');
              fetchSupportThreads();
            }}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center gap-2 ${
              adminTab === 'support'
                ? 'bg-[#3de796] text-[#0f111a] shadow-lg shadow-[#3de796]/20'
                : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
            }`}
          >
            <MessageSquare size={14} />
            <span>Support Sessions</span>
          </button>
          <button
            onClick={() => {
              setAdminTab('payment');
              fetchPaymentSettings();
              fetchPendingDeposits();
            }}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center gap-2 ${
              adminTab === 'payment'
                ? 'bg-[#3de796] text-[#0f111a] shadow-lg shadow-[#3de796]/20'
                : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
            }`}
          >
            <Coins size={14} />
            <span>Payment Gateway</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {adminTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block">Total Stakes Volume</span>
                  <div className="monospace-ledger text-lg md:text-xl font-black text-white mt-1">
                    ₹{stats.total_bets.toFixed(2)}
                  </div>
                </div>
                <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block">House Gross profit</span>
                  <div className="monospace-ledger text-lg md:text-xl font-black text-accent-cyan mt-1">
                    ₹{stats.house_profit.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Game Override Inputs */}
            <div>
              <h2 className="text-xs font-black text-white tracking-widest uppercase mb-3">
                Round Resolution Overrides
              </h2>
              <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl">
                <form onSubmit={submitOverride} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted font-bold block mb-1.5 uppercase">Next WinGo Resolution</label>
                      <select
                        className="form-input py-2 px-3 text-xs bg-white/5 border border-white/10 rounded-xl w-full"
                        value={wingoOverride}
                        onChange={(e) => setWingoOverride(e.target.value)}
                      >
                        <option value="" className="bg-zinc-900 text-white">Default Logic (Algorithmic)</option>
                        <option value="red" className="bg-zinc-900 text-white">Force RED color</option>
                        <option value="green" className="bg-zinc-900 text-white">Force GREEN color</option>
                        <option value="violet" className="bg-zinc-900 text-white">Force VIOLET color</option>
                        <option value="0" className="bg-zinc-900 text-white">Force Number 0</option>
                        <option value="3" className="bg-zinc-900 text-white">Force Number 3</option>
                        <option value="7" className="bg-zinc-900 text-white">Force Number 7</option>
                        <option value="8" className="bg-zinc-900 text-white">Force Number 8</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-text-muted font-bold block mb-1.5 uppercase">Next Crash Multiplier</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input py-2 px-3 text-xs bg-white/5 border border-white/10 rounded-xl w-full"
                        placeholder="e.g. 15.50"
                        value={crashOverride}
                        onChange={(e) => setCrashOverride(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="action-btn py-2.5 w-full text-xs font-black bg-accent-orange hover:bg-accent-orange/80 text-white hover:shadow-[0_0_15px_rgba(255,94,0,0.3)]"
                  >
                    Apply Real-time Overrides
                  </button>
                </form>
              </div>
            </div>

            {/* User Directory */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-black text-white tracking-widest uppercase">
                  Registered Users Directory ({users.length})
                </h2>
                <button 
                  onClick={fetchData} 
                  className="bg-transparent border-0 text-text-muted hover:text-white cursor-pointer"
                  title="Refresh Users"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="bg-zinc-950/30 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                {users.map((u, idx) => (
                  <div
                    key={u.id || idx}
                    className="flex justify-between items-center p-4 hover:bg-white/[0.01] transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-[10px] text-text-muted font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{u.phone_number}</span>
                          {u.is_blocked === 1 && (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 rounded px-1 text-[8px] font-bold uppercase tracking-wider">
                              Blocked
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-text-dim mt-0.5">
                          Joined: {new Date(u.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="monospace-ledger font-extrabold text-accent-cyan">
                          ₹{parseFloat(u.lifetime_turnover).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-text-dim mt-0.5">Turnover Volume</div>
                      </div>

                      {u.phone_number !== '9999999999' ? (
                        <button
                          onClick={() => toggleBlock(u.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all border ${
                            u.is_blocked
                              ? 'bg-accent-red/20 text-accent-red border-accent-red/30 hover:bg-accent-red/35'
                              : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {u.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-accent-green/10 text-accent-green border border-accent-green/20 select-none">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : adminTab === 'support' ? (
          <motion.div
            key="support"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px]"
          >
            {/* Left Column: Threads list */}
            <div className="bg-zinc-950/40 border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full col-span-1">
              <div className="p-4 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                <span className="text-xs font-black text-white uppercase tracking-wider">Active Chat Sessions</span>
                <button 
                  onClick={fetchSupportThreads} 
                  className="bg-transparent border-0 text-text-muted hover:text-white cursor-pointer"
                >
                  <RefreshCw size={12} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-none">
                {supportThreads.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-xs">No support chats yet</div>
                ) : (
                  supportThreads.map((thread) => (
                    <div
                      key={thread.session_id}
                      onClick={() => setSelectedSessionId(thread.session_id)}
                      className={`p-4 cursor-pointer transition-colors text-left ${
                        selectedSessionId === thread.session_id 
                          ? 'bg-[#3de796]/10 border-l-2 border-[#3de796]' 
                          : 'hover:bg-white/[0.01]'
                      }`}
                    >
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-bold text-white">
                          {thread.phone_number || 'Guest'}
                        </span>
                        <span className="text-[9px] text-text-muted">
                          {new Date(thread.last_msg_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate">
                        {thread.last_msg}
                      </p>
                      <span className="text-[8px] text-text-dim block mt-0.5 monospace-ledger">
                        {thread.session_id}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Columns: Thread history and messaging */}
            <div className="bg-zinc-950/40 border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full col-span-2">
              {selectedSessionId ? (
                <div className="flex flex-col h-full">
                  {/* Top Bar */}
                  <div className="p-4 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-wider block">Session Room</span>
                      <span className="text-[9px] text-[#3de796] font-mono select-all block mt-0.5">{selectedSessionId}</span>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none bg-[#0c0d14]/40">
                    {selectedThreadMessages.map((m, idx) => {
                      const isSupport = m.sender === 'support';
                      return (
                        <div
                          key={idx}
                          className={`flex ${isSupport ? 'justify-end' : 'justify-start'} items-end gap-2`}
                        >
                          {!isSupport && (
                            <div className="w-6 h-6 rounded-full bg-[#3de796]/20 text-[#3de796] font-bold border border-[#3de796]/20 text-[9px] flex items-center justify-center shrink-0">
                              U
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed ${
                              isSupport 
                                ? 'bg-blue-600 text-white rounded-br-sm' 
                                : 'bg-[#181a26] text-white border border-white/5 rounded-bl-sm'
                            }`}
                          >
                            <p className="break-words font-medium">{m.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Reply input */}
                  <div className="p-4 border-t border-white/5 bg-zinc-950/80 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your support response..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendSupportReply()}
                      className="form-input flex-1 py-2.5 px-4 text-xs bg-white/5 border border-white/10 rounded-xl"
                    />
                    <button
                      onClick={sendSupportReply}
                      className="bg-[#3de796] text-[#0f111a] px-4 rounded-xl font-black text-xs cursor-pointer hover:bg-[#5cf2aa] transition-colors flex items-center gap-1.5 border-0"
                    >
                      <Send size={12} className="transform rotate-45" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
                  <MessageSquare size={48} className="text-white/5 mb-3" />
                  <p className="text-sm font-black text-white/50 uppercase tracking-wider">No session selected</p>
                  <p className="text-xs mt-1">Select an active chat session from the list on the left to start replying</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xs font-black text-white tracking-widest uppercase mb-3">
                Deposit Payment Gateway Settings
              </h2>
              <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl">
                <form onSubmit={handleUpdatePaymentSettings} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted font-bold block mb-1.5 uppercase">Receiver UPI ID</label>
                      <input
                        type="text"
                        required
                        className="form-input py-2 px-3 text-xs bg-white/5 border border-white/10 rounded-xl w-full"
                        placeholder="e.g. pay@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={updatingSettings}
                    className="action-btn py-2.5 w-full text-xs font-black bg-[#3de796] hover:bg-[#3de796]/80 text-[#0f111a] hover:shadow-[0_0_15px_rgba(61,231,150,0.3)] cursor-pointer border-0"
                  >
                    {updatingSettings ? 'Saving Settings...' : 'Save Payment Gateway Settings'}
                  </button>
                </form>
              </div>
            </div>

            {/* Pending Deposits Review Queue */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-black text-white tracking-widest uppercase">
                  Pending Deposits Review Queue ({pendingDeposits.length})
                </h2>
                <button 
                  onClick={fetchPendingDeposits} 
                  className="bg-transparent border-0 text-text-muted hover:text-white cursor-pointer"
                  title="Refresh Deposits"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              
              <div className="bg-zinc-950/30 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                {pendingDeposits.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-xs">No pending deposits for review</div>
                ) : (
                  pendingDeposits.map((dep) => (
                    <div 
                      key={dep.id} 
                      className="flex justify-between items-center p-4 hover:bg-white/[0.01] transition-colors text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                          <span>User: {dep.phone_number}</span>
                          <span className="text-[10px] bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20 px-2 py-0.5 rounded-md font-mono select-all">
                            UTR: {dep.reference_id}
                          </span>
                        </div>
                        <div className="text-[10px] text-text-dim mt-1">
                          Submitted: {new Date(dep.created_at).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-sm font-black text-[#3de796] block">₹{parseFloat(dep.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDepositAction(dep.id, 'approve')}
                            className="bg-[#3de796] hover:bg-[#3de796]/80 text-[#0f111a] px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-0 shadow-md"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDepositAction(dep.id, 'reject')}
                            className="bg-accent-red/20 hover:bg-accent-red/35 text-accent-red border border-accent-red/30 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
