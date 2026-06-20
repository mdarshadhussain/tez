'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Flame, Play, AlertCircle, TrendingUp, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startRocketHum, updateRocketHum, stopRocketHum, playExplosion, playWinChime, playClick } from '../utils/audio';

export default function Crash({ socket, user, playableBalance, setPlayableBalance, isDemo }) {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, crashed
  const [multiplier, setMultiplier] = useState(1.00);
  const [history, setHistory] = useState([1.12, 2.54, 1.05, 8.42, 1.88, 14.20, 2.10, 1.00, 3.45]);
  const [waitingTimer, setWaitingTimer] = useState(5);

  // Panel A State
  const [tabA, setTabA] = useState('manual');
  const [betAmountA, setBetAmountA] = useState('50');
  const [autoCashA, setAutoCashA] = useState(true);
  const [autoCashValueA, setAutoCashValueA] = useState('2.00');
  const [betA, setBetA] = useState({ amount: '50', hasBet: false, cashedOut: false, wonAmount: 0 });
  const [isAutoplayRunningA, setIsAutoplayRunningA] = useState(false);
  const [autoBetsRemainingA, setAutoBetsRemainingA] = useState(0);
  const [totalWageredA, setTotalWageredA] = useState(0);
  const [totalProfitA, setTotalProfitA] = useState(0);

  // Panel B State
  const [tabB, setTabB] = useState('manual');
  const [betAmountB, setBetAmountB] = useState('50');
  const [autoCashB, setAutoCashB] = useState(false);
  const [autoCashValueB, setAutoCashValueB] = useState('2.00');
  const [betB, setBetB] = useState({ amount: '50', hasBet: false, cashedOut: false, wonAmount: 0 });
  const [isAutoplayRunningB, setIsAutoplayRunningB] = useState(false);
  const [autoBetsRemainingB, setAutoBetsRemainingB] = useState(0);
  const [totalWageredB, setTotalWageredB] = useState(0);
  const [totalProfitB, setTotalProfitB] = useState(0);

  const [numberOfBets, setNumberOfBets] = useState('0');
  const [winNotification, setWinNotification] = useState(null);

  const canvasRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const triggeredCashoutRef = useRef({ A: false, B: false });

  // Parallax Clouds state array
  const cloudsRef = useRef([
    { x: 100, y: 40, scale: 0.8, speed: 0.4 },
    { x: 320, y: 110, scale: 1.1, speed: 0.7 },
    { x: 50, y: 190, scale: 0.5, speed: 0.3 },
    { x: 480, y: 70, scale: 1.2, speed: 0.9 },
    { x: 220, y: 220, scale: 0.7, speed: 0.5 },
  ]);

  // References to keep state values alive inside socket events (to bypass React closure stale state)
  const stateRef = useRef({
    gameState: 'waiting',
    multiplier: 1.00,
    betA,
    betB,
    autoCashA,
    autoCashValueA,
    autoCashB,
    autoCashValueB,
    playableBalance,
    isAutoplayRunningA,
    isAutoplayRunningB,
    autoBetsRemainingA,
    autoBetsRemainingB,
    betAmountA,
    betAmountB
  });

  useEffect(() => {
    stateRef.current = {
      gameState,
      multiplier,
      betA,
      betB,
      autoCashA,
      autoCashValueA,
      autoCashB,
      autoCashValueB,
      playableBalance,
      isAutoplayRunningA,
      isAutoplayRunningB,
      autoBetsRemainingA,
      autoBetsRemainingB,
      betAmountA,
      betAmountB
    };
  }, [
    gameState, multiplier, betA, betB, autoCashA, autoCashValueA, autoCashB, autoCashValueB,
    playableBalance, isAutoplayRunningA, isAutoplayRunningB, autoBetsRemainingA, autoBetsRemainingB,
    betAmountA, betAmountB
  ]);

  // Handle countdown timer when waiting
  useEffect(() => {
    if (gameState === 'waiting') {
      setWaitingTimer(10);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setWaitingTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setWaitingTimer(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState]);

  const multiplyBetA = (factor) => {
    playClick();
    const current = parseFloat(betAmountA);
    if (!isNaN(current)) {
      setBetAmountA((current * factor).toFixed(2));
    }
  };

  const multiplyBetB = (factor) => {
    playClick();
    const current = parseFloat(betAmountB);
    if (!isNaN(current)) {
      setBetAmountB((current * factor).toFixed(2));
    }
  };

  // Handle socket connections & resolutions
  useEffect(() => {
    if (!socket) return;

    socket.on('crash_state', (data) => {
      setGameState(data.state);
      setMultiplier(data.multiplier);

      if (data.state === 'playing') {
        startRocketHum();
        updateRocketHum(data.multiplier);

        // Auto Cashout checks
        const { betA: curA, betB: curB, autoCashA: acA, autoCashValueA: acvA, autoCashB: acB, autoCashValueB: acvB } = stateRef.current;
        
        // Panel A auto-cashout check
        if (curA.hasBet && !curA.cashedOut && acA && !triggeredCashoutRef.current.A) {
          const limit = parseFloat(acvA);
          if (data.multiplier >= limit) {
            triggeredCashoutRef.current.A = true;
            triggerCashout('A', limit);
          }
        }

        // Panel B auto-cashout check
        if (curB.hasBet && !curB.cashedOut && acB && !triggeredCashoutRef.current.B) {
          const limit = parseFloat(acvB);
          if (data.multiplier >= limit) {
            triggeredCashoutRef.current.B = true;
            triggerCashout('B', limit);
          }
        }

      } else if (data.state === 'crashed') {
        stopRocketHum();
        playExplosion();
        crashTimeRef.current = Date.now();

        // Push new result to history
        setHistory(prev => [data.multiplier, ...prev.slice(0, 15)]);

        // Check if bets crashed (lost)
        const {
          betA: curA, betB: curB,
          isAutoplayRunningA: isAutoA, isAutoplayRunningB: isAutoB,
          betAmountA: curAmtA, betAmountB: curAmtB
        } = stateRef.current;

        // Process Panel A Loss
        if (curA.hasBet && !curA.cashedOut) {
          setBetA(prev => ({ ...prev, hasBet: false }));
          if (isAutoA) {
            setTotalProfitA(prev => prev - parseFloat(curAmtA));
          }
        }

        // Process Panel B Loss
        if (curB.hasBet && !curB.cashedOut) {
          setBetB(prev => ({ ...prev, hasBet: false }));
          if (isAutoB) {
            setTotalProfitB(prev => prev - parseFloat(curAmtB));
          }
        }

        // Handle Autoplay A decrements
        if (isAutoA) {
          const { autoBetsRemainingA: remainingA } = stateRef.current;
          if (remainingA > 0 && remainingA !== 999999) {
            const nextRemaining = remainingA - 1;
            setAutoBetsRemainingA(nextRemaining);
            if (nextRemaining === 0) {
              setIsAutoplayRunningA(false);
            }
          }
        }

        // Handle Autoplay B decrements
        if (isAutoB) {
          const { autoBetsRemainingB: remainingB } = stateRef.current;
          if (remainingB > 0 && remainingB !== 999999) {
            const nextRemaining = remainingB - 1;
            setAutoBetsRemainingB(nextRemaining);
            if (nextRemaining === 0) {
              setIsAutoplayRunningB(false);
            }
          }
        }

      } else if (data.state === 'waiting') {
        stopRocketHum();
        
        // Reset local cashout flags for new round
        triggeredCashoutRef.current = { A: false, B: false };
        
        // Reset bet status
        setBetA(prev => ({ ...prev, hasBet: false, cashedOut: false, wonAmount: 0 }));
        setBetB(prev => ({ ...prev, hasBet: false, cashedOut: false, wonAmount: 0 }));

        // Handle Auto-Bet/Autoplay triggers
        const { isAutoplayRunningA: isAutoA, isAutoplayRunningB: isAutoB } = stateRef.current;
        if (isAutoA) {
          setTimeout(() => {
            triggerPlaceBet('A');
          }, 400);
        }
        if (isAutoB) {
          setTimeout(() => {
            triggerPlaceBet('B');
          }, 800);
        }
      }
    });

    socket.on('bet_placed_success', (data) => {
      if (data.game === 'crash' && !isDemo) {
        setPlayableBalance(data.balance);
      }
    });

    socket.on('crash_cashout_success', (data) => {
      if (!isDemo) {
        setPlayableBalance(data.balance);
        playWinChime();
      }
    });

    return () => {
      stopRocketHum();
      socket.off('crash_state');
      socket.off('bet_placed_success');
      socket.off('crash_cashout_success');
    };
  }, [socket, isDemo]);

  // Place Bet trigger logic
  const triggerPlaceBet = async (panel) => {
    const {
      gameState: curState, playableBalance: curBalance,
      betAmountA: curAmtA, betAmountB: curAmtB,
      isAutoplayRunningA: isAutoA, isAutoplayRunningB: isAutoB
    } = stateRef.current;

    if (curState !== 'waiting' || waitingTimer <= 2) return;

    const amt = parseFloat(panel === 'A' ? curAmtA : curAmtB);
    const isAuto = panel === 'A' ? isAutoA : isAutoB;

    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > curBalance) {
      if (isAuto) {
        alert(`Autoplay Panel ${panel} stopped: Insufficient balance`);
        if (panel === 'A') setIsAutoplayRunningA(false);
        else setIsAutoplayRunningB(false);
      } else {
        alert('Insufficient balance');
      }
      return;
    }

    if (panel === 'A') {
      setBetA({ amount: curAmtA, hasBet: true, cashedOut: false, wonAmount: 0 });
      if (isAuto) setTotalWageredA(prev => prev + amt);
    } else {
      setBetB({ amount: curAmtB, hasBet: true, cashedOut: false, wonAmount: 0 });
      if (isAuto) setTotalWageredB(prev => prev + amt);
    }

    if (isDemo) {
      setPlayableBalance(prev => prev - amt);
    } else {
      socket.emit('place_bet', {
        userId: user.id,
        game: 'crash',
        amount: amt
      });
    }
  };

  // Cashout trigger logic
  const triggerCashout = async (panel, targetMult = null) => {
    const {
      gameState: curState, multiplier: curMult,
      betA: curBetA, betB: curBetB,
      isAutoplayRunningA: isAutoA, isAutoplayRunningB: isAutoB
    } = stateRef.current;

    if (curState !== 'playing') return;

    const curBet = panel === 'A' ? curBetA : curBetB;
    const isAuto = panel === 'A' ? isAutoA : isAutoB;

    if (!curBet.hasBet || curBet.cashedOut) return;

    const mult = targetMult || curMult;
    const payout = parseFloat((parseFloat(curBet.amount) * mult).toFixed(2));

    if (panel === 'A') {
      setBetA(prev => ({ ...prev, cashedOut: true, wonAmount: payout }));
      if (isAuto) setTotalProfitA(prev => prev + (payout - parseFloat(curBet.amount)));
    } else {
      setBetB(prev => ({ ...prev, cashedOut: true, wonAmount: payout }));
      if (isAuto) setTotalProfitB(prev => prev + (payout - parseFloat(curBet.amount)));
    }

    setWinNotification({ amount: payout, panel });
    setTimeout(() => {
      setWinNotification(null);
    }, 3000);

    if (isDemo) {
      setPlayableBalance(prev => prev + payout);
      playWinChime();
    } else {
      socket.emit('crash_cashout', { userId: user.id });
    }
  };

  const handleAutoplayToggleA = () => {
    if (isAutoplayRunningA) {
      setIsAutoplayRunningA(false);
      return;
    }

    const amt = parseFloat(betAmountA);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    setIsAutoplayRunningA(true);
    setTotalWageredA(0);
    setTotalProfitA(0);

    const betsCount = parseInt(numberOfBets);
    const infinite = betsCount === 0;
    const remaining = infinite ? 999999 : betsCount;
    setAutoBetsRemainingA(remaining);

    if (gameState === 'waiting' && !betA.hasBet) {
      triggerPlaceBet('A');
    }
  };

  const handleAutoplayToggleB = () => {
    if (isAutoplayRunningB) {
      setIsAutoplayRunningB(false);
      return;
    }

    const amt = parseFloat(betAmountB);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    setIsAutoplayRunningB(true);
    setTotalWageredB(0);
    setTotalProfitB(0);

    const betsCount = parseInt(numberOfBets);
    const infinite = betsCount === 0;
    const remaining = infinite ? 999999 : betsCount;
    setAutoBetsRemainingB(remaining);

    if (gameState === 'waiting' && !betB.hasBet) {
      triggerPlaceBet('B');
    }
  };

  const starsRef = useRef(
    Array.from({ length: 45 }, () => ({
      x: Math.random() * 600,
      y: Math.random() * 280,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.4 + 0.1,
      twinkleSpeed: Math.random() * 0.05 + 0.01,
      phase: Math.random() * Math.PI
    }))
  );
  
  const trailRef = useRef([]);
  const explosionParticlesRef = useRef([]);
  const lastStateRef = useRef('waiting');
  const animatedMultiplierRef = useRef(1.00);
  const crashTimeRef = useRef(0);
  const shockwaveRef = useRef(null);

  // Canvas parabolic rocket trajectory rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    
    let animationFrameId;

    const render = () => {
      if (gameState === 'playing') {
        animatedMultiplierRef.current += (multiplier - animatedMultiplierRef.current) * 0.2;
      } else if (gameState === 'waiting') {
        animatedMultiplierRef.current = 1.00;
      } else {
        animatedMultiplierRef.current = multiplier;
      }

      ctx.clearRect(0, 0, W, H);

      // 1. Space gradient background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#090a10');
      skyGrad.addColorStop(0.5, '#0f111a');
      skyGrad.addColorStop(1, '#1b1429');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Camera shake calculations on crash
      let shakeX = 0;
      let shakeY = 0;
      if (gameState === 'crashed' && crashTimeRef.current) {
        const elapsed = Date.now() - crashTimeRef.current;
        if (elapsed < 500) {
          const intensity = (1 - elapsed / 500) * 12;
          shakeX = (Math.random() - 0.5) * intensity;
          shakeY = (Math.random() - 0.5) * intensity;
        }
      }
      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 2. Starfield
      ctx.fillStyle = '#ffffff';
      for (const star of starsRef.current) {
        if (gameState === 'playing') {
          star.x -= star.speed * (animatedMultiplierRef.current * 1.8);
        } else {
          star.x -= star.speed * 0.4;
        }
        if (star.x < 0) {
          star.x = W;
          star.y = Math.random() * H;
        }
        star.phase += star.twinkleSpeed;
        const opacity = 0.3 + Math.abs(Math.sin(star.phase)) * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Gridlines
      const timeTick = Date.now() * 0.05;
      const scrollSpeed = gameState === 'playing' ? (animatedMultiplierRef.current * 2.2) : 0.5;
      const gridOffset = (timeTick * scrollSpeed) % 40;

      ctx.strokeStyle = 'rgba(155, 81, 224, 0.06)';
      ctx.lineWidth = 1.5;
      for (let i = -gridOffset; i < W; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, H);
        ctx.stroke();
      }
      for (let i = 0; i < H; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i);
        ctx.stroke();
      }

      // 4. Parallax clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      for (const cloud of cloudsRef.current) {
        cloud.x -= scrollSpeed * 0.3 * cloud.speed;
        cloud.y += scrollSpeed * 0.1 * cloud.speed;
        if (cloud.x < -100 * cloud.scale) cloud.x = W + 100 * cloud.scale;
        if (cloud.y > H + 60 * cloud.scale) {
          cloud.y = -60 * cloud.scale;
          cloud.x = Math.random() * W;
        }
        ctx.beginPath();
        const r = 18 * cloud.scale;
        ctx.arc(cloud.x, cloud.y, r, 0, Math.PI * 2);
        ctx.arc(cloud.x + r * 0.9, cloud.y - r * 0.3, r * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x + r * 1.5, cloud.y + r * 0.1, r * 0.9, 0, Math.PI * 2);
        ctx.arc(cloud.x - r * 0.8, cloud.y + r * 0.2, r * 0.7, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      const getProgress = (mult) => {
        if (mult <= 1.5) {
          return Math.max(0, mult - 1);
        } else {
          return Math.min(1, 0.5 + 0.5 * ((mult - 1.5) / 3.5));
        }
      };

      // 5. Explosion particles on crash
      if (gameState === 'crashed' && lastStateRef.current !== 'crashed') {
        crashTimeRef.current = Date.now();
        const progress = getProgress(animatedMultiplierRef.current);
        const startX = 40;
        const startY = H - 40;
        const endX = startX + (W - 140) * progress;
        const endY = startY - (H - 100) * Math.pow(progress, 1.8);

        // Shockwave Ring
        shockwaveRef.current = {
          x: endX,
          y: endY,
          radius: 0,
          maxRadius: 85,
          alpha: 1.0
        };

        const newParticles = [];

        // High-velocity gold sparks
        for (let i = 0; i < 28; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 8 + 3;
          newParticles.push({
            type: 'spark',
            x: endX,
            y: endY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            size: Math.random() * 2 + 1,
            color: Math.random() < 0.5 ? '#ffea70' : '#ffb636',
            alpha: 1.0,
            decay: Math.random() * 0.035 + 0.015
          });
        }

        // Growing fiery fireballs
        for (let i = 0; i < 24; i++) {
          newParticles.push({
            type: 'fire',
            x: endX + (Math.random() - 0.5) * 12,
            y: endY + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5 - 2,
            size: Math.random() * 8 + 5,
            alpha: 1.0,
            growth: Math.random() * 0.45 + 0.25,
            decay: Math.random() * 0.025 + 0.015
          });
        }

        // Dark rising smoke puffs
        for (let i = 0; i < 18; i++) {
          newParticles.push({
            type: 'smoke',
            x: endX,
            y: endY,
            vx: (Math.random() - 0.5) * 1.8,
            vy: -Math.random() * 1.8 - 0.6,
            size: Math.random() * 10 + 6,
            color: Math.random() < 0.5 ? '#1f2937' : '#374151',
            alpha: 0.7,
            growth: Math.random() * 0.55 + 0.35,
            decay: Math.random() * 0.015 + 0.008
          });
        }

        explosionParticlesRef.current = newParticles;
      }
      lastStateRef.current = gameState;

      // Render expanding Shockwave rings
      if (gameState === 'crashed' && shockwaveRef.current) {
        const sw = shockwaveRef.current;
        sw.radius += 4.5;
        sw.alpha -= 0.035;
        if (sw.alpha > 0 && sw.radius < sw.maxRadius) {
          ctx.strokeStyle = `rgba(255, 90, 30, ${sw.alpha * 0.55})`;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(155, 81, 224, ${sw.alpha * 0.25})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius * 1.25, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw custom fire/smoke/sparks particles
      if (gameState === 'crashed' && explosionParticlesRef.current.length > 0) {
        for (let i = explosionParticlesRef.current.length - 1; i >= 0; i--) {
          const p = explosionParticlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.type === 'spark') {
            p.vy += 0.12; // Gravity
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.lineWidth = p.size;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 1.6, p.y - p.vy * 1.6);
            ctx.stroke();
          } else if (p.type === 'fire') {
            p.vy -= 0.06; // Buoyancy lift
            p.size += p.growth;
            if (p.alpha > 0.65) {
              ctx.fillStyle = '#ffffff'; // White hot core
            } else if (p.alpha > 0.35) {
              ctx.fillStyle = '#ff9500'; // Yellow/Orange flame
            } else {
              ctx.fillStyle = '#e22139'; // Red flame end
            }
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.type === 'smoke') {
            p.vy -= 0.09;
            p.size += p.growth;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }

          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            explosionParticlesRef.current.splice(i, 1);
          }
        }
        ctx.globalAlpha = 1.0;
      }

      if (gameState === 'waiting') {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // 7. Calculate and draw Flight Path
      const progress = getProgress(animatedMultiplierRef.current);
      const startX = 40;
      const startY = H - 40;
      const endX = startX + (W - 140) * progress;
      const endY = startY - (H - 100) * Math.pow(progress, 1.8);

      const pathGrad = ctx.createLinearGradient(startX, startY, endX, endY);
      pathGrad.addColorStop(0, 'rgba(226, 33, 57, 0.01)');
      pathGrad.addColorStop(0.5, 'rgba(155, 81, 224, 0.08)');
      pathGrad.addColorStop(1, 'rgba(226, 33, 57, 0.18)');

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + (endX - startX) * 0.45, startY, endX, endY);
      ctx.lineTo(endX, startY);
      ctx.closePath();
      ctx.fillStyle = pathGrad;
      ctx.fill();

      // Exhaust particles
      if (gameState === 'playing' && Math.random() < 0.45) {
        trailRef.current.push({
          x: endX - 8,
          y: endY + (Math.random() - 0.5) * 4,
          size: Math.random() * 4 + 1.5,
          alpha: 1.0,
          color: Math.random() < 0.5 ? 'rgba(226, 33, 57, 0.8)' : 'rgba(155, 81, 224, 0.8)',
          decay: Math.random() * 0.03 + 0.015
        });
      }

      for (let i = trailRef.current.length - 1; i >= 0; i--) {
        const p = trailRef.current[i];
        p.x -= scrollSpeed * 0.8;
        p.alpha -= p.decay;
        if (p.alpha <= 0 || p.x < 0) {
          trailRef.current.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Flight path line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + (endX - startX) * 0.45, startY, endX, endY);
      ctx.strokeStyle = '#e22139';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#e22139';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 8. Airplane shape
      if (gameState !== 'crashed') {
        ctx.save();
        ctx.translate(endX, endY);
      
      const wobble = Math.sin(Date.now() * 0.008) * 0.05;
      const dx = 1.0;
      const dy = -1.8 * Math.pow(progress, 0.8) * ((H - 100) / (W - 100));
      const angle = Math.atan2(dy, dx);
      ctx.rotate(angle + wobble);

      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(226, 33, 57, 0.4)';

      // 8a. Jet Engine Fire / Plasma Thruster
      const thrusterPulse = 1.0 + Math.sin(Date.now() * 0.05) * 0.12;
      const flameLength = (45 + Math.random() * 15) * thrusterPulse;
      
      // Outer Flame
      const outerFlame = ctx.createLinearGradient(-15, 0, -15 - flameLength, 0);
      outerFlame.addColorStop(0, 'rgba(255, 75, 92, 0.95)');
      outerFlame.addColorStop(0.35, 'rgba(155, 81, 224, 0.7)');
      outerFlame.addColorStop(1, 'rgba(226, 33, 57, 0)');
      
      ctx.fillStyle = outerFlame;
      ctx.beginPath();
      ctx.moveTo(-15, -6);
      ctx.quadraticCurveTo(-15 - flameLength * 0.5, -12, -15 - flameLength, 0);
      ctx.quadraticCurveTo(-15 - flameLength * 0.5, 12, -15, 6);
      ctx.closePath();
      ctx.fill();

      // Inner Hot Core Flame
      const innerFlame = ctx.createLinearGradient(-12, 0, -12 - flameLength * 0.65, 0);
      innerFlame.addColorStop(0, '#ffffff');
      innerFlame.addColorStop(0.2, '#ffcc00');
      innerFlame.addColorStop(0.5, '#e22139');
      innerFlame.addColorStop(1, 'rgba(226, 33, 57, 0)');
      
      ctx.fillStyle = innerFlame;
      ctx.beginPath();
      ctx.moveTo(-12, -3);
      ctx.quadraticCurveTo(-12 - flameLength * 0.3, -6, -12 - flameLength * 0.6, 0);
      ctx.quadraticCurveTo(-12 - flameLength * 0.3, 6, -12, 3);
      ctx.closePath();
      ctx.fill();

      // 8b. Wings
      // Main wing body
      ctx.fillStyle = '#141622';
      ctx.beginPath();
      // Left Wing
      ctx.moveTo(-5, -5);
      ctx.lineTo(-20, -28);
      ctx.lineTo(-8, -28);
      ctx.lineTo(10, -5);
      // Right Wing
      ctx.moveTo(-5, 5);
      ctx.lineTo(-20, 28);
      ctx.lineTo(-8, 28);
      ctx.lineTo(10, 5);
      ctx.closePath();
      ctx.fill();

      // Neon glowing edges on wings (red stripe matching the flight path)
      ctx.strokeStyle = '#e22139';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, -5);
      ctx.lineTo(-8, -28);
      ctx.moveTo(10, 5);
      ctx.lineTo(-8, 28);
      ctx.stroke();

      // Wingtip lights (neon emerald green, blinking)
      const lightBlink = Math.floor(Date.now() / 200) % 2 === 0;
      ctx.fillStyle = lightBlink ? '#3de796' : 'rgba(61, 231, 150, 0.2)';
      ctx.beginPath();
      ctx.arc(-8, -28, 2.5, 0, Math.PI * 2);
      ctx.arc(-8, 28, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 8c. Vertical Stabilizers / Tail Fins
      ctx.fillStyle = '#0b0c13';
      ctx.beginPath();
      ctx.moveTo(-15, -2);
      ctx.lineTo(-26, -12);
      ctx.lineTo(-18, -12);
      ctx.lineTo(-10, -2);
      ctx.moveTo(-15, 2);
      ctx.lineTo(-26, 12);
      ctx.lineTo(-18, 12);
      ctx.lineTo(-10, 2);
      ctx.closePath();
      ctx.fill();

      // Tail fin neon purple trim
      ctx.strokeStyle = '#9b51e0';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(-26, -12);
      ctx.moveTo(-10, 2);
      ctx.lineTo(-26, 12);
      ctx.stroke();

      // 8d. Main Fuselage
      const bodyGrad = ctx.createLinearGradient(-15, 0, 30, 0);
      bodyGrad.addColorStop(0, '#0e1017');
      bodyGrad.addColorStop(0.4, '#1f2232');
      bodyGrad.addColorStop(0.8, '#cbd5e1');
      bodyGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.quadraticCurveTo(-15, -6.5, 0, -6);
      ctx.lineTo(20, -3);
      ctx.quadraticCurveTo(30, 0, 33, 0);
      ctx.quadraticCurveTo(30, 0, 20, 3);
      ctx.lineTo(0, 6);
      ctx.quadraticCurveTo(-15, 6.5, -15, 0);
      ctx.closePath();
      ctx.fill();

      // 8e. Cockpit Glass (Specular cyan dome)
      const canopyGrad = ctx.createLinearGradient(4, 0, 18, 0);
      canopyGrad.addColorStop(0, '#00f0ff');
      canopyGrad.addColorStop(0.6, '#0066cc');
      canopyGrad.addColorStop(1, '#ffffff');

      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = canopyGrad;
      ctx.beginPath();
      ctx.moveTo(4, -1.8);
      ctx.quadraticCurveTo(11, -3, 17, 0);
      ctx.quadraticCurveTo(11, 3, 4, 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Canopy white glare shine
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(6, -0.8);
      ctx.lineTo(12, -0.8);
      ctx.stroke();

      // 8f. Vent panel details
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, -4);
      ctx.lineTo(4, -4);
      ctx.moveTo(-4, 4);
      ctx.lineTo(4, 4);
      ctx.stroke();

        ctx.restore();
      }
      
      // Match the camera shake save context
      ctx.restore();
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, multiplier]);

  // Color helper for history pills
  const getPillColor = (val) => {
    if (val >= 10.00) return '#3de796';
    if (val >= 2.00) return '#10b981';
    return '#94a3b8';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full h-full min-h-full">
      <style>{`
        /* Hide default number input arrows/spinners */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      
      {/* LEFT COLUMN: Controls Console - Direct layout matching standard web patterns */}
      <div className="lg:col-span-4 flex flex-col gap-3 order-2 lg:order-1 h-full select-none">
        
        {/* BET PANEL A */}
        <div className="bg-[#141622] border border-white/[0.02] p-4 rounded-2xl flex flex-col gap-2.5 relative flex-1">
          {/* Manual / Autoplay Toggles */}
          <div className="bg-zinc-950/40 p-1 rounded-xl flex gap-1 border border-white/5">
            <button
              onClick={() => { playClick(); setTabA('manual'); }}
              disabled={betA.hasBet || isAutoplayRunningA}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                tabA === 'manual'
                  ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                  : 'bg-transparent text-text-muted hover:text-white'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => { playClick(); setTabA('autoplay'); }}
              disabled={betA.hasBet || isAutoplayRunningA}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                tabA === 'autoplay'
                  ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                  : 'bg-transparent text-text-muted hover:text-white'
              }`}
            >
              Autoplay
            </button>
          </div>

          {/* Bet Amount Input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
              <span>Bet Amount</span>
              <span>{(playableBalance || 0).toFixed(2)} INR</span>
            </div>
            <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
              <div className="font-bold text-[#3de796] text-sm px-1 select-none">₹</div>
              <input
                type="number"
                disabled={betA.hasBet || isAutoplayRunningA}
                className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                value={betAmountA}
                onChange={(e) => setBetAmountA(e.target.value)}
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => multiplyBetA(0.5)}
                  disabled={betA.hasBet || isAutoplayRunningA}
                  className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors"
                >
                  1/2
                </button>
                <button
                  onClick={() => multiplyBetA(2.0)}
                  disabled={betA.hasBet || isAutoplayRunningA}
                  className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors"
                >
                  X2
                </button>
              </div>
            </div>
          </div>

          {/* Auto Cashout Controls (Standard Height) */}
          <div className="flex items-center justify-between gap-3 bg-zinc-950/20 p-2.5 rounded-xl border border-white/5">
            <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoCashA}
                disabled={betA.hasBet || isAutoplayRunningA}
                onChange={(e) => setAutoCashA(e.target.checked)}
                className="rounded border-white/10 bg-transparent text-[#3de796] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              Auto Cashout
            </label>
            {autoCashA && (
              <input
                type="number"
                step="0.1"
                disabled={betA.hasBet || isAutoplayRunningA}
                className="w-20 bg-zinc-950/40 border border-white/5 rounded-lg py-1 px-2 text-white font-extrabold text-xs text-center outline-none"
                value={autoCashValueA}
                onChange={(e) => setAutoCashValueA(e.target.value)}
              />
            )}
          </div>

          {/* Autoplay statistics */}
          {tabA === 'autoplay' && (
            <div className="space-y-2 border-t border-white/5 pt-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Number of Bets</span>
                <input
                  type="number"
                  disabled={betA.hasBet || isAutoplayRunningA}
                  className="w-16 bg-zinc-950/40 border border-white/5 rounded-lg py-0.5 px-2 text-white font-extrabold text-xs text-center outline-none"
                  value={numberOfBets}
                  onChange={(e) => setNumberOfBets(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 bg-zinc-950/20 p-2 rounded-xl border border-white/5 text-[9px] font-bold text-text-muted uppercase">
                <div>
                  <span>Wagered</span>
                  <span className="text-white font-black block text-xs">₹{totalWageredA.toFixed(2)}</span>
                </div>
                <div>
                  <span>Profits</span>
                  <span className={`font-black block text-xs ${totalProfitA >= 0 ? 'text-[#3de796]' : 'text-[#ef4444]'}`}>
                    {totalProfitA >= 0 ? '+' : ''}₹{totalProfitA.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-auto">
            {tabA === 'manual' ? (
              betA.hasBet ? (
                betA.cashedOut ? (
                  <div className="w-full py-3 rounded-2xl font-black text-sm tracking-wider flex flex-col justify-center items-center bg-zinc-950/40 border border-[#3de796]/20 text-[#3de796]">
                    <span style={{ fontSize: '9px', fontWeight: 800 }}>WON</span>
                    <span style={{ fontSize: '15px', fontWeight: 900 }}>₹{betA.wonAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <button
                    className="w-full py-3 rounded-2xl font-black text-sm tracking-wider border-0 cursor-pointer transition-all bg-[#ff9f0a] hover:bg-[#ff9f0a]/90 text-black shadow-lg shadow-amber-500/15"
                    onClick={() => triggerCashout('A')}
                    disabled={gameState !== 'playing'}
                  >
                    {gameState === 'playing' ? (
                      <div className="flex flex-col leading-tight">
                        <span className="text-[9px] font-black uppercase tracking-wider">CASH OUT</span>
                        <span className="text-sm font-extrabold">₹{(parseFloat(betA.amount) * multiplier).toFixed(2)}</span>
                      </div>
                    ) : 'WAITING...'}
                  </button>
                )
              ) : (
                <button
                  onClick={() => triggerPlaceBet('A')}
                  disabled={gameState !== 'waiting' || waitingTimer <= 2}
                  className={`w-full py-3 rounded-2xl font-black text-sm tracking-wider border-0 cursor-pointer transition-all shadow-lg ${
                    (gameState === 'waiting' && waitingTimer > 2)
                      ? 'bg-[#3de796] hover:bg-[#3de796]/90 text-black shadow-[#3de796]/10'
                      : 'bg-zinc-800/80 text-white/20'
                  }`}
                >
                  {gameState !== 'waiting'
                    ? 'WAITING ROUND'
                    : waitingTimer <= 2
                    ? 'BETTING CLOSED'
                    : 'BET'}
                </button>
              )
            ) : (
              <button
                onClick={handleAutoplayToggleA}
                disabled={gameState !== 'waiting' && !isAutoplayRunningA}
                className={`w-full py-3 rounded-2xl font-black text-sm tracking-wider border-0 cursor-pointer transition-all shadow-lg ${
                  isAutoplayRunningA
                    ? 'bg-[#ef4444] hover:bg-[#ef4444]/90 text-white shadow-red-500/10'
                    : gameState === 'waiting'
                    ? 'bg-[#3de796] hover:bg-[#3de796]/90 text-black shadow-[#3de796]/10'
                    : 'bg-zinc-800/80 text-white/20'
                }`}
              >
                {isAutoplayRunningA ? 'STOP' : 'START AUTOPLAY'}
              </button>
            )}
          </div>
        </div>

        {/* BET PANEL B */}
        <div className="bg-[#141622] border border-white/[0.02] p-4 rounded-2xl flex flex-col gap-2.5 relative flex-1">
          {/* Manual / Autoplay Toggles */}
          <div className="bg-zinc-950/40 p-1 rounded-xl flex gap-1 border border-white/5">
            <button
              onClick={() => { playClick(); setTabB('manual'); }}
              disabled={betB.hasBet || isAutoplayRunningB}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                tabB === 'manual'
                  ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                  : 'bg-transparent text-text-muted hover:text-white'
                }`}
            >
              Manual
            </button>
            <button
              onClick={() => { playClick(); setTabB('autoplay'); }}
              disabled={betB.hasBet || isAutoplayRunningB}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                tabB === 'autoplay'
                  ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                  : 'bg-transparent text-text-muted hover:text-white'
                }`}
            >
              Autoplay
            </button>
          </div>

          {/* Bet Amount Input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
              <span>Bet Amount</span>
              <span>{(playableBalance || 0).toFixed(2)} INR</span>
            </div>
            <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-2 flex items-center justify-between gap-2">
              <div className="font-bold text-[#3de796] text-sm px-1 select-none">₹</div>
              <input
                type="number"
                disabled={betB.hasBet || isAutoplayRunningB}
                className="form-input bg-transparent border-0 py-1 px-0 text-white font-extrabold text-xs outline-none focus:ring-0 w-full"
                value={betAmountB}
                onChange={(e) => setBetAmountB(e.target.value)}
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => multiplyBetB(0.5)}
                  disabled={betB.hasBet || isAutoplayRunningB}
                  className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors"
                >
                  1/2
                </button>
                <button
                  onClick={() => multiplyBetB(2.0)}
                  disabled={betB.hasBet || isAutoplayRunningB}
                  className="bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg text-[9px] font-black border-0 cursor-pointer transition-colors"
                >
                  X2
                </button>
              </div>
            </div>
          </div>

          {/* Auto Cashout Controls (Standard Height) */}
          <div className="flex items-center justify-between gap-3 bg-zinc-950/20 p-2.5 rounded-xl border border-white/5">
            <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoCashB}
                disabled={betB.hasBet || isAutoplayRunningB}
                onChange={(e) => setAutoCashB(e.target.checked)}
                className="rounded border-white/10 bg-transparent text-[#3de796] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              Auto Cashout
            </label>
            {autoCashB && (
              <input
                type="number"
                step="0.1"
                disabled={betB.hasBet || isAutoplayRunningB}
                className="w-20 bg-zinc-950/40 border border-white/5 rounded-lg py-1 px-2 text-white font-extrabold text-xs text-center outline-none"
                value={autoCashValueB}
                onChange={(e) => setAutoCashValueB(e.target.value)}
              />
            )}
          </div>

          {/* Autoplay statistics */}
          {tabB === 'autoplay' && (
            <div className="space-y-2 border-t border-white/5 pt-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Number of Bets</span>
                <input
                  type="number"
                  disabled={betB.hasBet || isAutoplayRunningB}
                  className="w-16 bg-zinc-950/40 border border-white/5 rounded-lg py-0.5 px-2 text-white font-extrabold text-xs text-center outline-none"
                  value={numberOfBets}
                  onChange={(e) => setAutoBetsRemainingB(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 bg-zinc-950/20 p-2 rounded-xl border border-white/5 text-[9px] font-bold text-text-muted uppercase">
                <div>
                  <span>Wagered</span>
                  <span className="text-white font-black block text-xs">₹{totalWageredB.toFixed(2)}</span>
                </div>
                <div>
                  <span>Profits</span>
                  <span className={`font-black block text-xs ${totalProfitB >= 0 ? 'text-[#3de796]' : 'text-[#ef4444]'}`}>
                    {totalProfitB >= 0 ? '+' : ''}₹{totalProfitB.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-auto">
            {tabB === 'manual' ? (
              betB.hasBet ? (
                betB.cashedOut ? (
                  <div className="w-full py-3 rounded-2xl font-black text-sm tracking-wider flex flex-col justify-center items-center bg-zinc-950/40 border border-[#3de796]/20 text-[#3de796]">
                    <span style={{ fontSize: '9px', fontWeight: 800 }}>WON</span>
                    <span style={{ fontSize: '15px', fontWeight: 900 }}>₹{betB.wonAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <button
                    className="w-full py-3 rounded-2xl font-black text-sm tracking-wider border-0 cursor-pointer transition-all bg-[#ff9f0a] hover:bg-[#ff9f0a]/90 text-black shadow-lg shadow-amber-500/15"
                    onClick={() => triggerCashout('B')}
                    disabled={gameState !== 'playing'}
                  >
                    {gameState === 'playing' ? (
                      <div className="flex flex-col leading-tight">
                        <span className="text-[9px] font-black uppercase tracking-wider">CASH OUT</span>
                        <span className="text-sm font-extrabold">₹{(parseFloat(betB.amount) * multiplier).toFixed(2)}</span>
                      </div>
                    ) : 'WAITING...'}
                  </button>
                )
              ) : (
                <button
                  onClick={() => triggerPlaceBet('B')}
                  disabled={gameState !== 'waiting' || waitingTimer <= 2}
                  className={`w-full py-3 rounded-2xl font-black text-sm tracking-wider border-0 cursor-pointer transition-all shadow-lg ${
                    (gameState === 'waiting' && waitingTimer > 2)
                      ? 'bg-[#3de796] hover:bg-[#3de796]/90 text-black shadow-[#3de796]/10'
                      : 'bg-zinc-800/80 text-white/20'
                  }`}
                >
                  {gameState !== 'waiting'
                    ? 'WAITING ROUND'
                    : waitingTimer <= 2
                    ? 'BETTING CLOSED'
                    : 'BET'}
                </button>
              )
            ) : (
              <button
                onClick={handleAutoplayToggleB}
                disabled={gameState !== 'waiting' && !isAutoplayRunningB}
                className={`w-full py-3 rounded-2xl font-black text-sm tracking-wider border-0 cursor-pointer transition-all shadow-lg ${
                  isAutoplayRunningB
                    ? 'bg-[#ef4444] hover:bg-[#ef4444]/90 text-white shadow-red-500/10'
                    : gameState === 'waiting'
                    ? 'bg-[#3de796] hover:bg-[#3de796]/90 text-black shadow-[#3de796]/10'
                    : 'bg-zinc-800/80 text-white/20'
                }`}
              >
                {isAutoplayRunningB ? 'STOP' : 'START AUTOPLAY'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: History Pills & Live Canvas Display */}
      <div className="lg:col-span-8 flex flex-col gap-3 min-w-0 order-1 lg:order-2 justify-between">
        
        {/* 1. Multipliers History capsules */}
        <div className="flex gap-1.5 overflow-x-auto p-2.5 bg-[#141622] rounded-xl border border-white/[0.02] scrollbar-none">
          {history.map((h, i) => (
            <span
              key={i}
              className="monospace-ledger flex-shrink-0 text-[10px] font-black px-2.5 py-1.5 rounded-full bg-zinc-950/20 border"
              style={{
                color: getPillColor(h),
                borderColor: `${getPillColor(h)}25`,
              }}
            >
              {h.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* 2. Main Canvas Viewport container */}
        <div className="relative flex-1 min-h-[440px] bg-[#0a0c12] border border-white/[0.02] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
          {/* Canvas layer */}
          <canvas
            ref={canvasRef}
            width={600}
            height={280}
            className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl"
          />
          
          {/* Floating TARGET A/B badges - visible if auto-cashout is enabled */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
            {autoCashA && (
              <div className="bg-zinc-950/60 border border-white/5 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[9px] font-bold text-text-muted uppercase tracking-widest shadow-md">
                <TrendingUp size={11} className="text-[#3de796]" />
                Auto A: <span className="text-white font-black">{parseFloat(autoCashValueA).toFixed(2)}x</span>
              </div>
            )}
            {autoCashB && (
              <div className="bg-zinc-950/60 border border-white/5 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[9px] font-bold text-text-muted uppercase tracking-widest shadow-md">
                <TrendingUp size={11} className="text-[#3de796]" />
                Auto B: <span className="text-white font-black">{parseFloat(autoCashValueB).toFixed(2)}x</span>
              </div>
            )}
          </div>

          {/* Centered multiplier states overlays */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-center px-4">
            
            {/* Waiting overlay details */}
            {gameState === 'waiting' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="text-white font-black text-2xl tracking-wide uppercase drop-shadow-lg">
                  PREPARING TAKE-OFF
                </div>
                <div className="text-text-muted font-bold text-[10px] tracking-widest uppercase">
                  Place bet for the next round
                </div>
                
                {/* Creative Circular Neon Timer */}
                <div className="relative flex flex-col items-center justify-center mt-3">
                  {/* Outer spinning dashed orbital ring */}
                  <div className="absolute w-24 h-24 rounded-full border border-dashed border-[#3de796]/20 animate-[spin_20s_linear_infinite]" />
                  
                  {/* SVG Radial Progress */}
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      className="stroke-zinc-950/60"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke={waitingTimer <= 2 ? '#ef4444' : waitingTimer <= 6 ? '#ff9f0a' : '#3de796'}
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={251.2}
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={{
                        strokeDashoffset: 251.2 - (251.2 * waitingTimer) / 10
                      }}
                      transition={{ duration: 1, ease: "linear" }}
                      style={{
                        strokeLinecap: 'round',
                        filter: `drop-shadow(0px 0px 8px ${waitingTimer <= 2 ? 'rgba(239, 68, 68, 0.6)' : waitingTimer <= 6 ? 'rgba(255, 159, 10, 0.6)' : 'rgba(61, 231, 150, 0.6)'})`
                      }}
                    />
                  </svg>

                  {/* Pulsing countdown number in center */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <motion.span
                      key={waitingTimer}
                      initial={{ scale: 1.4, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl font-black monospace-ledger leading-none"
                      style={{
                        color: waitingTimer <= 2 ? '#ef4444' : waitingTimer <= 6 ? '#ff9f0a' : '#3de796',
                      }}
                    >
                      {waitingTimer}
                    </motion.span>
                    <span className="text-[6px] text-text-muted font-black tracking-widest mt-0.5">SECS</span>
                  </div>
                </div>

                <div className="mt-1 flex flex-col items-center">
                  <span 
                    className="text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full transition-all"
                    style={{
                      color: waitingTimer <= 2 ? '#ef4444' : '#3de796',
                      backgroundColor: waitingTimer <= 2 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(61, 231, 150, 0.05)',
                      border: `1px solid ${waitingTimer <= 2 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(61, 231, 150, 0.1)'}`
                    }}
                  >
                    {waitingTimer <= 2 ? 'IGNITION INCOMING' : 'ACCEPTING BETS'}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Live climbs and crashes */}
            {(gameState === 'playing' || gameState === 'crashed') && (
              <div className="flex flex-col items-center">
                <div
                  className="monospace-ledger font-black leading-none"
                  style={{
                    fontSize: '72px',
                    color: gameState === 'crashed' ? '#ef4444' : '#3de796',
                    textShadow: gameState === 'crashed' 
                      ? '0 0 40px rgba(239, 68, 68, 0.4), 0 0 10px rgba(239, 68, 68, 0.2)' 
                      : '0 0 40px rgba(61, 231, 150, 0.4), 0 0 10px rgba(61, 231, 150, 0.2)',
                  }}
                >
                  {multiplier.toFixed(2)}x
                </div>

                <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  {gameState === 'crashed' ? (
                    <span className="text-[#ef4444] px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">FLEW AWAY</span>
                  ) : (
                    'PLACE YOUR BET'
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom display status stats */}
          <div className="mt-auto relative z-10 bg-gradient-to-t from-zinc-950/60 to-transparent p-3 flex justify-between items-center text-[9px] font-bold text-text-muted uppercase tracking-wider border-t border-white/[0.02]">
            <div>
              LIVE ODDS: <span className="text-white font-black">{multiplier.toFixed(2)}x</span>
            </div>
            <div>
              MULTIPLAYER CRASH ENGINE
            </div>
          </div>

          {/* Win animation notification overlay */}
          <AnimatePresence>
            {winNotification && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-1 bg-gradient-to-b from-[#3de796] to-emerald-600 border border-[#a3ff7a]/40 text-black px-5 py-2.5 rounded-2xl shadow-xl shadow-emerald-500/20"
              >
                <span className="text-[8px] font-black tracking-widest uppercase opacity-85">
                  PANEL {winNotification.panel} CASHOUT SUCCESSFUL
                </span>
                <span className="text-base font-black tracking-tight leading-none">
                  +₹{parseFloat(winNotification.amount).toFixed(2)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
