'use client';

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import {
  Home as HomeIcon,
  Trophy,
  Users,
  Wallet as WalletIcon,
  Calendar,
  LogOut,
  ArrowLeft,
  Shield,
  Volume2,
  VolumeX,
  Menu,
  Sparkles,
  Gift,
  Crown,
  Gamepad2,
  Coins,
  X,
  UserCheck,
  Bell,
  MessageSquare,
  Globe,
  Heart,
  Clock,
  Target,
  DollarSign,
  Flame,
  LayoutGrid,
  Sword,
  PlayCircle,
  Bookmark,
  Rocket,
  CircleDot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Page components
import Home from '../components/pages/Home';
import Leaderboard from '../components/pages/Leaderboard';
import Affiliate from '../components/pages/Affiliate';
import Wallet from '../components/pages/Wallet';
import VIPTasks from '../components/pages/VIPTasks';
import AdminDashboard from '../components/pages/AdminDashboard';

// Game components
import WinGo from '../games/WinGo';
import TrxWinGo from '../games/TrxWinGo';
import Crash from '../games/Crash';
import Mines from '../games/Mines';
import Plinko from '../games/Plinko';
import Limbo from '../games/Limbo';
import Roulette from '../games/Roulette';
import Dice from '../games/Dice';
import CoinFlip from '../games/CoinFlip';
import Hilo from '../games/Hilo';
import Keno from '../games/Keno';
import Goal from '../games/Goal';
import Hotline from '../games/Hotline';
import Chicken from '../games/Chicken';

// Shell components
import ChatRain from '../components/ChatRain';
import AdminPanel from '../components/AdminPanel';
import { toggleAudio, playClick } from '../utils/audio';

// Premium Filled SVG Icons
const FilledHome = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const FilledTrophy = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21 2H3v2c0 2.76 2.24 5 5 5h1v2c0 2.42 1.72 4.44 4 4.9V18H9a1 1 0 0 0-1 1v3h8v-3a1 1 0 0 0-1-1h-4v-2.1c2.28-.46 4-2.48 4-4.9v-2h1c2.76 0 5-2.24 5-5V2zm-13 5c-1.1 0-2-.9-2-2V4h2v3H8zm10-2v2c0 1.1-.9 2-2 2h-2V4h2v1z" />
  </svg>
);

const FilledGamepad = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
);

const FilledUsers = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const FilledStar = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const FilledDice = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-12 6c-.83 0-1.5-.67-1.5-1.5S6.17 6 7 6s1.5.67 1.5 1.5S7.83 9 7 9zm0 9c-.83 0-1.5-.67-1.5-1.5S6.17 15 7 15s1.5.67 1.5 1.5S7.83 18 7 18zm5-4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S16.17 6 17 6s1.5.67 1.5 1.5S17.83 9 17 9z" />
  </svg>
);

const FilledGrid = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4 11h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1zm10 0h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1zM4 21h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1zm10 0h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1z" />
  </svg>
);

const FilledSparkles = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l2.4 4.9L20 7.7l-4 3.9.9 5.4-4.9-2.5-4.9 2.5.9-5.4-4-3.9 5.6-.8z" />
  </svg>
);

const FilledGift = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22 6H17.82C18.41 5.08 18.5 3.84 17.83 2.8C16.89 1.35 14.93 1.07 13.62 2.2C12.92 2.8 12.33 3.96 12 4.67C11.67 3.96 11.08 2.8 10.38 2.2C9.07 1.07 7.11 1.35 6.17 2.8C5.5 3.84 5.59 5.08 6.18 6H2V11H22V6Z" />
    <path d="M4 12V20C4 21.1 4.9 22 6 22H11V12H4Z" />
    <path d="M13 12V22H18C19.1 22 20 21.1 20 20V12H13Z" />
  </svg>
);

const FilledBell = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);

const FilledChat = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

const FilledWallet = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
);

export default function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [playableBalance, setPlayableBalance] = useState(0);
  const [vipLevel, setVipLevel] = useState(1);
  const [theme, setTheme] = useState('dark');

  // Demo Mode State
  const [isDemo, setIsDemo] = useState(false);
  const [demoBalance, setDemoBalance] = useState(10000.00);

  // Authentication Fields (Modal)
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Layout / Navigation
  const [activeTab, setActiveTab] = useState('home'); // home, leaderboard, affiliate, wallet, tasks, admin
  const [gameMode, setGameMode] = useState(null); // id of active game
  const [socket, setSocket] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Load client states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('token') || '';
      setToken(savedToken);
      const savedTheme = localStorage.getItem('theme') || 'dark';
      setTheme(savedTheme);
      
      const savedDemo = localStorage.getItem('demo_balance');
      if (savedDemo !== null) {
        setDemoBalance(parseFloat(savedDemo));
      }
    }
  }, []);

  const updateDemoBalance = (newBal) => {
    setDemoBalance((prev) => {
      const val = typeof newBal === 'function' ? newBal(prev) : newBal;
      if (typeof window !== 'undefined') {
        localStorage.setItem('demo_balance', val.toString());
      }
      return val;
    });
  };

  useEffect(() => {
    toggleAudio(soundOn);
  }, [soundOn]);

  useEffect(() => {
    playClick();
  }, [activeTab, gameMode]);

  // Socket Connection setup
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // Fetch Profile Balance on load
  useEffect(() => {
    if (!token) {
      setUser(null);
      setPlayableBalance(0);
      return;
    }
    fetch('http://localhost:3001/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setVipLevel(data.user.vip_level || 1);
        }
        if (data.wallet) {
          setPlayableBalance(parseFloat(data.wallet.playable_balance));
        }
      })
      .catch((e) => {
        console.error(e);
        handleLogout();
      });
  }, [token]);

  // Action Guard: Blocks guests and prompts Login Modal
  const actionGuard = (callback) => {
    if (isDemo || (token && user)) {
      callback();
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) return alert('Fill in all fields');
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowLoginModal(false);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!phone || !password) return alert('Fill in all fields');
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, password, referral_code: refCode })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowLoginModal(false);
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setActiveTab('home');
    setGameMode(null);
  };

  // Render sub page routes
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <Home setGameMode={(mode) => actionGuard(() => setGameMode(mode))} />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'affiliate':
        return <Affiliate token={token} />;
      case 'wallet':
        return <Wallet token={token} balance={playableBalance} setBalance={setPlayableBalance} />;
      case 'tasks':
        return <VIPTasks balance={playableBalance} setBalance={setPlayableBalance} />;
      case 'admin':
        return <AdminDashboard token={token} />;
      default:
        return <Home setGameMode={(mode) => actionGuard(() => setGameMode(mode))} />;
    }
  };

  // Render Game view overlay
  const renderGame = () => {
    const activeBalance = isDemo ? demoBalance : playableBalance;
    const activeSetBalance = isDemo ? updateDemoBalance : setPlayableBalance;
    const demoUser = user || { id: 'demo_user', phone_number: 'Demo User' };

    switch (gameMode) {
      case 'wingo':
      case 'bigsmall':
        return <WinGo socket={socket} user={demoUser} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'trx':
        return <TrxWinGo socket={socket} user={demoUser} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'crash':
        return <Crash socket={socket} user={demoUser} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'mines':
        return <Mines token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'plinko':
        return <Plinko token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'limbo':
        return <Limbo token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'roulette':
        return <Roulette socket={socket} user={demoUser} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'dice':
        return <Dice token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'coin':
        return <CoinFlip token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'hilo':
        return <Hilo token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'keno':
        return <Keno token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'goal':
        return <Goal token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'hotline':
        return <Hotline token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      case 'chicken':
        return <Chicken token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
      default:
        return null;
    }
  };

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const sideIcons = [
    { icon: FilledHome, tab: 'home', label: 'Lobby' },
    { icon: FilledTrophy, tab: 'leaderboard', label: 'Leaderboard' },
    { icon: FilledUsers, tab: 'affiliate', label: 'Affiliate' },
    { icon: FilledWallet, tab: 'wallet', label: 'Wallet' },
    { icon: FilledGift, tab: 'tasks', label: 'Promotions' },
  ];

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-bg-body text-white font-sans">
      
      {/* Normal Full-Size Left Sidebar */}
      <aside 
        className={`fixed md:relative top-0 left-0 h-full bg-bg-sidebar rounded-r-[32px] flex flex-col justify-between py-6 z-40 transition-all duration-300 shrink-0 w-[240px] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-8 items-start w-full">
          {/* Logo Brand Title styled like a premium logo */}
          <button 
            onClick={() => { setGameMode(null); setActiveTab('home'); }}
            className="bg-transparent border-0 cursor-pointer hover:scale-102 active:scale-98 transition-all select-none min-h-[36px] px-6 self-start"
          >
            <div className="flex items-center font-black tracking-tighter uppercase select-none">
              <span className="text-white text-2xl font-black font-sans tracking-tight">tez</span>
              <span className="text-[#3de796] bg-[#3de796]/10 border border-[#3de796]/20 px-2 py-1 rounded-lg text-xs font-black ml-1.5 tracking-wider shadow-inner">club</span>
            </div>
          </button>

          {/* Sidebar Menu items */}
          <div className="flex flex-col gap-1.5 w-full px-4">
            {sideIcons.map((item, idx) => {
              const isActive = item.tab === activeTab && !gameMode;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setGameMode(null);
                    setActiveTab(item.tab);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl cursor-pointer group transition-all duration-200 border-0 outline-none ${
                    isActive
                      ? 'bg-[#3de796] text-[#0f111a] shadow-lg shadow-[#3de796]/10 font-bold'
                      : 'text-text-muted hover:text-white hover:bg-white/5 font-semibold'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer settings */}
        <div className="flex flex-col gap-4 w-full px-6">
          {user && user.phone_number === '9999999999' && (
            <button
              onClick={() => { setGameMode(null); setActiveTab('admin'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/5 text-accent-orange ${
                activeTab === 'admin' && !gameMode ? 'bg-orange-500/10' : 'bg-transparent'
              }`}
              title="Admin Board"
            >
              <Shield size={20} />
              <span className="text-[10px] font-black uppercase tracking-wider">Admin</span>
            </button>
          )}

          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted hover:text-white bg-transparent border-0 cursor-pointer"
            title="Toggle Sound"
          >
            {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span className="text-[10px] font-black uppercase tracking-wider">Sound</span>
          </button>
        </div>
      </aside>

      {/* Background overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* 2. MAIN BODY */}
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto">
        {/* Development testing panel */}
        {user && user.phone_number === '9999999999' && (
          <AdminPanel token={token} socket={socket} user={user} setPlayableBalance={setPlayableBalance} />
        )}

        {/* THRILL TOP HEADER */}
        <header className="h-[72px] bg-bg-body flex justify-between items-center px-6 sticky top-0 z-30 border-0">
          {/* Left spacer / mobile menu */}
          <div className="flex items-center gap-4">
            <button 
              className="text-white bg-transparent border-0 cursor-pointer p-1.5 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
          
          {/* Center authentication and notification hub (Hanging Tab Style) */}
          <div className="flex items-center gap-4 relative">
            {/* Gift Button */}
            <button className="relative z-20 w-10 h-10 rounded-full bg-[#171a25] flex items-center justify-center text-[#94a3b8] hover:text-white cursor-pointer transition-all shadow-md" title="Promotions">
              <FilledGift size={20} className="text-[#94a3b8]" />
            </button>

            {/* Auth Hanging Tab */}
            <div className="flex items-center bg-[#171a25] px-8 py-3 rounded-b-[36px] shadow-2xl gap-5 min-h-[48px] self-start -mt-4 pt-6 relative z-10">
              {/* Concave U-curves */}
              <div className="tab-curve-left" />
              <div className="tab-curve-right" />
              {token ? (
                <button 
                  onClick={handleLogout}
                  className="bg-transparent border-0 text-text-muted hover:text-accent-red text-xs font-black uppercase tracking-wider cursor-pointer transition-all"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="bg-transparent border-0 text-white hover:text-[#3de796] text-xs font-black uppercase tracking-wider cursor-pointer transition-all whitespace-nowrap"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="bg-[#3de796] hover:bg-[#5cf2aa] text-[#0f111a] border-0 rounded-full px-6 py-2 text-xs font-black uppercase tracking-wider cursor-pointer transition-all hover:scale-102"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Bell Button */}
            <button className="relative z-20 w-10 h-10 rounded-full bg-[#171a25] flex items-center justify-center text-[#94a3b8] hover:text-white cursor-pointer transition-all shadow-md" title="Notifications">
              <FilledBell size={20} className="text-[#94a3b8]" />
            </button>
          </div>

          {/* Right actions (Search, Profile/Settings, Balance if logged in) */}
          <div className="flex items-center gap-3">
            {token && (
              <div className="flex items-center gap-1.5 bg-[#06080c] py-1 px-2.5 rounded-xl text-[10px] font-black tracking-wider">
                <span className={isDemo ? 'text-text-muted' : 'text-accent-green'}>REAL</span>
                <button 
                  onClick={() => { playClick(); setIsDemo(!isDemo); }} 
                  className="w-7 h-3.5 rounded-full relative cursor-pointer border-0 bg-white/10"
                >
                  <motion.div 
                    animate={{ left: isDemo ? '14px' : '2px' }}
                    className="w-3 h-3 rounded-full bg-white absolute top-[1px]"
                  />
                </button>
                <span className={isDemo ? 'text-accent-green' : 'text-text-muted'}>DEMO</span>
              </div>
            )}

            {token && (
              <button
                onClick={() => {
                  if (isDemo) { updateDemoBalance(10000.00); alert('Demo Balance refilled!'); }
                  else { setGameMode(null); setActiveTab('wallet'); }
                }}
                className="bg-[#171a25] flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs cursor-pointer transition-all"
              >
                <Coins size={20} className={isDemo ? 'text-[#3de796]' : 'text-accent-orange'} />
                <span className="monospace-ledger font-extrabold text-white">
                  {isDemo ? `₹${demoBalance.toFixed(2)}` : `₹${playableBalance.toFixed(2)}`}
                </span>
              </button>
            )}

            {/* Search Icon (Filled) */}
            <button className="w-10 h-10 rounded-full bg-[#171a25] flex items-center justify-center text-text-secondary hover:text-white cursor-pointer transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#94a3b8]"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
            </button>
            
            {/* Chat Icon (Filled) */}
            <button 
               onClick={() => setChatOpen(!chatOpen)} 
               className="w-10 h-10 rounded-full bg-[#171a25] flex items-center justify-center text-text-secondary hover:text-white cursor-pointer transition-all"
               title="Toggle Live Chat"
            >
              <div className="relative">
                <FilledChat size={20} className="text-[#3de796]" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#3de796] rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#3de796] rounded-full" />
              </div>
            </button>
          </div>
        </header>

        {/* Content switch box */}
        <div className="flex-1 relative bg-bg-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={gameMode || activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {gameMode ? renderGame() : renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Community public chat rain bot */}
      <ChatRain
        socket={socket}
        user={user}
        vipLevel={vipLevel}
        playableBalance={playableBalance}
        setPlayableBalance={setPlayableBalance}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
      />

      {/* LOGIN/REGISTER MODAL OVERLAY */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b1021] border border-white/5 rounded-3xl p-6 md:p-8 max-w-sm w-full relative shadow-2xl space-y-6"
            >
              <button
                className="absolute top-4 right-4 text-text-muted hover:text-white bg-transparent border-0 cursor-pointer p-1"
                onClick={() => setShowLoginModal(false)}
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-1.5">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  TEZCLUB<span className="text-[var(--accent-green)]">.IN</span>
                </h2>
                <p className="text-xs text-text-muted">
                  {isRegister ? 'Register your private testing account' : 'Sign in to access games lobby'}
                </p>
              </div>

              <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-3">
                <input 
                  type="text" 
                  className="form-input text-xs py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl w-full" 
                  placeholder="Phone Number" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
                <input 
                  type="password" 
                  className="form-input text-xs py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl w-full" 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
                {isRegister && (
                  <input 
                    type="text" 
                    className="form-input text-xs py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl w-full" 
                    placeholder="Referral Code (Optional)" 
                    value={refCode} 
                    onChange={(e) => setRefCode(e.target.value)} 
                  />
                )}
                <button 
                  type="submit" 
                  className="action-btn w-full py-2.5 text-xs font-black text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-blue-500/25 mt-2"
                >
                  {isRegister ? 'Create Credentials' : 'Authenticate Session'}
                </button>
              </form>

              <div className="text-center text-xs">
                <span className="text-text-muted">
                  {isRegister ? 'Already have an account?' : "Don't have an account?"}
                </span>{' '}
                <button
                  className="text-blue-400 font-bold bg-transparent border-0 cursor-pointer"
                  onClick={() => setIsRegister(!isRegister)}
                >
                  {isRegister ? 'Sign In' : 'Register'}
                </button>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 text-[10px] leading-relaxed text-text-muted space-y-1">
                <strong className="text-white block font-bold">Standard testing credentials:</strong>
                <div>Phone Number: <code className="text-blue-400 font-bold select-all">9999999999</code></div>
                <div>Access Password: <code className="text-blue-400 font-bold select-all">admin123</code></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
