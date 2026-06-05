import React, { useState } from 'react';
import { Sparkles, Bomb, Coins } from 'lucide-react';

export default function Mines({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [mineCount, setMineCount] = useState(3);
  const [betAmount, setBetAmount] = useState('50');
  const [gameActive, setGameActive] = useState(false);
  
  const [grid, setGrid] = useState(Array(25).fill({ revealed: false, isMine: false }));
  const [revealedCount, setRevealedCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [minesList, setMinesList] = useState([]); // hidden mines array

  // Math for Mines multiplier
  const getMultiplier = (mines, revealed) => {
    // Standard hyper-geometric distribution multiplier formula
    let waysToWin = 1;
    let totalCombinations = 1;
    for (let i = 0; i < revealed; i++) {
      waysToWin *= (25 - mines - i);
      totalCombinations *= (25 - i);
    }
    const probability = waysToWin / totalCombinations;
    const rawMult = 0.98 / probability; // house edge 2%
    return parseFloat(rawMult.toFixed(2));
  };

  const startGame = async () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    if (isDemo) {
      // Local Demo Mode Setup
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
    const tile = newGrid[index];
    tile.revealed = true;

    if (tile.isMine) {
      // Exploded! Set game inactive
      setGrid(newGrid.map(t => ({ ...t, revealed: true })));
      setGameActive(false);
      
      if (!isDemo) {
        // Record failed bet on server
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
    // Reveal all remaining
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
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Configuration Header */}
      <div className="frosted-card">
        <span style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 600 }}>Mines Config</span>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#8a8a93' }}>MINE COUNT</span>
            <select
              className="form-input mt-12"
              style={{ padding: '8px' }}
              value={mineCount}
              onChange={(e) => setMineCount(parseInt(e.target.value))}
              disabled={gameActive}
            >
              {Array(24).fill(null).map((_, i) => (
                <option key={i+1} value={i+1}>{i+1} Mines</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#8a8a93' }}>STAKE (₹)</span>
            <input
              type="number"
              className="form-input mt-12"
              style={{ padding: '8px' }}
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={gameActive}
            />
          </div>
        </div>

        <div className="mt-12">
          {gameActive ? (
            <div className="row">
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success-layer)' }}>
                Payout: ₹{(parseFloat(betAmount) * multiplier).toFixed(2)} ({multiplier}x)
              </div>
              <button
                className="action-btn"
                style={{ width: 'auto', padding: '10px 20px', background: 'var(--success-layer)', color: '#09090A' }}
                onClick={cashOut}
              >
                Cash Out (₹{(parseFloat(betAmount) * multiplier).toFixed(2)})
              </button>
            </div>
          ) : (
            <button className="action-btn" onClick={startGame}>
              Start Game (₹{betAmount})
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '10px',
          maxWidth: '350px',
          margin: '0 auto 20px'
        }}
      >
        {grid.map((tile, index) => (
          <div
            key={index}
            onClick={() => selectTile(index)}
            style={{
              aspectRatio: '1',
              background: tile.revealed
                ? tile.isMine
                  ? 'rgba(255, 59, 48, 0.15)'
                  : 'rgba(0, 229, 255, 0.1)'
                : 'rgba(255,255,255,0.03)',
              border: tile.revealed
                ? tile.isMine
                  ? '1px solid #FF3B30'
                  : '1px solid var(--success-layer)'
                : '1px solid var(--border-glass)',
              borderRadius: '8px',
              cursor: gameActive && !tile.revealed ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}
          >
            {tile.revealed && (
              tile.isMine ? (
                <Bomb size={24} color="#FF3B30" />
              ) : (
                <Sparkles size={24} color="var(--success-layer)" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
