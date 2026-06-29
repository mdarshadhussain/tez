'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Shuffle, Sparkles, Trash2, RotateCcw, ShieldCheck, HelpCircle } from 'lucide-react';
import { playClick, playWinChime, playRouletteSpinSound } from '../utils/audio';

export default function Roulette({ socket, user, playableBalance, setPlayableBalance, isDemo }) {
  const [timer, setTimer] = useState(15);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('manual');
  const [activeChip, setActiveChip] = useState(50);
  const [bets, setBets] = useState({ red: 0, black: 0, gold: 0 });
  const [spinning, setSpinning] = useState(false);
  const [winSector, setWinSector] = useState(null);
  const [placedBets, setPlacedBets] = useState(false);
  const [resultModal, setResultModal] = useState({ show: false, won: false, amount: 0, sector: null, isDemo: false });
  const [livePool, setLivePool] = useState({ red: 450000, green: 9500, black: 380000 });
  const [liveToast, setLiveToast] = useState(null);
  const [liveWagers, setLiveWagers] = useState([]);

  // Rapid live pool wagers tick simulator (enforces 1-2% green wagers)
  useEffect(() => {
    if (timer <= 3 || spinning) return;
    const interval = setInterval(() => {
      setLivePool(prev => ({
        red: prev.red + Math.floor(Math.random() * 2200 + 400),
        green: prev.green + (Math.random() < 0.1 ? Math.floor(Math.random() * 150 + 20) : 0),
        black: prev.black + Math.floor(Math.random() * 2200 + 400)
      }));
    }, 300);

    return () => clearInterval(interval);
  }, [timer, spinning]);

  // Live Toast alerts & history list simulation loop (fast ticking)
  useEffect(() => {
    if (timer <= 3 || spinning) return;
    
    let hideTimeout;
    let loopTimeout;

    const triggerNextToast = () => {
      const startDigits = ['6', '7', '8', '9'];
      const first = startDigits[Math.floor(Math.random() * startDigits.length)];
      const second = Math.floor(Math.random() * 10);
      const suffix = Math.floor(100 + Math.random() * 900);
      const phone = `${first}${second}XXX${suffix}`;
      
      // Enforce 1-2% selection probability for green (gold)
      const selection = Math.random() < 0.015 ? 'gold' : Math.random() < 0.5 ? 'red' : 'black';
      
      // Get hour in IST (UTC+5.5)
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const nd = new Date(utc + (3600000 * 5.5));
      const istHour = nd.getHours();

      // Off-peak hours in India: 1:00 AM to 7:59 AM IST
      const isOffPeak = istHour >= 1 && istHour < 8;

      let baseAmount;
      if (isOffPeak) {
        // Night/early morning off-peak: low numbers (up to 1 to 2 lakhs max)
        const amounts = [10, 20, 50, 100, 200, 300, 500, 1000, 1500, 2000, 3000, 5000, 10000, 15000, 20000, 30000, 50000, 75000, 100000, 150000, 200000];
        baseAmount = amounts[Math.floor(Math.random() * amounts.length)];
      } else {
        // Peak hours (morning, afternoon, evening/night): can go higher up to 10-15 lakhs
        const amounts = [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000, 200000, 300000, 400000, 500000, 750000, 1000000, 1500000];
        baseAmount = amounts[Math.floor(Math.random() * amounts.length)];
      }

      let amount = baseAmount;
      if (baseAmount > 100) {
        // Add random tens or units variation to make it non-round (e.g. 2350, 2120, 221570)
        const sign = Math.random() < 0.5 ? -1 : 1;
        const varianceLimit = Math.min(baseAmount * 0.15, 25000); // max 15% variance or 25k
        const rawOffset = Math.floor(Math.random() * varianceLimit);
        // Round to nearest 10
        const roundedOffset = Math.round(rawOffset / 10) * 10;
        amount = baseAmount + (sign * roundedOffset);
        if (amount < 10) amount = 10;
      }

      setLiveToast({ phone, selection, amount, visible: true });

      // Prepend to live wagers history feed (keep exactly last 2)
      setLiveWagers(prev => [
        { phone, selection, amount, id: Math.random() },
        ...prev.slice(0, 1)
      ]);

      // Keep pool sync wagers
      setLivePool(prev => ({
        ...prev,
        [selection]: prev[selection] + amount
      }));

      // Slide down exit quickly to match speed
      hideTimeout = setTimeout(() => {
        setLiveToast(prev => prev ? { ...prev, visible: false } : null);
      }, 500);
    };

    const runSimulator = () => {
      triggerNextToast();
      // Super fast intervals: every 80ms to 220ms
      const nextDelay = 80 + Math.random() * 140;
      loopTimeout = setTimeout(runSimulator, nextDelay);
    };

    loopTimeout = setTimeout(runSimulator, 300);

    return () => {
      clearTimeout(hideTimeout);
      clearTimeout(loopTimeout);
    };
  }, [timer, spinning]);

  useEffect(() => {
    if (timer === 15) {
      setLivePool({
        red: Math.floor(250000 + Math.random() * 300000),
        green: Math.floor(6000 + Math.random() * 5000), // Enforces 1-2% green ratio
        black: Math.floor(250000 + Math.random() * 300000)
      });
      setLiveToast(null);
      setLiveWagers([]);
    }
  }, [timer]);

  const canvasRef = useRef(null);
  const spinStartTimeRef = useRef(0);
  const targetOutcomeIdxRef = useRef(0);
  const wheelAngleRef = useRef(0);
  const ballAngleRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const startWheelAngleRef = useRef(0);
  const startBallAngleRef = useRef(0); // Fixed: Defined missing ref
  const currentWinSectorRef = useRef(null);

  const prevBetsRef = useRef({ red: 0, black: 0, gold: 0 });
  const demoBetsRef = useRef(null);
  const pendingBetResultRef = useRef(null);

  // Generate 37 segments: 1 Gold at index 0, and 18 alternating Red/Black pairs
  const strip = ['gold'];
  for (let i = 0; i < 18; i++) {
    strip.push('red', 'black');
  }

  const chipsList = [10, 50, 100, 500, 1000];

  // Initialize and persist the ball's resting position based on history
  useEffect(() => {
    if (history.length > 0 && !currentWinSectorRef.current) {
      currentWinSectorRef.current = history[0];
    }
  }, [history]);

  // Auto-close result modal after 4.5 seconds
  useEffect(() => {
    if (resultModal.show) {
      const t = setTimeout(() => {
        setResultModal(prev => ({ ...prev, show: false }));
      }, 4500);
      return () => clearTimeout(t);
    }
  }, [resultModal.show]);

  // Canvas 3D Rendering & Advanced Physics Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    
    let animFrameId;

    const render = () => {
      const cx = W / 2;
      const cy = H / 2;
      const scale = W / 300; // Auto-scaling factor to support larger wheel sizes
      const elapsed = Date.now() - spinStartTimeRef.current;
      const duration = 3000; // 3 seconds main spin

      const totalSegments = 37;
      const anglePerSegment = (Math.PI * 2) / totalSegments;

      // 1. Calculate Angles & Realistic Pocket Settle Bounce
      if (isAnimatingRef.current) {
        let t = Math.min(1, elapsed / duration);
        const easeOut = 1 - Math.pow(1 - t, 4); // Quartic ease out

        // Target angle lands the chosen segment index at the top pointer (12 o'clock position / -PI/2 radians)
        const targetAngle = 8 * Math.PI * 2 - (targetOutcomeIdxRef.current * anglePerSegment);
        wheelAngleRef.current = startWheelAngleRef.current + (targetAngle - startWheelAngleRef.current) * easeOut;

        const theta_pocket = (targetOutcomeIdxRef.current + 0.5) * anglePerSegment - Math.PI / 2;
        
        // Settle bounce/jiggle physics
        const bounce = (t >= 0.9) ? Math.sin((t - 0.9) / 0.1 * Math.PI * 5) * (1 - (t - 0.9) / 0.1) * 0.03 : 0;
        
        // Realistic counter-clockwise ball spin blending into the clockwise pocket
        const ballRevs = 6;
        const ballSpin = startBallAngleRef.current - Math.pow(t, 0.7) * (Math.PI * 2 * ballRevs);
        const targetBallAngle = wheelAngleRef.current + theta_pocket;
        const blend = Math.pow(t, 2.5); // late blending as it slows down and drops
        ballAngleRef.current = ballSpin * (1 - blend) + targetBallAngle * blend + bounce;
      } else {
        // Idle slow rotation
        wheelAngleRef.current += 0.0015;
        
        // Post-spin settle bounce jiggle
        const postSpinTime = elapsed - duration;
        const lastWinIdx = strip.lastIndexOf(currentWinSectorRef.current || 'gold');
        const theta_pocket = (lastWinIdx + 0.5) * anglePerSegment - Math.PI / 2;

        if (postSpinTime > 0 && postSpinTime < 500) {
          const jt = postSpinTime / 500;
          const jiggle = Math.sin(jt * Math.PI * 6) * Math.exp(-jt * 3) * 0.02;
          ballAngleRef.current = wheelAngleRef.current + theta_pocket + jiggle;
        } else {
          ballAngleRef.current = wheelAngleRef.current + theta_pocket;
        }
      }

      ctx.clearRect(0, 0, W, H);

      // --- 3D ROULETTE WHEEL LAYERED DRAWING (All dimensions multiplied by scale) ---

      // 1. Outer Dark Wooden/Steel Bezel Rim with 3D drop shadows
      const outerGrad = ctx.createRadialGradient(cx, cy, 108 * scale, cx, cy, 136 * scale);
      outerGrad.addColorStop(0, '#2d3043');
      outerGrad.addColorStop(0.2, '#12131b');
      outerGrad.addColorStop(0.5, '#242735');
      outerGrad.addColorStop(0.85, '#d4af37'); // Gold rim highlight
      outerGrad.addColorStop(0.92, '#181923');
      outerGrad.addColorStop(1, '#050508');
      
      ctx.save();
      ctx.shadowBlur = 18 * scale;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 136 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Outer gold circle divider
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, 126 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Rotating Wheel Body
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(wheelAngleRef.current);

      // Draw Pockets (37 Segments)
      for (let i = 0; i < totalSegments; i++) {
        const startAng = i * anglePerSegment - Math.PI / 2;
        const endAng = (i + 1) * anglePerSegment - Math.PI / 2;
        const color = strip[i];

        // Segment fill
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 117 * scale, startAng, endAng);
        ctx.closePath();
        ctx.fillStyle = color === 'red' ? '#d32f2f' : color === 'black' ? '#121319' : '#00e676';
        ctx.fill();

        // 3D Inner Pocket Recess shadow (makes pockets look concave)
        const pocketShadow = ctx.createRadialGradient(0, 0, 85 * scale, 0, 0, 117 * scale);
        pocketShadow.addColorStop(0, 'rgba(0,0,0,0)');
        pocketShadow.addColorStop(0.75, 'rgba(0,0,0,0.1)');
        pocketShadow.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = pocketShadow;
        ctx.beginPath();
        ctx.arc(0, 0, 117 * scale, startAng, endAng);
        ctx.closePath();
        ctx.fill();

        // Partition Dividers (Brass look)
        ctx.strokeStyle = '#b89735';
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(startAng) * 117 * scale, Math.sin(startAng) * 117 * scale);
        ctx.stroke();

        // Small Gold separator pins
        const pinAng = startAng;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(Math.cos(pinAng) * 112 * scale, Math.sin(pinAng) * 112 * scale, 1.8 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner Brass cone/hub
      const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 48 * scale);
      hubGrad.addColorStop(0, '#5f5431');
      hubGrad.addColorStop(0.3, '#d4af37');
      hubGrad.addColorStop(0.65, '#2e2612');
      hubGrad.addColorStop(1, '#0e0f14');
      ctx.fillStyle = hubGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 48 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Brass highlight ring
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 43 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Turret 4 Spindle Spokes (Chrome tip, brass body)
      for (let s = 0; s < 4; s++) {
        const spokeAng = (s * Math.PI / 2) + Math.PI / 4;
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3.5 * scale;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(spokeAng) * 31 * scale, Math.sin(spokeAng) * 31 * scale);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.cos(spokeAng) * 31 * scale, Math.sin(spokeAng) * 31 * scale, 3.2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center Spindle cap
      ctx.fillStyle = '#111218';
      ctx.beginPath();
      ctx.arc(0, 0, 10 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#3de796';
      ctx.beginPath();
      ctx.arc(0, 0, 3 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // --- STATIC ROULETTE OVERLAY (Non-rotating light glare effects) ---
      
      // Specular Static Light Glare (gives the wheel a glassy 3D look)
      const glare = ctx.createLinearGradient(cx - 80 * scale, cy - 80 * scale, cx + 80 * scale, cy + 80 * scale);
      glare.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      glare.addColorStop(0.4, 'rgba(255, 255, 255, 0.0)');
      glare.addColorStop(0.8, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = glare;
      ctx.beginPath();
      ctx.arc(cx, cy, 117 * scale, 0, Math.PI * 2);
      ctx.fill();

      // 3. Static Pointer Arrow at the top (12 o'clock)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3de796';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 132 * scale);
      ctx.lineTo(cx - 9 * scale, cy - 145 * scale);
      ctx.lineTo(cx + 9 * scale, cy - 145 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4. Calculate ball radius & spiral inward drop bounce (stops at outer corner/edge of wheel pockets)
      let t = 1;
      if (isAnimatingRef.current) {
        t = Math.min(1, elapsed / duration);
      }
      let ballRadius = 109 * scale; // Settles at outer corner/edge of the pockets (radius 109)
      if (isAnimatingRef.current) {
        if (t < 0.7) {
          ballRadius = (109 + (1 - (t / 0.7)) * 13) * scale; // spiral in from outer track (122 to 109)
        } else if (t < 0.88) {
          const dropT = (t - 0.7) / 0.18;
          ballRadius = (109 + (1 - dropT) * 3) * scale;
        } else {
          // pocket settle bounce
          const settleT = (t - 0.88) / 0.12;
          ballRadius = (109 + Math.abs(Math.sin(settleT * Math.PI * 4)) * Math.exp(-settleT * 3) * 2) * scale;
        }
      } else {
        const postSpinTime = elapsed - duration;
        if (postSpinTime > 0 && postSpinTime < 500) {
          const jt = postSpinTime / 500;
          ballRadius = (109 + Math.abs(Math.sin(jt * Math.PI * 5)) * Math.exp(-jt * 3) * 1.5) * scale;
        }
      }

      const ballX = cx + Math.cos(ballAngleRef.current) * ballRadius;
      const ballY = cy + Math.sin(ballAngleRef.current) * ballRadius;

      // Ball shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.arc(ballX + 2 * scale, ballY + 2 * scale, 6 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Silver specular ball fill
      const ballGrad = ctx.createRadialGradient(ballX - 1.8 * scale, ballY - 1.8 * scale, 0.5 * scale, ballX, ballY, 6 * scale);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.3, '#d8d9de');
      ballGrad.addColorStop(1, '#686a72');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 6 * scale, 0, Math.PI * 2);
      ctx.fill();

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('game_timers', (timers) => {
      setTimer(timers.roulette);
      if (timers.roulette === 14) {
        setSpinning(false);
        setWinSector(null);
        setPlacedBets(false);
      }
    });

    socket.on('init_data', (data) => {
      if (data && data.roulette) {
        setHistory(data.roulette);
      }
    });

    socket.on('roulette_resolution', (data) => {
      if (isDemo && demoBetsRef.current) {
        // Prevent double trigger
        if (spinning) return;
      }
      setSpinning(true);
      
      const possibleIndices = [];
      strip.forEach((col, idx) => {
        if (col === data.lastOutcome) {
          possibleIndices.push(idx);
        }
      });
      const targetIdx = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
      
      startWheelAngleRef.current = wheelAngleRef.current % (Math.PI * 2);
      startBallAngleRef.current = wheelAngleRef.current + Math.random() * Math.PI * 2;
      targetOutcomeIdxRef.current = targetIdx;
      spinStartTimeRef.current = Date.now();
      isAnimatingRef.current = true;
      playRouletteSpinSound(); // Play dynamic spin whirr and settle rattle audio!
      
      prevBetsRef.current = { ...bets };

      // Declare results ONLY when the ball stops (after 3500ms animation duration + settle bounce)
      setTimeout(() => {
        setWinSector(data.lastOutcome);
        currentWinSectorRef.current = data.lastOutcome; // Explicitly preserve the ball's last resting position
        setHistory(data.history);
        setBets({ red: 0, black: 0, gold: 0 });
        setPlacedBets(false);
        setSpinning(false);
        isAnimatingRef.current = false; // Reset animating ref to idle state!

        // Trigger creative result declaration
        if (isDemo && demoBetsRef.current) {
          let totalWin = 0;
          Object.entries(demoBetsRef.current).forEach(([sel, amount]) => {
            if (sel === data.lastOutcome) {
              const mult = (sel === 'gold') ? 14 : 2;
              totalWin += amount * mult;
            }
          });
          demoBetsRef.current = null;

          if (totalWin > 0) {
            setPlayableBalance(prev => prev + totalWin);
            playWinChime();
            setResultModal({
              show: true, won: true, amount: totalWin, sector: data.lastOutcome, isDemo: true
            });
          } else {
            setResultModal({
              show: true, won: false, amount: 0, sector: data.lastOutcome, isDemo: true
            });
          }
        } else if (pendingBetResultRef.current) {
          const res = pendingBetResultRef.current;
          if (res.won) {
            playWinChime();
          }
          setResultModal({
            show: true,
            won: res.won,
            amount: res.payout,
            sector: data.lastOutcome,
            isDemo: false
          });
          if (res.balance !== undefined && res.balance !== null) {
            setPlayableBalance(res.balance);
          }
          pendingBetResultRef.current = null;
        } else {
          // Neutral display (did not bet or bet lost)
          setResultModal({
            show: true,
            won: false,
            amount: 0,
            sector: data.lastOutcome,
            isDemo: false
          });
        }
      }, 3500);
    });

    socket.on('bet_placed_success', (data) => {
      if (data.game === 'roulette' && !isDemo) {
        setPlayableBalance(data.balance);
      }
    });

    socket.on('bet_result', (data) => {
      if (data.game === 'roulette' && !isDemo) {
        pendingBetResultRef.current = data; // Cache this to execute when ball stops
      }
    });

    return () => {
      socket.off('game_timers');
      socket.off('init_data');
      socket.off('roulette_resolution');
      socket.off('bet_placed_success');
      socket.off('bet_result');
    };
  }, [socket, setPlayableBalance, isDemo, bets]);


  const addBet = (sector, chipVal = activeChip) => {
    if (timer <= 3 || spinning || placedBets) return;
    playClick();
    setBets(prev => {
      const nextVal = prev[sector] + chipVal;
      const totalNext = Object.values(prev).reduce((a, b) => a + b, 0) - prev[sector] + nextVal;
      if (totalNext > playableBalance) {
        alert('Insufficient balance');
        return prev;
      }
      return { ...prev, [sector]: nextVal };
    });
  };

  const clearBets = () => {
    if (spinning || placedBets) return;
    playClick();
    setBets({ red: 0, black: 0, gold: 0 });
  };

  const doubleBets = () => {
    if (spinning || placedBets) return;
    playClick();
    const currentTotal = Object.values(bets).reduce((a, b) => a + b, 0);
    if (currentTotal * 2 > playableBalance) {
      alert('Insufficient balance to double all bets');
      return;
    }
    setBets(prev => ({
      red: prev.red * 2,
      black: prev.black * 2,
      gold: prev.gold * 2
    }));
  };

  const halfBets = () => {
    if (spinning || placedBets) return;
    playClick();
    setBets(prev => ({
      red: Math.floor(prev.red / 2),
      black: Math.floor(prev.black / 2),
      gold: Math.floor(prev.gold / 2)
    }));
  };

  const rebet = () => {
    if (spinning || placedBets) return;
    playClick();
    const prevTotal = Object.values(prevBetsRef.current).reduce((a, b) => a + b, 0);
    if (prevTotal === 0) return alert('No previous bets to repeat');
    if (prevTotal > playableBalance) return alert('Insufficient balance to rebet');
    setBets({ ...prevBetsRef.current });
  };

  const executeSpinBets = () => {
    const totalBetAmount = Object.values(bets).reduce((a, b) => a + b, 0);
    if (totalBetAmount === 0) return alert('Place some chips on the board first');
    if (timer <= 3) return alert('Betting closed for this round (3s lock)');

    setPlacedBets(true);
    prevBetsRef.current = { ...bets };

    if (isDemo) {
      setPlayableBalance(prev => prev - totalBetAmount);
      demoBetsRef.current = { ...bets };
      return;
    }

    Object.entries(bets).forEach(([selection, amount]) => {
      if (amount > 0) {
        socket.emit('place_bet', {
          userId: user.id,
          game: 'roulette',
          selection,
          amount
        });
      }
    });
  };

  const totalCurrentWager = Object.values(bets).reduce((a, b) => a + b, 0);

  const getStats = () => {
    if (history.length === 0) return { red: 48, black: 48, green: 4 };
    let r = 0, b = 0, g = 0;
    history.forEach(h => {
      if (h === 'red') r++;
      else if (h === 'black') b++;
      else g++;
    });
    const total = history.length;
    return {
      red: Math.round((r / total) * 100),
      black: Math.round((b / total) * 100),
      green: Math.round((g / total) * 100)
    };
  };
  const stats = getStats();

  const getPillColor = (val) => {
    if (val === 'red') return '#e22139';
    if (val === 'black') return '#1c1c1e';
    return '#00e676';
  };

  // Stacked 3D realistic chips drawing
  const renderPlacedChipStack = (amt) => {
    if (amt <= 0) return null;
    let chipColor = 'from-emerald-500 to-emerald-700 border-emerald-950 text-slate-900 dark:text-white';
    let stripeColor = 'rgba(255,255,255,0.4)';
    if (amt >= 1000) {
      chipColor = 'from-amber-400 to-amber-600 border-amber-950 text-black';
      stripeColor = 'rgba(0,0,0,0.3)';
    } else if (amt >= 500) {
      chipColor = 'from-purple-600 to-purple-800 border-purple-950 text-slate-900 dark:text-white';
      stripeColor = 'rgba(255,255,255,0.4)';
    } else if (amt >= 100) {
      chipColor = 'from-orange-500 to-orange-700 border-orange-950 text-slate-900 dark:text-white';
      stripeColor = 'rgba(255,255,255,0.4)';
    } else if (amt < 50) {
      chipColor = 'from-teal-500 to-teal-700 border-teal-950 text-slate-900 dark:text-white';
      stripeColor = 'rgba(255,255,255,0.4)';
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-[bounce_0.2s_ease-out]">
        <div className="relative w-8 h-8 rounded-full shadow-lg flex items-center justify-center">
          {/* 3D Bevel Edge shadow */}
          <div className="absolute inset-0 rounded-full bg-black/45 translate-y-1.5 blur-[1px]" />
          <div className="absolute inset-0 rounded-full bg-black/55 translate-y-0.5 border border-black/35" />
          {/* Chip Clay Body */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-b ${chipColor} border-2 flex items-center justify-center`}>
            {/* Edge stripes */}
            <div className="absolute inset-0 rounded-full border-4 border-dashed" style={{ borderColor: stripeColor }} />
            {/* Center core */}
            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-white/25 shadow-inner flex items-center justify-center text-[7px] font-black text-slate-900 dark:text-white font-mono leading-none">
              ₹{amt}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const totalPool = livePool.red + livePool.green + livePool.black;
  const pctRed = totalPool > 0 ? Math.round((livePool.red / totalPool) * 100) : 0;
  const pctGreen = totalPool > 0 ? Math.round((livePool.green / totalPool) * 100) : 0;
  const pctBlack = 100 - pctRed - pctGreen;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch w-full h-full select-none">
      
      {/* 1. LEFT SIDE: Console controls board */}
      <div className="lg:col-span-4 bg-slate-50 dark:bg-[#141622] border border-black/[0.05] dark:border-white/[0.02] p-5 rounded-3xl flex flex-col gap-4 shadow-xl justify-between h-full relative overflow-hidden">
        
        {/* Toggle Manual / Autoplay */}
        <div className="space-y-3">
          <div className="bg-slate-200/40 dark:bg-zinc-950/40 p-1 rounded-xl flex gap-1 border border-black/10 dark:border-white/5">
            <button
              onClick={() => { playClick(); setActiveTab('manual'); }}
              disabled={spinning || placedBets}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                  : 'bg-transparent text-slate-500 dark:text-text-muted hover:text-slate-900 dark:text-white'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => { playClick(); setActiveTab('autoplay'); }}
              disabled={spinning || placedBets}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                activeTab === 'autoplay'
                  ? 'bg-[#3de796] text-black shadow-md shadow-[#3de796]/10'
                  : 'bg-transparent text-slate-500 dark:text-text-muted hover:text-slate-900 dark:text-white'
              }`}
            >
              Autoplay
            </button>
          </div>

          {/* Wallet & Balance Header */}
          <div className="bg-slate-200/20 dark:bg-zinc-950/20 border border-black/10 dark:border-white/5 rounded-2xl p-3 flex justify-between items-center">
            <div>
              <span className="text-[8px] text-slate-500 dark:text-text-muted font-bold tracking-widest uppercase block leading-none">PLAY BALANCE</span>
              <span className="text-slate-900 dark:text-white font-extrabold text-sm block mt-1">₹{playableBalance.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[8px] text-slate-500 dark:text-text-muted font-bold tracking-widest uppercase block leading-none">TOTAL BET</span>
              <span className="text-[#3de796] font-black text-sm block mt-1">₹{totalCurrentWager}</span>
            </div>
          </div>
        </div>

        {/* Chips Selector display */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500 dark:text-text-muted font-bold tracking-widest uppercase">Select Chip Value</span>
            <button 
              onClick={clearBets}
              disabled={spinning || placedBets}
              className="text-[9px] text-[#ef4444] font-black uppercase bg-transparent border-0 cursor-pointer hover:underline"
            >
              Clear Chips
            </button>
          </div>
          
          <div className="grid grid-cols-5 gap-1.5 bg-slate-200/40 dark:bg-zinc-950/40 p-2.5 rounded-2xl border border-black/10 dark:border-white/5">
            {chipsList.map((val) => {
              let chipColor = 'from-emerald-500 to-emerald-700 border-emerald-950 text-slate-900 dark:text-white';
              let stripeColor = 'rgba(255,255,255,0.35)';
              if (val === 10) {
                chipColor = 'from-teal-500 to-teal-700 border-teal-950 text-slate-900 dark:text-white';
              } else if (val === 100) {
                chipColor = 'from-orange-500 to-orange-700 border-orange-950 text-slate-900 dark:text-white';
              } else if (val === 500) {
                chipColor = 'from-purple-600 to-purple-800 border-purple-950 text-slate-900 dark:text-white';
              } else if (val === 1000) {
                chipColor = 'from-amber-400 to-amber-600 border-amber-950 text-black';
                stripeColor = 'rgba(0,0,0,0.2)';
              }

              const isSelected = activeChip === val;
              
              // Color-matched glowing auras for each chip
              let glowColor = 'rgba(16,185,129,0.5)'; // 50 (green)
              if (val === 10) glowColor = 'rgba(20,184,166,0.5)'; // 10 (teal)
              else if (val === 100) glowColor = 'rgba(249,115,22,0.5)'; // 100 (orange)
              else if (val === 500) glowColor = 'rgba(168,85,247,0.5)'; // 500 (purple)
              else if (val === 1000) glowColor = 'rgba(245,158,11,0.5)'; // 1000 (gold)

              return (
                <button
                  key={val}
                  onClick={() => { playClick(); setActiveChip(val); }}
                  draggable={!(spinning || placedBets)}
                  onDragStart={(e) => {
                    playClick();
                    e.dataTransfer.setData('text/plain', String(val));
                  }}
                  className={`w-full aspect-square rounded-full relative border-0 cursor-grab active:cursor-grabbing p-0 select-none transition-all duration-300 ${
                    isSelected ? 'scale-115 -translate-y-2 opacity-100 z-10' : 'opacity-60 hover:opacity-90 hover:-translate-y-0.5'
                  }`}
                  style={{
                    filter: isSelected 
                      ? `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 2px 4px rgba(0,0,0,0.5))` 
                      : 'drop-shadow(0 4px 6px rgba(0,0,0,0.45))'
                  }}
                >
                  {/* Subtle luxury gold triangle pointer indicating active selection */}
                  {isSelected && (
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.7)] z-20 animate-[bounce_1.5s_infinite]" />
                  )}
                  {/* Bevel thickness */}
                  <div className="absolute inset-0 rounded-full bg-black/10 dark:bg-black/30 dark:bg-black/60 translate-y-1" />
                  {/* Clay outer body */}
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-b ${chipColor} border-2 border-black/30 flex items-center justify-center`}>
                    {/* Stripes */}
                    <div className="absolute inset-0 rounded-full border-[6px] border-dashed" style={{ borderColor: stripeColor }} />
                    {/* Inner golden ring for selected */}
                    {isSelected && <div className="absolute inset-0.5 rounded-full border border-white animate-pulse" />}
                    {/* Center metallic core */}
                    <div className="w-[60%] h-[60%] rounded-full bg-slate-100 dark:bg-zinc-900 shadow-inner flex flex-col items-center justify-center text-slate-900 dark:text-white font-black leading-none font-mono">
                      <span className="text-[7px] text-[#d4af37] font-bold">₹</span>
                      <span className="text-[10px] tracking-tighter">{val}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Live Multiplayer Pools Widget to show live betting action */}
        <div className="bg-slate-200/30 dark:bg-zinc-950/30 border border-black/10 dark:border-white/5 rounded-2xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-[8px] text-slate-500 dark:text-text-muted font-bold tracking-widest uppercase">
            <span>LIVE MULTIPLAYER BETS</span>
            <span className="text-[#3de796] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3de796] animate-pulse" /> LIVE POOL</span>
          </div>
          
          {/* Progress bar visualizer */}
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-black/10 dark:border-white/5">
            <div 
              className="bg-[#d32f2f] transition-all duration-500 shadow-[0_0_8px_rgba(211,47,47,0.4)]" 
              style={{ width: `${pctRed}%` }} 
              title={`Red: ₹${livePool.red.toLocaleString('en-IN')}`}
            />
            <div 
              className="bg-[#2e7d32] transition-all duration-500 shadow-[0_0_8px_rgba(46,125,50,0.4)]" 
              style={{ width: `${pctGreen}%` }} 
              title={`Green: ₹${livePool.green.toLocaleString('en-IN')}`}
            />
            <div 
              className="bg-[#1c1c1e] border-l border-black/15 dark:border-white/10 transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.05)]" 
              style={{ width: `${pctBlack}%` }} 
              title={`Black: ₹${livePool.black.toLocaleString('en-IN')}`}
            />
          </div>
          
          {/* Numbers list display */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-black uppercase">
            <div className="bg-red-500/5 rounded p-1 border border-red-500/10 flex flex-col justify-center">
              <span className="text-red-400 block text-[6.5px] font-bold tracking-wider leading-none">RED POOL</span>
              <span className="text-slate-900 dark:text-white font-mono text-[9px] mt-1">₹{livePool.red.toLocaleString('en-IN')}</span>
              <span className="text-slate-900 dark:text-white/30 text-[5.5px] mt-0.5 font-sans lowercase">({pctRed}%)</span>
            </div>
            <div className="bg-emerald-500/5 rounded p-1 border border-emerald-500/10 flex flex-col justify-center">
              <span className="text-emerald-400 block text-[6.5px] font-bold tracking-wider leading-none">GREEN POOL</span>
              <span className="text-slate-900 dark:text-white font-mono text-[9px] mt-1">₹{livePool.green.toLocaleString('en-IN')}</span>
              <span className="text-slate-900 dark:text-white/30 text-[5.5px] mt-0.5 font-sans lowercase">({pctGreen}%)</span>
            </div>
            <div className="bg-slate-300/10 dark:bg-zinc-800/10 rounded p-1 border border-black/10 dark:border-white/5 flex flex-col justify-center">
              <span className="text-slate-500 dark:text-zinc-400 block text-[6.5px] font-bold tracking-wider leading-none">BLACK POOL</span>
              <span className="text-slate-900 dark:text-white font-mono text-[9px] mt-1">₹{livePool.black.toLocaleString('en-IN')}</span>
              <span className="text-slate-900 dark:text-white/30 text-[5.5px] mt-0.5 font-sans lowercase">({pctBlack}%)</span>
            </div>
          </div>

          {/* Decorative Divider */}
          <div className="w-full h-[1px] bg-black/5 dark:bg-white/5 my-1" />

          {/* Recent Live Wagers Log Feed */}
          <div className="space-y-1">
            <span className="text-[7.5px] text-slate-500 dark:text-text-muted font-bold tracking-widest uppercase block">RECENT LIVE WAGERS</span>
            <div className="space-y-1 max-h-[85px] overflow-hidden flex flex-col justify-end">
              {liveWagers.length > 0 ? (
                liveWagers.map(wager => (
                  <div key={wager.id} className="flex items-center text-[8px] bg-slate-200/20 dark:bg-zinc-950/20 border border-black/[0.05] dark:border-white/[0.02] p-1 px-2.5 rounded-lg text-slate-900 dark:text-white font-mono animate-[wagerFadeIn_0.2s_ease-out_forwards]">
                    <span className="w-16 font-semibold text-slate-900 dark:text-white/80 text-left">{wager.phone}</span>
                    <span className="w-12 text-slate-900 dark:text-white/40 text-[7px] uppercase font-sans text-center">bet on</span>
                    <span className="w-12 flex justify-center">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_rgba(0,0,0,0.5)] transition-all" 
                        style={{ 
                          backgroundColor: wager.selection === 'black' ? '#0f1015' : wager.selection === 'gold' ? '#00e676' : '#e22139',
                          border: wager.selection === 'black' ? '1.5px solid rgba(255, 255, 255, 0.85)' : '1px solid rgba(255,255,255,0.1)'
                        }} 
                      />
                    </span>
                    <span className="flex-1 text-right font-black text-[#3de796] text-[8.5px]">₹{wager.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))
              ) : (
                <div className="text-[7.5px] text-slate-900 dark:text-white/20 italic p-1">Waiting for live wagers...</div>
              )}
            </div>
          </div>
        </div>

        {/* Console Action buttons (Clear, Undo, Double, Half) */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={clearBets}
            disabled={spinning || placedBets}
            className="bg-slate-200/60 dark:bg-zinc-900/60 hover:bg-[#3de796]/10 text-slate-900 dark:text-white hover:text-[#3de796] border border-black/10 dark:border-white/5 hover:border-[#3de796]/20 py-3 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 size={13} />
            <span className="text-[8px] font-black uppercase tracking-wider">Clear</span>
          </button>
          <button
            onClick={rebet}
            disabled={spinning || placedBets}
            className="bg-slate-200/60 dark:bg-zinc-900/60 hover:bg-[#3de796]/10 text-slate-900 dark:text-white hover:text-[#3de796] border border-black/10 dark:border-white/5 hover:border-[#3de796]/20 py-3 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <RotateCcw size={13} />
            <span className="text-[8px] font-black uppercase tracking-wider">Rebet</span>
          </button>
          <button
            onClick={doubleBets}
            disabled={spinning || placedBets}
            className="bg-slate-200/60 dark:bg-zinc-900/60 hover:bg-[#3de796]/10 text-slate-900 dark:text-white hover:text-[#3de796] border border-black/10 dark:border-white/5 hover:border-[#3de796]/20 py-3 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span className="text-[10px] font-bold">x2</span>
            <span className="text-[8px] font-black uppercase tracking-wider">Double</span>
          </button>
          <button
            onClick={halfBets}
            disabled={spinning || placedBets}
            className="bg-slate-200/60 dark:bg-zinc-900/60 hover:bg-[#3de796]/10 text-slate-900 dark:text-white hover:text-[#3de796] border border-black/10 dark:border-white/5 hover:border-[#3de796]/20 py-3 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span className="text-[10px] font-bold">½</span>
            <span className="text-[8px] font-black uppercase tracking-wider">Half</span>
          </button>
        </div>

        {/* Large neon execution block button */}
        <button
          onClick={executeSpinBets}
          disabled={timer <= 3 || spinning || totalCurrentWager === 0 || placedBets}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-0 cursor-pointer transition-all ${
            timer > 3 && !spinning && totalCurrentWager > 0 && !placedBets
              ? 'bg-gradient-to-r from-emerald-400 to-[#3de796] hover:from-emerald-500 hover:to-[#3de796]/95 text-black shadow-[0_4px_20px_rgba(61,231,150,0.2)] hover:shadow-[0_6px_25px_rgba(61,231,150,0.35)] hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-slate-300/80 dark:bg-zinc-800/80 text-slate-900 dark:text-white/20'
          }`}
        >
          {spinning ? 'SPINNING...' : placedBets ? 'BETS LOCKED' : timer <= 3 ? 'CLOSED' : 'PLACE BET'}
        </button>

        {/* CSS Keyframes for sliding toasts */}
        <style>{`
          @keyframes toastSlideUp {
            from { transform: translateY(60px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes toastSlideDown {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(60px); opacity: 0; }
          }
          @keyframes wagerFadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

      </div>

      {/* 2. CENTER PANEL: 3D Wheel & Betting Grid */}
      <div className="lg:col-span-8 flex flex-col gap-4 justify-between h-full">
        
        {/* Real 3D Wheel viewport frame styled as luxury green felt table */}
        <div 
          className="rounded-3xl flex flex-col justify-center items-center relative overflow-hidden flex-1 py-5"
          style={{
            background: 'radial-gradient(circle at center, #0c5e37 0%, #063c22 65%, #021a0f 100%)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.85), 0 15px 35px rgba(0,0,0,0.6)',
            border: '2.5px solid rgba(212, 175, 55, 0.5)'
          }}
        >
          {/* Decorative luxury gold felt design lines */}
          <div className="absolute inset-4 rounded-2xl border border-dashed border-[#d4af37]/15 pointer-events-none" />
          
          {/* Luxury LED Countdown Banner */}
          <div className="absolute top-4 flex flex-col items-center pointer-events-none select-none z-20">
            <div className="text-[7.5px] text-[#d4af37] font-black tracking-widest uppercase mb-0.5 drop-shadow-md">
              {timer <= 3 ? 'SPINNING / CLOSED' : 'ACCEPTING BETS'}
            </div>
            <div className="px-4 py-1 rounded-full bg-slate-200/90 dark:bg-zinc-950/90 border border-[#d4af37]/30 flex items-center gap-2 shadow-2xl">
              <span className={`w-1.5 h-1.5 rounded-full ${timer <= 3 ? 'bg-red-500 animate-ping' : 'bg-[#3de796] animate-pulse'}`} />
              <span className="font-mono text-xs font-black tracking-widest text-slate-900 dark:text-white">
                00:{timer < 10 ? `0${timer}` : timer}
              </span>
            </div>
          </div>

          <div className="relative flex justify-center items-center">
            {/* Creative glowing radial progress ring hugging the wheel outer diameter */}
            <svg className="absolute w-[324px] h-[324px] -rotate-90 pointer-events-none z-10" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="47"
                fill="transparent"
                stroke="rgba(212, 175, 55, 0.08)"
                strokeWidth="1.2"
              />
              <circle
                cx="50"
                cy="50"
                r="47"
                fill="transparent"
                stroke={timer <= 3 ? '#ef4444' : '#3de796'}
                strokeWidth="1.2"
                strokeDasharray="295.3"
                strokeDashoffset={295.3 - (295.3 * Math.max(0, timer - 3)) / 12}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: timer <= 3 ? 'drop-shadow(0 0 3px #ef4444)' : 'drop-shadow(0 0 3px #3de796)'
                }}
              />
            </svg>

            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              className="block pointer-events-none"
              style={{ width: '300px', height: '300px' }}
            />
          </div>

          {/* Creative In-Card Result Notification Overlay */}
          {resultModal.show && (
            <div className="absolute inset-0 bg-black/15 dark:bg-black/40 backdrop-blur-[6px] flex items-center justify-center z-30 animate-[rouletteFadeIn_0.2s_ease-out]">
              <style>{`
                @keyframes rouletteFadeIn {
                  from { opacity: 0; backdrop-filter: blur(0px); }
                  to { opacity: 1; backdrop-filter: blur(6px); }
                }
                @keyframes rouletteScaleIn {
                  from { transform: scale(0.85) translateY(10px); opacity: 0; }
                  to { transform: scale(1) translateY(0); opacity: 1; }
                }
              `}</style>
              <div 
                className="p-5 rounded-3xl border border-[#d4af37] text-center shadow-2xl relative w-[240px] overflow-hidden flex flex-col items-center gap-3 animate-[rouletteScaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(24, 27, 42, 0.95) 0%, rgba(13, 15, 25, 0.98) 100%)',
                  boxShadow: resultModal.sector === 'red' 
                    ? '0 10px 30px rgba(239,68,68,0.25), inset 0 0 15px rgba(239,68,68,0.15)' 
                    : resultModal.sector === 'black' 
                    ? '0 10px 30px rgba(255,255,255,0.06), inset 0 0 15px rgba(255,255,255,0.05)'
                    : '0 10px 30px rgba(255,215,0,0.3), inset 0 0 15px rgba(255,215,0,0.2)'
                }}
              >
                {/* Gold trim internal accent frame */}
                <div className="absolute inset-1 rounded-[20px] border border-[#d4af37]/15 pointer-events-none" />

                {/* Close button */}
                <button 
                  onClick={() => setResultModal(prev => ({ ...prev, show: false }))}
                  className="absolute top-3 right-3 text-slate-900 dark:text-white/40 hover:text-slate-900 dark:text-white bg-transparent border-0 cursor-pointer text-xs font-black"
                >
                  ✕
                </button>

                {/* Sparkles / Winner icons */}
                <div className="flex items-center gap-1.5 text-[#d4af37]">
                  <Sparkles size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="text-[7.5px] font-black tracking-[0.25em] uppercase">ROULETTE RESULT</span>
                  <Sparkles size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
                </div>

                {/* Large landing sector display */}
                <div className="flex flex-col items-center gap-0.5">
                  <div 
                    className="w-12 h-12 rounded-xl border-2 border-black/20 dark:border-white/20 flex items-center justify-center text-[9px] font-black uppercase text-slate-900 dark:text-white shadow-lg"
                    style={{
                      backgroundColor: getPillColor(resultModal.sector),
                      boxShadow: '0 4px 10px rgba(0,0,0,0.35), inset 0 2px 6px rgba(255,255,255,0.3)'
                    }}
                  >
                    {resultModal.sector === 'gold' ? 'green' : resultModal.sector}
                  </div>
                  <span className="text-[6px] text-[#d4af37]/80 font-black tracking-widest uppercase mt-0.5">LANDED SECTOR</span>
                </div>

                {/* Dynamic bet result statement */}
                <div className="space-y-0.5 z-10 w-full">
                  {resultModal.won ? (
                    <div className="animate-[bounce_1s_infinite]">
                      <div className="text-[#3de796] font-black text-xs tracking-widest uppercase">
                        YOU WON!
                      </div>
                      <div className="text-slate-900 dark:text-white font-mono text-sm font-black tracking-wider mt-0.5">
                        ₹{resultModal.amount.toFixed(2)}
                      </div>
                      <div className="text-[#d4af37] text-[6px] font-black uppercase tracking-wider mt-0.5">
                        {resultModal.isDemo ? 'DEMO CREDITED' : 'BALANCE UPDATED'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-slate-900 dark:text-white/80 font-black text-[10px] tracking-wider uppercase">
                        {(resultModal.sector === 'gold' ? 'green' : resultModal.sector).toUpperCase()} LANDED
                      </div>
                      <div className="text-slate-500 dark:text-text-muted text-[7.5px] font-black uppercase tracking-wider mt-0.5">
                        Try placing a chip next time!
                      </div>
                    </div>
                  )}
                </div>

                {/* Decorative gold divider */}
                <div className="w-10 h-[1px] bg-[#d4af37]/25" />
              </div>
            </div>
          )}

          {winSector && !resultModal.show && (
            <div className="absolute bottom-4 bg-slate-200/80 dark:bg-zinc-950/80 border border-[#d4af37]/25 px-3 py-1 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-900 dark:text-white shadow-md z-20">
              Landed: <span className="px-2 py-0.5 rounded" style={{ backgroundColor: getPillColor(winSector), color: winSector === 'gold' ? '#000' : '#fff' }}>{winSector}</span>
            </div>
          )}
        </div>

        {/* Simplified color betting felt grid board */}
        <div className="bg-slate-50 dark:bg-[#141622] border border-black/[0.05] dark:border-white/[0.02] p-4 rounded-3xl flex flex-col gap-2.5 shadow-xl relative">
          <style>{`
            @keyframes rouletteBadgeBounce {
              0% { transform: scale(0.5); opacity: 0; }
              60% { transform: scale(1.1); opacity: 0.9; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div className="flex justify-between items-center text-[9px] font-black text-slate-500 dark:text-text-muted uppercase tracking-widest border-b border-black/10 dark:border-white/5 pb-2">
            <span className="flex items-center gap-3">
              <span>PLACE YOUR BETS</span>
              <span className="text-slate-900 dark:text-white/10">|</span>
              <div className="flex items-center gap-1.5 py-0.5">
                {history.slice(0, 10).map((h, i) => (
                  <div
                    key={i}
                    className="w-3.5 h-3.5 rounded shadow-inner border border-white/15 cursor-help transition-all hover:scale-110"
                    style={{
                      backgroundColor: getPillColor(h),
                      borderColor: h === 'gold' ? '#ffd700' : 'rgba(255,255,255,0.15)'
                    }}
                    title={h.toUpperCase()}
                  />
                ))}
              </div>
            </span>
            <span className="flex items-center gap-1 text-[#3de796]"><ShieldCheck size={11} /> Provably Fair</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* RED felt slot */}
            <button
              onClick={() => addBet('red')}
              onDragOver={(e) => { if (timer > 3 && !spinning && !placedBets) e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                if (timer <= 3 || spinning || placedBets) return;
                const draggedVal = parseInt(e.dataTransfer.getData('text/plain'));
                if (!isNaN(draggedVal)) addBet('red', draggedVal);
              }}
              disabled={timer <= 3 || spinning || placedBets}
              className="relative aspect-[2.3/1] rounded-2xl cursor-pointer border border-white/[0.03] transition-all hover:scale-[1.02] flex flex-col items-center justify-center pt-2"
              style={{
                background: 'radial-gradient(circle at center, #ef5350, #b71c1c)',
                boxShadow: bets.red > 0 ? '0 0 25px rgba(226,33,57,0.45), inset 0 2px 10px rgba(255,255,255,0.25)' : 'inset 0 2px 8px rgba(255,255,255,0.1)'
              }}
            >
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-wider drop-shadow-md">Red</span>



              {/* Designated Chip Placement Circle (Centered) */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center relative shadow-inner mt-2 transition-all duration-300 ${
                bets.red > 0 
                  ? 'border-2 border-solid border-[#d4af37] bg-black/10 dark:bg-black/30 dark:bg-black/60 shadow-[0_0_12px_rgba(212,175,55,0.5)] scale-105' 
                  : 'border border-dashed border-white/25 bg-black/10 dark:bg-black/35'
              }`}>
                {bets.red > 0 ? (
                  renderPlacedChipStack(bets.red)
                ) : (
                  <span className="text-[5.5px] text-slate-900 dark:text-white/30 font-black tracking-widest">BET</span>
                )}
              </div>

              {/* Watermark Payout Label on Right */}
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white/[0.16] text-[48px] font-black tracking-tighter select-none pointer-events-none italic font-mono leading-none">2x</span>
            </button>

            {/* GREEN felt slot */}
            <button
              onClick={() => addBet('gold')}
              onDragOver={(e) => { if (timer > 3 && !spinning && !placedBets) e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                if (timer <= 3 || spinning || placedBets) return;
                const draggedVal = parseInt(e.dataTransfer.getData('text/plain'));
                if (!isNaN(draggedVal)) addBet('gold', draggedVal);
              }}
              disabled={timer <= 3 || spinning || placedBets}
              className="relative aspect-[2.3/1] rounded-2xl cursor-pointer border border-white/[0.03] transition-all hover:scale-[1.02] flex flex-col items-center justify-center pt-2"
              style={{
                background: 'radial-gradient(circle at center, #2e7d32, #0d3c12)',
                boxShadow: bets.gold > 0 ? '0 0 25px rgba(46,125,50,0.45), inset 0 2px 10px rgba(255,255,255,0.25)' : 'inset 0 2px 8px rgba(255,255,255,0.1)'
              }}
            >
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-wider drop-shadow-md">Green</span>



              {/* Designated Chip Placement Circle (Centered) */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center relative shadow-inner mt-2 transition-all duration-300 ${
                bets.gold > 0 
                  ? 'border-2 border-solid border-[#d4af37] bg-black/10 dark:bg-black/30 dark:bg-black/60 shadow-[0_0_12px_rgba(212,175,55,0.5)] scale-105' 
                  : 'border border-dashed border-white/25 bg-black/10 dark:bg-black/35'
              }`}>
                {bets.gold > 0 ? (
                  renderPlacedChipStack(bets.gold)
                ) : (
                  <span className="text-[5.5px] text-slate-900 dark:text-white/30 font-black tracking-widest">BET</span>
                )}
              </div>

              {/* Watermark Payout Label on Right */}
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white/[0.16] text-[48px] font-black tracking-tighter select-none pointer-events-none italic font-mono leading-none">14x</span>
            </button>

            {/* BLACK felt slot */}
            <button
              onClick={() => addBet('black')}
              onDragOver={(e) => { if (timer > 3 && !spinning && !placedBets) e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                if (timer <= 3 || spinning || placedBets) return;
                const draggedVal = parseInt(e.dataTransfer.getData('text/plain'));
                if (!isNaN(draggedVal)) addBet('black', draggedVal);
              }}
              disabled={timer <= 3 || spinning || placedBets}
              className="relative aspect-[2.3/1] rounded-2xl cursor-pointer border border-white/[0.03] transition-all hover:scale-[1.02] flex flex-col items-center justify-center pt-2"
              style={{
                background: 'radial-gradient(circle at center, #373a4a, #0b0c11)',
                boxShadow: bets.black > 0 ? '0 0 25px rgba(255,255,255,0.08), inset 0 2px 10px rgba(255,255,255,0.2)' : 'inset 0 2px 8px rgba(255,255,255,0.1)'
              }}
            >
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-wider drop-shadow-md">Black</span>



              {/* Designated Chip Placement Circle (Centered) */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center relative shadow-inner mt-2 transition-all duration-300 ${
                bets.black > 0 
                  ? 'border-2 border-solid border-[#d4af37] bg-black/10 dark:bg-black/30 dark:bg-black/60 shadow-[0_0_12px_rgba(212,175,55,0.5)] scale-105' 
                  : 'border border-dashed border-white/25 bg-black/10 dark:bg-black/35'
              }`}>
                {bets.black > 0 ? (
                  renderPlacedChipStack(bets.black)
                ) : (
                  <span className="text-[5.5px] text-slate-900 dark:text-white/30 font-black tracking-widest">BET</span>
                )}
              </div>

              {/* Watermark Payout Label on Right */}
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white/[0.16] text-[48px] font-black tracking-tighter select-none pointer-events-none italic font-mono leading-none">2x</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
