'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Target, HelpCircle } from 'lucide-react';

const MULTIPLIERS = {
  green: [11.0, 0.6, 0.4, 0.2, 0.2, 0.2, 0.4, 0.6, 11.0],
  yellow: [25.0, 1.0, 0.5, 0.2, 0.2, 0.2, 0.5, 1.0, 25.0],
  red: [141.0, 2.0, 0.5, 0.0, 0.0, 0.0, 0.5, 2.0, 141.0]
};

export default function Plinko({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('50');
  const [dropping, setDropping] = useState(false);
  const canvasRef = useRef(null);
  const ballsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const rows = 8;
    const pegs = [];
    const startY = 40;
    const rowSpacing = 22;

    for (let r = 0; r < rows; r++) {
      const numPegs = r + 3;
      const rowY = startY + r * rowSpacing;
      const rowWidth = (numPegs - 1) * 22;
      const startX = (W - rowWidth) / 2;

      for (let p = 0; p < numPegs; p++) {
        pegs.push({ x: startX + p * 22, y: rowY });
      }
    }

    let animFrameId;

    const render = () => {
      ctx.clearRect(0, 0, W, H);

      // Render pegs
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (const peg of pegs) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw bottom bins (3 rows stacked: Green, Yellow, Red matching Spribe layout)
      const binWidth = W / 9;
      
      // We will draw the currently selected/all color rows matching risk multiplier bins
      for (let idx = 0; idx < 9; idx++) {
        const x = idx * binWidth;
        
        // Green Bin
        ctx.fillStyle = 'rgba(48, 209, 88, 0.1)';
        ctx.strokeStyle = 'rgba(48, 209, 88, 0.2)';
        ctx.fillRect(x + 2, H - 75, binWidth - 4, 18);
        ctx.strokeRect(x + 2, H - 75, binWidth - 4, 18);
        ctx.fillStyle = '#30d158';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`${MULTIPLIERS.green[idx]}x`, x + binWidth / 2 - 10, H - 63);

        // Yellow Bin
        ctx.fillStyle = 'rgba(255, 149, 0, 0.1)';
        ctx.strokeStyle = 'rgba(255, 149, 0, 0.2)';
        ctx.fillRect(x + 2, H - 53, binWidth - 4, 18);
        ctx.strokeRect(x + 2, H - 53, binWidth - 4, 18);
        ctx.fillStyle = '#ff9500';
        ctx.fillText(`${MULTIPLIERS.yellow[idx]}x`, x + binWidth / 2 - 10, H - 41);

        // Red Bin
        ctx.fillStyle = 'rgba(255, 59, 48, 0.1)';
        ctx.strokeStyle = 'rgba(255, 59, 48, 0.2)';
        ctx.fillRect(x + 2, H - 31, binWidth - 4, 18);
        ctx.strokeRect(x + 2, H - 31, binWidth - 4, 18);
        ctx.fillStyle = '#ff3b30';
        ctx.fillText(`${MULTIPLIERS.red[idx]}x`, x + binWidth / 2 - 10, H - 19);
      }

      // Update balls
      const balls = ballsRef.current;
      for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.y += ball.vy;
        ball.x += ball.vx;

        const currentRow = Math.floor((ball.y - startY) / rowSpacing);
        if (currentRow >= 0 && currentRow < rows && !ball.rowsBounced.includes(currentRow)) {
          ball.rowsBounced.push(currentRow);
          const dir = Math.random() < 0.5 ? -1 : 1;
          ball.vx = dir * 1.6;
        }

        // Keep bounds
        if (ball.x < 15) ball.x = 15;
        if (ball.x > W - 15) ball.x = W - 15;

        // Check landing
        if (ball.y >= H - 85) {
          const binIdx = Math.floor(ball.x / binWidth);
          const mult = MULTIPLIERS[ball.color][binIdx] || 0.2;
          const payout = parseFloat((ball.stake * mult).toFixed(2));

          settlePayout(ball.stake, mult, payout, ball.color);
          balls.splice(i, 1);
          continue;
        }

        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = ball.color === 'green' ? '#30d158' : ball.color === 'yellow' ? '#ff9500' : '#ff3b30';
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      setDropping(ballsRef.current.length > 0);
      animFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  const settlePayout = async (stake, mult, payout, color) => {
    if (isDemo) {
      setPlayableBalance(prev => prev + payout);
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
          raw_selection: { color, mult }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const dropBall = async (color) => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    if (isDemo) {
      setPlayableBalance(playableBalance - amt);
      ballsRef.current.push({
        x: 200,
        y: 20,
        vx: 0,
        vy: 2.2,
        stake: amt,
        color,
        rowsBounced: []
      });
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
          bet_amount: amt,
          payout_multiplier: 0.00,
          payout_amount: 0.00,
          is_won: false,
          raw_selection: { color, drop: true }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
        ballsRef.current.push({
          x: 200,
          y: 20,
          vx: 0,
          vy: 2.2,
          stake: amt,
          color,
          rowsBounced: []
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--action-highlight)" />
          <span style={{ fontWeight: 900, color: '#fff', fontSize: '18px' }}>SPRIBE PLINKO</span>
          <span style={{ fontSize: '9px', background: 'rgba(212,175,55,0.1)', color: 'var(--vip-status)', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>BOARD PHYSICS</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>
        
        {/* Controls */}
        <div className="frosted-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>STAKE (₹)</span>
            <input
              type="number"
              className="form-input mt-8"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>DROP BALL RISK</span>
            <button
              onClick={() => dropBall('green')}
              style={{ background: '#30d158', color: '#000', fontWeight: 900, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
            >
              GREEN
            </button>
            <button
              onClick={() => dropBall('yellow')}
              style={{ background: '#ff9500', color: '#000', fontWeight: 900, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
            >
              YELLOW
            </button>
            <button
              onClick={() => dropBall('red')}
              style={{ background: '#ff3b30', color: '#fff', fontWeight: 900, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
            >
              RED
            </button>
          </div>
        </div>

        {/* Board Canvas */}
        <div className="frosted-card" style={{ margin: 0, padding: '12px', background: '#080512', borderColor: 'rgba(255,255,255,0.02)' }}>
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            style={{ width: '100%', background: 'radial-gradient(circle, #0e0a1f 0%, #05030b 100%)', borderRadius: '16px' }}
          />
        </div>

      </div>

    </div>
  );
}
