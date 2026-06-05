import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { playCoinFlipSound, playWinChime } from '../utils/audio';

export default function CoinFlip({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('20');
  const [prediction, setPrediction] = useState('heads'); // heads or tails
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [won, setWon] = useState(null);

  const flipCoin = async () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    playCoinFlipSound();
    setSpinning(true);
    setResult(null);
    setWon(null);

    // Simulated flip
    setTimeout(async () => {
      const outcomes = ['heads', 'tails'];
      const flipped = outcomes[Math.floor(Math.random() * outcomes.length)];
      const isWon = flipped === prediction;
      const payout = isWon ? parseFloat((amt * 1.95).toFixed(2)) : 0.00;

      if (isDemo) {
        setPlayableBalance(playableBalance - amt + payout);
        setResult(flipped);
        setWon(isWon);
        if (isWon) playWinChime();
        setSpinning(false);
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
            game: 'coin_flip',
            bet_amount: amt,
            payout_multiplier: isWon ? 1.95 : 0.00,
            payout_amount: payout,
            is_won: isWon,
            raw_selection: { prediction, flipped }
          })
        });
        const data = await res.json();
        if (data.success) {
          setPlayableBalance(data.balance);
          setResult(flipped);
          setWon(isWon);
          if (isWon) playWinChime();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSpinning(false);
      }
    }, 1200); // 1.2s spinning visual animation
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Coin Box */}
      <div
        className="frosted-card"
        style={{
          height: '180px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e0e11',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, #ffd700 0%, #b8860b 100%)',
            border: '4px solid var(--vip-status)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 900,
            fontSize: '24px',
            transition: spinning ? 'transform 1.2s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
            transform: spinning ? 'rotateY(1440deg)' : 'none',
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
          }}
        >
          {result ? result.toUpperCase().charAt(0) : '?'}
        </div>

        {result && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: won ? 'var(--success-layer)' : '#FF3B30', fontWeight: 700 }}>
            {won ? `WON ₹${(parseFloat(betAmount) * 1.95).toFixed(2)} (1.95x)` : `LOST (Landed on ${result})`}
          </div>
        )}
      </div>

      {/* Action panel */}
      <div className="frosted-card">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={() => setPrediction('heads')}
            style={{
              flex: 1,
              background: prediction === 'heads' ? 'var(--action-highlight)' : 'rgba(255,255,255,0.02)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              padding: '10px 0',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            HEADS (1.95x)
          </button>
          <button
            onClick={() => setPrediction('tails')}
            style={{
              flex: 1,
              background: prediction === 'tails' ? 'var(--action-highlight)' : 'rgba(255,255,255,0.02)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              padding: '10px 0',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            TAILS (1.95x)
          </button>
        </div>

        <div className="row" style={{ gap: '10px' }}>
          <input
            type="number"
            className="form-input"
            style={{ flex: 1 }}
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={spinning}
          />
          <button className="action-btn" onClick={flipCoin} style={{ flex: 1.5 }} disabled={spinning}>
            {spinning ? 'Flipping...' : `Flip (₹${betAmount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
