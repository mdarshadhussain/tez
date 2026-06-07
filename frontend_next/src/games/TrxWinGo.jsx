'use client';
import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, Copy } from 'lucide-react';

export default function TrxWinGo({ socket, user, playableBalance, setPlayableBalance, isDemo }) {
  const [timer, setTimer] = useState(60);
  const [history, setHistory] = useState([]);
  const [betAmount, setBetAmount] = useState('10');
  const [selectedBet, setSelectedBet] = useState(null);

  const demoBetRef = React.useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('game_timers', (timers) => {
      setTimer(timers.trx);
    });

    socket.on('init_data', (data) => {
      if (data && data.trx) {
        setHistory(data.trx);
      }
    });

    socket.on('trx_resolution', (data) => {
      setHistory(data.history);
      setSelectedBet(null);

      // Evaluate demo bet locally
      if (isDemo && demoBetRef.current) {
        const outcome = data.lastOutcome; // { num, hash }
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
        } else {
          won = (selection === String(numVal));
          payoutMult = 9;
        }

        if (won) {
          const payout = parseFloat((amount * payoutMult).toFixed(2));
          alert(`Congratulations! You won ₹${payout.toFixed(2)} in TRX WinGo (Demo)!`);
          setPlayableBalance(prev => prev + payout);
        } else {
          alert(`TRX round settled. Better luck next time in TRX WinGo (Demo)! Landed on ${numVal}.`);
        }
        demoBetRef.current = null;
      }
    });

    socket.on('bet_placed_success', (data) => {
      if (data.game === 'trx_wingo' && !isDemo) {
        setPlayableBalance(data.balance);
      }
    });

    socket.on('bet_result', (data) => {
      if (data.game === 'trx_wingo' && !isDemo) {
        if (data.won) {
          alert(`Congratulations! You won ₹${data.payout.toFixed(2)} in TRX WinGo!`);
          setPlayableBalance(data.balance);
        } else {
          alert('TRX Round settled.');
        }
      }
    });

    return () => {
      socket.off('game_timers');
      socket.off('trx_resolution');
      socket.off('bet_placed_success');
      socket.off('bet_result');
    };
  }, [socket, setPlayableBalance, isDemo]);

  const placeBet = () => {
    if (!selectedBet) return alert('Select color or number first');
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    if (timer <= 5) return alert('Betting closed for this round');

    if (isDemo) {
      setPlayableBalance(playableBalance - amt);
      demoBetRef.current = { selection: selectedBet, amount: amt };
      alert(`Demo Bet of ₹${amt} placed on ${selectedBet}!`);
      return;
    }

    socket.emit('place_bet', {
      userId: user.id,
      game: 'trx_wingo',
      selection: selectedBet,
      amount: amt
    });
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Head */}
      <div className="frosted-card row">
        <div>
          <span style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={12} color="var(--vip-status)" /> TRX blockchain verifiable
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>TRX WinGo</h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 600 }}>COUNTDOWN</div>
          <div className="monospace-ledger" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success-layer)' }}>
            00:{timer < 10 ? `0${timer}` : timer}
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="frosted-card">
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
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {c}
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
              {n}
            </button>
          ))}
        </div>

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
            Place TRX Bet
          </button>
        </div>
      </div>

      {/* History */}
      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
        VERIFIABLE BLOCKS HISTORY
      </h3>

      <div className="frosted-card" style={{ padding: '0 12px' }}>
        {history.map((h, i) => (
          <div
            key={i}
            className="row"
            style={{
              padding: '12px 0',
              borderBottom: i === history.length - 1 ? 'none' : '1px solid var(--border-glass)'
            }}
          >
            <div>
              <span className="monospace-ledger" style={{ fontSize: '12px', color: '#fff', fontWeight: 700 }}>
                Block {h.round}
              </span>
              <div style={{ fontSize: '10px', color: '#8A8A93', marginTop: '2px' }}>
                TRON hash: {h.hash}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="trend-dot"
                style={{
                  background: h.color === 'red' ? '#FF3B30' : h.color === 'green' ? '#34C759' : '#AF52DE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '11px',
                  width: '20px',
                  height: '20px'
                }}
              >
                {h.num}
              </span>
              <Copy size={12} color="#8a8a93" style={{ cursor: 'pointer' }} onClick={() => {
                navigator.clipboard.writeText(h.hash);
                alert('Copied block hash verification string!');
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
