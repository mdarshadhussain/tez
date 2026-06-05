import React, { useState, useEffect, useRef } from 'react';
import { Flame, Play, AlertCircle } from 'lucide-react';
import { startRocketHum, updateRocketHum, stopRocketHum, playExplosion, playWinChime } from '../utils/audio';

export default function Crash({ socket, user, playableBalance, setPlayableBalance, isDemo }) {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, crashed
  const [multiplier, setMultiplier] = useState(1.00);
  const [history, setHistory] = useState([1.12, 2.54, 1.05, 8.42, 1.88, 14.20, 2.10, 1.00, 3.45]);

  // Dual Betting Panels state
  const [betA, setBetA] = useState({ amount: '10', hasBet: false, cashedOut: false, wonAmount: 0 });
  const [betB, setBetB] = useState({ amount: '10', hasBet: false, cashedOut: false, wonAmount: 0 });

  // Auto Controls
  const [autoBetA, setAutoBetA] = useState(false);
  const [autoBetB, setAutoBetB] = useState(false);
  const [autoCashA, setAutoCashA] = useState(false);
  const [autoCashB, setAutoCashB] = useState(false);
  const [autoCashValueA, setAutoCashValueA] = useState('2.00');
  const [autoCashValueB, setAutoCashValueB] = useState('2.00');

  const canvasRef = useRef(null);
  
  // Image Sprite Loader
  const planeImgRef = useRef(null);
  
  // Parallax Clouds state array
  const cloudsRef = useRef([
    { x: 100, y: 40, scale: 0.8, speed: 0.4 },
    { x: 320, y: 110, scale: 1.1, speed: 0.7 },
    { x: 50, y: 190, scale: 0.5, speed: 0.3 },
    { x: 480, y: 70, scale: 1.2, speed: 0.9 },
    { x: 220, y: 220, scale: 0.7, speed: 0.5 },
  ]);

  useEffect(() => {
    const img = new Image();
    img.src = '/aviator_plane.png';
    img.onload = () => {
      planeImgRef.current = img;
    };
  }, []);

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
    playableBalance
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
      playableBalance
    };
  }, [gameState, multiplier, betA, betB, autoCashA, autoCashValueA, autoCashB, autoCashValueB, playableBalance]);

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
        if (curA.hasBet && !curA.cashedOut && acA) {
          const limit = parseFloat(acvA);
          if (data.multiplier >= limit) {
            triggerCashout('A', limit);
          }
        }
        if (curB.hasBet && !curB.cashedOut && acB) {
          const limit = parseFloat(acvB);
          if (data.multiplier >= limit) {
            triggerCashout('B', limit);
          }
        }

      } else if (data.state === 'crashed') {
        stopRocketHum();
        playExplosion();

        // Push new result to history
        setHistory(prev => [data.multiplier, ...prev.slice(0, 15)]);

        // Check if bets A or B crashed (lost)
        const { betA: curA, betB: curB } = stateRef.current;
        if (curA.hasBet && !curA.cashedOut) {
          setBetA(prev => ({ ...prev, hasBet: false }));
        }
        if (curB.hasBet && !curB.cashedOut) {
          setBetB(prev => ({ ...prev, hasBet: false }));
        }

      } else if (data.state === 'waiting') {
        stopRocketHum();
        
        // Reset panels
        setBetA(prev => ({ ...prev, hasBet: false, cashedOut: false, wonAmount: 0 }));
        setBetB(prev => ({ ...prev, hasBet: false, cashedOut: false, wonAmount: 0 }));

        // Handle Auto-Bet trigger
        setTimeout(() => {
          if (autoBetA) triggerPlaceBet('A');
          if (autoBetB) triggerPlaceBet('B');
        }, 500);
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

  // Place Bet trigger logic (Real / Demo mapped)
  const triggerPlaceBet = async (panel) => {
    const { gameState: curState, playableBalance: curBalance } = stateRef.current;
    if (curState !== 'waiting') return alert('Wait for next round to place bets');

    const curBet = panel === 'A' ? betA : betB;
    const amt = parseFloat(curBet.amount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > curBalance) return alert('Insufficient balance');

    if (panel === 'A') {
      setBetA(prev => ({ ...prev, hasBet: true, cashedOut: false, wonAmount: 0 }));
    } else {
      setBetB(prev => ({ ...prev, hasBet: true, cashedOut: false, wonAmount: 0 }));
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

  // Cashout trigger logic (Real / Demo mapped)
  const triggerCashout = async (panel, targetMult = null) => {
    const { gameState: curState, multiplier: curMult } = stateRef.current;
    if (curState !== 'playing') return;

    const curBet = panel === 'A' ? betA : betB;
    if (!curBet.hasBet || curBet.cashedOut) return;

    const mult = targetMult || curMult;
    const payout = parseFloat((parseFloat(curBet.amount) * mult).toFixed(2));

    if (panel === 'A') {
      setBetA(prev => ({ ...prev, cashedOut: true, wonAmount: payout }));
    } else {
      setBetB(prev => ({ ...prev, cashedOut: true, wonAmount: payout }));
    }

    if (isDemo) {
      setPlayableBalance(prev => prev + payout);
      playWinChime();
    } else {
      socket.emit('crash_cashout', { userId: user.id });
    }
  };

  // Canvas parabolic rocket trajectory rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Style elements matching Spribe background
    ctx.fillStyle = '#101112';
    ctx.fillRect(0, 0, W, H);

    // Draw gridlines (moving background grid to simulate flight speed)
    const timeTick = Date.now() * 0.05;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;

    const gridOffset = gameState === 'playing' ? (timeTick % 40) : 0;

    for (let i = -gridOffset; i < W; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    }
    for (let i = 0; i < H; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
    }

    // Parallax scrolling clouds rendering
    const scrollSpeed = gameState === 'playing' ? (multiplier * 1.5) : 0.2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (const cloud of cloudsRef.current) {
      // Update coordinates
      cloud.x -= scrollSpeed * 0.7 * cloud.speed;
      cloud.y += scrollSpeed * 1.0 * cloud.speed;

      // Wrap around screen edge
      if (cloud.x < -60 * cloud.scale) cloud.x = W + 60 * cloud.scale;
      if (cloud.y > H + 60 * cloud.scale) {
        cloud.y = -60 * cloud.scale;
        cloud.x = Math.random() * W;
      }

      // Draw stylized cartoon cloud bubble clusters
      ctx.beginPath();
      const r = 16 * cloud.scale;
      ctx.arc(cloud.x, cloud.y, r, 0, Math.PI * 2);
      ctx.arc(cloud.x + r * 0.9, cloud.y - r * 0.3, r * 0.8, 0, Math.PI * 2);
      ctx.arc(cloud.x + r * 1.5, cloud.y + r * 0.1, r * 0.9, 0, Math.PI * 2);
      ctx.arc(cloud.x - r * 0.8, cloud.y + r * 0.2, r * 0.7, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    if (gameState === 'waiting') {
      ctx.fillStyle = '#fff';
      ctx.font = '800 16px Inter';
      ctx.fillText('WAITING FOR NEXT ROUND', W / 2 - 100, H / 2 - 10);
      
      // Loading spinner/bar
      ctx.fillStyle = '#e22139';
      const barWidth = ((Date.now() % 5000) / 5000) * 200;
      ctx.fillRect(W / 2 - 100, H / 2 + 10, barWidth, 4);
      return;
    }

    if (gameState === 'crashed') {
      ctx.fillStyle = '#e22139';
      ctx.font = '900 28px Inter';
      ctx.fillText('FLEW AWAY!', W / 2 - 80, H / 2 - 10);
      ctx.fillStyle = '#8a8a93';
      ctx.font = '600 14px Inter';
      ctx.fillText(`Multiplier: ${multiplier.toFixed(2)}x`, W / 2 - 50, H / 2 + 20);
      return;
    }

    // Parabolic path calculations
    const progress = Math.min((multiplier - 1) / 4, 1); // visually scale rocket climbing curve
    const startX = 40;
    const startY = H - 40;
    const endX = startX + (W - 100) * progress;
    const endY = startY - (H - 100) * Math.pow(progress, 1.8);

    // 1. Draw gradient shape under flight path curve
    const pathGrad = ctx.createLinearGradient(startX, startY, endX, endY);
    pathGrad.addColorStop(0, 'rgba(226, 33, 57, 0.02)');
    pathGrad.addColorStop(1, 'rgba(226, 33, 57, 0.22)');

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX + (endX - startX) * 0.45, startY, endX, endY);
    ctx.lineTo(endX, startY);
    ctx.closePath();
    ctx.fillStyle = pathGrad;
    ctx.fill();

    // 2. Draw thick red glowing line path
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX + (endX - startX) * 0.45, startY, endX, endY);
    ctx.strokeStyle = '#e22139';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#e22139';
    ctx.stroke();
    ctx.shadowBlur = 0; // reset glow

    // 3. Draw Red Airplane shape at the head of the curve path
    ctx.save();
    ctx.translate(endX, endY);
    // Calculate slope angle to tilt the plane in flight direction
    const dx = 1.0;
    const dy = -1.8 * Math.pow(progress, 0.8) * ((H - 100) / (W - 100));
    const angle = Math.atan2(dy, dx);
    ctx.rotate(angle);

    if (planeImgRef.current) {
      // Draw custom cartoon propeller plane sprite
      ctx.drawImage(planeImgRef.current, -26, -26, 52, 52);
    } else {
      // Fallback vector drawing
      ctx.fillStyle = '#e22139';
      ctx.beginPath();
      ctx.moveTo(15, 0);       // Nose
      ctx.lineTo(-8, -8);     // Right Wingtip
      ctx.lineTo(-5, -2);     // Core body join
      ctx.lineTo(-15, -6);    // Tail right
      ctx.lineTo(-12, 0);     // Rear center tail
      ctx.lineTo(-15, 6);     // Tail left
      ctx.lineTo(-5, 2);      // Core body join left
      ctx.lineTo(-8, 8);      // Left wingtip
      ctx.closePath();
      ctx.fill();
    }

    // Small animated thruster flame trail
    if (Math.random() < 0.7) {
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-26 - Math.random() * 8, -2);
      ctx.lineTo(-26 - Math.random() * 8, 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

  }, [gameState, multiplier]);

  // Color helper for history pills
  const getPillColor = (val) => {
    if (val >= 10.00) return '#c012e2'; // violet/pink high mults
    if (val >= 2.00) return '#9b51e0';  // purple mid mults
    return '#3498db';                   // blue low mults
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '80px', maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Cartoon Sky Cockpit Header Banner */}
      <div 
        className="frosted-card glowing-border-pink shimmer-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(226,33,57,0.1) 0%, rgba(23,15,43,0.95) 100%)',
          padding: '16px 24px',
          borderRadius: '24px',
          marginBottom: '16px',
          overflow: 'hidden',
          borderColor: 'rgba(226,33,57,0.15)'
        }}
      >
        <div style={{ zIndex: 2 }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#e22139', background: 'rgba(226,33,57,0.1)', padding: '2px 8px', borderRadius: '8px', letterSpacing: '0.5px' }}>HOT MULTIPLAYER</span>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Aviator Sky <Flame size={24} color="#e22139" className="float-fast-anim" />
          </h1>
          <p style={{ fontSize: '12px', color: '#8a8a93', marginTop: '4px' }}>Watch the lucky plane take off and cashout before it flies away!</p>
        </div>

        <img
          src="/aviator_plane.png"
          alt="Aviator Prop Plane"
          style={{ width: '100px', height: '100px', objectFit: 'contain', marginRight: '-10px', transform: 'rotate(-5deg)' }}
          className="float-anim"
        />
      </div>

      {/* 1. Top Multipliers History list */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '6px', 
          overflowX: 'auto', 
          padding: '8px 12px', 
          background: '#141516', 
          borderRadius: '12px', 
          marginBottom: '10px',
          border: '1px solid rgba(255,255,255,0.03)'
        }}
      >
        {history.map((h, i) => (
          <span
            key={i}
            className="monospace-ledger"
            style={{
              fontSize: '11px',
              fontWeight: 850,
              color: getPillColor(h),
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${getPillColor(h)}30`,
              padding: '3px 9px',
              borderRadius: '20px',
              flexShrink: 0
            }}
          >
            {h.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* 2. Main Flight Canvas Viewport */}
      <div className="frosted-card" style={{ padding: '8px', overflow: 'hidden', position: 'relative', background: '#101112', border: '1px solid rgba(255,255,255,0.03)' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={280}
          style={{ width: '100%', background: '#101112', borderRadius: '16px' }}
        />
        
        {/* Giant climbing multiplier */}
        {gameState === 'playing' && (
          <div
            className="monospace-ledger"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '52px',
              fontWeight: 950,
              color: '#e22139',
              textShadow: '0 4px 15px rgba(0,0,0,0.8)'
            }}
          >
            {multiplier.toFixed(2)}x
          </div>
        )}
      </div>

      {/* 3. Dual Control panels layout (Side by Side on desktop, stacked on mobile) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        
        {/* Panel A */}
        <div className="frosted-card" style={{ background: '#141516', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 800 }}>BET PANEL A</span>
            
            {/* Toggles */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8a8a93', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoBetA} onChange={(e) => setAutoBetA(e.target.checked)} style={{ accentColor: '#e22139' }} />
                Auto Bet
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8a8a93', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoCashA} onChange={(e) => setAutoCashA(e.target.checked)} style={{ accentColor: '#e22139' }} />
                Auto Cashout
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            {/* Stake Input */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input
                type="number"
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '15px', fontWeight: 800, textAlign: 'center', background: '#0e0f10', border: '1px solid rgba(255,255,255,0.05)' }}
                value={betA.amount}
                onChange={(e) => setBetA(prev => ({ ...prev, amount: e.target.value }))}
                disabled={betA.hasBet}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {['50', '100', '200', '500'].map(val => (
                  <button
                    key={val}
                    onClick={() => setBetA(prev => ({ ...prev, amount: val }))}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#fff', fontSize: '10px', padding: '4px 0', borderRadius: '6px', cursor: 'pointer' }}
                    disabled={betA.hasBet}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action Button */}
            <div style={{ flex: 1.2 }}>
              {betA.hasBet ? (
                betA.cashedOut ? (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', background: 'rgba(40,167,69,0.1)', border: '1px solid #28a745', borderRadius: '14px', color: '#28a745' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800 }}>WON</span>
                    <span style={{ fontSize: '14px', fontWeight: 900 }}>₹{betA.wonAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <button
                    className="action-btn"
                    style={{ height: '100%', width: '100%', background: '#ff9f0a', color: '#000', fontSize: '16px', fontWeight: 900, borderRadius: '14px', boxShadow: '0 4px 15px rgba(255,159,10,0.3)' }}
                    onClick={() => triggerCashout('A')}
                    disabled={gameState !== 'playing'}
                  >
                    {gameState === 'playing' ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>CASH OUT</span>
                        <span style={{ fontSize: '15px', fontWeight: 900 }}>₹{(parseFloat(betA.amount) * multiplier).toFixed(2)}</span>
                      </div>
                    ) : 'WAITING...'}
                  </button>
                )
              ) : (
                <button
                  className="action-btn"
                  style={{ height: '100%', width: '100%', background: '#2cba00', color: '#fff', fontSize: '16px', fontWeight: 900, borderRadius: '14px', boxShadow: '0 4px 15px rgba(44,186,0,0.3)' }}
                  onClick={() => triggerPlaceBet('A')}
                  disabled={gameState !== 'waiting'}
                >
                  {gameState === 'waiting' ? 'BET' : 'WAITING ROUND'}
                </button>
              )}
            </div>
          </div>

          {/* Auto Cashout multiplier input */}
          {autoCashA && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0e0f10', padding: '6px 12px', borderRadius: '10px' }}>
              <span style={{ fontSize: '10px', color: '#8a8a93' }}>AUTO CASHOUT AT</span>
              <input
                type="number"
                step="0.01"
                className="form-input"
                style={{ flex: 1, padding: '4px', fontSize: '12px', background: 'transparent', border: 'none', color: 'var(--success-layer)', fontWeight: 800 }}
                value={autoCashValueA}
                onChange={(e) => setAutoCashValueA(e.target.value)}
                disabled={betA.hasBet}
              />
            </div>
          )}
        </div>

        {/* Panel B */}
        <div className="frosted-card" style={{ background: '#141516', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 800 }}>BET PANEL B</span>
            
            {/* Toggles */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8a8a93', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoBetB} onChange={(e) => setAutoBetB(e.target.checked)} style={{ accentColor: '#e22139' }} />
                Auto Bet
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8a8a93', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoCashB} onChange={(e) => setAutoCashB(e.target.checked)} style={{ accentColor: '#e22139' }} />
                Auto Cashout
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            {/* Stake Input */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input
                type="number"
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '15px', fontWeight: 800, textAlign: 'center', background: '#0e0f10', border: '1px solid rgba(255,255,255,0.05)' }}
                value={betB.amount}
                onChange={(e) => setBetB(prev => ({ ...prev, amount: e.target.value }))}
                disabled={betB.hasBet}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {['50', '100', '200', '500'].map(val => (
                  <button
                    key={val}
                    onClick={() => setBetB(prev => ({ ...prev, amount: val }))}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#fff', fontSize: '10px', padding: '4px 0', borderRadius: '6px', cursor: 'pointer' }}
                    disabled={betB.hasBet}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action Button */}
            <div style={{ flex: 1.2 }}>
              {betB.hasBet ? (
                betB.cashedOut ? (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', background: 'rgba(40,167,69,0.1)', border: '1px solid #28a745', borderRadius: '14px', color: '#28a745' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800 }}>WON</span>
                    <span style={{ fontSize: '14px', fontWeight: 900 }}>₹{betB.wonAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <button
                    className="action-btn"
                    style={{ height: '100%', width: '100%', background: '#ff9f0a', color: '#000', fontSize: '16px', fontWeight: 900, borderRadius: '14px', boxShadow: '0 4px 15px rgba(255,159,10,0.3)' }}
                    onClick={() => triggerCashout('B')}
                    disabled={gameState !== 'playing'}
                  >
                    {gameState === 'playing' ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>CASH OUT</span>
                        <span style={{ fontSize: '15px', fontWeight: 900 }}>₹{(parseFloat(betB.amount) * multiplier).toFixed(2)}</span>
                      </div>
                    ) : 'WAITING...'}
                  </button>
                )
              ) : (
                <button
                  className="action-btn"
                  style={{ height: '100%', width: '100%', background: '#2cba00', color: '#fff', fontSize: '16px', fontWeight: 900, borderRadius: '14px', boxShadow: '0 4px 15px rgba(44,186,0,0.3)' }}
                  onClick={() => triggerPlaceBet('B')}
                  disabled={gameState !== 'waiting'}
                >
                  {gameState === 'waiting' ? 'BET' : 'WAITING ROUND'}
                </button>
              )}
            </div>
          </div>

          {/* Auto Cashout multiplier input */}
          {autoCashB && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0e0f10', padding: '6px 12px', borderRadius: '10px' }}>
              <span style={{ fontSize: '10px', color: '#8a8a93' }}>AUTO CASHOUT AT</span>
              <input
                type="number"
                step="0.01"
                className="form-input"
                style={{ flex: 1, padding: '4px', fontSize: '12px', background: 'transparent', border: 'none', color: 'var(--success-layer)', fontWeight: 800 }}
                value={autoCashValueB}
                onChange={(e) => setAutoCashValueB(e.target.value)}
                disabled={betB.hasBet}
              />
            </div>
          )}
        </div>

      </div>

      {/* Spribe Aviator warnings checklist details */}
      <div className="frosted-card" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '16px' }}>
        <AlertCircle size={20} color="#e22139" />
        <div style={{ fontSize: '11px', color: '#8a8a93' }}>
          This Aviator client supports dual concurrent betting streams, auto-wagers, and block-level multipliers matching regulatory standard specifications.
        </div>
      </div>
    </div>
  );
}
