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
  Crown,
  Gamepad2,
  Coins,
  X,
  UserCheck
} from 'lucide-react';

import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Affiliate from './pages/Affiliate';
import Wallet from './pages/Wallet';
import VIPTasks from './pages/VIPTasks';
import AdminDashboard from './pages/AdminDashboard';

// Game components
import WinGo from './games/WinGo';
import TrxWinGo from './games/TrxWinGo';
import Crash from './games/Crash';
import Mines from './games/Mines';
import Plinko from './games/Plinko';
import Limbo from './games/Limbo';
import Roulette from './games/Roulette';
import Dice from './games/Dice';
import CoinFlip from './games/CoinFlip';
import Hilo from './games/Hilo';
import Keno from './games/Keno';
import Goal from './games/Goal';
import Hotline from './games/Hotline';
import Chicken from './games/Chicken';

// Helpers
import ChatRain from './components/ChatRain';
import AdminPanel from './components/AdminPanel';
import { toggleAudio, playClick } from './utils/audio';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [playableBalance, setPlayableBalance] = useState(0);
  const [vipLevel, setVipLevel] = useState(1);

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Demo Mode State
  const [isDemo, setIsDemo] = useState(false);
  const [demoBalance, setDemoBalance] = useState(() => {
    const saved = localStorage.getItem('demo_balance');
    return saved !== null ? parseFloat(saved) : 10000.00;
  });

  const updateDemoBalance = (newBal) => {
    setDemoBalance((prev) => {
      const val = typeof newBal === 'function' ? newBal(prev) : newBal;
      localStorage.setItem('demo_balance', val.toString());
      return val;
    });
  };

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

  // Action Guard: Blocks guests and prompts Login Modal (bypassed if Demo Mode is active)
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

  return (
    <div className="app-container">
      
      {/* 1. LEFT SIDEBAR — 1win style */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Logo */}
          <div className="sidebar-logo">
            <Gamepad2 size={22} color="var(--accent-green)" />
            <span style={{ color: '#fff' }}>TEZ<span style={{ color: 'var(--accent-green)' }}>CLUB</span></span>
          </div>

          {/* Sidebar Menu */}
          <div className="sidebar-menu">
            <span className="sidebar-menu-label">Main</span>
            <div className={`sidebar-item ${activeTab === 'home' && !gameMode ? 'active' : ''}`} onClick={() => { setGameMode(null); setActiveTab('home'); setSidebarOpen(false); }}>
              <HomeIcon size={16} />
              <span>Home</span>
            </div>

            <span className="sidebar-menu-label">Casino</span>
            <div className={`sidebar-item ${gameMode === 'crash' ? 'active' : ''}`} onClick={() => { playClick(); actionGuard(() => setGameMode('crash')); setSidebarOpen(false); }}>
              <Sparkles size={16} />
              <span>Aviator</span>
            </div>
            <div className={`sidebar-item ${gameMode === 'mines' ? 'active' : ''}`} onClick={() => { playClick(); actionGuard(() => setGameMode('mines')); setSidebarOpen(false); }}>
              <Gamepad2 size={16} />
              <span>Mines</span>
            </div>
            <div className={`sidebar-item ${gameMode === 'plinko' ? 'active' : ''}`} onClick={() => { playClick(); actionGuard(() => setGameMode('plinko')); setSidebarOpen(false); }}>
              <Crown size={16} />
              <span>Plinko</span>
            </div>

            <span className="sidebar-menu-label">Community</span>
            <div className={`sidebar-item ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => { setGameMode(null); setActiveTab('leaderboard'); setSidebarOpen(false); }}>
              <Trophy size={16} />
              <span>Leaderboard</span>
            </div>
            <div className={`sidebar-item ${activeTab === 'affiliate' ? 'active' : ''}`} onClick={() => actionGuard(() => { setGameMode(null); setActiveTab('affiliate'); setSidebarOpen(false); })}>
              <Users size={16} />
              <span>Affiliate</span>
            </div>
            <div className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => actionGuard(() => { setGameMode(null); setActiveTab('tasks'); setSidebarOpen(false); })}>
              <Calendar size={16} />
              <span>Promotions</span>
            </div>

            {user && user.phone_number === '9999999999' && (
              <>
                <span className="sidebar-menu-label">Admin</span>
                <div className={`sidebar-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => { setGameMode(null); setActiveTab('admin'); setSidebarOpen(false); }}>
                  <Shield size={16} />
                  <span>Dashboard</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(46, 230, 90, 0.04)',
              border: '1px solid rgba(46, 230, 90, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)' }}>
              <Sparkles size={12} />
              <span>Rain Bot Active</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.3 }}>
              Random rewards drop in live chat
            </p>
          </div>

          {token ? (
            <div className="sidebar-item" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </div>
          ) : (
            <div className="sidebar-item" onClick={() => setShowLoginModal(true)} style={{ color: 'var(--accent-green)' }}>
              <UserCheck size={16} />
              <span>Sign In</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN CONTENT BODY */}
      <div className="main-wrapper">
        {/* Admin panel */}
        {user && user.phone_number === '9999999999' && (
          <AdminPanel token={token} socket={socket} user={user} setPlayableBalance={setPlayableBalance} />
        )}

        {/* TOP HEADER BAR — 1win style */}
        <div className="header-bar">
          
          {/* Left Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Menu className="menu-btn" size={22} style={{ color: '#fff', cursor: 'pointer', display: 'none' }} onClick={() => setSidebarOpen(!sidebarOpen)} />
            
            {/* Header Navigation */}
            <div style={{ display: 'flex', gap: '4px' }} className="header-nav-links">
              {[
                { label: 'Casino', tab: 'home', icon: '🎰' },
                { label: 'Sports', tab: null, icon: '⚽' },
                { label: 'Live Games', tab: 'home', icon: '🎯' },
                { label: 'Promotions', tab: 'tasks', icon: '🎁' }
              ].map((nav) => (
                <button
                  key={nav.label}
                  onClick={() => {
                    playClick();
                    setGameMode(null);
                    if (nav.tab) setActiveTab(nav.tab);
                    else alert(`${nav.label} coming soon!`);
                  }}
                  style={{
                    background: activeTab === nav.tab && !gameMode ? 'rgba(46, 230, 90, 0.08)' : 'transparent',
                    color: activeTab === nav.tab && !gameMode ? '#fff' : 'var(--text-secondary)',
                    border: activeTab === nav.tab && !gameMode ? '1px solid rgba(46, 230, 90, 0.15)' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-primary)'
                  }}
                  onMouseEnter={(e) => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => {
                    if (activeTab !== nav.tab || gameMode) {
                      e.target.style.color = 'var(--text-secondary)';
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{nav.icon}</span>
                  {nav.label}
                </button>
              ))}
            </div>

            {gameMode && (
              <button
                onClick={() => setGameMode(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)', padding: '6px 14px',
                  color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-primary)'
                }}
              >
                <ArrowLeft size={14} />
                Back to Lobby
              </button>
            )}
          </div>

          {/* Right Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            {/* Real / Demo Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: isDemo ? 'var(--text-muted)' : 'var(--accent-green)' }}>REAL</span>
              <div 
                onClick={() => { playClick(); setIsDemo(!isDemo); }} 
                style={{
                  width: '34px', height: '18px', borderRadius: '9px',
                  background: isDemo ? 'var(--accent-green)' : 'rgba(255,255,255,0.08)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                }}
              >
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '2px', left: isDemo ? '18px' : '2px', transition: 'left 0.2s'
                }} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: isDemo ? 'var(--accent-green)' : 'var(--text-muted)' }}>DEMO</span>
            </div>

            {/* Balance Display */}
            <div
              onClick={() => {
                if (isDemo) { updateDemoBalance(10000.00); alert('Demo balance refilled!'); }
                else { setGameMode(null); setActiveTab('wallet'); }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--bg-card)', padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isDemo ? 'rgba(46,230,90,0.2)' : 'var(--border-color)'}`,
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}
            >
              <Coins size={14} color={isDemo ? 'var(--accent-green)' : 'var(--accent-orange)'} />
              <span className="monospace-ledger" style={{ fontWeight: 700, color: isDemo ? 'var(--accent-green)' : '#fff', fontSize: '13px' }}>
                {isDemo ? `₹${demoBalance.toFixed(2)}` : `₹${playableBalance.toFixed(2)}`}
              </span>
            </div>

            {/* Deposit Button */}
            <button 
              className="action-btn" 
              style={{ padding: '6px 18px', fontSize: '12px' }} 
              onClick={() => { setGameMode(null); setActiveTab('wallet'); }}
            >
              Deposit
            </button>

            {/* Avatar */}
            <div 
              style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))', 
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: '#fff', fontSize: '12px', cursor: 'pointer'
              }}
              onClick={() => { if (!token) setShowLoginModal(true); else setActiveTab('wallet'); }}
            >
              {user ? user.phone_number?.slice(-2) : '👤'}
            </div>

            {/* Sound Toggle */}
            <div
              onClick={() => setSoundOn(!soundOn)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', padding: '4px' }}
            >
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </div>
          </div>
        </div>

        {/* Content routing area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {gameMode ? renderGame() : renderActiveTab()}
        </div>
      </div>

      {/* Community Chat rain overlay drawer (Action guarded inside ChatRain for sending) */}
      <ChatRain
        socket={socket}
        user={user}
        vipLevel={vipLevel}
        playableBalance={playableBalance}
        setPlayableBalance={setPlayableBalance}
      />

      {/* 3. LOGIN/REGISTER MODAL OVERLAY */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}
        >
          <div
            style={{
              width: '90%', maxWidth: '380px', padding: '32px',
              position: 'relative', background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
            }}
          >
            <X
              size={18}
              style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', color: 'var(--text-muted)' }}
              onClick={() => setShowLoginModal(false)}
            />

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>
                TEZ<span style={{ color: 'var(--accent-green)' }}>CLUB</span>
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                {isRegister ? 'Create a new account' : 'Sign in to your account'}
              </p>
            </div>

            <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" className="form-input" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input type="password" className="form-input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {isRegister && (
                <input type="text" className="form-input" placeholder="Referral Code (Optional)" value={refCode} onChange={(e) => setRefCode(e.target.value)} />
              )}
              <button type="submit" className="action-btn" style={{ marginTop: '4px', padding: '12px', fontSize: '14px', width: '100%' }}>
                {isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </span>{' '}
              <span
                style={{ color: 'var(--accent-green)', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? 'Sign In' : 'Register'}
              </span>
            </div>

            <div style={{ marginTop: '18px', fontSize: '11px', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: 'var(--text-muted)' }}>Demo Credentials:</strong>
              <div style={{ marginTop: '4px' }}>Phone: <code style={{ color: 'var(--accent-green)' }}>9999999999</code></div>
              <div>Password: <code style={{ color: 'var(--accent-green)' }}>admin123</code></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
