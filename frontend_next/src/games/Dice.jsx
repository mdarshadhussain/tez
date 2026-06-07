'use client';
import React, { useState } from 'react';
import { Shield, HelpCircle, Dice5 } from 'lucide-react';

export default function Dice({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('50');
  const [sliderValue, setSliderValue] = useState(50);
  const [direction, setDirection] = useState('over'); // over or under
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const [won, setWon] = useState(null);

  const getWinChance = () => {
    return direction === 'over' ? 100 - sliderValue : sliderValue;
  };

  const getMultiplier = () => {
    const chance = getWinChance();
    if (chance <= 0) return 0;
    const raw = 98 / chance; 
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

  const mult = getMultiplier();
  const profit = (parseFloat(betAmount) * mult - parseFloat(betAmount)).toFixed(2);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--action-highlight)" />
          <span style={{ fontWeight: 900, color: '#fff', fontSize: '18px' }}>SPRIBE DICE</span>
          <span style={{ fontSize: '9px', background: 'rgba(52,199,89,0.1)', color: '#34c759', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>SLIDER ODDS</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        
        {/* Controls */}
        <div className="frosted-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>BET AMOUNT</span>
            <input
              type="number"
              className="form-input mt-8"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={rolling}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#8a9ca8', display: 'block' }}>MULTIPLIER</span>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px', marginTop: '6px', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 800, color: '#fff' }}>
                {mult}x
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#8a9ca8', display: 'block' }}>WIN CHANCE</span>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px', marginTop: '6px', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 800, color: '#fff' }}>
                {getWinChance()}%
              </div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', display: 'block' }}>PROFIT ON WIN</span>
            <div style={{ background: 'rgba(48,209,88,0.05)', padding: '10px', borderRadius: '10px', marginTop: '6px', border: '1px solid rgba(48,209,88,0.1)', fontWeight: 900, color: '#30d158' }}>
              ₹{profit}
            </div>
          </div>

          <button
            className="action-btn"
            style={{ background: '#34c759', color: '#000', fontWeight: 900 }}
            onClick={rollDice}
            disabled={rolling}
          >
            {rolling ? 'Rolling...' : 'Roll Dice'}
          </button>
        </div>

        {/* Display and Slider */}
        <div className="frosted-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
          
          {/* Roll outcome board */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {rollResult !== null ? (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#8a9ca8', display: 'block', marginBottom: '6px' }}>ROLL RESULT</span>
                <div style={{ fontSize: '56px', fontWeight: 900, color: won ? '#30d158' : '#ff3b30' }}>
                  {rollResult}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: won ? '#30d158' : '#ff3b30', marginTop: '4px' }}>
                  {won ? 'WIN!' : 'LOSE'}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#4d5c68' }}>
                <Dice5 size={48} style={{ opacity: 0.5, margin: '0 auto 10px' }} />
                <span>Adjust scale and click Roll to spin.</span>
              </div>
            )}
          </div>

          {/* Scale Slider Widget */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setDirection('over')}
                style={{
                  flex: 1,
                  background: direction === 'over' ? 'rgba(52,199,89,0.1)' : 'transparent',
                  border: direction === 'over' ? '1px solid #34c759' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  color: direction === 'over' ? '#34c759' : '#8a9ca8',
                  padding: '10px 0',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Roll Over
              </button>
              <button
                onClick={() => setDirection('under')}
                style={{
                  flex: 1,
                  background: direction === 'under' ? 'rgba(52,199,89,0.1)' : 'transparent',
                  border: direction === 'under' ? '1px solid #34c759' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  color: direction === 'under' ? '#34c759' : '#8a9ca8',
                  padding: '10px 0',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Roll Under
              </button>
            </div>

            {/* Slider Scale bar track */}
            <div style={{ position: 'relative', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', margin: '20px 0' }}>
              {/* Colored active win range */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: direction === 'over' ? `${sliderValue}%` : '0',
                  right: direction === 'over' ? '0' : `${100 - sliderValue}%`,
                  background: 'rgba(52, 199, 89, 0.4)',
                  borderRadius: '5px'
                }}
              />
              <input
                type="range"
                min="2"
                max="98"
                value={sliderValue}
                onChange={(e) => setSliderValue(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  position: 'absolute',
                  top: '-5px',
                  left: 0,
                  background: 'transparent',
                  accentColor: '#34c759',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8a9ca8', fontWeight: 800 }}>
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
