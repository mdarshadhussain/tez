'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Info } from 'lucide-react';
import { playClick, playWinChime } from '../utils/audio';

// Detailed multipliers table matching Stake/Spribe layout for rows 8 to 16
const MULTIPLIERS = {
  8: {
    low: [5.6, 1.6, 1.1, 1.0, 0.5, 1.0, 1.1, 1.6, 5.6],
    mid: [13.0, 3.0, 1.3, 0.7, 0.4, 0.7, 1.3, 3.0, 13.0],
    high: [29.0, 4.0, 1.5, 0.3, 0.2, 0.3, 1.5, 4.0, 29.0]
  },
  9: {
    low: [5.6, 2.0, 1.6, 1.0, 0.7, 0.7, 1.0, 1.6, 2.0, 5.6],
    mid: [18.0, 4.0, 1.6, 0.9, 0.5, 0.5, 0.9, 1.6, 4.0, 18.0],
    high: [43.0, 7.0, 2.0, 0.6, 0.2, 0.2, 0.6, 2.0, 7.0, 43.0]
  },
  10: {
    low: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
    mid: [22.0, 5.0, 2.0, 1.4, 0.6, 0.4, 0.6, 1.4, 2.0, 5.0, 22.0],
    high: [76.0, 10.0, 3.0, 0.9, 0.3, 0.2, 0.3, 0.9, 3.0, 10.0, 76.0]
  },
  11: {
    low: [8.9, 3.0, 1.7, 1.2, 1.0, 0.7, 0.7, 1.0, 1.2, 1.7, 3.0, 8.9],
    mid: [24.0, 6.0, 3.0, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3.0, 6.0, 24.0],
    high: [120.0, 14.0, 4.3, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 4.3, 14.0, 120.0]
  },
  12: {
    low: [10.0, 4.0, 2.0, 1.6, 1.1, 1.0, 0.5, 1.0, 1.1, 1.6, 2.0, 4.0, 10.0],
    mid: [33.0, 11.0, 4.0, 2.0, 1.1, 0.6, 0.3, 0.6, 1.1, 2.0, 4.0, 11.0, 33.0],
    high: [170.0, 24.0, 8.1, 2.0, 0.7, 0.2, 0.2, 0.2, 0.7, 2.0, 8.1, 24.0, 170.0]
  },
  13: {
    low: [10.0, 4.0, 2.5, 1.8, 1.2, 1.0, 0.7, 0.7, 1.0, 1.2, 1.8, 2.5, 4.0, 10.0],
    mid: [43.0, 13.0, 6.0, 3.0, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3.0, 6.0, 13.0, 43.0],
    high: [260.0, 37.0, 11.0, 4.0, 1.0, 0.2, 0.2, 0.2, 0.2, 1.0, 4.0, 11.0, 37.0, 260.0]
  },
  14: {
    low: [12.0, 5.0, 3.0, 2.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 2.0, 3.0, 5.0, 12.0],
    mid: [58.0, 15.0, 7.0, 4.0, 1.9, 1.0, 0.5, 0.2, 0.5, 1.0, 1.9, 4.0, 7.0, 15.0, 58.0],
    high: [420.0, 56.0, 18.0, 5.0, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5.0, 18.0, 56.0, 420.0]
  },
  15: {
    low: [12.0, 5.0, 3.5, 2.2, 1.5, 1.2, 1.0, 0.7, 0.7, 1.0, 1.2, 1.5, 2.2, 3.5, 5.0, 12.0],
    mid: [88.0, 18.0, 9.0, 5.0, 2.5, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 2.5, 5.0, 9.0, 18.0, 88.0],
    high: [620.0, 83.0, 27.0, 8.0, 3.0, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3.0, 8.0, 27.0, 83.0, 620.0]
  },
  16: {
    low: [16.0, 9.0, 2.0, 1.4, 1.3, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.3, 1.4, 2.0, 9.0, 16.0],
    mid: [110.0, 41.0, 10.0, 5.0, 3.0, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3.0, 5.0, 10.0, 41.0, 110.0],
    high: [1000.0, 130.0, 26.0, 9.0, 4.0, 2.0, 0.2, 0.2, 0.2, 0.2, 0.2, 2.0, 4.0, 9.0, 26.0, 130.0, 1000.0]
  }
};

// Programmatic synthesizer for wooden/plastic bounce pops
const playRealisticBounce = () => {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch (e) {
    console.error(e);
  }
};

export default function Plinko({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [betAmount, setBetAmount] = useState('10.00');
  const [rows, setRows] = useState(8);
  const [risk, setRisk] = useState('low');
  const [bias, setBias] = useState('classic');
  const [recentMultipliers, setRecentMultipliers] = useState([]);

  // Autoplay states
  const [autoplayActive, setAutoplayActive] = useState(false);
  const [autoplayBetsCount, setAutoplayBetsCount] = useState(10);
  const [currentAutoplayRemaining, setCurrentAutoplayRemaining] = useState(0);
  const [totalWagered, setTotalWagered] = useState(0);
  const [totalProfits, setTotalProfits] = useState(0);

  const [hitBinPulse, setHitBinPulse] = useState(null);

  const canvasRef = useRef(null);
  const ballsRef = useRef([]);
  const pegsRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Helper to calculate peg coordinates of the bottom row of pegs (Row index rows - 1)
  const getBottomPegCoordinates = () => {
    const W = 640;
    const startY = 45;
    const rowSpacing = Math.min(36, 380 / rows);
    const colSpacing = rowSpacing * 1.05;
    
    // Bottom row has index r = rows - 1
    const r = rows - 1;
    const numPegs = r + 3;
    const rowWidth = (numPegs - 1) * colSpacing;
    const startX = (W - rowWidth) / 2;

    const coords = [];
    for (let p = 0; p < numPegs; p++) {
      coords.push(startX + p * colSpacing);
    }
    return coords;
  };

  // Initialize/Update pegs coordinates (Rows count R implies rows of pegs from 0 to R - 1)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;

    const startY = 45;
    const rowSpacing = Math.min(36, 380 / rows);
    const colSpacing = rowSpacing * 1.05;

    const pegs = [];
    for (let r = 0; r < rows; r++) {
      const numPegs = r + 3;
      const rowY = startY + r * rowSpacing;
      const rowWidth = (numPegs - 1) * colSpacing;
      const startX = (W - rowWidth) / 2;

      for (let p = 0; p < numPegs; p++) {
        pegs.push({
          x: startX + p * colSpacing,
          y: rowY,
          active: false,
          activeTimer: 0,
          row: r,
          col: p
        });
      }
    }
    pegsRef.current = pegs;
  }, [rows]);

  // Main Canvas render and physics simulator loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const render = () => {
      ctx.clearRect(0, 0, W, H);

      // Draw lane dividers aligned EXACTLY with the bottom pegs
      const bottomPegXCoords = getBottomPegCoordinates();
      const currentMultipliers = MULTIPLIERS[rows][risk];
      const rowSpacing = Math.min(36, 380 / rows);
      const bottomPegY = 45 + (rows - 1) * rowSpacing;

      // Dividers are drawn straight down from each bottom peg
      for (let idx = 0; idx < bottomPegXCoords.length; idx++) {
        const lineX = bottomPegXCoords[idx];
        const grad = ctx.createLinearGradient(lineX, H, lineX, bottomPegY + 8);
        
        const totalBins = currentMultipliers.length;
        const distanceCenter = Math.abs(idx - totalBins / 2);
        const normalized = distanceCenter / (totalBins / 2);

        let strokeColor = 'rgba(255, 82, 82, 0.25)';
        if (normalized < 0.25) {
          strokeColor = 'rgba(37, 244, 180, 0.25)';
        } else if (normalized < 0.6) {
          strokeColor = 'rgba(255, 159, 67, 0.25)';
        }

        grad.addColorStop(0, strokeColor);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.moveTo(lineX, H);
        ctx.lineTo(lineX, bottomPegY + 8);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // Draw pegs
      const pegs = pegsRef.current;
      for (const peg of pegs) {
        if (peg.activeTimer > 0) {
          peg.activeTimer--;
          if (peg.activeTimer === 0) peg.active = false;
        }

        // Concentric outer shadow circle
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.active ? 8.5 : 6, 0, 2 * Math.PI);
        ctx.fillStyle = peg.active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
        ctx.fill();

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.active ? 4.5 : 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = peg.active ? '#ffffff' : '#a0aebf';
        if (peg.active) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffffff';
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw/Update falling balls
      const balls = ballsRef.current;
      for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.frame++;

        if (ball.frame >= ball.duration) {
          // Trigger peg glow and audio impact
          const currentTarget = ball.path[ball.segmentIndex];
          if (currentTarget && !currentTarget.isBin) {
            const peg = pegs.find(p => Math.abs(p.x - currentTarget.x) < 2 && Math.abs(p.y - currentTarget.y) < 2);
            if (peg) {
              peg.active = true;
              peg.activeTimer = 8;
            }
            playRealisticBounce();
          }

          // Advance to next row
          ball.segmentIndex++;
          ball.frame = 0;

          if (ball.segmentIndex >= ball.path.length) {
            // Ball landed in bottom bin
            const finalMult = ball.multiplier;
            const payout = parseFloat((ball.stake * finalMult).toFixed(2));
            settlePayout(ball.stake, finalMult, payout);

            setHitBinPulse(ball.targetBin);
            setTimeout(() => setHitBinPulse(null), 300);

            setRecentMultipliers(prev => [finalMult, ...prev.slice(0, 7)]);
            playWinChime();

            balls.splice(i, 1);
            continue;
          }

          // Recalculate kinematics equations for new segment
          const pStart = ball.path[ball.segmentIndex - 1];
          const pEnd = ball.path[ball.segmentIndex];
          
          ball.startX = pStart.x;
          ball.startY = pStart.y;
          ball.endX = pEnd.x;
          ball.endY = pEnd.y;

          const T = ball.duration;
          const g = 0.32; // Gravity
          ball.vx = (ball.endX - ball.startX) / T;
          ball.vy = (ball.endY - ball.startY - 0.5 * g * T * T) / T;
        }

        // Evaluate kinematic formulas
        const t = ball.frame;
        const g = 0.32;
        const x = ball.startX + ball.vx * t;
        const y = ball.startY + ball.vy * t + 0.5 * g * t * t;

        // Draw ball with its pre-selected risk color
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, 2 * Math.PI);
        ctx.fillStyle = ball.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = ball.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [rows, risk]);

  const settlePayout = async (stake, mult, payout) => {
    if (isDemo) {
      setPlayableBalance(prev => prev + payout);
      if (autoplayActive) {
        setTotalProfits(prev => prev + (payout - stake));
      }
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/games/record-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          game: 'plinko',
          bet_amount: stake,
          payout_multiplier: mult,
          payout_amount: payout,
          is_won: mult >= 1.00,
          raw_selection: { rows, risk, bias }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
        if (autoplayActive) {
          setTotalProfits(prev => prev + (payout - stake));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getTargetBinIndex = () => {
    let rightBounces = 0;
    let pRight = 0.5;
    if (bias === 'left') pRight = 0.33;
    if (bias === 'right') pRight = 0.67;

    for (let i = 0; i < rows; i++) {
      if (Math.random() < pRight) {
        rightBounces++;
      }
    }
    return rightBounces;
  };

  const dropBall = (customBet = null) => {
    const amt = parseFloat(customBet !== null ? customBet : betAmount);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid bet amount');
    if (amt > playableBalance) {
      setAutoplayActive(false);
      return alert('Insufficient balance');
    }

    playClick();

    setPlayableBalance(prev => prev - amt);
    if (autoplayActive) {
      setTotalWagered(prev => prev + amt);
    }

    const targetBin = getTargetBinIndex();
    const multList = MULTIPLIERS[rows][risk];
    const multiplier = multList[targetBin];

    const decisions = Array(rows).fill(0);
    for (let i = 0; i < targetBin; i++) {
      decisions[i] = 1;
    }
    for (let i = decisions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [decisions[i], decisions[j]] = [decisions[j], decisions[i]];
    }

    const startY = 45;
    const rowSpacing = Math.min(36, 380 / rows);
    const colSpacing = rowSpacing * 1.05;
    const W = canvasRef.current.width;

    const path = [];
    let currentCol = 1; // start above row 0 (which has middle index 1)
    
    // Animate hitting each row
    for (let r = 0; r < rows; r++) {
      const numPegs = r + 3;
      const rowY = startY + r * rowSpacing;
      const rowWidth = (numPegs - 1) * colSpacing;
      const startX = (W - rowWidth) / 2;

      const basePegX = startX + currentCol * colSpacing;

      const decision = decisions[r] !== undefined ? decisions[r] : (Math.random() < 0.5 ? 1 : 0);
      const impactOffset = decision === 1 ? -4.5 : 4.5;

      path.push({
        x: basePegX + impactOffset,
        y: rowY - 6.5,
        isBin: false
      });

      currentCol += decision;
    }

    // Final target landing bin coordinate centered between peg `targetBin` and peg `targetBin + 1`
    const bottomPegCoords = getBottomPegCoordinates();
    const finalX = (bottomPegCoords[targetBin] + bottomPegCoords[targetBin + 1]) / 2;
    
    path.push({
      x: finalX,
      y: canvasRef.current.height - 10,
      isBin: true
    });

    const ballStartX = (W - (2 * colSpacing)) / 2 + 1 * colSpacing;
    const T = 15; // frame duration per bounce

    // Determine initial kinematic velocity to strike row 0 peg
    const firstPeg = path[0];
    const vx = (firstPeg.x - ballStartX) / T;
    const vy = (firstPeg.y - 10 - 0.5 * 0.32 * T * T) / T;

    // Pick ball color based on selected risk level:
    // LOW = Green (#30d158), MID = Yellow (#ff9f43), HIGH = Red (#ff5252)
    let ballColor = '#30d158';
    if (risk === 'mid') ballColor = '#ff9f43';
    if (risk === 'high') ballColor = '#ff5252';

    ballsRef.current.push({
      startX: ballStartX,
      startY: 10,
      endX: firstPeg.x,
      endY: firstPeg.y,
      vx,
      vy,
      path,
      segmentIndex: 0,
      frame: 0,
      duration: T,
      stake: amt,
      multiplier,
      targetBin,
      color: ballColor
    });
  };

  // Autoplay loop timer
  useEffect(() => {
    if (!autoplayActive) return;
    if (currentAutoplayRemaining <= 0) {
      setAutoplayActive(false);
      return;
    }

    dropBall();

    const interval = setTimeout(() => {
      setCurrentAutoplayRemaining(prev => prev - 1);
    }, 450);

    return () => clearTimeout(interval);
  }, [autoplayActive, currentAutoplayRemaining]);

  const handleStartAutoplay = () => {
    if (autoplayActive) {
      setAutoplayActive(false);
    } else {
      setTotalWagered(0);
      setTotalProfits(0);
      setCurrentAutoplayRemaining(autoplayBetsCount);
      setAutoplayActive(true);
    }
  };

  const multiplyBet = (multiplier) => {
    playClick();
    const currentVal = parseFloat(betAmount) || 0;
    const newVal = Math.max(0.1, currentVal * multiplier);
    setBetAmount(newVal.toFixed(2));
  };

  const currentMultipliers = MULTIPLIERS[rows][risk];
  const bottomPegCoords = getBottomPegCoordinates();

  return (
    <div className="plinko-main" style={{ padding: '24px 16px', maxWidth: '1080px', margin: '0 auto', fontFamily: '"Outfit", sans-serif', color: '#fff' }}>
      <style>{`
        .plinko-main input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: #0f121d;
          height: 6px;
          border-radius: 999px;
          outline: none;
        }
        .plinko-main input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #25f4b4;
          cursor: pointer;
          box-shadow: 0 0 10px #25f4b4;
          border: 3px solid #161825;
          transition: transform 0.1s ease;
        }
        .plinko-main input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes hitPulse {
          0% { transform: scale(1); filter: brightness(1.2); }
          50% { transform: scale(1.06); filter: brightness(1.6); box-shadow: 0 0 12px currentColor; }
          100% { transform: scale(1); filter: brightness(1.2); }
        }
      `}</style>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Left Control Panel */}
        <div style={{
          background: '#161825',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            {/* Tabs switcher */}
            <div style={{
              display: 'flex',
              background: '#0f121d',
              borderRadius: '999px',
              padding: '4px',
              marginBottom: '24px'
            }}>
              {['manual', 'autoplay'].map(tab => (
                <button
                  key={tab}
                  onClick={() => { playClick(); setActiveTab(tab); }}
                  disabled={autoplayActive}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: 'none',
                    background: activeTab === tab ? '#161825' : 'transparent',
                    color: activeTab === tab ? '#25f4b4' : '#626e82',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: autoplayActive ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Bet Amount selector */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: '#626e82' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>BET AMOUNT <Info size={11} /></span>
                <span>{(playableBalance || 0).toFixed(2)} USDT</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#0f121d',
                borderRadius: '12px',
                padding: '10px 14px',
                border: '1px solid rgba(255, 255, 255, 0.03)'
              }}>
                <span style={{ color: '#25f4b4', fontWeight: 800, fontSize: '14px', marginRight: '6px' }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={autoplayActive}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '14px',
                    flex: 1
                  }}
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => multiplyBet(0.5)}
                    disabled={autoplayActive}
                    style={{
                      background: '#161825',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#a0aebf',
                      fontWeight: 800,
                      fontSize: '10px',
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    1/2
                  </button>
                  <button
                    onClick={() => multiplyBet(2)}
                    disabled={autoplayActive}
                    style={{
                      background: '#161825',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#a0aebf',
                      fontWeight: 800,
                      fontSize: '10px',
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    2x
                  </button>
                </div>
              </div>
            </div>

            {/* Slider Configs */}
            {activeTab === 'manual' ? (
              <>
                {/* Rows slider */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: '#626e82' }}>
                    <span>ROWS</span>
                    <span style={{ color: '#fff', fontWeight: 800 }}>{rows}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#0f121d',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#25f4b4' }}>{rows}</span>
                    <input
                      type="range"
                      min="8"
                      max="16"
                      value={rows}
                      onChange={(e) => { playClick(); setRows(parseInt(e.target.value)); }}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                {/* Risk configurations */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#626e82', marginBottom: '8px' }}>RISK LEVEL</div>
                  <div style={{ display: 'flex', background: '#0f121d', borderRadius: '12px', padding: '4px' }}>
                    {['low', 'mid', 'high'].map(r => (
                      <button
                        key={r}
                        onClick={() => { playClick(); setRisk(r); }}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          borderRadius: '8px',
                          border: 'none',
                          background: risk === r ? '#161825' : 'transparent',
                          color: risk === r 
                            ? (r === 'low' ? '#30d158' : r === 'mid' ? '#ff9f43' : '#ff5252') 
                            : '#626e82',
                          fontWeight: 800,
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bias configurations */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: '#626e82' }}>
                    <span>SIDE BIAS</span>
                    <span style={{ fontSize: '10px', color: '#626e82', textDecoration: 'underline', cursor: 'pointer' }}>Learn More</span>
                  </div>
                  <div style={{ display: 'flex', background: '#0f121d', borderRadius: '12px', padding: '4px' }}>
                    {['classic', 'left', 'right'].map(b => (
                      <button
                        key={b}
                        onClick={() => { playClick(); setBias(b); }}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          borderRadius: '8px',
                          border: 'none',
                          background: bias === b ? '#161825' : 'transparent',
                          color: bias === b ? '#25f4b4' : '#626e82',
                          fontWeight: 800,
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // Autoplay panel
              <>
                {autoplayActive ? (
                  <div style={{
                    background: '#0f121d',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.02)'
                  }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#626e82', fontWeight: 700, marginBottom: '2px' }}>Total Wagered</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>${totalWagered.toFixed(2)} <span style={{ fontSize: '11px', color: '#626e82' }}>USDT</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#626e82', fontWeight: 700, marginBottom: '2px' }}>Total Profits</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: totalProfits >= 0 ? '#25f4b4' : '#ff5252' }}>
                        {totalProfits >= 0 ? '+' : ''}${totalProfits.toFixed(2)} <span style={{ fontSize: '11px', color: '#626e82' }}>USDT</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: '#626e82' }}>
                      <span>NUMBER OF BETS</span>
                      <span style={{ color: '#fff', fontWeight: 800 }}>{autoplayBetsCount}</span>
                    </div>
                    <div style={{ display: 'flex', background: '#0f121d', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                      {[10, 20, 50, 100].map(count => (
                        <button
                          key={count}
                          onClick={() => { playClick(); setAutoplayBetsCount(count); }}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: '8px',
                            border: 'none',
                            background: autoplayBetsCount === count ? '#161825' : 'transparent',
                            color: autoplayBetsCount === count ? '#25f4b4' : '#626e82',
                            fontWeight: 800,
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* CTA triggers */}
          {activeTab === 'manual' ? (
            <button
              onClick={() => dropBall()}
              style={{
                width: '100%',
                background: '#25f4b4',
                color: '#0c0e14',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 0',
                fontSize: '14px',
                fontWeight: 900,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(37, 244, 180, 0.25)',
                transition: 'transform 0.1s ease'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              PLAY
            </button>
          ) : (
            <button
              onClick={handleStartAutoplay}
              style={{
                width: '100%',
                background: autoplayActive ? '#ff5252' : '#25f4b4',
                color: autoplayActive ? '#fff' : '#0c0e14',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 0',
                fontSize: '13px',
                fontWeight: 900,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'transform 0.1s ease'
              }}
            >
              {autoplayActive ? `STOP AUTOPLAY (${currentAutoplayRemaining})` : 'START AUTOPLAY'}
            </button>
          )}
        </div>

        {/* Right Board Panel */}
        <div style={{
          background: '#0f121d',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.02)',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          
          {/* Multiplier Queue */}
          <div style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 10
          }}>
            {recentMultipliers.map((m, idx) => {
              const capsuleBg = m >= 4.0 
                ? 'linear-gradient(90deg, #ff5e62, #ff9966)' 
                : m >= 1.5 
                ? 'linear-gradient(90deg, #ff9966, #ff5e62)' 
                : m >= 1.0 
                ? 'linear-gradient(90deg, #f093fb, #f5576c)' 
                : 'linear-gradient(90deg, #48c6ef, #6f86d6)';
              return (
                <div
                  key={idx}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: capsuleBg,
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '11px',
                    minWidth: '50px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    opacity: 1 - idx * 0.12,
                    animation: idx === 0 ? 'scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'none'
                  }}
                >
                  {m.toFixed(2)}
                </div>
              );
            })}
          </div>

          {/* Full Board Wrapper */}
          <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{
                display: 'block',
                width: '100%',
                background: 'radial-gradient(circle, #1a1e2f 0%, #0f121d 100%)',
                borderRadius: '16px 16px 0 0'
              }}
            />

            {/* Seamless Bottom Multipliers Strip aligned to bottom pegs mathematically */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '56px',
              background: '#0f121d',
              borderRadius: '0 0 16px 16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.03)'
            }}>
              {currentMultipliers.map((m, idx) => {
                const totalBins = currentMultipliers.length;
                const distanceCenter = Math.abs(idx - (totalBins - 1) / 2);
                const normalized = distanceCenter / ((totalBins - 1) / 2);

                let boxBg = 'rgba(255, 82, 82, 0.06)';
                let borderColor = '#ff5252';
                let textColor = '#ff5252';
                if (normalized < 0.25) {
                  boxBg = 'rgba(37, 244, 180, 0.06)';
                  borderColor = '#25f4b4';
                  textColor = '#25f4b4';
                } else if (normalized < 0.6) {
                  boxBg = 'rgba(255, 159, 67, 0.06)';
                  borderColor = '#ff9f43';
                  textColor = '#ff9f43';
                }

                // Math-driven percentages to align exactly with peg lanes
                const leftCoord = bottomPegCoords[idx] || 0;
                const rightCoord = bottomPegCoords[idx + 1] || 640;
                
                const leftPct = (leftCoord / 640) * 100;
                const widthPct = ((rightCoord - leftCoord) / 640) * 100;

                const isPulse = hitBinPulse === idx;
                const isCenter = idx === Math.floor(totalBins / 2);

                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `calc(${leftPct}% + 3px)`,
                      width: `calc(${widthPct}% - 6px)`,
                      top: '8px',
                      textAlign: 'center',
                      padding: '12px 0',
                      borderRadius: '8px',
                      background: isCenter 
                        ? 'rgba(255, 159, 67, 0.2)' 
                        : (isPulse ? `${borderColor}26` : boxBg),
                      border: `1.5px solid ${borderColor}`,
                      fontSize: totalBins > 12 ? '8.5px' : '11px',
                      fontWeight: 900,
                      color: textColor,
                      transition: 'all 0.15s ease',
                      boxShadow: isPulse ? `0 0 14px ${borderColor}` : `0 0 4px ${borderColor}1a`,
                      minWidth: 0,
                      wordBreak: 'keep-all',
                      whiteSpace: 'nowrap',
                      animation: isPulse ? 'hitPulse 0.3s ease-in-out' : 'none',
                      overflow: 'hidden'
                    }}
                  >
                    {isCenter && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ff9f43',
                        fontSize: '9px',
                        lineHeight: '1',
                        opacity: 0.22,
                        fontWeight: 900
                      }}>
                        <div>▼</div>
                        <div>▼</div>
                      </div>
                    )}
                    {m}x
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
