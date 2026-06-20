'use client';

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Shield, Lock, Phone, ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminDashboard from '../../../../components/pages/AdminDashboard';

export default function AdminLoginPage() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [phone, setPhone] = useState('9999999999');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Socket Connection setup
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, []);

  // Check current session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedToken = localStorage.getItem('token') || '';
    
    if (!savedToken) {
      setLoading(false);
      return;
    }

    fetch('http://localhost:3001/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${savedToken}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.user.phone_number === '9999999999') {
          setToken(savedToken);
          setUser(data.user);
        } else {
          // Token is valid but not an admin token
          setErrorMsg('Access denied: User is not authorized as administrator.');
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        localStorage.removeItem('token');
        setLoading(false);
      });
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setErrorMsg('Please enter both phone number and password.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, password })
      });
      const data = await res.json();
      if (data.token) {
        if (data.user && data.user.phone_number === '9999999999') {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          setUser(data.user);
        } else {
          setErrorMsg('Access denied: You are not authorized as an admin.');
        }
      } else {
        setErrorMsg(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error connecting to backend API.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setErrorMsg('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080d] flex flex-col items-center justify-center text-text-muted">
        <Loader2 className="animate-spin text-accent-orange mb-3" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest">Checking Administrator Authorization...</p>
      </div>
    );
  }

  // If successfully validated as admin, show dashboard
  if (user && user.phone_number === '9999999999' && token) {
    return (
      <div className="min-h-screen bg-[#07080d] text-white font-sans flex flex-col">
        {/* Admin Header with Logout option */}
        <header className="h-[72px] bg-bg-sidebar border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center text-accent-orange">
              <Shield size={18} />
            </div>
            <div>
              <span className="text-white text-base font-black font-sans tracking-tight italic select-none">
                TEZCLUB Admin Console
              </span>
              <span className="text-[9px] bg-accent-orange/15 text-accent-orange px-1.5 py-0.5 rounded ml-2 font-bold uppercase tracking-wider">
                System Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-xs text-text-muted hover:text-white flex items-center gap-1.5 transition-all text-decoration-none"
            >
              <ArrowLeft size={14} />
              <span>Back to Lobby</span>
            </a>
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-accent-red/20 hover:bg-accent-red/35 border border-accent-red/30 text-accent-red rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dashboard Area */}
        <main className="flex-1 overflow-y-auto">
          <AdminDashboard token={token} socket={socket} />
        </main>
      </div>
    );
  }

  // Otherwise render login screen
  return (
    <div className="min-h-screen bg-[#07080d] text-white flex flex-col justify-center items-center relative overflow-hidden p-4">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-orange/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3de796]/5 rounded-full filter blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0d0f17]/80 backdrop-blur-md border border-white/5 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent-orange/15 border border-accent-orange/25 flex items-center justify-center text-accent-orange mx-auto mb-4">
            <Shield size={32} className="animate-pulse" />
          </div>
          <span className="text-accent-orange font-black text-[10px] tracking-[4px] uppercase block mb-1">
            Master Portal Override
          </span>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">
            ADMIN GATEWAY
          </h2>
          <p className="text-text-muted text-xs mt-1">
            Access authorized for system administrators only.
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] text-text-muted font-bold block mb-1.5 uppercase">Admin Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Phone Number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-orange/40 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-text-muted font-bold block mb-1.5 uppercase">System Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-orange/40 transition-colors"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs px-4 py-3 rounded-2xl">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent-orange hover:bg-accent-orange/80 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-accent-orange/20 cursor-pointer border-0 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                <span>Authenticating System...</span>
              </>
            ) : (
              <span>Decrypt & Log In</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-[11px] text-text-muted hover:text-white transition-colors"
          >
            Return to Casino Lobby
          </a>
        </div>
      </motion.div>
    </div>
  );
}
