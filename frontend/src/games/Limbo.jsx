import React, { useState } from 'react';
import { Sparkles, XCircle } from 'lucide-react';

export default function Limbo({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('20');
  const [targetMultiplier, setTargetMultiplier] = useState('2.00');
  const [resultMultiplier, setResultMultiplier] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [won, setWon] = useState(null);

  const rollLimbo = async () => {
    const amt = parseFloat(betAmount);
    const target = parseFloat(targetMultiplier);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (isNaN(target) || target < 1.01) return alert('Minimum target multiplier is 1.01x');
    if (amt > playableBalance) return alert('Insufficient balance');

    setRolling(true);
    setResultMultiplier(null);
    setWon(null);

    // Simulated odds
    setTimeout(async () => {
      // 10% hard crash override
      const isHardCrash = Math.random() < 0.10;
      let rolled = 1.00;

      if (!isHardCrash) {
        // Standard formula to generate crash/win number
        const rand = Math.random();
        rolled = parseFloat((0.98 / (1.00 - rand)).toFixed(2));
        if (rolled < 1.00) rolled = 1.00;
      }

      const isWon = rolled >= target;
      const payout = isWon ? parseFloat((amt * target).toFixed(2)) : 0.00;

      if (isDemo) {
        setPlayableBalance(playableBalance - amt + payout);
        setResultMultiplier(rolled);
        setWon(isWon);
        setRolling(false);
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
            game: 'limbo',
            bet_amount: amt,
            payout_multiplier: isWon ? target : 0.00,
            payout_amount: payout,
            is_won: isWon,
            raw_selection: { target, rolled }
          })
        });
        const data = await res.json();
        if (data.success) {
          setPlayableBalance(data.balance);
          setResultMultiplier(rolled);
          setWon(isWon);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setRolling(false);
      }
    }, 600);
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Visual board */}
      <div
        className="frosted-card"
        style={{
          height: '180px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e0e11',
          position: 'relative'
        }}
      >
        {resultMultiplier !== null ? (
          <div style={{ textAlign: 'center' }}>
            <div
              className="monospace-ledger"
              style={{
                fontSize: '48px',
                fontWeight: 900,
                color: won ? 'var(--success-layer)' : '#FF3B30',
                textShadow: won ? '0 0 20px rgba(0, 229, 255, 0.4)' : 'none'
              }}
            >
              {resultMultiplier.toFixed(2)}x
            </div>
            <div style={{ fontSize: '12px', color: '#8a8a93', marginTop: '6px' }}>
              {won ? `WON ₹${(parseFloat(betAmount) * parseFloat(targetMultiplier)).toFixed(2)}` : 'CRASHED UNDER TARGET'}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '14px', color: '#8a8a93' }}>
            {rolling ? 'ROLLING TARGET...' : 'ENTER TARGET & ROLL'}
          </div>
        )}
      </div>

      {/* Input controls */}
      <div className="frosted-card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#8a8a93' }}>TARGET MULTIPLIER</span>
            <input
              type="number"
              className="form-input mt-12"
              placeholder="e.g. 2.00"
              value={targetMultiplier}
              onChange={(e) => setTargetMultiplier(e.target.value)}
              disabled={rolling}
            />
          </div>

          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#8a8a93' }}>STAKE (₹)</span>
            <input
              type="number"
              className="form-input mt-12"
              placeholder="10"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={rolling}
            />
          </div>
        </div>

        <button className="action-btn" onClick={rollLimbo} disabled={rolling}>
          {rolling ? 'Processing...' : 'Roll Limbo'}
        </button>
      </div>
    </div>
  );
}
