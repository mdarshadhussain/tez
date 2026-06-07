'use client';
import React, { useState } from 'react';
import { Shield, HelpCircle, Bomb, Sparkles, Trophy, Settings } from 'lucide-react';

export default function Mines({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [mineCount, setMineCount] = useState(3);
  const [betAmount, setBetAmount] = useState('50');
  const [gameActive, setGameActive] = useState(false);
  
  const [grid, setGrid] = useState(Array(25).fill({ revealed: false, isMine: false }));
  const [revealedCount, setRevealedCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [minesList, setMinesList] = useState([]); 

  const getMultiplier = (mines, revealed) => {
    let waysToWin = 1;
    let totalCombinations = 1;
    for (let i = 0; i < revealed; i++) {
      waysToWin *= (25 - mines - i);
      totalCombinations *= (25 - i);
    }
    const probability = waysToWin / totalCombinations;
    const rawMult = 0.98 / probability; 
    return parseFloat(rawMult.toFixed(2));
  };

  const startGame = async () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    if (isDemo) {
      const mines = Array(25).fill(false);
      let placed = 0;
      while (placed < mineCount) {
        const idx = Math.floor(Math.random() * 25);
        if (!mines[idx]) {
          mines[idx] = true;
          placed++;
        }
      }
      setPlayableBalance(playableBalance - amt);
      setMinesList(mines);
      setGrid(Array(25).fill(null).map((_, i) => ({ revealed: false, isMine: mines[i] })));
      setRevealedCount(0);
      setMultiplier(1.00);
      setGameActive(true);
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/games/mines/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bet_amount: amt, mine_count: mineCount })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
        setMinesList(data.mines);
        setGrid(Array(25).fill(null).map((_, i) => ({ revealed: false, isMine: data.mines[i] })));
        setRevealedCount(0);
        setMultiplier(1.00);
        setGameActive(true);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectTile = async (index) => {
    if (!gameActive || grid[index].revealed) return;

    const newGrid = [...grid];
    const tile = { ...newGrid[index] };
    tile.revealed = true;
    newGrid[index] = tile;

    if (tile.isMine) {
      setGrid(newGrid.map(t => ({ ...t, revealed: true })));
      setGameActive(false);
      
      if (!isDemo) {
        await fetch('http://localhost:3001/api/games/record-bet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            game: 'mines',
            bet_amount: parseFloat(betAmount),
            payout_multiplier: 0.00,
            payout_amount: 0.00,
            is_won: false,
            raw_selection: { mineCount, revealed: revealedCount + 1 }
          })
        });
      }

      alert('BOOM! Hit a mine. Round lost.');
    } else {
      const newRevealed = revealedCount + 1;
      setRevealedCount(newRevealed);
      const newMult = getMultiplier(mineCount, newRevealed);
      setMultiplier(newMult);
      setGrid(newGrid);
    }
  };

  const cashOut = async () => {
    if (!gameActive || revealedCount === 0) return;

    const payout = parseFloat((parseFloat(betAmount) * multiplier).toFixed(2));
    setGameActive(false);
    setGrid(grid.map(t => ({ ...t, revealed: true })));

    if (isDemo) {
      setPlayableBalance(playableBalance + payout);
      alert(`Successfully Cashed Out! Won ₹${payout.toFixed(2)} (${multiplier}x)`);
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
          game: 'mines',
          bet_amount: parseFloat(betAmount),
          payout_multiplier: multiplier,
          payout_amount: payout,
          is_won: true,
          raw_selection: { mineCount, revealed: revealedCount }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
        alert(`Successfully Cashed Out! Won ₹${payout.toFixed(2)} (${multiplier}x)`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '850px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Game Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--action-highlight)" />
          <span style={{ fontWeight: 900, color: '#fff', fontSize: '18px', letterSpacing: '0.5px' }}>SPRIBE MINES</span>
          <span style={{ fontSize: '9px', background: 'rgba(52,199,89,0.1)', color: '#34c759', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>TURBO GAME</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        
        {/* Left controller sidebar */}
        <div 
          className="frosted-card" 
          style={{ 
            margin: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            background: 'linear-gradient(135deg, #181922 0%, #0d0e14 100%)',
            borderColor: 'rgba(255,255,255,0.04)',
            height: 'fit-content'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>MINES COUNT</span>
            <select
              className="form-input mt-8"
              style={{ padding: '10px' }}
              value={mineCount}
              onChange={(e) => setMineCount(parseInt(e.target.value))}
              disabled={gameActive}
            >
              {Array(24).fill(null).map((_, i) => (
                <option key={i+1} value={i+1}>{i+1} Mines</option>
              ))}
            </select>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>STAKE (₹)</span>
            <input
              type="number"
              className="form-input mt-8"
              style={{ padding: '10px' }}
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
                  ₹{(parseFloat(betAmount) * multiplier).toFixed(2)} ({multiplier}x)
                </div>
              </div>
              <button 
                onClick={cashOut}
                className="action-btn"
                style={{ background: 'var(--success-layer)', color: '#000', fontWeight: 900 }}
              >
                Cash Out
              </button>
            </div>
          ) : (
            <button 
              className="action-btn" 
              style={{ background: '#34c759', color: '#000', fontWeight: 900 }} 
              onClick={startGame}
            >
              Start Game
            </button>
          )}
        </div>

        {/* Game grid board */}
        <div 
          className="frosted-card" 
          style={{ 
            margin: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            background: 'linear-gradient(135deg, #13141b 0%, #08090d 100%)',
            borderColor: 'rgba(255,255,255,0.03)',
            minHeight: '400px'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px',
              width: '100%',
              maxWidth: '380px'
            }}
          >
            {grid.map((tile, index) => {
              let bg = 'linear-gradient(135deg, #202231 0%, #0d0f16 100%)';
              let border = '1px solid rgba(255, 255, 255, 0.05)';
              let shadow = 'none';

              if (tile.revealed) {
                if (tile.isMine) {
                  bg = 'rgba(255, 59, 48, 0.15)';
                  border = '1px solid #FF3B30';
                  shadow = '0 0 15px rgba(255,59,48,0.2)';
                } else {
                  bg = 'rgba(0, 229, 255, 0.1)';
                  border = '1px solid var(--action-highlight)';
                  shadow = '0 0 15px rgba(0,229,255,0.15)';
                }
              }

              return (
                <div
                  key={index}
                  onClick={() => selectTile(index)}
                  style={{
                    aspectRatio: '1',
                    background: bg,
                    border,
                    borderRadius: '12px',
                    boxShadow: shadow,
                    cursor: gameActive && !tile.revealed ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  className={gameActive && !tile.revealed ? 'card-plump-hover' : ''}
                >
                  {tile.revealed && (
                    tile.isMine ? (
                      <Bomb size={28} color="#FF3B30" className="float-anim" />
                    ) : (
                      <Sparkles size={28} color="var(--action-highlight)" className="float-anim" />
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
