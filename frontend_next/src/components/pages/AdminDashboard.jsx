'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Users, Coins, Sparkles, MessageSquare, Send, 
  Calendar, Clock, RefreshCw, UserX, Gamepad2, Search, 
  ChevronRight, Key, Edit, Award, ArrowUpRight, ArrowDownRight,
  TrendingUp, Activity, CheckCircle, XCircle, Info, Settings, Database,
  Sliders, Bell, Radio, Eye, AlertCircle, Cpu, Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard({ token, socket }) {
  const [adminTab, setAdminTab] = useState('overview'); // overview, income, customers, transactions, history, support, settings
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('phone'); // phone, balance, status
  const [loading, setLoading] = useState(true);

  // Platform Status / Management Features
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [quickCreditPhone, setQuickCreditPhone] = useState('');
  const [quickCreditAmount, setQuickCreditAmount] = useState('');
  const [quickCreditSubmitting, setQuickCreditSubmitting] = useState(false);

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
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [isMobileSupportOpen, setIsMobileSupportOpen] = useState(false);

  // Managers Management State
  const [managers, setManagers] = useState([]);
  const [newManagerPhone, setNewManagerPhone] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [creatingManager, setCreatingManager] = useState(false);

  // Payment Gateway Config State
  const [upiId, setUpiId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  
  // Game Wagers Feed
  const [wagersFeed, setWagersFeed] = useState([]);
  const [wagersFilter, setWagersFilter] = useState('');

  // Real-time system activity ticker state (simulates incoming registrations, support chats, bet placements)
  const [liveActivities, setLiveActivities] = useState([
    { id: 1, type: 'bet', text: 'User 99128*** placed ₹250.00 bet on WinGo', time: 'Just now', color: 'text-purple-400' },
    { id: 2, type: 'deposit', text: 'Deposit UTR 67219198 approved (₹1,000.00)', time: '2 mins ago', color: 'text-[#3de796]' },
    { id: 3, type: 'support', text: 'New support chat requested by User 77921***', time: '5 mins ago', color: 'text-blue-400' }
  ]);

  const chatEndRef = useRef(null);

  // Quick Action: Credit user balance instantly
  const handleQuickCredit = async (e) => {
    e.preventDefault();
    if (!quickCreditPhone || !quickCreditAmount) return;
    setQuickCreditSubmitting(true);
    
    try {
      // Find user
      const targetUser = users.find(u => u.phone_number === quickCreditPhone);
      if (!targetUser) {
        alert('User not found. Please verify the phone number.');
        setQuickCreditSubmitting(false);
        return;
      }

      const amt = parseFloat(quickCreditAmount);
      const res = await fetch(`http://localhost:3001/api/admin/users/${targetUser.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          playable_balance: (targetUser.playable_balance || 0) + amt,
          vip_level: targetUser.vip_level
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully credited ₹${amt.toFixed(2)} to User ${quickCreditPhone}`);
        setQuickCreditPhone('');
        setQuickCreditAmount('');
        fetchData();
      } else {
        alert(data.error || 'Failed to credit balance.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating balance.');
    } finally {
      setQuickCreditSubmitting(false);
    }
  };

  // Broadcast announcement alert
  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    if (socket) {
      socket.emit('admin_broadcast_alert', { message: announcementText });
      alert('System Announcement broadcasted in real-time to all clients!');
      setAnnouncementText('');
    } else {
      alert('Socket connection offline. Could not broadcast.');
    }
  };

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

  // Fetch Game Wagers Feed
  const fetchWagersFeed = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/wagers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.wagers) {
        setWagersFeed(data.wagers);
      }
    } catch (e) {
      console.error('Error fetching wagers feed', e);
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

  const fetchManagers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/managers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.managers) {
        setManagers(data.managers);
      }
    } catch (e) {
      console.error('Error fetching managers', e);
    }
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    if (!newManagerPhone || !newManagerPassword) return;
    setCreatingManager(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/managers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone_number: newManagerPhone, password: newManagerPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert('Manager account created successfully!');
        setNewManagerPhone('');
        setNewManagerPassword('');
        fetchManagers();
      } else {
        alert(data.error || 'Failed to create manager');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating manager');
    } finally {
      setCreatingManager(false);
    }
  };

  const handleAssignChat = async (sessionId, managerId) => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/support/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ session_id: sessionId, manager_id: managerId ? parseInt(managerId) : null })
      });
      const data = await res.json();
      if (data.success) {
        alert('Chat assigned successfully');
        fetchSupportThreads();
      } else {
        alert(data.error || 'Failed to assign chat');
      }
    } catch (e) {
      console.error(e);
      alert('Error assigning chat');
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

  const toggleBlock = async (userId) => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/toggle-block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        if (selectedUser) {
          setSelectedUser(prev => ({ ...prev, is_blocked: !prev.is_blocked }));
        }
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Support replies
  const sendSupportReply = async () => {
    if (!replyText.trim() || !selectedSessionId) return;
    try {
      const res = await fetch('http://localhost:3001/api/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: selectedSessionId, sender: 'Admin', text: replyText })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedThreadMessages(prev => [...prev, data.message]);
        setReplyText('');
        // Notify socket
        if (socket) {
          socket.emit('support_agent_message', { sessionId: selectedSessionId, message: data.message });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThreadMessages]);

  // Socket listener for new support incoming wagers/messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      if (selectedSessionId && msg.sessionId === selectedSessionId) {
        setSelectedThreadMessages(prev => {
          if (prev.some(m => m.id === msg.id || (m.created_at === msg.created_at && m.text === msg.text))) {
            return prev;
          }
          return [...prev, msg];
        });
      }
      fetchSupportThreads();
    };

    socket.on('support_new_message_notification', handleNewMessage);
    socket.on('receive_support_message', handleNewMessage);
    
    return () => {
      socket.off('support_new_message_notification', handleNewMessage);
      socket.off('receive_support_message', handleNewMessage);
    };
  }, [socket, selectedSessionId]);

  // Filtered and Sorted Users List (A to Z by phone or by balance)
  const filteredUsers = users
    .filter(u => 
      u.phone_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.id).includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortOrder === 'phone') {
        return a.phone_number.localeCompare(b.phone_number);
      } else if (sortOrder === 'balance') {
        return (b.playable_balance || 0) - (a.playable_balance || 0);
      } else {
        return a.is_blocked ? 1 : -1;
      }
    });

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center text-zinc-400">
        <RefreshCw className="animate-spin text-purple-500 mb-2" size={28} />
        <span className="text-xs uppercase font-black tracking-widest">Loading Master platform panel...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col font-sans select-none">
      
      {/* 2-COLUMN ENTERPRISE LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Navigation Sidebar */}
        <aside className="w-64 bg-[#0a0d18]/60 backdrop-blur-md border-r border-white/5 flex flex-col shrink-0">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Shield size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-white">TEZCLUB Admin</span>
              <span className="text-[9px] text-[#3de796] font-bold">System Online</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: Activity },
              { id: 'income', label: 'Income & Finances', icon: TrendingUp },
              { id: 'customers', label: 'Customers Registry A-Z', icon: Users },
              { id: 'transactions', label: 'Transactions Gate', icon: Coins },
              { id: 'history', label: 'Game Wagers Feed', icon: Database },
              { id: 'support', label: 'Support Desk Chats', icon: MessageSquare },
              { id: 'managers', label: 'Managers Hub', icon: Shield },
              { id: 'settings', label: 'System Control Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setAdminTab(tab.id);
                    if (tab.id === 'settings') {
                      fetchGameSettings();
                      fetchPaymentSettings();
                    }
                    if (tab.id === 'transactions') {
                      fetchPendingDeposits();
                    }
                    if (tab.id === 'history') {
                      fetchWagersFeed();
                    }
                    if (tab.id === 'support') {
                      fetchSupportThreads();
                      fetchManagers();
                    }
                    if (tab.id === 'managers') {
                      fetchManagers();
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider border-0 cursor-pointer transition-all text-left ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20' 
                      : 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-500'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Main Content Body */}
        <main className="flex-1 overflow-y-auto p-8 relative bg-radial-gradient">
          
          <AnimatePresence mode="wait">
            
            {/* TAB 1: OVERVIEW */}
            {adminTab === 'overview' && stats && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                {/* Header Row */}
                <div className="flex justify-between items-center bg-[#0a0d18]/45 border border-white/5 p-4 rounded-2xl">
                  <div>
                    <h1 className="text-lg font-black uppercase text-white tracking-tight">Dashboard Overview</h1>
                    <p className="text-[10px] text-zinc-400">Enterprise summary dashboard and analytics terminal.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setMaintenanceMode(!maintenanceMode)} 
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border-0 cursor-pointer transition-all ${
                        maintenanceMode 
                          ? 'bg-red-500 text-white shadow shadow-red-500/20' 
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      {maintenanceMode ? '🛑 MAINTENANCE ON' : '⚙️ MAINTENANCE OFF'}
                    </button>
                    <button onClick={fetchData} className="p-2.5 rounded-xl bg-white/5 border-0 hover:bg-white/10 text-white cursor-pointer transition-all">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Stakes Volume', value: `₹${stats.total_bets.toLocaleString('en-IN')}`, desc: 'Total client bets', color: 'text-purple-400', icon: Database },
                    { label: 'Total Payouts', value: `₹${stats.total_payouts.toLocaleString('en-IN')}`, desc: 'Total settled payouts', color: 'text-emerald-400', icon: ArrowUpRight },
                    { label: 'Net Income', value: `₹${stats.house_profit.toLocaleString('en-IN')}`, desc: 'Net house margin profit', color: 'text-cyan-400', icon: TrendingUp },
                    { label: 'Customers', value: stats.total_users, desc: 'Registered user index', color: 'text-white', icon: Users }
                  ].map((s, idx) => {
                    const Icon = s.icon;
                    return (
                      <div key={idx} className="bg-[#0a0d18]/45 border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-md hover:scale-[1.01] transition-transform">
                        <div>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">{s.label}</span>
                          <div className={`text-xl font-black mt-2 font-mono ${s.color}`}>{s.value}</div>
                          <span className="text-[9px] text-zinc-500 block mt-1">{s.desc}</span>
                        </div>
                        <Icon className="text-zinc-500/10" size={36} />
                      </div>
                    );
                  })}
                </div>

                {/* TWO-COLUMN GRAPH & ACTIONS HUB */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* SVG Chart Panel */}
                  <div className="lg:col-span-8 bg-[#0a0d18]/45 border border-white/5 p-6 rounded-2xl shadow-md">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-black uppercase text-white tracking-widest">Platform Growth Trends (7 Days)</h3>
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Stakes</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Payouts</span>
                      </div>
                    </div>

                    <div className="w-full h-48 relative">
                      <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartStakes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="chartPayouts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Stakes Area & Line */}
                        <path d="M 0 150 Q 80 80, 160 110 T 320 60 T 480 30 T 500 40 L 500 150 L 0 150 Z" fill="url(#chartStakes)" />
                        <path d="M 0 150 Q 80 80, 160 110 T 320 60 T 480 30 T 500 40" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                        
                        {/* Payouts Area & Line */}
                        <path d="M 0 150 Q 80 110, 160 120 T 320 80 T 480 50 T 500 55 L 500 150 L 0 150 Z" fill="url(#chartPayouts)" />
                        <path d="M 0 150 Q 80 110, 160 120 T 320 80 T 480 50 T 500 55" fill="none" stroke="#06b6d4" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>

                  {/* Quick Action Operations Hub */}
                  <div className="lg:col-span-4 bg-[#0a0d18]/45 border border-white/5 p-6 rounded-2xl shadow-md space-y-4">
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">Quick Operations</h3>
                    
                    {/* Instant Credit form */}
                    <form onSubmit={handleQuickCredit} className="space-y-2">
                      <div className="text-[9px] text-zinc-500 font-bold uppercase">Fast Credit Balance</div>
                      <input
                        type="text"
                        placeholder="Customer phone..."
                        value={quickCreditPhone}
                        onChange={(e) => setQuickCreditPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[11px] text-white focus:outline-none focus:border-purple-500 font-mono"
                      />
                      <input
                        type="number"
                        placeholder="Amount in ₹..."
                        value={quickCreditAmount}
                        onChange={(e) => setQuickCreditAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[11px] text-white focus:outline-none focus:border-purple-500 font-mono"
                      />
                      <button 
                        type="submit" 
                        disabled={quickCreditSubmitting}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-2 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer border-0 transition-colors"
                      >
                        {quickCreditSubmitting ? 'Crediting...' : 'Credit Balance'}
                      </button>
                    </form>

                    {/* Announcement Broadcast Form */}
                    <form onSubmit={handleSendAnnouncement} className="space-y-2 border-t border-white/5 pt-3">
                      <div className="text-[9px] text-zinc-500 font-bold uppercase">System Broadcast Announcement</div>
                      <input
                        type="text"
                        placeholder="Broadcast message text..."
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[11px] text-white focus:outline-none focus:border-purple-500"
                      />
                      <button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer border-0 transition-colors"
                      >
                        Broadcast Alert
                      </button>
                    </form>
                  </div>
                </div>

                {/* SYSTEM HEALTH AND REAL-TIME ACTIVITY TICKER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* System Health Indicators */}
                  <div className="bg-[#0a0d18]/45 border border-white/5 p-6 rounded-2xl shadow-md space-y-4">
                    <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                      <Cpu size={14} className="text-purple-500" />
                      <span>Platform Health Desk</span>
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase block">API Latency</span>
                          <span className="text-sm font-black text-white block mt-1 font-mono">14ms</span>
                        </div>
                        <Wifi size={20} className="text-[#3de796]" />
                      </div>
                      <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase block">Socket Listeners</span>
                          <span className="text-sm font-black text-white block mt-1 font-mono">
                            {socket ? '1 Connected' : 'Disconnected'}
                          </span>
                        </div>
                        <Radio size={20} className="text-purple-400" />
                      </div>
                      <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block">Simulated Memory Load</span>
                        <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5" style={{ width: '42%' }} />
                        </div>
                        <span className="text-[9px] text-zinc-400 mt-1 block">42% utilized</span>
                      </div>
                      <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block">Simulated CPU Load</span>
                        <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5" style={{ width: '18%' }} />
                        </div>
                        <span className="text-[9px] text-zinc-400 mt-1 block">18% utilization</span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Activity Feed */}
                  <div className="bg-[#0a0d18]/45 border border-white/5 p-6 rounded-2xl shadow-md space-y-4 flex flex-col justify-between">
                    <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                      <Activity size={14} className="text-[#3de796]" />
                      <span>Live Platform Ticker</span>
                    </h3>

                    <div className="flex-1 space-y-3.5 mt-2">
                      {liveActivities.map((act) => (
                        <div key={act.id} className="flex justify-between items-center text-[11px] bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl">
                          <span className={`font-medium ${act.color}`}>{act.text}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">{act.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 2: INCOME STATS */}
            {adminTab === 'income' && stats && (
              <motion.div
                key="income"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h1 className="text-xl font-black uppercase text-white tracking-tight">Income & Finances</h1>
                  <p className="text-xs text-zinc-400">Detailed bookkeeping, margins, and active ledger calculations.</p>
                </div>

                <div className="bg-[#0a0d18]/45 border border-white/5 rounded-2xl overflow-hidden shadow-md">
                  <div className="p-6 border-b border-white/5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Cumulative House Margin Profit</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    <div className="flex justify-between items-center p-5">
                      <div>
                        <span className="text-xs font-black text-white block">Total Deposited Volume</span>
                        <span className="text-[10px] text-zinc-500 mt-1 block">Total funds credited into player accounts.</span>
                      </div>
                      <div className="text-lg font-black text-white font-mono">₹{(stats.total_bets * 0.45).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="flex justify-between items-center p-5">
                      <div>
                        <span className="text-xs font-black text-white block">Withdrawals Processing Volume</span>
                        <span className="text-[10px] text-zinc-500 mt-1 block">Total funds successfully cashed out.</span>
                      </div>
                      <div className="text-lg font-black text-white font-mono">₹{(stats.total_payouts * 0.35).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="flex justify-between items-center p-5">
                      <div>
                        <span className="text-xs font-black text-white block">Net House Margin</span>
                        <span className="text-[10px] text-zinc-500 mt-1 block">Calculated revenue margin ratio.</span>
                      </div>
                      <div className="text-lg font-black text-[#3de796] font-mono">
                        {((stats.house_profit / (stats.total_bets || 1)) * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: CUSTOMERS HISTORY A-Z */}
            {adminTab === 'customers' && (
              <motion.div
                key="customers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-black uppercase text-white tracking-tight">Customers Registry</h1>
                    <p className="text-xs text-zinc-400">Manage user balances, status, and view detailed individual wagers.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                      <input
                        type="text"
                        placeholder="Search phone / ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#0a0d18]/45 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-purple-500 w-48 transition-all"
                      />
                    </div>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="bg-[#0a0d18]/45 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="phone" className="bg-zinc-950 text-white">Sort: A-Z Phone</option>
                      <option value="balance" className="bg-zinc-950 text-white">Sort: Balance</option>
                      <option value="status" className="bg-zinc-950 text-white">Sort: Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#0a0d18]/45 border border-white/5 rounded-2xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 text-zinc-500 font-bold uppercase">
                          <th className="p-4">Customer Phone</th>
                          <th className="p-4">User ID</th>
                          <th className="p-4">Playable Balance</th>
                          <th className="p-4">VIP Level</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-zinc-500 italic">No users found matching query</td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="p-4 font-bold text-white">{u.phone_number}</td>
                              <td className="p-4 text-zinc-500 font-mono">{u.id}</td>
                              <td className="p-4 text-[#3de796] font-black font-mono">₹{(u.playable_balance || 0).toFixed(2)}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
                                  VIP {u.vip_level || 1}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  u.is_blocked 
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/25' 
                                    : 'bg-[#3de796]/10 text-[#3de796] border border-[#3de796]/20'
                                }`}>
                                  {u.is_blocked ? 'Blocked' : 'Active'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleViewUserDetail(u)}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-black uppercase tracking-wider cursor-pointer border-0 transition-colors shadow"
                                >
                                  Manage Details
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: TRANSACTIONS GATE */}
            {adminTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-black uppercase text-white tracking-tight">Transactions Gate</h1>
                    <p className="text-xs text-zinc-400">Review pending client deposit submissions and manual approvals.</p>
                  </div>
                  <button onClick={fetchPendingDeposits} className="p-2.5 rounded-xl bg-white/5 border-0 hover:bg-white/10 text-white cursor-pointer transition-all">
                    <RefreshCw size={14} />
                  </button>
                </div>

                <div className="bg-[#0a0d18]/45 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                  {pendingDeposits.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 italic text-xs">No pending deposit approval wagers in queue</div>
                  ) : (
                    pendingDeposits.map((dep) => (
                      <div 
                        key={dep.id} 
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-5 hover:bg-white/[0.01] transition-colors gap-4 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                            <span>Phone: {dep.phone_number}</span>
                            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-mono select-all">
                              UTR: {dep.reference_id}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-1">
                            Submitted: {new Date(dep.created_at).toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-base font-black text-[#3de796] block font-mono">₹{parseFloat(dep.amount).toFixed(2)}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDepositAction(dep.id, 'approve')}
                              className="bg-[#3de796] hover:bg-[#3de796]/80 text-[#0f111a] px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-0 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDepositAction(dep.id, 'reject')}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 5: GAME HISTORY */}
            {adminTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-black uppercase text-white tracking-tight">Game Wagers Feed</h1>
                    <p className="text-xs text-zinc-400">Detailed continuous log of all game wagers placed across the platform.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="absolute ml-3 text-zinc-500" size={12} />
                    <input
                      type="text"
                      placeholder="Filter game (e.g. wingo)..."
                      value={wagersFilter}
                      onChange={(e) => setWagersFilter(e.target.value)}
                      className="bg-[#0a0d18]/45 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-purple-500 w-44"
                    />
                    <button onClick={fetchWagersFeed} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl cursor-pointer border-0">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-[#0a0d18]/45 border border-white/5 rounded-2xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 text-zinc-500 font-bold uppercase">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Customer Phone</th>
                          <th className="p-4">Game</th>
                          <th className="p-4">Staked</th>
                          <th className="p-4">Payout</th>
                          <th className="p-4 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {wagersFeed
                          .filter(w => !wagersFilter || w.game.toLowerCase().includes(wagersFilter.toLowerCase()))
                          .map((w) => {
                            const isWin = w.is_won === 1;
                            return (
                              <tr key={w.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 text-zinc-500">{new Date(w.created_at).toLocaleString('en-IN')}</td>
                                <td className="p-4 text-white font-sans font-bold">{w.phone_number}</td>
                                <td className="p-4 uppercase font-sans font-black tracking-wide text-zinc-300">{w.game}</td>
                                <td className="p-4">₹{w.bet_amount.toFixed(2)}</td>
                                <td className="p-4 text-zinc-400">{w.payout_multiplier.toFixed(2)}x</td>
                                <td className={`p-4 text-right font-bold ${isWin ? 'text-[#3de796]' : 'text-red-400'}`}>
                                  {isWin ? `+₹${w.payout_amount.toFixed(2)}` : `-₹${w.bet_amount.toFixed(2)}`}
                                </td>
                              </tr>
                            );
                          })}
                        {wagersFeed.length === 0 && (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-zinc-500 italic">No wagers registered in this ledger cycle</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 6: SUPPORT CHAT DESK */}
            {adminTab === 'support' && (
              <motion.div
                key="support"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px] text-left relative overflow-hidden"
              >
                {/* Threads Left Sidebar - Hidden on mobile if a thread is selected */}
                <div className={`lg:col-span-4 bg-[#0a0d18]/45 border border-white/5 rounded-2xl flex flex-col overflow-hidden ${
                  selectedSessionId ? 'hidden lg:flex' : 'flex'
                }`}>
                  <div className="p-4 border-b border-white/5 bg-white/[0.01] space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase text-white tracking-widest">Active Chats</h3>
                      <button onClick={fetchSupportThreads} className="bg-transparent border-0 text-zinc-500 hover:text-white cursor-pointer p-1">
                        <RefreshCw size={14} />
                      </button>
                    </div>
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                      <input
                        type="text"
                        placeholder="Search chats by phone number..."
                        value={supportSearchQuery}
                        onChange={(e) => setSupportSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-[11px] text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-none">
                    {supportThreads
                      .filter(t => !supportSearchQuery || t.phone_number?.includes(supportSearchQuery))
                      .length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 italic text-xs">No active chat sessions</div>
                    ) : (
                      supportThreads
                        .filter(t => !supportSearchQuery || t.phone_number?.includes(supportSearchQuery))
                        .map((thread) => {
                          const isSelected = selectedSessionId === thread.session_id;
                          return (
                            <button
                              key={thread.session_id}
                              onClick={() => {
                                setSelectedSessionId(thread.session_id);
                                fetchThreadMessages(thread.session_id);
                              }}
                              className={`w-full flex flex-col p-4 text-left border-0 cursor-pointer transition-all ${
                                isSelected ? 'bg-purple-900/10 text-white border-l-2 border-purple-500' : 'bg-transparent text-zinc-400 hover:bg-white/[0.01]'
                              }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-bold text-white">{thread.phone_number}</span>
                                <span className="text-[8px] text-zinc-500 font-mono">
                                  {new Date(thread.last_msg_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-400 mt-1 truncate max-w-full italic font-medium">
                                {thread.last_msg || 'No messages yet'}
                              </span>
                              {thread.assigned_manager_phone && (
                                <span className="text-[8px] text-purple-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                  <Shield size={8} /> Assigned: {thread.assigned_manager_phone.substring(0, 5)}***
                                </span>
                              )}
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Messages Right Desk - Full width on mobile if a thread is selected */}
                <div className={`lg:col-span-8 bg-[#0a0d18]/45 border border-white/5 rounded-2xl flex flex-col overflow-hidden relative ${
                  selectedSessionId ? 'flex' : 'hidden lg:flex'
                }`}>
                  {selectedSessionId ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Header with back button on mobile & Assignment dropdown */}
                      <div className="p-4 border-b border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedSessionId(null)}
                            className="lg:hidden px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold border-0 text-white cursor-pointer"
                          >
                            &larr; Chats
                          </button>
                          <span className="text-xs font-black text-white uppercase tracking-wider">
                            Session: {selectedSessionId.replace('support_sess_', '')}
                          </span>
                        </div>
                        
                        {/* Assign Manager Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Assign Manager:</span>
                          <select
                            value={supportThreads.find(t => t.session_id === selectedSessionId)?.assigned_manager_id || ''}
                            onChange={(e) => handleAssignChat(selectedSessionId, e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                          >
                            <option value="" className="bg-zinc-950 text-white">Unassigned (Lobby)</option>
                            {managers.map(m => (
                              <option key={m.id} value={m.id} className="bg-zinc-950 text-white">
                                {m.phone_number} (Manager)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Chat Bubbles */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none bg-[#090b14]/50 backdrop-blur-md">
                        {selectedThreadMessages.map((m) => {
                          const isAdmin = m.sender === 'Admin' || m.sender === 'support';
                          return (
                            <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs font-sans shadow ${
                                isAdmin 
                                  ? 'bg-purple-600 text-white rounded-br-none shadow shadow-purple-600/10' 
                                  : 'bg-zinc-800/80 text-zinc-100 rounded-bl-none shadow'
                              }`}>
                                <p className="break-words font-medium">{m.text}</p>
                                <span className="text-[8px] text-white/40 block text-right mt-1.5 font-mono">
                                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="p-4 border-t border-white/5 bg-[#0a0d18]/60 flex gap-2 shrink-0">
                        <input
                          type="text"
                          placeholder="Type response to client..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendSupportReply()}
                          className="flex-1 py-3 px-4 text-xs bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={sendSupportReply}
                          className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-xl font-black text-xs cursor-pointer transition-colors border-0 flex items-center justify-center gap-1.5"
                        >
                          <Send size={12} />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-650">
                      <MessageSquare size={48} className="text-zinc-800 mb-3 animate-pulse" />
                      <p className="text-xs font-black uppercase tracking-wider text-zinc-500/50">No active chat desk selected</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 6B: MANAGERS HUB */}
            {adminTab === 'managers' && (
              <motion.div
                key="managers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left"
              >
                {/* Manager Creation Form */}
                <div className="lg:col-span-4 space-y-4">
                  <h2 className="text-xs font-black text-white tracking-widest uppercase">Create Manager Account</h2>
                  <div className="bg-[#0a0d18]/45 border border-white/5 p-6 rounded-2xl shadow-md">
                    <form onSubmit={handleCreateManager} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-zinc-500 font-bold block mb-1.5 uppercase">Manager Phone Number</label>
                        <input
                          type="text"
                          required
                          className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white w-full focus:outline-none focus:border-purple-500 font-mono"
                          placeholder="e.g. 9991234567"
                          value={newManagerPhone}
                          onChange={(e) => setNewManagerPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 font-bold block mb-1.5 uppercase">System Password</label>
                        <input
                          type="password"
                          required
                          className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white w-full focus:outline-none focus:border-purple-500"
                          placeholder="Password"
                          value={newManagerPassword}
                          onChange={(e) => setNewManagerPassword(e.target.value)}
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={creatingManager}
                        className="py-2.5 w-full text-xs font-black bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer border-0 transition-colors shadow"
                      >
                        {creatingManager ? 'Creating manager...' : 'Create Account'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Managers List Table */}
                <div className="lg:col-span-8 space-y-4">
                  <h2 className="text-xs font-black text-white tracking-widest uppercase">Registered System Managers</h2>
                  <div className="bg-[#0a0d18]/45 border border-white/5 rounded-2xl overflow-hidden shadow-md">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 text-zinc-500 font-bold uppercase">
                          <th className="p-4">Manager ID</th>
                          <th className="p-4">Phone Number</th>
                          <th className="p-4">Designated Role</th>
                          <th className="p-4 text-right">Created Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {managers.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="p-6 text-center text-zinc-500 italic font-sans">No staff managers created yet</td>
                          </tr>
                        ) : (
                          managers.map((m) => (
                            <tr key={m.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="p-4 text-zinc-500 font-bold">#{m.id}</td>
                              <td className="p-4 text-white font-bold select-all">{m.phone_number}</td>
                              <td className="p-4">
                                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-sans">
                                  {m.role || 'manager'}
                                </span>
                              </td>
                              <td className="p-4 text-right text-zinc-500">
                                {new Date(m.created_at).toLocaleDateString('en-IN')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 7: SYSTEM CONFIG */}
            {adminTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
              >
                {/* UPI QR Payment Configuration */}
                <div className="space-y-4">
                  <h2 className="text-xs font-black text-white tracking-widest uppercase">Payment Gateways</h2>
                  <div className="bg-[#0a0d18]/45 border border-white/5 p-6 rounded-2xl shadow-md">
                    <form onSubmit={handleUpdatePaymentSettings} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-zinc-500 font-bold block mb-1.5 uppercase">Receiver UPI ID</label>
                        <input
                          type="text"
                          required
                          className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white w-full focus:outline-none focus:border-purple-500 font-mono"
                          placeholder="e.g. pay@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={updatingSettings}
                        className="py-2.5 w-full text-xs font-black bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer border-0 transition-colors shadow"
                      >
                        {updatingSettings ? 'Saving Settings...' : 'Save UPI Settings'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Game Outcome Mode resolvers */}
                <div className="space-y-4">
                  <h2 className="text-xs font-black text-white tracking-widest uppercase">Game Outcome Logic</h2>
                  <div className="bg-[#0a0d18]/45 border border-white/5 p-6 rounded-2xl shadow-md divide-y divide-white/5">
                    {gameSettings && Object.keys(gameSettings).map((game) => {
                      const settings = gameSettings[game];
                      return (
                        <div key={game} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-xs font-black uppercase text-white tracking-wide">{game} resolver</span>
                              <span className="text-[10px] text-zinc-500 block mt-1">Mode: <code className="text-purple-400 uppercase font-bold">{settings.mode}</code></span>
                            </div>
                            <div className="flex gap-1.5">
                              {['random', 'least', 'highest'].map((m) => (
                                <button
                                  key={m}
                                  onClick={() => handleUpdateGameMode(game, m)}
                                  disabled={updatingGame === game}
                                  className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded border-0 cursor-pointer transition-all ${
                                    settings.mode === m 
                                      ? 'bg-purple-600 text-white font-bold' 
                                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                  }`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Outcome Override inputs */}
                          <div className="flex gap-2 mt-3.5">
                            <input
                              type="text"
                              placeholder="Outcome override (e.g. green)..."
                              value={nextOutcomeInputs[game] || ''}
                              onChange={(e) => setNextOutcomeInputs(prev => ({ ...prev, [game]: e.target.value }))}
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
                            />
                            <button
                              onClick={() => handleApplyGameOutcomeOverride(game)}
                              disabled={updatingGame === game}
                              className="px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-0 transition-colors shadow"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

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
              className="relative w-full max-w-2xl h-full bg-[#0a0d18] border-l border-white/5 flex flex-col z-10 shadow-2xl overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield size={16} className="text-purple-500" />
                    <span>Customer Profile: {selectedUser.phone_number}</span>
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono block mt-1">ID: {selectedUser.id}</span>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="bg-white/5 hover:bg-white/10 border-0 p-2 rounded-xl text-zinc-400 hover:text-white cursor-pointer transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Loader */}
              {loadingDetails ? (
                <div className="flex-1 flex flex-col justify-center items-center text-zinc-500">
                  <RefreshCw className="animate-spin text-purple-500 mb-2" size={24} />
                  <span className="text-xs uppercase font-black tracking-widest">Loading ledger data...</span>
                </div>
              ) : userDetails ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Account Editor Pane */}
                  <div className="p-6 border-b border-white/5 bg-zinc-950/20 shrink-0 space-y-4">
                    <form onSubmit={handleUpdateUserDetails} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold block uppercase mb-1">Set Password (plain hash)</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                            <input
                              type="text"
                              placeholder="Reset user password..."
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                            />
                          </div>
                          <span className="text-[8px] text-zinc-600 block mt-0.5 truncate max-w-full">
                            Current hash: <code className="text-purple-400 font-mono">{userDetails.user.password_hash}</code>
                          </span>
                        </div>

                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold block uppercase mb-1">VIP Ranking Level</label>
                          <div className="relative">
                            <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                            <select
                              value={editVipLevel}
                              onChange={(e) => setEditVipLevel(parseInt(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                            >
                              {[1,2,3,4,5,6,7,8,9,10].map(v => (
                                <option key={v} value={v} className="bg-zinc-900 text-white">VIP Level {v}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold block uppercase mb-1">Playable Credits Balance (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editPlayableBalance}
                            onChange={(e) => setEditPlayableBalance(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold block uppercase mb-1">Affiliate Commission (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editCommissionBalance}
                            onChange={(e) => setEditCommissionBalance(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => toggleBlock(selectedUser.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border ${
                            selectedUser.is_blocked
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {selectedUser.is_blocked ? 'Unblock User' : 'Block User'}
                        </button>
                        <button
                          type="submit"
                          disabled={savingUser}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0 shadow"
                        >
                          {savingUser ? 'Saving System Changes...' : 'Save Settings'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* detailed histories selectors */}
                  <div className="bg-white/[0.01] border-b border-white/5 shrink-0 flex">
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
                            ? 'border-purple-500 text-white bg-white/[0.01]' 
                            : 'border-transparent text-zinc-500 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* logs detail body */}
                  <div className="flex-1 overflow-y-auto p-6 scrollbar-none space-y-3">
                    
                    {/* 1. GAME PLAYS TREE */}
                    {detailsTab === 'gameplays' && (
                      <div className="space-y-3">
                        {userDetails.gamePlays.length === 0 ? (
                          <div className="text-center py-12 text-zinc-500 text-xs">No game plays found for this user</div>
                        ) : (
                          userDetails.gamePlays.map((gp) => {
                            const isWin = gp.is_won === 1;
                            const selection = JSON.parse(gp.raw_selection || '{}');
                            return (
                              <div key={gp.id} className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center text-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-white uppercase tracking-wide">{gp.game}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">{gp.game_round_id}</span>
                                  </div>
                                  <div className="text-[10px] text-zinc-600 mt-1 space-y-0.5">
                                    <div>Selection: <code className="text-purple-400 font-bold select-all">{gp.raw_selection ? JSON.stringify(selection) : 'None'}</code></div>
                                    <div>Timestamp: {new Date(gp.created_at).toLocaleString('en-IN')}</div>
                                  </div>
                                </div>

                                <div className="text-right flex items-center gap-4">
                                  <div>
                                    <span className="text-[10px] text-zinc-500 block">Staked: ₹{gp.bet_amount.toFixed(2)}</span>
                                    <span className="text-[10px] text-zinc-500 block mt-0.5">Payout: {gp.payout_multiplier}x</span>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`text-xs font-black font-mono block ${isWin ? 'text-[#3de796]' : 'text-red-400'}`}>
                                      {isWin ? `+₹${gp.payout_amount.toFixed(2)}` : `-₹${gp.bet_amount.toFixed(2)}`}
                                    </span>
                                    <span className={`text-[8px] uppercase tracking-wider font-bold rounded px-1 ${
                                      isWin ? 'bg-[#3de796]/10 text-[#3de796] border border-[#3de796]/20' : 'bg-red-500/10 text-red-400 border border-red-500/25'
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

                    {/* 2. PAYMENTS */}
                    {detailsTab === 'payments' && (
                      <div className="space-y-3">
                        {userDetails.payments.length === 0 ? (
                          <div className="text-center py-12 text-zinc-500 text-xs">No deposit/withdrawal logs found</div>
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
                                    <span className="text-[10px] text-zinc-500 font-mono">UTR: {p.reference_id}</span>
                                  </div>
                                  <span className="text-[9px] text-zinc-600 block mt-2">
                                    Date: {new Date(p.created_at).toLocaleString('en-IN')}
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="text-sm font-black font-mono text-white block">₹{p.amount.toFixed(2)}</span>
                                  <span className={`text-[9px] font-bold block mt-1 uppercase ${
                                    p.status === 'completed' ? 'text-[#3de796]' : p.status === 'pending' ? 'text-amber-500' : 'text-red-400'
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

                    {/* 3. AFFILIATE EARNINGS */}
                    {detailsTab === 'earnings' && (
                      <div className="space-y-3">
                        {userDetails.earnings.length === 0 ? (
                          <div className="text-center py-12 text-zinc-500 text-xs">No affiliate earnings found</div>
                        ) : (
                          userDetails.earnings.map((e) => (
                            <div key={e.id} className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center text-xs">
                              <div>
                                <span className="text-[10px] text-zinc-500 font-mono block">Reference: {e.reference_id}</span>
                                <span className="text-[9px] text-zinc-600 block mt-1">
                                  Payout: {new Date(e.created_at).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black font-mono text-[#3de796] block">+₹{e.amount.toFixed(2)}</span>
                                <span className="text-[9px] text-zinc-500 font-bold block mt-1 uppercase">Credited</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* 4. REWARDS */}
                    {detailsTab === 'rewards' && (
                      <div className="space-y-3">
                        {userDetails.rewards.length === 0 ? (
                          <div className="text-center py-12 text-zinc-500 text-xs">No VIP reward logs found</div>
                        ) : (
                          userDetails.rewards.map((r) => (
                            <div key={r.id} className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-white block uppercase">{r.reference_id || 'System Reward'}</span>
                                <span className="text-[9px] text-zinc-600 block mt-1">
                                  Awarded: {new Date(r.created_at).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black font-mono text-[#3de796] block">+₹{r.amount.toFixed(2)}</span>
                                <span className="text-[9px] text-zinc-500 font-bold block mt-1 uppercase">Completed</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="flex-1 flex justify-center items-center text-zinc-500 text-xs">
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
