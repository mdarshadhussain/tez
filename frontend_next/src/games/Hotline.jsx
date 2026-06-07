'use client';
import React, { useState, useRef } from 'react';
import { Shield, Sparkles, HelpCircle, Shuffle } from 'lucide-react';

const COLORS = ['red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'orange'];

export default function Hotline({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('50');
  const [selection, setSelection] = useState('red'); // red, black, orange
  const [isSpinning, setIsSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1.00);
  const [history, setHistory] = useState(['red', 'black', 'red', 'orange', 'black']);
  const [offset, setOffset] = useState(0);

  const sliderRef = useRef(null);

  const startSpin = async () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    setPlayableBalance(playableBalance - amt);
    setIsSpinning(true);

    // Pick winning index
    const winIndex = Math.floor(Math.random() * COLORS.length);
    const winColor = COLORS[winIndex];

    // Slide animation. We can generate a random large offset
    const itemWidth = 80;
    const initialOffset = 1000 + winIndex * itemWidth;
    setOffset(initialOffset);

    setTimeout(async () => {
      setIsSpinning(false);
      
      const won = selection === winColor;
      const rate = winColor === 'orange' ? 14.0 : 2.0;
      const payout = won ? parseFloat((amt * rate).toFixed(2)) : 0.00;

      setHistory(prev => [winColor, ...prev.slice(0, 7)]);

      if (won) {
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
                game: 'hotline',
                bet_amount: amt,
                payout_multiplier: rate,
                payout_amount: payout,
                is_won: true,
                raw_selection: { selection }
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
        alert(`You Won! Slider stopped on ${winColor.toUpperCase()}. Payout ₹${payout.toFixed(2)} (${rate}x)!`);
      } else {
        if (!isDemo) {
          await fetch('http://localhost:3001/api/games/record-bet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              game: 'hotline',
              bet_amount: amt,
              payout_multiplier: 0.00,
              payout_amount: 0.00,
              is_won: false,
              raw_selection: { selection }
            })
          });
        }
        alert(`Lost! Slider stopped on ${winColor.toUpperCase()}.`);
      }
    }, 2000);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--action-highlight)" />
          <span style={{ fontWeight: 900, color: '#fff', fontSize: '18px' }}>SPRIBE HOTLINE</span>
          <span style={{ fontSize: '9px', background: 'rgba(255,94,58,0.1)', color: '#ff5e3a', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>HOT WHEEL</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        
        {/* Controls */}
        <div className="frosted-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>STAKE (₹)</span>
            <input
              type="number"
              className="form-input mt-8"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={isSpinning}
            />
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>BET COLOR</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setSelection('red')}
                disabled={isSpinning}
                style={{
                  background: selection === 'red' ? 'rgba(255,59,48,0.1)' : 'transparent',
                  border: selection === 'red' ? '2px solid #ff3b30' : '1px solid rgba(255,255,255,0.05)',
                  color: '#ff3b30',
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 950,
                  fontSize: '13px'
                }}
              >
                RED (x2.0)
              </button>
              <button
                onClick={() => setSelection('black')}
                disabled={isSpinning}
                style={{
                  background: selection === 'black' ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: selection === 'black' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 950,
                  fontSize: '13px'
                }}
              >
                BLACK (x2.0)
              </button>
              <button
                onClick={() => setSelection('orange')}
                disabled={isSpinning}
                style={{
                  background: selection === 'orange' ? 'rgba(255,149,0,0.1)' : 'transparent',
                  border: selection === 'orange' ? '2px solid #ff9500' : '1px solid rgba(255,255,255,0.05)',
                  color: '#ff9500',
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 950,
                  fontSize: '13px'
                }}
              >
                HOTLINE ORANGE (x14.0)
              </button>
            </div>
          </div>

          <button
            className="action-btn"
            style={{ background: 'var(--action-highlight)', color: '#fff' }}
            onClick={startSpin}
            disabled={isSpinning}
          >
            {isSpinning ? 'Rolling...' : `Spin (₹${betAmount})`}
          </button>
        </div>

        {/* Sliding Wheel display */}
        <div className="frosted-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
          
          {/* Main wheel track container */}
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: '100px', 
              background: '#090514', 
              border: '2px solid var(--purple-accent)',
              boxShadow: '0 0 20px rgba(168,38,255,0.1)',
              borderRadius: '16px', 
              overflow: 'hidden' 
            }}
          >
            {/* Center target indicator pin line */}
            <div 
              style={{ 
                position: 'absolute', 
                top: 0, 
                bottom: 0, 
                left: '50%', 
                width: '4px', 
                background: '#ff5e3a', 
                boxShadow: '0 0 10px #ff5e3a',
                zIndex: 10,
                transform: 'translateX(-50%)'
              }}
            />

            {/* Sliding Track blocks list */}
            <div 
              ref={sliderRef}
              style={{
                display: 'flex',
                gap: '4px',
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: `translateX(calc(-${offset}px - 40px))`,
                transition: isSpinning ? 'transform 2s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
              }}
            >
              {Array(30).fill(null).map((_, groupIdx) => (
                <React.Fragment key={groupIdx}>
                  {COLORS.map((c, idx) => {
                    let bg = '#111';
                    if (c === 'red') bg = '#ff3b30';
                    if (c === 'orange') bg = '#ff9500';
                    if (c === 'black') bg = '#1c1c1e';

                    return (
                      <div 
                        key={idx}
                        style={{
                          width: '76px',
                          height: '76px',
                          background: bg,
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          flexShrink: 0
                        }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

          </div>

          {/* History bar */}
          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', display: 'block', marginBottom: '8px' }}>PAST SPINS</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {history.map((h, i) => {
                let bg = '#111';
                if (h === 'red') bg = '#ff3b30';
                if (h === 'orange') bg = '#ff9500';
                if (h === 'black') bg = '#1c1c1e';

                return (
                  <div
                    key={i}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: bg,
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  />
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
