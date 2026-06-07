'use client';
import React, { useState, useCallback } from 'react';

// Spribe Chicken Road — pick safe tiles row by row, avoid bones, cash out anytime

const COLS = 5;
const ROWS = 9;
const BONES_OPTIONS = [1, 2, 3, 4];

const ROW_EMOJIS_SAFE = ['🐔', '🐣', '🥚', '🌽', '🌾'];
const BONE_EMOJI = '🦴';
const CHICKEN = '🐓';

function generateBones(rows, cols, boneCount) {
  const board = [];
  for (let r = 0; r < rows; r++) {
    const row = Array(cols).fill(false);
    let placed = 0;
    while (placed < boneCount) {
      const idx = Math.floor(Math.random() * cols);
      if (!row[idx]) {
        row[idx] = true;
        placed++;
      }
    }
    board.push(row);
  }
  return board;
}

function getMultiplier(bonesPerRow, rowsCleared) {
  if (rowsCleared === 0) return 1;
  const safeTiles = COLS - bonesPerRow;
  const prob = Math.pow(safeTiles / COLS, rowsCleared);
  return parseFloat((0.97 / prob).toFixed(2));
}

export default function Chicken({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('50');
  const [boneCount, setBoneCount] = useState(1);
  const [gameActive, setGameActive] = useState(false);
  const [currentRow, setCurrentRow] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [board, setBoard] = useState([]);
  const [revealed, setRevealed] = useState([]); // array of {row, col, safe}
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState(0);
  const [selectedCols, setSelectedCols] = useState([]); // col picked per row

  const startGame = () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10');
    if (amt > playableBalance) return alert('Insufficient balance');

    setPlayableBalance(prev => prev - amt);
    const newBoard = generateBones(ROWS, COLS, boneCount);
    setBoard(newBoard);
    setRevealed([]);
    setSelectedCols([]);
    setCurrentRow(0);
    setMultiplier(1.00);
    setGameOver(false);
    setWon(false);
    setCashoutAmount(0);
    setGameActive(true);
  };

  const pickTile = useCallback((col) => {
    if (!gameActive || gameOver || currentRow >= ROWS) return;

    const isBone = board[currentRow][col];
    const newRevealed = [...revealed, { row: currentRow, col, safe: !isBone }];
    setRevealed(newRevealed);
    setSelectedCols(prev => [...prev, col]);

    if (isBone) {
      // Game over — reveal all bones in current row
      const fullReveal = [...newRevealed];
      board[currentRow].forEach((bone, i) => {
        if (bone && i !== col) {
          fullReveal.push({ row: currentRow, col: i, safe: false });
        }
      });
      // Also reveal safe tiles in current row
      board[currentRow].forEach((bone, i) => {
        if (!bone && i !== col) {
          fullReveal.push({ row: currentRow, col: i, safe: true });
        }
      });
      setRevealed(fullReveal);
      setGameOver(true);
      setGameActive(false);
      setWon(false);
    } else {
      // Safe — move to next row
      const nextRow = currentRow + 1;
      const newMult = getMultiplier(boneCount, nextRow);
      setMultiplier(newMult);
      setCurrentRow(nextRow);

      // Auto-win if cleared all rows
      if (nextRow >= ROWS) {
        const amt = parseFloat(betAmount);
        const winAmt = parseFloat((amt * newMult).toFixed(2));
        setPlayableBalance(prev => prev + winAmt);
        setCashoutAmount(winAmt);
        setGameOver(true);
        setGameActive(false);
        setWon(true);
      }
    }
  }, [gameActive, gameOver, currentRow, board, revealed, boneCount, betAmount, setPlayableBalance]);

  const cashOut = () => {
    if (!gameActive || currentRow === 0) return;
    const amt = parseFloat(betAmount);
    const winAmt = parseFloat((amt * multiplier).toFixed(2));
    setPlayableBalance(prev => prev + winAmt);
    setCashoutAmount(winAmt);
    setGameOver(true);
    setGameActive(false);
    setWon(true);

    // Reveal rest of the board
    const fullReveal = [...revealed];
    for (let r = currentRow; r < ROWS; r++) {
      board[r].forEach((bone, c) => {
        fullReveal.push({ row: r, col: c, safe: !bone });
      });
    }
    setRevealed(fullReveal);
  };

  const isRevealed = (r, c) => revealed.find(rv => rv.row === r && rv.col === c);
  const isCurrentRow = (r) => r === currentRow && gameActive && !gameOver;

  // Multiplier preview for each row
  const getRowMultPreview = (rowIdx) => getMultiplier(boneCount, rowIdx + 1);

  // Styles
  const st = {
    container: {
      display: 'flex', gap: '20px', padding: '24px', minHeight: '100%',
      background: 'var(--bg-body)', fontFamily: 'var(--font-primary)'
    },
    leftPanel: {
      width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px'
    },
    card: {
      background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)', padding: '16px'
    },
    label: { fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: {
      width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: '#fff',
      fontSize: '14px', fontFamily: 'var(--font-mono)', outline: 'none'
    },
    btn: {
      width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
      border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
      fontFamily: 'var(--font-primary)', transition: 'all 0.15s ease'
    },
    gameArea: {
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '8px'
    }
  };

  return (
    <div style={st.container}>
      {/* LEFT PANEL — Controls */}
      <div style={st.leftPanel}>
        <div style={st.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🐓</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Chicken</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Spribe</div>
            </div>
          </div>

          {/* Bet Amount */}
          <div style={{ marginBottom: '14px' }}>
            <div style={st.label}>Bet Amount</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="number"
                value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                disabled={gameActive}
                style={{ ...st.input, flex: 1 }}
              />
              <button
                disabled={gameActive}
                onClick={() => setBetAmount(prev => (parseFloat(prev) * 2).toString())}
                style={{ ...st.btn, width: 'auto', padding: '8px 12px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '12px' }}
              >2x</button>
              <button
                disabled={gameActive}
                onClick={() => setBetAmount(prev => Math.max(10, parseFloat(prev) / 2).toString())}
                style={{ ...st.btn, width: 'auto', padding: '8px 12px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '12px' }}
              >½</button>
            </div>
          </div>

          {/* Bones per Row */}
          <div style={{ marginBottom: '16px' }}>
            <div style={st.label}>Bones per Row</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {BONES_OPTIONS.map(n => (
                <button
                  key={n}
                  disabled={gameActive}
                  onClick={() => setBoneCount(n)}
                  style={{
                    ...st.btn,
                    padding: '8px',
                    background: boneCount === n ? 'rgba(46,230,90,0.12)' : 'var(--bg-elevated)',
                    color: boneCount === n ? 'var(--accent-green)' : 'var(--text-secondary)',
                    border: boneCount === n ? '1px solid rgba(46,230,90,0.3)' : '1px solid var(--border-color)',
                    fontSize: '13px'
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Start / Cashout */}
          {!gameActive ? (
            <button
              onClick={startGame}
              style={{ ...st.btn, background: 'var(--accent-green)', color: '#000' }}
            >
              {gameOver ? 'Play Again' : 'Start Game'}
            </button>
          ) : (
            <button
              onClick={cashOut}
              disabled={currentRow === 0}
              style={{
                ...st.btn,
                background: currentRow === 0 ? 'var(--bg-elevated)' : 'var(--accent-orange)',
                color: currentRow === 0 ? 'var(--text-muted)' : '#000',
                cursor: currentRow === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Cash Out — ₹{(parseFloat(betAmount) * multiplier).toFixed(2)}
            </button>
          )}
        </div>

        {/* Game Info */}
        <div style={st.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Multiplier</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: multiplier > 1 ? 'var(--accent-green)' : '#fff', fontFamily: 'var(--font-mono)' }}>
              {multiplier.toFixed(2)}x
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rows Cleared</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
              {currentRow} / {ROWS}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Potential Win</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)' }}>
              ₹{(parseFloat(betAmount || 0) * multiplier).toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Safe Tiles / Row</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              {COLS - boneCount} / {COLS}
            </span>
          </div>
        </div>

        {/* Result */}
        {gameOver && (
          <div style={{
            ...st.card,
            background: won ? 'rgba(46,230,90,0.06)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${won ? 'rgba(46,230,90,0.2)' : 'rgba(239,68,68,0.2)'}`
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{won ? '🎉' : '💀'}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: won ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: '4px' }}>
                {won ? 'You Won!' : 'Bone Hit!'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {won ? `₹${cashoutAmount.toFixed(2)}` : `-₹${parseFloat(betAmount).toFixed(2)}`}
              </div>
            </div>
          </div>
        )}

        {/* Balance */}
        <div style={{ ...st.card, padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Balance</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              ₹{playableBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT — Game Board */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px',
          width: '100%',
          maxWidth: '480px'
        }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {!gameActive && !gameOver
                ? 'Place your bet and start the game'
                : gameActive
                  ? `Pick a safe tile in row ${currentRow + 1}`
                  : won ? 'Chicken made it safely!' : 'The chicken found a bone!'
              }
            </div>
          </div>

          {/* Grid — rendered bottom to top */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Array.from({ length: ROWS }, (_, ri) => ROWS - 1 - ri).map(rowIdx => {
              const rowComplete = rowIdx < currentRow;
              const isActive = isCurrentRow(rowIdx);
              const rowReveals = revealed.filter(rv => rv.row === rowIdx);

              return (
                <div key={rowIdx} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {/* Row multiplier label */}
                  <div style={{
                    width: '48px', textAlign: 'right', paddingRight: '8px',
                    fontSize: '11px', fontWeight: 600,
                    color: rowComplete ? 'var(--accent-green)' : isActive ? '#fff' : 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {getRowMultPreview(rowIdx).toFixed(2)}x
                  </div>

                  {/* Tiles */}
                  {Array.from({ length: COLS }, (_, colIdx) => {
                    const rev = rowReveals.find(rv => rv.col === colIdx);
                    const isTileRevealed = !!rev;
                    const wasPicked = selectedCols[rowIdx] === colIdx;

                    let tileBg = 'var(--bg-elevated)';
                    let tileContent = '';
                    let tileBorder = '1px solid var(--border-color)';
                    let tileCursor = 'default';
                    let tileScale = 'scale(1)';

                    if (isTileRevealed) {
                      if (rev.safe) {
                        tileBg = wasPicked ? 'rgba(46,230,90,0.15)' : 'rgba(46,230,90,0.05)';
                        tileBorder = wasPicked ? '1px solid rgba(46,230,90,0.4)' : '1px solid rgba(46,230,90,0.1)';
                        tileContent = wasPicked ? CHICKEN : ROW_EMOJIS_SAFE[colIdx % ROW_EMOJIS_SAFE.length];
                      } else {
                        tileBg = wasPicked ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.06)';
                        tileBorder = wasPicked ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(239,68,68,0.15)';
                        tileContent = BONE_EMOJI;
                      }
                    } else if (isActive) {
                      tileBg = 'rgba(255,255,255,0.04)';
                      tileBorder = '1px solid rgba(255,255,255,0.1)';
                      tileCursor = 'pointer';
                      tileContent = '?';
                    } else if (rowComplete) {
                      // Already passed rows that weren't fully revealed
                      tileBg = 'rgba(46,230,90,0.03)';
                      tileBorder = '1px solid rgba(46,230,90,0.06)';
                    }

                    return (
                      <div
                        key={colIdx}
                        onClick={() => isActive && pickTile(colIdx)}
                        onMouseEnter={e => {
                          if (isActive) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.borderColor = 'rgba(46,230,90,0.3)';
                            e.currentTarget.style.background = 'rgba(46,230,90,0.08)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (isActive) {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          }
                        }}
                        style={{
                          flex: 1,
                          height: '48px',
                          borderRadius: 'var(--radius-sm)',
                          background: tileBg,
                          border: tileBorder,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: tileCursor,
                          transition: 'all 0.15s ease',
                          transform: tileScale,
                          fontSize: isTileRevealed ? '20px' : '14px',
                          fontWeight: 700,
                          color: isActive ? 'var(--text-muted)' : 'var(--text-dim)',
                          userSelect: 'none'
                        }}
                      >
                        {tileContent}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Road / Chicken visual at bottom */}
          <div style={{
            marginTop: '12px',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(46,230,90,0.04)',
            border: '1px solid rgba(46,230,90,0.08)',
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            🛤️ Cross {ROWS} rows to win max {getRowMultPreview(ROWS - 1).toFixed(2)}x — {boneCount} bone{boneCount > 1 ? 's' : ''} hidden per row
          </div>
        </div>

        {/* Payout Table */}
        <div style={{
          marginTop: '16px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '14px 20px',
          width: '100%',
          maxWidth: '480px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Multiplier Table ({boneCount} bone{boneCount > 1 ? 's' : ''} per row)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Array.from({ length: ROWS }, (_, i) => (
              <div key={i} style={{
                padding: '4px 10px',
                borderRadius: '4px',
                background: i < currentRow ? 'rgba(46,230,90,0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${i < currentRow ? 'rgba(46,230,90,0.2)' : 'var(--border-color)'}`,
                fontSize: '11px',
                fontWeight: 600,
                color: i < currentRow ? 'var(--accent-green)' : 'var(--text-dim)',
                fontFamily: 'var(--font-mono)'
              }}>
                R{i + 1}: {getRowMultPreview(i).toFixed(2)}x
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
