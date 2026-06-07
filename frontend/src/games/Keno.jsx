import React, { useState } from 'react';
import { Shield, Sparkles, HelpCircle, Coins, Award, RefreshCw } from 'lucide-react';

const MULTIPLIERS = {
  0: [0, 0], // selected count -> payouts based on hits
  1: [0, 1.8],
  2: [0, 1.2, 2.5],
  3: [0, 1.0, 2.0, 5.0],
  4: [0, 0.5, 1.8, 4.0, 10.0],
  5: [0, 0, 1.5, 3.5, 8.0, 20.0],
  6: [0, 0, 1.2, 3.0, 6.0, 15.0, 45.0],
  7: [0, 0, 1.0, 2.0, 5.0, 12.0, 30.0, 75.0],
  8: [0, 0, 0.8, 1.8, 4.0, 10.0, 25.0, 60.0, 100.0],
  9: [0, 0, 0.5, 1.5, 3.0, 8.0, 20.0, 45.0, 85.0, 150.0],
  10: [0, 0, 0, 1.2, 2.5, 6.0, 15.0, 35.0, 75.0, 120.0, 200.0]
};

export default function Keno({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('50');
  const [selectedNums, setSelectedNums] = useState([]);
  const [drawnNums, setDrawnNums] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winPayout, setWinPayout] = useState(null);
  const [hitCount, setHitCount] = useState(0);

  const toggleNum = (num) => {
    if (isDrawing) return;
    if (selectedNums.includes(num)) {
      setSelectedNums(selectedNums.filter(n => n !== num));
    } else {
      if (selectedNums.length >= 10) {
        alert('You can select a maximum of 10 numbers.');
        return;
      }
      setSelectedNums([...selectedNums, num]);
    }
  };

  const autoPick = () => {
    if (isDrawing) return;
    const nums = [];
    while (nums.length < 10) {
      const rand = Math.floor(Math.random() * 40) + 1;
      if (!nums.includes(rand)) nums.push(rand);
    }
    setSelectedNums(nums);
  };

  const clearSelection = () => {
    if (isDrawing) return;
    setSelectedNums([]);
    setDrawnNums([]);
    setWinPayout(null);
  };

  const startDraw = async () => {
    const amt = parseFloat(betAmount);
    if (selectedNums.length === 0) return alert('Select at least 1 number');
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    setPlayableBalance(playableBalance - amt);
    setIsDrawing(true);
    setDrawnNums([]);
    setWinPayout(null);

    // Pick 10 random winning numbers
    const targetDraw = [];
    while (targetDraw.length < 10) {
      const rand = Math.floor(Math.random() * 40) + 1;
      if (!targetDraw.includes(rand)) targetDraw.push(rand);
    }

    // Draw numbers one by one with speed animation
    let count = 0;
    const interval = setInterval(async () => {
      setDrawnNums(prev => [...prev, targetDraw[count]]);
      count++;

      if (count === 10) {
        clearInterval(interval);
        
        // Calculate hits
        const hits = selectedNums.filter(n => targetDraw.includes(n)).length;
        setHitCount(hits);

        const table = MULTIPLIERS[selectedNums.length] || [];
        const mult = table[hits] || 0;
        const payout = parseFloat((amt * mult).toFixed(2));

        setWinPayout({ payout, mult });
        setIsDrawing(false);

        if (payout > 0) {
          if (isDemo) {
            setPlayableBalance(prev => prev + payout);
          } else {
            try {
              const res = await fetch('http://localhost:3001/api/games/record-bet', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  game: 'keno',
                  bet_amount: amt,
                  payout_multiplier: mult,
                  payout_amount: payout,
                  is_won: true,
                  raw_selection: { selected: selectedNums, hits }
                })
              });
              const data = await res.json();
              if (data.success) {
                setPlayableBalance(data.balance);
              }
            } catch (e) {
              console.error(e);
            }
          }
          alert(`Congratulations! You got ${hits} hits and won ₹${payout.toFixed(2)} (${mult}x)!`);
        } else {
          if (!isDemo) {
            await fetch('http://localhost:3001/api/games/record-bet', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                game: 'keno',
                bet_amount: amt,
                payout_multiplier: 0.00,
                payout_amount: 0.00,
                is_won: false,
                raw_selection: { selected: selectedNums, hits }
              })
            });
          }
          alert(`No luck this time! Matches: ${hits}.`);
        }
      }
    }, 250);
  };

  const currentMultiplierTable = MULTIPLIERS[selectedNums.length] || [];

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--action-highlight)" />
          <span style={{ fontWeight: 900, color: '#fff', fontSize: '18px' }}>SPRIBE KENO</span>
          <span style={{ fontSize: '9px', background: 'rgba(0,122,255,0.1)', color: '#007aff', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>LOTTERY</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        
        {/* Left Control Column */}
        <div className="frosted-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>STAKE (₹)</span>
            <input
              type="number"
              className="form-input mt-8"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={isDrawing}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button className="cyan-btn" onClick={autoPick} disabled={isDrawing}>
              Auto Pick
            </button>
            <button className="cyan-btn" style={{ borderColor: 'rgba(255,59,48,0.2)' }} onClick={clearSelection} disabled={isDrawing}>
              Clear All
            </button>
          </div>

          <button 
            className="action-btn" 
            style={{ background: '#007aff', color: '#fff' }} 
            onClick={startDraw}
            disabled={isDrawing || selectedNums.length === 0}
          >
            {isDrawing ? 'Drawing balls...' : `Play (₹${betAmount})`}
          </button>

          {/* Multiplier list matching selected hit list */}
          {selectedNums.length > 0 && (
            <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 800 }}>PAYOUT STRUCTURE ({selectedNums.length} Selected)</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                {currentMultiplierTable.map((m, hits) => {
                  if (hits === 0) return null;
                  const isCurrentHit = winPayout && hitCount === hits;
                  return (
                    <div 
                      key={hits} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '12px',
                        background: isCurrentHit ? 'rgba(0,229,255,0.1)' : 'transparent',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: isCurrentHit ? '1px solid var(--action-highlight)' : 'none'
                      }}
                    >
                      <span style={{ color: '#8a9ca8' }}>{hits} Hits</span>
                      <span style={{ color: m > 0 ? 'var(--success-layer)' : '#8a8a93', fontWeight: 800 }}>{m}x</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Playing Grid */}
        <div className="frosted-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px' }}>
            {Array(40).fill(null).map((_, i) => {
              const num = i + 1;
              const isSelected = selectedNums.includes(num);
              const isHit = isSelected && drawnNums.includes(num);
              const isDrawn = drawnNums.includes(num);

              let bg = 'rgba(255, 255, 255, 0.02)';
              let border = '1px solid rgba(255, 255, 255, 0.05)';
              let color = '#fff';

              if (isSelected) {
                bg = 'rgba(0, 122, 255, 0.15)';
                border = '1px solid #007aff';
              }
              if (isDrawn) {
                bg = 'rgba(255, 59, 48, 0.15)';
                border = '1px solid #ff3b30';
              }
              if (isHit) {
                bg = 'rgba(48, 209, 88, 0.2)';
                border = '1px solid #30d158';
                color = '#30d158';
              }

              return (
                <div
                  key={num}
                  onClick={() => toggleNum(num)}
                  style={{
                    aspectRatio: '1',
                    background: bg,
                    border,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isDrawing ? 'default' : 'pointer',
                    fontWeight: 900,
                    fontSize: '14px',
                    color,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {num}
                </div>
              );
            })}
          </div>

          {/* Draw Board Tracker */}
          {drawnNums.length > 0 && (
            <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              <span style={{ fontSize: '11px', color: '#8a9ca8', display: 'block', marginBottom: '8px' }}>DRAWN BALLS</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {drawnNums.map((n, idx) => {
                  const wasHit = selectedNums.includes(n);
                  return (
                    <div
                      key={idx}
                      className="float-anim"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: wasHit ? '#30d158' : '#ff3b30',
                        color: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '13px',
                        boxShadow: wasHit ? '0 0 10px rgba(48,209,88,0.4)' : 'none'
                      }}
                    >
                      {n}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
