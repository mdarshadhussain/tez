'use client';
import React, { useState, useEffect } from 'react';
import { CircleDot, Award, ShieldCheck, HelpCircle } from 'lucide-react';

export default function WinGo({ socket, user, playableBalance, setPlayableBalance, isDemo }) {
  const [timer, setTimer] = useState(60);
  const [history, setHistory] = useState([]);
  const [betAmount, setBetAmount] = useState('10');
  const [activeTab, setActiveTab] = useState('color'); // color or bigsmall
  const [selectedBet, setSelectedBet] = useState(null); // red, green, violet, 0-9, big, small

  // Stale closure escape hatch for websocket event listeners
  const demoBetRef = React.useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('game_timers', (timers) => {
      setTimer(timers.wingo);
    });

    socket.on('init_data', (data) => {
      if (data && data.wingo) {
        setHistory(data.wingo);
      }
    });

    socket.on('wingo_resolution', (data) => {
      setHistory(data.history);
      setSelectedBet(null);

      // Evaluate demo bet locally
      if (isDemo && demoBetRef.current) {
        const outcome = data.lastOutcome; // { num, color }
        const { selection, amount } = demoBetRef.current;
        const numVal = outcome.num;

        let won = false;
        let payoutMult = 0;

        if (selection === 'red') {
          won = (numVal % 2 === 0);
          payoutMult = 2;
        } else if (selection === 'green') {
          won = (numVal % 2 === 1);
          payoutMult = 2;
        } else if (selection === 'violet') {
          won = (numVal === 0 || numVal === 5);
          payoutMult = 4.5;
        } else if (selection === 'big') {
          won = (numVal >= 5);
          payoutMult = 1.96;
        } else if (selection === 'small') {
          won = (numVal <= 4);
          payoutMult = 1.96;
        } else {
          won = (selection === String(numVal));
          payoutMult = 9;
        }

        if (won) {
          const payout = parseFloat((amount * payoutMult).toFixed(2));
          alert(`Congratulations! You won ₹${payout.toFixed(2)} in WinGo (Demo)!`);
          setPlayableBalance(prev => prev + payout);
        } else {
          alert(`Round settled. Better luck next time in WinGo (Demo)! Landed on ${numVal}.`);
        }
        demoBetRef.current = null;
      }
    });

    socket.on('bet_placed_success', (data) => {
      if (data.game === 'wingo' && !isDemo) {
        setPlayableBalance(data.balance);
      }
    });

    socket.on('bet_result', (data) => {
      if (data.game === 'wingo' && !isDemo) {
        if (data.won) {
          alert(`Congratulations! You won ₹${data.payout.toFixed(2)} in WinGo!`);
          setPlayableBalance(data.balance);
        } else {
          alert('Round settled. Better luck next time!');
        }
      }
    });

    return () => {
      socket.off('game_timers');
      socket.off('wingo_resolution');
      socket.off('bet_placed_success');
      socket.off('bet_result');
    };
  }, [socket, setPlayableBalance, isDemo]);

  const placeBet = () => {
    if (!selectedBet) return alert('Select your bet first');
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    if (timer <= 5) {
      return alert('Betting closed for this round (5s lock)');
    }

    if (isDemo) {
      setPlayableBalance(playableBalance - amt);
      demoBetRef.current = { selection: selectedBet, amount: amt };
      alert(`Demo Bet of ₹${amt} placed on ${selectedBet}!`);
      return;
    }

    socket.emit('place_bet', {
      userId: user.id,
      game: 'wingo',
      selection: selectedBet,
      amount: amt
    });
  };

  const getTimerColor = () => {
    if (timer <= 5) return 'var(--action-highlight)';
    if (timer <= 15) return '#FFCC00';
    return 'var(--success-layer)';
  };

  return (
    <div
      style={{
        padding: '16px',
        paddingBottom: '80px',
        animation: timer <= 5 ? 'warning-pulse 1s infinite' : 'none'
      }}
    >
      {/* Game Head */}
      <div className="frosted-card row" style={{ borderColor: timer <= 5 ? 'var(--action-highlight)' : 'var(--border-glass)' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 600 }}>WinGo Color & Range</span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>Active Round</h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 600 }}>COUNTDOWN</div>
          <div
            className="monospace-ledger"
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: getTimerColor(),
              transition: 'color 0.2s ease'
            }}
          >
            00:{timer < 10 ? `0${timer}` : timer}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => { setActiveTab('color'); setSelectedBet(null); }}
          className="action-btn"
          style={{
            flex: 1,
            background: activeTab === 'color' ? 'var(--action-highlight)' : 'rgba(255,255,255,0.02)',
            border: activeTab === 'color' ? 'none' : '1px solid var(--border-glass)',
            padding: '10px'
          }}
        >
          Color / Numbers
        </button>
        <button
          onClick={() => { setActiveTab('bigsmall'); setSelectedBet(null); }}
          className="action-btn"
          style={{
            flex: 1,
            background: activeTab === 'bigsmall' ? 'var(--action-highlight)' : 'rgba(255,255,255,0.02)',
            border: activeTab === 'bigsmall' ? 'none' : '1px solid var(--border-glass)',
            padding: '10px'
          }}
        >
          Big / Small Range
        </button>
      </div>

      {/* Betting Selection Panel (Ergonomics bottom 40%) */}
      <div className="frosted-card">
        {activeTab === 'color' ? (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {['green', 'violet', 'red'].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedBet(c)}
                  style={{
                    flex: 1,
                    background: c === 'green' ? '#34C759' : c === 'violet' ? '#AF52DE' : '#FF3B30',
                    border: selectedBet === c ? '3px solid #fff' : 'none',
                    borderRadius: '12px',
                    height: '45px',
                    color: '#fff',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {c} {c === 'violet' ? '4.5x' : '2x'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => setSelectedBet(String(n))}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: selectedBet === String(n) ? '2px solid var(--success-layer)' : '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '8px 0',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {n} (9x)
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setSelectedBet('small')}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.02)',
                border: selectedBet === 'small' ? '2px solid var(--success-layer)' : '1px solid var(--border-glass)',
                borderRadius: '12px',
                height: '60px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Small (0 - 4) <br />
              <span style={{ color: 'var(--success-layer)', fontSize: '12px' }}>1.96x payout</span>
            </button>

            <button
              onClick={() => setSelectedBet('big')}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.02)',
                border: selectedBet === 'big' ? '2px solid var(--success-layer)' : '1px solid var(--border-glass)',
                borderRadius: '12px',
                height: '60px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Big (5 - 9) <br />
              <span style={{ color: 'var(--success-layer)', fontSize: '12px' }}>1.96x payout</span>
            </button>
          </div>
        )}

        <div className="row mt-12" style={{ gap: '10px' }}>
          <input
            type="number"
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Bet Stake (₹)"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
          />
          <button className="action-btn" onClick={placeBet} style={{ width: 'auto', flex: 1.5 }}>
            Place Bet (₹{betAmount})
          </button>
        </div>
      </div>

      {/* History Matrix */}
      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
        HISTORICAL TRENDS
      </h3>

      <div className="frosted-card" style={{ padding: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {history.map((h, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: '6px',
                padding: '4px',
                minWidth: '35px'
              }}
            >
              <span style={{ fontSize: '8px', color: '#888' }}>{h.round}</span>
              <span
                className="trend-dot"
                style={{
                  background: h.color === 'red' ? '#FF3B30' : h.color === 'green' ? '#34C759' : '#AF52DE',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '9px',
                  width: '16px',
                  height: '16px'
                }}
              >
                {h.num}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
