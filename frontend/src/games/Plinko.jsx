import React, { useState, useEffect, useRef } from 'react';
import { Target, HelpCircle } from 'lucide-react';

const bins = [10.00, 2.00, 0.50, 0.20, 0.20, 0.20, 0.50, 2.00, 10.00];

export default function Plinko({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('20');
  const [dropping, setDropping] = useState(false);
  const canvasRef = useRef(null);
  
  // Track multiple balls dropping concurrently
  const ballsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Define peg board settings (e.g. 8 rows)
    const rows = 8;
    const pegs = [];
    const startY = 40;
    const rowSpacing = 20;

    for (let r = 0; r < rows; r++) {
      const numPegs = r + 3;
      const rowY = startY + r * rowSpacing;
      const rowWidth = (numPegs - 1) * 20;
      const startX = (W - rowWidth) / 2;

      for (let p = 0; p < numPegs; p++) {
        pegs.push({ x: startX + p * 20, y: rowY });
      }
    }

    let animFrameId;

    const render = () => {
      ctx.clearRect(0, 0, W, H);

      // Render Pegs
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (const peg of pegs) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Render Bins
      const binWidth = W / bins.length;
      bins.forEach((b, idx) => {
        const x = idx * binWidth;
        ctx.fillStyle = b >= 2.00 ? 'rgba(255, 107, 0, 0.1)' : 'rgba(255,255,255,0.02)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x + 2, H - 30, binWidth - 4, 25);
        ctx.strokeRect(x + 2, H - 30, binWidth - 4, 25);

        ctx.fillStyle = b >= 2.00 ? 'var(--action-highlight)' : '#8a8a93';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(`${b}x`, x + binWidth / 2 - 8, H - 14);
      });

      // Update and Draw Balls
      const balls = ballsRef.current;
      for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.y += ball.vy;
        ball.x += ball.vx;
        
        // Sim physics bounce when passing row levels
        // For simplicity of local browser compatibility, calculate row levels
        const currentRow = Math.floor((ball.y - startY) / rowSpacing);
        if (currentRow >= 0 && currentRow < rows && !ball.rowsBounced.includes(currentRow)) {
          ball.rowsBounced.push(currentRow);
          // Bounce random left or right
          const direction = Math.random() < 0.5 ? -1 : 1;
          ball.vx = direction * 1.5;
        }

        // Apply visual limits
        if (ball.x < 10) ball.x = 10;
        if (ball.x > W - 10) ball.x = W - 10;

        // Check land in bins
        if (ball.y >= H - 30) {
          // Determine bin index
          const binIdx = Math.floor(ball.x / binWidth);
          const mult = bins[binIdx] || 0.20;
          const payout = parseFloat((ball.stake * mult).toFixed(2));
          
          settlePayout(ball.stake, mult, payout);
          
          balls.splice(i, 1);
          continue;
        }

        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'var(--success-layer)';
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'var(--success-layer)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      setDropping(ballsRef.current.length > 0);
      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  const settlePayout = async (stake, mult, payout) => {
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
          raw_selection: { mult }
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

  const dropBall = async () => {
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
        rowsBounced: []
      });
      return;
    }

    // Deduct entry stake upfront on client
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
          raw_selection: { drop: true }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);

        // Add ball
        ballsRef.current.push({
          x: 200,
          y: 20,
          vx: 0,
          vy: 2.2,
          stake: amt,
          rowsBounced: []
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <div className="frosted-card" style={{ padding: '8px', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={240}
          style={{ width: '100%', background: '#0e0e11', borderRadius: '12px' }}
        />
      </div>

      {/* Input panel */}
      <div className="frosted-card">
        <div className="row" style={{ gap: '10px' }}>
          <input
            type="number"
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Stake (₹)"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
          />
          <button className="action-btn" onClick={dropBall} style={{ flex: 1.5 }}>
            Drop Orb
          </button>
        </div>
      </div>
    </div>
  );
}
