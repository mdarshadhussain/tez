import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

export default function Dice({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('20');
  const [sliderValue, setSliderValue] = useState(50);
  const [direction, setDirection] = useState('over'); // over or under
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const [won, setWon] = useState(null);

  // Math calculation for custom odds
  const getWinChance = () => {
    if (direction === 'over') {
      return 100 - sliderValue;
    } else {
      return sliderValue;
    }
  };

  const getMultiplier = () => {
    const chance = getWinChance();
    if (chance <= 0) return 0;
    const raw = 98 / chance; // 2% house edge
    return parseFloat(raw.toFixed(2));
  };

  const rollDice = async () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    const winChance = getWinChance();
    if (winChance <= 0 || winChance >= 100) return alert('Invalid prediction target');

    setRolling(true);
    setRollResult(null);
    setWon(null);

    setTimeout(async () => {
      const rolled = parseFloat((Math.random() * 100).toFixed(2));
      const mult = getMultiplier();
      const isWon = direction === 'over' ? rolled > sliderValue : rolled < sliderValue;
      const payout = isWon ? parseFloat((amt * mult).toFixed(2)) : 0.00;

      if (isDemo) {
        setPlayableBalance(playableBalance - amt + payout);
        setRollResult(rolled);
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
            game: 'dice',
            bet_amount: amt,
            payout_multiplier: isWon ? mult : 0.00,
            payout_amount: payout,
            is_won: isWon,
            raw_selection: { sliderValue, direction, rolled }
          })
        });
        const data = await res.json();
        if (data.success) {
          setPlayableBalance(data.balance);
          setRollResult(rolled);
          setWon(isWon);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setRolling(false);
      }
    }, 500);
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Board */}
      <div
        className="frosted-card"
        style={{
          height: '140px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e0e11'
        }}
      >
        {rollResult !== null ? (
          <div style={{ textAlign: 'center' }}>
            <div
              className="monospace-ledger"
              style={{
                fontSize: '40px',
                fontWeight: 900,
                color: won ? 'var(--success-layer)' : '#FF3B30'
              }}
            >
              Rolled {rollResult}
            </div>
            <div style={{ fontSize: '12px', color: '#8a8a93', marginTop: '6px' }}>
              {won ? `Won +₹${(parseFloat(betAmount) * getMultiplier()).toFixed(2)}` : 'Prediction Failed'}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '14px', color: '#8a8a93' }}>
            {rolling ? 'ROLLING DICE...' : 'ADJUST SLIDER & ROLL'}
          </div>
        )}
      </div>

      {/* Slider Widget */}
      <div className="frosted-card">
        <span style={{ fontSize: '11px', color: '#8a8a93' }}>ROLL DIRECTION & THRESHOLD</span>
        
        <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
          <button
            onClick={() => setDirection('over')}
            style={{
              flex: 1,
              background: direction === 'over' ? 'var(--action-highlight)' : 'rgba(255,255,255,0.02)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              padding: '8px 0',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Roll Over
          </button>
          <button
            onClick={() => setDirection('under')}
            style={{
              flex: 1,
              background: direction === 'under' ? 'var(--action-highlight)' : 'rgba(255,255,255,0.02)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              padding: '8px 0',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Roll Under
          </button>
        </div>

        {/* Real Range input */}
        <input
          type="range"
          min="1"
          max="99"
          value={sliderValue}
          onChange={(e) => setSliderValue(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--action-highlight)', margin: '16px 0' }}
        />

        <div className="row" style={{ fontSize: '12px', color: '#8a8a93', marginBottom: '16px' }}>
          <span>Target: {direction === 'over' ? `> ${sliderValue}` : `< ${sliderValue}`}</span>
          <span>Win Chance: {getWinChance()}%</span>
          <span>Multiplier: {getMultiplier()}x</span>
        </div>

        {/* Inputs */}
        <div className="row" style={{ gap: '10px' }}>
          <input
            type="number"
            className="form-input"
            style={{ flex: 1 }}
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
          />
          <button className="action-btn" onClick={rollDice} style={{ flex: 1.5 }} disabled={rolling}>
            Roll (₹{betAmount})
          </button>
        </div>
      </div>
    </div>
  );
}
