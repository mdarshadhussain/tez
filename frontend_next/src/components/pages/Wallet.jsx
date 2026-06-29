'use client';

import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ShieldCheck, CreditCard, Copy, CheckCircle2, Loader2, QrCode, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionHistory from '../TransactionHistory';
import { playClick } from '../../utils/audio';

// High-fidelity SVG brand logos
const PhonePeIcon = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mb-1">
    <rect width="38" height="38" rx="9" fill="#5f259f"/>
    <path d="M19 8C13.48 8 9 12.48 9 18C9 23.52 13.48 28 19 28C24.52 28 29 23.52 29 18C29 12.48 24.52 8 19 8ZM19 24.5C15.41 24.5 12.5 21.59 12.5 18C12.5 14.41 15.41 11.5 19 11.5C22.59 11.5 25.5 14.41 25.5 18C25.5 21.59 22.59 24.5 19 24.5Z" fill="white"/>
    <path d="M20 13.5C18.5 13.5 17.5 14.2 17.5 15.5C17.5 16.5 18.2 16.8 19 17.2C20.2 17.7 21 18.2 21 19C21 19.8 20 20.5 19 20.5C18 20.5 17.2 19.7 17.1 18.8H15.2C15.3 20.8 16.9 22.2 19 22.2C21.4 22.2 22.9 20.8 22.9 19C22.9 17.4 22 16.6 20.6 16C19.5 15.4 19 15.1 19 14.5C19 13.9 19.6 13.5 20.4 13.5C21.2 13.5 21.8 14 21.9 14.8H23.7C23.6 13.1 22.1 11.8 20 11.8V13.5Z" fill="#5f259f"/>
    <path d="M16.5 15.2V20.2" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

const GPayIcon = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mb-1">
    <rect width="38" height="38" rx="9" fill="white" stroke="#f1f3f4" strokeWidth="1"/>
    <g transform="translate(19, 19)">
      <path d="M8-2c0-.57-.05-1.12-.14-1.65H0v3.12h4.34c-.19 1.01-.76 1.86-1.62 2.44v2.03h2.62c1.53-1.41 2.4-3.49 2.4-5.94z" fill="#4285F4"/>
      <path d="M0 6c2.25 0 4.14-.75 5.52-2.03L2.9 1.94c-.73.49-1.66.78-2.9.78-2.23 0-4.12-1.51-4.79-3.53H-7.5v2.1c1.39 2.76 4.23 4.71 7.5 4.71z" fill="#34A853"/>
      <path d="M-4.8-1.2C-5-.7-.5-.2 0-.2s1 .5.8 1V-3.7H-7.5c-.6 1.1-.9 2.4-.9 3.7c0 1.3.3 2.6.9 3.7l2.7-2.1z" fill="#FBBC05"/>
      <path d="M0-6c-3.3 0-6.1 2-7.5 4.7l2.7 2.1c.7-2 2.6-3.7 4.8-3.7c1.2 0 2.3.4 3.2 1.3l2.4-2.4C4.1-5.4 2.2-6 0-6z" fill="#EA4335"/>
    </g>
    <text x="21" y="27" fill="#5f6368" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Pay</text>
  </svg>
);

const PaytmIcon = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mb-1">
    <rect width="38" height="38" rx="9" fill="#00baf2" />
    <g transform="translate(3, 11)">
      <text x="1" y="11" fill="#ffffff" fontSize="10.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.5">pay</text>
      <text x="18" y="11" fill="#002970" fontSize="10.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.5">tm</text>
    </g>
  </svg>
);

const BhimIcon = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mb-1">
    <rect width="38" height="38" rx="9" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
    <g transform="translate(3, 6)">
      <path d="M6 6L2 14H10L6 6Z" fill="#F48120" />
      <path d="M12 6L8 14H16L12 6Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
      <path d="M18 6L14 14H22L18 6Z" fill="#009A44" />
      <text x="2" y="22" fill="#002A54" fontSize="8" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.5">BHIM</text>
    </g>
  </svg>
);

export default function Wallet({ token, balance, setBalance, user }) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Payment Gateway states
  const [showGateway, setShowGateway] = useState(false);
  const [gatewayData, setGatewayData] = useState(null);
  const [depositAmtVal, setDepositAmtVal] = useState(0);
  const [utr, setUtr] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timerCount, setTimerCount] = useState(719); // 11:59 countdown

  React.useEffect(() => {
    if (!showGateway) return;
    const interval = setInterval(() => {
      setTimerCount(prev => (prev > 0 ? prev - 1 : 719));
    }, 1000);
    return () => clearInterval(interval);
  }, [showGateway]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 100) return alert('Minimum deposit amount is ₹100.00');

    setGatewayLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/payment/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setGatewayData(data.settings);
        setDepositAmtVal(amt);
        setUtr('');
        setSuccess(false);
        setCheckoutStep(1);
        setPhoneNumber(user?.phone_number || '');
        setShowGateway(true);
      } else {
        alert('Payment gateway is currently offline. Please try again later.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error launching payment gateway');
    } finally {
      setGatewayLoading(false);
    }
  };

  const submitPayment = async () => {
    if (!/^\d{12}$/.test(utr)) {
      return alert('UTR / Transaction ID must be exactly 12 digits');
    }

    setVerifying(true);
    try {
      const res = await fetch('http://localhost:3001/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: depositAmtVal, reference_id: utr })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.new_balance);
        setSuccess(true);
        setDepositAmount('');
        setTimeout(() => {
          setShowGateway(false);
          setSuccess(false);
        }, 2200);
      } else {
        alert(data.error || 'Payment validation failed');
      }
    } catch (e) {
      console.error(e);
      alert('Error validating payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid withdrawal amount');
    if (amt > balance) return alert('Insufficient balance for withdrawal');
    try {
      const res = await fetch('http://localhost:3001/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: amt })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.new_balance);
        alert(`Withdrawal of ₹${amt.toFixed(2)} successfully processed!`);
        setWithdrawAmount('');
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 pb-24 max-w-5xl mx-auto space-y-6 relative"
    >
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#3de796]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Wallet Card */}
      <div className="relative bg-slate-50 dark:bg-[#141622]/80 backdrop-blur-xl border border-black/15 dark:border-white/10 p-8 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3de796]/10 to-transparent opacity-50" />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="text-[10px] font-black text-[#3de796] tracking-[3px] uppercase block mb-2 drop-shadow-md">
              Playable Balance
            </span>
            <div className="flex items-end gap-2">
              <span className="text-2xl text-slate-900 dark:text-white/50 font-black leading-none mb-1">₹</span>
              <div className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 text-[10px] font-bold text-slate-900 dark:text-white/50 tracking-wider">
            <span className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/5">
              <ShieldCheck size={14} className="text-[#3de796]" /> Secured Encryption Gateway
            </span>
            <span className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/5">
              <CheckCircle2 size={14} className="text-blue-400" /> Account Verified
            </span>
          </div>
        </div>
      </div>

      {/* Tabs / Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deposit Column */}
        <div className="bg-slate-50 dark:bg-[#141622]/60 backdrop-blur-lg border border-[#3de796]/20 p-6 rounded-[24px] space-y-5 relative overflow-hidden group hover:border-[#3de796]/40 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#3de796]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-[#3de796]/20" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#3de796]/10 flex items-center justify-center text-[#3de796] border border-[#3de796]/30 shadow-[0_0_15px_rgba(61,231,150,0.2)]">
              <ArrowDownLeft size={20} strokeWidth={3} />
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white tracking-[0.2em] uppercase">Deposit Funds</span>
          </div>

          <div className="flex gap-2 relative z-10">
            {[100, 500, 1000].map((preset) => (
              <button
                key={preset}
                onClick={() => setDepositAmount(String(preset))}
                className="flex-1 bg-slate-100 dark:bg-[#1a1c29] border border-black/10 dark:border-white/5 hover:border-[#3de796]/50 hover:bg-[#3de796]/10 hover:text-[#3de796] rounded-xl text-slate-900 dark:text-white font-black text-xs py-3 cursor-pointer transition-all duration-200"
              >
                ₹{preset}
              </button>
            ))}
          </div>

          <div className="relative z-10">
            <input
              type="number"
              className="w-full bg-slate-100 dark:bg-[#1a1c29] border border-black/15 dark:border-white/10 focus:border-[#3de796] rounded-xl py-3.5 px-4 text-sm text-slate-900 dark:text-white font-black outline-none transition-colors"
              placeholder="Enter Amount (₹)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </div>

          <button 
            disabled={gatewayLoading}
            className="w-full py-4 rounded-xl font-black text-[13px] tracking-[2px] uppercase border-0 cursor-pointer transition-all bg-[#3de796] hover:bg-[#3de796]/90 text-[#0d1f17] shadow-lg shadow-[#3de796]/20 disabled:opacity-50 disabled:cursor-not-allowed relative z-10" 
            onClick={handleDeposit}
          >
            {gatewayLoading ? 'Launching Gateway...' : 'Instant UPI Deposit'}
          </button>
        </div>

        {/* Withdraw Column */}
        <div className="bg-slate-50 dark:bg-[#141622]/60 backdrop-blur-lg border border-red-500/20 p-6 rounded-[24px] space-y-5 relative overflow-hidden group hover:border-red-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-red-500/20" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <ArrowUpRight size={20} strokeWidth={3} />
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white tracking-[0.2em] uppercase">Withdraw Funds</span>
          </div>

          <div className="flex gap-2 relative z-10">
            {[500, 2000, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setWithdrawAmount(String(preset))}
                className="flex-1 bg-slate-100 dark:bg-[#1a1c29] border border-black/10 dark:border-white/5 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-slate-900 dark:text-white font-black text-xs py-3 cursor-pointer transition-all duration-200"
              >
                ₹{preset}
              </button>
            ))}
          </div>

          <div className="relative z-10">
            <input
              type="number"
              className="w-full bg-slate-100 dark:bg-[#1a1c29] border border-black/15 dark:border-white/10 focus:border-red-500 rounded-xl py-3.5 px-4 text-sm text-slate-900 dark:text-white font-black outline-none transition-colors"
              placeholder="Enter Amount (₹)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
          </div>

          <button 
            className="w-full py-4 rounded-xl font-black text-[13px] tracking-[2px] uppercase border-0 cursor-pointer transition-all bg-red-500 hover:bg-red-500/90 text-slate-900 dark:text-white shadow-lg shadow-red-500/20 relative z-10" 
            onClick={handleWithdraw}
          >
            Request IMPS Payout
          </button>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-[#141622]/80 border border-black/10 dark:border-white/5 p-4 rounded-[20px] flex gap-3 items-center shadow-lg">
        <CreditCard size={20} className="text-[#3de796] shrink-0" />
        <div className="text-[11px] text-slate-900 dark:text-white/60 font-medium leading-relaxed">
          Minimum transaction limit is <span className="text-slate-900 dark:text-white font-bold">₹100.00</span>. Standard verification processing cycles take 5–15 minutes.
        </div>
      </div>

      {/* Transaction History ledger list */}
      <TransactionHistory token={token} />

      {/* Dynamic Razorpay-Like UPI Gateway Modal */}
      <AnimatePresence>
        {showGateway && gatewayData && (
          <div className="fixed inset-0 bg-black/10 dark:bg-black/30 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
            
            {/* MOBILE LAYOUT (Screens < 768px) */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="flex md:hidden flex-col bg-white w-full h-full text-slate-800"
            >
              {/* HEADER BANNER */}
              <div className="bg-[#1352f1] px-5 py-4 flex flex-col select-none text-slate-900 dark:text-white shrink-0">
                {/* Top Row: Navigation and Badges */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {checkoutStep > 1 && (
                      <button 
                        onClick={() => setCheckoutStep(prev => prev - 1)}
                        className="text-slate-900 dark:text-white hover:text-slate-200 transition-colors bg-transparent border-0 cursor-pointer pr-1"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                      </button>
                    )}
                    {/* TezClub Square Logo */}
                    <div className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center font-black text-slate-900 dark:text-white text-base shadow-sm border border-black/20 dark:border-white/20">
                      T
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none">TezClub</h4>
                      <div className="mt-1 flex items-center gap-1 bg-[#10cd77] text-slate-900 dark:text-white px-1.5 py-0.5 rounded text-[8px] font-bold">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900 dark:text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Razorpay Trusted Business
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="bg-black/10 dark:bg-white/10 hover:bg-white/25 transition-all text-slate-900 dark:text-white border border-black/15 dark:border-white/10 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                      🌐 EN ▾
                    </button>
                    <button 
                      onClick={() => setShowGateway(false)}
                      className="text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition-colors bg-transparent border-0 cursor-pointer text-sm p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Step 1 Total Amount Banner */}
                {checkoutStep === 1 && (
                  <div className="mt-6 mb-3 text-center">
                    <span className="text-[10px] text-slate-900 dark:text-white/70 block uppercase tracking-wider font-semibold">Total Amount</span>
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white block mt-1">₹{depositAmtVal.toLocaleString('en-IN')}.00</span>
                  </div>
                )}
                
                {/* Secured line at bottom of blue header on step 1 */}
                {checkoutStep === 1 && (
                  <div className="text-center text-[9px] text-slate-900 dark:text-white/50 font-medium tracking-wide mt-1">
                    🔒 Secured by Razorpay
                  </div>
                )}
              </div>

              {/* BODY CONTENT AREA */}
              <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
                {success ? (
                  // Success State
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#10cd77] flex items-center justify-center border border-emerald-100 shadow-md">
                      <CheckCircle2 size={36} />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">Payment Submitted</h4>
                      <p className="text-xs text-slate-500 mt-1.5">UTR Reference #{utr} received.</p>
                      <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 mt-4 inline-block">
                        Processing time: 5-15 mins. Please check your transaction history.
                      </p>
                    </div>
                  </motion.div>
                ) : verifying ? (
                  // Verifying State
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white select-none">
                    <Loader2 size={36} className="text-[#1352f1] animate-spin" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Verifying Transaction...</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Confirming UTR ledger status. Do not close.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* STEP 1: Contact Details */}
                    {checkoutStep === 1 && (
                      <div className="flex-1 p-5 flex flex-col justify-between bg-white">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                            👤 Contact Details
                          </div>
                          
                          <div className="border border-slate-200 rounded-xl p-3 flex flex-col focus-within:border-[#1352f1] relative bg-white transition-all shadow-sm">
                            <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider absolute top-2 left-3">Phone Number</span>
                            <div className="flex items-center gap-2 mt-4">
                              <span className="text-xs font-bold text-slate-600 border-r border-slate-200 pr-2 flex items-center gap-1 select-none cursor-pointer">
                                +91 <span className="text-[9px]">▼</span>
                              </span>
                              <input 
                                type="text"
                                maxLength={10}
                                placeholder="9000900009"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                className="w-full text-sm font-bold text-slate-700 outline-none border-0 bg-transparent p-0 focus:ring-0"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-8">
                          <button
                            onClick={() => {
                              if (phoneNumber.length < 10) return alert('Please enter a valid 10-digit phone number');
                              playClick();
                              setCheckoutStep(2);
                            }}
                            className="w-full bg-[#1352f1] hover:bg-[#1149d6] text-slate-900 dark:text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-[#1352f1]/25 transition-all cursor-pointer border-0"
                          >
                            Proceed
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Payment options list */}
                    {checkoutStep === 2 && (
                      <div className="flex-1 flex flex-col justify-between bg-white">
                        <div>
                          <div className="px-5 py-4 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Cards, UPI & More
                          </div>

                          <div className="divide-y divide-slate-100">
                            {/* UPI - ACTIVE */}
                            <div 
                              onClick={() => { playClick(); setCheckoutStep(3); }}
                              className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-[#1352f1] bg-[#1352f1]/10 p-2.5 rounded-xl">
                                  <Smartphone size={20} />
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold text-slate-800 block">UPI / QR</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">PhonePe, GPay, Paytm & More</span>
                                </div>
                              </div>
                              <span className="text-xs text-[#1352f1] font-extrabold uppercase tracking-wider bg-[#1352f1]/10 px-2.5 py-1 rounded-lg">Pay</span>
                            </div>

                            {/* Card - Disabled */}
                            <div className="px-5 py-4 flex items-center justify-between opacity-50 cursor-not-allowed bg-slate-50/30">
                              <div className="flex items-center gap-4">
                                <div className="text-slate-400 bg-slate-100 p-2.5 rounded-xl">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold text-slate-600 block">Card</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">Visa, MasterCard, RuPay & More</span>
                                </div>
                              </div>
                              <span className="text-xs text-slate-400">🔒</span>
                            </div>

                            {/* Netbanking - Disabled */}
                            <div className="px-5 py-4 flex items-center justify-between opacity-50 cursor-not-allowed bg-slate-50/30">
                              <div className="flex items-center gap-4">
                                <div className="text-slate-400 bg-slate-100 p-2.5 rounded-xl">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22v-2h18v2H3zm0-2.5h18l-9-9-9 9zm2.5-9.5h2v7h-2v-7zm5 0h2v7h-2v-7zm5 0h2v7h-2v-7zM12 2L2 9.5h20L12 2z"></path></svg>
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold text-slate-600 block">Netbanking</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">All Indian banks</span>
                                </div>
                              </div>
                              <span className="text-xs text-slate-400">🔒</span>
                            </div>

                            {/* Wallet - Disabled */}
                            <div className="px-5 py-4 flex items-center justify-between opacity-50 cursor-not-allowed bg-slate-50/30">
                              <div className="flex items-center gap-4">
                                <div className="text-slate-400 bg-slate-100 p-2.5 rounded-xl">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h14v4M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6h-4z"></path></svg>
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold text-slate-600 block">Wallet</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">PhonePe & More</span>
                                </div>
                              </div>
                              <span className="text-xs text-slate-400">🔒</span>
                            </div>

                            {/* Pay Later & Transfer - Disabled */}
                            <div className="px-5 py-4 flex items-center justify-between opacity-50 cursor-not-allowed bg-slate-50/30">
                              <div className="flex items-center gap-4">
                                <div className="text-slate-400 bg-slate-100 p-2.5 rounded-xl">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="19" x2="20" y2="19"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="4" y1="11" x2="20" y2="11"></line><line x1="8" y1="7" x2="16" y2="7"></line></svg>
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold text-slate-600 block">Instant Bank Transfer</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">IMPS/NEFT Direct Rails</span>
                                </div>
                              </div>
                              <span className="text-xs text-slate-400">🔒</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer details row */}
                        <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center select-none">
                          <div className="text-left">
                            <span className="text-sm font-black text-slate-800">₹{depositAmtVal.toLocaleString('en-IN')}.00</span>
                            <span className="text-[9px] text-[#1352f1] font-bold block mt-0.5 cursor-pointer">View Details</span>
                          </div>
                          <button
                            onClick={() => { playClick(); setCheckoutStep(3); }}
                            className="bg-[#1352f1] hover:bg-[#1149d6] text-slate-900 dark:text-white px-8 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all border-0"
                          >
                            Pay Now
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: Select UPI App & Verify */}
                    {checkoutStep === 3 && (
                      <div className="flex-1 flex flex-col justify-between bg-white overflow-y-auto">
                        <div className="p-5 space-y-5">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">Select UPI App</span>
                            <div className="grid grid-cols-4 gap-2">
                              {/* PhonePe */}
                              <a
                                href={`upi://pay?pa=${gatewayData.upi_id}&pn=TezClub&am=${depositAmtVal}&cu=INR`}
                                onClick={() => playClick()}
                                className="bg-slate-50 hover:bg-purple-50/40 border border-slate-100 hover:border-purple-200 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all no-underline text-center"
                              >
                                <PhonePeIcon size={36} />
                                <span className="text-[10px] font-bold text-slate-700 block truncate w-full">PhonePe</span>
                              </a>

                              {/* GPay */}
                              <a
                                href={`upi://pay?pa=${gatewayData.upi_id}&pn=TezClub&am=${depositAmtVal}&cu=INR`}
                                onClick={() => playClick()}
                                className="bg-slate-50 hover:bg-blue-50/40 border border-slate-100 hover:border-blue-200 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all no-underline text-center"
                              >
                                <GPayIcon size={36} />
                                <span className="text-[10px] font-bold text-slate-700 block truncate w-full">GPay</span>
                              </a>

                              {/* Paytm */}
                              <a
                                href={`upi://pay?pa=${gatewayData.upi_id}&pn=TezClub&am=${depositAmtVal}&cu=INR`}
                                onClick={() => playClick()}
                                className="bg-slate-50 hover:bg-cyan-50/40 border border-slate-100 hover:border-cyan-200 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all no-underline text-center"
                              >
                                <PaytmIcon size={36} />
                                <span className="text-[10px] font-bold text-slate-700 block truncate w-full">Paytm</span>
                              </a>

                              {/* BHIM */}
                              <a
                                href={`upi://pay?pa=${gatewayData.upi_id}&pn=TezClub&am=${depositAmtVal}&cu=INR`}
                                onClick={() => playClick()}
                                className="bg-slate-50 hover:bg-emerald-50/40 border border-slate-100 hover:border-emerald-200 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all no-underline text-center"
                              >
                                <BhimIcon size={36} />
                                <span className="text-[10px] font-bold text-slate-700 block truncate w-full">BHIM</span>
                              </a>
                            </div>
                          </div>

                          {/* Dynamic QR */}
                          <div className="bg-slate-50/60 p-4 rounded-xl flex flex-col items-center justify-center border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2.5">Scan QR Code to Pay</span>
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${gatewayData.upi_id}&pn=TezClub&am=${depositAmtVal}&cu=INR`)}`} 
                              className="w-[140px] h-[140px] border border-slate-200 rounded-xl shadow-md bg-white p-1.5 select-none"
                              alt="Scan QR"
                            />
                            <span className="text-[8px] text-slate-400 font-mono mt-2 tracking-widest uppercase">SCAN WITH GPAY, PHONEPE, BHIM, ETC.</span>
                          </div>

                          {/* UPI ID copy details */}
                          <div className="bg-slate-50/60 p-3 rounded-xl flex items-center justify-between border border-slate-100 text-slate-700">
                            <div className="overflow-hidden mr-2">
                              <span className="text-[8px] text-slate-400 uppercase font-bold block mb-0.5">Copy Merchant UPI ID</span>
                              <span className="text-[10px] font-mono font-bold text-slate-800 select-all block truncate">{gatewayData.upi_id}</span>
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(gatewayData.upi_id);
                                alert('UPI ID copied!');
                              }}
                              className="bg-[#1352f1]/10 hover:bg-[#1352f1]/25 text-[#1352f1] px-3 py-1.5 rounded-lg transition-all cursor-pointer border-0 outline-none flex items-center gap-1 text-[9px] font-black uppercase tracking-wider shrink-0"
                            >
                              <Copy size={10} /> Copy
                            </button>
                          </div>

                          {/* UTR Input Form */}
                          <div className="border-t border-slate-100 pt-4 space-y-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Step 2: Enter Transaction ID (UTR)</span>
                            <p className="text-[9px] text-slate-400 leading-normal">
                              After transfer is complete, paste the 12-digit UTR/Transaction Ref number below.
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={12}
                                pattern="\d*"
                                placeholder="Enter 12-Digit Ref No. / UTR"
                                value={utr}
                                onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                                className="form-input flex-1 py-2 px-3 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 focus:border-[#1352f1] focus:ring-1 focus:ring-[#1352f1] rounded-xl tracking-wider text-center outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Footer details row for Step 3 */}
                        <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center select-none shrink-0">
                          <div className="text-left">
                            <span className="text-sm font-black text-slate-800">₹{depositAmtVal.toLocaleString('en-IN')}.00</span>
                            <span className="text-[9px] text-[#1352f1] font-bold block mt-0.5 cursor-pointer">View Details</span>
                          </div>
                          <button
                            onClick={submitPayment}
                            className="bg-[#1352f1] hover:bg-[#1149d6] text-slate-900 dark:text-white px-8 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all border-0 cursor-pointer"
                          >
                            Submit UTR
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* FOOTER BADGE BAR */}
              <div className="bg-[#f8f9fa] py-3.5 px-5 text-center border-t border-slate-100 text-[9px] text-slate-400 flex justify-between items-center select-none shrink-0">
                <span className="flex items-center gap-1">🛡️ Secured by Razorpay & UPI Rails</span>
                <button 
                  onClick={() => setShowGateway(false)} 
                  className="bg-transparent hover:text-slate-600 border-0 text-slate-400 font-bold cursor-pointer transition-colors uppercase tracking-wider text-[8px]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>

            {/* DESKTOP LAYOUT (Screens >= 768px) */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="hidden md:flex flex-row bg-white w-full max-w-[850px] h-[520px] rounded-2xl overflow-hidden shadow-2xl text-slate-800"
            >
              {/* LEFT COLUMN: Price Summary and Brand Info */}
              <div className="w-[310px] bg-[#3a8ecf] bg-gradient-to-b from-[#4a9ee0] to-[#2b7cbd] flex flex-col justify-between p-6 text-slate-900 dark:text-white select-none shrink-0 relative overflow-hidden">
                {/* Brand Header */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center font-black text-[#2b7cbd] text-lg shadow-md border border-black/20 dark:border-white/20 select-none">
                      T
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">TezClub</h4>
                      <p className="text-[10px] text-slate-900 dark:text-white/80 mt-1 flex items-center gap-0.5 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 px-1.5 py-0.5 rounded-full font-semibold">
                        <span className="text-[#10cd77]">✓</span> Razorpay Trusted Business
                      </p>
                    </div>
                  </div>

                  {/* Price Summary Card */}
                  <div className="bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-black/15 dark:border-white/10 mt-8 shadow-sm">
                    <span className="text-[10px] text-slate-900 dark:text-white/70 block uppercase tracking-wider font-extrabold">Price Summary</span>
                    <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1.5">₹{depositAmtVal.toLocaleString('en-IN')}.00</span>
                  </div>

                  {/* Phone detail indicator */}
                  <div className="bg-black/10 dark:bg-white/10 hover:bg-white/15 transition-all backdrop-blur-sm rounded-2xl px-4 py-3.5 border border-black/15 dark:border-white/10 mt-4 flex items-center justify-between text-xs cursor-pointer shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <span className="font-semibold text-slate-900 dark:text-white/90">Using as +91 {phoneNumber || '9000900009'}</span>
                    </div>
                    <span className="text-slate-900 dark:text-white/60 font-bold font-mono">&gt;</span>
                  </div>
                </div>

                {/* Shopping Bags SVG Vector Mockup */}
                <div className="opacity-15 absolute bottom-12 -left-6 scale-90 pointer-events-none select-none">
                  <svg width="240" height="180" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="30" y="50" width="70" height="90" rx="4" fill="white"/>
                    <rect x="110" y="30" width="60" height="110" rx="4" fill="white"/>
                    <path d="M50 50C50 35 80 35 80 50" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                    <path d="M125 30C125 15 155 15 155 30" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                  </svg>
                </div>

                {/* Secured Footer */}
                <div className="text-[10px] text-slate-900 dark:text-white/70 flex items-center justify-between mt-auto">
                  <span>Secured by</span>
                  <span className="font-black tracking-tighter text-slate-900 dark:text-white">razorpay</span>
                </div>
              </div>

              {/* RIGHT COLUMN: Payment Method Options & Details */}
              <div className="flex-1 bg-white flex flex-col justify-between">
                {/* Header bar */}
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center select-none">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Payment Options</span>
                  <div className="flex items-center gap-3">
                    <button className="bg-transparent hover:text-slate-600 text-slate-400 font-bold border-0 cursor-pointer text-xs p-1 select-none">•••</button>
                    <button 
                      onClick={() => setShowGateway(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 cursor-pointer text-sm p-1 select-none"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Workspace area split */}
                <div className="flex-1 flex overflow-hidden">
                  
                  {/* Internal Sidebar selector */}
                  <div className="w-[185px] border-r border-slate-100 bg-slate-50/50 py-3 flex flex-col gap-0.5 select-none shrink-0 text-left">
                    <div className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Recommended</div>
                    
                    {/* UPI Option - ACTIVE */}
                    <button className="w-full text-left px-4 py-3.5 bg-white border-l-4 border-[#1352f1] text-[#1352f1] text-[11px] font-extrabold flex items-center justify-between border-y-0 border-r-0 cursor-default select-none shadow-sm">
                      <span className="flex items-center gap-2">⚡ UPI</span>
                      <div className="flex gap-0.5 opacity-80 shrink-0">
                        <span className="text-[8px] bg-purple-100 text-purple-700 px-1 rounded font-bold">PP</span>
                        <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded font-bold">GP</span>
                      </div>
                    </button>

                    <button disabled className="w-full text-left px-4 py-3 text-slate-400 text-[10px] font-bold flex items-center justify-between border-0 bg-transparent cursor-not-allowed opacity-50 select-none">
                      <span>💳 Cards</span>
                      <div className="flex gap-0.5 shrink-0 text-[8px] border border-slate-200 px-1 rounded font-mono">VISA</div>
                    </button>

                    <button disabled className="w-full text-left px-4 py-3 text-slate-400 text-[10px] font-bold flex items-center justify-between border-0 bg-transparent cursor-not-allowed opacity-50 select-none">
                      <span>🏛️ Netbanking</span>
                    </button>

                    <button disabled className="w-full text-left px-4 py-3 text-slate-400 text-[10px] font-bold flex items-center justify-between border-0 bg-transparent cursor-not-allowed opacity-50 select-none">
                      <span>💼 Wallet</span>
                    </button>

                    <button disabled className="w-full text-left px-4 py-3 text-slate-400 text-[10px] font-bold flex items-center justify-between border-0 bg-transparent cursor-not-allowed opacity-50 select-none">
                      <span>⏳ Pay Later</span>
                    </button>
                  </div>

                  {/* Active Panel: Content details */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white flex flex-col justify-between">
                    {success ? (
                      <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="flex-1 flex flex-col items-center justify-center text-center space-y-4 bg-white py-10"
                      >
                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#10cd77] flex items-center justify-center border border-emerald-100 shadow-md">
                          <CheckCircle2 size={36} />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">Payment Submitted</h4>
                          <p className="text-xs text-slate-500 mt-1.5">UTR Reference #{utr} received.</p>
                          <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 mt-4 inline-block">
                            Processing time: 5-15 mins. Please check your transaction history.
                          </p>
                        </div>
                      </motion.div>
                    ) : verifying ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 bg-white py-14 select-none">
                        <Loader2 size={36} className="text-[#1352f1] animate-spin" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Verifying Transaction...</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Confirming UTR ledger status. Do not close.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 flex-1 flex flex-col justify-between">
                        {/* Upper UPI layout */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">UPI QR</span>
                            <span className="text-[10px] text-[#1352f1] font-mono font-bold flex items-center gap-1">
                              ⏱ {formatTimer(timerCount)}
                            </span>
                          </div>

                          {/* QR block grid */}
                          <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 shadow-sm">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(`upi://pay?pa=${gatewayData.upi_id}&pn=TezClub&am=${depositAmtVal}&cu=INR`)}`} 
                              className="w-[110px] h-[110px] border border-slate-200 rounded-lg shadow-sm bg-white p-1 select-none"
                              alt="Scan QR"
                            />
                            <div className="text-left space-y-2">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Scan with any app</span>
                              <div className="flex gap-1.5 items-center">
                                <PhonePeIcon size={24} />
                                <GPayIcon size={24} />
                                <PaytmIcon size={24} />
                                <BhimIcon size={24} />
                              </div>
                              <span className="text-[8px] text-slate-400 block leading-normal">Generate direct payment code instantly.</span>
                            </div>
                          </div>

                          {/* UPI ID copy */}
                          <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100 text-slate-700">
                            <div className="overflow-hidden mr-2">
                              <span className="text-[8px] text-slate-400 uppercase font-bold block mb-0.5">Copy Merchant UPI ID</span>
                              <span className="text-[10px] font-mono font-bold text-slate-800 select-all block truncate">{gatewayData.upi_id}</span>
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(gatewayData.upi_id);
                                alert('UPI ID copied!');
                              }}
                              className="bg-[#1352f1]/10 hover:bg-[#1352f1]/25 text-[#1352f1] px-3 py-1.5 rounded-lg transition-all cursor-pointer border-0 outline-none flex items-center gap-1 text-[9px] font-black uppercase tracking-wider shrink-0"
                            >
                              <Copy size={10} /> Copy UPI
                            </button>
                          </div>
                        </div>

                        {/* Lower UTR section */}
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">UPI ID / Number (Ref / UTR)</span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={12}
                              pattern="\d*"
                              placeholder="Enter 12-Digit Ref No. / UTR"
                              value={utr}
                              onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                              className="form-input flex-1 py-2 px-3 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 focus:border-[#1352f1] focus:ring-1 focus:ring-[#1352f1] rounded-xl tracking-wider text-center outline-none transition-all"
                            />
                            <button
                              onClick={submitPayment}
                              className="bg-[#121212] hover:bg-black text-slate-900 dark:text-white px-6 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer shadow-md select-none shrink-0"
                            >
                              Verify and Pay
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
