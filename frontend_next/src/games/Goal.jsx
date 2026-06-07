'use client';
import React, { useState } from 'react';
import { Shield, Target, Award, Play, HelpCircle, Trophy } from 'lucide-react';

const SIZES = {
  small: { cols: 4, rows: 3, name: 'Small (3x4)' },
  medium: { cols: 7, rows: 4, name: 'Medium (4x7)' },
  big: { cols: 10, rows: 5, name: 'Big (5x10)' }
};

// Multipliers per column for each board size
const MULTIPLIERS = {
  small: [1.45, 2.18, 3.27, 4.91],
  medium: [1.29, 1.72, 2.29, 3.06, 4.08, 5.45, 7.26],
  big: [1.21, 1.51, 1.89, 2.36, 2.96, 3.70, 4.62, 5.78, 7.22, 9.03]
};

export default function Goal({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [boardSize, setBoardSize] = useState('small'); // small, medium, big
  const [betAmount, setBetAmount] = useState('50');
  const [gameActive, setGameActive] = useState(false);
  const [currentCol, setCurrentCol] = useState(0);
  const [grid, setGrid] = useState([]); // columns array containing objects
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const config = SIZES[boardSize];

  const startGame = () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    setPlayableBalance(playableBalance - amt);
    
    // Create grid state.
    // For each column, generate a random mine index.
    const newGrid = [];
    for (let c = 0; c < config.cols; c++) {
      const bombRow = Math.floor(Math.random() * config.rows);
      newGrid.push({
        bombRow,
        selectedRow: null,
        revealed: false
      });
    }

    setGrid(newGrid);
    setCurrentCol(0);
    setGameActive(true);
  };

  const selectTile = async (colIndex, rowIndex) => {
    if (!gameActive || colIndex !== currentCol) return;

    const newGrid = [...grid];
    newGrid[colIndex].selectedRow = rowIndex;
    newGrid[colIndex].revealed = true;

    if (rowIndex === grid[colIndex].bombRow) {
      // Hit a mine!
      setGrid(newGrid);
      setGameActive(false);

      if (!isDemo) {
        await fetch('http://localhost:3001/api/games/record-bet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            game: 'goal',
            bet_amount: parseFloat(betAmount),
            payout_multiplier: 0.00,
            payout_amount: 0.00,
            is_won: false,
            raw_selection: { boardSize, currentCol }
          })
        });
      }

      alert('BOOM! Landmine hit. Match lost.');
    } else {
      // Soccer ball!
      setGrid(newGrid);
      if (currentCol === config.cols - 1) {
        // Reached the end! Auto cash out
        const mult = MULTIPLIERS[boardSize][currentCol];
        const payout = parseFloat((parseFloat(betAmount) * mult).toFixed(2));
        setGameActive(false);

        if (isDemo) {
          setPlayableBalance(playableBalance + payout);
        } else {
          try {
            const res = await fetch('http://localhost:3001/api/games/record-bet', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                game: 'goal',
                bet_amount: parseFloat(betAmount),
                payout_multiplier: mult,
                payout_amount: payout,
                is_won: true,
                raw_selection: { boardSize, colIndex }
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
        alert(`GOAL!!! You crossed the pitch and won ₹${payout.toFixed(2)} (${mult}x)!`);
      } else {
        // Advance
        setCurrentCol(currentCol + 1);
      }
    }
  };

  const cashOut = async () => {
    if (!gameActive || currentCol === 0) return;

    const mult = MULTIPLIERS[boardSize][currentCol - 1];
    const payout = parseFloat((parseFloat(betAmount) * mult).toFixed(2));
    setGameActive(false);

    if (isDemo) {
      setPlayableBalance(playableBalance + payout);
      alert(`Successfully Cashed Out! Won ₹${payout.toFixed(2)} (${mult}x)`);
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
          game: 'goal',
          bet_amount: parseFloat(betAmount),
          payout_multiplier: mult,
          payout_amount: payout,
          is_won: true,
          raw_selection: { boardSize, lastCol: currentCol - 1 }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
        alert(`Successfully Cashed Out! Won ₹${payout.toFixed(2)} (${mult}x)`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentMult = currentCol > 0 ? MULTIPLIERS[boardSize][currentCol - 1] : 1.00;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--action-highlight)" />
          <span style={{ fontWeight: 900, color: '#fff', fontSize: '18px' }}>SPRIBE GOAL</span>
          <span style={{ fontSize: '9px', background: 'rgba(48,209,88,0.1)', color: '#30d158', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>TURBO GAME</span>
        </div>
        <button 
          onClick={() => setShowHowToPlay(!showHowToPlay)}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#8a9ca8', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
        >
          <HelpCircle size={14} /> How to play
        </button>
      </div>

      {showHowToPlay && (
        <div className="frosted-card" style={{ marginBottom: '20px', padding: '16px', background: 'rgba(48,209,88,0.02)', borderColor: 'rgba(48,209,88,0.1)' }}>
          <p style={{ fontSize: '12px', color: '#8a9ca8', lineHeight: 1.5 }}>
            Advance column by column across the pitch. Each column has one hidden landmine. Click a tile in the active column: if you reveal a football, you advance and the cashout multiplier increases. Hit a mine, and your bet is lost. Cash out at any time!
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        
        {/* Settings and Stats panel */}
        <div className="frosted-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>FIELD SIZE</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {Object.keys(SIZES).map((size) => (
                <button
                  key={size}
                  onClick={() => setBoardSize(size)}
                  disabled={gameActive}
                  style={{
                    background: boardSize === size ? 'rgba(48,209,88,0.1)' : 'transparent',
                    border: boardSize === size ? '1px solid #30d158' : '1px solid rgba(255,255,255,0.05)',
                    color: boardSize === size ? '#30d158' : '#8a9ca8',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 800,
                    textAlign: 'left'
                  }}
                >
                  {SIZES[size].name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>STAKE (₹)</span>
            <input
              type="number"
              className="form-input mt-8"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={gameActive}
            />
          </div>

          {gameActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#8a9ca8' }}>CURRENT PAYOUT</span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--success-layer)', marginTop: '4px' }}>
                  ₹{(parseFloat(betAmount) * currentMult).toFixed(2)} ({currentMult}x)
                </div>
              </div>
              <button 
                onClick={cashOut}
                className="action-btn"
                style={{ background: 'var(--success-layer)', color: '#000', fontWeight: 900 }}
                disabled={currentCol === 0}
              >
                Cash Out
              </button>
            </div>
          ) : (
            <button className="action-btn" style={{ background: '#30d158', color: '#000', fontWeight: 900 }} onClick={startGame}>
              Start Pitch Match
            </button>
          )}
        </div>

        {/* Stadium Football Pitch Canvas */}
        <div 
          className="frosted-card" 
          style={{ 
            margin: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            background: 'linear-gradient(to bottom, #112918 0%, #08120a 100%)',
            borderColor: '#2e7d32',
            boxShadow: '0 0 20px rgba(46,125,50,0.15)',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Football Field Lines */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '120px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none' }} />

          {/* Pitches layout */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${config.cols}, 1fr)`, 
              gap: '12px',
              zIndex: 2
            }}
          >
            {Array(config.cols).fill(null).map((_, cIdx) => {
              const column = grid[cIdx];
              const isColActive = gameActive && cIdx === currentCol;
              const isColPassed = gameActive && cIdx < currentCol;

              return (
                <div 
                  key={cIdx} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    opacity: gameActive && cIdx > currentCol ? 0.3 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {/* Multiplier Tag */}
                  <div 
                    style={{ 
                      textAlign: 'center', 
                      fontSize: '10px', 
                      fontWeight: 800, 
                      color: isColActive ? 'var(--action-highlight)' : '#8a9ca8',
                      background: isColActive ? 'rgba(255,0,102,0.1)' : 'rgba(255,255,255,0.03)',
                      padding: '2px 0',
                      borderRadius: '6px',
                      border: isColActive ? '1px solid var(--action-highlight)' : '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {MULTIPLIERS[boardSize][cIdx]}x
                  </div>

                  {Array(config.rows).fill(null).map((_, rIdx) => {
                    const isSelected = column && column.selectedRow === rIdx;
                    const isBomb = column && column.bombRow === rIdx;
                    const isRevealed = column && column.revealed;

                    let bg = 'rgba(255, 255, 255, 0.02)';
                    let border = '1px solid rgba(255, 255, 255, 0.06)';
                    let cursor = 'default';

                    if (isColActive) {
                      bg = 'rgba(255, 255, 255, 0.05)';
                      border = '1px solid rgba(255,255,255,0.15)';
                      cursor = 'pointer';
                    }

                    if (isRevealed && isSelected) {
                      if (isBomb) {
                        bg = 'rgba(255, 59, 48, 0.2)';
                        border = '1px solid #ff3b30';
                      } else {
                        bg = 'rgba(48, 209, 88, 0.2)';
                        border = '1px solid #30d158';
                      }
                    }

                    return (
                      <div
                        key={rIdx}
                        onClick={() => selectTile(cIdx, rIdx)}
                        style={{
                          aspectRatio: '1',
                          background: bg,
                          border,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor,
                          fontSize: '18px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isRevealed && isSelected && (
                          isBomb ? '💥' : '⚽'
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
