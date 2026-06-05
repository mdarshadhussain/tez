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
  UserCheck,
  Sun,
  Moon
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
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      
      {/* 1. LEFT SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Logo */}
          <div className="sidebar-logo">
            <Gamepad2 size={24} color="var(--action-highlight)" />
            <span>TEZ<span style={{ color: 'var(--action-highlight)' }}>CLUB</span></span>
          </div>

          {/* Sidebar Menu Navigation */}
          <div className="sidebar-menu">
            <span className="sidebar-menu-label">Casino Originals</span>
            <div className={`sidebar-item ${activeTab === 'home' && !gameMode ? 'active' : ''}`} onClick={() => { setGameMode(null); setActiveTab('home'); setSidebarOpen(false); }}>
              <HomeIcon size={18} />
              <span>All Games</span>
            </div>

            <span className="sidebar-menu-label">Leaderboards & Promos</span>
            <div className={`sidebar-item ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => { setGameMode(null); setActiveTab('leaderboard'); setSidebarOpen(false); }}>
              <Trophy size={18} />
              <span>Contests</span>
            </div>
            <div className={`sidebar-item ${activeTab === 'affiliate' ? 'active' : ''}`} onClick={() => actionGuard(() => { setGameMode(null); setActiveTab('affiliate'); setSidebarOpen(false); })}>
              <Users size={18} />
              <span>Affiliate Hub</span>
            </div>
            <div className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => actionGuard(() => { setGameMode(null); setActiveTab('tasks'); setSidebarOpen(false); })}>
              <Calendar size={18} />
              <span>Daily Tasks</span>
            </div>

            {user && user.phone_number === '9999999999' && (
              <>
                <span className="sidebar-menu-label">Administration</span>
                <div className={`sidebar-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => { setGameMode(null); setActiveTab('admin'); setSidebarOpen(false); }}>
                  <Shield size={18} />
                  <span>Admin Console</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar Footer Details */}
        <div className="sidebar-footer">
          {/* Rain Bot Info card */}
          <div
            className="frosted-card"
            style={{
              margin: 0,
              padding: '12px',
              border: '1px solid rgba(46, 252, 138, 0.1)',
              background: 'linear-gradient(135deg, rgba(46, 252, 138, 0.05) 0%, rgba(0, 0, 0, 0) 100%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#fff' }}>
              <Sparkles size={14} color="var(--action-highlight)" />
              <span>Rain Bot Active</span>
            </div>
            <p style={{ fontSize: '9px', color: '#8a9ca8', marginTop: '4px' }}>
              Micro-envelope cascades drop randomly inside the live chat.
            </p>
          </div>

          {token ? (
            <div className="sidebar-item" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout Account</span>
            </div>
          ) : (
            <div className="sidebar-item" onClick={() => setShowLoginModal(true)}>
              <UserCheck size={18} color="var(--action-highlight)" />
              <span>Sign In Wallet</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN CONTENT BODY */}
      <div className="main-wrapper">
        {/* Admin overrides trigger banner panel */}
        {user && user.phone_number === '9999999999' && (
          <AdminPanel token={token} socket={socket} user={user} setPlayableBalance={setPlayableBalance} />
        )}

        {/* TOP HEADER BAR */}
        <div className="header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Menu className="menu-btn" size={24} style={{ color: '#fff', cursor: 'pointer', display: 'none' }} onClick={() => setSidebarOpen(!sidebarOpen)} />
            
            {gameMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setGameMode(null)}>
                <ArrowLeft size={18} color="#fff" />
                <span style={{ fontWeight: 800, fontSize: '16px', textTransform: 'capitalize' }}>
                  {gameMode === 'bigsmall' ? 'Big / Small' : gameMode}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Demo Mode Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: isDemo ? '#8a9ca8' : 'var(--action-highlight)' }}>REAL</span>
              <div 
                onClick={() => { playClick(); setIsDemo(!isDemo); }} 
                style={{
                  width: '38px',
                  height: '20px',
                  borderRadius: '10px',
                  background: isDemo ? 'var(--success-layer)' : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: '2px',
                  left: isDemo ? '20px' : '2px',
                  transition: 'left 0.2s'
                }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: isDemo ? 'var(--success-layer)' : '#8a9ca8' }}>DEMO</span>
            </div>

            {isDemo ? (
              <>
                {/* Demo Wallet Panel */}
                <div
                  className="frosted-card row"
                  style={{
                    margin: 0,
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderColor: 'var(--success-layer)',
                    cursor: 'pointer'
                  }}
                  title="Click to Refill Demo Balance"
                  onClick={() => { playClick(); updateDemoBalance(10000.00); alert('Demo Balance refilled to ₹10,000.00!'); }}
                >
                  <Coins size={14} color="var(--success-layer)" style={{ marginRight: '8px' }} />
                  <span className="monospace-ledger" style={{ fontWeight: 800, color: 'var(--success-layer)', fontSize: '15px' }}>
                    ₹{demoBalance.toFixed(2)}
                  </span>
                </div>
              </>
            ) : token ? (
              <>
                {/* Wallet Panel */}
                <div
                  className="frosted-card row"
                  style={{
                    margin: 0,
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    borderColor: 'var(--border-glass)'
                  }}
                  onClick={() => { setGameMode(null); setActiveTab('wallet'); }}
                >
                  <Coins size={14} color="var(--action-highlight)" style={{ marginRight: '8px' }} />
                  <span className="monospace-ledger" style={{ fontWeight: 800, color: 'var(--action-highlight)', fontSize: '15px' }}>
                    ₹{playableBalance.toFixed(2)}
                  </span>
                </div>

                {/* Quick Wallet CTA Buttons */}
                <button className="action-btn" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => { setGameMode(null); setActiveTab('wallet'); }}>
                  Deposit
                </button>

                {/* User Profile VIP state */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--vip-status)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '12px',
                      color: '#000',
                      boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)'
                    }}
                  >
                    V{vipLevel}
                  </div>
                </div>
              </>
            ) : (
              <button className="action-btn" style={{ padding: '8px 18px', fontSize: '13px' }} onClick={() => setShowLoginModal(true)}>
                Sign In / Register
              </button>
            )}

            {/* Theme Switch */}
            <div
              onClick={() => { playClick(); setTheme(theme === 'dark' ? 'light' : 'dark'); }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#8a9ca8' }}
              title="Toggle color theme mode"
            >
              {theme === 'dark' ? <Sun size={18} color="var(--success-layer)" style={{ marginRight: '8px' }} /> : <Moon size={18} color="var(--purple-accent)" style={{ marginRight: '8px' }} />}
            </div>

            {/* Sound Toggle */}
            <div
              onClick={() => setSoundOn(!soundOn)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#8a9ca8' }}
            >
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
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
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 10, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            className="frosted-card"
            style={{
              width: '90%',
              maxWidth: '400px',
              padding: '30px',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Close button */}
            <X
              size={20}
              style={{ position: 'absolute', top: '20px', right: '20px', cursor: 'pointer', color: '#8a9ca8' }}
              onClick={() => setShowLoginModal(false)}
            />

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff' }}>
                TEZ<span style={{ color: 'var(--action-highlight)' }}>CLUB</span>
              </h2>
              <p style={{ color: '#8a9ca8', fontSize: '13px', marginTop: '6px' }}>
                {isRegister ? 'Create your iGaming wallet account' : 'Verify credential ledger to play'}
              </p>
            </div>

            <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Phone Number (e.g. 9999999999)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                type="password"
                className="form-input"
                placeholder="Security PIN / Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {isRegister && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Referral Invite Code (Optional)"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                />
              )}

              <button type="submit" className="action-btn" style={{ marginTop: '6px' }}>
                {isRegister ? 'Register Account' : 'Verify Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
              <span style={{ color: '#8a9ca8' }}>
                {isRegister ? 'Already have an account?' : "New to TEZCLUB?"}
              </span>{' '}
              <span
                style={{ color: 'var(--action-highlight)', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? 'Sign In' : 'Create Wallet Account'}
              </span>
            </div>

            {/* Test Admin Seeds Info */}
            <div className="frosted-card" style={{ marginTop: '20px', fontSize: '11px', color: '#888', background: 'rgba(255,255,255,0.01)', padding: '12px' }}>
              <strong>Demo Admin Credentials:</strong>
              <div style={{ marginTop: '4px' }}>Phone: <code>9999999999</code></div>
              <div>Password: <code>admin123</code></div>
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
