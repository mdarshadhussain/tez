'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Users, Coins, Sparkles, MessageSquare, Send, 
  Calendar, Clock, RefreshCw, UserX, Gamepad2, Search, 
  ChevronRight, Key, Edit, Award, ArrowUpRight, ArrowDownRight,
  TrendingUp, Activity, CheckCircle, XCircle, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard({ token, socket }) {
  const [adminTab, setAdminTab] = useState('overview'); // overview, games, users, support, payment
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Game Settings Control State
  const [gameSettings, setGameSettings] = useState(null);
  const [updatingGame, setUpdatingGame] = useState('');
  const [nextOutcomeInputs, setNextOutcomeInputs] = useState({});

  // Selected User Detailed Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsTab, setDetailsTab] = useState('gameplays'); // gameplays, payments, earnings, rewards
  
  // User Editor Input Fields
  const [editPassword, setEditPassword] = useState('');
  const [editVipLevel, setEditVipLevel] = useState(1);
  const [editPlayableBalance, setEditPlayableBalance] = useState(0);
  const [editCommissionBalance, setEditCommissionBalance] = useState(0);
  const [savingUser, setSavingUser] = useState(false);

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

  const chatEndRef = useRef(null);

  // Fetch Pending Deposits review list
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

  // Fetch game settings (modes + nextOutcome manual override state)
  const fetchGameSettings = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/game-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setGameSettings(data.settings);
        // Prep input fields
        const inputs = {};
        Object.keys(data.settings).forEach(game => {
          inputs[game] = data.settings[game].nextOutcome || '';
        });
        setNextOutcomeInputs(inputs);
      }
    } catch (e) {
      console.error('Error fetching game settings', e);
    }
  };

  const handleUpdateGameMode = async (game, mode) => {
    try {
      setUpdatingGame(game);
      const res = await fetch('http://localhost:3001/api/admin/game-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ game, mode })
      });
      const data = await res.json();
      if (data.success) {
        setGameSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingGame('');
    }
  };

  const handleApplyGameOutcomeOverride = async (game) => {
    const nextOutcome = nextOutcomeInputs[game];
    try {
      setUpdatingGame(game);
      const res = await fetch('http://localhost:3001/api/admin/game-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ game, nextOutcome: nextOutcome === '' ? null : nextOutcome })
      });
      const data = await res.json();
      if (data.success) {
        setGameSettings(data.settings);
        alert(`Next round override set for ${game}: ${nextOutcome || 'Cleared (Random/Algorithmic)'}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingGame('');
    }
  };

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

  // Fetch full details of a specific user
  const handleViewUserDetail = async (userObj) => {
    setSelectedUser(userObj);
    setLoadingDetails(true);
    setUserDetails(null);
    setEditPassword('');
    
    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${userObj.id}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUserDetails(data);
        setEditVipLevel(data.user.vip_level);
        setEditPlayableBalance(data.wallet ? data.wallet.playable_balance : 0);
        setEditCommissionBalance(data.wallet ? data.wallet.commission_balance : 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateUserDetails = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${selectedUser.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password: editPassword || null,
          vip_level: editVipLevel,
          playable_balance: editPlayableBalance,
          commission_balance: editCommissionBalance
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'User data saved successfully!');
        handleViewUserDetail(selectedUser); // reload info
        fetchData(); // reload stats and user directories
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating user');
    } finally {
      setSavingUser(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      fetchGameSettings();
      fetchSupportThreads();
      fetchPaymentSettings();
      fetchPendingDeposits();
    }
  }, [token]);

  // Handle Real-time Support Socket Events
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (msg) => {
      fetchSupportThreads();

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

  useEffect(() => {
    if (socket && selectedSessionId) {
      socket.emit('join_support', { sessionId: selectedSessionId });
      fetchThreadMessages(selectedSessionId);
    }
  }, [socket, selectedSessionId]);

  useEffect(() => {
    if (selectedSessionId) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThreadMessages, selectedSessionId]);

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
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => ({ ...prev, is_blocked: data.is_blocked }));
        }
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
      userId: null,
      sender: 'support',
      text: replyText
    });

    setReplyText('');
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => 
    u.phone_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(u.id).includes(searchQuery)
  );

  if (loading && !stats) {
    return <div className="p-6 text-text-muted text-xs">Loading Master Platform Console...</div>;
  }

  return (
    <div className="p-4 md:p-6 pb-24 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-br from-accent-orange/15 via-zinc-950/80 to-zinc-950 border border-accent-orange/20 p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl">
        <Shield size={44} className="text-accent-orange mx-auto mb-3 animate-pulse" />
        <span className="text-accent-orange font-extrabold text-[10px] tracking-[4px] uppercase block mb-1">
          Master System Control
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
          Casino Core Engine Board
        </h1>

        {/* Tab Selection */}
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          <button
            onClick={() => setAdminTab('overview')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-0 ${
              adminTab === 'overview'
                ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            Overview & Stats
          </button>
          
          <button
            onClick={() => {
              setAdminTab('games');
              fetchGameSettings();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
              adminTab === 'games'
                ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            <Gamepad2 size={13} />
            <span>Game Logic Resolvers</span>
          </button>

          <button
            onClick={() => setAdminTab('users')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
              adminTab === 'users'
                ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            <Users size={13} />
            <span>User Directory Logs</span>
          </button>

          <button
            onClick={() => {
              setAdminTab('support');
              fetchSupportThreads();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
              adminTab === 'support'
                ? 'bg-[#3de796] text-[#0f111a] shadow-lg shadow-[#3de796]/20'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            <MessageSquare size={13} />
            <span>Support Chat ({supportThreads.length})</span>
          </button>

          <button
            onClick={() => {
              setAdminTab('payment');
              fetchPaymentSettings();
              fetchPendingDeposits();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
              adminTab === 'payment'
                ? 'bg-[#3de796] text-[#0f111a] shadow-lg shadow-[#3de796]/20'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            <Coins size={13} />
            <span>Payment Review ({pendingDeposits.length})</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: OVERVIEW */}
        {adminTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block">Stakes Volume</span>
                    <div className="monospace-ledger text-xl font-black text-white mt-1">
                      ₹{stats.total_bets.toFixed(2)}
                    </div>
                  </div>
                  <TrendingUp className="text-accent-cyan opacity-40" size={24} />
                </div>
                <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block">Total Payouts</span>
                    <div className="monospace-ledger text-xl font-black text-white mt-1">
                      ₹{stats.total_payouts.toFixed(2)}
                    </div>
                  </div>
                  <ArrowUpRight className="text-[#3de796] opacity-40" size={24} />
                </div>
                <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block">House Gross Profit</span>
                    <div className="monospace-ledger text-xl font-black text-accent-cyan mt-1">
                      ₹{stats.house_profit.toFixed(2)}
                    </div>
                  </div>
                  <Shield className="text-accent-orange opacity-40" size={24} />
                </div>
                <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block">Registered Users</span>
                    <div className="monospace-ledger text-xl font-black text-white mt-1">
                      {stats.total_users}
                    </div>
                  </div>
                  <Users className="text-blue-500 opacity-40" size={24} />
                </div>
              </div>
            )}

            <div className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl">
              <h3 className="text-xs font-black uppercase text-white tracking-widest mb-2">System Status Metrics</h3>
              <p className="text-xs text-text-muted">
                Platform active loops: WinGo (1m), TRX block lookup simulation, Dice resolver, Keno draws, CoinFlip resolution. Overrides dynamically parsed each resolution cycle.
              </p>
            </div>
          </motion.div>
        )}

        {/* TAB 2: GAME LOGIC RESOLVERS (ALL GAMES) */}
        {adminTab === 'games' && (
          <motion.div
            key="games"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-black text-white tracking-widest uppercase">
                Active Casino Core Game Resolvers
              </h2>
              <button 
                onClick={fetchGameSettings} 
                className="bg-transparent border-0 text-text-muted hover:text-white cursor-pointer"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {gameSettings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(gameSettings).map((game) => {
                  const current = gameSettings[game];
                  return (
                    <div key={game} className="bg-zinc-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-black uppercase text-white tracking-wide block">{game}</span>
                          <span className="text-[9px] text-text-muted">Mode: {current.mode}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Activity className="text-accent-orange animate-pulse" size={12} />
                          <span className="text-[9px] font-black uppercase tracking-wider text-accent-orange">Live Loop</span>
                        </div>
                      </div>

                      {/* Mode select */}
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Behavior Mode</label>
                        <select
                          className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white w-full focus:outline-none focus:border-accent-orange"
                          value={current.mode}
                          onChange={(e) => handleUpdateGameMode(game, e.target.value)}
                          disabled={updatingGame === game}
                        >
                          <option value="algorithmic" className="bg-zinc-900 text-white">Algorithmic (15% Profit Pool)</option>
                          <option value="greedy" className="bg-zinc-900 text-white">Greedy Mode (Minimize Liability)</option>
                          <option value="high_payout" className="bg-zinc-900 text-white">High Payout (Maximize/RTP Boost)</option>
                          <option value="random" className="bg-zinc-900 text-white">Pure Mathematics (Random Roll)</option>
                        </select>
                      </div>

                      {/* Manual Next outcome Override */}
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Next Outcome Override</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={
                              game === 'wingo' || game === 'trx' ? 'e.g. red, green, or number 0-9' :
                              game === 'roulette' ? 'e.g. red, black, or gold' :
                              game === 'coinflip' ? 'e.g. heads or tails' :
                              game === 'dice' ? 'e.g. roll float 45.20' :
                              game === 'limbo' || game === 'crash' ? 'e.g. multiplier 15.50' :
                              game === 'keno' ? 'e.g. numbers 1,2,3,4,5,6,7,8,9,10' :
                              'outcome value'
                            }
                            className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-text-dim flex-1 focus:outline-none"
                            value={nextOutcomeInputs[game] || ''}
                            onChange={(e) => setNextOutcomeInputs(prev => ({ ...prev, [game]: e.target.value }))}
                          />
                          <button
                            onClick={() => handleApplyGameOutcomeOverride(game)}
                            disabled={updatingGame === game}
                            className="bg-accent-orange hover:bg-accent-orange/80 text-white font-bold px-4 rounded-xl text-xs cursor-pointer border-0"
                          >
                            Apply
                          </button>
                        </div>
                        {current.nextOutcome && (
                          <span className="text-[9px] text-[#3de796] mt-1 block">
                            Queued override: {String(current.nextOutcome)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-6 text-text-muted text-xs">Loading game parameters...</div>
            )}
          </motion.div>
        )}

        {/* TAB 3: USER DIRECTORY LOGS */}
        {adminTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xs font-black text-white tracking-widest uppercase">
                Registered Platform Accounts Directory ({users.length})
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input
                  type="text"
                  placeholder="Search by ID or Phone Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950/40 border border-white/5 py-2 pl-10 pr-4 rounded-xl text-xs placeholder-text-muted focus:outline-none focus:border-accent-orange"
                />
              </div>
            </div>

            <div className="bg-zinc-950/30 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-text-muted text-xs">No matching users found</div>
              ) : (
                filteredUsers.map((u, idx) => (
                  <div
                    key={u.id || idx}
                    onClick={() => handleViewUserDetail(u)}
                    className="flex justify-between items-center p-4 hover:bg-white/[0.02] cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-[10px] text-text-muted font-bold">
                        {u.id}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{u.phone_number}</span>
                          {u.is_blocked === 1 && (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                              Blocked
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-text-dim mt-0.5">
                          Registered: {new Date(u.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="monospace-ledger font-extrabold text-accent-cyan">
                          ₹{parseFloat(u.lifetime_turnover).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-text-dim mt-0.5">Turnover</div>
                      </div>
                      <ChevronRight size={16} className="text-text-muted" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: SUPPORT SESSIONS */}
        {adminTab === 'support' && (
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
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Columns: Thread history and messaging */}
            <div className="bg-zinc-950/40 border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full col-span-2">
              {selectedSessionId ? (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-white/5 bg-white/[0.01]">
                    <span className="text-xs font-black text-white uppercase tracking-wider block">Session Room</span>
                    <span className="text-[9px] text-[#3de796] font-mono select-all block mt-0.5">{selectedSessionId}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none bg-[#0c0d14]/40">
                    {selectedThreadMessages.map((m, idx) => {
                      const isSupport = m.sender === 'support';
                      return (
                        <div key={idx} className={`flex ${isSupport ? 'justify-end' : 'justify-start'} items-end gap-2`}>
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
                  <p className="text-xs font-black text-white/50 uppercase tracking-wider">No session selected</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 5: PAYMENT REVIEW QUEUE */}
        {adminTab === 'payment' && (
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
                  <div>
                    <label className="text-[10px] text-text-muted font-bold block mb-1.5 uppercase">Receiver UPI ID</label>
                    <input
                      type="text"
                      required
                      className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white w-full focus:outline-none focus:border-accent-orange"
                      placeholder="e.g. pay@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={updatingSettings}
                    className="py-2.5 w-full text-xs font-black bg-[#3de796] hover:bg-[#3de796]/80 text-[#0f111a] rounded-xl cursor-pointer border-0"
                  >
                    {updatingSettings ? 'Saving Settings...' : 'Save Payment Gateway Settings'}
                  </button>
                </form>
              </div>
            </div>

            {/* Pending Deposits Queue */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-black text-white tracking-widest uppercase">
                  Pending Deposits Review Queue ({pendingDeposits.length})
                </h2>
                <button 
                  onClick={fetchPendingDeposits} 
                  className="bg-transparent border-0 text-text-muted hover:text-white cursor-pointer"
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
                          <span className="text-sm font-black text-[#3de796] block font-mono">₹{parseFloat(dep.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDepositAction(dep.id, 'approve')}
                            className="bg-[#3de796] hover:bg-[#3de796]/80 text-[#0f111a] px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-0"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDepositAction(dep.id, 'reject')}
                            className="bg-accent-red/20 hover:bg-accent-red/35 text-accent-red border border-accent-red/30 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all"
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

      {/* SELECTED USER DETAIL DRAWER / SLIDE-IN MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex justify-end select-none">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />
            
            {/* Detail Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl h-full bg-[#0d0f17] border-l border-white/5 flex flex-col z-10 shadow-2xl overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-zinc-950/40 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield size={16} className="text-accent-orange" />
                    <span>User Account Registry</span>
                  </h3>
                  <span className="text-[10px] text-text-muted font-mono block mt-1">ID: {selectedUser.id} | Phone: {selectedUser.phone_number}</span>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="bg-white/5 hover:bg-white/10 border-0 p-2 rounded-xl text-text-muted hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Loader */}
              {loadingDetails ? (
                <div className="flex-1 flex flex-col justify-center items-center text-text-muted">
                  <RefreshCw className="animate-spin text-accent-orange mb-2" size={24} />
                  <span className="text-xs uppercase font-black tracking-widest">Loading Logs & Tree...</span>
                </div>
              ) : userDetails ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Account Editor Pane */}
                  <div className="p-6 border-b border-white/5 bg-zinc-950/20 shrink-0 space-y-4">
                    <form onSubmit={handleUpdateUserDetails} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] text-text-muted font-bold block uppercase mb-1">Set Password (plain hash)</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                            <input
                              type="text"
                              placeholder="Reset user password..."
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-text-dim focus:outline-none focus:border-accent-orange"
                            />
                          </div>
                          <span className="text-[8px] text-text-dim block mt-0.5 truncate max-w-full">
                            Current hash: <code className="text-accent-cyan font-mono">{userDetails.user.password_hash}</code>
                          </span>
                        </div>

                        <div>
                          <label className="text-[9px] text-text-muted font-bold block uppercase mb-1">VIP Ranking Level</label>
                          <div className="relative">
                            <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                            <select
                              value={editVipLevel}
                              onChange={(e) => setEditVipLevel(parseInt(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-accent-orange"
                            >
                              {[1,2,3,4,5,6,7,8,9,10].map(v => (
                                <option key={v} value={v} className="bg-zinc-900 text-white">VIP Level {v}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] text-text-muted font-bold block uppercase mb-1">Playable Credits Balance (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editPlayableBalance}
                            onChange={(e) => setEditPlayableBalance(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-accent-orange font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-text-muted font-bold block uppercase mb-1">Affiliate Commission (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editCommissionBalance}
                            onChange={(e) => setEditCommissionBalance(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-accent-orange font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => toggleBlock(selectedUser.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border ${
                            selectedUser.is_blocked
                              ? 'bg-accent-red/20 text-accent-red border-accent-red/30'
                              : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {selectedUser.is_blocked ? 'Unblock User' : 'Block User'}
                        </button>
                        <button
                          type="submit"
                          disabled={savingUser}
                          className="bg-accent-orange hover:bg-accent-orange/80 text-white font-black px-6 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0"
                        >
                          {savingUser ? 'Saving System Changes...' : 'Save System Controls'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* detailed histories selectors */}
                  <div className="bg-zinc-950/40 border-b border-white/5 shrink-0 flex">
                    {[
                      { id: 'gameplays', label: 'Game Plays Tree' },
                      { id: 'payments', label: 'Payment Logs' },
                      { id: 'earnings', label: 'Affiliate Commissions' },
                      { id: 'rewards', label: 'Reward Logs' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setDetailsTab(tab.id)}
                        className={`flex-1 py-3.5 text-center text-[10px] font-black uppercase tracking-wider cursor-pointer border-0 border-b-2 transition-all ${
                          detailsTab === tab.id 
                            ? 'border-accent-orange text-white bg-white/[0.01]' 
                            : 'border-transparent text-text-muted hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* logs detail body */}
                  <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
                    
                    {/* 1. GAME PLAYS TREE */}
                    {detailsTab === 'gameplays' && (
                      <div className="space-y-3">
                        {userDetails.gamePlays.length === 0 ? (
                          <div className="text-center py-12 text-text-muted text-xs">No game plays found for this user</div>
                        ) : (
                          userDetails.gamePlays.map((gp) => {
                            const isWin = gp.is_won === 1;
                            const selection = JSON.parse(gp.raw_selection || '{}');
                            return (
                              <div key={gp.id} className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center text-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-white uppercase tracking-wide">{gp.game}</span>
                                    <span className="text-[10px] text-text-muted font-mono">{gp.game_round_id}</span>
                                  </div>
                                  <div className="text-[10px] text-text-dim mt-1 space-y-0.5">
                                    <div>Selection: <code className="text-accent-cyan font-bold select-all">{gp.raw_selection ? JSON.stringify(selection) : 'None'}</code></div>
                                    <div>Timestamp: {new Date(gp.created_at).toLocaleString('en-IN')}</div>
                                  </div>
                                </div>

                                <div className="text-right flex items-center gap-4">
                                  <div>
                                    <span className="text-[10px] text-text-dim block">Staked: ₹{gp.bet_amount.toFixed(2)}</span>
                                    <span className="text-[10px] text-text-dim block mt-0.5">Payout: {gp.payout_multiplier}x</span>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`text-xs font-black font-mono block ${isWin ? 'text-[#3de796]' : 'text-accent-red'}`}>
                                      {isWin ? `+₹${gp.payout_amount.toFixed(2)}` : `-₹${gp.bet_amount.toFixed(2)}`}
                                    </span>
                                    <span className={`text-[8px] uppercase tracking-wider font-bold rounded px-1 ${
                                      isWin ? 'bg-[#3de796]/10 text-[#3de796] border border-[#3de796]/20' : 'bg-accent-red/10 text-accent-red border border-accent-red/25'
                                    }`}>
                                      {isWin ? 'Win' : 'Loss'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* 2. PAYMENTS (DEPOSITS & WITHDRAWALS) */}
                    {detailsTab === 'payments' && (
                      <div className="space-y-3">
                        {userDetails.payments.length === 0 ? (
                          <div className="text-center py-12 text-text-muted text-xs">No deposit/withdrawal logs found</div>
                        ) : (
                          userDetails.payments.map((p) => {
                            const isDeposit = p.type === 'deposit';
                            return (
                              <div key={p.id} className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center text-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                      isDeposit ? 'bg-[#3de796]/10 text-[#3de796] border border-[#3de796]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                      {p.type}
                                    </span>
                                    <span className="text-[10px] text-text-muted font-mono">UTR: {p.reference_id}</span>
                                  </div>
                                  <span className="text-[9px] text-text-dim block mt-2">
                                    Date: {new Date(p.created_at).toLocaleString('en-IN')}
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="text-sm font-black font-mono text-white block">₹{p.amount.toFixed(2)}</span>
                                  <span className={`text-[9px] font-bold block mt-1 uppercase ${
                                    p.status === 'completed' ? 'text-[#3de796]' : p.status === 'pending' ? 'text-accent-orange' : 'text-accent-red'
                                  }`}>
                                    {p.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* 3. AFFILIATE EARNINGS (COMMISSIONS) */}
                    {detailsTab === 'earnings' && (
                      <div className="space-y-3">
                        {userDetails.earnings.length === 0 ? (
                          <div className="text-center py-12 text-text-muted text-xs">No affiliate earnings found</div>
                        ) : (
                          userDetails.earnings.map((e) => (
                            <div key={e.id} className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center text-xs">
                              <div>
                                <span className="text-[10px] text-text-muted font-mono block">Reference: {e.reference_id}</span>
                                <span className="text-[9px] text-text-dim block mt-1">
                                  Payout: {new Date(e.created_at).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black font-mono text-[#3de796] block">+₹{e.amount.toFixed(2)}</span>
                                <span className="text-[9px] text-text-muted font-bold block mt-1 uppercase">Credited</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* 4. REWARDS (VIP TOURNAMENTS & SIGNUPS) */}
                    {detailsTab === 'rewards' && (
                      <div className="space-y-3">
                        {userDetails.rewards.length === 0 ? (
                          <div className="text-center py-12 text-text-muted text-xs">No VIP reward logs found</div>
                        ) : (
                          userDetails.rewards.map((r) => (
                            <div key={r.id} className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-white block uppercase">{r.reference_id || 'System Reward'}</span>
                                <span className="text-[9px] text-text-dim block mt-1">
                                  Awarded: {new Date(r.created_at).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black font-mono text-[#3de796] block">+₹{r.amount.toFixed(2)}</span>
                                <span className="text-[9px] text-text-muted font-bold block mt-1 uppercase">Completed</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="flex-1 flex justify-center items-center text-text-muted text-xs">
                  Error parsing logs
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
