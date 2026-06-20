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
  ArrowRight,
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
  CircleDot,
  Settings,
  BarChart2,
  Maximize2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Page components
import Home from '../components/pages/Home';
import Leaderboard from '../components/pages/Leaderboard';
import Affiliate from '../components/pages/Affiliate';
import Wallet from '../components/pages/Wallet';
import VIPTasks from '../components/pages/VIPTasks';
import AdminDashboard from '../components/pages/AdminDashboard';
import SportsLobby from '../components/pages/SportsLobby';

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
import Baccarat from '../games/Baccarat';

// Shell components
import ChatRain from '../components/ChatRain';
import SupportChat from '../components/SupportChat';
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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showBalanceDropdown, setShowBalanceDropdown] = useState(false);
  const [lobbyTab, setLobbyTab] = useState('casino'); // casino or sports
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [sidebarActiveKey, setSidebarActiveKey] = useState('lobby'); // lobby, recents, favourites, bets, leaderboard, affiliate, wallet, tasks, admin, originals

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
    if (lobbyTab === 'sports' && activeTab === 'home') {
      return (
        <SportsLobby 
          token={token} 
          balance={playableBalance} 
          setBalance={setPlayableBalance} 
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <Home 
            filter={lobbyTab === 'casino' ? sidebarActiveKey : 'lobby'} 
            setFilter={setSidebarActiveKey} 
            setGameMode={(mode) => actionGuard(() => setGameMode(mode))} 
          />
        );
      case 'leaderboard':
        return <Leaderboard />;
      case 'affiliate':
        return <Affiliate token={token} />;
      case 'wallet':
        return <Wallet token={token} balance={playableBalance} setBalance={setPlayableBalance} user={user} />;
      case 'tasks':
        return <VIPTasks balance={playableBalance} setBalance={setPlayableBalance} />;
      case 'admin':
        return <AdminDashboard token={token} socket={socket} />;
      default:
        return <Home setGameMode={(mode) => actionGuard(() => setGameMode(mode))} />;
    }
  };

  // Render Game view overlay
  const renderGame = () => {
    const activeBalance = isDemo ? demoBalance : playableBalance;
    const activeSetBalance = isDemo ? updateDemoBalance : setPlayableBalance;
    const demoUser = user || { id: 'demo_user', phone_number: 'Demo User' };

    let gameComponent = null;
    switch (gameMode) {
      case 'wingo':
      case 'bigsmall':
        gameComponent = <WinGo socket={socket} user={demoUser} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'trx':
        gameComponent = <TrxWinGo socket={socket} user={demoUser} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'crash':
        gameComponent = <Crash socket={socket} user={demoUser} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'mines':
        gameComponent = <Mines token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'plinko':
        gameComponent = <Plinko token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'limbo':
        gameComponent = <Limbo socket={socket} user={demoUser} token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'roulette':
        gameComponent = <Roulette socket={socket} user={demoUser} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'dice':
        gameComponent = <Dice socket={socket} user={demoUser} token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'coin':
        gameComponent = <CoinFlip socket={socket} user={demoUser} token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'hilo':
        gameComponent = <Hilo token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'keno':
        gameComponent = <Keno socket={socket} user={demoUser} token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'goal':
        gameComponent = <Goal token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'hotline':
        gameComponent = <Hotline token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'chicken':
        gameComponent = <Chicken token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      case 'baccarat':
        gameComponent = <Baccarat token={token} playableBalance={activeBalance} setPlayableBalance={activeSetBalance} isDemo={isDemo} />;
        break;
      default:
        return null;
    }

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24 space-y-4">
        {/* Large Unified Game Card Container — fixed height across all games */}
        <div className="bg-[#1a1d29] border border-white/[0.03] rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-2xl overflow-hidden" style={{ minHeight: '680px', height: '680px' }}>
          <div className="h-full overflow-auto scrollbar-none">
            {gameComponent}
          </div>
        </div>
        
        {/* Game Footer / Metadata */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 px-2 select-none">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-base font-black text-white leading-none capitalize">{gameMode === 'wingo' ? 'Win Go' : gameMode === 'trx' ? 'TRX Win Go' : gameMode}</h2>
              <span className="text-[10px] text-text-muted font-bold block mt-1">By Thrill Originals</span>
            </div>
            <div className="bg-[#3de796]/10 border border-[#3de796]/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[#3de796] text-[9px] font-black uppercase tracking-wider">
              <Shield size={11} />
              <span>Provably Fair</span>
            </div>
          </div>
          
          {/* Bottom Tool Bar */}
          <div className="flex items-center gap-2.5">
            <div className="bg-[#171a25] px-2.5 py-1.5 rounded-xl border border-white/5 flex items-center gap-1 text-[10px] font-black text-white cursor-pointer hover:bg-white/5 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3de796]" />
              <span>INR</span>
              <svg className="w-3 h-3 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            <button className="w-8 h-8 rounded-lg bg-[#171a25] border border-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-[#3de796] flex items-center justify-center cursor-pointer transition-all">
              <Heart size={14} />
            </button>
            
            <button className="w-8 h-8 rounded-lg bg-[#171a25] border border-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-[#3de796] flex items-center justify-center cursor-pointer transition-all">
              <BarChart2 size={14} />
            </button>

            <button className="w-8 h-8 rounded-lg bg-[#171a25] border border-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-[#3de796] flex items-center justify-center cursor-pointer transition-all">
              <Maximize2 size={14} />
            </button>

            <button 
              onClick={() => setSoundOn(!soundOn)}
              className="w-8 h-8 rounded-lg bg-[#171a25] border border-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-[#3de796] flex items-center justify-center cursor-pointer transition-all"
            >
              {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            <button className="w-8 h-8 rounded-lg bg-[#171a25] border border-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-[#3de796] flex items-center justify-center cursor-pointer transition-all">
              <Share2 size={14} />
            </button>

            <button className="w-8 h-8 rounded-lg bg-[#171a25] border border-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-[#3de796] flex items-center justify-center cursor-pointer transition-all">
              <Settings size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="flex w-screen h-screen overflow-hidden bg-bg-body text-white font-sans">
      
      {/* Collapsible Left Sidebar */}
      {lobbyTab === 'casino' && (
        <aside 
          className={`fixed md:relative top-0 left-0 h-full bg-bg-sidebar rounded-r-[32px] flex flex-col justify-between py-5 z-40 transition-all duration-300 shrink-0 ${
            isSidebarExpanded ? 'w-[240px]' : 'w-[84px]'
          } ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex flex-col gap-6 items-start w-full overflow-hidden h-full">
            {/* Header Row (Gift, Logo, Bell) */}
            {isSidebarExpanded ? (
              <div className="flex justify-between items-center w-full px-6 shrink-0 select-none">
                {/* Gift Button */}
                <button 
                  onClick={() => { setGameMode(null); setActiveTab('tasks'); }}
                  className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-text-secondary hover:text-white cursor-pointer border-0 transition-all"
                  title="VIP Tasks & Promotions"
                >
                  <FilledGift size={18} />
                </button>

                {/* brand logo */}
                <button 
                  onClick={() => { setGameMode(null); setActiveTab('home'); setLobbyTab('casino'); }}
                  className="bg-transparent border-0 cursor-pointer hover:scale-102 active:scale-98 transition-all select-none"
                >
                  <span className="text-white text-2xl font-black font-sans tracking-tight italic select-none">
                    thrill
                  </span>
                </button>

                {/* Bell Button */}
                <button 
                  onClick={() => { setGameMode(null); setActiveTab('home'); }}
                  className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-text-secondary hover:text-white cursor-pointer border-0 transition-all"
                  title="Notifications"
                >
                  <FilledBell size={18} />
                </button>
              </div>
            ) : (
              <div className="w-full flex justify-center py-2 shrink-0 select-none">
                <button 
                  onClick={() => { setGameMode(null); setActiveTab('home'); setLobbyTab('casino'); }}
                  className="bg-transparent border-0 cursor-pointer font-black text-xl text-white italic"
                >
                  t
                </button>
              </div>
            )}

            {/* Switch Button (Casino / Sports) */}
            <div className="w-full px-4 shrink-0">
              <motion.div 
                layoutId="lobby-switcher-box"
                className={`bg-black/30 p-1 rounded-2xl flex border border-white/5 relative overflow-hidden ${isSidebarExpanded ? 'flex-row' : 'flex-col gap-1.5'}`}
              >
                <button
                  onClick={() => { setLobbyTab('casino'); setGameMode(null); setActiveTab('home'); }}
                  className={`flex-1 py-2 rounded-xl flex items-center justify-center cursor-pointer transition-all border-0 relative z-10 ${
                    lobbyTab === 'casino'
                      ? 'text-[#0f111a] font-bold'
                      : 'text-text-secondary hover:text-white bg-transparent'
                  }`}
                  title="Casino Lobby"
                >
                  {lobbyTab === 'casino' && (
                    <motion.div 
                      layoutId="lobby-active-pill"
                      className="absolute inset-0 bg-[#3de796] rounded-xl shadow-md shadow-[#3de796]/10 -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {/* Club Card Logo for Casino */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor" fillOpacity="0.15" />
                    <circle cx="12" cy="9.5" r="1.8" fill="currentColor" stroke="none" />
                    <circle cx="9.5" cy="12.5" r="1.8" fill="currentColor" stroke="none" />
                    <circle cx="14.5" cy="12.5" r="1.8" fill="currentColor" stroke="none" />
                    <path d="M12 12.5v3.5m-1.5 0h3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  {isSidebarExpanded && <span className="text-[10px] font-black uppercase tracking-wider ml-1.5">Casino</span>}
                </button>

                <button
                  onClick={() => { setLobbyTab('sports'); setGameMode(null); setActiveTab('home'); }}
                  className={`flex-1 py-2 rounded-xl flex items-center justify-center cursor-pointer transition-all border-0 relative z-10 ${
                    lobbyTab === 'sports'
                      ? 'text-[#0f111a] font-bold'
                      : 'text-text-secondary hover:text-white bg-transparent'
                  }`}
                  title="Sports Betting"
                >
                  {lobbyTab === 'sports' && (
                    <motion.div 
                      layoutId="lobby-active-pill"
                      className="absolute inset-0 bg-[#3de796] rounded-xl shadow-md shadow-[#3de796]/10 -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {/* Rupee Coin Logo for Sports */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" />
                    <path d="M8.5 8h7M8.5 11h6M8.5 8c3.5 0 5.5 1.5 5.5 3.25s-2 3.25-5.5 3.25M12 14.5l-4.5 4.5" />
                  </svg>
                  {isSidebarExpanded && <span className="text-[10px] font-black uppercase tracking-wider ml-1.5">Sports</span>}
                </button>
              </motion.div>
            </div>

          {/* Sidebar Menu items */}
          <div className="flex-1 overflow-y-auto w-full px-3 space-y-1 scrollbar-none">
            {[
              { label: 'Recents', icon: Clock, tab: 'home', key: 'recents', lobby: 'casino' },
              { label: 'Favourites', icon: Heart, tab: 'home', key: 'favourites', lobby: 'casino' },
              { label: 'My Bets', icon: Calendar, tab: 'home', key: 'bets', lobby: 'casino' },
              { label: 'Leaderboard', icon: Trophy, tab: 'leaderboard', key: 'leaderboard' },
              { label: 'Affiliate', icon: Users, tab: 'affiliate', key: 'affiliate' },
              { label: 'Wallet', icon: WalletIcon, tab: 'wallet', key: 'wallet' },
              { label: 'VIP Tasks', icon: Gift, tab: 'tasks', key: 'tasks' },
            ].map((item, idx) => {
              const isActive = !gameMode && activeTab === item.tab && (item.tab === 'home' ? sidebarActiveKey === item.key : true);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setGameMode(null);
                    setActiveTab(item.tab);
                    if (item.lobby) setLobbyTab(item.lobby);
                    if (item.key) setSidebarActiveKey(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-start rounded-2xl cursor-pointer transition-all duration-200 border-0 outline-none ${
                    isSidebarExpanded ? 'px-4 py-3 gap-3.5' : 'p-3 justify-center'
                  } ${
                    isActive
                      ? 'bg-[#3de796] text-[#0f111a] shadow-lg shadow-[#3de796]/10 font-bold'
                      : 'text-text-muted hover:text-white hover:bg-white/5 font-semibold'
                  }`}
                  title={item.label}
                >
                  <item.icon size={18} />
                  {isSidebarExpanded && (
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Games Section */}
            {isSidebarExpanded && (
              <div className="text-[9px] font-black uppercase tracking-[2px] text-text-dim px-4 pt-4 pb-1.5 select-none">
                Games
              </div>
            )}

            {[
              { label: 'Thrill Originals', icon: Sparkles, tab: 'home', game: null, key: 'originals' },
              { label: 'Roulette', icon: CircleDot, game: 'roulette' },
              { label: 'Crash Rocket', icon: Rocket, game: 'crash' },
              { label: 'Mines Gold', icon: Target, game: 'mines' },
              { label: 'Plinko Drop', icon: PlayCircle, game: 'plinko' },
              { label: 'Limbo multipliers', icon: ArrowRight, game: 'limbo' },
              { label: 'Predict Dice', icon: Coins, game: 'dice' },
              { label: 'Baccarat', icon: Sword, game: 'baccarat' },
            ].map((item, idx) => {
              const isActive = item.game === null 
                ? (!gameMode && activeTab === 'home' && sidebarActiveKey === 'originals')
                : (gameMode === item.game);
              return (
                <button
                  key={`game-${idx}`}
                  onClick={() => {
                    if (item.game) {
                      actionGuard(() => {
                        setGameMode(item.game);
                        setSidebarOpen(false);
                      });
                    } else {
                      setGameMode(null);
                      setActiveTab('home');
                      setLobbyTab('casino');
                      setSidebarActiveKey('originals');
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-start rounded-2xl cursor-pointer transition-all duration-200 border-0 outline-none ${
                    isSidebarExpanded ? 'px-4 py-3 gap-3.5' : 'p-3 justify-center'
                  } ${
                    isActive
                      ? 'bg-[#3de796] text-[#0f111a] shadow-lg shadow-[#3de796]/10 font-bold'
                      : 'text-text-muted hover:text-white hover:bg-white/5 font-semibold'
                  }`}
                  title={item.label}
                >
                  {item.label === 'Roulette' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  ) : (
                    <item.icon size={18} />
                  )}
                  {isSidebarExpanded && (
                    <span className="text-[10px] font-black uppercase tracking-wider truncate">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer settings / Collapse toggle */}
        <div className="flex flex-col gap-3 w-full px-4 shrink-0 mt-4">
          {user && user.phone_number === '9999999999' && (
            <button
              onClick={() => { setGameMode(null); setActiveTab('admin'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-start rounded-xl cursor-pointer hover:bg-white/5 text-accent-orange border-0 bg-transparent ${
                isSidebarExpanded ? 'px-4 py-3 gap-3' : 'p-3 justify-center'
              } ${
                activeTab === 'admin' && !gameMode ? 'bg-orange-500/10' : ''
              }`}
              title="Admin Board"
            >
              <Shield size={18} />
              {isSidebarExpanded && <span className="text-[10px] font-black uppercase tracking-wider">Admin</span>}
            </button>
          )}

          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`w-full flex items-center justify-start rounded-xl text-text-muted hover:text-white bg-transparent border-0 cursor-pointer ${
              isSidebarExpanded ? 'px-4 py-3 gap-3' : 'p-3 justify-center'
            }`}
            title="Toggle Sound"
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {isSidebarExpanded && <span className="text-[10px] font-black uppercase tracking-wider">Sound</span>}
          </button>

          {/* Collapse Button */}
          <div className={`flex w-full pt-2 border-t border-white/5 ${isSidebarExpanded ? 'justify-end pr-2' : 'justify-center'}`}>
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-text-secondary hover:text-white cursor-pointer border-0 transition-all outline-none"
              title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarExpanded ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                  <path d="M16 15l-3-3 3-3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                  <path d="M13 9l3 3-3 3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </aside>
      )}

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
          {/* Left spacer / mobile menu / logo and switcher */}
          <div className="flex items-center gap-4">
            {lobbyTab === 'casino' && (
              <button 
                className="text-white bg-transparent border-0 cursor-pointer p-1.5 md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
            )}

            {/* Combined Logo & Switcher Toggle - Only show when in Sports Mode */}
            {lobbyTab === 'sports' && (
              <div className="bg-[#171a25]/90 py-2.5 pl-6 pr-2.5 rounded-[24px] flex items-center gap-4 shadow-lg relative overflow-hidden">
                <span className="text-white text-[27px] font-black font-sans tracking-tight italic select-none leading-none">
                  thrill
                </span>

                <motion.div 
                  layoutId="lobby-switcher-box"
                  className="bg-black/35 p-1 rounded-[18px] flex items-center gap-1.5 relative overflow-hidden"
                >
                  <button
                    onClick={() => { setLobbyTab('casino'); setGameMode(null); setActiveTab('home'); }}
                    className={`px-4 py-2.5 rounded-[14px] flex items-center justify-center cursor-pointer transition-all border-0 relative z-10 ${
                      lobbyTab === 'casino'
                        ? 'text-[#0f111a] font-bold'
                        : 'text-text-secondary hover:text-white bg-transparent'
                    }`}
                    title="Casino Lobby"
                  >
                    {lobbyTab === 'casino' && (
                      <motion.div 
                        layoutId="lobby-active-pill"
                        className="absolute inset-0 bg-[#3de796] rounded-[14px] shadow-md shadow-[#3de796]/10 -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {/* Club Card Logo for Casino */}
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor" fillOpacity="0.15" />
                      <circle cx="12" cy="9.5" r="1.8" fill="currentColor" stroke="none" />
                      <circle cx="9.5" cy="12.5" r="1.8" fill="currentColor" stroke="none" />
                      <circle cx="14.5" cy="12.5" r="1.8" fill="currentColor" stroke="none" />
                      <path d="M12 12.5v3.5m-1.5 0h3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  <button
                    onClick={() => { setLobbyTab('sports'); setGameMode(null); setActiveTab('home'); }}
                    className={`px-4 py-2.5 rounded-[14px] flex items-center justify-center cursor-pointer transition-all border-0 relative z-10 ${
                      lobbyTab === 'sports'
                        ? 'text-[#0f111a] font-bold'
                        : 'text-text-secondary hover:text-white bg-transparent'
                    }`}
                    title="Sports Betting"
                  >
                    {lobbyTab === 'sports' && (
                      <motion.div 
                        layoutId="lobby-active-pill"
                        className="absolute inset-0 bg-[#3de796] rounded-[14px] shadow-md shadow-[#3de796]/10 -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {/* Rupee Coin Logo for Sports */}
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" />
                      <path d="M8.5 8h7M8.5 11h6M8.5 8c3.5 0 5.5 1.5 5.5 3.25s-2 3.25-5.5 3.25M12 14.5l-4.5 4.5" />
                    </svg>
                  </button>
                </motion.div>
              </div>
            )}
          </div>
          
          {/* Center authentication and notification hub (Hanging Tab Style) */}
          <div className="flex items-center gap-4 relative">
            {/* Gift Button */}
            <button className="relative z-20 w-10 h-10 rounded-full bg-[#171a25] flex items-center justify-center text-[#94a3b8] hover:text-white cursor-pointer transition-all shadow-md" title="Promotions">
              <FilledGift size={20} className="text-[#94a3b8]" />
            </button>

            {/* Auth Hanging Tab */}
            <div className="flex items-center bg-[#171a25] px-6 py-3 rounded-b-[36px] shadow-2xl gap-4 min-h-[48px] self-start -mt-4 pt-6 relative z-10">
              {/* Concave U-curves */}
              <div className="tab-curve-left" />
              <div className="tab-curve-right" />
              {token ? (
                <div className="flex items-center gap-3.5 relative">
                  {/* Balance Dropdown Trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setShowBalanceDropdown(!showBalanceDropdown)}
                      className="bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/5 cursor-pointer transition-all outline-none"
                    >
                      {/* Rupee green icon */}
                      <div className="w-5 h-5 rounded-full bg-[#3de796]/20 flex items-center justify-center text-[#3de796] font-bold text-xs select-none">
                        ₹
                      </div>
                      <span className="font-extrabold text-[13px] tracking-tight monospace-ledger text-white">
                        {isDemo ? `₹${demoBalance.toFixed(2)}` : `₹${playableBalance.toFixed(2)}`}
                      </span>
                      <svg className={`w-3 h-3 text-[#94a3b8] transition-transform duration-200 ${showBalanceDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Balance Dropdown Options */}
                    <AnimatePresence>
                      {showBalanceDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowBalanceDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 bg-[#171a25] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[150px] z-50 py-1"
                          >
                            <button
                              onClick={() => {
                                setIsDemo(false);
                                setShowBalanceDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between ${!isDemo ? 'text-[#3de796] bg-white/5' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                            >
                              <span>REAL Account</span>
                              {!isDemo && <span className="w-1.5 h-1.5 rounded-full bg-[#3de796]" />}
                            </button>
                            <button
                              onClick={() => {
                                setIsDemo(true);
                                setShowBalanceDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between ${isDemo ? 'text-[#3de796] bg-white/5' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                            >
                              <span>DEMO Account</span>
                              {isDemo && <span className="w-1.5 h-1.5 rounded-full bg-[#3de796]" />}
                            </button>
                            {isDemo && (
                              <button
                                onClick={() => {
                                  updateDemoBalance(10000.00);
                                  alert('Demo Balance refilled!');
                                  setShowBalanceDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-[10px] text-accent-orange hover:bg-white/5 font-extrabold uppercase border-t border-white/5"
                              >
                                Refill Demo (₹10,000)
                              </button>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Wallet Button */}
                  <button
                    onClick={() => { setGameMode(null); setActiveTab('wallet'); }}
                    className="bg-[#3de796] hover:bg-[#5cf2aa] text-[#0f111a] font-black uppercase text-[11px] tracking-wider rounded-xl px-4 py-2 flex items-center gap-2 transition-all hover:scale-102 active:scale-98 shadow-md shadow-[#3de796]/10 cursor-pointer border-0"
                  >
                    <FilledWallet size={15} />
                    <span>WALLET</span>
                  </button>

                  {/* Avatar Dropdown Trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0.5 hover:opacity-85 transition-all outline-none"
                    >
                      {/* Custom adorable Robot Avatar SVG matching user's image color palette */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-[1.5px] shadow-md shadow-indigo-500/20">
                        <div className="w-full h-full rounded-full bg-[#0b1021] flex items-center justify-center overflow-hidden relative">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Antenna */}
                            <circle cx="12" cy="5" r="1.5" fill="#3b82f6" />
                            <path d="M12 5V8" stroke="#3b82f6" strokeWidth="1" />
                            {/* Robot Head */}
                            <rect x="6" y="8" width="12" height="10" rx="3" fill="#3b82f6" />
                            {/* Visor */}
                            <rect x="7.5" y="10" width="9" height="5" rx="1.5" fill="#0f172a" />
                            {/* Neon glowing eyes */}
                            <rect x="9.2" y="11.5" width="2" height="2" rx="0.5" fill="#ffffff" />
                            <rect x="12.8" y="11.5" width="2" height="2" rx="0.5" fill="#ffffff" />
                            {/* Earcups */}
                            <rect x="4.5" y="10.5" width="1.5" height="5" rx="0.75" fill="#ffffff" />
                            <rect x="18" y="10.5" width="1.5" height="5" rx="0.75" fill="#ffffff" />
                            {/* Cheek details */}
                            <path d="M9 16.5H15" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                      <svg className={`w-3 h-3 text-[#94a3b8] transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Profile Dropdown Options */}
                    <AnimatePresence>
                      {showProfileDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full right-0 mt-2 bg-[#171a25] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px] z-50 py-1"
                          >
                            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.01]">
                              <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Account</div>
                              <div className="text-xs font-black text-white truncate mt-0.5">{user?.phone_number || 'Tester'}</div>
                            </div>
                            <button
                              onClick={() => {
                                setGameMode(null);
                                setActiveTab('wallet');
                                setShowProfileDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs text-[#94a3b8] hover:text-white hover:bg-white/5 font-bold flex items-center gap-2 cursor-pointer bg-transparent border-0"
                            >
                              <FilledWallet size={14} className="text-[#94a3b8]" />
                              <span>My Wallet</span>
                            </button>
                            <button
                              onClick={() => {
                                handleLogout();
                                setShowProfileDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs text-accent-red hover:bg-red-500/10 font-bold flex items-center gap-2 border-t border-white/5 cursor-pointer bg-transparent border-0"
                            >
                              <LogOut size={14} />
                              <span>Sign Out</span>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
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

          {/* Right actions (Search, Chat) */}
          <div className="flex items-center gap-3">
            {/* Search Icon (Filled) */}
            <button className="w-10 h-10 rounded-full bg-[#171a25] flex items-center justify-center text-text-secondary hover:text-white cursor-pointer transition-all border-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#94a3b8]"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
            </button>
            
            {/* Chat Icon (Filled) */}
            <button 
               onClick={() => setChatOpen(!chatOpen)} 
               className="w-10 h-10 rounded-full bg-[#171a25] flex items-center justify-center text-text-secondary hover:text-white cursor-pointer transition-all border-0"
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

      {/* Support Chat Widget */}
      <SupportChat
        socket={socket}
        user={user}
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
